/**
 * Profile Options for Econvery
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Expanded configuration options supporting:
 * - Specialists AND generalists/curious learners
 * - Quantitative AND qualitative approaches
 * - Traditional academics AND industry/policy/independent researchers
 * - Core fields AND adjacent disciplines
 */

import type { ProfileOptions, ApproachPreference, GroupedOptions } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIC LEVELS (Expanded for non-traditional users)
// ═══════════════════════════════════════════════════════════════════════════

export const ACADEMIC_LEVELS = [
  // Traditional Academic Track
  "Undergraduate Student",
  "Masters Student",
  "PhD Student",
  "Postdoctoral Researcher",
  "Assistant Professor",
  "Associate Professor",
  "Full Professor",
  // Non-Academic Professional
  "Industry Researcher",
  "Data Scientist",
  "Policy Analyst",
  "Government Researcher",
  "Think Tank Researcher",
  "Consultant",
  "Journalist",
  // Non-Traditional / Generalist
  "Curious Learner",
  "STEM Professional",
  "Business Professional",
  "Entrepreneur",
  "Independent Researcher",
  "Retired Academic",
] as const;

// Categories for UI grouping
export const ACADEMIC_LEVEL_GROUPS: GroupedOptions = {
  groups: [
    {
      label: "Academic",
      options: [
        "Undergraduate Student",
        "Masters Student", 
        "PhD Student",
        "Postdoctoral Researcher",
        "Assistant Professor",
        "Associate Professor",
        "Full Professor",
      ],
    },
    {
      label: "Professional",
      options: [
        "Industry Researcher",
        "Data Scientist",
        "Policy Analyst",
        "Government Researcher",
        "Think Tank Researcher",
        "Consultant",
        "Journalist",
      ],
    },
    {
      label: "Generalist / Explorer",
      options: [
        "Curious Learner",
        "STEM Professional",
        "Business Professional",
        "Entrepreneur",
        "Independent Researcher",
        "Retired Academic",
      ],
    },
  ],
  all: [...ACADEMIC_LEVELS],
};

// ═══════════════════════════════════════════════════════════════════════════
// PRIMARY FIELDS (Expanded with generalist options)
// ═══════════════════════════════════════════════════════════════════════════

export const PRIMARY_FIELDS = [
  // Generalist Options (First for visibility)
  "General Interest (Show me everything)",
  "Interdisciplinary / Multiple Fields",
  // Economics
  "Microeconomics",
  "Macroeconomics",
  "Econometrics",
  "Labor Economics",
  "Public Economics",
  "International Economics",
  "Development Economics",
  "Financial Economics",
  "Industrial Organization",
  "Behavioral Economics",
  "Health Economics",
  "Environmental Economics",
  "Urban Economics",
  "Economic History",
  "Agricultural Economics",
  // Political Science
  "Political Economy",
  "Comparative Politics",
  "International Relations",
  "American Politics",
  "Public Policy",
  "Political Methodology",
  "Political Theory",
  "Security Studies",
  // Adjacent Fields
  "Psychology (Behavioral/Social)",
  "Sociology",
  "Management / Organization Studies",
  "Public Administration",
  "Law and Economics",
  "Demography",
] as const;

export const PRIMARY_FIELD_GROUPS: GroupedOptions = {
  groups: [
    {
      label: "Generalist",
      options: [
        "General Interest (Show me everything)",
        "Interdisciplinary / Multiple Fields",
      ],
    },
    {
      label: "Economics",
      options: [
        "Microeconomics",
        "Macroeconomics",
        "Econometrics",
        "Labor Economics",
        "Public Economics",
        "International Economics",
        "Development Economics",
        "Financial Economics",
        "Industrial Organization",
        "Behavioral Economics",
        "Health Economics",
        "Environmental Economics",
        "Urban Economics",
        "Economic History",
        "Agricultural Economics",
      ],
    },
    {
      label: "Political Science",
      options: [
        "Political Economy",
        "Comparative Politics",
        "International Relations",
        "American Politics",
        "Public Policy",
        "Political Methodology",
        "Political Theory",
        "Security Studies",
      ],
    },
    {
      label: "Adjacent Fields",
      options: [
        "Psychology (Behavioral/Social)",
        "Sociology",
        "Management / Organization Studies",
        "Public Administration",
        "Law and Economics",
        "Demography",
      ],
    },
  ],
  all: [...PRIMARY_FIELDS],
};

