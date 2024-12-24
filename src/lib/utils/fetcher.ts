import { AppError, UnknownError } from '@/types/errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const error = await res.json();
    if (error?.message && error?.code) {
      throw new AppError(error.message, error.code);
    }
    throw new UnknownError(error.message);
  }

  return res.json();
}
