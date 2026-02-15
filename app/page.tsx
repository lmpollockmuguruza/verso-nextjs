"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpLeft, Search, RotateCcw, Sparkles,
  SkipForward, BookOpen, FlaskConical, Lightbulb, Globe,
  Brain, Key, CheckCircle, AlertCircle, ExternalLink,
  ChevronDown, Compass, Focus, Sun, Moon, Copy, Download, X, Check
} from "lucide-react";
import { ProgressDots, PaperCard, FunLoading, MultiSelect } from "@/components";
import {
  getProfileOptions, getGroupedOptions,
  APPROACH_PREFERENCES, isGeneralistField, getMethodsByApproach
} from "@/lib/profile-options";
import {
  getJournalOptions, getCoreJournals, getWorkingPapers,
  getJournalsByTier, getSmartJournalDefaults, getAllJournalsList
} from "@/lib/journals";
import type { ScoredPaper, UserProfile, ApproachPreference, JournalField } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const TOTAL_STEPS = 8;
const TOP_DISPLAY = 15;
const MAX_RESULTS = 50;
const profileOptions = getProfileOptions();
const groupedOptions = getGroupedOptions();
const journalOptions = getJournalOptions();

// ═══════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════

interface AppState {
  step: number;
  name: string;
  level: string;
  field: string;
  approachPreference: ApproachPreference;
  explorationLevel: number;
  interests: string[];
  methods: string[];
  region: string;
  fieldType: "Economics" | "Political Science" | "Both";
  includeWorkingPapers: boolean;
  includeAdjacentFields: boolean;
  selectedAdjacentFields: JournalField[];
  journals: string[];
  days: number;
  papers: ScoredPaper[];
  summary: string;
  isLoading: boolean;
  error: string | null;
  geminiApiKey: string;
  geminiModel: string;
  aiEnabled: boolean;
  aiKeyValid: boolean | null;
  aiKeyValidating: boolean;
  aiReranking: boolean;
  aiEnhanced: boolean;
  aiPapersScored: number;
  aiError: string | null;
}

const initialState: AppState = {
  step: 1,
  name: "",
  level: "Curious Learner",
  field: "General Interest (Show me everything)",
  approachPreference: "no_preference",
  explorationLevel: 0.5,
  interests: [],
  methods: [],
  region: "Global / No Preference",
  fieldType: "Both",
  includeWorkingPapers: true,
  includeAdjacentFields: false,
  selectedAdjacentFields: [],
  journals: [],
  days: 30,
  papers: [],
  summary: "",
  isLoading: false,
  error: null,
  geminiApiKey: "",
  geminiModel: "gemini-2.5-flash",
  aiEnabled: false,
  aiKeyValid: null,
  aiKeyValidating: false,
  aiReranking: false,
  aiEnhanced: false,
  aiPapersScored: 0,
  aiError: null,
};

// ═══════════════════════════════════════════════════════════════════════
// THEME HOOK
// ═══════════════════════════════════════════════════════════════════════