// ═══════════════════════════════════════════════════════════════════════════
// RESEARCH INTERESTS (Massively expanded)
// ═══════════════════════════════════════════════════════════════════════════

export const RESEARCH_INTERESTS = [
  // Methods as topics (for those interested in methodology itself)
  "Causal Inference",
  "Machine Learning / AI",
  "Experimental Methods",
  "Formal Theory / Game Theory",
  
  // Economics Topics
  "Inequality",
  "Education",
  "Housing",
  "Health",
  "Labor Markets",
  "Poverty and Welfare",
  "Taxation",
  "Trade and Globalization",
  "Monetary Policy",
  "Fiscal Policy",
  "Innovation and Technology",
  "Development",
  "Climate and Energy",
  "Agriculture and Food",
  "Finance and Banking",
  "Entrepreneurship",
  
  // Political Science Topics
  "Elections and Voting",
  "Democracy and Democratization",
  "Conflict and Security",
  "International Cooperation",
  "Political Institutions",
  "Public Opinion",
  "Political Behavior",
  "Accountability and Transparency",
  "Corruption",
  "Rule of Law",
  "State Capacity",
  "Authoritarianism",
  
  // Social / Cross-cutting Topics
  "Gender",
  "Race and Ethnicity",
  "Immigration",
  "Crime and Justice",
  "Social Mobility",
  "Social Networks",
  "Media and Information",
  "Social Media and Digital Platforms",
  "Misinformation and Fake News",
  "Trust and Social Capital",
  "Norms and Culture",
  "Religion",
  
  // Organization / Management Topics
  "Organizations and Firms",
  "Corporate Governance",
  "Leadership",
  "Decision Making",
  
  // Behavioral / Psychology Topics
  "Behavioral Biases",
  "Nudges and Choice Architecture",
  "Risk and Uncertainty",
  "Prosocial Behavior",
] as const;

export const RESEARCH_INTEREST_GROUPS: GroupedOptions = {
  groups: [
    {
      label: "Methodological Interests",
      options: [
        "Causal Inference",
        "Machine Learning / AI",
        "Experimental Methods",
        "Formal Theory / Game Theory",
      ],
    },
    {
      label: "Economic Topics",
      options: [
        "Inequality",
        "Education",
        "Housing",
        "Health",
        "Labor Markets",
        "Poverty and Welfare",
        "Taxation",
        "Trade and Globalization",
        "Monetary Policy",
        "Fiscal Policy",
        "Innovation and Technology",
        "Development",
        "Climate and Energy",
        "Agriculture and Food",
        "Finance and Banking",
        "Entrepreneurship",
      ],
    },
    {
      label: "Political Topics",
      options: [
        "Elections and Voting",
        "Democracy and Democratization",
        "Conflict and Security",
        "International Cooperation",
        "Political Institutions",
        "Public Opinion",
        "Political Behavior",
        "Accountability and Transparency",
        "Corruption",
        "Rule of Law",
        "State Capacity",
        "Authoritarianism",
      ],
    },
    {
      label: "Social Topics",
      options: [
        "Gender",
        "Race and Ethnicity",
        "Immigration",
        "Crime and Justice",
        "Social Mobility",
        "Social Networks",
        "Media and Information",
        "Social Media and Digital Platforms",
        "Misinformation and Fake News",
        "Trust and Social Capital",
        "Norms and Culture",
        "Religion",
      ],
    },
    {
      label: "Organizational / Behavioral",
      options: [
        "Organizations and Firms",
        "Corporate Governance",
        "Leadership",
        "Decision Making",
        "Behavioral Biases",
        "Nudges and Choice Architecture",
        "Risk and Uncertainty",
        "Prosocial Behavior",
      ],
    },
  ],
  all: [...RESEARCH_INTERESTS],
};

// ═══════════════════════════════════════════════════════════════════════════
// METHODOLOGIES (Split by approach type)
// ═══════════════════════════════════════════════════════════════════════════

