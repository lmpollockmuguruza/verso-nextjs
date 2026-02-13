"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { ScoredPaper } from "@/lib/types";

interface PaperCardProps {
  paper: ScoredPaper;
  index?: number;
  compact?: boolean;
}

export function PaperCard({ paper, index = 0, compact = false }: PaperCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch { return dateStr; }
  };

  const formatAuthors = (authors: string[]) => {
    if (!authors.length) return "Unknown authors";
    if (authors.length <= 2) return authors.join(", ");
    return `${authors.slice(0, 2).join(", ")} +${authors.length - 2}`;
  };

  const getScoreClass = (score: number) => {
    if (score >= 7) return "score-high";
    if (score >= 4) return "score-medium";
    return "score-low";
  };

  const getTierLabel = (tier?: "core" | "explore" | "discovery") => {
    switch (tier) {
      case "core": return { label: "Core match", className: "tier-badge-core" };
      case "explore": return { label: "Worth exploring", className: "tier-badge-explore" };
      case "discovery": return { label: "Discovery", className: "tier-badge-discovery" };
      default: return null;
    }
  };

  const getJournalTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return "Top 5";
      case 2: return "Top field";
      case 3: return "Excellent";
      default: return null;
    }
  };

  const tierInfo = getTierLabel(paper.match_tier);
  const journalTier = getJournalTierLabel(paper.journal_tier);
  const link = paper.doi_url || paper.oa_url;

  // Compact mode: single line, click to expand
  if (compact && !isExpanded) {
    return (
      <article
        className="card group cursor-pointer"
        style={{ animationDelay: `${index * 0.04}s` }}
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-medium" style={{ color: "var(--ink)" }}>
              {paper.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: "var(--ink-muted)" }}>
              <span>{paper.journal}</span>
              {journalTier && (
                <>
                  <span style={{ color: "var(--ink-ghost)" }}>·</span>
                  <span className="tag-tier">{journalTier}</span>
                </>
              )}
              <span style={{ color: "var(--ink-ghost)" }}>·</span>
              <span>{formatAuthors(paper.authors)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {tierInfo && (
              <span className={`tag ${tierInfo.className}`}>{tierInfo.label}</span>
            )}
            <span className={`score text-lg ${getScoreClass(paper.relevance_score)}`}>
              {paper.relevance_score.toFixed(1)}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="card group"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Top meta line: journal, tier, score */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: "var(--ink-muted)" }}>
          <span className="font-medium" style={{ color: "var(--ink-soft)" }}>{paper.journal}</span>
          {journalTier && (
            <>
              <span style={{ color: "var(--ink-ghost)" }}>·</span>
              <span className="tag-tier">{journalTier}</span>
            </>
          )}
          {tierInfo && (
            <>
              <span style={{ color: "var(--ink-ghost)" }}>·</span>
              <span className={`tag ${tierInfo.className}`}>{tierInfo.label}</span>
            </>
          )}
        </div>
        <span className={`score text-xl shrink-0 ${getScoreClass(paper.relevance_score)}`}>
          {paper.relevance_score.toFixed(1)}
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-2.5 font-display text-[1.2rem] font-medium leading-snug" style={{ color: "var(--ink)" }}>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            {paper.title}
          </a>
        ) : paper.title}
      </h3>

      {/* Authors */}
      <p className="mt-1.5 text-sm" style={{ color: "var(--ink-muted)" }}>
        {formatAuthors(paper.authors)}
      </p>

      {/* Abstract preview (first ~150 chars) */}
      {paper.abstract && (
        <p className="mt-2.5 text-sm leading-relaxed line-clamp-3" style={{ color: "var(--ink-soft)" }}>
          {paper.abstract.length > 200 ? paper.abstract.slice(0, 200) + "..." : paper.abstract}
        </p>
      )}

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {paper.matched_interests?.slice(0, 2).map((interest) => (
          <span key={interest} className="tag tag-interest">{interest}</span>
        ))}
        {paper.matched_methods?.slice(0, 2).map((method) => (
          <span key={method} className="tag tag-method">{method}</span>
        ))}
        {paper.is_open_access && <span className="tag tag-oa">Open Access</span>}
      </div>

      {/* Match explanation (editorial italic) */}
      {paper.match_explanation && (
        <p className="mt-3 font-display text-sm italic" style={{ color: "var(--ink-muted)" }}>
          {paper.match_explanation}
        </p>
      )}

      {/* AI scoring detail */}
      {paper.ai_score != null && paper.original_score != null && (
        <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
          style={{ background: "rgba(107, 39, 55, 0.04)", color: "var(--burgundy)" }}>
          <span>
            AI: {paper.ai_score.toFixed(1)}
            {paper.ai_discovery != null && ` · Discovery: ${paper.ai_discovery.toFixed(1)}`}
            {" · "}Base: {paper.original_score.toFixed(1)}
            {paper.ai_explanation && ` · ${paper.ai_explanation}`}
          </span>
        </div>
      )}

      {/* Footer divider + date + full abstract toggle + link */}
      <div className="mt-3.5 pt-3 flex items-center justify-between gap-3"
        style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--ink-faint)" }}>
          <span>{formatDate(paper.publication_date)}</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ color: "var(--ink-muted)" }}
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {isExpanded ? "Less" : "Full abstract"}
          </button>
        </div>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--burgundy)" }}
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Full abstract */}
      {isExpanded && paper.abstract && (
        <div className="mt-3 animate-fade-in text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          {paper.abstract}
        </div>
      )}

      {/* Close compact mode */}
      {compact && isExpanded && (
        <button
          onClick={() => setIsExpanded(false)}
          className="mt-2 text-xs transition-colors hover:opacity-80"
          style={{ color: "var(--ink-faint)" }}
        >
          Collapse
        </button>
      )}
    </article>
  );
}
