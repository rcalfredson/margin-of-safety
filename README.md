# Margin of Safety

Margin of Safety is a small fundamentals-focused stock screening app for comparing public companies across valuation, balance-sheet strength, profitability, and data completeness.

The app is inspired by Benjamin Graham-style value analysis, but it does not produce buy/sell recommendations. It uses neutral labels such as "worth deeper review", "possibly expensive", "balance sheet concern", and "data incomplete" to support manual research.

**Disclaimer:** This project is for educational research and learning only. It is not investment, financial, tax, or legal advice.

## Features

- Express web app with server-rendered HTML
- Comma-separated ticker input
- Pluggable data-provider layer
- Alpha Vantage provider for real quote and overview data
- Yahoo Finance provider via `yahoo-finance2` kept as an experimental fallback
- Mock fixture provider for local development without API keys
- SQLite snapshot storage with timestamped normalized fields
- Graham Number, price-to-Graham Number, value checklist score, and data completeness score
- Explainable scoring details for every saved snapshot
- Sortable comparison table using small vanilla JavaScript
- Graceful handling for missing fields, unavailable tickers, and provider failures

## Important Data Notes

The recommended real provider is Alpha Vantage. It offers a free API key and official endpoints for company overview and quote data, but it is still rate-limited and may not return every normalized field.

The Yahoo Finance provider uses the unofficial `yahoo-finance2` package. Yahoo Finance access can be brittle, incomplete, rate-limited, or unavailable. The provider interface is intentionally small so providers can be replaced later.

## Requirements

- Node.js 22.5 or newer
- npm

This project uses Node's built-in SQLite module (`node:sqlite`), so no native SQLite npm dependency is required.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Then open:

```text
http://localhost:3000
```

For a normal start without watch mode:

```bash
npm start
```

## Configuration

Environment variables:

```text
PORT=3000
HOST=127.0.0.1
DATABASE_PATH=./data/margin-of-safety.sqlite
YAHOO_FINANCE_SUPPRESS_NOTICES=true

# Default zero-key provider:
DEFAULT_PROVIDER=mock-fixtures

# Real free provider:
# DEFAULT_PROVIDER=alpha-vantage
# ALPHA_VANTAGE_API_KEY=your_key_here
# ALPHA_VANTAGE_REQUEST_DELAY_MS=1300
```

The SQLite database is created automatically on first run.

## Project Structure

```text
src/server.js
src/db.js
src/providers/providerTypes.js
src/providers/alphaVantageProvider.js
src/providers/mockProvider.js
src/providers/yahooProvider.js
src/services/snapshotService.js
src/services/metricsService.js
src/routes/index.js
src/views/homeView.js
public/app.js
public/styles.css
```

## Scoring

The app keeps scores simple and transparent:

- `grahamNumber`: `sqrt(22.5 * EPS * book value per share)` when EPS and book value are positive.
- `priceToGrahamNumber`: current price divided by Graham Number when both are available.
- `valueChecklistScore`: percentage of available checklist items that pass.
- `dataCompletenessScore`: percentage of normalized fields available from the provider.

Missing data lowers completeness but does not crash the app. Missing checklist fields are marked as unavailable instead of failing silently.

## Replacing the Data Provider

Providers implement the small interface documented in `src/providers/providerTypes.js`:

```js
{
  name: 'provider-name',
  async getSnapshot(ticker) {
    return { snapshot, raw };
  }
}
```

Normalize provider responses into the internal `StockSnapshot` shape before storage. Keep raw provider data for traceability, but use normalized fields for comparisons and scoring.

Current providers:

- `alpha-vantage`: real quote and company overview data. Requires `ALPHA_VANTAGE_API_KEY`.
- `mock-fixtures`: local deterministic fixtures for UI and scoring work.
- `yahoo-finance2`: experimental unofficial Yahoo Finance adapter.
