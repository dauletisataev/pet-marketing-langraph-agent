# Marketing Data Analysis Agent

A LangGraph.js-based agent that generates daily marketing briefs by analyzing data from various sources.

## Features

- Daily automated marketing report generation
- Data validation and quality checking
- Analysis of key metrics (ROAS, CAC)
- Analysis of conversion rates across different stages
- Channel distribution analysis
- LLM-powered insights and suggestions for improvements
- Comprehensive data quality and reporting improvement recommendations

## Project Structure

```
.
├── src/
│   ├── agents/            # Agent implementation using LangGraph
│   │   ├── types.ts       # Type definitions for agent state
│   │   ├── nodes.ts       # Node implementations for different steps
│   │   └── agent.ts       # Agent graph definition
│   ├── config/            # Configuration
│   │   └── index.ts       # Configuration settings
│   ├── data/              # Data directories
│   │   ├── input/         # Input data (CSV files)
│   │   └── output/        # Output data (generated briefs)
│   ├── services/          # Service implementations
│   │   ├── data-analysis.ts       # Analysis functionality
│   │   └── report-improvements.ts # Report improvement suggestions
│   ├── types/             # Type definitions
│   │   └── index.ts       # Core data types
│   ├── utils/             # Utility functions
│   │   └── csv-loader.ts  # CSV loading utilities
│   └── index.ts           # Main entry point
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## Data Structure

The agent processes the following data sources:

- Sessions - Website visits data
- Leads - CRM lead records
- Contacts - Contact information from CRM and Shopify
- Transactions - Order data from Shopify
- Source Data - Advertising statistics (spend, impressions, clicks)
- Atoms - Directory of advertising entity IDs

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and add your OpenAI API key:
   ```
   cp .env.example .env
   ```
4. Configure the data directory in the `.env` file
5. Add your CSV data files to the input directory

## Usage

```bash
# Run the agent
npm start

# Development mode (with automatic restart)
npm run dev

# Build the project
npm run build
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `DATA_DIR`: Directory containing input data files
- `OUTPUT_DIR`: Directory for saving generated briefs
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4o)
- `HISTORICAL_DAYS`: Number of days to use for historical comparison (default: 7)
- `SIGNIFICANT_CHANGE_THRESHOLD`: Percentage change considered significant (default: 10)
- `VERBOSE`: Enable verbose logging (default: false)

## Expected Data Files

- `ai.testSessions.csv` / `ai.controlSessions.csv`
- `ai.testLeads.csv` / `ai.controlLeads.csv`
- `ai.testContacts.csv` / `ai.controlContacts.csv`
- `ai.testContacts2Leads.csv` / `ai.controlContacts2Leads.csv`
- `ai.testTransactions.csv` / `ai.controlTransactions.csv`
- `ai.testSourceData.csv` / `ai.controlSourceData.csv`
- `ai.testAtom.csv` / `ai.controlAtoms.csv`

## Output

The agent generates a comprehensive daily brief in JSON format, including:

- Data validation results
- Key metrics analysis (ROAS, CAC)
- Conversion analysis at different stages
- Channel distribution analysis
- Data quality improvement suggestions
- Reporting enhancement recommendations
- Executive summary

The brief is saved to the output directory as `daily-brief-YYYY-MM-DD.json`.
