import { NextRequest, NextResponse } from "next/server";
import { aiRerank, validateGeminiKey } from "@/lib/ai-reranker";
import type { ScoredPaper, UserProfile } from "@/lib/types";

export const runtime = "edge";
export const maxDuration = 60;

interface AIRerankRequestBody {
  action: "rerank" | "validate";
  apiKey: string;
  profile?: UserProfile;
  papers?: ScoredPaper[];
}

export async function POST(request: NextRequest) {
  try {
    const body: AIRerankRequestBody = await request.json();
    const { action, apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Validate key
    if (action === "validate") {
      const result = await validateGeminiKey(apiKey);
      return NextResponse.json(result);
    }

    // Rerank papers
    if (action === "rerank") {
      const { profile, papers } = body;

      if (!profile || !papers || !Array.isArray(papers)) {
        return NextResponse.json(
          { error: "Profile and papers array are required for reranking" },
          { status: 400 }
        );
      }

      const result = await aiRerank(papers, profile, { apiKey });

      return NextResponse.json({
        papers: result.papers,
        aiEnhanced: result.aiEnhanced,
        aiPapersScored: result.aiPapersScored,
        error: result.error,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'rerank' or 'validate'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("AI rerank error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "AI reranking failed",
        aiEnhanced: false,
      },
      { status: 500 }
    );
  }
}
