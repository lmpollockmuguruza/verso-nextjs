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
  Globe,
  Brain,
  Key,
  CheckCircle,
  AlertCircle,
  ExternalLink
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
  getJournalsByTier,
  getWorkingPapers
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
  includeWorkingPapers: boolean;
  includeAdjacentFields: boolean;
  selectedAdjacentFields: JournalField[];
  journals: string[];
  days: number;
  papers: ScoredPaper[];
  summary: string;
  isLoading: boolean;
  error: string | null;
  // AI enhancement
  geminiApiKey: string;
  geminiModel: string;
  aiEnabled: boolean;
  aiKeyValid: boolean | null; // null = not yet validated
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
  // AI enhancement
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
    const toSave = { 
      ...state, 
      papers: [], summary: "", isLoading: false, error: null,
      aiReranking: false, aiEnhanced: false, aiPapersScored: 0, aiError: null,
      aiKeyValidating: false,
    };
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
    updateState({ isLoading: true, error: null, aiEnhanced: false, aiError: null, aiPapersScored: 0 });

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

      // Score papers (taxonomy-based)
      const recommendRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, papers: papersData.papers }),
      });

      if (!recommendRes.ok) {
        throw new Error("Failed to process papers");
      }

      const recommendData = await recommendRes.json();
      let finalPapers = recommendData.papers;
      let aiEnhanced = false;
      let aiPapersScored = 0;
      let aiError: string | null = null;

      // AI Reranking step (if enabled and key is valid)
      if (state.aiEnabled && state.geminiApiKey && state.aiKeyValid) {
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

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            if (aiData.aiEnhanced) {
              finalPapers = aiData.papers;
              aiEnhanced = true;
              aiPapersScored = aiData.aiPapersScored || 0;
            }
            if (aiData.error) {
              aiError = aiData.error;
            }
          }
        } catch (err) {
          aiError = err instanceof Error ? err.message : "AI reranking failed";
          console.warn("AI reranking failed:", err);
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
  
  // Helper to build journal list based on current selections
  const buildJournalList = (
    fieldType: "Economics" | "Political Science" | "Both",
    includeWPs: boolean,
    adjacentFields: JournalField[]
  ) => {
    let selected: string[] = [];
    
    // Add working papers if enabled
    if (includeWPs) {
      selected = [...selected, ...getWorkingPapers()];
    }
    
    // Add core field journals
    if (fieldType === "Economics" || fieldType === "Both") {
      selected = [...selected, ...journalOptions.economics.tier1, ...journalOptions.economics.tier2];
    }
    if (fieldType === "Political Science" || fieldType === "Both") {
      selected = [...selected, ...journalOptions.polisci.tier1, ...journalOptions.polisci.tier2];
    }
    
    // Add adjacent fields
    for (const field of adjacentFields) {
      const adjacentJournals = getJournalsByTier(field, [1, 2]);
      selected = [...selected, ...adjacentJournals];
    }
    
    return selected;
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
    const updated = current.includes(field)
      ? current.filter(f => f !== field)
      : [...current, field];
    
    updateState({ 
      selectedAdjacentFields: updated,
      includeAdjacentFields: updated.length > 0
    });
    
    const journals = buildJournalList(state.fieldType, state.includeWorkingPapers, updated);
    updateState({ journals });
  };

  const handleDiscover = () => {
    // Move to results page immediately to show loading screen
    nextStep();
    // Then start fetching (async, will update state when done)
    discoverPapers();
  };
  
  // Initialize journals on first render if empty
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (state.journals.length === 0) {
      const journals = buildJournalList(state.fieldType, state.includeWorkingPapers, state.selectedAdjacentFields);
      updateState({ journals });
    }
  }, []);

  const workingPaperCount = getWorkingPapers().length;

  return (
    <div className="animate-fade-in">
      <ProgressDots current={7} total={TOTAL_STEPS} />

      <h2 className="font-display text-display-sm font-normal text-paper-900">
        Where to look?
      </h2>
      <p className="mt-1 text-paper-500">
        Choose journals, time range, and optional related fields.
      </p>

      {/* Working Papers Toggle */}
      <div className="mt-6">
        <label className="flex items-center gap-3 rounded-lg border-2 border-amber-200 bg-amber-50 p-3 cursor-pointer hover:border-amber-300 transition-colors">
          <input
            type="checkbox"
            checked={state.includeWorkingPapers}
            onChange={toggleWorkingPapers}
            className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
          />
          <div className="flex-1">
            <span className="font-medium text-amber-900">Working Papers</span>
            <span className="ml-2 text-xs text-amber-700">(NBER, CEPR)</span>
          </div>
          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
            Cutting-edge
          </span>
        </label>
        <p className="mt-1 text-xs text-paper-500">
          Pre-publication research from top economists. Often 6-18 months ahead of journal publication.
        </p>
      </div>

      {/* Field Selection */}
      <div className="mt-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-paper-400">
          Published Journals
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
                  ({journalOptions[field as keyof typeof journalOptions]?.tier1.length + journalOptions[field as keyof typeof journalOptions]?.tier2.length} journals)
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

      {/* AI Enhancement Section */}
      <div className="mt-6">
        <button
          onClick={() => updateState({ aiEnabled: !state.aiEnabled })}
          className={`w-full flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
            state.aiEnabled 
              ? "border-purple-300 bg-purple-50 hover:border-purple-400" 
              : "border-paper-200 bg-white hover:border-paper-300"
          }`}
        >
          <Brain className={`h-5 w-5 ${state.aiEnabled ? "text-purple-600" : "text-paper-400"}`} />
          <div className="flex-1 text-left">
            <span className={`font-medium ${state.aiEnabled ? "text-purple-900" : "text-paper-700"}`}>
              AI-Enhanced Recommendations
            </span>
            <span className="ml-2 text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
              Free
            </span>
          </div>
          <div className={`h-5 w-9 rounded-full transition-colors ${state.aiEnabled ? "bg-purple-500" : "bg-paper-300"}`}>
            <div className={`h-4 w-4 mt-0.5 rounded-full bg-white transition-transform ${state.aiEnabled ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
          </div>
        </button>
        
        {state.aiEnabled && (
          <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-3">
            <p className="text-sm text-purple-800">
              Uses Google Gemini AI to understand semantic connections between papers and your interests, 
              catching nuances that keyword matching misses.
            </p>
            
            <div>
              <label className="text-xs font-medium text-purple-700 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" />
                Gemini API Key
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="password"
                  value={state.geminiApiKey}
                  onChange={(e) => updateState({ 
                    geminiApiKey: e.target.value, 
                    aiKeyValid: null,
                    aiError: null 
                  })}
                  placeholder="Paste your API key here"
                  className="flex-1 text-sm rounded-lg border border-purple-200 px-3 py-2 bg-white focus:border-purple-400 focus:ring-purple-400"
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
                      updateState({ 
                        aiKeyValid: data.valid, 
                        aiKeyValidating: false,
                        aiError: data.valid ? null : data.error 
                      });
                    } catch {
                      updateState({ aiKeyValid: false, aiKeyValidating: false, aiError: "Connection failed" });
                    }
                  }}
                  disabled={!state.geminiApiKey.trim() || state.aiKeyValidating}
                  className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {state.aiKeyValidating ? "..." : "Test"}
                </button>
              </div>
              
              {state.aiKeyValid === true && (
                <p className="mt-1.5 text-xs text-green-700 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Key is valid — AI enhancement is active
                </p>
              )}
              {state.aiKeyValid === false && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {state.aiError || "Invalid key"}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-xs font-medium text-purple-700">Model</label>
              <select
                value={state.geminiModel}
                onChange={(e) => updateState({ geminiModel: e.target.value, aiKeyValid: null, aiError: null })}
                className="mt-1 w-full text-sm rounded-lg border border-purple-200 px-3 py-2 bg-white focus:border-purple-400 focus:ring-purple-400"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (recommended)</option>
                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
              <p className="mt-1 text-xs text-purple-500">
                If you get a quota error, try a different model — free tier limits vary.
              </p>
            </div>
            
            <div className="rounded-lg bg-white/70 p-3 text-xs text-purple-700 space-y-1.5">
              <p className="font-medium">How to get a free API key (takes 1 minute):</p>
              <ol className="list-decimal list-inside space-y-1 text-purple-600">
                <li>Go to <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-800 inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="h-3 w-3" /></a></li>
                <li>Sign in with any Google account</li>
                <li>Click <strong>&quot;Get API key&quot;</strong> in the left sidebar</li>
                <li>Click <strong>&quot;Create API key&quot;</strong> → select or create a project</li>
                <li>Copy and paste the key above</li>
              </ol>
              <p className="text-purple-500 mt-1">No credit card required. Free tier: ~1,500 requests/day.</p>
            </div>
          </div>
        )}
      </div>

      {/* Journal Count Summary */}
      <div className="mt-4 rounded-lg bg-paper-100 p-3 text-sm text-paper-600">
        <Search className="mr-2 inline h-4 w-4" />
        Searching {state.journals.length} sources
        {state.includeWorkingPapers && (
          <span className="text-amber-700"> (incl. working papers)</span>
        )}
        {state.selectedAdjacentFields.length > 0 && (
          <span> + {state.selectedAdjacentFields.length} related fields</span>
        )}
        {state.aiEnabled && state.aiKeyValid && (
          <span className="text-purple-600"> + AI reranking</span>
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
        {state.aiReranking && (
          <p className="mt-4 text-center text-sm text-purple-600 flex items-center justify-center gap-2">
            <Brain className="h-4 w-4 animate-pulse" />
            AI is analyzing paper relevance...
          </p>
        )}
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

  // Handle empty results (user hasn't loaded papers yet)
  if (!state.papers.length && !state.isLoading) {
    return (
      <div className="animate-fade-in">
        <FunLoading userName={state.name} />
        <div className="mt-6 text-center">
          <button onClick={() => discoverPapers()} className="btn-primary">
            <Sparkles className="h-4 w-4" />
            Load Papers
          </button>
        </div>
      </div>
    );
  }
  
  // Handle loading in progress
  if (!state.papers.length && state.isLoading) {
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

      {/* AI Enhancement Badge */}
      {state.aiEnhanced && (
        <div className="mt-3 mx-auto flex items-center justify-center gap-2 rounded-full bg-purple-50 border border-purple-200 px-4 py-1.5 w-fit">
          <Brain className="h-4 w-4 text-purple-600" />
          <span className="text-xs font-medium text-purple-700">
            AI-enhanced · {state.aiPapersScored} papers re-ranked by Gemini
          </span>
        </div>
      )}
      {state.aiError && !state.aiEnhanced && state.aiEnabled && (
        <div className="mt-3 mx-auto flex items-center justify-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 w-fit">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="text-xs text-amber-700">
            AI enhancement unavailable: {state.aiError}
          </span>
        </div>
      )}

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
