/**
 * @typedef {Object} StockSnapshot
 * @property {string} ticker
 * @property {string|null} companyName
 * @property {number|null} marketCap
 * @property {number|null} price
 * @property {number|null} trailingPE
 * @property {number|null} forwardPE
 * @property {number|null} priceToBook
 * @property {number|null} epsTrailingTwelveMonths
 * @property {number|null} bookValuePerShare
 * @property {number|null} debtToEquity
 * @property {number|null} currentRatio
 * @property {number|null} returnOnEquity
 * @property {number|null} returnOnAssets
 * @property {number|null} profitMargin
 * @property {number|null} operatingMargin
 * @property {number|null} dividendYield
 * @property {number|null} beta
 * @property {string|null} currency
 * @property {string|null} exchange
 * @property {string} dataTimestamp
 */

/**
 * Data providers should implement this small surface so Yahoo Finance can be
 * swapped out for a supported API later.
 *
 * @typedef {Object} StockDataProvider
 * @property {string} name
 * @property {(ticker: string) => Promise<{ snapshot: StockSnapshot, raw: unknown }>} getSnapshot
 */

export const NORMALIZED_FIELDS = [
  'companyName',
  'marketCap',
  'price',
  'trailingPE',
  'forwardPE',
  'priceToBook',
  'epsTrailingTwelveMonths',
  'bookValuePerShare',
  'debtToEquity',
  'currentRatio',
  'returnOnEquity',
  'returnOnAssets',
  'profitMargin',
  'operatingMargin',
  'dividendYield',
  'beta',
  'currency',
  'exchange'
];
