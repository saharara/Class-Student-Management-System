const normalize = value => String(value || '').trim().toLowerCase();

export const getNextCopyValue = (original, existingValues = [], maxLength) => {
  const usedValues = new Set(existingValues.map(normalize));
  let index = 1;
  let suffix = `(${index})`;
  let base = maxLength ? String(original || '').slice(0, Math.max(maxLength - suffix.length, 0)) : original;
  let candidate = `${base}${suffix}`;
  while (usedValues.has(normalize(candidate))) {
    index += 1;
    suffix = `(${index})`;
    base = maxLength ? String(original || '').slice(0, Math.max(maxLength - suffix.length, 0)) : original;
    candidate = `${base}${suffix}`;
  }
  return candidate;
};

export const getNextCopyEmail = (original, existingValues = [], maxLength) => {
  const value = String(original || '');
  const separatorIndex = value.indexOf('@');
  if (separatorIndex < 1) {
    return getNextCopyValue(value, existingValues, maxLength);
  }
  const localPart = value.slice(0, separatorIndex);
  const domainPart = value.slice(separatorIndex);
  const usedValues = new Set(existingValues.map(normalize));
  let index = 1;
  let suffix = `_${index}`;
  let trimmedLocal = maxLength
    ? localPart.slice(0, Math.max(maxLength - suffix.length - domainPart.length, 0))
    : localPart;
  let candidate = `${trimmedLocal}${suffix}${domainPart}`;
  while (usedValues.has(normalize(candidate))) {
    index += 1;
    suffix = `_${index}`;
    trimmedLocal = maxLength
      ? localPart.slice(0, Math.max(maxLength - suffix.length - domainPart.length, 0))
      : localPart;
    candidate = `${trimmedLocal}${suffix}${domainPart}`;
  }
  return candidate;
};
