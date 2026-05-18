import yahooFinance from 'yahoo-finance2';

const quoteSummaryModules = [
  'price',
  'summaryDetail',
  'defaultKeyStatistics',
  'financialData'
];

if (process.env.YAHOO_FINANCE_SUPPRESS_NOTICES !== 'false') {
  yahooFinance.suppressNotices(['yahooSurvey']);
}

export const yahooProvider = {
  name: 'yahoo-finance2',

  async getSnapshot(ticker) {
    const cleanTicker = ticker.trim().toUpperCase();

    if (!cleanTicker) {
      throw new Error('Ticker is empty.');
    }

    const raw = await yahooFinance.quoteSummary(cleanTicker, {
      modules: quoteSummaryModules
    });

    const price = raw.price || {};
    const summary = raw.summaryDetail || {};
    const stats = raw.defaultKeyStatistics || {};
    const financial = raw.financialData || {};

    return {
      snapshot: {
        ticker: price.symbol || cleanTicker,
        companyName: nullableString(price.longName || price.shortName),
        marketCap: numberOrNull(price.marketCap ?? summary.marketCap),
        price: numberOrNull(price.regularMarketPrice ?? financial.currentPrice),
        trailingPE: numberOrNull(summary.trailingPE ?? stats.trailingPE),
        forwardPE: numberOrNull(summary.forwardPE ?? stats.forwardPE),
        priceToBook: numberOrNull(stats.priceToBook),
        epsTrailingTwelveMonths: numberOrNull(stats.trailingEps),
        bookValuePerShare: numberOrNull(stats.bookValue),
        debtToEquity: numberOrNull(financial.debtToEquity),
        currentRatio: numberOrNull(financial.currentRatio),
        returnOnEquity: numberOrNull(financial.returnOnEquity),
        returnOnAssets: numberOrNull(financial.returnOnAssets),
        profitMargin: numberOrNull(financial.profitMargins),
        operatingMargin: numberOrNull(financial.operatingMargins),
        dividendYield: normalizeYield(summary.dividendYield),
        beta: numberOrNull(summary.beta),
        currency: nullableString(price.currency),
        exchange: nullableString(price.exchangeName || price.exchange),
        dataTimestamp: new Date().toISOString()
      },
      raw
    };
  }
};

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function nullableString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeYield(value) {
  const numericValue = numberOrNull(value);
  if (numericValue === null) {
    return null;
  }

  return numericValue <= 1 ? numericValue * 100 : numericValue;
}
