import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DEFAULT_DATABASE_PATH = './data/margin-of-safety.sqlite';

let db;

export function getDb() {
  if (!db) {
    const dbPath = resolve(process.env.DATABASE_PATH || DEFAULT_DATABASE_PATH);
    mkdirSync(dirname(dbPath), { recursive: true });
    db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    migrate(db);
  }

  return db;
}

function migrate(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS stock_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      provider TEXT NOT NULL,
      ticker TEXT NOT NULL,
      company_name TEXT,
      market_cap REAL,
      price REAL,
      trailing_pe REAL,
      forward_pe REAL,
      price_to_book REAL,
      eps_trailing_twelve_months REAL,
      book_value_per_share REAL,
      debt_to_equity REAL,
      current_ratio REAL,
      return_on_equity REAL,
      return_on_assets REAL,
      profit_margin REAL,
      operating_margin REAL,
      dividend_yield REAL,
      beta REAL,
      currency TEXT,
      exchange TEXT,
      data_timestamp TEXT,
      graham_number REAL,
      price_to_graham_number REAL,
      value_checklist_score REAL,
      data_completeness_score REAL,
      value_checklist_explanations TEXT NOT NULL,
      data_completeness_explanations TEXT NOT NULL,
      neutral_labels TEXT NOT NULL,
      raw_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stock_snapshots_ticker_created_at
      ON stock_snapshots (ticker, created_at DESC);
  `);
}

export function insertSnapshot(snapshot, raw, metrics, provider) {
  const database = getDb();
  const statement = database.prepare(`
    INSERT INTO stock_snapshots (
      provider,
      ticker,
      company_name,
      market_cap,
      price,
      trailing_pe,
      forward_pe,
      price_to_book,
      eps_trailing_twelve_months,
      book_value_per_share,
      debt_to_equity,
      current_ratio,
      return_on_equity,
      return_on_assets,
      profit_margin,
      operating_margin,
      dividend_yield,
      beta,
      currency,
      exchange,
      data_timestamp,
      graham_number,
      price_to_graham_number,
      value_checklist_score,
      data_completeness_score,
      value_checklist_explanations,
      data_completeness_explanations,
      neutral_labels,
      raw_json
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  return statement.run(
    provider,
    snapshot.ticker,
    snapshot.companyName,
    snapshot.marketCap,
    snapshot.price,
    snapshot.trailingPE,
    snapshot.forwardPE,
    snapshot.priceToBook,
    snapshot.epsTrailingTwelveMonths,
    snapshot.bookValuePerShare,
    snapshot.debtToEquity,
    snapshot.currentRatio,
    snapshot.returnOnEquity,
    snapshot.returnOnAssets,
    snapshot.profitMargin,
    snapshot.operatingMargin,
    snapshot.dividendYield,
    snapshot.beta,
    snapshot.currency,
    snapshot.exchange,
    snapshot.dataTimestamp,
    metrics.grahamNumber,
    metrics.priceToGrahamNumber,
    metrics.valueChecklistScore,
    metrics.dataCompletenessScore,
    JSON.stringify(metrics.valueChecklistExplanations),
    JSON.stringify(metrics.dataCompletenessExplanations),
    JSON.stringify(metrics.neutralLabels),
    JSON.stringify(raw)
  );
}

export function listRecentSnapshots(limit = 50) {
  const statement = getDb().prepare(`
    SELECT *
    FROM stock_snapshots
    ORDER BY created_at DESC
    LIMIT ?
  `);

  return statement.all(limit).map(mapRowToSnapshotRecord);
}

function mapRowToSnapshotRecord(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    provider: row.provider,
    snapshot: {
      ticker: row.ticker,
      companyName: row.company_name,
      marketCap: row.market_cap,
      price: row.price,
      trailingPE: row.trailing_pe,
      forwardPE: row.forward_pe,
      priceToBook: row.price_to_book,
      epsTrailingTwelveMonths: row.eps_trailing_twelve_months,
      bookValuePerShare: row.book_value_per_share,
      debtToEquity: row.debt_to_equity,
      currentRatio: row.current_ratio,
      returnOnEquity: row.return_on_equity,
      returnOnAssets: row.return_on_assets,
      profitMargin: row.profit_margin,
      operatingMargin: row.operating_margin,
      dividendYield: row.dividend_yield,
      beta: row.beta,
      currency: row.currency,
      exchange: row.exchange,
      dataTimestamp: row.data_timestamp
    },
    metrics: {
      grahamNumber: row.graham_number,
      priceToGrahamNumber: row.price_to_graham_number,
      valueChecklistScore: row.value_checklist_score,
      dataCompletenessScore: row.data_completeness_score,
      valueChecklistExplanations: JSON.parse(row.value_checklist_explanations),
      dataCompletenessExplanations: JSON.parse(row.data_completeness_explanations),
      neutralLabels: JSON.parse(row.neutral_labels)
    }
  };
}
