import type { APIResponse } from "@playwright/test";

/**
 * Executes a request function with automatic retries in case of HTTP 429 (Too Many Requests) responses.
 *
 * The function retries the request up to a specified number of times with exponential backoff delays.
 *
 * @param {() => Promise<APIResponse>} reqFn - A function that returns a Promise resolving to an APIResponse.
 * @param {number} [retries=3] - The maximum number of retry attempts after receiving a 429 response.
 * @param {number} [backoff=500] - The base delay (in milliseconds) between retries, multiplied by the attempt number.
 * @returns {Promise<APIResponse>} A promise that resolves to the successful API response, or rejects if retries are exhausted.
 * @throws {Error} If all retry attempts result in a 429 response.
 *
 * @example
 * import { requestWithRetryOn429 } from './utils/requestWithRetry';
 * import { request } from '@playwright/test';
 *
 * const context = await request.newContext();
 *
 * async function makeApiCall() {
 *   return context.get('https://api.example.com/data');
 * }
 *
 * const response = await requestWithRetryOn429(makeApiCall, 5, 500);
 * const data = await response.json();
 * console.log(data);
 */
export async function requestWithRetryOn429(
  reqFn: () => Promise<APIResponse>,
  retries: number = 3,
  backoff: number = 500,
): Promise<APIResponse> {
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < retries; i++) {
    const response = await reqFn();
    if (response.status() !== 429) return response;
    await delay(backoff * (i + 1));
  }

  throw new Error("Too many retries due to 429 errors");
}
