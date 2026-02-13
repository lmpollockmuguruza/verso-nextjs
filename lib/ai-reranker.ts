/**
 * AI-Powered Paper Reranker for Econvery
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Uses Google Gemini (free tier) to intelligently re-rank papers based on
 * the user's research profile. This addresses limitations of the keyword/
 * taxonomy-based scoring by leveraging LLM understanding of:
 * 
 * 1. SEMANTIC NUANCE — Understanding that "labor market frictions" relates
 *    deeply to "unemployment" even without keyword overlap
 * 
 * 2. CROSS-FIELD CONNECTIONS — Recognizing when a methods paper in 
 *    econometrics is highly relevant to an applied micro researcher
 * 
 * 3. RESEARCH FRONTIER AWARENESS — Understanding which topics are "hot"
 *    and which papers represent genuine contributions vs. incremental work
 * 
 * DESIGN: We send batches of paper summaries + user profile to Gemini,
 * and receive relevance scores (1-10) with brief explanations.
 * The AI scores are blended with the existing taxonomy scores.
 */

import type { ScoredPaper, UserProfile } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AIRerankerConfig {
  apiKey: string;
  model?: string;
  maxPapersPerBatch?: number;
  blendWeight?: number; // 0-1, how much to weight AI scores vs original (default 0.5)
}

export interface AIScoreResult {
  paperId: string;
  aiScore: number;        // 1-10
  aiExplanation: string;  // Brief reason for the score
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
const DEFAULT_MODEL = "gemini-2.0-flash";
const MAX_PAPERS_PER_BATCH = 10;
const BLEND_WEIGHT = 0.45; // AI gets 45% weight, original gets 55%

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════

function buildUserProfileSummary(profile: UserProfile): string {
  const parts: string[] = [];
  
  parts.push(`Academic level: ${profile.academic_level}`);
  parts.push(`Primary field: ${profile.primary_field}`);
  
  if (profile.interests.length > 0) {
    parts.push(`Research interests: ${profile.interests.join(", ")}`);
  }
  
  if (profile.methods.length > 0) {
    parts.push(`Preferred methods: ${profile.methods.join(", ")}`);
  }
  
  if (profile.approach_preference !== "no_preference") {
    parts.push(`Approach: ${profile.approach_preference}`);
  }
  
  if (profile.region && profile.region !== "Global / No Preference") {
    parts.push(`Regional focus: ${profile.region}`);
  }
  
  return parts.join("\n");
}

function buildPaperSummary(paper: ScoredPaper, index: number): string {
  const authors = paper.authors.slice(0, 3).join(", ");
  const authSuffix = paper.authors.length > 3 ? " et al." : "";
  // Truncate abstract to ~300 chars to save tokens
  const abstract = paper.abstract.length > 300 
    ? paper.abstract.substring(0, 300) + "..." 
    : paper.abstract;
  
  return `[Paper ${index + 1}] ID: ${paper.id}
Title: ${paper.title}
Authors: ${authors}${authSuffix}
Journal: ${paper.journal} (Tier ${paper.journal_tier})
Abstract: ${abstract}`;
}

function buildScoringPrompt(profile: UserProfile, papers: ScoredPaper[]): string {
  const profileSummary = buildUserProfileSummary(profile);
  const paperSummaries = papers.map((p, i) => buildPaperSummary(p, i)).join("\n\n");
  
  return `You are an expert academic research advisor. Score how relevant each paper is to this researcher's profile.

RESEARCHER PROFILE:
${profileSummary}

PAPERS TO SCORE:
${paperSummaries}

SCORING GUIDELINES:
- Score each paper 1-10 based on relevance to the researcher's interests, methods, and field
- 9-10: Directly addresses their core interests with their preferred methods
- 7-8: Strongly related to their interests or uses methods they care about
- 5-6: Moderately relevant, tangential connection or adjacent field
- 3-4: Weakly relevant, mostly outside their interests
- 1-2: Not relevant to this researcher
- Consider semantic connections beyond keywords (e.g., "labor market frictions" is relevant to "unemployment")
- Consider methodological fit (e.g., a DiD paper is relevant to someone interested in causal inference)
- Highly-cited papers from top journals deserve a small boost for quality

Respond ONLY with valid JSON array, no other text. Format:
[{"id":"paper_id","score":7,"reason":"Brief 5-10 word explanation"}]`;
}

// ═══════════════════════════════════════════════════════════════════════════
// GEMINI API CALLER
// ═══════════════════════════════════════════════════════════════════════════

async function callGemini(
  prompt: string, 
  apiKey: string, 
  model: string = DEFAULT_MODEL
): Promise<string> {
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,     // Low temperature for consistent scoring
        maxOutputTokens: 2048,
        topP: 0.8,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
    
    if (response.status === 400 && errorMsg.includes("API key")) {
      throw new Error("Invalid API key. Please check your Gemini API key.");
    }
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. The Gemini free tier allows ~15 requests per minute. Please wait a moment and try again.");
    }
    if (response.status === 403) {
      throw new Error("API key doesn't have access to Gemini. Make sure the Generative Language API is enabled in your Google Cloud project.");
    }
    
