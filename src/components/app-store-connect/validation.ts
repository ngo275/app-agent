import { isUUID } from 'validator';

export const validateKeyId = (
  value: string
): { isValid: boolean; error: string } => {
  if (value.length !== 10) {
    return { isValid: false, error: 'key-id-error' };
  }
  return { isValid: true, error: '' };
};

export const validateIssuerId = (
  value: string
): { isValid: boolean; error: string } => {
  if (!isUUID(value)) {
    return { isValid: false, error: 'issuer-id-error' };
  }
  return { isValid: true, error: '' };
};

export const validateP8File = (
  file: File | null
): { isValid: boolean; error: string } => {
  if (!file) {
    return { isValid: false, error: 'p8-file-error' };
  }
  if (!file.name.endsWith('.p8')) {
    return { isValid: false, error: 'p8-file-error-2' };
  }
  return { isValid: true, error: '' };
};
