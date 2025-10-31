export function displayValue(value: any, fallback = 'Não definido') {
  if (value === undefined || value === null || value === '') return fallback;
  return value;
}

export function displayCurrency(value: any, fallback = 'Não definido') {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

export function displayDate(value: any, fallback = 'Não definido') {
  if (!value) return fallback;
  try {
    return new Date(value).toLocaleDateString();
  } catch (e) {
    return String(value);
  }
}