function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("verso-theme", next ? "dark" : "light");
  }, [isDark]);

  return { isDark, toggle };
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function toggleItem(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

/** Animated logo — each letter waves up and turns accent on hover */
function VersoLogo({ size = "1.5rem" }: { size?: string }) {
  return (
    <span
      className="verso-logo font-serif"
      style={{ fontSize: size, color: "var(--fg)", letterSpacing: "-0.02em" }}
    >
      {"verso".split("").map((char, i) => (
        <span key={i} className="verso-letter">{char}</span>
      ))}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);
  const { isDark, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const saved = localStorage.getItem("verso-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.step < TOTAL_STEPS) {
          setState((s) => ({ ...s, ...parsed, papers: [], summary: "" }));
        }
      } catch (e) { console.error("Failed to restore state:", e); }
    }
  }, []);

  useEffect(() => {
    const toSave = {
      ...state, papers: [], summary: "", isLoading: false, error: null,
      aiReranking: false, aiEnhanced: false, aiPapersScored: 0, aiError: null, aiKeyValidating: false,
    };
    localStorage.setItem("verso-state", JSON.stringify(toSave));
  }, [state]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((s) => ({ ...s, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.min(s.step + 1, TOTAL_STEPS) }));
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.max(s.step - 1, 1) }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((s) => ({ ...s, step }));
  }, []);

  const startOver = useCallback(() => {
    setState({ ...initialState });
    localStorage.removeItem("verso-state");
  }, []);

  const discoverPapers = useCallback(async () => {
    updateState({ isLoading: true, error: null, aiEnhanced: false, aiError: null, aiPapersScored: 0 });

    try {
      const profile: UserProfile = {
        name: state.name,
        academic_level: state.level,
        primary_field: state.field,
        interests: state.interests,
        methods: state.methods,
        region: state.region,
        approach_preference: state.approachPreference,
        experience_type: isGeneralistField(state.field) ? "generalist" : "specialist",
        include_adjacent_fields: state.includeAdjacentFields,
        selected_adjacent_fields: state.selectedAdjacentFields,
        exploration_level: state.explorationLevel,
      };

      const journalParam = state.journals.length > 0
        ? state.journals.join(",")
        : getCoreJournals().join(",");

      const papersRes = await fetch(
        `/api/papers?daysBack=${state.days}&maxResults=100&journals=${encodeURIComponent(journalParam)}`
      );

      if (!papersRes.ok) throw new Error("Failed to fetch papers");
      const papersData = await papersRes.json();
      if (papersData.error) throw new Error(papersData.error);

      if (!papersData.papers?.length) {
        updateState({ isLoading: false, error: "No papers found. Try expanding your date range or journal selection." });
        return;
      }

      const recommendRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, papers: papersData.papers }),
      });

      if (!recommendRes.ok) throw new Error("Failed to process papers");
      const recommendData = await recommendRes.json();
      let finalPapers = recommendData.papers;
      let aiEnhanced = false;
      let aiPapersScored = 0;
      let aiError: string | null = null;

      if (state.aiEnabled && state.geminiApiKey.trim()) {
        updateState({ aiReranking: true });
        try {
          const aiRes = await fetch("/api/ai-rerank", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "rerank",
              apiKey: state.geminiApiKey,
              model: state.geminiModel,
              profile,
              papers: recommendData.papers,
            }),
          });
          const aiData = await aiRes.json();
          if (aiRes.ok && aiData.aiEnhanced) {
            finalPapers = aiData.papers;
            aiEnhanced = true;
            aiPapersScored = aiData.aiPapersScored || 0;
          }
          if (aiData.error) aiError = aiData.error;
        } catch (err) {
          aiError = err instanceof Error ? err.message : "AI scoring failed";
        }
      }

      updateState({
        papers: finalPapers,
        summary: recommendData.summary,
        isLoading: false,
        aiReranking: false,
        aiEnhanced,
        aiPapersScored,
        aiError,
      });
    } catch (err) {
      updateState({
        isLoading: false,
        aiReranking: false,
        error: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }, [state, updateState]);

  const renderStep = () => {
    const stepProps = { state, updateState, nextStep, prevStep, goToStep, startOver, discoverPapers };
    switch (state.step) {
      case 1: return <StepWelcome {...stepProps} />;
      case 2: return <StepLevel {...stepProps} />;
      case 3: return <StepField {...stepProps} />;
      case 4: return <StepApproach {...stepProps} />;
      case 5: return <StepInterests {...stepProps} />;
      case 6: return <StepMethods {...stepProps} />;
      case 7: return <StepSources {...stepProps} />;
      case 8: return <StepResults {...stepProps} />;
      default: return <StepWelcome {...stepProps} />;
    }
  };

  const isResults = state.step === 8 && state.papers.length > 0 && !state.isLoading;

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Top bar — portfolio link + theme toggle */}
      <div className="top-bar">
        <a
          href="https://lmpollockmuguruza.github.io/"
          className="portfolio-link"
          style={{ pointerEvents: "auto" }}
        >
          <ArrowUpLeft className="h-3 w-3" />
          Portfolio
        </a>
        <button onClick={toggleTheme} className="theme-toggle" style={{ pointerEvents: "auto" }}>
          {isDark ? <Sun className="inline h-3 w-3 mr-1" /> : <Moon className="inline h-3 w-3 mr-1" />}
          {isDark ? "Light" : "Dark"}
        </button>
      </div>

      <div className={isResults ? "content-wrap content-wrap--results" : "content-wrap"}>

        {/* Persistent logo header for setup steps */}
        {!isResults && (
          <div style={{ marginBottom: state.step === 1 ? "3rem" : "1.5rem" }}>
            <VersoLogo size={state.step === 1 ? "1.5rem" : "1.125rem"} />
            {state.step === 1 && (
              <div className="font-mono" style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "var(--fg-faint)" }}>
                recent research, surfaced for you
              </div>
            )}
          </div>
        )}
        {renderStep()}
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

interface StepProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  startOver: () => void;
  discoverPapers: () => Promise<void>;
}

// ─── STEP 1: WELCOME ─────────────────────────────────────────────────

