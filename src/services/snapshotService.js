import { insertSnapshot, listRecentSnapshots } from '../db.js';
import { alphaVantageProvider } from '../providers/alphaVantageProvider.js';
import { mockProvider } from '../providers/mockProvider.js';
import { yahooProvider } from '../providers/yahooProvider.js';
import { computeMetrics } from './metricsService.js';

const configuredProviderName = process.env.DEFAULT_PROVIDER;
const defaultProviderName =
  configuredProviderName || (process.env.ALPHA_VANTAGE_API_KEY ? alphaVantageProvider.name : mockProvider.name);
const providers = new Map([
  [alphaVantageProvider.name, alphaVantageProvider],
  [mockProvider.name, mockProvider],
  [yahooProvider.name, yahooProvider]
]);

export async function fetchAndStoreSnapshots(tickers, providerName = defaultProviderName) {
  const provider = providers.get(providerName) || providers.get(defaultProviderName);

  if (!provider) {
    throw new Error(`Unknown data provider: ${providerName}`);
  }

  const uniqueTickers = [...new Set(tickers.map(normalizeTicker).filter(Boolean))];
  const results = [];

  for (const ticker of uniqueTickers) {
    try {
      const { snapshot, raw } = await provider.getSnapshot(ticker);
      const metrics = computeMetrics(snapshot);
      insertSnapshot(snapshot, raw, metrics, provider.name);
      results.push({ ok: true, snapshot, metrics, provider: provider.name });
    } catch (error) {
      results.push({
        ok: false,
        ticker,
        provider: provider.name,
        error: providerErrorMessage(error)
      });
    }
  }

  return results;
}

export function getRecentSnapshots() {
  return listRecentSnapshots(100);
}

export function getProviderOptions() {
  return [...providers.values()].map((provider) => ({
    name: provider.name,
    label: providerLabel(provider.name)
  }));
}

export function getDefaultProviderName() {
  return providers.has(defaultProviderName) ? defaultProviderName : mockProvider.name;
}

export function parseTickers(input) {
  return String(input || '')
    .split(',')
    .map(normalizeTicker)
    .filter(Boolean);
}

function normalizeTicker(ticker) {
  return String(ticker || '').trim().toUpperCase();
}

function providerLabel(providerName) {
  if (providerName === alphaVantageProvider.name) {
    return 'Alpha Vantage';
  }

  if (providerName === mockProvider.name) {
    return 'Mock fixtures';
  }

  return 'Yahoo Finance';
}

function providerErrorMessage(error) {
  const message = error?.message || '';

  if (message.includes('Too Many Requests')) {
    return 'Provider rate limit reached. Try again later or switch providers.';
  }

  if (error?.message) {
    return error.message;
  }

  return 'Provider failed to return data for this ticker.';
}
