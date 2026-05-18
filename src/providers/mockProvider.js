const fixtures = {
  AAPL: {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    marketCap: 2930000000000,
    price: 190.25,
    trailingPE: 29.6,
    forwardPE: 25.4,
    priceToBook: 39.1,
    epsTrailingTwelveMonths: 6.43,
    bookValuePerShare: 4.86,
    debtToEquity: 145.0,
    currentRatio: 0.95,
    returnOnEquity: 0.56,
    returnOnAssets: 0.28,
    profitMargin: 0.25,
    operatingMargin: 0.31,
    dividendYield: 0.0052,
    beta: 1.18,
    currency: 'USD',
    exchange: 'NasdaqGS'
  },
  BRK_B: {
    ticker: 'BRK-B',
    companyName: 'Berkshire Hathaway Inc.',
    marketCap: 1040000000000,
    price: 482.4,
    trailingPE: 12.1,
    forwardPE: 20.2,
    priceToBook: 1.55,
    epsTrailingTwelveMonths: 39.85,
    bookValuePerShare: 311.25,
    debtToEquity: 23.0,
    currentRatio: 1.8,
    returnOnEquity: 0.13,
    returnOnAssets: 0.06,
    profitMargin: 0.19,
    operatingMargin: 0.23,
    dividendYield: null,
    beta: 0.86,
    currency: 'USD',
    exchange: 'NYSE'
  },
  F: {
    ticker: 'F',
    companyName: 'Ford Motor Company',
    marketCap: 48500000000,
    price: 12.15,
    trailingPE: 11.3,
    forwardPE: 6.9,
    priceToBook: 1.15,
    epsTrailingTwelveMonths: 1.08,
    bookValuePerShare: 10.56,
    debtToEquity: 320.0,
    currentRatio: 1.18,
    returnOnEquity: 0.09,
    returnOnAssets: 0.02,
    profitMargin: 0.03,
    operatingMargin: 0.05,
    dividendYield: 0.049,
    beta: 1.62,
    currency: 'USD',
    exchange: 'NYSE'
  },
  MISSING: {
    ticker: 'MISSING',
    companyName: 'Sparse Data Example Corp.',
    marketCap: null,
    price: 22.5,
    trailingPE: null,
    forwardPE: null,
    priceToBook: null,
    epsTrailingTwelveMonths: null,
    bookValuePerShare: 8.1,
    debtToEquity: null,
    currentRatio: null,
    returnOnEquity: null,
    returnOnAssets: null,
    profitMargin: null,
    operatingMargin: null,
    dividendYield: null,
    beta: null,
    currency: 'USD',
    exchange: null
  }
};

export const mockProvider = {
  name: 'mock-fixtures',

  async getSnapshot(ticker) {
    const key = normalizeFixtureKey(ticker);
    const fixture = fixtures[key];

    if (!fixture) {
      throw new Error(`No mock fixture exists for ${ticker}. Try AAPL, BRK-B, F, or MISSING.`);
    }

    return {
      snapshot: {
        ...fixture,
        dataTimestamp: new Date().toISOString()
      },
      raw: {
        source: 'local fixture',
        fixtureKey: key,
        fixture
      }
    };
  }
};

function normalizeFixtureKey(ticker) {
  return String(ticker || '').trim().toUpperCase().replaceAll('-', '_').replaceAll('.', '_');
}
