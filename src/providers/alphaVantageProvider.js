const BASE_URL = 'https://www.alphavantage.co/query';
const DEFAULT_REQUEST_DELAY_MS = 1300;

export const alphaVantageProvider = {
  name: 'alpha-vantage',

  async getSnapshot(ticker) {
    const cleanTicker = ticker.trim().toUpperCase();
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!cleanTicker) {
      throw new Error('Ticker is empty.');
    }

    if (!apiKey) {
      throw new Error('Alpha Vantage requires ALPHA_VANTAGE_API_KEY in your environment.');
    }

    const overview = await fetchAlphaVantageJson({
      function: 'OVERVIEW',
      symbol: cleanTicker,
      apikey: apiKey
    });

    assertUsableResponse(overview, cleanTicker, 'overview');

    await waitForPerSecondLimit();

    const quote = await fetchAlphaVantageJson({
      function: 'GLOBAL_QUOTE',
      symbol: cleanTicker,
      apikey: apiKey
    });

    assertUsableResponse(quote, cleanTicker, 'quote');

    const globalQuote = quote['Global Quote'] || {};

    return {
      snapshot: {
        ticker: nullableString(overview.Symbol) || cleanTicker,
        companyName: nullableString(overview.Name),
        marketCap: numberOrNull(overview.MarketCapitalization),
        price: numberOrNull(globalQuote['05. price']),
        trailingPE: numberOrNull(overview.TrailingPE || overview.PERatio),
        forwardPE: numberOrNull(overview.ForwardPE),
        priceToBook: numberOrNull(overview.PriceToBookRatio),
        epsTrailingTwelveMonths: numberOrNull(overview.EPS),
        bookValuePerShare: numberOrNull(overview.BookValue),
        debtToEquity: numberOrNull(overview.DebtEquity),
        currentRatio: numberOrNull(overview.CurrentRatio),
        returnOnEquity: numberOrNull(overview.ReturnOnEquityTTM),
        returnOnAssets: numberOrNull(overview.ReturnOnAssetsTTM),
        profitMargin: normalizeRatioPercent(overview.ProfitMargin),
        operatingMargin: normalizeRatioPercent(overview.OperatingMarginTTM),
        dividendYield: normalizeRatioPercent(overview.DividendYield),
        beta: numberOrNull(overview.Beta),
        currency: nullableString(overview.Currency),
        exchange: nullableString(overview.Exchange),
        dataTimestamp: new Date().toISOString()
      },
      raw: {
        overview,
        quote
      }
    };
  }
};

function waitForPerSecondLimit() {
  const delayMs = Number(process.env.ALPHA_VANTAGE_REQUEST_DELAY_MS || DEFAULT_REQUEST_DELAY_MS);

  if (!Number.isFinite(delayMs) || delayMs <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function fetchAlphaVantageJson(params) {
  const url = new URL(BASE_URL);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Alpha Vantage returned HTTP ${response.status}.`);
  }

  return response.json();
}

function assertUsableResponse(payload, ticker, responseName) {
  if (payload.Note) {
    throw new Error(`Alpha Vantage rate limit reached: ${payload.Note}`);
  }

  if (payload.Information) {
    throw new Error(`Alpha Vantage notice: ${payload.Information}`);
  }

  if (payload['Error Message']) {
    throw new Error(`Alpha Vantage error for ${ticker}: ${payload['Error Message']}`);
  }

  if (!payload || Object.keys(payload).length === 0) {
    throw new Error(`Alpha Vantage returned no ${responseName} data for ${ticker}.`);
  }
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '' || value === 'None' || value === 'None%') {
    return null;
  }

  const numberValue = Number(String(value).replace('%', ''));
  return Number.isFinite(numberValue) ? numberValue : null;
}

function nullableString(value) {
  return typeof value === 'string' && value.trim() && value !== 'None' ? value.trim() : null;
}

function normalizeRatioPercent(value) {
  const numericValue = numberOrNull(value);

  if (numericValue === null) {
    return null;
  }

  return Math.abs(numericValue) <= 1 ? numericValue * 100 : numericValue;
}