function StepWelcome({ state, updateState, nextStep }: StepProps) {
  return (
    <div className="animate-fade-in">
      <ProgressDots current={1} total={TOTAL_STEPS} />

      <div>
        <label className="label" style={{ marginBottom: "0.5rem" }}>Let us start</label>
        <h2 className="font-serif" style={{ fontSize: "1.25rem", color: "var(--fg)" }}>
          What is your name?
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          We will personalize your experience.
        </p>

        <input
          type="text"
          value={state.name}
          onChange={(e) => updateState({ name: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Enter" && state.name.trim()) nextStep(); }}
          placeholder="First name"
          className="mt-6"
          autoFocus
        />

        <div className="mt-8 flex justify-end">
          <button onClick={nextStep} disabled={!state.name.trim()} className="btn-primary">
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 2: LEVEL — chip grid with hover-reveal groups ─────────────

function StepLevel({ state, updateState, nextStep, prevStep }: StepProps) {
  return (
    <div className="animate-fade-in">
      <ProgressDots current={2} total={TOTAL_STEPS} />
      <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Nice to meet you, {state.name}.</p>
      <h2 className="mt-3 font-serif" style={{ fontSize: "1.25rem", color: "var(--fg)" }}>
        What best describes you?
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-faint)" }}>
        No academic background needed — curious minds welcome.
      </p>

      <div className="mt-6">
        {groupedOptions.academic_levels.groups.map((group) => (
          <div key={group.label} className="option-group">
            <div className="option-group-label">{group.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {group.options.map((level) => (
                <button
                  key={level}
                  onClick={() => updateState({ level })}
                  className={`chip ${state.level === level ? "selected" : ""}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Nav onBack={prevStep} onNext={nextStep} />
    </div>
  );
}

// ─── STEP 3: FIELD — chip grid with hover-reveal groups ──────────────

function StepField({ state, updateState, nextStep, prevStep }: StepProps) {
  const isGeneralist = isGeneralistField(state.field);
  return (
    <div className="animate-fade-in">
      <ProgressDots current={3} total={TOTAL_STEPS} />
      <h2 className="font-serif" style={{ fontSize: "1.25rem", color: "var(--fg)" }}>
        What interests you most?
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
        Pick a focus area, or explore broadly.
      </p>

      <div className="mt-6">
        {groupedOptions.primary_fields.groups.map((group) => (
          <div key={group.label} className="option-group">
            <div className="option-group-label">{group.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {group.options.map((field) => (
                <button
                  key={field}
                  onClick={() => updateState({ field })}
                  className={`chip ${state.field === field ? "selected" : ""}`}
                >
                  {field}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isGeneralist && (
        <div className="mt-4 card-accent" style={{ fontSize: "0.8125rem" }}>
          <Lightbulb className="inline h-3.5 w-3.5 mr-1" style={{ color: "var(--accent)" }} />
          <span style={{ color: "var(--accent)" }}>Great choice.</span>{" "}
          <span style={{ color: "var(--fg-muted)" }}>Quality research from across disciplines.</span>
        </div>
      )}

      <Nav onBack={prevStep} onNext={nextStep} />
    </div>
  );
}

// ─── STEP 4: APPROACH ────────────────────────────────────────────────

function StepApproach({ state, updateState, nextStep, prevStep }: StepProps) {
  const explorationLabels = [
    { value: 0, label: "Narrow", desc: "Only papers directly in my areas" },
    { value: 0.5, label: "Balanced", desc: "Relevant papers with some surprises" },
    { value: 1, label: "Exploratory", desc: "Surprise me with quality from adjacent fields" },
  ];

  return (
    <div className="animate-fade-in">
      <ProgressDots current={4} total={TOTAL_STEPS} />
      <h2 className="font-serif" style={{ fontSize: "1.25rem", color: "var(--fg)" }}>
        How should we search?
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
        Choose your research approach and discovery preference.
      </p>

      <p className="label mt-6 mb-2">Research Type</p>
      <div className="space-y-1">
        {APPROACH_PREFERENCES.map((pref) => (
          <button
            key={pref.value}
            onClick={() => updateState({ approachPreference: pref.value })}
            className={`option-btn flex items-center gap-3 ${state.approachPreference === pref.value ? "selected" : ""}`}
          >
            {pref.value === "quantitative" && <FlaskConical className="h-4 w-4 shrink-0" style={{ color: "var(--fg-faint)" }} />}
            {pref.value === "qualitative" && <BookOpen className="h-4 w-4 shrink-0" style={{ color: "var(--fg-faint)" }} />}
            {pref.value === "both" && <Sparkles className="h-4 w-4 shrink-0" style={{ color: "var(--fg-faint)" }} />}
            {pref.value === "no_preference" && <Globe className="h-4 w-4 shrink-0" style={{ color: "var(--fg-faint)" }} />}
            <div>
              <div style={{ fontWeight: 500 }}>{pref.label}</div>
              <div className="font-mono" style={{ fontSize: "0.6875rem", marginTop: "0.125rem", color: "var(--fg-faint)" }}>{pref.description}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <p className="label mb-3">Discovery Preference</p>
        <div className="card" style={{ padding: "1.25rem 1rem" }}>
          <input
            type="range" min={0} max={1} step={0.05}
            value={state.explorationLevel}
            onChange={(e) => updateState({ explorationLevel: parseFloat(e.target.value) })}
            className="w-full"
          />
          <div className="mt-3 flex justify-between font-mono" style={{ fontSize: "0.6875rem", color: "var(--fg-muted)" }}>
            <span className="flex items-center gap-1"><Focus className="h-3 w-3" /> Narrow</span>
            <span className="flex items-center gap-1"><Compass className="h-3 w-3" /> Exploratory</span>
          </div>
          <div className="mt-3 text-center">
            {explorationLabels.map((l) => {
              const isActive = Math.abs(state.explorationLevel - l.value) < 0.2;
              if (!isActive) return null;
              return (
                <div key={l.value}>
                  <p className="font-mono text-sm" style={{ fontWeight: 500, color: "var(--accent)" }}>{l.label}</p>
                  <p className="font-mono mt-0.5" style={{ fontSize: "0.6875rem", color: "var(--fg-muted)" }}>{l.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Nav onBack={prevStep} onNext={nextStep} />
    </div>
  );
}

// ─── STEP 5: INTERESTS — inline chip grid ────────────────────────────

function StepInterests({ state, updateState, nextStep, prevStep }: StepProps) {
  const isGeneralist = isGeneralistField(state.field);
  const maxSelections = 5;
  const atMax = state.interests.length >= maxSelections;

  return (
    <div className="animate-fade-in">
      <ProgressDots current={5} total={TOTAL_STEPS} />
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif" style={{ fontSize: "1.25rem", color: "var(--fg)" }}>Any specific topics?</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
            Select up to {maxSelections} — or skip to see everything.
          </p>
        </div>
        <span className="tag tag-accent font-mono">Optional</span>
      </div>

      {state.interests.length > 0 && (
        <div className="mt-4 font-mono" style={{ fontSize: "0.6875rem", color: "var(--accent)" }}>
          {state.interests.length}/{maxSelections} selected
          {state.interests.length > 0 && <span style={{ color: "var(--fg-faint)" }}> · first selections weighted more</span>}
        </div>
      )}

      <div className="mt-4">
        {groupedOptions.interests.groups.map((group) => (
          <div key={group.label} className="option-group">
            <div className="option-group-label">{group.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {group.options.map((interest) => {
                const isSelected = state.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => {
                      if (isSelected || !atMax) {
                        updateState({ interests: toggleItem(state.interests, interest) });
                      }
                    }}
                    disabled={!isSelected && atMax}
                    className={`chip ${isSelected ? "selected" : ""}`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between items-center">
        <button onClick={prevStep} className="btn-ghost">← Back</button>
        {state.interests.length === 0 ? (
          <button onClick={nextStep} className="btn-secondary">
            Skip <SkipForward className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button onClick={nextStep} className="btn-primary">Continue →</button>
        )}
      </div>
      {isGeneralist && state.interests.length === 0 && (
        <p className="mt-4 text-center font-mono text-xs" style={{ color: "var(--fg-faint)" }}>
          As a generalist, skipping is fine — quality papers from across fields.
        </p>
      )}
    </div>
  );
}

// ─── STEP 6: METHODS — inline chip grid ──────────────────────────────

function StepMethods({ state, updateState, nextStep, prevStep }: StepProps) {
  const availableMethods = getMethodsByApproach(state.approachPreference);
  const maxSelections = 4;
  const atMax = state.methods.length >= maxSelections;

  // Build groups from available methods
  const methodGroups = groupedOptions.methods.groups
    .map((group) => ({
      ...group,
      options: group.options.filter((m) => availableMethods.includes(m)),
    }))
    .filter((group) => group.options.length > 0);

  return (
    <div className="animate-fade-in">
      <ProgressDots current={6} total={TOTAL_STEPS} />
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif" style={{ fontSize: "1.25rem", color: "var(--fg)" }}>Preferred methodologies?</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
            Select up to {maxSelections} — or skip if open to all.
          </p>
        </div>
        <span className="tag tag-accent font-mono">Optional</span>
      </div>

      {state.methods.length > 0 && (
        <div className="mt-4 font-mono" style={{ fontSize: "0.6875rem", color: "var(--accent)" }}>
          {state.methods.length}/{maxSelections} selected
        </div>
      )}

      <div className="mt-4">
        {methodGroups.map((group) => (
          <div key={group.label} className="option-group">
            <div className="option-group-label">{group.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {group.options.map((method) => {
                const isSelected = state.methods.includes(method);
                return (
                  <button
                    key={method}
                    onClick={() => {
                      if (isSelected || !atMax) {
                        updateState({ methods: toggleItem(state.methods, method) });
                      }
                    }}
                    disabled={!isSelected && atMax}
                    className={`chip ${isSelected ? "selected" : ""}`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between items-center">
        <button onClick={prevStep} className="btn-ghost">← Back</button>
        {state.methods.length === 0 ? (
          <button onClick={nextStep} className="btn-secondary">
            Skip <SkipForward className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button onClick={nextStep} className="btn-primary">Continue →</button>
        )}
      </div>
    </div>
  );
}

// ─── STEP 7: SOURCES ─────────────────────────────────────────────────

function StepSources({ state, updateState, nextStep, prevStep, discoverPapers }: StepProps) {
  const [showAdjacentOptions, setShowAdjacentOptions] = useState(state.includeAdjacentFields);
  const [showJournalPicker, setShowJournalPicker] = useState(false);

  const buildJournalList = (
    fieldType: "Economics" | "Political Science" | "Both",
    includeWPs: boolean,
    adjacentFields: JournalField[]
  ) => {
    let selected = getSmartJournalDefaults(state.field, fieldType, includeWPs);
    if (fieldType === "Political Science") {
      const polisciJournals = [
        ...Object.keys(journalOptions.polisci.tier1 ? {} : {}),
        ...getJournalsByTier("polisci", [1, 2, 3]),
      ];
      const wpJournals = includeWPs ? getWorkingPapers() : [];
      selected = [...new Set([...polisciJournals, ...wpJournals])];
    }
    for (const field of adjacentFields) {
      const adjacentJournals = getJournalsByTier(field, [1, 2]);
      selected = [...selected, ...adjacentJournals];
    }
    return [...new Set(selected)];
  };

  const setFieldType = (type: "Economics" | "Political Science" | "Both") => {
    updateState({ fieldType: type });
    const journals = buildJournalList(type, state.includeWorkingPapers, state.selectedAdjacentFields);
    updateState({ journals });
  };

  const toggleWorkingPapers = () => {
    const newValue = !state.includeWorkingPapers;
    updateState({ includeWorkingPapers: newValue });
    const journals = buildJournalList(state.fieldType, newValue, state.selectedAdjacentFields);
    updateState({ journals });
  };

  const toggleAdjacentField = (field: JournalField) => {
    const current = state.selectedAdjacentFields;
    const updated = current.includes(field) ? current.filter(f => f !== field) : [...current, field];
    updateState({ selectedAdjacentFields: updated, includeAdjacentFields: updated.length > 0 });
    const journals = buildJournalList(state.fieldType, state.includeWorkingPapers, updated);
    updateState({ journals });
  };

  const handleDiscover = () => {
    nextStep();
    discoverPapers();
  };

  useEffect(() => {
    if (state.journals.length === 0) {
      const journals = buildJournalList(state.fieldType, state.includeWorkingPapers, state.selectedAdjacentFields);
      updateState({ journals });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allJournals = getAllJournalsList();
  const journalsByField = allJournals.reduce((acc, j) => {
    const key = j.field === "working_papers" ? "Working Papers" :
      j.field === "economics" ? "Economics" :
      j.field === "polisci" ? "Political Science" :
      j.field.charAt(0).toUpperCase() + j.field.slice(1);
    if (!acc[key]) acc[key] = [];
    acc[key].push(j.name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="animate-fade-in">
      <ProgressDots current={7} total={TOTAL_STEPS} />
      <h2 className="font-serif" style={{ fontSize: "1.25rem", color: "var(--fg)" }}>Where to look?</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>Choose journals, time range, and optional enhancements.</p>

      {/* Working Papers */}
      <div className="mt-6">
        <label className="flex items-center gap-3 cursor-pointer card-accent" style={{ padding: "0.75rem" }}>
          <input type="checkbox" checked={state.includeWorkingPapers} onChange={toggleWorkingPapers} />
          <div className="flex-1">
            <span style={{ fontWeight: 500, color: "var(--fg)" }}>Working Papers</span>
            <span className="ml-2 font-mono" style={{ fontSize: "0.6875rem", color: "var(--accent)" }}>(NBER, CEPR)</span>
          </div>
          <span className="tag tag-accent">Cutting-edge</span>
        </label>
      </div>

      {/* Field Selection */}
      <div className="mt-5">
        <p className="label mb-2">Published Journals</p>
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {(["Economics", "Political Science", "Both"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFieldType(type)}
              className={`chip flex-1 justify-center ${state.fieldType === type ? "selected" : ""}`}
              style={{ fontSize: "0.8125rem" }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Journal Picker */}
      <div className="mt-4">
        <button
          onClick={() => setShowJournalPicker(!showJournalPicker)}
          className="font-mono text-sm flex items-center gap-1"
          style={{ color: "var(--fg-muted)", background: "none", border: "none", cursor: "pointer" }}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showJournalPicker ? "" : "-rotate-90"}`} />
          Choose specific journals ({state.journals.length} selected)
        </button>
        {showJournalPicker && (
          <div className="mt-3">
            <MultiSelect
              options={allJournals.map(j => j.name)}
              selected={state.journals}
              onChange={(journals) => updateState({ journals })}
              placeholder="Search journals..."
              groups={Object.entries(journalsByField).map(([label, options]) => ({ label, options }))}
            />
          </div>
        )}
      </div>

      {/* Adjacent Fields */}
      <div className="mt-5">
        <button
          onClick={() => setShowAdjacentOptions(!showAdjacentOptions)}
          className="font-mono text-sm flex items-center gap-1"
          style={{ color: "var(--fg-muted)", background: "none", border: "none", cursor: "pointer" }}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdjacentOptions ? "" : "-rotate-90"}`} />
          Include related fields
        </button>
        {showAdjacentOptions && (
          <div className="mt-3" style={{ display: "flex", gap: "0.375rem" }}>
            {(["psychology", "sociology", "management"] as JournalField[]).map((field) => (
              <button
                key={field}
                onClick={() => toggleAdjacentField(field)}
                className={`chip capitalize ${state.selectedAdjacentFields.includes(field) ? "selected" : ""}`}
              >
                {field}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time Range */}
      <div className="mt-5">
        <p className="label mb-2">Time Range</p>
        <input
          type="range" min={7} max={90} step={7}
          value={state.days}
          onChange={(e) => updateState({ days: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between font-mono" style={{ fontSize: "0.6875rem", color: "var(--fg-muted)", marginTop: "0.375rem" }}>
          <span>Last {state.days} days</span>
          <span>{state.days === 7 ? "1 week" : state.days === 30 ? "1 month" : `${Math.round(state.days / 7)} weeks`}</span>
        </div>
      </div>

      {/* AI Enhancement */}
      <div className="mt-5">
        <button
          onClick={() => updateState({ aiEnabled: !state.aiEnabled })}
          className="w-full flex items-center gap-3 cursor-pointer"
          style={{
            padding: "0.75rem",
            border: "1px solid",
            borderColor: state.aiEnabled ? "var(--accent-border)" : "var(--border)",
            background: state.aiEnabled ? "var(--accent-wash)" : "transparent",
            transition: "all 0.15s ease",
          }}
        >
          <Brain className="h-4 w-4 shrink-0" style={{ color: state.aiEnabled ? "var(--accent)" : "var(--fg-faint)" }} />
          <div className="flex-1 text-left">
            <span style={{ fontWeight: 500, color: state.aiEnabled ? "var(--accent)" : "var(--fg-soft)" }}>
              AI-Enhanced Scoring
            </span>
            <span className="ml-2 tag tag-accent">Free</span>
          </div>
        </button>

        {state.aiEnabled && (
          <div className="mt-3 card space-y-3" style={{ fontSize: "0.8125rem" }}>
            <p style={{ color: "var(--fg-muted)" }}>
              Uses Gemini AI to understand semantic connections between papers and your interests.
            </p>
            <div>
              <label className="label flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
                <Key className="h-3 w-3" /> Gemini API Key
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="password"
                  value={state.geminiApiKey}
                  onChange={(e) => updateState({ geminiApiKey: e.target.value, aiKeyValid: null, aiError: null })}
                  placeholder="Paste your API key"
                  style={{
                    flex: 1, fontSize: "0.8125rem", fontFamily: "var(--font-mono)",
                    padding: "0.375rem 0.5rem", border: "none", borderBottom: "1px solid var(--border)",
                    background: "transparent", color: "var(--fg)", outline: "none",
                  }}
                />
                <button
                  onClick={async () => {
                    if (!state.geminiApiKey.trim()) return;
                    updateState({ aiKeyValidating: true, aiKeyValid: null });
                    try {
                      const res = await fetch("/api/ai-rerank", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "validate", apiKey: state.geminiApiKey, model: state.geminiModel }),
                      });
                      const data = await res.json();
                      updateState({ aiKeyValid: data.valid, aiKeyValidating: false, aiError: data.valid ? null : data.error });
                    } catch {
                      updateState({ aiKeyValid: false, aiKeyValidating: false, aiError: "Connection failed" });
                    }
                  }}
                  disabled={!state.geminiApiKey.trim() || state.aiKeyValidating}
                  className="btn-primary"
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem" }}
                >
                  {state.aiKeyValidating ? "..." : "Test"}
                </button>
              </div>
              {state.aiKeyValid === true && (
                <p className="mt-1.5 font-mono flex items-center gap-1" style={{ fontSize: "0.6875rem", color: "var(--score-high)" }}>
                  <CheckCircle className="h-3 w-3" /> Key valid — AI enhancement active
                </p>
              )}
              {state.aiKeyValid === false && (
                <p className="mt-1.5 font-mono flex items-center gap-1" style={{ fontSize: "0.6875rem", color: "#c53030" }}>
                  <AlertCircle className="h-3 w-3" /> {state.aiError || "Invalid key"}
                </p>
              )}
            </div>
            <div>
              <label className="label" style={{ color: "var(--accent)" }}>Model</label>
              <select
                value={state.geminiModel}
                onChange={(e) => updateState({ geminiModel: e.target.value, aiKeyValid: null, aiError: null })}
                className="mt-1"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (recommended)</option>
                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>
            <div className="card-accent" style={{ fontSize: "0.75rem" }}>
              <p style={{ fontWeight: 500, color: "var(--accent)" }}>Get a free API key (1 minute):</p>
              <ol className="mt-1.5 space-y-0.5" style={{ color: "var(--fg-muted)", listStyle: "decimal inside" }}>
                <li>Go to <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Google AI Studio <ExternalLink className="inline h-2.5 w-2.5" /></a></li>
                <li>Sign in → <strong>Get API key</strong> → <strong>Create API key</strong></li>
                <li>Copy and paste above</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-5 card font-mono" style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>
        <Search className="mr-1.5 inline h-3.5 w-3.5" />
        Searching {state.journals.length} sources
        {state.includeWorkingPapers && <span style={{ color: "var(--accent)" }}> (incl. working papers)</span>}
        {state.selectedAdjacentFields.length > 0 && <span> + {state.selectedAdjacentFields.length} related fields</span>}
        {state.aiEnabled && state.geminiApiKey.trim() && <span style={{ color: "var(--accent)" }}> + AI scoring</span>}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <button onClick={prevStep} className="btn-ghost">← Back</button>
        <button onClick={handleDiscover} disabled={state.journals.length === 0} className="btn-accent">
          <Sparkles className="h-3.5 w-3.5" /> Find papers →
        </button>
      </div>
    </div>
  );
}

// ─── STEP 8: RESULTS ─────────────────────────────────────────────────

function StepResults({ state, updateState, startOver, discoverPapers, goToStep }: StepProps) {
  const [showAll, setShowAll] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (state.isLoading) {
    return (
      <div className="animate-fade-in">
        <FunLoading userName={state.name} />
        {state.aiReranking && (
          <p className="mt-4 text-center font-mono text-xs flex items-center justify-center gap-2" style={{ color: "var(--accent)" }}>
            <Brain className="h-3.5 w-3.5 animate-pulse-subtle" /> AI is analyzing paper relevance...
          </p>
        )}
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="animate-fade-in text-center">
        <p style={{ color: "var(--fg-soft)" }}>{state.error}</p>
        <div className="mt-6 flex gap-3 justify-center">
          <button onClick={() => goToStep(7)} className="btn-secondary">← Adjust</button>
          <button onClick={() => discoverPapers()} className="btn-primary"><RotateCcw className="h-3.5 w-3.5" /> Try Again</button>
        </div>
      </div>
    );
  }

  if (!state.papers.length && !state.isLoading) {
    return (
      <div className="animate-fade-in">
        <FunLoading userName={state.name} />
        <div className="mt-6 text-center">
          <button onClick={() => discoverPapers()} className="btn-accent">
            <Sparkles className="h-3.5 w-3.5" /> Load Papers
          </button>
        </div>
      </div>
    );
  }

  const allPapers = state.papers.slice(0, MAX_RESULTS);
  const topPapers = allPapers.slice(0, TOP_DISPLAY);
  const morePapers = allPapers.slice(TOP_DISPLAY);
  const displayPapers = showAll ? allPapers : topPapers;

  const coreCount = allPapers.filter(p => p.match_tier === "core").length;
  const exploreCount = allPapers.filter(p => p.match_tier === "explore").length;
  const discoveryCount = allPapers.filter(p => p.match_tier === "discovery").length;

  // ── Generate reading list text ─────────────────────────────────
  const generateReadingList = () => {
    const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const fieldLabel = state.field && state.field !== "General Interest (Show me everything)" ? state.field : "General Interest";

    let text = `verso — reading list\n`;
    text += `Curated for ${state.name} · ${fieldLabel}\n`;
    text += `${date} · ${allPapers.length} papers from ${state.journals.length}+ sources\n`;
    text += `─────────────────────────────────\n\n`;

    const sections: { label: string; papers: typeof allPapers }[] = [];
    if (coreCount > 0) sections.push({ label: "Core", papers: allPapers.filter(p => p.match_tier === "core") });
    if (exploreCount > 0) sections.push({ label: "Explore", papers: allPapers.filter(p => p.match_tier === "explore") });
    if (discoveryCount > 0) sections.push({ label: "Discovery", papers: allPapers.filter(p => p.match_tier === "discovery") });

    for (const section of sections) {
      text += `${section.label.toUpperCase()} (${section.papers.length})\n\n`;
      for (const paper of section.papers) {
        const score = paper.relevance_score.toFixed(1);
        const authors = paper.authors.length <= 2
          ? paper.authors.join(" & ")
          : `${paper.authors[0]} et al.`;
        const link = paper.doi_url || paper.oa_url || "";
        text += `  ${score}  ${paper.title}\n`;
        text += `       ${authors} · ${paper.journal}\n`;
        if (link) text += `       ${link}\n`;
        text += `\n`;
      }
    }

    text += `─────────────────────────────────\n`;
    text += `Generated by verso · verso-nextjs.vercel.app`;
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateReadingList());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = generateReadingList();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const text = generateReadingList();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verso-reading-list-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="results-header">
        <VersoLogo size="1.375rem" />
        <div className="results-header-meta">
          <span className="font-mono" style={{ fontSize: "0.6875rem", color: "var(--fg-faint)" }}>
            {state.name}
            {state.field && state.field !== "General Interest (Show me everything)" ? ` · ${state.field}` : ""}
          </span>
          <button onClick={() => goToStep(7)} className="theme-toggle">Edit</button>
        </div>
      </div>

      {/* Summary bar — stacks on mobile */}
      <div className="results-summary-bar">
        <div className="results-summary-stats font-mono">
          <span>{allPapers.length} papers</span>
          <span className="results-summary-dot">·</span>
          <span>Last {state.days} days</span>
          <span className="results-summary-dot">·</span>
          <span>{state.journals.length}+ journals</span>
          {state.aiEnhanced && (
            <>
              <span className="results-summary-dot">·</span>
              <span style={{ color: "var(--accent)" }}>AI-scored ({state.aiPapersScored})</span>
            </>
          )}
        </div>
        <div className="results-summary-tiers font-mono">
          <span>Core {coreCount}</span>
          <span>Explore {exploreCount}</span>
          <span>Discovery {discoveryCount}</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="font-mono" style={{
        display: "grid", gridTemplateColumns: "2.8rem 1fr auto",
        gap: "1rem", padding: "0.5rem 0", borderBottom: "1px solid var(--border)",
        fontSize: "0.625rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--fg-faint)",
      }}>
        <span>Score</span>
        <span>Paper</span>
        <span>Type</span>
      </div>

      {/* Paper list */}
      <div>
        {displayPapers.map((paper, index) => (
          <PaperCard key={paper.id} paper={paper} index={index} compact={showAll && index >= TOP_DISPLAY} />
        ))}
      </div>

      {/* Show more */}
      {!showAll && morePapers.length > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full font-mono mt-4"
          style={{
            fontSize: "0.75rem", padding: "0.625rem", border: "1px solid var(--border)",
            background: "transparent", color: "var(--fg-muted)", cursor: "pointer",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <ChevronDown className="inline h-3.5 w-3.5 mr-1" />
          Show {morePapers.length} more papers
        </button>
      )}

      {displayPapers.length === 0 && (
        <div className="mt-8 text-center font-mono text-sm" style={{ color: "var(--fg-muted)" }}>
          No papers found. Try adjusting your settings.
        </div>
      )}

      <div className="mt-4 flex gap-3 justify-center">
        <button onClick={() => goToStep(7)} className="btn-secondary">← Adjust</button>
        <button
          onClick={() => setShowSaveModal(true)}
          className="btn-secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
        >
          <BookOpen className="h-3 w-3" /> Save list
        </button>
        <button onClick={startOver} className="btn-ghost"><RotateCcw className="h-3 w-3" /> Start over</button>
      </div>

      {/* ── Save reading list modal ── */}
      {showSaveModal && (
        <div
          className="save-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSaveModal(false); }}
        >
          <div className="save-modal animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <VersoLogo size="1rem" />
                <p className="font-mono" style={{ marginTop: "0.25rem", fontSize: "0.6875rem", color: "var(--fg-faint)" }}>
                  reading list · {allPapers.length} papers
                </p>
              </div>
              <button
                onClick={() => setShowSaveModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-faint)", padding: "0.25rem" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <button
                onClick={handleCopy}
                className="save-modal-btn"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {copied ? <Check className="h-3.5 w-3.5" style={{ color: "var(--score-high)" }} /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied to clipboard" : "Copy reading list"}</span>
                </div>
                <span className="font-mono" style={{ fontSize: "0.625rem", color: "var(--fg-faint)" }}>Plain text</span>
              </button>

              <button
                onClick={handleDownload}
                className="save-modal-btn"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download as file</span>
                </div>
                <span className="font-mono" style={{ fontSize: "0.625rem", color: "var(--fg-faint)" }}>.md</span>
              </button>
            </div>

            <p className="font-mono" style={{
              marginTop: "1rem", fontSize: "0.625rem", color: "var(--fg-faint)",
              lineHeight: 1.5,
            }}>
              Your curated list — grouped by relevance tier, with scores, authors, and links.
            </p>
          </div>
        </div>
      )}

      <div className="font-mono" style={{
        marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "var(--fg-faint)",
      }}>
        <span>Data via OpenAlex · Scored by relevance algorithm</span>
        <VersoLogo size="0.75rem" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SHARED
// ═══════════════════════════════════════════════════════════════════════

function Nav({ onBack, onNext, nextLabel = "Continue →", nextDisabled = false }: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-8 flex justify-between items-center">
      <button onClick={onBack} className="btn-ghost">← Back</button>
      <button onClick={onNext} disabled={nextDisabled} className="btn-primary">{nextLabel}</button>
    </div>
  );
}
