import { NORMALIZED_FIELDS } from '../providers/providerTypes.js';

export function computeMetrics(snapshot) {
  const grahamNumber = computeGrahamNumber(snapshot);
  const priceToGrahamNumber =
    grahamNumber && snapshot.price ? snapshot.price / grahamNumber : null;
  const valueChecklist = computeValueChecklist(snapshot, priceToGrahamNumber);
  const dataCompleteness = computeDataCompleteness(snapshot);

  return {
    grahamNumber,
    priceToGrahamNumber,
    valueChecklistScore: valueChecklist.score,
    valueChecklistExplanations: valueChecklist.explanations,
    dataCompletenessScore: dataCompleteness.score,
    dataCompletenessExplanations: dataCompleteness.explanations,
    neutralLabels: buildNeutralLabels(snapshot, valueChecklist.score, dataCompleteness.score, priceToGrahamNumber)
  };
}

function computeGrahamNumber(snapshot) {
  const eps = snapshot.epsTrailingTwelveMonths;
  const bookValue = snapshot.bookValuePerShare;

  if (!isPositive(eps) || !isPositive(bookValue)) {
    return null;
  }

  // Graham Number formula: sqrt(22.5 * EPS * book value per share).
  // The 22.5 constant comes from Graham's combined 15 P/E and 1.5 P/B thresholds.
  return Math.sqrt(22.5 * eps * bookValue);
}

function computeValueChecklist(snapshot, priceToGrahamNumber) {
  const checks = [
    explainableCheck('Trailing P/E at or below 15', snapshot.trailingPE, (value) => value > 0 && value <= 15),
    explainableCheck('Price/book at or below 1.5', snapshot.priceToBook, (value) => value > 0 && value <= 1.5),
    explainableCheck('Price/Graham Number at or below 1', priceToGrahamNumber, (value) => value > 0 && value <= 1),
    explainableCheck('Current ratio at or above 2', snapshot.currentRatio, (value) => value >= 2),
    explainableCheck('Debt/equity at or below 100', snapshot.debtToEquity, (value) => value >= 0 && value <= 100),
    explainableCheck('Positive return on equity', snapshot.returnOnEquity, (value) => value > 0),
    explainableCheck('Positive profit margin', snapshot.profitMargin, (value) => value > 0)
  ];

  const availableChecks = checks.filter((check) => check.available);
  const passedChecks = availableChecks.filter((check) => check.passed);

  return {
    score: availableChecks.length ? Math.round((passedChecks.length / availableChecks.length) * 100) : null,
    explanations: checks
  };
}

function computeDataCompleteness(snapshot) {
  const checks = NORMALIZED_FIELDS.map((field) => ({
    field,
    available: snapshot[field] !== null && snapshot[field] !== undefined
  }));

  const availableCount = checks.filter((check) => check.available).length;

  return {
    score: Math.round((availableCount / checks.length) * 100),
    explanations: checks
  };
}

function buildNeutralLabels(snapshot, valueScore, completenessScore, priceToGrahamNumber) {
  const labels = [];

  if (completenessScore < 60) {
    labels.push('data incomplete');
  }

  if (snapshot.debtToEquity !== null && snapshot.debtToEquity > 100) {
    labels.push('balance sheet concern');
  }

  if (priceToGrahamNumber !== null && priceToGrahamNumber > 1.2) {
    labels.push('possibly expensive');
  }

  if (valueScore !== null && valueScore >= 70 && completenessScore >= 70) {
    labels.push('worth deeper review');
  }

  if (!labels.length) {
    labels.push('mixed signals');
  }

  return labels;
}

function explainableCheck(label, value, predicate) {
  const available = value !== null && value !== undefined;

  return {
    label,
    value,
    available,
    passed: available ? Boolean(predicate(value)) : false
  };
}

function isPositive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
