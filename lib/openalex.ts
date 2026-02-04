/**
 * OpenAlex API Client for Econvery
 * ═══════════════════════════════════════════════════════════════════════════
 * Fetches academic papers from top economics and political science journals.
 */

import type { OpenAlexResponse, OpenAlexWork, Paper } from "./types";
import { ALL_JOURNALS } from "./journals";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const OPENALEX_CONFIG = {
  BASE_URL: "https://api.openalex.org/works",
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  RATE_LIMIT_DELAY: 100,
  POLITE_EMAIL: "econvery@research.app",
  SELECT_FIELDS: [
    "id",
    "doi",
    "title",
    "authorships",
    "publication_date",
    "primary_location",
    "abstract_inverted_index",
    "concepts",
    "cited_by_count",
    "open_access",
    "type",
  ].join(","),
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reconstructs abstract text from OpenAlex's inverted index format.
 * OpenAlex stores abstracts as { "word": [position1, position2], ... }
 */
export function reconstructAbstract(
  abstractInvertedIndex: Record<string, number[]> | null | undefined
): string {
  if (!abstractInvertedIndex) return "";

  try {
    const wordPositions: [number, string][] = [];
    for (const [word, positions] of Object.entries(abstractInvertedIndex)) {
      for (const pos of positions) {
        wordPositions.push([pos, word]);
      }
    }
    wordPositions.sort((a, b) => a[0] - b[0]);
    return wordPositions.map(([, word]) => word).join(" ");
  } catch (e) {
    console.warn("Failed to reconstruct abstract:", e);
    return "";
  }
}

/**
 * Delays execution for the specified milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Makes a request with exponential backoff retry logic.
 */
async function makeRequestWithRetry(
  url: string,
  params: Record<string, string>,
  maxRetries: number = OPENALEX_CONFIG.MAX_RETRIES
): Promise<OpenAlexResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const searchParams = new URLSearchParams(params);
      const fullUrl = `${url}?${searchParams.toString()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        OPENALEX_CONFIG.TIMEOUT
      );

      const response = await fetch(fullUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": `Econvery/1.0 (mailto:${OPENALEX_CONFIG.POLITE_EMAIL})`,
        },
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        // Rate limited - wait and retry
        await delay(OPENALEX_CONFIG.RETRY_DELAY * Math.pow(2, attempt));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as OpenAlexResponse;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));

      if (e instanceof Error && e.name === "AbortError") {
        lastError = new Error("Request timed out");
      }

      if (attempt < maxRetries - 1) {
        await delay(OPENALEX_CONFIG.RETRY_DELAY * Math.pow(2, attempt));
      }
    }
  }

  throw new Error(
    `Failed after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Process a raw OpenAlex work into our Paper format.
 * Returns null if the paper doesn't meet quality criteria.
 */
export function processPaper(work: OpenAlexWork): Paper | null {
  const title = work.title;
  if (!title) return null;

  const abstract = reconstructAbstract(work.abstract_inverted_index);

  // Skip papers with no or very short abstracts
  if (!abstract || abstract.length < 80) return null;

  // Extract authors (max 10)
  const authors: string[] = [];
  for (const authorship of (work.authorships || []).slice(0, 10)) {
    const name = authorship.author?.display_name;
    if (name) authors.push(name);
  }

  // Extract institutions (unique, max 3)
  const institutions: string[] = [];
  for (const authorship of (work.authorships || []).slice(0, 5)) {
    for (const inst of (authorship.institutions || []).slice(0, 1)) {
      const instName = inst.display_name;
      if (instName && !institutions.includes(instName)) {
        institutions.push(instName);
      }
    }
  }

  // Journal info
  const primaryLocation = work.primary_location || {};
  const source = primaryLocation.source || {};
  const journalName = source.display_name || "Unknown Journal";

  // Extract concepts (score > 0.2, max 8)
  const concepts = (work.concepts || [])
    .filter((c) => (c.score || 0) > 0.2)
    .slice(0, 8)
    .map((c) => ({
      name: c.display_name || "",
      score: Math.round((c.score || 0) * 100) / 100,
    }));

  // Open access info
  const oa = work.open_access || {};
  const isOpenAccess = oa.is_oa || false;
  const oaUrl = oa.oa_url || undefined;

  // DOI handling
  const doi = work.doi;
  const doiUrl = doi
    ? `https://doi.org/${doi.replace("https://doi.org/", "")}`
    : undefined;

  // Journal info
  const journal = ALL_JOURNALS[journalName];
  const journalTier = journal?.tier || 4;
  const journalField = journal?.field;

  return {
    id: (work.id || "").replace("https://openalex.org/", ""),
    doi: doi || undefined,
    doi_url: doiUrl,
    title,
    authors,
    institutions: institutions.slice(0, 3),
    abstract,
    journal: journalName,
    journal_tier: journalTier,
    journal_field: journalField,
    publication_date: work.publication_date || "",
    concepts,
    cited_by_count: work.cited_by_count || 0,
    is_open_access: isOpenAccess,
    oa_url: oaUrl,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface FetchPapersOptions {
  daysBack?: number;
  selectedJournals?: string[];
  perPage?: number;
  maxResults?: number;
}

/**
 * Fetch recent papers from OpenAlex.
 * 
 * @param options Configuration options
 * @returns Array of processed papers
 */
export async function fetchRecentPapers(
  options: FetchPapersOptions = {}
): Promise<Paper[]> {
  const {
    daysBack = 30,
    selectedJournals,
    perPage = 50,
    maxResults = 100,
  } = options;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const fromDate = startDate.toISOString().split("T")[0];
  const toDate = endDate.toISOString().split("T")[0];

  // Get ISSNs and OpenAlex source IDs for selected journals
  let issns: string[] = [];
  let sourceIds: string[] = [];
  
  const journalsToQuery = selectedJournals && selectedJournals.length > 0
    ? selectedJournals.filter((j) => ALL_JOURNALS[j])
    : Object.keys(ALL_JOURNALS);
    
  for (const journalName of journalsToQuery) {
    const journal = ALL_JOURNALS[journalName];
    if (journal?.issn) {
      issns.push(journal.issn);
    }
    if (journal?.openAlexId) {
      sourceIds.push(journal.openAlexId);
    }
  }

  if (!issns.length && !sourceIds.length) return [];

  // Build filter - combine ISSN filter and source ID filter with OR
  const filterParts: string[] = [];
  filterParts.push(`from_publication_date:${fromDate}`);
  filterParts.push(`to_publication_date:${toDate}`);
  
  // For sources, we need to use a combined filter
  // OpenAlex allows: primary_location.source.issn:X|Y|Z OR primary_location.source.id:A|B|C
  const sourceFilters: string[] = [];
  if (issns.length > 0) {
    sourceFilters.push(`primary_location.source.issn:${issns.join("|")}`);
  }
  if (sourceIds.length > 0) {
    sourceFilters.push(`primary_location.source.id:${sourceIds.join("|")}`);
  }
  
  const papers: Paper[] = [];
  
  // If we have both ISSNs and source IDs, we need to make separate queries
  // because OpenAlex doesn't support OR across different filter fields easily
  for (const sourceFilter of sourceFilters) {
    let cursor = "*";
    
    while (papers.length < maxResults) {
      const params: Record<string, string> = {
        filter: `${sourceFilter},from_publication_date:${fromDate},to_publication_date:${toDate}`,
        per_page: String(Math.min(perPage, maxResults - papers.length)),
        cursor,
        select: OPENALEX_CONFIG.SELECT_FIELDS,
        mailto: OPENALEX_CONFIG.POLITE_EMAIL,
      };

      const data = await makeRequestWithRetry(OPENALEX_CONFIG.BASE_URL, params);
      const results = data.results || [];

      if (!results.length) break;

      for (const work of results) {
        const processed = processPaper(work);
        if (processed) {
          papers.push(processed);
          if (papers.length >= maxResults) break;
        }
      }

      // Get next cursor for pagination
      cursor = data.meta?.next_cursor || "";
      if (!cursor) break;

      // Polite rate limiting
      await delay(OPENALEX_CONFIG.RATE_LIMIT_DELAY);
    }
    
    if (papers.length >= maxResults) break;
  }

  return papers;
}
