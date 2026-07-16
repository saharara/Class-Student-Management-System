import { STUDENT_RULE } from './studentRules';

export const VALIDATED_FIELDS = [
  'code',
  'fullname',
  'dob',
  'classId',
  'email',
  'facebook',
  'username',
  'password',
  'hometown',
  'address',
  'hairColor',
];

export const getPasswordChecks = password => [
  { key: 'length', label: 'Tối thiểu 8 ký tự', passed: password.length >= 8 },
  { key: 'upper', label: 'Có chữ hoa', passed: /[A-Z]/.test(password) },
  { key: 'lower', label: 'Có chữ thường', passed: /[a-z]/.test(password) },
  { key: 'number', label: 'Có số', passed: /[0-9]/.test(password) },
  { key: 'special', label: 'Có ký tự đặc biệt', passed: /[^A-Za-z0-9\s]/.test(password) },
];

const getValue = (field, data, color) => {
  if (field === 'hairColor') {
    return color?.color;
  }

  return data[field];
};

const normalizeValue = value => (typeof value === 'string' ? value.trim() : value);

const hasDuplicate = (field, value, existingStudents = []) => {
  const normalizedValue = String(value).trim().toLowerCase();
  return existingStudents.some(
    student => String(student[field] || '').toLowerCase() === normalizedValue
  );
};

export const getFieldError = (field, data, color, existingStudents = []) => {
  const fieldRules = STUDENT_RULE.rules[field];
  const fieldMessages = STUDENT_RULE.message[field];

  if (!fieldRules || !fieldMessages) {
    return undefined;
  }

  const value = normalizeValue(getValue(field, data, color));

  if (fieldRules.required && !value) {
    return fieldMessages.required;
  }

  if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
    return fieldMessages.minLength;
  }

  if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
    return fieldMessages.maxLength;
  }

  if (fieldRules.beforeNow && value && new Date(value) >= new Date()) {
    return fieldMessages.beforeNow;
  }

  if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
    return fieldMessages.pattern;
  }

  if (fieldRules.uniqueField && value && hasDuplicate(fieldRules.uniqueField, value, existingStudents)) {
    return fieldMessages.unique;
  }

  return undefined;
};

export const getPhotoError = file => {
  if (!file) {
    return undefined;
  }

  const photoRules = STUDENT_RULE.rules.photo;
  const photoMessages = STUDENT_RULE.message.photo;
  const extension = file.name.split('.').pop().toLowerCase();

  if (!photoRules.allowedTypes.includes(extension)) {
    return photoMessages.allowedTypes;
  }

  if (file.size > photoRules.maxSize) {
    return photoMessages.maxSize;
  }

  return undefined;
};