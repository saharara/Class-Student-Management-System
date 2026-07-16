export const normalizeHobbyOptions = items => (Array.isArray(items) ? items : [])
  .map(item => {
    const code = Number(item.code);
    const bit = Number(item.bit);
    const mask = Number(item.mask || (Number.isInteger(bit) ? 2 ** bit : 0));

    return {
      code,
      bit,
      mask,
      label: item.label || item.name || '',
    };
  })
  .filter(item => Number.isInteger(item.code) && item.code > 0 && item.mask > 0 && item.label);

export const getHobbyMask = (codes, options) => {
  const selectedCodes = new Set((codes || []).map(Number));
  return normalizeHobbyOptions(options).reduce(
    (total, item) => total + (selectedCodes.has(item.code) ? item.mask : 0),
    0
  );
};

export const getHobbyLabels = (mask, options) => {
  const value = Number(mask || 0);
  return normalizeHobbyOptions(options)
    .filter(item => Math.floor(value / item.mask) % 2 === 1)
    .map(item => item.label);
};