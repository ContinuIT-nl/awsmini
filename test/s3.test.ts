import {
  AWSClient,
  type ClientConfig,
  multipartUpload,
  S3CopyObject,
  S3DeleteObject,
  S3GetObject,
  S3HeadObject,
  S3ListBuckets,
  S3ListObjects,
  S3PutObject,
} from '../src/mod.ts';
import { assert, assertEquals, assertIsError, assertThrows } from '@std/assert';
import * as process from 'node:process';

const bucket = process.env.TEST_BUCKET;
const bucket2 = process.env.TEST_BUCKET2 ?? '';

const config: ClientConfig = {
  endpoint: '',
  accessKeyId: process.env.AWS2_ACCESS_KEY,
  secretAccessKey: process.env.AWS2_SECRET_KEY,
  region: process.env.AWS2_REGION,
};

if (!bucket) {
  throw new Error('TEST_BUCKET is not set. Please provide access to a test bucket in the environment variables.');
}

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

const client = new AWSClient({ fetch: logFetch });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.test('S3PutObject', async () => {
  const result = await S3PutObject({ client, bucket, key: 'hello/world', body: new Uint8Array(0) });
  assert(result.ok, 'S3PutObject failed');
  const result2 = await S3GetObject({ client, bucket, key: 'hello/world' });
  assertEquals(result2.byteLength, 0);
});
// todo: properties

Deno.test('S3PutObject - with sha256', async () => {
  const client = new AWSClient(config);
  const result = await S3PutObject({
    client,
    bucket: bucket2,
    key: 'hello/empty',
    body: new Uint8Array(0),
    contentSha256: true,
  });
  assert(result.ok, 'S3PutObject failed');
  const result2 = await S3PutObject({
    client,
    bucket: bucket2,
    key: 'hello/full',
    body: new Uint8Array(3),
    contentSha256: true,
  });
  assert(result2.ok, 'S3PutObject failed');
});

// todo: check other things a key must adhere to
Deno.test('S3PutObject key must be non-empty', async () => {
  let error: Error | undefined = undefined;
  try {
    await S3PutObject({ client, bucket, key: '', body: new Uint8Array(100) });
  } catch (err) {
    error = err as Error;
  }
  assert(!!error, 'An error should have be thrown');
  assertIsError(error, Error);
});

Deno.test('S3CopyObject abort', async () => {
  const result = await S3PutObject({ client, bucket, key: 'hello/world', body: new Uint8Array(100) });
  assert(result.ok, 'S3PutObject failed');

  const result5 = await S3DeleteObject({ client, bucket, key: 'hello/again' });
  assert(result5.ok, 'S3DeleteObject failed');

  const result2 = await S3CopyObject({
    client,
    bucket,
    key: 'hello/again',
    sourceBucket: bucket,
    sourceKey: 'hello/world',
  });
  assert(result2.ok, 'S3CopyObject failed');

  const result3 = await S3HeadObject({ client, bucket, key: 'hello/again' });
  assert(result3.ok, 'S3HeadObject failed');
  assertEquals(result3.headers.get('content-length'), '100');

  const result4 = await S3DeleteObject({ client, bucket, key: 'hello/again' });
  assert(result4.ok, 'S3DeleteObject failed');
});

Deno.test('S3DeleteObject', async () => {
  // Make sure an object exists
  const result1 = await S3PutObject({ client, bucket, key: 'hello/world', body: new Uint8Array(100) });
  assert(result1.ok, 'S3PutObject failed');

  // Delete the object
  const result2 = await S3DeleteObject({ client, bucket, key: 'hello/world' });
  assert(result2.ok, 'S3DeleteObject failed');
});

Deno.test('S3DeleteObject nonexisting', async () => {
  const result = await S3DeleteObject({ client, bucket, key: 'nonexisting/key' });
  assert(result.ok, 'S3DeleteObject nonexisting failed');
});

Deno.test('S3HeadObject', async () => {
  // Make sure an object exists
  const result1 = await S3PutObject({ client, bucket, key: 'hello/world', body: new Uint8Array(100) });
  assert(result1.ok, 'S3PutObject failed');

  const result = await S3HeadObject({ client, bucket, key: 'hello/world' });
  assert(result.ok, 'S3HeadObject failed');
  assertEquals(result.headers.get('content-length'), '100');
});

