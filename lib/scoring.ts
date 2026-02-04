/**
 * Relevance Scoring Engine for Econvery (v2)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * DESIGN PHILOSOPHY: ADDITIVE BASELINE MODEL
 * ------------------------------------------
 * Every paper starts with a meaningful baseline score (based on quality).
 * Matching user interests/methods ADDS to this baseline.
 * This ensures:
 *   - No paper is perpetually disadvantaged (all have a floor)
 *   - Empty interests/methods don't penalize papers
 *   - Diverse papers can surface for generalists
 *   - Specific interests still boost relevant papers for specialists
 * 
 * SCORING COMPONENTS
 * ------------------
 * 1. BASELINE (Quality Signals) - 3.0 to 5.0 base
 *    - Journal tier
 *    - Citation count (age-adjusted)
 *    
 * 2. TOPIC RELEVANCE (Additive Bonus) - 0 to 3.0
 *    - OpenAlex concept matching
 *    - Keyword matching in title/abstract
 *    - Field alignment
 *    
 * 3. METHOD RELEVANCE (Additive Bonus) - 0 to 2.0
 *    - Methodology detection
 *    - Approach alignment (quant/qual/both)
 *    
 * SCORE INTERPRETATION
 * --------------------
 * - 8.5-10.0: Excellent match — strong relevance + high quality
 * - 7.0-8.4:  Very relevant — good match on multiple dimensions
 * - 5.5-6.9:  Relevant — decent quality, some topical alignment
 * - 4.0-5.4:  Worth exploring — quality paper, tangential to interests
 * - 2.0-3.9:  Lower relevance — may still be interesting
 */

import type { 
  KeywordEntry, 
  MatchScore, 
  Paper, 
  ScoredPaper, 
  UserProfile,
  JournalField 
} from "./types";
import { ALL_JOURNALS, isAdjacentField } from "./journals";
import { isGeneralistField, isGeneralistLevel } from "./profile-options";

// ═══════════════════════════════════════════════════════════════════════════
// CONCEPT MAPPING (User interests → OpenAlex concepts)
// ═══════════════════════════════════════════════════════════════════════════

