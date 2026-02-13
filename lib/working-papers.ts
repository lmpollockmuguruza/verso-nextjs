/**
 * Working Papers Fetcher for Econvery
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * NBER and CEPR papers require special handling because:
 * 1. They're institutions/repositories, not traditional journals
 * 2. OpenAlex may index them differently than regular journals
 * 3. Direct RSS/API access provides more reliable results
 * 
 * This module provides multiple strategies for fetching working papers:
 * - NBER RSS feed (most reliable for recent papers)
 * - OpenAlex institution-based search
 * - OpenAlex source search with dynamic ID lookup
 */

import type { Paper } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // NBER RSS Feed - weekly new papers
  NBER_RSS_URL: "https://www.nber.org/rss/new.xml",
  
  // OpenAlex endpoints
  OPENALEX_WORKS_URL: "https://api.openalex.org/works",
  OPENALEX_SOURCES_URL: "https://api.openalex.org/sources",
  OPENALEX_EMAIL: "econvery@research.app",
  
  // Known OpenAlex Institution IDs (fallback if source lookup fails)
  // These are institution IDs, not source IDs
  NBER_INSTITUTION_ID: "I1286949407", // National Bureau of Economic Research
  CEPR_INSTITUTION_ID: "I205783295",  // Centre for Economic Policy Research (approximate)
  
  // CEPR ISSNs for direct OpenAlex source lookup
  CEPR_ISSN: "0265-8003",
  CEPR_ISSN_ONLINE: "2045-6573",
  
  // Timeouts and limits
  TIMEOUT: 15000,
  MAX_PAPERS: 50,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface NBERRSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
}

interface OpenAlexSource {
  id: string;
  display_name: string;
  type: string;
  works_count: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// NBER RSS FEED FETCHER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse NBER RSS feed to extract working papers
 * The RSS feed provides: title, link, description (abstract), pubDate, author
 */
function parseNBERRSS(xmlText: string): NBERRSSItem[] {
  const items: NBERRSSItem[] = [];
  
  // Simple XML parsing for RSS items
  const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    
    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] 
      || itemXml.match(/<title>(.*?)<\/title>/)?.[1] 
      || "";
    
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
    
    const description = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]
      || itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1]
      || "";
    
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
    
    // Author might be in dc:creator
    const author = itemXml.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/)?.[1]
      || itemXml.match(/<dc:creator>(.*?)<\/dc:creator>/)?.[1]
      || itemXml.match(/<author>(.*?)<\/author>/)?.[1];
    
    if (title && link) {
      items.push({ title, link, description, pubDate, author });
    }
  }
  
  return items;
}

/**
 * Convert NBER RSS item to Paper format
 */
function rssItemToPaper(item: NBERRSSItem, index: number): Paper {
  // Extract paper ID from URL (e.g., https://www.nber.org/papers/w34567)
  const idMatch = item.link.match(/papers\/(w\d+)/);
  const paperId = idMatch ? idMatch[1] : `nber-rss-${index}`;
  
  // Parse authors from author string (usually "Author1 and Author2")
  const authors = item.author 
    ? item.author.split(/\s+and\s+|\s*,\s*/).map(a => a.trim()).filter(Boolean)
    : [];
  
  // Clean HTML from description
  const abstract = item.description
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
  
  // Parse publication date
  const pubDate = item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : '';
  
  return {
    id: paperId,
    doi: undefined,
    doi_url: undefined,
    title: item.title,
    authors,
    institutions: ["National Bureau of Economic Research"],
    abstract,
    journal: "NBER Working Papers",
    journal_tier: 1,
    journal_field: "working_papers",
    publication_date: pubDate,
    concepts: [], // Would need additional processing
    cited_by_count: 0,
    is_open_access: true, // NBER papers are freely accessible
    oa_url: item.link,
  };
}

/**
 * Fetch papers directly from NBER RSS feed
 */
