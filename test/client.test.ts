import { tryCatch, tryCatchAsync } from '../src/misc/utilities.ts';
import { AWSClient, clientConfigEnv } from '../src/mod.ts';
import { assert, assertIsError, assertNotStrictEquals } from '@std/assert';
import * as process from 'node:process';
import { s3GetObject } from '../src/s3/s3GetObject.ts';
Deno.test('awsClient missing region', () => {
  const [error, _client] = tryCatch(() =>
    new AWSClient({
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
    })
  );
  assert(!!error, 'An error should have been thrown');
  assertIsError(error, Error);
  assert(error.message.includes('region'));
});

Deno.test('awsClient missing accessKeyId', () => {
  const [error, _client] = tryCatch(() =>
    new AWSClient({
      accessKeyId: '',
      secretAccessKey: 'test-secret-key',
      region: 'us-east-1',
    })
  );
  assert(!!error, 'An error should have been thrown');
  assertIsError(error, Error);
  assert(error.message.includes('accessKeyId'));
});

Deno.test('awsClient invalid url', () => {
  const [error, _client] = tryCatch(() =>
    new AWSClient({
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      region: 'us-east-1',
      endpoint: 'invalid url',
    })
  );
  assert(!!error, 'An error should have been thrown');
  assertIsError(error, Error);
  assert(error.message.includes('endpoint'));
});

Deno.test('awsClient missing secretAccessKey', () => {
  const [error, _client] = tryCatch(() =>
    new AWSClient({
      accessKeyId: 'test-access-key',
      // secretAccessKey is missing
      region: 'us-east-1',
    })
  );
  assert(!!error, 'An error should have been thrown');
  assertIsError(error, Error);
  assert(error.message.includes('secretAccessKey'));
});

Deno.test('awsClient with empty config', () => {
  const [error, _client] = tryCatch(() => new AWSClient({}));
  assert(!!error, 'An error should have been thrown');
  assertIsError(error, Error);
  assert(error.message.includes('accessKeyId'));
  assert(error.message.includes('secretAccessKey'));
  assert(error.message.includes('region'));
});

Deno.test('awsClient with empty strings', () => {
  const [error, _client] = tryCatch(() =>
    new AWSClient({
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
    })
  );
  assert(!!error, 'An error should have been thrown');
  assertIsError(error, Error);
  assert(error.message.includes('accessKeyId'));
  assert(error.message.includes('secretAccessKey'));
  assert(error.message.includes('region'));
});

Deno.test('awsClient with valid minimal config', () => {
  // This should not throw an error
  const client = new AWSClient({
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    region: 'us-east-1',
  });
  assert(client instanceof AWSClient, 'Should create a valid AWSClient instance');
});