    throw new Error(`Gemini API error: ${errorMsg}`);
  }
  
  const data = await response.json();
  
  // Extract text from Gemini response
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from Gemini API");
  }
  
  return text;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE PARSER
// ═══════════════════════════════════════════════════════════════════════════

function parseAIScores(responseText: string, paperIds: string[]): AIScoreResult[] {
  try {
    // Try to extract JSON from response (Gemini sometimes wraps it in markdown)
    let jsonStr = responseText.trim();
    
    // Remove markdown code fences if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    // If it doesn't start with [, try to find the array
    if (!jsonStr.startsWith("[")) {
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }
    }
    
    const parsed = JSON.parse(jsonStr);
    
    if (!Array.isArray(parsed)) {
      console.warn("AI response is not an array");
      return [];
    }
    
    const validPaperIds = new Set(paperIds);
    
    return parsed
      .filter((item: any) => 
        item && 
        typeof item.id === "string" && 
        typeof item.score === "number" &&
        validPaperIds.has(item.id)
      )
      .map((item: any) => ({
        paperId: item.id,
        aiScore: Math.max(1, Math.min(10, Math.round(item.score * 10) / 10)),
        aiExplanation: typeof item.reason === "string" ? item.reason.slice(0, 100) : "",
      }));
  } catch (error) {
    console.warn("Failed to parse AI scores:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN RERANKER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rerank papers using Gemini AI.
 * 
 * Process:
 * 1. Take the top N papers from existing scoring
 * 2. Send them in batches to Gemini for AI scoring
 * 3. Blend AI scores with original scores
 * 4. Re-sort by blended score
 */
export async function aiRerank(
  papers: ScoredPaper[],
  profile: UserProfile,
  config: AIRerankerConfig
): Promise<AIRerankerResult> {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    maxPapersPerBatch = MAX_PAPERS_PER_BATCH,
    blendWeight = BLEND_WEIGHT,
  } = config;
  
  if (!apiKey) {
    return { papers, aiEnhanced: false, aiPapersScored: 0, error: "No API key provided" };
  }
  
  // Only AI-rank top papers to save API calls (up to 30)
  const papersToScore = papers.slice(0, 30);
  const remainingPapers = papers.slice(30);
  
  // Split into batches
  const batches: ScoredPaper[][] = [];
  for (let i = 0; i < papersToScore.length; i += maxPapersPerBatch) {
    batches.push(papersToScore.slice(i, i + maxPapersPerBatch));
  }
  
  const allAIScores: Map<string, AIScoreResult> = new Map();
  let lastError: string | undefined;
  
  // Process batches
  for (const batch of batches) {
    try {
      const prompt = buildScoringPrompt(profile, batch);
      const responseText = await callGemini(prompt, apiKey, model);
      const scores = parseAIScores(responseText, batch.map(p => p.id));
      
      for (const score of scores) {
        allAIScores.set(score.paperId, score);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "AI scoring failed";
      console.warn("AI batch scoring failed:", error);
      // Continue with remaining batches if possible, but stop on auth errors
      if (lastError.includes("API key") || lastError.includes("access")) {
        break;
      }
    }
  }
  
  // If we got no AI scores at all, return original
  if (allAIScores.size === 0) {
    return { 
      papers, 
      aiEnhanced: false, 
      aiPapersScored: 0, 
      error: lastError || "AI scoring returned no results" 
    };
  }
  
  // Blend scores
  const rerankedPapers = papersToScore.map(paper => {
    const aiResult = allAIScores.get(paper.id);
    
    if (!aiResult) {
      return paper; // No AI score, keep original
    }
    
    // Blend: weighted average of original and AI score
    const blendedScore = (paper.relevance_score * (1 - blendWeight)) + (aiResult.aiScore * blendWeight);
    const clampedScore = Math.max(1, Math.min(10, Math.round(blendedScore * 10) / 10));
    
    // Enhance explanation with AI insight
    const aiNote = aiResult.aiExplanation ? ` · AI: ${aiResult.aiExplanation}` : "";
    
    return {
      ...paper,
      relevance_score: clampedScore,
      match_explanation: (paper.match_explanation || "") + aiNote,
    };
  });
  
  // Re-sort by new blended scores
  rerankedPapers.sort((a, b) => b.relevance_score - a.relevance_score);
  
  // Append remaining papers (not AI-scored)
  const finalPapers = [...rerankedPapers, ...remainingPapers];
  
  return {
    papers: finalPapers,
    aiEnhanced: true,
    aiPapersScored: allAIScores.size,
    error: lastError,
  };
}

/**
 * Validate a Gemini API key by making a minimal test request.
 */
export async function validateGeminiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = `${GEMINI_API_URL}/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Reply with exactly: OK" }]
        }],
        generationConfig: {
          maxOutputTokens: 10,
        },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
      return { valid: false, error: errorMsg };
    }
    
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Connection failed" 
    };
  }
}