Deno.test.ignore('S3HeadObject abort', async () => {
  // todo: the test fails
  /*
error: AssertionError: Expected function to throw.
error: (in promise) TimeoutError: Signal timed out.
This error was not caught from a test and caused the test runner to fail on the referenced module.
It most likely originated from a dangling promise, event/timeout handler or top-level code.
 */
  assertThrows(async () => {
    const result = S3HeadObject({ client, bucket, key: 'afmd/afmd_20241203.json', signal: AbortSignal.timeout(10) });
    console.log(result);
    await sleep(100);
  });
  await sleep(100);
});

Deno.test('S3GetObject', async () => {
  console.time(`S3GetObject 10 calls sequentially`);
  const client = new AWSClient({});
  for (let i = 0; i < 10; i++) {
    await S3GetObject({ client, bucket, key: 'hello/world' });
  }
  console.timeEnd(`S3GetObject 10 calls sequentially`);

  console.time(`S3GetObject 10 calls concurrently`);
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(S3GetObject({ client, bucket, key: 'hello/world' }));
  }
  await Promise.all(promises);
  console.timeEnd(`S3GetObject 10 calls concurrently`);
});

Deno.test('S3ListObjects R2', async () => {
  const list = await S3ListObjects({ client, bucket, prefix: '' });
  assert(list.content.length > 0, 'S3ListObjects returned no content');
  assert(list.prefixes.length === 0, 'S3ListObjects returned no prefixes');
});

Deno.test('S3ListObjects AWS', async () => {
  const client = new AWSClient(config);
  const list = await S3ListObjects({ client, bucket: bucket2, prefix: '' });
  assert(list.content.length > 0, 'S3ListObjects returned no content');
  assert(list.prefixes.length === 0, 'S3ListObjects returned no prefixes');
});

Deno.test('S3ListObjects nonexistingKey', async () => {
  const list = await S3ListObjects({ client, bucket, prefix: 'nonexistingKey/' });
  assert(list.content.length === 0, 'S3ListObjects returned non-empty list');
  assert(list.prefixes.length === 0, 'S3ListObjects returned non-empty prefixes');
});

Deno.test('S3ListObjects commonPrefix', async () => {
  const list = await S3ListObjects({ client, bucket, delimiter: '/' });
  await Deno.writeTextFile('./data/s3ListObjectsCommonPrefix.json', JSON.stringify(list, null, 2));
  assert(list.content.length === 0, 'S3ListObjects returned non-empty list');
  assert(list.prefixes.length > 0, 'S3ListObjects returned no prefixes');
});

// todo: test pagination on ListObjects

// ListBuckets
Deno.test('ListBuckets', async () => {
  const client = new AWSClient(config);
  const result = await S3ListBuckets({ client, prefix: 'rits' });
  assert(!result.continuationToken, 'ListBuckets returned a continuation token');
  assert(result.buckets.length > 0, 'ListBuckets returned no buckets');
  assert(result.owner.id, 'ListBuckets returned no owner id');
  assert(result.buckets.some((bucket) => bucket.name === bucket2), `ListBuckets returned no bucket ${bucket2}`);
});

// CreateBucket
// DeleteBucket

Deno.test('multipartUpload', async () => {
  const _10MB_ = 10 * 1024 * 1024;
  const body = new Uint8Array(_10MB_ * 5);
  for (let i = 0; i < body.length; i++) body[i] = (i + i >> 16) % 256;
  await multipartUpload({
    client,
    bucket,
    key: 'hello/big',
    nextPart: (partNumber: number) => ({
      body: body.slice((partNumber - 1) * _10MB_, partNumber * _10MB_),
      isFinalPart: partNumber === 5,
    }),
  });
  const response = await S3HeadObject({ client, bucket, key: 'hello/big' });
  assert(response.ok, 'S3HeadObject failed');
  assertEquals(response.headers.get('content-length'), `${body.byteLength}`);
});

Deno.test('multipartUpload - tooSmall', async () => {
  const _1MB_ = 1024 * 1024;
  const body = new Uint8Array(_1MB_ * 5);
  for (let i = 0; i < body.length; i++) body[i] = (i + i >> 16) % 256;
  try {
    await multipartUpload({
      client,
      bucket,
      key: 'hello/big-too-small',
      nextPart: (partNumber: number) => ({
        body: body.slice((partNumber - 1) * _1MB_, partNumber * _1MB_),
        isFinalPart: partNumber === 5,
      }),
    });
  } catch (error) {
    assertIsError(error, Error);
    assertEquals(error.message, 'Part is too small');
  }
});