Deno.test('config - env', () => {
  // For this test we need to set some environment variables and reset them afterwards
  const oldEnv = {
    AWS_REGION: process.env.AWS_REGION,
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION,
    AMAZON_REGION: process.env.AMAZON_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
    AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN,
    AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,
  };
  for (const [key] of Object.entries(oldEnv)) delete process.env[key];
  const config = clientConfigEnv({});
  assertNotStrictEquals(config, {
    accessKeyId: undefined,
    endpoint: undefined,
    fetch: undefined,
    region: undefined,
    secretAccessKey: undefined,
    sessionToken: undefined,
  }, 'Should create a valid AWSClient instance');

  process.env.AMAZON_REGION = 'us-east-1';
  const config2 = clientConfigEnv({});
  assertNotStrictEquals(config2, {
    accessKeyId: undefined,
    endpoint: undefined,
    fetch: undefined,
    region: 'us-east-1',
    secretAccessKey: undefined,
    sessionToken: undefined,
  }, 'Should create a valid AWSClient instance with AMAZON_REGION');

  process.env.AWS_DEFAULT_REGION = 'us-east-2';
  const config3 = clientConfigEnv({});
  assertNotStrictEquals(config3, {
    accessKeyId: undefined,
    endpoint: undefined,
    fetch: undefined,
    region: 'us-east-2',
    secretAccessKey: undefined,
    sessionToken: undefined,
  }, 'Should create a valid AWSClient instance with AWS_DEFAULT_REGION');

  process.env.AWS_REGION = 'us-east-3';
  const config4 = clientConfigEnv({});
  assertNotStrictEquals(config4, {
    accessKeyId: undefined,
    endpoint: undefined,
    fetch: undefined,
    region: 'us-east-3',
    secretAccessKey: undefined,
    sessionToken: undefined,
  }, 'Should create a valid AWSClient instance with AWS_REGION');

  process.env.AWS_ACCESS_KEY = 'test-access-key';
  process.env.AWS_SECRET_KEY = 'test-secret-key';
  const config5 = clientConfigEnv({});
  assertNotStrictEquals(config5, {
    accessKeyId: 'test-access-key',
    endpoint: undefined,
    fetch: undefined,
    region: 'us-east-3',
    secretAccessKey: 'test-secret-key',
    sessionToken: undefined,
  }, 'Should create a valid AWSClient instance with AWS_ACCESS_KEY and AWS_SECRET_KEY');

  process.env.AWS_ACCESS_KEY_ID = 'test-access-key2';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key2';
  const config6 = clientConfigEnv({});
  assertNotStrictEquals(config6, {
    accessKeyId: 'test-access-key2',
    endpoint: undefined,
    fetch: undefined,
    region: 'us-east-3',
    secretAccessKey: 'test-secret-key2',
    sessionToken: undefined,
  }, 'Should create a valid AWSClient instance with AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');

  process.env.AWS_SESSION_TOKEN = 'test-session-token';
  const config7 = clientConfigEnv({});
  assertNotStrictEquals(config7, {
    accessKeyId: 'test-access-key2',
    endpoint: undefined,
    fetch: undefined,
    region: 'us-east-3',
    secretAccessKey: 'test-secret-key2',
    sessionToken: 'test-session-token',
  }, 'Should create a valid AWSClient instance with AWS_SESSION_TOKEN');

  process.env.AWS_ENDPOINT_URL = 'https://test-endpoint.com';
  const config8 = clientConfigEnv({});
  assertNotStrictEquals(config8, {
    accessKeyId: 'test-access-key2',
    endpoint: 'https://test-endpoint.com',
    fetch: undefined,
    region: 'us-east-3',
  }, 'Should create a valid AWSClient instance with AWS_ENDPOINT_URL');

  // Reset the environment variables
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value) {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  }
});

Deno.test('awsClient - unknown error', async () => {
  let errorText = '';
  const client = new AWSClient({
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    region: 'us-east-1',
    endpoint: 'https://test-endpoint.com',
    sessionToken: 'test-session-token',
    fetch: (): Promise<Response> => {
      return new Promise((resolve) => {
        resolve(new Response(errorText, { status: 500 }));
      });
    },
  });
  errorText = 'unknown error';
  const [error] = await tryCatchAsync(s3GetObject(client, { bucket: 'bucket', key: 'key' }));
  assert(!!error, 'An error should have been thrown');
  assertIsError(error, Error);
  assert(error.message.includes('unknown error'));

  errorText = '{unknown error';
  const [error2] = await tryCatchAsync(s3GetObject(client, { bucket: 'bucket', key: 'key' }));
  assert(!!error2, 'An error should have been thrown');
  assertIsError(error2, Error);
  assert(error2.message.includes('unknown error'));

  errorText = '{"error": "unknown error"}';
  const [error3] = await tryCatchAsync(s3GetObject(client, { bucket: 'bucket', key: 'key' }));
  assert(!!error3, 'An error should have been thrown');
  assertIsError(error3, Error);
  assert(error3.message.includes('unknown error'));

  errorText = '<SomeError';
  const [error4] = await tryCatchAsync(s3GetObject(client, { bucket: 'bucket', key: 'key' }));
  assert(!!error4, 'An error should have been thrown');
  assertIsError(error4, Error);
  assert(error4.message.includes('unknown error'));
});
