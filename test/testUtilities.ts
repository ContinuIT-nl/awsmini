// deno-coverage-ignore-file
import { AWSClient } from '../src/mod.ts';
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
export const clientR2 = new AWSClient({
  endpoint: process.env.R2_ENDPOINT_URL,
  accessKeyId: process.env.R2_ACCESS_KEY,
  secretAccessKey: process.env.R2_SECRET_KEY,
  region: process.env.R2_REGION,
  fetch: logFetch,
});

export const clientAWS = new AWSClient({
  endpoint: '',
  accessKeyId: process.env.AWSCIT_ACCESS_KEY,
  secretAccessKey: process.env.AWSCIT_SECRET_KEY,
  region: process.env.AWSCIT_REGION,
  fetch: logFetch,
});

export const clientS3H = new AWSClient({
  endpoint: process.env.S3H_ENDPOINT,
  accessKeyId: process.env.S3H_ACCESS_KEY,
  secretAccessKey: process.env.S3H_SECRET_KEY,
  region: process.env.S3H_REGION,
  fetch: logFetch,
});
