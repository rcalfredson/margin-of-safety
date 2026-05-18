import { Router } from 'express';
import {
  fetchAndStoreSnapshots,
  getDefaultProviderName,
  getProviderOptions,
  getRecentSnapshots,
  parseTickers
} from '../services/snapshotService.js';
import { renderHome } from '../views/homeView.js';

export const router = Router();

router.get('/', (request, response) => {
  response.send(renderHome(homeViewData()));
});

router.post('/screen', async (request, response) => {
  const tickersInput = request.body.tickers || '';
  const providerName = request.body.providerName || getDefaultProviderName();
  const tickers = parseTickers(tickersInput);

  if (!tickers.length) {
    response.status(400).send(renderHome({
      ...homeViewData({ providerName }),
      tickers: tickersInput,
      error: 'Enter at least one ticker.'
    }));
    return;
  }

  const results = await fetchAndStoreSnapshots(tickers, providerName);

  response.send(renderHome({
    ...homeViewData({ providerName }),
    results,
    tickers: tickersInput
  }));
});

function homeViewData(overrides = {}) {
  return {
    records: getRecentSnapshots(),
    providerOptions: getProviderOptions(),
    selectedProviderName: getDefaultProviderName(),
    ...overrides
  };
}