export async function fetchNBERFromRSS(): Promise<Paper[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
    
    const response = await fetch(CONFIG.NBER_RSS_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`NBER RSS fetch failed: ${response.status}`);
      return [];
    }
    
    const xmlText = await response.text();
    const items = parseNBERRSS(xmlText);
    
    return items.slice(0, CONFIG.MAX_PAPERS).map((item, i) => rssItemToPaper(item, i));
  } catch (error) {
    console.warn("Failed to fetch NBER RSS:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OPENALEX WORKING PAPER FETCHER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find OpenAlex source ID by searching for a source name
 */
async function findOpenAlexSourceId(searchTerm: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      search: searchTerm,
      per_page: "5",
      mailto: CONFIG.OPENALEX_EMAIL,
    });
    
    const response = await fetch(`${CONFIG.OPENALEX_SOURCES_URL}?${params}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const sources = data.results as OpenAlexSource[];
    
    // Find the most relevant match
    for (const source of sources) {
      const name = source.display_name.toLowerCase();
      const term = searchTerm.toLowerCase();
      
      if (name.includes(term) || name.includes("working paper") || name.includes("discussion paper")) {
        // Extract just the ID part (e.g., "S123456" from "https://openalex.org/S123456")
        const idMatch = source.id.match(/S\d+$/);
        if (idMatch) {
          console.log(`Found OpenAlex source for "${searchTerm}": ${source.display_name} (${idMatch[0]})`);
          return idMatch[0];
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to find OpenAlex source ID for ${searchTerm}:`, error);
    return null;
  }
}

/**
 * Fetch working papers from OpenAlex using institution affiliation
 * This is more reliable than source-based search for working paper series
 */