export const QUANTITATIVE_METHODS = [
  // Causal Identification
  "Difference-in-Differences",
  "Regression Discontinuity",
  "Instrumental Variables",
  "Randomized Experiments (RCTs)",
  "Synthetic Control",
  "Bunching Estimation",
  "Event Studies",
  // Structural / Theoretical
  "Structural Models",
  "Game Theoretic Models",
  "Mechanism Design",
  // Statistical / ML
  "Machine Learning Methods",
  "Panel Data Methods",
  "Time Series Analysis",
  "Bayesian Methods",
  "Network Analysis",
  // Text / Data
  "Text Analysis / NLP",
  "Spatial Analysis / GIS",
  "Survey Experiments",
] as const;

export const QUALITATIVE_METHODS = [
  "Case Studies",
  "Comparative Historical Analysis",
  "Process Tracing",
  "Interviews",
  "Ethnography",
  "Focus Groups",
  "Content Analysis",
  "Discourse Analysis",
  "Archival Research",
  "Participant Observation",
] as const;

export const MIXED_METHODS = [
  "Meta-Analysis",
  "Systematic Review",
  "Mixed Methods Design",
  "Multi-Method Research",
  "Replication Studies",
  "Literature Review / Survey",
] as const;

// Combined for backward compatibility
export const METHODOLOGIES = [
  ...QUANTITATIVE_METHODS,
  ...QUALITATIVE_METHODS,
  ...MIXED_METHODS,
] as const;

export const METHODOLOGY_GROUPS: GroupedOptions = {
  groups: [
    {
      label: "Quantitative Methods",
      options: [...QUANTITATIVE_METHODS],
    },
    {
      label: "Qualitative Methods",
      options: [...QUALITATIVE_METHODS],
    },
    {
      label: "Mixed / Synthesis Methods",
      options: [...MIXED_METHODS],
    },
  ],
  all: [...METHODOLOGIES],
};

// ═══════════════════════════════════════════════════════════════════════════
// REGIONS
// ═══════════════════════════════════════════════════════════════════════════

export const REGIONS = [
  "Global / No Preference",
  "United States",
  "Europe",
  "United Kingdom",
  "China",
  "India",
  "Latin America",
  "Sub-Saharan Africa",
  "Middle East and North Africa",
  "Southeast Asia",
  "East Asia",
  "Central Asia",
  "Oceania",
  "Canada",
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// APPROACH PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════

export const APPROACH_PREFERENCES: { value: ApproachPreference; label: string; description: string }[] = [
  { 
    value: "no_preference", 
    label: "No Preference",
    description: "Show me all types of research"
  },
  { 
    value: "quantitative", 
    label: "Quantitative",
    description: "Statistical analysis, econometrics, experiments"
  },
  { 
    value: "qualitative", 
    label: "Qualitative",
    description: "Case studies, interviews, historical analysis"
  },
  { 
    value: "both", 
    label: "Both Equally",
    description: "I'm equally interested in both approaches"
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getProfileOptions(): ProfileOptions {
  return {
    academic_levels: [...ACADEMIC_LEVELS],
    primary_fields: [...PRIMARY_FIELDS],
    interests: [...RESEARCH_INTERESTS],
    quantitative_methods: [...QUANTITATIVE_METHODS],
    qualitative_methods: [...QUALITATIVE_METHODS],
    mixed_methods: [...MIXED_METHODS],
    regions: [...REGIONS],
    approach_preferences: APPROACH_PREFERENCES.map(({ value, label }) => ({ value, label })),
  };
}

export function getGroupedOptions() {
  return {
    academic_levels: ACADEMIC_LEVEL_GROUPS,
    primary_fields: PRIMARY_FIELD_GROUPS,
    interests: RESEARCH_INTEREST_GROUPS,
    methods: METHODOLOGY_GROUPS,
  };
}

export function isGeneralistField(field: string): boolean {
  return field === "General Interest (Show me everything)" || 
         field === "Interdisciplinary / Multiple Fields";
}

export function isGeneralistLevel(level: string): boolean {
  const generalistLevels = [
    "Curious Learner",
    "STEM Professional", 
    "Business Professional",
    "Entrepreneur",
  ];
  return generalistLevels.includes(level);
}

export function getMethodsByApproach(approach: ApproachPreference): string[] {
  switch (approach) {
    case "quantitative":
      return [...QUANTITATIVE_METHODS];
    case "qualitative":
      return [...QUALITATIVE_METHODS];
    case "both":
    case "no_preference":
    default:
      return [...METHODOLOGIES];
  }
}
