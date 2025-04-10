import { tryCatch } from '../src/misc/utilities.ts';
import { AWSClient, clientConfigEnv } from '../src/mod.ts';
import { assert, assertIsError } from '@std/assert';

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
  const config = clientConfigEnv({});
  assert(config, 'Should create a valid AWSClient instance');
});
