/**
 * Journal Definitions for Econvery
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Organized by field and tier:
 * - Core Fields: Economics, Political Science
 * - Adjacent Fields: Psychology, Sociology, Management
 * 
 * Tier 1 = Flagship journals (highest prestige)
 * Tier 2 = Top field journals
 * Tier 3 = Excellent journals
 */

import type { Journal, JournalOptions, JournalField } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// WORKING PAPERS (Pre-prints / Cutting Edge Research)
// ═══════════════════════════════════════════════════════════════════════════

export const WORKING_PAPERS: Record<string, Journal> = {
  // NBER Working Papers - uses ISSN 0898-2937
  "NBER Working Papers": {
    name: "NBER Working Papers",
    issn: "0898-2937",
    field: "working_papers",
    tier: 1,
    altNames: [
      "National Bureau of Economic Research", 
      "NBER Working Paper Series", 
      "NBER working paper",
      "NBER",
    ],
  },
  // CEPR Discussion Papers (ISSN-L: 0265-8003, Online: 2045-6573)
  "CEPR Discussion Papers": {
    name: "CEPR Discussion Papers",
    issn: "0265-8003",
    field: "working_papers",
    tier: 1,
    altNames: [
      "Centre for Economic Policy Research",
      "CEPR Discussion Paper",
      "CEPR DP",
      "CEPR",
      "Discussion Paper Series",
      "Discussion paper series",
      "CEPR Discussion Paper Series",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ECONOMICS JOURNALS
// ═══════════════════════════════════════════════════════════════════════════

export const ECONOMICS_JOURNALS: Record<string, Journal> = {
  // Tier 1 - Top 5
  "American Economic Review": {
    name: "American Economic Review",
    issn: "0002-8282",
    field: "economics",
    tier: 1,
  },
  "Quarterly Journal of Economics": {
    name: "Quarterly Journal of Economics",
    issn: "0033-5533",
    field: "economics",
    tier: 1,
  },
  "Journal of Political Economy": {
    name: "Journal of Political Economy",
    issn: "0022-3808",
    field: "economics",
    tier: 1,
  },
  Econometrica: {
    name: "Econometrica",
    issn: "0012-9682",
    field: "economics",
    tier: 1,
  },
  "Review of Economic Studies": {
    name: "Review of Economic Studies",
    issn: "0034-6527",
    field: "economics",
    tier: 1,
  },
  // Tier 2 - Top Field
  "Journal of Finance": {
    name: "Journal of Finance",
    issn: "0022-1082",
    field: "economics",
    tier: 2,
  },
  "Review of Financial Studies": {
    name: "Review of Financial Studies",
    issn: "0893-9454",
    field: "economics",
    tier: 2,
  },
  "Journal of Financial Economics": {
    name: "Journal of Financial Economics",
    issn: "0304-405X",
    field: "economics",
    tier: 2,
  },
  "Journal of Monetary Economics": {
    name: "Journal of Monetary Economics",
    issn: "0304-3932",
    field: "economics",
    tier: 2,
  },
  "Journal of Economic Theory": {
    name: "Journal of Economic Theory",
    issn: "0022-0531",
    field: "economics",
    tier: 2,
  },
  "AEJ: Applied Economics": {
    name: "AEJ: Applied Economics",
    issn: "1945-7782",
    field: "economics",
    tier: 2,
  },
  "AEJ: Economic Policy": {
    name: "AEJ: Economic Policy",
    issn: "1945-7731",
    field: "economics",
    tier: 2,
  },
  "AEJ: Macroeconomics": {
    name: "AEJ: Macroeconomics",
    issn: "1945-7707",
    field: "economics",
    tier: 2,
  },
  "AEJ: Microeconomics": {
    name: "AEJ: Microeconomics",
    issn: "1945-7669",
    field: "economics",
    tier: 2,
  },
  "Journal of Labor Economics": {
    name: "Journal of Labor Economics",
    issn: "0734-306X",
    field: "economics",
    tier: 2,
  },
  "Journal of Public Economics": {
    name: "Journal of Public Economics",
    issn: "0047-2727",
    field: "economics",
    tier: 2,
  },
  "Journal of Human Resources": {
    name: "Journal of Human Resources",
    issn: "0022-166X",
    field: "economics",
    tier: 2,
  },
  "Journal of Economic Perspectives": {
    name: "Journal of Economic Perspectives",
    issn: "0895-3309",
    field: "economics",
    tier: 2,
  },
  // Tier 3 - Excellent
  "Review of Economics and Statistics": {
    name: "Review of Economics and Statistics",
    issn: "0034-6535",
    field: "economics",
    tier: 3,
  },
  "Journal of the European Economic Association": {
    name: "Journal of the European Economic Association",
    issn: "1542-4766",
    field: "economics",
    tier: 3,
  },
  "Economic Journal": {
    name: "Economic Journal",
    issn: "0013-0133",
    field: "economics",
    tier: 3,
  },
  "Journal of Development Economics": {
    name: "Journal of Development Economics",
    issn: "0304-3878",
    field: "economics",
    tier: 3,
  },
  "Journal of International Economics": {
    name: "Journal of International Economics",
    issn: "0022-1996",
    field: "economics",
    tier: 3,
  },
  "Journal of Economic Growth": {
    name: "Journal of Economic Growth",
    issn: "1381-4338",
    field: "economics",
    tier: 3,
  },
  "Journal of Applied Econometrics": {
    name: "Journal of Applied Econometrics",
    issn: "0883-7252",
    field: "economics",
    tier: 3,
  },
  "Journal of Business & Economic Statistics": {
    name: "Journal of Business & Economic Statistics",
    issn: "0735-0015",
    field: "economics",
    tier: 3,
  },
  "Economic Policy": {
    name: "Economic Policy",
    issn: "0266-4658",
    field: "economics",
    tier: 3,
  },
  "Journal of Economic Literature": {
    name: "Journal of Economic Literature",
    issn: "0022-0515",
    field: "economics",
    tier: 3,
  },
  "American Economic Journal: Insights": {
    name: "American Economic Journal: Insights",
    issn: "2640-205X",
    field: "economics",
    tier: 3,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// POLITICAL SCIENCE JOURNALS
// ═══════════════════════════════════════════════════════════════════════════

export const POLISCI_JOURNALS: Record<string, Journal> = {
  // Tier 1 - Top 3
  "American Political Science Review": {
    name: "American Political Science Review",
    issn: "0003-0554",
    field: "polisci",
    tier: 1,
  },
  "American Journal of Political Science": {
    name: "American Journal of Political Science",
    issn: "0092-5853",
    field: "polisci",
    tier: 1,
  },
  "Journal of Politics": {
    name: "Journal of Politics",
    issn: "0022-3816",
    field: "polisci",
    tier: 1,
  },
  // Tier 2 - Top Field
  "Quarterly Journal of Political Science": {
    name: "Quarterly Journal of Political Science",
    issn: "1554-0626",
    field: "polisci",
    tier: 2,
  },
  "British Journal of Political Science": {
    name: "British Journal of Political Science",
    issn: "0007-1234",
    field: "polisci",
    tier: 2,
  },
  "World Politics": {
    name: "World Politics",
    issn: "0043-8871",
    field: "polisci",
    tier: 2,
  },
  "Comparative Political Studies": {
    name: "Comparative Political Studies",
    issn: "0010-4140",
    field: "polisci",
    tier: 2,
  },
  "International Organization": {
    name: "International Organization",
    issn: "0020-8183",
    field: "polisci",
    tier: 2,
  },
  "Political Analysis": {
    name: "Political Analysis",
    issn: "1047-1987",
    field: "polisci",
    tier: 2,
  },
  "Annual Review of Political Science": {
    name: "Annual Review of Political Science",
    issn: "1094-2939",
    field: "polisci",
    tier: 2,
  },
  "Political Science Research and Methods": {
    name: "Political Science Research and Methods",
    issn: "2049-8470",
    field: "polisci",
    tier: 2,
  },
  "Journal of Conflict Resolution": {
    name: "Journal of Conflict Resolution",
    issn: "0022-0027",
    field: "polisci",
    tier: 2,
  },
  "International Security": {
    name: "International Security",
    issn: "0162-2889",
    field: "polisci",
    tier: 2,
  },
  // Tier 3 - Excellent
  "International Studies Quarterly": {
    name: "International Studies Quarterly",
    issn: "0020-8833",
    field: "polisci",
    tier: 3,
  },
  "Comparative Politics": {
    name: "Comparative Politics",
    issn: "0010-4159",
    field: "polisci",
    tier: 3,
  },
  "Political Behavior": {
    name: "Political Behavior",
    issn: "0190-9320",
    field: "polisci",
    tier: 3,
  },
  "Public Opinion Quarterly": {
    name: "Public Opinion Quarterly",
    issn: "0033-362X",
    field: "polisci",
    tier: 3,
  },
  "Legislative Studies Quarterly": {
    name: "Legislative Studies Quarterly",
    issn: "0362-9805",
    field: "polisci",
    tier: 3,
  },
  "European Journal of Political Research": {
    name: "European Journal of Political Research",
    issn: "0304-4130",
    field: "polisci",
    tier: 3,
  },
  "Journal of Peace Research": {
    name: "Journal of Peace Research",
    issn: "0022-3433",
    field: "polisci",
    tier: 3,
  },
  "Political Science Quarterly": {
    name: "Political Science Quarterly",
    issn: "0032-3195",
    field: "polisci",
    tier: 3,
  },
  "Perspectives on Politics": {
    name: "Perspectives on Politics",
    issn: "1537-5927",
    field: "polisci",
    tier: 3,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PSYCHOLOGY JOURNALS (Adjacent Field)
// ═══════════════════════════════════════════════════════════════════════════

export const PSYCHOLOGY_JOURNALS: Record<string, Journal> = {
  // Tier 1 - Flagship
  "Psychological Science": {
    name: "Psychological Science",
    issn: "0956-7976",
    field: "psychology",
    tier: 1,
  },
  "Journal of Personality and Social Psychology": {
    name: "Journal of Personality and Social Psychology",
    issn: "0022-3514",
    field: "psychology",
    tier: 1,
  },
  "Psychological Bulletin": {
    name: "Psychological Bulletin",
    issn: "0033-2909",
    field: "psychology",
    tier: 1,
  },
  // Tier 2 - Top Field
  "Journal of Experimental Psychology: General": {
    name: "Journal of Experimental Psychology: General",
    issn: "0096-3445",
    field: "psychology",
    tier: 2,
  },
  "Psychological Review": {
    name: "Psychological Review",
    issn: "0033-295X",
    field: "psychology",
    tier: 2,
  },
  "Annual Review of Psychology": {
    name: "Annual Review of Psychology",
    issn: "0066-4308",
    field: "psychology",
    tier: 2,
  },
  "Perspectives on Psychological Science": {
    name: "Perspectives on Psychological Science",
    issn: "1745-6916",
    field: "psychology",
    tier: 2,
  },
  "Cognition": {
    name: "Cognition",
    issn: "0010-0277",
    field: "psychology",
    tier: 2,
  },
  "Journal of Applied Psychology": {
    name: "Journal of Applied Psychology",
    issn: "0021-9010",
    field: "psychology",
    tier: 2,
  },
  // Tier 3 - Excellent
  "Psychological Methods": {
    name: "Psychological Methods",
    issn: "1082-989X",
    field: "psychology",
    tier: 3,
  },
  "Journal of Consumer Psychology": {
    name: "Journal of Consumer Psychology",
    issn: "1057-7408",
    field: "psychology",
    tier: 3,
  },
  "Organizational Behavior and Human Decision Processes": {
    name: "Organizational Behavior and Human Decision Processes",
    issn: "0749-5978",
    field: "psychology",
    tier: 3,
  },
  "Social Psychological and Personality Science": {
    name: "Social Psychological and Personality Science",
    issn: "1948-5506",
    field: "psychology",
    tier: 3,
  },
  "Judgment and Decision Making": {
    name: "Judgment and Decision Making",
    issn: "1930-2975",
    field: "psychology",
    tier: 3,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SOCIOLOGY JOURNALS (Adjacent Field)
// ═══════════════════════════════════════════════════════════════════════════

export const SOCIOLOGY_JOURNALS: Record<string, Journal> = {
  // Tier 1 - Flagship
  "American Sociological Review": {
    name: "American Sociological Review",
    issn: "0003-1224",
    field: "sociology",
    tier: 1,
  },
  "American Journal of Sociology": {
    name: "American Journal of Sociology",
    issn: "0002-9602",
    field: "sociology",
    tier: 1,
  },
  // Tier 2 - Top Field
  "Annual Review of Sociology": {
    name: "Annual Review of Sociology",
    issn: "0360-0572",
    field: "sociology",
    tier: 2,
  },
  "Social Forces": {
    name: "Social Forces",
    issn: "0037-7732",
    field: "sociology",
    tier: 2,
  },
  "Demography": {
    name: "Demography",
    issn: "0070-3370",
    field: "sociology",
    tier: 2,
  },
  "Sociological Methods & Research": {
    name: "Sociological Methods & Research",
    issn: "0049-1241",
    field: "sociology",
    tier: 2,
  },
  "Social Networks": {
    name: "Social Networks",
    issn: "0378-8733",
    field: "sociology",
    tier: 2,
  },
  // Tier 3 - Excellent
  "Sociology of Education": {
    name: "Sociology of Education",
    issn: "0038-0407",
    field: "sociology",
    tier: 3,
  },
  "Journal of Health and Social Behavior": {
    name: "Journal of Health and Social Behavior",
    issn: "0022-1465",
    field: "sociology",
    tier: 3,
  },
  "Social Problems": {
    name: "Social Problems",
    issn: "0037-7791",
    field: "sociology",
    tier: 3,
  },
  "Work and Occupations": {
    name: "Work and Occupations",
    issn: "0730-8884",
    field: "sociology",
    tier: 3,
  },
  "European Sociological Review": {
    name: "European Sociological Review",
    issn: "0266-7215",
    field: "sociology",
    tier: 3,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// MANAGEMENT JOURNALS (Adjacent Field)
// ═══════════════════════════════════════════════════════════════════════════

export const MANAGEMENT_JOURNALS: Record<string, Journal> = {
  // Tier 1 - Flagship
  "Academy of Management Journal": {
    name: "Academy of Management Journal",
    issn: "0001-4273",
    field: "management",
    tier: 1,
  },
  "Academy of Management Review": {
    name: "Academy of Management Review",
    issn: "0363-7425",
    field: "management",
    tier: 1,
  },
  "Administrative Science Quarterly": {
    name: "Administrative Science Quarterly",
    issn: "0001-8392",
    field: "management",
    tier: 1,
  },
  // Tier 2 - Top Field
  "Strategic Management Journal": {
    name: "Strategic Management Journal",
    issn: "0143-2095",
    field: "management",
    tier: 2,
  },
  "Organization Science": {
    name: "Organization Science",
    issn: "1047-7039",
    field: "management",
    tier: 2,
  },
  "Management Science": {
    name: "Management Science",
    issn: "0025-1909",
    field: "management",
    tier: 2,
  },
  "Journal of Management": {
    name: "Journal of Management",
    issn: "0149-2063",
    field: "management",
    tier: 2,
  },
  "Journal of International Business Studies": {
    name: "Journal of International Business Studies",
    issn: "0047-2506",
    field: "management",
    tier: 2,
  },
  // Tier 3 - Excellent
  "Organization Studies": {
    name: "Organization Studies",
    issn: "0170-8406",
    field: "management",
    tier: 3,
  },
  "Journal of Management Studies": {
    name: "Journal of Management Studies",
    issn: "0022-2380",
    field: "management",
    tier: 3,
  },
  "Journal of Business Ethics": {
    name: "Journal of Business Ethics",
    issn: "0167-4544",
    field: "management",
    tier: 3,
  },
  "Academy of Management Perspectives": {
    name: "Academy of Management Perspectives",
    issn: "1558-9080",
    field: "management",
    tier: 3,
  },
  "Academy of Management Annals": {
    name: "Academy of Management Annals",
    issn: "1941-6520",
    field: "management",
    tier: 3,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMBINED JOURNAL MAPS
// ═══════════════════════════════════════════════════════════════════════════

// Core fields only
export const CORE_JOURNALS: Record<string, Journal> = {
  ...ECONOMICS_JOURNALS,
  ...POLISCI_JOURNALS,
};

// Adjacent fields only
export const ADJACENT_JOURNALS: Record<string, Journal> = {
  ...PSYCHOLOGY_JOURNALS,
  ...SOCIOLOGY_JOURNALS,
  ...MANAGEMENT_JOURNALS,
};

// All journals (includes working papers)
export const ALL_JOURNALS: Record<string, Journal> = {
  ...WORKING_PAPERS,
  ...CORE_JOURNALS,
  ...ADJACENT_JOURNALS,
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getJournalsByField(field: JournalField): Record<string, Journal> {
  switch (field) {
    case "economics":
      return ECONOMICS_JOURNALS;
    case "polisci":
      return POLISCI_JOURNALS;
    case "psychology":
      return PSYCHOLOGY_JOURNALS;
    case "sociology":
      return SOCIOLOGY_JOURNALS;
    case "management":
      return MANAGEMENT_JOURNALS;
    case "working_papers":
      return WORKING_PAPERS;
  }
}

export function getWorkingPapers(): string[] {
  return Object.keys(WORKING_PAPERS);
}

export function getEconomicsJournals(): string[] {
  return Object.keys(ECONOMICS_JOURNALS);
}

export function getPolisciJournals(): string[] {
  return Object.keys(POLISCI_JOURNALS);
}

export function getPsychologyJournals(): string[] {
  return Object.keys(PSYCHOLOGY_JOURNALS);
}

export function getSociologyJournals(): string[] {
  return Object.keys(SOCIOLOGY_JOURNALS);
}

export function getManagementJournals(): string[] {
  return Object.keys(MANAGEMENT_JOURNALS);
}

export function getCoreJournals(): string[] {
  return Object.keys(CORE_JOURNALS);
}

export function getAdjacentJournals(): string[] {
  return Object.keys(ADJACENT_JOURNALS);
}

export function getAllJournals(): string[] {
  return Object.keys(ALL_JOURNALS);
}

export function isAdjacentField(field: JournalField): boolean {
  return ["psychology", "sociology", "management"].includes(field);
}

export function getJournalOptions(): JournalOptions {
  const buildTierOptions = (journals: Record<string, Journal>) => ({
    tier1: Object.entries(journals)
      .filter(([, j]) => j.tier === 1)
      .map(([name]) => name),
    tier2: Object.entries(journals)
      .filter(([, j]) => j.tier === 2)
      .map(([name]) => name),
    tier3: Object.entries(journals)
      .filter(([, j]) => j.tier === 3)
      .map(([name]) => name),
  });

  return {
    economics: buildTierOptions(ECONOMICS_JOURNALS),
    polisci: buildTierOptions(POLISCI_JOURNALS),
    psychology: buildTierOptions(PSYCHOLOGY_JOURNALS),
    sociology: buildTierOptions(SOCIOLOGY_JOURNALS),
    management: buildTierOptions(MANAGEMENT_JOURNALS),
  };
}

export function getJournalsByTier(
  field: JournalField | "core" | "adjacent" | "all",
  tiers: number[]
): string[] {
  let journals: Record<string, Journal>;

  switch (field) {
    case "economics":
    case "polisci":
    case "psychology":
    case "sociology":
    case "management":
      journals = getJournalsByField(field);
      break;
    case "core":
      journals = CORE_JOURNALS;
      break;
    case "adjacent":
      journals = ADJACENT_JOURNALS;
      break;
    case "all":
    default:
      journals = ALL_JOURNALS;
  }

  return Object.entries(journals)
    .filter(([, j]) => tiers.includes(j.tier))
    .map(([name]) => name);
}

// Cache for alt name lookups
let altNameCache: Map<string, Journal> | null = null;

function buildAltNameCache(): Map<string, Journal> {
  const cache = new Map<string, Journal>();
  for (const [name, journal] of Object.entries(ALL_JOURNALS)) {
    // Add primary name (lowercase for case-insensitive matching)
    cache.set(name.toLowerCase(), journal);
    // Add alternate names
    if (journal.altNames) {
      for (const altName of journal.altNames) {
        cache.set(altName.toLowerCase(), journal);
      }
    }
  }
  return cache;
}

/**
 * Look up a journal by name, including alternate names.
 * Case-insensitive matching.
 */
export function findJournalByName(name: string): Journal | undefined {
  // Direct lookup first (fast path)
  if (ALL_JOURNALS[name]) {
    return ALL_JOURNALS[name];
  }
  
  // Build cache if needed
  if (!altNameCache) {
    altNameCache = buildAltNameCache();
  }
  
  // Look up by lowercase name
  return altNameCache.get(name.toLowerCase());
}

export function getJournalInfo(journalName: string): Journal | undefined {
  return findJournalByName(journalName);
}

export function getJournalField(journalName: string): JournalField | undefined {
  return findJournalByName(journalName)?.field;
}

// ═══════════════════════════════════════════════════════════════════════════
// SMART JOURNAL DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps user-facing field selections to recommended journals.
 * The top-5 general journals are always included.
 * Field-specific journals are added based on the user's primary field.
 */
export const FIELD_TO_JOURNALS: Record<string, string[]> = {
  "Development Economics": [
    "Journal of Development Economics", "World Bank Economic Review",
    "Journal of the European Economic Association", "Economic Journal",
    "Journal of Human Resources", "Journal of Public Economics",
  ],
  "Labor Economics": [
    "Journal of Labor Economics", "Journal of Human Resources",
    "AEJ: Applied Economics", "Journal of Public Economics",
    "Review of Economics and Statistics",
  ],
  "Public Economics": [
    "Journal of Public Economics", "AEJ: Economic Policy",
    "Journal of Human Resources", "Review of Economics and Statistics",
    "Economic Policy", "Journal of the European Economic Association",
  ],
  "Macroeconomics": [
    "AEJ: Macroeconomics", "Journal of Monetary Economics",
    "Review of Economics and Statistics", "Journal of the European Economic Association",
  ],
  "Microeconomics": [
    "AEJ: Microeconomics", "Journal of Economic Theory",
    "Review of Economics and Statistics",
  ],
  "Financial Economics": [
    "Journal of Finance", "Review of Financial Studies",
    "Journal of Financial Economics", "Journal of Monetary Economics",
  ],
  "Econometrics": [
    "Journal of Applied Econometrics", "Journal of Business & Economic Statistics",
    "Review of Economics and Statistics",
  ],
  "International Economics": [
    "Journal of International Economics", "AEJ: Macroeconomics",
    "Journal of Monetary Economics", "Journal of the European Economic Association",
  ],
  "Industrial Organization": [
    "AEJ: Microeconomics", "Journal of Economic Theory",
  ],
  "Behavioral Economics": [
    "AEJ: Microeconomics", "AEJ: Applied Economics",
    "Journal of Economic Perspectives",
  ],
  "Health Economics": [
    "Journal of Human Resources", "AEJ: Applied Economics",
    "AEJ: Economic Policy", "Journal of Public Economics",
  ],
  "Environmental Economics": [
    "AEJ: Economic Policy", "Journal of Public Economics",
    "Journal of the European Economic Association",
  ],
  "Urban Economics": [
    "AEJ: Applied Economics", "AEJ: Economic Policy",
    "Review of Economics and Statistics",
  ],
  "Economic History": [
    "Journal of Economic Growth", "Economic Journal",
    "Journal of the European Economic Association", "Journal of Economic Perspectives",
  ],
  "Agricultural Economics": [
    "Journal of Development Economics", "AEJ: Applied Economics",
  ],
  // Political Science
  "Political Economy": [
    "AEJ: Economic Policy", "Journal of the European Economic Association",
    "Economic Policy", "Journal of Public Economics",
  ],
  "Comparative Politics": [],
  "International Relations": [],
  "American Politics": [],
  "Public Policy": [
    "AEJ: Economic Policy", "Journal of Public Economics",
    "Journal of Human Resources", "Economic Policy",
  ],
};

/**
 * Get a smart journal list based on the user's field and interests.
 * Always includes top-5 + working papers, then adds field-specific journals.
 */
export function getSmartJournalDefaults(
  primaryField: string,
  fieldType: "Economics" | "Political Science" | "Both",
  includeWorkingPapers: boolean
): string[] {
  const journals = new Set<string>();
  
  // Always include top-5 economics journals
  Object.entries(ECONOMICS_JOURNALS)
    .filter(([, j]) => j.tier === 1)
    .forEach(([name]) => journals.add(name));
  
  // Always include top-5 economics tier-2
  Object.entries(ECONOMICS_JOURNALS)
    .filter(([, j]) => j.tier === 2)
    .forEach(([name]) => journals.add(name));
  
  // Include polisci if relevant
  if (fieldType === "Political Science" || fieldType === "Both") {
    Object.entries(POLISCI_JOURNALS)
      .filter(([, j]) => j.tier <= 2)
      .forEach(([name]) => journals.add(name));
  }
  
  // Add field-specific journals
  const fieldJournals = FIELD_TO_JOURNALS[primaryField] || [];
  fieldJournals.forEach(name => journals.add(name));
  
  // Working papers
  if (includeWorkingPapers) {
    getWorkingPapers().forEach(name => journals.add(name));
  }
  
  return Array.from(journals);
}

/**
 * Get all available journals as a flat list with metadata for the journal picker.
 */
export function getAllJournalsList(): { name: string; field: JournalField; tier: number }[] {
  return Object.entries(ALL_JOURNALS).map(([name, j]) => ({
    name,
    field: j.field,
    tier: j.tier,
  }));
}
