"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Search, 
  RotateCcw, 
  Sparkles,
  SkipForward,
  BookOpen,
  FlaskConical,
  Lightbulb,
  Globe
} from "lucide-react";
import { ProgressDots, PaperCard, Loading, FunLoading, MultiSelect } from "@/components";
import { 
  getProfileOptions, 
  getGroupedOptions,
  APPROACH_PREFERENCES,
  isGeneralistField,
  getMethodsByApproach
} from "@/lib/profile-options";
import { 
  getJournalOptions, 
  getCoreJournals,
  getAdjacentJournals,
  getJournalsByTier 
} from "@/lib/journals";
import type { ScoredPaper, UserProfile, ApproachPreference, JournalField } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL_STEPS = 8;
const profileOptions = getProfileOptions();
const groupedOptions = getGroupedOptions();
const journalOptions = getJournalOptions();

// ═══════════════════════════════════════════════════════════════════════════
// STATE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

interface AppState {
  step: number;
  name: string;
  level: string;
  field: string;
  approachPreference: ApproachPreference;
  interests: string[];
  methods: string[];
  region: string;
  fieldType: "Economics" | "Political Science" | "Both";
  includeAdjacentFields: boolean;
  selectedAdjacentFields: JournalField[];
  journals: string[];
  days: number;
  papers: ScoredPaper[];
  summary: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: AppState = {
  step: 1,
  name: "",
  level: "Curious Learner",
  field: "General Interest (Show me everything)",
  approachPreference: "no_preference",
  interests: [],
  methods: [],
  region: "Global / No Preference",
  fieldType: "Both",
  includeAdjacentFields: false,
  selectedAdjacentFields: [],
  journals: [],
  days: 30,
  papers: [],
  summary: "",
  isLoading: false,
  error: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("econvery-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.step < TOTAL_STEPS) {
          setState((s) => ({ ...s, ...parsed, papers: [], summary: "" }));
        }
      } catch (e) {
        console.error("Failed to restore state:", e);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    const toSave = { ...state, papers: [], summary: "", isLoading: false, error: null };
    localStorage.setItem("econvery-state", JSON.stringify(toSave));
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
    localStorage.removeItem("econvery-state");
  }, []);

  const discoverPapers = useCallback(async () => {
    updateState({ isLoading: true, error: null });

    try {
      // Build profile for API
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
      };

      // Fetch papers
      const journalParam = state.journals.length > 0 
        ? state.journals.join(",") 
        : getCoreJournals().join(",");
        
      const papersRes = await fetch(
        `/api/papers?daysBack=${state.days}&maxResults=100&journals=${encodeURIComponent(journalParam)}`
      );
      
      if (!papersRes.ok) {
        throw new Error("Failed to fetch papers");
      }

      const papersData = await papersRes.json();

      if (papersData.error) {
        throw new Error(papersData.error);
      }

      if (!papersData.papers?.length) {
        updateState({
          isLoading: false,
          error: "No papers found. Try expanding your date range or journal selection.",
        });
        return;
      }

      // Score papers
      const recommendRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, papers: papersData.papers }),
      });

      if (!recommendRes.ok) {
        throw new Error("Failed to process papers");
      }

      const recommendData = await recommendRes.json();

      updateState({
        papers: recommendData.papers,
        summary: recommendData.summary,
        isLoading: false,
      });
    } catch (err) {
      updateState({
        isLoading: false,
        error: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }, [state, updateState]);

  // Render current step
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

  return (
    <main className="min-h-screen bg-paper-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        {renderStep()}
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface StepProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  startOver: () => void;
  discoverPapers: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: WELCOME
// ─────────────────────────────────────────────────────────────────────────────

function StepWelcome({ state, updateState, nextStep }: StepProps) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-center font-display text-display-lg font-light tracking-tight text-paper-900">
        Econvery
      </h1>
      <p className="mt-2 text-center text-lg text-paper-500">
        Discover research that matters to you.
      </p>

      <ProgressDots current={1} total={TOTAL_STEPS} />

      <div className="mt-8">
        <p className="text-xs font-medium uppercase tracking-widest text-paper-400">
          Let us start
        </p>
        <h2 className="mt-2 font-display text-display-sm font-normal text-paper-900">
          What is your name?
        </h2>
        <p className="mt-1 text-paper-500">
          We will personalize your experience.
        </p>

        <input
          type="text"
          value={state.name}
          onChange={(e) => updateState({ name: e.target.value })}
          placeholder="First name"
          className="mt-6 w-full"
          autoFocus
        />

        <button
          onClick={nextStep}
          disabled={!state.name.trim()}
          className="btn-primary mt-6 w-full"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: LEVEL (with generalist-friendly options)
// ─────────────────────────────────────────────────────────────────────────────

function StepLevel({ state, updateState, nextStep, prevStep }: StepProps) {
  return (
    <div className="animate-fade-in">
      <ProgressDots current={2} total={TOTAL_STEPS} />

      <p className="text-lg text-paper-700">Nice to meet you, {state.name}.</p>

      <h2 className="mt-4 font-display text-display-sm font-normal text-paper-900">
        What best describes you?
      </h2>
      <p className="mt-1 text-paper-500">
        No academic background needed — curious minds welcome.
      </p>

      <div className="mt-6 space-y-2">
        {groupedOptions.academic_levels.groups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-paper-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.options.map((level) => (
                <button
                  key={level}
                  onClick={() => updateState({ level })}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                    state.level === level
                      ? "border-paper-900 bg-paper-900 text-white"
                      : "border-paper-200 bg-white text-paper-700 hover:border-paper-400"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button onClick={nextStep} className="btn-primary flex-1">
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: FIELD (with generalist options first)
// ─────────────────────────────────────────────────────────────────────────────

function StepField({ state, updateState, nextStep, prevStep }: StepProps) {
  const isGeneralist = isGeneralistField(state.field);
  
  return (
    <div className="animate-fade-in">
      <ProgressDots current={3} total={TOTAL_STEPS} />

      <h2 className="font-display text-display-sm font-normal text-paper-900">
        What interests you most?
      </h2>
      <p className="mt-1 text-paper-500">
        Pick a focus area, or explore broadly.
      </p>

      <div className="mt-6 space-y-4">
        {groupedOptions.primary_fields.groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-paper-400">
              {group.label}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {group.options.map((field) => (
                <button
                  key={field}
                  onClick={() => updateState({ field })}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                    state.field === field
                      ? "border-paper-900 bg-paper-900 text-white"
                      : "border-paper-200 bg-white text-paper-700 hover:border-paper-400"
                  }`}
                >
                  {field}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isGeneralist && (
        <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          <Lightbulb className="mb-1 inline h-4 w-4" />
          {" "}Great choice! We will show you quality research from across disciplines.
          You can still filter by topic if you want.
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button onClick={nextStep} className="btn-primary flex-1">
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: APPROACH PREFERENCE (Quant/Qual/Both)
// ─────────────────────────────────────────────────────────────────────────────

function StepApproach({ state, updateState, nextStep, prevStep }: StepProps) {
  return (
    <div className="animate-fade-in">
      <ProgressDots current={4} total={TOTAL_STEPS} />

      <h2 className="font-display text-display-sm font-normal text-paper-900">
        What type of research?
      </h2>
      <p className="mt-1 text-paper-500">
        This helps us surface the right methodological approaches.
      </p>

      <div className="mt-6 space-y-3">
        {APPROACH_PREFERENCES.map((pref) => (
          <button
            key={pref.value}
            onClick={() => updateState({ approachPreference: pref.value })}
            className={`w-full rounded-lg border px-4 py-4 text-left transition-all ${
              state.approachPreference === pref.value
                ? "border-paper-900 bg-paper-900 text-white"
                : "border-paper-200 bg-white text-paper-700 hover:border-paper-400"
            }`}
          >
            <div className="flex items-center gap-3">
              {pref.value === "quantitative" && <FlaskConical className="h-5 w-5" />}
              {pref.value === "qualitative" && <BookOpen className="h-5 w-5" />}
              {pref.value === "both" && <Sparkles className="h-5 w-5" />}
              {pref.value === "no_preference" && <Globe className="h-5 w-5" />}
              <div>
                <div className="font-medium">{pref.label}</div>
                <div className={`text-sm ${
                  state.approachPreference === pref.value 
                    ? "text-paper-300" 
                    : "text-paper-500"
                }`}>
                  {pref.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button onClick={nextStep} className="btn-primary flex-1">
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: INTERESTS (Optional - can skip)
// ─────────────────────────────────────────────────────────────────────────────

function StepInterests({ state, updateState, nextStep, prevStep }: StepProps) {
  const isGeneralist = isGeneralistField(state.field);
  
  return (
    <div className="animate-fade-in">
      <ProgressDots current={5} total={TOTAL_STEPS} />

      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-display-sm font-normal text-paper-900">
            Any specific topics?
          </h2>
          <p className="mt-1 text-paper-500">
            Select up to 5 topics you care about — or skip to see everything.
          </p>
        </div>
        <span className="rounded-full bg-paper-100 px-2 py-1 text-xs text-paper-500">
          Optional
        </span>
      </div>

      <div className="mt-6">
        <MultiSelect
          options={profileOptions.interests}
          selected={state.interests}
          onChange={(interests) => updateState({ interests })}
          placeholder="Search topics..."
          maxSelections={5}
          groups={groupedOptions.interests.groups}
        />
      </div>

      {state.interests.length > 0 && (
        <p className="mt-3 text-sm text-paper-500">
          First selections are weighted more heavily in results.
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {state.interests.length === 0 ? (
          <button onClick={nextStep} className="btn-secondary flex-1">
            Skip for now
            <SkipForward className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={nextStep} className="btn-primary flex-1">
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {isGeneralist && state.interests.length === 0 && (
        <p className="mt-4 text-center text-sm text-paper-400">
          As a generalist, skipping is fine — you will see quality papers from across fields.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6: METHODS (Optional - can skip, filtered by approach)
// ─────────────────────────────────────────────────────────────────────────────

function StepMethods({ state, updateState, nextStep, prevStep }: StepProps) {
  const availableMethods = getMethodsByApproach(state.approachPreference);
  
  return (
    <div className="animate-fade-in">
      <ProgressDots current={6} total={TOTAL_STEPS} />

      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-display-sm font-normal text-paper-900">
            Preferred methodologies?
          </h2>
          <p className="mt-1 text-paper-500">
            Select up to 4 methods — or skip if you are open to all.
          </p>
        </div>
        <span className="rounded-full bg-paper-100 px-2 py-1 text-xs text-paper-500">
          Optional
        </span>
      </div>

      <div className="mt-6">
        <MultiSelect
          options={availableMethods}
          selected={state.methods}
          onChange={(methods) => updateState({ methods })}
          placeholder="Search methods..."
          maxSelections={4}
          groups={groupedOptions.methods.groups}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {state.methods.length === 0 ? (
          <button onClick={nextStep} className="btn-secondary flex-1">
            Skip for now
            <SkipForward className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={nextStep} className="btn-primary flex-1">
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: SOURCES (Journals, time range, adjacent fields)
// ─────────────────────────────────────────────────────────────────────────────

function StepSources({ state, updateState, nextStep, prevStep, discoverPapers }: StepProps) {
  const [showAdjacentOptions, setShowAdjacentOptions] = useState(state.includeAdjacentFields);
  
  const setFieldType = (type: "Economics" | "Political Science" | "Both") => {
    updateState({ fieldType: type });
    
    // Auto-select tier 1 & 2 journals
    let selected: string[] = [];
    if (type === "Economics" || type === "Both") {
      selected = [...selected, ...journalOptions.economics.tier1, ...journalOptions.economics.tier2];
    }
    if (type === "Political Science" || type === "Both") {
      selected = [...selected, ...journalOptions.polisci.tier1, ...journalOptions.polisci.tier2];
    }
    updateState({ journals: selected });
  };

  const toggleAdjacentField = (field: JournalField) => {
    const current = state.selectedAdjacentFields;
    const updated = current.includes(field)
      ? current.filter(f => f !== field)
      : [...current, field];
    
    updateState({ 
      selectedAdjacentFields: updated,
      includeAdjacentFields: updated.length > 0
    });
    
    // Add/remove adjacent journals
    if (updated.includes(field)) {
      const adjacentJournals = getJournalsByTier(field, [1, 2]);
      updateState({ journals: [...state.journals, ...adjacentJournals] });
    } else {
      const toRemove = new Set(getJournalsByTier(field, [1, 2, 3]));
      updateState({ journals: state.journals.filter(j => !toRemove.has(j)) });
    }
  };

  const handleDiscover = async () => {
    await discoverPapers();
    nextStep();
  };

  return (
    <div className="animate-fade-in">
      <ProgressDots current={7} total={TOTAL_STEPS} />

      <h2 className="font-display text-display-sm font-normal text-paper-900">
        Where to look?
      </h2>
      <p className="mt-1 text-paper-500">
        Choose journals, time range, and optional related fields.
      </p>

      {/* Field Selection */}
      <div className="mt-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-paper-400">
          Core Fields
        </p>
        <div className="flex gap-2">
          {(["Economics", "Political Science", "Both"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFieldType(type)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-all ${
                state.fieldType === type
                  ? "border-paper-900 bg-paper-900 text-white"
                  : "border-paper-200 bg-white text-paper-700 hover:border-paper-400"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Adjacent Fields Toggle */}
      <div className="mt-6">
        <button
          onClick={() => setShowAdjacentOptions(!showAdjacentOptions)}
          className="text-sm text-paper-600 hover:text-paper-900"
        >
          {showAdjacentOptions ? "▼" : "▶"} Include related fields (Psychology, Sociology, Management)
        </button>
        
        {showAdjacentOptions && (
          <div className="mt-3 space-y-2">
            {(["psychology", "sociology", "management"] as JournalField[]).map((field) => (
              <label key={field} className="flex items-center gap-3 rounded-lg border border-paper-200 bg-white p-3">
                <input
                  type="checkbox"
                  checked={state.selectedAdjacentFields.includes(field)}
                  onChange={() => toggleAdjacentField(field)}
                  className="h-4 w-4 rounded border-paper-300"
                />
                <span className="text-sm capitalize">{field}</span>
                <span className="text-xs text-paper-400">
                  ({journalOptions[field].tier1.length + journalOptions[field].tier2.length} journals)
                </span>
              </label>
            ))}
            <p className="text-xs text-paper-500">
              Related field papers may score slightly lower but can still rank highly if very relevant.
            </p>
          </div>
        )}
      </div>

      {/* Time Range */}
      <div className="mt-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-paper-400">
          Time Range
        </p>
        <input
          type="range"
          min={7}
          max={90}
          step={7}
          value={state.days}
          onChange={(e) => updateState({ days: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-paper-500">
          <span>Last {state.days} days</span>
          <span>{state.days === 7 ? "1 week" : state.days === 30 ? "1 month" : `${Math.round(state.days / 7)} weeks`}</span>
        </div>
      </div>

      {/* Journal Count Summary */}
      <div className="mt-4 rounded-lg bg-paper-100 p-3 text-sm text-paper-600">
        <Search className="mr-2 inline h-4 w-4" />
        Searching {state.journals.length} journals
        {state.selectedAdjacentFields.length > 0 && (
          <span> (including {state.selectedAdjacentFields.length} related fields)</span>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleDiscover}
          disabled={state.journals.length === 0}
          className="btn-primary flex-1"
        >
          <Sparkles className="h-4 w-4" />
          Discover Papers
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8: RESULTS
// ─────────────────────────────────────────────────────────────────────────────

function StepResults({ state, updateState, startOver, discoverPapers, goToStep }: StepProps) {
  const [minScore, setMinScore] = useState(1.0);

  // Handle loading state
  if (state.isLoading) {
    return (
      <div className="animate-fade-in">
        <FunLoading userName={state.name} />
      </div>
    );
  }

  // Handle error state
  if (state.error) {
    return (
      <div className="animate-fade-in text-center">
        <p className="text-lg text-paper-700">{state.error}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => goToStep(7)} className="btn-secondary flex-1">
            <ArrowLeft className="h-4 w-4" />
            Adjust Settings
          </button>
          <button onClick={() => discoverPapers()} className="btn-primary flex-1">
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Handle empty results
  if (!state.papers.length) {
    discoverPapers();
    return (
      <div className="animate-fade-in">
        <FunLoading userName={state.name} />
      </div>
    );
  }

  const filteredPapers = state.papers.filter((p) => p.relevance_score >= minScore);
  const highCount = state.papers.filter((p) => p.relevance_score >= 7.0).length;
  const hasFilters = state.interests.length > 0 || state.methods.length > 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <h1 className="text-center font-display text-display-lg font-light text-paper-900">
        For you, {state.name}
      </h1>
      <p className="mt-2 text-center text-paper-500">{state.summary}</p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-paper-100 p-4 text-center">
          <div className="font-display text-3xl font-light text-paper-900">
            {state.papers.length}
          </div>
          <div className="text-xs uppercase tracking-wider text-paper-500">
            Papers
          </div>
        </div>
        <div className="rounded-xl bg-paper-100 p-4 text-center">
          <div className="font-display text-3xl font-light text-paper-900">
            {highCount}
          </div>
          <div className="text-xs uppercase tracking-wider text-paper-500">
            {hasFilters ? "Highly Relevant" : "Top Quality"}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mt-6">
        <label className="text-sm font-medium text-paper-700">
          Minimum relevance: {minScore.toFixed(1)}
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={minScore}
          onChange={(e) => setMinScore(parseFloat(e.target.value))}
          className="mt-2 w-full"
        />
      </div>

      {/* Start over button */}
      <button onClick={startOver} className="btn-secondary mt-6 w-full">
        <RotateCcw className="h-4 w-4" />
        Start over
      </button>

      {/* Paper list */}
      <div className="mt-8 space-y-4 stagger-children">
        {filteredPapers.map((paper, index) => (
          <PaperCard key={paper.id} paper={paper} index={index} />
        ))}
      </div>

      {filteredPapers.length === 0 && (
        <div className="mt-8 text-center text-paper-500">
          No papers match your current filter. Try lowering the minimum relevance.
        </div>
      )}
    </div>
  );
}
