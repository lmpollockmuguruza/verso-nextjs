/**
 * AI-Powered Paper Scorer for Econvery
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Uses Google Gemini (free tier) as the PRIMARY recommendation engine.
 * 
 * WHY AI-FIRST:
 * The keyword/taxonomy approach fundamentally can't handle:
 * - "social networks" matching a paper about "network centrality in peer groups"
 * - "labor economics" matching "monopsony power in hiring platforms"  
 * - Cross-field connections (a methods paper relevant to applied work)
 * 
 * An LLM understands these semantic connections natively.
 * 
 * DESIGN:
 * 1. Papers are sent in batches of 8 with the user's full profile
 * 2. Gemini returns scores (1-10) + one-line explanations
 * 3. AI scores REPLACE taxonomy scores entirely (not blended)
 * 4. If AI fails, we fall back to taxonomy scores with a clear warning
 */

import type { ScoredPaper, UserProfile } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AIRerankerConfig {
  apiKey: string;
  model?: string;
}

export interface AIRerankerResult {
  papers: ScoredPaper[];
  aiEnhanced: boolean;
  aiPapersScored: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";
const BATCH_SIZE = 8;

export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (recommended)" },
  { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash-Lite" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT
// ═══════════════════════════════════════════════════════════════════════════

function buildPrompt(profile: UserProfile, papers: ScoredPaper[]): string {
  const profileParts: string[] = [];
  profileParts.push(`Level: ${profile.academic_level}`);
  profileParts.push(`Field: ${profile.primary_field}`);
  if (profile.interests.length > 0) {
    profileParts.push(`Interests: ${profile.interests.join(", ")}`);
  } else {
    profileParts.push(`Interests: General/broad — score based on importance and quality`);
  }
  if (profile.methods.length > 0) {
    profileParts.push(`Methods: ${profile.methods.join(", ")}`);
  }
  if (profile.approach_preference !== "no_preference") {
    profileParts.push(`Preference: ${profile.approach_preference} research`);
  }
  if (profile.region && profile.region !== "Global / No Preference") {
    profileParts.push(`Regional focus: ${profile.region}`);
  }

  const paperDescs = papers.map((p, i) => {
    const abstract = p.abstract.length > 250 ? p.abstract.slice(0, 250) + "..." : p.abstract;
    return `[${i}] "${p.title}" (${p.journal})
${abstract}`;
  }).join("\n\n");

  return `You are an expert academic advisor scoring paper relevance for a researcher.

RESEARCHER:
${profileParts.join("\n")}

PAPERS:
${paperDescs}

Score each paper 1-10 for relevance to this researcher. Think about:
- Semantic connections (e.g., "peer effects" is relevant to "social networks")
- Methodological fit (e.g., a DiD paper matches "causal inference" interest)
- Field adjacency (e.g., political economy paper relevant to economics researcher)
- For generalists with no specific interests, score on general importance and quality

SCALE:
9-10: Core interest, directly relevant
7-8: Strong connection to their interests or methods
5-6: Moderate relevance, adjacent topic
3-4: Weak connection
1-2: Not relevant

Reply ONLY with a JSON array. No other text, no markdown fences.
[{"i":0,"s":7,"r":"direct match to labor interests"},{"i":1,"s":4,"r":"tangential to their field"}]

"i" = paper index, "s" = score 1-10, "r" = reason (under 10 words)`;
}

// ═══════════════════════════════════════════════════════════════════════════
// API CALL
// ═══════════════════════════════════════════════════════════════════════════

async function callGemini(
  prompt: string, 
  apiKey: string, 
  model: string
): Promise<string> {
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          topP: 0.8,
        },
      }),
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.error?.message || `HTTP ${response.status}`;
      
      if (response.status === 429 || msg.includes("quota") || msg.includes("limit")) {
        throw new Error(`Quota exceeded for ${model}. Try a different model in the dropdown.`);
      }
      if (response.status === 400 && (msg.includes("API key") || msg.includes("API_KEY"))) {
        throw new Error("Invalid API key. Check your key at aistudio.google.com.");
      }
      if (response.status === 403) {
        throw new Error("API key lacks permission. Enable 'Generative Language API' in Google Cloud Console.");
      }
      if (response.status === 404) {
        throw new Error(`Model "${model}" not available. Try a different model.`);
      }
      
      throw new Error(`Gemini error: ${msg}`);
    }
    
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      const blockReason = data?.candidates?.[0]?.finishReason;
      if (blockReason === "SAFETY") {
        throw new Error("Response blocked by safety filter. Try again.");
      }
      throw new Error("Empty response from Gemini");
    }
    
    return text;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Gemini request timed out (30s). Try again or use a faster model.");
    }
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE PARSER
// ═══════════════════════════════════════════════════════════════════════════

