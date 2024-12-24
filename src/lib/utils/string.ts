import { customAlphabet } from 'nanoid';

export const randomString = (length: number = 10) => {
  return customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    length
  )();
};