export async function fetchWorkingPapersFromOpenAlex(
  daysBack: number = 30,
  maxResults: number = 50
): Promise<Paper[]> {
  const papers: Paper[] = [];
  
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  const fromDate = startDate.toISOString().split("T")[0];
  const toDate = endDate.toISOString().split("T")[0];
  
  // Build filters that target ACTUAL working paper series (not institution affiliations)
  // Institution-based queries are deliberately excluded because they return ALL papers
  // by affiliated authors (e.g., an NBER economist's paper in JAMA or Cancer)
  const filters: { filter: string; label: string }[] = [];
  
  // NBER via source name search
  const nberSourceId = await findOpenAlexSourceId("NBER");
  if (nberSourceId) {
    filters.push({
      filter: `primary_location.source.id:${nberSourceId}`,
      label: "NBER source"
    });
  }
  
  // NBER via ISSN fallback
  filters.push({
    filter: `primary_location.source.issn:0898-2937`,
    label: "NBER ISSN"
  });
  
  // CEPR via ISSN (both print and online)
  filters.push({
    filter: `primary_location.source.issn:${CONFIG.CEPR_ISSN}|${CONFIG.CEPR_ISSN_ONLINE}`,
    label: "CEPR ISSN"
  });
  
  // CEPR via source name search fallback
  const ceprSourceId = await findOpenAlexSourceId("CEPR Discussion");
  if (ceprSourceId) {
    filters.push({
      filter: `primary_location.source.id:${ceprSourceId}`,
      label: "CEPR source"
    });
  }
  
  for (const { filter, label } of filters) {
    if (papers.length >= maxResults) break;
    
    try {
      const params = new URLSearchParams({
        filter: `${filter},from_publication_date:${fromDate},to_publication_date:${toDate}`,
        per_page: String(Math.min(50, maxResults - papers.length)),
        select: "id,doi,title,authorships,publication_date,primary_location,abstract_inverted_index,concepts,cited_by_count,open_access",
        mailto: CONFIG.OPENALEX_EMAIL,
      });
      
      const response = await fetch(`${CONFIG.OPENALEX_WORKS_URL}?${params}`);
      if (!response.ok) {
        console.warn(`OpenAlex query failed for ${label}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const works = data.results || [];
      
      let addedFromFilter = 0;
      for (const work of works) {
        const paper = processOpenAlexWork(work);
        if (paper && !papers.find(p => p.id === paper.id || p.title.toLowerCase() === paper.title.toLowerCase())) {
          papers.push(paper);
          addedFromFilter++;
        }
      }
      console.log(`Got ${addedFromFilter} papers from ${label} (total so far: ${papers.length})`);
    } catch (error) {
      console.warn(`OpenAlex query failed for ${label}:`, error);
    }
  }
  
  return papers.slice(0, maxResults);
}

/**
 * Process OpenAlex work into Paper format
 */
function processOpenAlexWork(work: any): Paper | null {
  const title = work.title;
  if (!title) return null;
  
  // Reconstruct abstract
  const abstract = reconstructAbstract(work.abstract_inverted_index);
  if (!abstract || abstract.length < 50) return null;
  
  // Extract authors
  const authors: string[] = [];
  for (const authorship of (work.authorships || []).slice(0, 10)) {
    const name = authorship.author?.display_name;
    if (name) authors.push(name);
  }
  
  // Extract institutions
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
  const source = work.primary_location?.source || {};
  const journalName = source.display_name || "Working Paper";
  
  // Determine if this is NBER/CEPR
  const sourceIssns = (work.primary_location?.source?.issn || []).map((i: string) => i.toLowerCase());
  
  const isNBER = journalName.toLowerCase().includes("nber") || 
    journalName.toLowerCase().includes("national bureau") ||
    institutions.some(i => i.toLowerCase().includes("nber") || i.toLowerCase().includes("national bureau"));
  
  const isCEPR = journalName.toLowerCase().includes("cepr") ||
    journalName.toLowerCase().includes("centre for economic policy") ||
    journalName.toLowerCase().includes("discussion paper series") ||
    sourceIssns.includes("0265-8003") ||
    sourceIssns.includes("2045-6573") ||
    institutions.some(i => i.toLowerCase().includes("cepr") || i.toLowerCase().includes("centre for economic policy research"));
  
  // Concepts
  const concepts = (work.concepts || [])
    .filter((c: any) => (c.score || 0) > 0.2)
    .slice(0, 8)
    .map((c: any) => ({
      name: c.display_name || "",
      score: Math.round((c.score || 0) * 100) / 100,
    }));
  
  // Open access
  const oa = work.open_access || {};
  const isOpenAccess = oa.is_oa || false;
  const oaUrl = oa.oa_url || undefined;
  
  // DOI
  const doi = work.doi;
  const doiUrl = doi
    ? `https://doi.org/${doi.replace("https://doi.org/", "")}`
    : undefined;
  
  return {
    id: (work.id || "").replace("https://openalex.org/", ""),
    doi: doi || undefined,
    doi_url: doiUrl,
    title,
    authors,
    institutions: institutions.slice(0, 3),
    abstract,
    journal: isNBER ? "NBER Working Papers" : isCEPR ? "CEPR Discussion Papers" : journalName,
    journal_tier: (isNBER || isCEPR) ? 1 : 3,
    journal_field: "working_papers",
    publication_date: work.publication_date || "",
    concepts,
    cited_by_count: work.cited_by_count || 0,
    is_open_access: isOpenAccess,
    oa_url: oaUrl,
  };
}

/**
 * Reconstruct abstract from OpenAlex inverted index
 */
function reconstructAbstract(
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
  } catch {
    return "";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: COMBINED FETCHER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch working papers using all available strategies
 * Combines NBER RSS feed with OpenAlex search for comprehensive coverage
 */
export async function fetchWorkingPapers(
  daysBack: number = 30,
  maxResults: number = 50
): Promise<Paper[]> {
  const allPapers: Paper[] = [];
  const seenIds = new Set<string>();
  
  // Strategy 1: Try NBER RSS feed first (most reliable for recent papers)
  console.log("Fetching NBER papers from RSS feed...");
  try {
    const rssPapers = await fetchNBERFromRSS();
    for (const paper of rssPapers) {
      if (!seenIds.has(paper.id)) {
        seenIds.add(paper.id);
        allPapers.push(paper);
      }
    }
    console.log(`Got ${rssPapers.length} papers from NBER RSS`);
  } catch (error) {
    console.warn("NBER RSS fetch failed:", error);
  }
  
  // Strategy 2: OpenAlex search (catches CEPR and supplements NBER)
  console.log("Fetching working papers from OpenAlex...");
  try {
    const oaPapers = await fetchWorkingPapersFromOpenAlex(daysBack, maxResults - allPapers.length);
    for (const paper of oaPapers) {
      // Avoid duplicates by checking title similarity
      const isDuplicate = allPapers.some(p => 
        p.title.toLowerCase() === paper.title.toLowerCase() ||
        (p.doi && paper.doi && p.doi === paper.doi)
      );
      
      if (!isDuplicate && !seenIds.has(paper.id)) {
        seenIds.add(paper.id);
        allPapers.push(paper);
      }
    }
    console.log(`Got ${oaPapers.length} papers from OpenAlex`);
  } catch (error) {
    console.warn("OpenAlex fetch failed:", error);
  }
  
  // Sort by date (most recent first)
  allPapers.sort((a, b) => {
    const dateA = new Date(a.publication_date || 0).getTime();
    const dateB = new Date(b.publication_date || 0).getTime();
    return dateB - dateA;
  });
  
  return allPapers.slice(0, maxResults);
}