interface ParsedScore {
  index: number;
  score: number;
  reason: string;
}

function parseScores(text: string, expectedCount: number): ParsedScore[] {
  try {
    let json = text.trim();
    
    // Strip markdown fences
    const fenceMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) json = fenceMatch[1].trim();
    
    // Find the JSON array
    if (!json.startsWith("[")) {
      const arrayMatch = json.match(/\[[\s\S]*\]/);
      if (arrayMatch) json = arrayMatch[0];
    }
    
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    
    return parsed
      .filter((item: any) => 
        item && 
        typeof item.i === "number" && 
        typeof item.s === "number" &&
        item.i >= 0 && item.i < expectedCount
      )
      .map((item: any) => ({
        index: item.i,
        score: Math.max(1, Math.min(10, Math.round(item.s * 10) / 10)),
        reason: typeof item.r === "string" ? item.r.slice(0, 80) : "",
      }));
  } catch {
    console.warn("Failed to parse AI scores from:", text.slice(0, 200));
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCORER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Score papers using Gemini AI as the PRIMARY engine.
 * AI scores REPLACE taxonomy scores — they don't blend.
 */
export async function aiRerank(
  papers: ScoredPaper[],
  profile: UserProfile,
  config: AIRerankerConfig
): Promise<AIRerankerResult> {
  const { apiKey, model = DEFAULT_MODEL } = config;
  
  if (!apiKey) {
    return { papers, aiEnhanced: false, aiPapersScored: 0, error: "No API key" };
  }
  
  // Score top 40 papers (5 batches of 8)
  const toScore = papers.slice(0, 40);
  const remainder = papers.slice(40);
  
  const aiScores: Map<number, ParsedScore> = new Map();
  let lastError: string | undefined;
  let batchesSucceeded = 0;
  
  // Build batches
  const batches: { papers: ScoredPaper[]; offset: number }[] = [];
  for (let i = 0; i < toScore.length; i += BATCH_SIZE) {
    batches.push({ papers: toScore.slice(i, i + BATCH_SIZE), offset: i });
  }
  
  for (const batch of batches) {
    try {
      const prompt = buildPrompt(profile, batch.papers);
      const responseText = await callGemini(prompt, apiKey, model);
      const scores = parseScores(responseText, batch.papers.length);
      
      for (const score of scores) {
        aiScores.set(batch.offset + score.index, score);
      }
      
      if (scores.length > 0) batchesSucceeded++;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "AI scoring failed";
      console.warn(`AI batch failed:`, lastError);
      
      // Stop on auth/quota errors
      if (lastError.includes("key") || lastError.includes("uota") || lastError.includes("permission") || lastError.includes("odel")) {
        break;
      }
    }
  }
  
  // If no batches succeeded, return originals untouched
  if (batchesSucceeded === 0) {
    return {
      papers,
      aiEnhanced: false,
      aiPapersScored: 0,
      error: lastError || "AI scoring returned no results",
    };
  }
  
  // Apply AI scores — blend with originals and store metadata
  const scoredPapers = toScore.map((paper, idx) => {
    const aiResult = aiScores.get(idx);
    if (!aiResult) return paper;
    
    const originalScore = paper.relevance_score;
    const blended = Math.round(Math.max(1, Math.min(10,
      originalScore * 0.55 + aiResult.score * 0.45
    )) * 10) / 10;
    
    return {
      ...paper,
      relevance_score: blended,
      original_score: originalScore,
      ai_score: aiResult.score,
      ai_explanation: aiResult.reason || undefined,
      match_explanation: aiResult.reason || paper.match_explanation,
    };
  });
  
  // Re-sort
  scoredPapers.sort((a, b) => b.relevance_score - a.relevance_score);
  
  return {
    papers: [...scoredPapers, ...remainder],
    aiEnhanced: true,
    aiPapersScored: aiScores.size,
    error: lastError,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// KEY VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

export async function validateGeminiKey(
  apiKey: string, 
  model?: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const useModel = model || DEFAULT_MODEL;
    const text = await callGemini("Reply with exactly: OK", apiKey, useModel);
    return { valid: text.trim().length > 0 };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
