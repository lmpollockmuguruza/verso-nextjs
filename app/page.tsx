"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Search, RotateCcw, Sparkles } from "lucide-react";
import { ProgressDots, PaperCard, Loading, MultiSelect } from "@/components";
import { getProfileOptions } from "@/lib/profile-options";
import { getJournalOptions, getJournalsByTier } from "@/lib/journals";
import type { ScoredPaper, UserProfile } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL_STEPS = 7;
const profileOptions = getProfileOptions();
const journalOptions = getJournalOptions();

// ═══════════════════════════════════════════════════════════════════════════
// STATE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

interface AppState {
  step: number;
  name: string;
  level: string;
  field: string;
  interests: string[];
  methods: string[];
  region: string;
  fieldType: "Economics" | "Political Science" | "Both";
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
  level: "PhD Student",
  field: "Labor Economics",
  interests: [],
  methods: [],
  region: "United States",
  fieldType: "Both",
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

  // Load saved state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("econvery-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only restore if not on results page
        if (parsed.step < 7) {
          setState((s) => ({ ...s, ...parsed, papers: [], summary: "" }));
        }
      } catch (e) {
        console.error("Failed to restore state:", e);
      }
    }
  }, []);

  // Save state to localStorage on changes
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

  const startOver = useCallback(() => {
    setState({ ...initialState });
    localStorage.removeItem("econvery-state");
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // API CALLS
  // ═══════════════════════════════════════════════════════════════════════════

  const discoverPapers = useCallback(async () => {
    updateState({ isLoading: true, error: null });

    try {
      // Step 1: Fetch papers from OpenAlex
      const journalsParam = state.journals.map(encodeURIComponent).join(",");
      const papersRes = await fetch(
        `/api/papers?daysBack=${state.days}&maxResults=30&journals=${journalsParam}`
      );

      if (!papersRes.ok) {
        throw new Error("Failed to fetch papers");
      }

      const papersData = await papersRes.json();

      if (!papersData.papers?.length) {
        updateState({
          isLoading: false,
          error: "No papers found. Try expanding your date range or journals.",
        });
        return;
      }

      // Step 2: Score and rank papers
      const profile: UserProfile = {
        name: state.name,
        academic_level: state.level,
        primary_field: state.field,
        interests: state.interests,
        methods: state.methods,
        region: state.region,
      };

      const recommendRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, papers: papersData.papers }),
      });

      if (!recommendRes.ok) {
        throw new Error("Failed to score papers");
      }

      const recommendData = await recommendRes.json();

      updateState({
        papers: recommendData.papers,
        summary: recommendData.summary,
        isLoading: false,
      });
    } catch (e) {
      console.error("Discovery error:", e);
      updateState({
        isLoading: false,
        error: e instanceof Error ? e.message : "Something went wrong",
      });
    }
  }, [state.journals, state.days, state.name, state.level, state.field, state.interests, state.methods, state.region, updateState]);

  // Trigger discovery when reaching step 7
  useEffect(() => {
    if (state.step === 7 && state.papers.length === 0 && !state.isLoading) {
      discoverPapers();
    }
  }, [state.step, state.papers.length, state.isLoading, discoverPapers]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return <StepWelcome state={state} updateState={updateState} nextStep={nextStep} />;
      case 2:
        return <StepLevel state={state} updateState={updateState} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <StepField state={state} updateState={updateState} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return <StepInterests state={state} updateState={updateState} nextStep={nextStep} prevStep={prevStep} />;
      case 5:
        return <StepMethods state={state} updateState={updateState} nextStep={nextStep} prevStep={prevStep} />;
      case 6:
        return <StepSources state={state} updateState={updateState} nextStep={nextStep} prevStep={prevStep} />;
      case 7:
        return <StepResults state={state} updateState={updateState} startOver={startOver} />;
      default:
        return null;
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-12">
      {renderStep()}
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface StepProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  nextStep?: () => void;
  prevStep?: () => void;
  startOver?: () => void;
}

