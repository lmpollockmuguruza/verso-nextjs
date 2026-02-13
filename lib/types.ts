// ═══════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type JournalField = 
  | "economics" 
  | "polisci" 
  | "psychology" 
  | "sociology" 
  | "management"
  | "working_papers";

export interface Journal {
  name: string;
  issn?: string;
  openAlexId?: string;
  field: JournalField;
  tier: 1 | 2 | 3;
  altNames?: string[];
}

export interface Concept {
  name: string;
  score: number;
}

export interface Paper {
  id: string;
  doi?: string;
  doi_url?: string;
  title: string;
  authors: string[];
  institutions: string[];
  abstract: string;
  journal: string;
  journal_tier: number;
  journal_field?: JournalField;
  publication_date: string;
  concepts: Concept[];
  cited_by_count: number;
  is_open_access: boolean;
  oa_url?: string;
}

export interface ScoredPaper extends Paper {
  relevance_score: number;
  matched_interests: string[];
  matched_methods: string[];
  matched_topics: string[];
  match_explanation: string;
  is_adjacent_field?: boolean;
  match_tier?: "core" | "explore" | "discovery";
  ai_score?: number;
  ai_discovery?: number;
  original_score?: number;
  ai_explanation?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// USER PROFILE
// ═══════════════════════════════════════════════════════════════════════════

export type ApproachPreference = "quantitative" | "qualitative" | "both" | "no_preference";
export type ExperienceType = "specialist" | "generalist" | "explorer";

export interface UserProfile {
  name: string;
  academic_level: string;
  primary_field: string;
  interests: string[];
  methods: string[];
  region: string;
  approach_preference: ApproachPreference;
  experience_type: ExperienceType;
  include_adjacent_fields: boolean;
  selected_adjacent_fields: JournalField[];
  exploration_level: number; // 0 = narrow, 0.5 = balanced, 1 = exploratory
}

// ═══════════════════════════════════════════════════════════════════════════
// API TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FetchPapersParams {
  days_back: number;
  selected_journals: string[];
  max_results?: number;
}

export interface FetchPapersResponse {
  papers: Paper[];
  count: number;
  error?: string;
}

export interface ProcessPapersParams {
  profile: UserProfile;
  papers: Paper[];
}

export interface ProcessPapersResponse {
  papers: ScoredPaper[];
  summary: string;
  high_relevance_count: number;
}

export interface JournalOptions {
  economics: { tier1: string[]; tier2: string[]; tier3: string[] };
  polisci: { tier1: string[]; tier2: string[]; tier3: string[] };
  psychology: { tier1: string[]; tier2: string[]; tier3: string[] };
  sociology: { tier1: string[]; tier2: string[]; tier3: string[] };
  management: { tier1: string[]; tier2: string[]; tier3: string[] };
}

export interface ProfileOptions {
  academic_levels: string[];
  primary_fields: string[];
  interests: string[];
  quantitative_methods: string[];
  qualitative_methods: string[];
  mixed_methods: string[];
  regions: string[];
  approach_preferences: { value: ApproachPreference; label: string }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface KeywordEntry {
  canonical: string;
  synonyms: string[];
  weight: number;
}

export interface MatchScore {
  total: number;
  baseline_score: number;
  concept_score: number;
  keyword_score: number;
  method_score: number;
  quality_score: number;
  field_relevance_score: number;
  discovery_score: number;
  matched_interests: string[];
  matched_methods: string[];
  matched_topics: string[];
  explanation: string;
  is_adjacent_field: boolean;
  match_tier: "core" | "explore" | "discovery";
}

// ═══════════════════════════════════════════════════════════════════════════
// OPENALEX API TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface OpenAlexWork {
  id: string;
  doi?: string;
  title?: string;
  authorships?: OpenAlexAuthorship[];
  publication_date?: string;
  primary_location?: {
    source?: {
      display_name?: string;
      issn?: string[];
    };
  };
  abstract_inverted_index?: Record<string, number[]>;
  concepts?: OpenAlexConcept[];
  cited_by_count?: number;
  open_access?: {
    is_oa?: boolean;
    oa_url?: string;
  };
  type?: string;
}

export interface OpenAlexAuthorship {
  author?: { display_name?: string };
  institutions?: { display_name?: string }[];
}

export interface OpenAlexConcept {
  display_name?: string;
  score?: number;
}

export interface OpenAlexResponse {
  results: OpenAlexWork[];
  meta?: { count?: number; next_cursor?: string };
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUPED OPTIONS (for UI)
// ═══════════════════════════════════════════════════════════════════════════

export interface OptionGroup {
  label: string;
  options: string[];
}

export interface GroupedOptions {
  groups: OptionGroup[];
  all: string[];
}
