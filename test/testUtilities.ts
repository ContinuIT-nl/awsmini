import { AWSClient, clientConfigEnv } from '../src/mod.ts';
import * as process from 'node:process';

const headersToString = (headers: Headers) =>
  [...headers.entries()].map(([key, value]) => `${key}: ${value}`).join('\n');

const logRequest = false;
const logResponse = false;

const logFetch = async (input: string | URL | globalThis.Request, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  if (logRequest) console.log(`${init?.method ?? 'GET'} ${input}\n${headersToString(headers)}`);
  const response = await fetch(input, init);
  const responseHeaders = new Headers(response.headers);
  if (logResponse) console.log(`\n${response.status} ${response.statusText}\n${headersToString(responseHeaders)}`);
  return response;
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Clients
export const clientR2 = new AWSClient(clientConfigEnv({ fetch: logFetch }));

export const clientAWS = new AWSClient({
  endpoint: '',
  accessKeyId: process.env.AWS2_ACCESS_KEY,
  secretAccessKey: process.env.AWS2_SECRET_KEY,
  region: process.env.AWS2_REGION,
  fetch: logFetch,
});