function StepWelcome({ state, updateState, nextStep }: StepProps) {
  return (
    <div className="animate-fade-in">
      {/* Title */}
      <h1 className="text-center font-display text-display-lg font-light tracking-tight text-paper-900">
        Econvery
      </h1>
      <p className="mt-2 text-center text-lg text-paper-500">
        Discover research that matters to you.
      </p>

      <ProgressDots current={1} total={TOTAL_STEPS} />

      {/* Form */}
      <div className="mt-8">
        <p className="text-xs font-medium uppercase tracking-widest text-paper-400">
          Let's start
        </p>
        <h2 className="mt-2 font-display text-display-sm font-normal text-paper-900">
          What's your name?
        </h2>
        <p className="mt-1 text-paper-500">
          We'll personalize your experience.
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

function StepLevel({ state, updateState, nextStep, prevStep }: StepProps) {
  return (
    <div className="animate-fade-in">
      <ProgressDots current={2} total={TOTAL_STEPS} />

      <p className="text-lg text-paper-700">Nice to meet you, {state.name}.</p>

      <h2 className="mt-4 font-display text-display-sm font-normal text-paper-900">
        What's your career stage?
      </h2>
      <p className="mt-1 text-paper-500">
        This helps us calibrate recommendations.
      </p>

      <select
        value={state.level}
        onChange={(e) => updateState({ level: e.target.value })}
        className="mt-6 w-full"
      >
        {profileOptions.academic_levels.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>

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

function StepField({ state, updateState, nextStep, prevStep }: StepProps) {
  return (
    <div className="animate-fade-in">
      <ProgressDots current={3} total={TOTAL_STEPS} />

      <h2 className="font-display text-display-sm font-normal text-paper-900">
        What's your primary field?
      </h2>
      <p className="mt-1 text-paper-500">
        Choose the area closest to your research.
      </p>

      <select
        value={state.field}
        onChange={(e) => updateState({ field: e.target.value })}
        className="mt-6 w-full"
      >
        {profileOptions.primary_fields.map((field) => (
          <option key={field} value={field}>
            {field}
          </option>
        ))}
      </select>

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

function StepInterests({ state, updateState, nextStep, prevStep }: StepProps) {
  return (
    <div className="animate-fade-in">
      <ProgressDots current={4} total={TOTAL_STEPS} />

      <h2 className="font-display text-display-sm font-normal text-paper-900">
        What topics interest you?
      </h2>
      <p className="mt-1 text-paper-500">
        Select up to 5, in order of priority. First picks matter more.
      </p>

      <div className="mt-6">
        <MultiSelect
          options={profileOptions.interests}
          selected={state.interests}
          onChange={(interests) => updateState({ interests })}
          placeholder="Select research interests..."
          maxSelections={5}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={state.interests.length === 0}
          className="btn-primary flex-1"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StepMethods({ state, updateState, nextStep, prevStep }: StepProps) {
  return (
    <div className="animate-fade-in">
      <ProgressDots current={5} total={TOTAL_STEPS} />

      <h2 className="font-display text-display-sm font-normal text-paper-900">
        Preferred methodologies?
      </h2>
      <p className="mt-1 text-paper-500">
        Select up to 4 methods you care about most.
      </p>

      <div className="mt-6">
        <MultiSelect
          options={profileOptions.methods}
          selected={state.methods}
          onChange={(methods) => updateState({ methods })}
          placeholder="Select methodologies..."
          maxSelections={4}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={state.methods.length === 0}
          className="btn-primary flex-1"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StepSources({ state, updateState, nextStep, prevStep }: StepProps) {
  const getAvailableJournals = () => {
    if (state.fieldType === "Economics") {
      return [...journalOptions.economics.tier1, ...journalOptions.economics.tier2, ...journalOptions.economics.tier3];
    } else if (state.fieldType === "Political Science") {
      return [...journalOptions.polisci.tier1, ...journalOptions.polisci.tier2, ...journalOptions.polisci.tier3];
    }
    return [
      ...journalOptions.economics.tier1,
      ...journalOptions.economics.tier2,
      ...journalOptions.economics.tier3,
      ...journalOptions.polisci.tier1,
      ...journalOptions.polisci.tier2,
      ...journalOptions.polisci.tier3,
    ];
  };

  const selectTopJournals = () => {
    if (state.fieldType === "Economics") {
      updateState({ journals: journalOptions.economics.tier1 });
    } else if (state.fieldType === "Political Science") {
      updateState({ journals: journalOptions.polisci.tier1 });
    } else {
      updateState({
        journals: [
          ...journalOptions.economics.tier1.slice(0, 3),
          ...journalOptions.polisci.tier1.slice(0, 2),
        ],
      });
    }
  };

  const selectAllJournals = () => {
    updateState({ journals: getAvailableJournals() });
  };

  const groupedJournals = {
    "Top (Tier 1)":
      state.fieldType === "Economics"
        ? journalOptions.economics.tier1
        : state.fieldType === "Political Science"
          ? journalOptions.polisci.tier1
          : [...journalOptions.economics.tier1, ...journalOptions.polisci.tier1],
    "Top Field (Tier 2)":
      state.fieldType === "Economics"
        ? journalOptions.economics.tier2
        : state.fieldType === "Political Science"
          ? journalOptions.polisci.tier2
          : [...journalOptions.economics.tier2, ...journalOptions.polisci.tier2],
    "Excellent (Tier 3)":
      state.fieldType === "Economics"
        ? journalOptions.economics.tier3
        : state.fieldType === "Political Science"
          ? journalOptions.polisci.tier3
          : [...journalOptions.economics.tier3, ...journalOptions.polisci.tier3],
  };

  return (
    <div className="animate-fade-in">
      <ProgressDots current={6} total={TOTAL_STEPS} />

      <h2 className="font-display text-display-sm font-normal text-paper-900">
        Which journals?
      </h2>
      <p className="mt-1 text-paper-500">
        Choose the journals and time range to search.
      </p>

      {/* Field type selector */}
      <div className="mt-6">
        <div className="flex rounded-lg border border-paper-200 p-1">
          {(["Economics", "Political Science", "Both"] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                updateState({ fieldType: type, journals: [] });
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                state.fieldType === type
                  ? "bg-paper-900 text-white"
                  : "text-paper-600 hover:text-paper-900"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Quick select buttons */}
      <div className="mt-4 flex gap-2">
        <button onClick={selectTopJournals} className="btn-secondary flex-1 text-sm">
          Top journals
        </button>
        <button onClick={selectAllJournals} className="btn-secondary flex-1 text-sm">
          All journals
        </button>
      </div>

      {/* Journal multiselect */}
      <div className="mt-4">
        <MultiSelect
          options={getAvailableJournals()}
          selected={state.journals}
          onChange={(journals) => updateState({ journals })}
          placeholder="Select journals..."
          grouped={groupedJournals}
        />
      </div>

      {/* Time range */}
      <div className="mt-6">
        <label className="text-sm font-medium text-paper-700">
          Time range: {state.days} days
        </label>
        <input
          type="range"
          min={7}
          max={90}
          step={7}
          value={state.days}
          onChange={(e) => updateState({ days: parseInt(e.target.value, 10) })}
          className="mt-2 w-full"
        />
        <div className="mt-1 flex justify-between text-xs text-paper-400">
          <span>7 days</span>
          <span>90 days</span>
        </div>
      </div>

      {/* Region */}
      <div className="mt-6">
        <label className="text-sm font-medium text-paper-700">Region focus</label>
        <select
          value={state.region}
          onChange={(e) => updateState({ region: e.target.value })}
          className="mt-2 w-full"
        >
          {profileOptions.regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={prevStep} className="btn-secondary flex-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={state.journals.length === 0}
          className="btn-primary flex-1"
        >
          <Search className="h-4 w-4" />
          Find papers
        </button>
      </div>
    </div>
  );
}

function StepResults({ state, updateState, startOver }: StepProps) {
  const [minScore, setMinScore] = useState(1.0);

  if (state.isLoading) {
    return (
      <Loading
        message={`Finding papers for you, ${state.name}...`}
        subMessage="Searching top journals and scoring relevance"
      />
    );
  }

  if (state.error) {
    return (
      <div className="animate-fade-in text-center">
        <div className="rounded-xl bg-red-50 p-6">
          <p className="text-red-700">{state.error}</p>
        </div>
        <button onClick={startOver} className="btn-secondary mt-6">
          <RotateCcw className="h-4 w-4" />
          Start over
        </button>
      </div>
    );
  }

  const filteredPapers = state.papers.filter((p) => p.relevance_score >= minScore);
  const highRelevance = state.papers.filter((p) => p.relevance_score >= 7.0).length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <h1 className="text-center font-display text-display font-light tracking-tight text-paper-900">
        For you, {state.name}
      </h1>
      <p className="mt-2 text-center text-paper-500">{state.summary}</p>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-paper-100 p-5 text-center">
          <div className="font-display text-4xl font-light text-paper-900">
            {state.papers.length}
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-paper-500">
            Papers
          </div>
        </div>
        <div className="rounded-xl bg-paper-100 p-5 text-center">
          <div className="font-display text-4xl font-light text-paper-900">
            {highRelevance}
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-paper-500">
            Highly Relevant
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
