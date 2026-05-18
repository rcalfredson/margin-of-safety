document.querySelectorAll('table[data-sortable]').forEach((table) => {
  table.querySelectorAll('th button[data-sort-key]').forEach((button, columnIndex) => {
    button.addEventListener('click', () => sortTable(table, columnIndex, button));
  });
});

function sortTable(table, columnIndex, button) {
  const tbody = table.querySelector('tbody');
  const pairs = [];
  const rows = Array.from(tbody.querySelectorAll('tr'));

  for (let index = 0; index < rows.length; index += 2) {
    pairs.push([rows[index], rows[index + 1]]);
  }

  const direction = button.dataset.direction === 'asc' ? 'desc' : 'asc';
  table.querySelectorAll('th button').forEach((otherButton) => {
    otherButton.dataset.direction = '';
  });
  button.dataset.direction = direction;

  pairs.sort(([left], [right]) => {
    const leftValue = cellValue(left.children[columnIndex]);
    const rightValue = cellValue(right.children[columnIndex]);
    const comparison = compareValues(leftValue, rightValue);
    return direction === 'asc' ? comparison : -comparison;
  });

  tbody.replaceChildren(...pairs.flat());
}

function cellValue(cell) {
  const value = cell?.dataset.value || '';
  const numeric = Number(value);
  return Number.isFinite(numeric) && value.trim() !== '' ? numeric : value.toLowerCase();
}

function compareValues(left, right) {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}
