const columns = [
  ['Ticker', 'ticker'],
  ['Company', 'companyName'],
  ['Price', 'price'],
  ['Market Cap', 'marketCap'],
  ['Trailing P/E', 'trailingPE'],
  ['Forward P/E', 'forwardPE'],
  ['P/B', 'priceToBook'],
  ['EPS TTM', 'epsTrailingTwelveMonths'],
  ['Book/Share', 'bookValuePerShare'],
  ['Graham #', 'grahamNumber'],
  ['Price/Graham', 'priceToGrahamNumber'],
  ['Debt/Equity', 'debtToEquity'],
  ['Current Ratio', 'currentRatio'],
  ['ROE', 'returnOnEquity'],
  ['Profit Margin', 'profitMargin'],
  ['Dividend Yield', 'dividendYield'],
  ['Value Score', 'valueChecklistScore'],
  ['Completeness', 'dataCompletenessScore'],
  ['Labels', 'neutralLabels']
];

export function renderHome({
  records = [],
  results = [],
  tickers = '',
  error = '',
  providerOptions = [],
  selectedProviderName = ''
}) {
  return layout(`
    <section class="intro">
      <h1>Margin of Safety</h1>
      <p>Compare fundamentals across valuation, balance-sheet strength, profitability, and data completeness.</p>
      <p class="disclaimer">Educational research only. This tool does not provide investment, financial, tax, or legal advice.</p>
    </section>

    <section class="screen-form">
      <form method="post" action="/screen">
        <div class="control-row">
          <div class="ticker-field">
            <label for="tickers">Stock tickers</label>
            <input id="tickers" name="tickers" type="text" value="${escapeHtml(tickers)}" placeholder="AAPL, MSFT, BRK-B" autocomplete="off" />
          </div>
          ${renderProviderSelect(providerOptions, selectedProviderName)}
          <div class="submit-field">
            <button type="submit">Fetch snapshots</button>
          </div>
        </div>
        <p class="hint">Use mock fixtures for reliable local development. Alpha Vantage needs a free API key. Yahoo Finance is unofficial and may be incomplete, unavailable, or rate-limited.</p>
      </form>
    </section>

    ${error ? `<div class="notice error">${escapeHtml(error)}</div>` : ''}
    ${renderProviderResults(results)}
    ${renderTable(records)}
  `);
}

function renderProviderSelect(providerOptions, selectedProviderName) {
  if (!providerOptions.length) {
    return '';
  }

  return `
    <div class="provider-field">
      <label for="providerName">Provider</label>
      <select id="providerName" name="providerName">
        ${providerOptions.map((provider) => `
          <option value="${escapeHtml(provider.name)}" ${provider.name === selectedProviderName ? 'selected' : ''}>
            ${escapeHtml(provider.label)}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

function layout(body) {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Margin of Safety</title>
      <link rel="stylesheet" href="/styles.css" />
      <script src="/app.js" defer></script>
    </head>
    <body>
      <main class="page">${body}</main>
    </body>
  </html>`;
}

function renderProviderResults(results) {
  if (!results.length) {
    return '';
  }

  const failures = results.filter((result) => !result.ok);
  const successes = results.filter((result) => result.ok);

  return `
    <section class="provider-results">
      ${successes.length ? `<div class="notice success">Stored ${successes.length} snapshot${successes.length === 1 ? '' : 's'}.</div>` : ''}
      ${failures.map((failure) => `
        <div class="notice error">
          <strong>${escapeHtml(failure.ticker)}</strong>: ${escapeHtml(failure.error)}
        </div>
      `).join('')}
    </section>
  `;
}

function renderTable(records) {
  if (!records.length) {
    return `
      <section class="empty-state">
        <h2>No snapshots yet</h2>
        <p>Enter a few tickers to create your first fundamentals comparison.</p>
      </section>
    `;
  }

  return `
    <section class="comparison">
      <div class="section-heading">
        <h2>Recent snapshots</h2>
        <span>${records.length} saved</span>
      </div>
      <div class="table-wrap">
        <table data-sortable>
          <thead>
            <tr>
              ${columns.map(([label, key]) => `<th><button type="button" data-sort-key="${key}">${escapeHtml(label)}</button></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${records.map(renderRow).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderRow(record) {
  const snapshot = record.snapshot;
  const metrics = record.metrics;
  const row = {
    ...snapshot,
    ...metrics,
    neutralLabels: metrics.neutralLabels.join(', ')
  };

  return `
    <tr>
      ${columns.map(([, key]) => `<td data-value="${sortValue(row[key])}">${formatCell(key, row[key])}</td>`).join('')}
    </tr>
    <tr class="details-row">
      <td colspan="${columns.length}">
        <details>
          <summary>Why these scores for ${escapeHtml(snapshot.ticker)}?</summary>
          <div class="details-grid">
            <div>
              <h3>Value checklist</h3>
              <ul>${metrics.valueChecklistExplanations.map(renderValueExplanation).join('')}</ul>
            </div>
            <div>
              <h3>Data completeness</h3>
              <p>${formatPercent(metrics.dataCompletenessScore)} of normalized fields available.</p>
              <p class="muted">${missingFields(metrics.dataCompletenessExplanations)}</p>
            </div>
          </div>
        </details>
      </td>
    </tr>
  `;
}

function renderValueExplanation(item) {
  const state = item.available ? (item.passed ? 'passed' : 'did not pass') : 'missing';
  return `<li><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(state)}</strong></li>`;
}

function missingFields(explanations) {
  const missing = explanations.filter((item) => !item.available).map((item) => item.field);
  return missing.length ? `Missing: ${missing.join(', ')}` : 'No normalized fields missing.';
}

function formatCell(key, value) {
  if (value === null || value === undefined || value === '') {
    return '<span class="missing">Missing</span>';
  }

  if (key === 'marketCap') {
    return escapeHtml(formatLargeNumber(value));
  }

  if (['returnOnEquity', 'returnOnAssets', 'profitMargin', 'operatingMargin', 'dividendYield', 'valueChecklistScore', 'dataCompletenessScore'].includes(key)) {
    return escapeHtml(formatPercent(value));
  }

  if (typeof value === 'number') {
    return escapeHtml(formatNumber(value));
  }

  if (key === 'neutralLabels') {
    return String(value)
      .split(', ')
      .map((label) => `<span class="label">${escapeHtml(label)}</span>`)
      .join(' ');
  }

  return escapeHtml(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function formatPercent(value) {
  if (value === null || value === undefined) {
    return 'Missing';
  }

  const normalized = Math.abs(value) <= 1 ? value * 100 : value;
  return `${formatNumber(normalized)}%`;
}

function formatLargeNumber(value) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(value);
}

function sortValue(value) {
  if (Array.isArray(value)) {
    return escapeHtml(value.join(', '));
  }

  if (value === null || value === undefined) {
    return '';
  }

  return escapeHtml(String(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