export const INTEREST_TO_CONCEPTS: Record<string, string[]> = {
  // Methodological Interests
  "Causal Inference": [
    "causal inference", "causality", "treatment effect", "instrumental variable",
    "regression discontinuity", "natural experiment", "randomized experiment",
    "econometrics", "identification", "endogeneity"
  ],
  "Machine Learning / AI": [
    "machine learning", "artificial intelligence", "deep learning",
    "neural network", "prediction", "statistical learning", "data science",
    "algorithm", "supervised learning", "unsupervised learning"
  ],
  "Experimental Methods": [
    "randomized controlled trial", "field experiment", "randomized experiment",
    "experimental economics", "rct", "experiment", "lab experiment"
  ],
  "Formal Theory / Game Theory": [
    "game theory", "mechanism design", "auction", "matching", "bargaining",
    "strategic interaction", "equilibrium", "nash", "incentive", "contract theory"
  ],
  
  // Economic Topics
  "Inequality": [
    "inequality", "income distribution", "wealth distribution",
    "economic inequality", "income inequality", "social mobility",
    "poverty", "redistribution", "gini"
  ],
  "Education": [
    "education economics", "education", "human capital", "school",
    "student achievement", "higher education", "returns to education",
    "teacher", "college", "learning"
  ],
  "Housing": [
    "housing", "real estate", "housing market", "rent", "mortgage",
    "urban economics", "housing policy", "homeownership", "zoning"
  ],
  "Health": [
    "health economics", "healthcare", "public health", "mortality",
    "health insurance", "epidemiology", "medical", "hospital", "disease"
  ],
  "Labor Markets": [
    "labor market", "labor economics", "employment", "unemployment",
    "wage", "job search", "labor supply", "labor demand", "minimum wage"
  ],
  "Poverty and Welfare": [
    "poverty", "welfare", "social protection", "transfer program",
    "food stamps", "social assistance", "safety net", "aid"
  ],
  "Taxation": [
    "taxation", "tax policy", "income tax", "tax evasion",
    "optimal taxation", "tax incidence", "corporate tax", "public finance"
  ],
  "Trade and Globalization": [
    "international trade", "trade policy", "globalization", "tariff",
    "trade agreement", "export", "import", "comparative advantage"
  ],
  "Monetary Policy": [
    "monetary policy", "central bank", "interest rate", "inflation",
    "money supply", "federal reserve", "monetary economics", "banking"
  ],
  "Fiscal Policy": [
    "fiscal policy", "government spending", "taxation", "public debt",
    "budget deficit", "stimulus", "public finance"
  ],
  "Innovation and Technology": [
    "innovation", "technological change", "patent", "r&d",
    "entrepreneurship", "productivity", "technology", "startup"
  ],
  "Development": [
    "development economics", "economic development", "poverty",
    "developing country", "foreign aid", "microfinance", "growth"
  ],
  "Climate and Energy": [
    "climate change", "climate economics", "environmental economics",
    "energy economics", "carbon", "renewable energy", "emissions",
    "pollution", "sustainability"
  ],
  "Agriculture and Food": [
    "agriculture", "food security", "farm", "crop", "rural",
    "agricultural economics", "food policy", "land"
  ],
  "Finance and Banking": [
    "finance", "banking", "financial markets", "credit", "investment",
    "asset pricing", "stock market", "financial crisis"
  ],
  "Entrepreneurship": [
    "entrepreneur", "startup", "small business", "venture capital",
    "firm formation", "business creation"
  ],
  
  // Political Topics
  "Elections and Voting": [
    "election", "voting", "political economy", "voter turnout",
    "electoral", "democracy", "political participation", "campaign"
  ],
  "Democracy and Democratization": [
    "democracy", "democratization", "democratic transition", "regime",
    "political liberalization", "civil liberties", "political freedom"
  ],
  "Conflict and Security": [
    "conflict", "war", "civil war", "political violence",
    "security", "peace", "military", "international relations"
  ],
  "International Cooperation": [
    "international cooperation", "international organization", "treaty",
    "multilateral", "foreign policy", "diplomacy", "alliance"
  ],
  "Political Institutions": [
    "institution", "constitution", "legislature", "executive",
    "judiciary", "bureaucracy", "federalism", "decentralization"
  ],
  "Public Opinion": [
    "public opinion", "survey", "polling", "attitude", "belief",
    "political attitudes", "opinion formation"
  ],
  "Political Behavior": [
    "political behavior", "political participation", "protest",
    "social movement", "collective action", "civic engagement"
  ],
  "Accountability and Transparency": [
    "accountability", "transparency", "oversight", "audit",
    "monitoring", "information disclosure", "freedom of information"
  ],
  "Corruption": [
    "corruption", "bribery", "rent-seeking", "clientelism",
    "patronage", "anti-corruption", "integrity"
  ],
  "Rule of Law": [
    "rule of law", "legal system", "court", "judicial",
    "law enforcement", "property rights", "contract enforcement"
  ],
  "State Capacity": [
    "state capacity", "state building", "governance", "public administration",
    "bureaucratic capacity", "fiscal capacity", "institutional capacity"
  ],
  "Authoritarianism": [
    "authoritarianism", "autocracy", "dictatorship", "authoritarian",
    "repression", "censorship", "political control"
  ],
  
  // Social Topics
  "Gender": [
    "gender", "gender economics", "gender gap", "discrimination",
    "female labor", "wage gap", "women", "family economics"
  ],
  "Race and Ethnicity": [
    "race", "ethnicity", "racial", "ethnic", "discrimination",
    "minority", "segregation", "diversity"
  ],
  "Immigration": [
    "immigration", "migration", "immigrant", "refugee",
    "labor migration", "international migration", "asylum"
  ],
  "Crime and Justice": [
    "crime", "criminal justice", "law enforcement", "prison",
    "incarceration", "policing", "recidivism", "law and economics"
  ],
  "Social Mobility": [
    "social mobility", "intergenerational mobility", "economic mobility",
    "income mobility", "opportunity", "inequality"
  ],
  "Social Networks": [
    "social network", "network", "peer effect", "social connection",
    "network analysis", "social capital", "ties"
  ],
  "Media and Information": [
    "media", "news", "journalism", "information", "press",
    "media effects", "information transmission", "communication"
  ],
  "Social Media and Digital Platforms": [
    "social media", "platform", "facebook", "twitter", "online",
    "digital", "internet", "technology platform"
  ],
  "Misinformation and Fake News": [
    "misinformation", "disinformation", "fake news", "fact-checking",
    "media literacy", "propaganda", "rumor"
  ],
  "Trust and Social Capital": [
    "trust", "social capital", "social cohesion", "cooperation",
    "civic participation", "community"
  ],
  "Norms and Culture": [
    "norm", "culture", "social norm", "cultural", "tradition",
    "values", "beliefs", "customs"
  ],
  "Religion": [
    "religion", "religious", "church", "faith", "islam",
    "christianity", "secularization", "spirituality"
  ],
  
  // Organizational / Behavioral Topics
  "Organizations and Firms": [
    "organization", "firm", "company", "corporate", "business",
    "management", "organizational behavior"
  ],
  "Corporate Governance": [
    "corporate governance", "board", "shareholder", "executive compensation",
    "CEO", "ownership", "agency"
  ],
  "Leadership": [
    "leadership", "leader", "manager", "management", "executive",
    "decision-making", "authority"
  ],
  "Decision Making": [
    "decision making", "choice", "judgment", "cognitive",
    "heuristic", "bounded rationality"
  ],
  "Behavioral Biases": [
    "bias", "behavioral", "cognitive bias", "framing",
    "anchoring", "overconfidence", "prospect theory"
  ],
  "Nudges and Choice Architecture": [
    "nudge", "choice architecture", "behavioral intervention",
    "default", "libertarian paternalism", "behavioral policy"
  ],
  "Risk and Uncertainty": [
    "risk", "uncertainty", "risk aversion", "insurance",
    "probability", "expected utility"
  ],
  "Prosocial Behavior": [
    "prosocial", "altruism", "cooperation", "charitable",
    "donation", "volunteering", "helping"
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// FIELD TO CONCEPTS MAPPING
// ═══════════════════════════════════════════════════════════════════════════

export const FIELD_TO_CONCEPTS: Record<string, string[]> = {
  // Generalist
  "General Interest (Show me everything)": [],
  "Interdisciplinary / Multiple Fields": [],
  
  // Economics
  "Microeconomics": ["microeconomics", "consumer behavior", "market", "game theory", "industrial organization", "welfare economics"],
  "Macroeconomics": ["macroeconomics", "economic growth", "business cycle", "monetary economics", "gdp", "inflation"],
  "Econometrics": ["econometrics", "statistical method", "causal inference", "estimation", "regression"],
  "Labor Economics": ["labor economics", "wage", "employment", "human capital", "labor market", "unemployment"],
  "Public Economics": ["public economics", "taxation", "public finance", "government", "welfare", "redistribution"],
  "International Economics": ["international economics", "international trade", "exchange rate", "globalization", "tariff"],
  "Development Economics": ["development economics", "poverty", "economic development", "foreign aid", "microfinance"],
  "Financial Economics": ["finance", "financial economics", "asset pricing", "banking", "stock market", "credit"],
  "Industrial Organization": ["industrial organization", "competition", "antitrust", "market structure", "monopoly"],
  "Behavioral Economics": ["behavioral economics", "psychology", "decision making", "bounded rationality", "bias"],
  "Health Economics": ["health economics", "healthcare", "health insurance", "medical", "mortality"],
  "Environmental Economics": ["environmental economics", "climate", "pollution", "energy", "carbon"],
  "Urban Economics": ["urban economics", "housing", "city", "real estate", "agglomeration", "rent"],
  "Economic History": ["economic history", "history", "historical economics", "long run"],
  "Agricultural Economics": ["agricultural economics", "agriculture", "farm", "food", "rural"],
  
  // Political Science
  "Political Economy": ["political economy", "institution", "democracy", "political economics", "voting"],
  "Comparative Politics": ["comparative politics", "regime", "democracy", "political system", "government"],
  "International Relations": ["international relations", "foreign policy", "diplomacy", "conflict", "war"],
  "American Politics": ["american politics", "congress", "election", "united states", "president"],
  "Public Policy": ["public policy", "policy analysis", "regulation", "government", "reform"],
  "Political Methodology": ["political methodology", "quantitative methods", "causal inference", "measurement"],
  "Political Theory": ["political theory", "normative", "justice", "philosophy", "political philosophy"],
  "Security Studies": ["security", "defense", "military", "war", "conflict", "terrorism"],
  
  // Adjacent Fields
  "Psychology (Behavioral/Social)": ["psychology", "behavior", "cognition", "social psychology", "decision making"],
  "Sociology": ["sociology", "social", "society", "community", "social structure"],
  "Management / Organization Studies": ["management", "organization", "firm", "strategy", "leadership"],
  "Public Administration": ["public administration", "bureaucracy", "government", "civil service"],
  "Law and Economics": ["law and economics", "legal", "court", "regulation", "property rights"],
  "Demography": ["demography", "population", "fertility", "mortality", "migration"],
};

// ═══════════════════════════════════════════════════════════════════════════
// METHOD KEYWORDS (Expanded with Qualitative Methods)
// ═══════════════════════════════════════════════════════════════════════════

export const METHOD_KEYWORDS: Record<string, KeywordEntry> = {
  // ─────────────────────────────────────────────────────────────────────────
  // QUANTITATIVE METHODS
  // ─────────────────────────────────────────────────────────────────────────
  
  "Difference-in-Differences": {
    canonical: "difference-in-differences",
    synonyms: [
      "diff-in-diff", "did ", "difference in differences", "parallel trends",
      "two-way fixed effects", "twfe", "staggered", "event study", "pretrend",
      "treated group", "control group", "treatment group", "triple difference"
    ],
    weight: 1.0
  },
  "Regression Discontinuity": {
    canonical: "regression discontinuity",
    synonyms: [
      "rdd", "rd design", "discontinuity", "sharp rd", "fuzzy rd",
      "running variable", "forcing variable", "cutoff", "threshold",
      "bandwidth", "local polynomial"
    ],
    weight: 1.0
  },
  "Instrumental Variables": {
    canonical: "instrumental variable",
    synonyms: [
      "iv ", " iv,", "instrument", "2sls", "two-stage", "tsls",
      "exclusion restriction", "first stage", "first-stage",
      "weak instrument", "late", "local average treatment effect", "complier"
    ],
    weight: 1.0
  },
  "Randomized Experiments (RCTs)": {
    canonical: "randomized",
    synonyms: [
      "rct", "randomized controlled trial", "randomized trial", "randomised",
      "random assignment", "randomization", "field experiment", "lab experiment",
      "experimental", "treatment group", "control group", "intent to treat",
      "intention to treat", "randomly assigned", "random sample"
    ],
    weight: 1.0
  },
  "Synthetic Control": {
    canonical: "synthetic control",
    synonyms: [
      "synthetic control method", "scm", "donor pool", "synthetic counterfactual",
      "abadie", "comparative case study", "synth"
    ],
    weight: 1.0
  },
  "Bunching Estimation": {
    canonical: "bunching",
    synonyms: [
      "bunching estimation", "bunching design", "kink", "notch",
      "excess mass", "missing mass"
    ],
    weight: 1.0
  },
  "Event Studies": {
    canonical: "event study",
    synonyms: [
      "event-study", "event window", "abnormal return", "announcement effect",
      "dynamic effects", "leads and lags"
    ],
    weight: 0.9
  },
  "Structural Models": {
    canonical: "structural model",
    synonyms: [
      "structural estimation", "structural approach", "discrete choice model",
      "blp", "demand estimation", "supply estimation", "dynamic model",
      "counterfactual simulation", "estimated model", "model estimation"
    ],
    weight: 1.0
  },
  "Game Theoretic Models": {
    canonical: "game theory",
    synonyms: [
      "game theoretic", "strategic", "equilibrium", "nash equilibrium",
      "subgame perfect", "mechanism design", "signaling", "bargaining model",
      "auction theory", "formal model", "formal theory"
    ],
    weight: 1.0
  },
  "Mechanism Design": {
    canonical: "mechanism design",
    synonyms: [
      "market design", "auction design", "matching mechanism", "allocation",
      "incentive compatible", "revelation principle"
    ],
    weight: 1.0
  },
  "Machine Learning Methods": {
    canonical: "machine learning",
    synonyms: [
      "lasso", "ridge regression", "elastic net", "random forest",
      "gradient boosting", "neural network", "deep learning", "causal forest",
      "double ml", "cross-validation", "regularization", "prediction model",
      "xgboost", "boosted", "supervised learning"
    ],
    weight: 0.95
  },
  "Panel Data Methods": {
    canonical: "panel data",
    synonyms: [
      "fixed effects", "fixed effect", "random effects", "within estimator",
      "longitudinal", "panel regression", "individual fixed effects",
      "time fixed effects", "entity fixed effects", "year fixed effects"
    ],
    weight: 0.85
  },
  "Time Series Analysis": {
    canonical: "time series",
    synonyms: [
      "var ", "vector autoregression", "arima", "cointegration",
      "granger causality", "impulse response", "forecast", "autoregressive"
    ],
    weight: 0.85
  },
  "Bayesian Methods": {
    canonical: "bayesian",
    synonyms: [
      "bayesian estimation", "mcmc", "posterior", "prior", "bayes",
      "markov chain monte carlo", "gibbs sampling", "bayesian inference"
    ],
    weight: 0.9
  },
  "Network Analysis": {
    canonical: "network analysis",
    synonyms: [
      "social network analysis", "network", "centrality", "clustering coefficient",
      "network structure", "graph theory", "node", "edge", "community detection"
    ],
    weight: 0.95
  },
  "Text Analysis / NLP": {
    canonical: "text analysis",
    synonyms: [
      "nlp", "natural language processing", "text mining", "topic model",
      "sentiment analysis", "word embedding", "text classification",
      "lda", "word2vec", "corpus", "textual analysis"
    ],
    weight: 0.95
  },
  "Spatial Analysis / GIS": {
    canonical: "spatial analysis",
    synonyms: [
      "gis", "geographic", "spatial econometrics", "geospatial",
      "location", "spatial regression", "mapping"
    ],
    weight: 0.9
  },
  "Survey Experiments": {
    canonical: "survey experiment",
    synonyms: [
      "conjoint", "vignette", "factorial design", "list experiment",
      "endorsement experiment", "survey-embedded experiment"
    ],
    weight: 0.95
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // QUALITATIVE METHODS
  // ─────────────────────────────────────────────────────────────────────────
  
  "Case Studies": {
    canonical: "case study",
    synonyms: [
      "case-study", "single case", "comparative case", "within-case",
      "case selection", "qualitative case", "in-depth case"
    ],
    weight: 0.9
  },
  "Comparative Historical Analysis": {
    canonical: "comparative historical",
    synonyms: [
      "historical analysis", "historical comparison", "comparative history",
      "historical institutionalism", "path dependence", "critical juncture",
      "historical sociology"
    ],
    weight: 0.95
  },
  "Process Tracing": {
    canonical: "process tracing",
    synonyms: [
      "process-tracing", "causal mechanism", "causal process observation",
      "mechanistic evidence", "within-case analysis"
    ],
    weight: 1.0
  },
  "Interviews": {
    canonical: "interview",
    synonyms: [
      "semi-structured interview", "in-depth interview", "elite interview",
      "qualitative interview", "respondent", "interviewee"
    ],
    weight: 0.85
  },
  "Ethnography": {
    canonical: "ethnograph",
    synonyms: [
      "ethnographic", "participant observation", "fieldwork", "field research",
      "immersion", "observational study"
    ],
    weight: 0.95
  },
  "Focus Groups": {
    canonical: "focus group",
    synonyms: [
      "group interview", "group discussion", "deliberative"
    ],
    weight: 0.85
  },
  "Content Analysis": {
    canonical: "content analysis",
    synonyms: [
      "qualitative content", "thematic analysis", "coding", "codebook",
      "manifest content", "latent content"
    ],
    weight: 0.9
  },
  "Discourse Analysis": {
    canonical: "discourse analysis",
    synonyms: [
      "critical discourse", "discourse", "discursive", "framing analysis",
      "narrative analysis", "rhetorical analysis"
    ],
    weight: 0.9
  },
  "Archival Research": {
    canonical: "archival",
    synonyms: [
      "archive", "historical document", "primary source", "document analysis",
      "historical record"
    ],
    weight: 0.85
  },
  "Participant Observation": {
    canonical: "participant observation",
    synonyms: [
      "observational", "field observation", "naturalistic observation"
    ],
    weight: 0.9
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // MIXED / SYNTHESIS METHODS
  // ─────────────────────────────────────────────────────────────────────────
  
  "Meta-Analysis": {
    canonical: "meta-analysis",
    synonyms: [
      "meta analysis", "systematic review", "pooled estimate", "effect size",
      "publication bias", "forest plot", "funnel plot"
    ],
    weight: 1.0
  },
  "Systematic Review": {
    canonical: "systematic review",
    synonyms: [
      "literature review", "evidence synthesis", "scoping review",
      "prisma", "search strategy"
    ],
    weight: 0.9
  },
  "Mixed Methods Design": {
    canonical: "mixed method",
    synonyms: [
      "mixed-method", "multi-method", "triangulation", "sequential design",
      "concurrent design", "qual-quant"
    ],
    weight: 0.9
  },
  "Multi-Method Research": {
    canonical: "multi-method",
    synonyms: [
      "multiple methods", "method triangulation", "methodological pluralism"
    ],
    weight: 0.85
  },
  "Replication Studies": {
    canonical: "replication",
    synonyms: [
      "replicate", "reproducibility", "robustness check", "sensitivity analysis"
    ],
    weight: 0.85
  },
  "Literature Review / Survey": {
    canonical: "literature review",
    synonyms: [
      "survey article", "review article", "state of the art", "overview",
      "synthesis", "handbook chapter"
    ],
    weight: 0.8
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// INTEREST KEYWORDS (Expanded)
// ═══════════════════════════════════════════════════════════════════════════

export const INTEREST_KEYWORDS: Record<string, KeywordEntry> = {
  // Methodological Interests
  "Causal Inference": {
    canonical: "causal",
    synonyms: [
      "causal effect", "causal inference", "causality", "causal identification",
      "identification strategy", "treatment effect", "causal impact",
      "endogeneity", "selection bias", "omitted variable", "confounding"
    ],
    weight: 1.0
  },
  "Machine Learning / AI": {
    canonical: "machine learning",
    synonyms: [
      "artificial intelligence", "ai ", "deep learning", "neural network",
      "algorithm", "prediction", "supervised", "unsupervised"
    ],
    weight: 0.95
  },
  "Experimental Methods": {
    canonical: "experiment",
    synonyms: [
      "rct", "randomized", "field experiment", "lab experiment",
      "treatment group", "control group", "random assignment"
    ],
    weight: 1.0
  },
  "Formal Theory / Game Theory": {
    canonical: "game theory",
    synonyms: [
      "formal model", "equilibrium", "strategic", "nash", "mechanism design",
      "auction", "bargaining", "signaling", "formal theory"
    ],
    weight: 1.0
  },
  
  // Economic Topics
  "Inequality": {
    canonical: "inequality",
    synonyms: [
      "income inequality", "wealth inequality", "economic inequality",
      "income distribution", "wealth distribution", "gini coefficient",
      "top 1%", "top income", "redistribution", "intergenerational"
    ],
    weight: 1.0
  },
  "Education": {
    canonical: "education",
    synonyms: [
      "school", "student", "teacher", "college", "university",
      "test score", "achievement gap", "graduation", "dropout",
      "human capital", "educational attainment", "enrollment"
    ],
    weight: 0.9
  },
  "Housing": {
    canonical: "housing",
    synonyms: [
      "house price", "home price", "rent", "rental", "mortgage",
      "homeownership", "housing market", "real estate", "zoning",
      "affordability", "eviction", "homelessness"
    ],
    weight: 1.0
  },
  "Health": {
    canonical: "health",
    synonyms: [
      "healthcare", "hospital", "physician", "doctor", "patient",
      "mortality", "morbidity", "life expectancy", "disease",
      "health insurance", "medicare", "medicaid", "medical"
    ],
    weight: 0.9
  },
  "Labor Markets": {
    canonical: "labor",
    synonyms: [
      "labour", "employment", "unemployment", "wage", "wages",
      "worker", "job", "hiring", "layoff", "minimum wage",
      "labor supply", "labor demand", "earnings", "workforce"
    ],
    weight: 0.85
  },
  "Poverty and Welfare": {
    canonical: "poverty",
    synonyms: [
      "poor", "welfare", "social assistance", "transfer",
      "food stamp", "snap", "eitc", "safety net", "benefit",
      "low-income", "disadvantaged", "tanf"
    ],
    weight: 1.0
  },
  "Taxation": {
    canonical: "tax",
    synonyms: [
      "taxation", "income tax", "corporate tax", "tax rate",
      "tax evasion", "tax avoidance", "tax policy", "tax reform",
      "marginal tax", "progressive tax", "tax revenue"
    ],
    weight: 1.0
  },
  "Trade and Globalization": {
    canonical: "trade",
    synonyms: [
      "international trade", "tariff", "import", "export",
      "globalization", "trade policy", "trade war", "china shock",
      "offshoring", "outsourcing", "comparative advantage", "wto"
    ],
    weight: 1.0
  },
  "Monetary Policy": {
    canonical: "monetary policy",
    synonyms: [
      "central bank", "federal reserve", "fed ", "interest rate",
      "inflation", "money supply", "quantitative easing", "qe",
      "zero lower bound", "monetary transmission"
    ],
    weight: 1.0
  },
  "Fiscal Policy": {
    canonical: "fiscal",
    synonyms: [
      "government spending", "fiscal policy", "stimulus", "austerity",
      "deficit", "debt", "multiplier", "budget", "public spending"
    ],
    weight: 1.0
  },
  "Innovation and Technology": {
    canonical: "innovation",
    synonyms: [
      "patent", "r&d", "research and development", "invention",
      "entrepreneur", "startup", "technology", "productivity",
      "technological change", "creative destruction"
    ],
    weight: 0.9
  },
  "Development": {
    canonical: "development",
    synonyms: [
      "developing country", "developing world", "poor country",
      "foreign aid", "microfinance", "microcredit", "poverty reduction",
      "economic development", "third world", "global south"
    ],
    weight: 0.9
  },
  "Climate and Energy": {
    canonical: "climate",
    synonyms: [
      "climate change", "global warming", "carbon", "emissions",
      "greenhouse gas", "renewable", "energy", "fossil fuel",
      "carbon tax", "cap and trade", "electricity", "solar", "wind"
    ],
    weight: 1.0
  },
  "Agriculture and Food": {
    canonical: "agricultur",
    synonyms: [
      "farm", "crop", "food security", "rural", "land",
      "food policy", "agricultural policy", "harvest"
    ],
    weight: 0.9
  },
  "Finance and Banking": {
    canonical: "financ",
    synonyms: [
      "bank", "credit", "loan", "investment", "stock market",
      "financial market", "asset", "financial crisis"
    ],
    weight: 0.85
  },
  "Entrepreneurship": {
    canonical: "entrepreneur",
    synonyms: [
      "startup", "small business", "venture capital", "founder",
      "firm formation", "business creation", "self-employment"
    ],
    weight: 0.9
  },
  
  // Political Topics
  "Elections and Voting": {
    canonical: "election",
    synonyms: [
      "vote", "voting", "voter", "ballot", "electoral",
      "turnout", "campaign", "candidate", "polling", "poll",
      "democrat", "republican", "partisan"
    ],
    weight: 1.0
  },
  "Democracy and Democratization": {
    canonical: "democra",
    synonyms: [
      "democratic", "democratization", "regime", "autocracy",
      "political freedom", "civil liberties", "democratic transition"
    ],
    weight: 1.0
  },
  "Conflict and Security": {
    canonical: "conflict",
    synonyms: [
      "war", "civil war", "violence", "military", "peace",
      "terrorism", "security", "battle", "casualty", "armed"
    ],
    weight: 1.0
  },
  "International Cooperation": {
    canonical: "international cooperation",
    synonyms: [
      "multilateral", "international organization", "treaty",
      "alliance", "diplomacy", "foreign policy"
    ],
    weight: 0.95
  },
  "Political Institutions": {
    canonical: "institution",
    synonyms: [
      "constitution", "legislature", "parliament", "congress",
      "executive", "judiciary", "bureaucracy", "federalism"
    ],
    weight: 0.9
  },
  "Public Opinion": {
    canonical: "public opinion",
    synonyms: [
      "survey", "polling", "attitude", "belief", "preference",
      "opinion poll", "political attitudes"
    ],
    weight: 0.95
  },
  "Political Behavior": {
    canonical: "political behavior",
    synonyms: [
      "protest", "social movement", "collective action",
      "civic engagement", "political participation"
    ],
    weight: 0.9
  },
  "Accountability and Transparency": {
    canonical: "accountab",
    synonyms: [
      "transparency", "oversight", "audit", "monitoring",
      "information disclosure", "freedom of information", "watchdog"
    ],
    weight: 1.0
  },
  "Corruption": {
    canonical: "corrupt",
    synonyms: [
      "bribery", "rent-seeking", "clientelism", "patronage",
      "anti-corruption", "integrity", "graft", "embezzlement"
    ],
    weight: 1.0
  },
  "Rule of Law": {
    canonical: "rule of law",
    synonyms: [
      "legal system", "court", "judicial", "law enforcement",
      "property rights", "contract enforcement", "justice"
    ],
    weight: 0.95
  },
  "State Capacity": {
    canonical: "state capacity",
    synonyms: [
      "state building", "governance", "public administration",
      "bureaucratic capacity", "fiscal capacity", "weak state"
    ],
    weight: 1.0
  },
  "Authoritarianism": {
    canonical: "authoritarian",
    synonyms: [
      "autocracy", "dictatorship", "repression", "censorship",
      "political control", "one-party", "strongman"
    ],
    weight: 1.0
  },
  
  // Social Topics
  "Gender": {
    canonical: "gender",
    synonyms: [
      "female", "women", "woman", "male", "men", "sex difference",
      "gender gap", "wage gap", "discrimination", "motherhood",
      "child penalty", "fertility", "family", "maternity"
    ],
    weight: 0.9
  },
  "Race and Ethnicity": {
    canonical: "race",
    synonyms: [
      "racial", "ethnicity", "ethnic", "minority", "discrimination",
      "segregation", "diversity", "black", "hispanic", "asian"
    ],
    weight: 0.95
  },
  "Immigration": {
    canonical: "immigra",
    synonyms: [
      "migrant", "migration", "refugee", "asylum",
      "foreign-born", "native-born", "undocumented", "visa", "border"
    ],
    weight: 1.0
  },
  "Crime and Justice": {
    canonical: "crime",
    synonyms: [
      "criminal", "police", "policing", "prison", "incarceration",
      "recidivism", "sentencing", "arrest", "violence", "homicide"
    ],
    weight: 1.0
  },
  "Social Mobility": {
    canonical: "mobility",
    synonyms: [
      "intergenerational", "upward mobility", "downward mobility",
      "economic mobility", "income mobility", "opportunity"
    ],
    weight: 1.0
  },
  "Social Networks": {
    canonical: "network",
    synonyms: [
      "social network", "peer effect", "social connection",
      "network analysis", "social capital", "ties", "centrality"
    ],
    weight: 0.95
  },
  "Media and Information": {
    canonical: "media",
    synonyms: [
      "news", "journalism", "press", "newspaper", "television",
      "information", "media effects", "communication"
    ],
    weight: 0.9
  },
  "Social Media and Digital Platforms": {
    canonical: "social media",
    synonyms: [
      "facebook", "twitter", "platform", "online", "digital",
      "internet", "viral", "tech platform", "app"
    ],
    weight: 1.0
  },
  "Misinformation and Fake News": {
    canonical: "misinformation",
    synonyms: [
      "disinformation", "fake news", "fact-checking", "rumor",
      "propaganda", "media literacy", "false information"
    ],
    weight: 1.0
  },
  "Trust and Social Capital": {
    canonical: "trust",
    synonyms: [
      "social capital", "social cohesion", "cooperation",
      "civic participation", "community", "solidarity"
    ],
    weight: 0.9
  },
  "Norms and Culture": {
    canonical: "norm",
    synonyms: [
      "culture", "social norm", "cultural", "tradition",
      "values", "beliefs", "customs", "socialization"
    ],
    weight: 0.9
  },
  "Religion": {
    canonical: "religio",
    synonyms: [
      "church", "faith", "islam", "muslim", "christian",
      "secularization", "spirituality", "religious"
    ],
    weight: 0.9
  },
  
  // Organizational / Behavioral
  "Organizations and Firms": {
    canonical: "organization",
    synonyms: [
      "firm", "company", "corporate", "business",
      "management", "organizational behavior"
    ],
    weight: 0.85
  },
  "Corporate Governance": {
    canonical: "corporate governance",
    synonyms: [
      "board", "shareholder", "executive compensation",
      "CEO", "ownership", "agency problem"
    ],
    weight: 0.95
  },
  "Leadership": {
    canonical: "leadership",
    synonyms: [
      "leader", "manager", "executive", "authority",
      "decision-making", "management"
    ],
    weight: 0.85
  },
  "Decision Making": {
    canonical: "decision",
    synonyms: [
      "choice", "judgment", "cognitive", "heuristic",
      "bounded rationality", "decision-making"
    ],
    weight: 0.85
  },
  "Behavioral Biases": {
    canonical: "bias",
    synonyms: [
      "behavioral", "cognitive bias", "framing", "anchoring",
      "overconfidence", "prospect theory", "loss aversion"
    ],
    weight: 0.9
  },
  "Nudges and Choice Architecture": {
    canonical: "nudge",
    synonyms: [
      "choice architecture", "behavioral intervention", "default",
      "libertarian paternalism", "behavioral policy"
    ],
    weight: 1.0
  },
  "Risk and Uncertainty": {
    canonical: "risk",
    synonyms: [
      "uncertainty", "risk aversion", "insurance", "probability",
      "expected utility", "ambiguity"
    ],
    weight: 0.85
  },
  "Prosocial Behavior": {
    canonical: "prosocial",
    synonyms: [
      "altruism", "cooperation", "charitable", "donation",
      "volunteering", "helping", "generosity"
    ],
    weight: 0.9
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TEXT PROCESSING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countKeywordMatches(text: string, entry: KeywordEntry): [number, number] {
  const textNorm = normalizeText(text);
  const allTerms = [entry.canonical, ...entry.synonyms];

  let matches = 0;
  for (const term of allTerms) {
    const termNorm = normalizeText(term);
    if (termNorm && textNorm.includes(termNorm)) {
      matches++;
    }
  }

  if (matches === 0) return [0, 0.0];
  if (matches === 1) return [matches, 0.6 * entry.weight];
  if (matches === 2) return [matches, 0.8 * entry.weight];
  return [matches, 1.0 * entry.weight];
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING ENGINE (Redesigned with Additive Baseline)
// ═══════════════════════════════════════════════════════════════════════════

const TIER_SCORES: Record<number, number> = { 1: 1.0, 2: 0.8, 3: 0.6, 4: 0.3 };

export class RelevanceScorer {
  private profile: UserProfile;
  private targetConcepts: Set<string>;
  private isGeneralist: boolean;
  private hasInterests: boolean;
  private hasMethods: boolean;

  constructor(profile: UserProfile) {
    this.profile = profile;
    this.isGeneralist = 
      isGeneralistField(profile.primary_field) || 
      isGeneralistLevel(profile.academic_level) ||
      profile.experience_type === "generalist" ||
      profile.experience_type === "explorer";
    this.hasInterests = profile.interests.length > 0;
    this.hasMethods = profile.methods.length > 0;

    // Build concept targets
    this.targetConcepts = new Set<string>();
    
    // Add field concepts (unless generalist)
    if (!this.isGeneralist && FIELD_TO_CONCEPTS[profile.primary_field]) {
      for (const c of FIELD_TO_CONCEPTS[profile.primary_field]) {
        this.targetConcepts.add(normalizeText(c));
      }
    }
    
    // Add interest concepts
    for (const interest of profile.interests) {
      if (INTEREST_TO_CONCEPTS[interest]) {
        for (const c of INTEREST_TO_CONCEPTS[interest]) {
          this.targetConcepts.add(normalizeText(c));
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BASELINE SCORE (Quality-based floor)
  // ─────────────────────────────────────────────────────────────────────────
  
  private scoreBaseline(paper: Paper): number {
    const tier = paper.journal_tier || 4;
    const tierScore = TIER_SCORES[tier] || 0.3;
    
    // Citation score with recency adjustment
    const cites = paper.cited_by_count || 0;
    let citeScore: number;
    if (cites >= 50) citeScore = 1.0;
    else if (cites >= 20) citeScore = 0.85;
    else if (cites >= 10) citeScore = 0.7;
    else if (cites >= 5) citeScore = 0.55;
    else if (cites >= 1) citeScore = 0.4;
    else citeScore = 0.3; // New papers get benefit of doubt
    
    // Baseline: 60% tier, 40% citations
    // This produces a score from ~0.3 to 1.0
    const rawBaseline = tierScore * 0.6 + citeScore * 0.4;
    
    // Map to 3.0-5.0 range (every paper has a floor)
    return 3.0 + rawBaseline * 2.0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONCEPT MATCHING (OpenAlex ML concepts)
  // ─────────────────────────────────────────────────────────────────────────
  
  private scoreConcepts(paper: Paper): [number, string[]] {
    const concepts = paper.concepts || [];
    if (!concepts.length || !this.targetConcepts.size) {
      return [0.0, []];
    }

    const matched: string[] = [];
    let weightedSum = 0.0;

    for (const concept of concepts) {
      const name = normalizeText(concept.name || "");
      const conf = concept.score || 0;

      for (const target of this.targetConcepts) {
        if (target.includes(name) || name.includes(target)) {
          matched.push(concept.name);
          weightedSum += conf;
          break;
        }
      }
    }

    // Normalize: 1.5 cumulative confidence = max score
    const score = Math.min(1.0, weightedSum / 1.5);
    return [score, matched.slice(0, 5)];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTEREST KEYWORD MATCHING
  // ─────────────────────────────────────────────────────────────────────────
  
  private scoreInterestKeywords(text: string): [number, string[]] {
    if (!this.hasInterests) {
      return [0.0, []];
    }

    const matched: string[] = [];
    const scores: number[] = [];

    for (let i = 0; i < this.profile.interests.length; i++) {
      const interest = this.profile.interests[i];
      if (!INTEREST_KEYWORDS[interest]) {
        continue;
      }

      const entry = INTEREST_KEYWORDS[interest];
      const [count, score] = countKeywordMatches(text, entry);

      if (count > 0) {
        matched.push(interest);
        // Position weight: first = 1.0, later = less
        const posWeight = Math.max(0.6, 1.0 - i * 0.08);
        scores.push(score * posWeight);
      }
    }

    if (!scores.length) return [0.0, []];

    // Combine: best match + average (rewards multiple matches)
    const best = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    let combined = best * 0.6 + avg * 0.4;

    // Bonus for multiple strong matches
    if (matched.length >= 3) combined *= 1.2;
    else if (matched.length >= 2) combined *= 1.1;

    return [Math.min(1.0, combined), matched];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // METHOD MATCHING
  // ─────────────────────────────────────────────────────────────────────────
  
  private scoreMethods(text: string): [number, string[]] {
    if (!this.hasMethods) {
      return [0.0, []];
    }

    const matched: string[] = [];
    const scores: number[] = [];

    for (let i = 0; i < this.profile.methods.length; i++) {
      const method = this.profile.methods[i];
      if (!METHOD_KEYWORDS[method]) {
        continue;
      }

      const entry = METHOD_KEYWORDS[method];
      const [count, score] = countKeywordMatches(text, entry);

      if (count > 0) {
        matched.push(method);
        const posWeight = Math.max(0.5, 1.0 - i * 0.1);
        scores.push(score * posWeight);
      }
    }

    if (!scores.length) return [0.0, []];

    const best = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    let combined = best * 0.7 + avg * 0.3;

    if (matched.length >= 2) combined *= 1.15;

    return [Math.min(1.0, combined), matched];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // APPROACH ALIGNMENT (Quant/Qual)
  // ─────────────────────────────────────────────────────────────────────────
  
  private detectApproach(text: string): "quantitative" | "qualitative" | "mixed" | "unknown" {
    const textLower = text.toLowerCase();
    
    const quantSignals = [
      "regression", "coefficient", "standard error", "statistical",
      "p-value", "significance", "estimate", "model", "data",
      "sample", "observation", "variable", "econometric"
    ];
    
    const qualSignals = [
      "interview", "ethnograph", "case study", "qualitative",
      "participant", "fieldwork", "archival", "discourse",
      "narrative", "thematic", "interpretive"
    ];
    
    const quantCount = quantSignals.filter(s => textLower.includes(s)).length;
    const qualCount = qualSignals.filter(s => textLower.includes(s)).length;
    
    if (quantCount > 2 && qualCount > 2) return "mixed";
    if (quantCount > 2) return "quantitative";
    if (qualCount > 2) return "qualitative";
    return "unknown";
  }

  private scoreApproachAlignment(text: string): number {
    const pref = this.profile.approach_preference;
    if (pref === "no_preference" || pref === "both") return 0.5;
    
    const detected = this.detectApproach(text);
    if (detected === "unknown") return 0.5;
    if (detected === "mixed") return 0.7;
    if (detected === pref) return 1.0;
    return 0.3;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FIELD RELEVANCE (Adjacent field penalty)
  // ─────────────────────────────────────────────────────────────────────────
  
  private scoreFieldRelevance(paper: Paper): [number, boolean] {
    const journalField = paper.journal_field;
    if (!journalField) return [1.0, false];
    
    const isAdjacent = isAdjacentField(journalField);
    
    // If user explicitly included adjacent fields, no penalty
    if (this.profile.include_adjacent_fields && 
        this.profile.selected_adjacent_fields.includes(journalField)) {
      return [0.95, true]; // Small adjustment, marked as adjacent
    }
    
    // Core fields get full score
    if (!isAdjacent) return [1.0, false];
    
    // Adjacent fields without explicit selection get moderate penalty
    return [0.7, true];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EXPLANATION BUILDER
  // ─────────────────────────────────────────────────────────────────────────
  
  private buildExplanation(
    matchedInterests: string[],
    matchedMethods: string[],
    paper: Paper,
    isAdjacent: boolean
  ): string {
    const parts: string[] = [];

    if (matchedInterests.length) {
      parts.push(matchedInterests.slice(0, 2).join(", "));
    }

    if (matchedMethods.length) {
      const methodsStr = matchedMethods.length === 1
        ? matchedMethods[0]
        : `${matchedMethods[0]} + more`;
      parts.push(`Uses ${methodsStr}`);
    }

    const tier = paper.journal_tier || 4;
    if (tier === 1) parts.push("Top journal");
    else if (tier === 2) parts.push("Top field journal");
    
    if (isAdjacent) parts.push("Related field");

    if (!parts.length) {
      if (this.isGeneralist) {
        return "Recent quality research";
      }
      return "Related to your field";
    }

    return parts.join(" · ");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN SCORING FUNCTION
  // ─────────────────────────────────────────────────────────────────────────
  
  public scorePaper(paper: Paper): MatchScore {
    const title = paper.title || "";
    const abstract = paper.abstract || "";
    const text = `${title} ${title} ${abstract}`; // Title 2x weight

    // 1. Baseline (quality floor)
    const baselineScore = this.scoreBaseline(paper);

    // 2. Topic relevance (additive)
    const [conceptScore, matchedConcepts] = this.scoreConcepts(paper);
    const [keywordScore, matchedInterests] = this.scoreInterestKeywords(text);
    
    // Combine concept + keyword (take best, bonus if both good)
    let topicBonus = Math.max(conceptScore, keywordScore);
    if (conceptScore > 0.3 && keywordScore > 0.3) {
      topicBonus = Math.min(1.0, topicBonus * 1.15);
    }

    // 3. Method relevance (additive)
    const [methodScore, matchedMethods] = this.scoreMethods(text);
    const approachScore = this.scoreApproachAlignment(text);
    const methodBonus = this.hasMethods 
      ? methodScore * 0.8 + approachScore * 0.2
      : 0;

    // 4. Field relevance (multiplicative modifier)
    const [fieldRelevance, isAdjacent] = this.scoreFieldRelevance(paper);

    // ─────────────────────────────────────────────────────────────────────
    // FINAL SCORE CALCULATION
    // ─────────────────────────────────────────────────────────────────────
    
    // Additive model:
    // - Baseline: 3.0-5.0 (quality floor)
    // - Topic bonus: 0-3.0 (when interests specified)
    // - Method bonus: 0-2.0 (when methods specified)
    // - Field modifier: 0.7-1.0 (adjacent field penalty)
    
    let topicAddition = 0;
    let methodAddition = 0;
    
    if (this.hasInterests) {
      // Max +3.0 for perfect topic match
      topicAddition = topicBonus * 3.0;
    } else if (this.isGeneralist) {
      // Generalists without interests: small bonus for diverse topics
      topicAddition = conceptScore * 1.0;
    }
    
    if (this.hasMethods) {
      // Max +2.0 for perfect method match
      methodAddition = methodBonus * 2.0;
    }
    
    // Combine
    let rawScore = baselineScore + topicAddition + methodAddition;
    
    // Apply field modifier
    rawScore *= fieldRelevance;
    
    // Clamp to 1-10
    const finalScore = Math.max(1.0, Math.min(10.0, rawScore));

    // Build explanation
    const explanation = this.buildExplanation(
      matchedInterests,
      matchedMethods,
      paper,
      isAdjacent
    );

    return {
      total: Math.round(finalScore * 10) / 10,
      baseline_score: Math.round(baselineScore * 100) / 100,
      concept_score: Math.round(conceptScore * 1000) / 1000,
      keyword_score: Math.round(keywordScore * 1000) / 1000,
      method_score: Math.round(methodScore * 1000) / 1000,
      quality_score: Math.round((baselineScore - 3) / 2 * 1000) / 1000,
      field_relevance_score: Math.round(fieldRelevance * 1000) / 1000,
      matched_interests: matchedInterests,
      matched_methods: matchedMethods,
      matched_topics: matchedConcepts,
      explanation,
      is_adjacent_field: isAdjacent,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export function processPapers(
  profile: UserProfile,
  papers: Paper[]
): { papers: ScoredPaper[]; summary: string } {
  if (!papers.length) {
    return { papers: [], summary: "No papers found." };
  }

  const scorer = new RelevanceScorer(profile);

  const results: ScoredPaper[] = papers.map((paper) => {
    const match = scorer.scorePaper(paper);
    return {
      ...paper,
      relevance_score: match.total,
      matched_interests: match.matched_interests,
      matched_methods: match.matched_methods,
      matched_topics: match.matched_topics,
      match_explanation: match.explanation,
      is_adjacent_field: match.is_adjacent_field,
    };
  });

  // Sort by relevance score (highest first)
  results.sort((a, b) => b.relevance_score - a.relevance_score);

  const high = results.filter((p) => p.relevance_score >= 7.0).length;
  const total = papers.length;
  
  // Dynamic summary based on profile
  let summaryPrefix = "Analyzed";
  if (profile.interests.length === 0 && profile.methods.length === 0) {
    summaryPrefix = "Showing quality research:";
  }
  
  const summary = `${summaryPrefix} ${total} papers · ${high} highly relevant`;

  return { papers: results, summary };
}

// Helper to create a default profile
export function createDefaultProfile(name: string): UserProfile {
  return {
    name,
    academic_level: "Curious Learner",
    primary_field: "General Interest (Show me everything)",
    interests: [],
    methods: [],
    region: "Global / No Preference",
    approach_preference: "no_preference",
    experience_type: "explorer",
    include_adjacent_fields: false,
    selected_adjacent_fields: [],
  };
}
