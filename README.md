# verso

Slightly outdated Readme. Awaiting continuing updates given testing.

**Discover research that matters to you.**

verso is a personalized academic paper discovery app for economics and political science researchers. It fetches recent papers from 50+ top journals via the OpenAlex API and uses a sophisticated relevance scoring algorithm to find papers that match your research interests and methodological preferences.

## Features

- 🔍 **Smart Discovery**: Fetches papers from 50+ top economics and political science journals
- 🎯 **Personalized Scoring**: Multi-signal relevance algorithm using concepts, keywords, and methodology matching
- 📊 **Journal Tiers**: Organized by Tier 1 (Top 5), Tier 2 (Top Field), and Tier 3 (Excellent)
- 📅 **Flexible Time Range**: Search papers from the last 7-90 days
- 🏷️ **Rich Metadata**: View authors, institutions, abstracts, citations, and open access links
- 💾 **Progress Saving**: Your preferences are saved locally for convenience
- 📱 **Responsive Design**: Works beautifully on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: OpenAlex (free, no auth required)
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/econvery.git
   cd econvery
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. (Optional) Copy the environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
econvery/
├── app/
│   ├── api/
│   │   ├── journals/      # Journal metadata endpoint
│   │   ├── papers/        # OpenAlex paper fetching
│   │   └── recommend/     # Relevance scoring endpoint
│   ├── globals.css        # Global styles + Tailwind
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Main application (step-based flow)
├── components/
│   ├── Loading.tsx        # Loading states
│   ├── MultiSelect.tsx    # Searchable multi-select dropdown
│   ├── PaperCard.tsx      # Paper display card
│   └── ProgressDots.tsx   # Step progress indicator
├── lib/
│   ├── journals.ts        # Journal definitions (ISSN, tiers)
│   ├── openalex.ts        # OpenAlex API client
│   ├── profile-options.ts # User profile options
│   ├── scoring.ts         # Relevance scoring engine
│   └── types.ts           # TypeScript type definitions
├── public/                # Static assets
├── tailwind.config.ts     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

## How the Scoring Algorithm Works

The relevance scoring engine uses multiple independent signals:

1. **Concept Matching (30%)**: Maps user interests to OpenAlex's ML-classified concepts
2. **Keyword Matching (30%)**: Searches title/abstract for domain-specific terms with synonyms
3. **Method Detection (25%)**: Identifies methodology-specific vocabulary
4. **Quality Signals (15%)**: Journal tier and citation count

### Score Interpretation

| Score Range | Interpretation |
|-------------|----------------|
| 8.5 - 10.0  | Directly relevant — multiple strong matches |
| 7.0 - 8.4   | Highly relevant — at least one strong match |
| 5.0 - 6.9   | Moderately relevant — partial matches |
| 3.0 - 4.9   | Tangentially relevant — weak connections |
| 1.0 - 2.9   | Low relevance — minimal overlap |

## API Endpoints

### GET /api/papers

Fetch papers from OpenAlex.

**Query Parameters:**
- `daysBack` (number, default: 30) - Days to look back
- `maxResults` (number, default: 100) - Maximum papers to return
- `journals` (string) - Comma-separated journal names

**Response:**
```json
{
  "papers": [...],
  "count": 42
}
```

### POST /api/recommend

Score and rank papers based on user profile.

**Request Body:**
```json
{
  "profile": {
    "name": "John",
    "academic_level": "PhD Student",
    "primary_field": "Labor Economics",
    "interests": ["Causal Inference", "Education"],
    "methods": ["Difference-in-Differences"],
    "region": "United States"
  },
  "papers": [...]
}
```

**Response:**
```json
{
  "papers": [...],
  "summary": "Analyzed 42 papers · 15 highly relevant",
  "high_relevance_count": 15
}
```

### GET /api/journals

Get journal and profile options.

**Response:**
```json
{
  "journals": {
    "economics": { "tier1": [...], "tier2": [...], "tier3": [...] },
    "polisci": { "tier1": [...], "tier2": [...], "tier3": [...] }
  },
  "profile": {
    "academic_levels": [...],
    "primary_fields": [...],
    "interests": [...],
    "methods": [...],
    "regions": [...]
  }
}
```

## Deployment

### Deploy to Vercel

The easiest way to deploy Econvery is with [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/econvery)

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Migration Notes (from Streamlit)

This Next.js application is a complete rewrite of the original Streamlit app. Key changes:

1. **Architecture**: Server-side rendering + client-side interactivity vs Streamlit's Python-based approach
2. **State Management**: React hooks + localStorage vs Streamlit's session state
3. **API Layer**: Serverless API routes vs integrated Python backend
4. **Styling**: Tailwind CSS with custom design system vs Streamlit's built-in components
5. **Performance**: Faster initial load, better caching, edge deployment support

The scoring algorithm produces identical results to the Python version — all keyword dictionaries and scoring logic have been faithfully ported.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License — see [LICENSE](./LICENSE) for details.

## Acknowledgments

- [OpenAlex](https://openalex.org/) for providing free, open access to academic metadata
- The original Streamlit app for the inspiration and scoring algorithm
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide](https://lucide.dev/) for beautiful icons

---

Built with ❤️ for researchers who want to discover what matters.
