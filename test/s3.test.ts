import {
  s3CopyObject,
  s3DeleteObject,
  s3GetObject,
  s3GetObjectStream,
  s3GetObjectText,
  s3HeadObject,
  s3ListBuckets,
  s3ListObjects,
  S3MultipartUpload,
  S3MultipartUploadStream,
  s3PutObject,
} from '../src/mod.ts';
import { awsAddIfOptions } from '../src/s3/s3.ts';
import { assert, assertEquals, assertIsError } from '@std/assert';
import * as process from 'node:process';
import { clientAWS, clientGarage, clientR2, clientS3H } from './testUtilities.ts';
import { tryCatch, tryCatchAsync } from '../src/misc/utilities.ts';
import type { AWSRequest } from '../src/misc/awsTypes.ts';
import { AwsminiError } from '../src/misc/AwsminiError.ts';

const bucketR2 = process.env.TEST_BUCKET_R2;
const bucketAWS = process.env.TEST_BUCKET_AWS;
const bucketS3H = process.env.TEST_BUCKET_S3H;
const bucketGarage = process.env.TEST_BUCKET_GARAGE;
if (!bucketR2 || !bucketAWS || !bucketS3H || !bucketGarage) {
  throw new Error(
    'TEST_BUCKET_R2 and TEST_BUCKET_AWS and TEST_BUCKET_S3H and TEST_BUCKET_GARAGE must be set. Please provide access to a test bucket in the environment variables.',
  );
}

Deno.test('s3PutObject', async () => {
  const result = await s3PutObject(clientR2, { bucket: bucketR2, key: 'hello/world', body: 'Hello World' });
  assert(result.ok, 'S3PutObject failed');
  const result2 = await s3GetObjectText(clientR2, { bucket: bucketR2, key: 'hello/world' });
  assertEquals(result2, 'Hello World');
});

// todo: properties

Deno.test('s3PutObject - Hetzner', async () => {
  const result = await s3PutObject(clientS3H, { bucket: bucketS3H, key: 'hello/world', body: 'Hello World' });
  assert(result.ok, 'S3PutObject failed');
  const result2 = await s3GetObjectText(clientS3H, { bucket: bucketS3H, key: 'hello/world' });
  assertEquals(result2, 'Hello World');
  const result3 = await s3DeleteObject(clientS3H, { bucket: bucketS3H, key: 'hello/world' });
  assert(result3.ok, 's3DeleteObject failed');
});

Deno.test('s3PutObject - with sha256', async () => {
  const result = await s3PutObject(clientAWS, {
    bucket: bucketAWS,
    key: 'hello/empty',
    body: new Uint8Array(0),
    contentSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  });
  assert(result.ok, 'S3PutObject failed');
  const result2 = await s3PutObject(clientAWS, {
    bucket: bucketAWS,
    key: 'hello/full',
    body: new Uint8Array(3),
    contentSha256: true,
  });
  assert(result2.ok, 'S3PutObject failed');
});

// todo: check other things a key must adhere to
Deno.test('s3PutObject key must be non-empty', async () => {
  let error: Error | undefined = undefined;
  try {
    await s3PutObject(clientR2, { bucket: bucketR2, key: '', body: new Uint8Array(100) });
  } catch (err) {
    error = err as Error;
  }
  assert(!!error, 'An error should have be thrown');
  assertIsError(error, Error);
});

Deno.test('s3PutObject - special characters', async () => {
  const result = await s3PutObject(clientR2, {
    bucket: bucketR2,
    key: '2025-02-27T01:15:19.952Z.html',
    body: new Uint8Array(100),
  });
  assert(result.ok, 'S3PutObject failed');
  const result2 = await s3DeleteObject(clientR2, { bucket: bucketR2, key: '2025-02-27T01:15:19.952Z.html' });
  assert(result2.ok, 's3DeleteObject failed');
});

Deno.test('s3CopyObject abort', async () => {
  const result = await s3PutObject(clientR2, { bucket: bucketR2, key: 'hello/world', body: new Uint8Array(100) });
  assert(result.ok, 'S3PutObject failed');

  const result5 = await s3DeleteObject(clientR2, { bucket: bucketR2, key: 'hello/again' });
  assert(result5.ok, 's3DeleteObject failed');

  const result2 = await s3CopyObject(clientR2, {
    bucket: bucketR2,
    key: 'hello/again',
    sourceBucket: bucketR2,
    sourceKey: 'hello/world',
  });
  assert(result2.ok, 'S3CopyObject failed');

  const result3 = await s3HeadObject(clientR2, { bucket: bucketR2, key: 'hello/again' });
  assert(result3.ok, 'S3HeadObject failed');
  assertEquals(result3.headers.get('content-length'), '100');

  const result4 = await s3DeleteObject(clientR2, { bucket: bucketR2, key: 'hello/again' });
  assert(result4.ok, 's3DeleteObject failed');
});

Deno.test('s3DeleteObject', async () => {
  // Make sure an object exists
  const result1 = await s3PutObject(clientR2, { bucket: bucketR2, key: 'hello/world', body: new Uint8Array(100) });
  assert(result1.ok, 'S3PutObject failed');

  // Delete the object
  const result2 = await s3DeleteObject(clientR2, { bucket: bucketR2, key: 'hello/world' });
  assert(result2.ok, 's3DeleteObject failed');
});

Deno.test('s3DeleteObject nonexisting', async () => {
  const result = await s3DeleteObject(clientR2, { bucket: bucketR2, key: 'nonexisting/key' });
  assert(result.ok, 's3DeleteObject nonexisting failed');
});

Deno.test('s3HeadObject', async () => {
  // Make sure an object exists
  const result1 = await s3PutObject(clientR2, { bucket: bucketR2, key: 'hello/world', body: new Uint8Array(100) });
  assert(result1.ok, 'S3PutObject failed');

  const result = await s3HeadObject(clientR2, { bucket: bucketR2, key: 'hello/world' });
  assert(result.ok, 'S3HeadObject failed');
  assertEquals(result.headers.get('content-length'), '100');
});

Deno.test('s3HeadObject abort', async () => {
  // todo: the test fails
  /*
error: AssertionError: Expected function to throw.
error: (in promise) TimeoutError: Signal timed out.
This error was not caught from a test and caused the test runner to fail on the referenced module.
It most likely originated from a dangling promise, event/timeout handler or top-level code.
 */
  const [err, result] = await tryCatchAsync(s3HeadObject(clientR2, {
    bucket: bucketR2,
    key: 'hello/world',
    signal: AbortSignal.timeout(10),
  }));
  assertEquals(err?.name, 'TimeoutError', 's3HeadObject should have failed with TimeoutError');
  assertEquals(result, null, 's3HeadObject timed out, no result should be returned');
});

Deno.test('s3GetObject', async () => {
  console.time(`S3GetObject 10 calls sequentially`);
  for (let i = 0; i < 10; i++) {
    await s3GetObject(clientR2, { bucket: bucketR2, key: 'hello/world' });
  }
  console.timeEnd(`S3GetObject 10 calls sequentially`);

  console.time(`S3GetObject 10 calls concurrently`);
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(s3GetObject(clientR2, { bucket: bucketR2, key: 'hello/world' }));
  }
  await Promise.all(promises);
  console.timeEnd(`S3GetObject 10 calls concurrently`);
});

Deno.test('s3GetObject - special characters', async () => {
  let error: Error | undefined = undefined;
  try {
    await s3GetObject(clientR2, { bucket: bucketR2, key: '2025-02-27T01:15:19.952Z.html' }); //hello/special-characters-_:.@$%^&*()äöüß' });
  } catch (err) {
    error = err as Error;
  }
  assert(!!error, 'An error should have be thrown');
  assertIsError(error, Error);
});

Deno.test('s3GetObjectStream', async () => {
  const result = await s3PutObject(clientR2, { bucket: bucketR2, key: 'hello/world', body: 'Hello World' });
  assert(result.ok, 'S3PutObject failed');
  const stream = await s3GetObjectStream(clientR2, { bucket: bucketR2, key: 'hello/world' });
  const reader = stream.getReader();

  try {
    const streamResult = await reader.read();
    const text = new TextDecoder().decode(streamResult.value);
    assertEquals(text, 'Hello World');
    assertEquals((await reader.read()).done, true);
  } finally {
    // Make sure we release the reader
    reader.releaseLock();
    // Cancel the stream if it's still active
    if (stream.locked === false) {
      await stream.cancel();
    }
  }
});

Deno.test('s3GetObjectStream - not found', async () => {
  const [err, stream] = await tryCatchAsync(s3GetObjectStream(clientR2, { bucket: bucketR2, key: 'key-not-found' }));
  assert(err, 's3GetObjectStream should have failed');
  assertIsError(err, AwsminiError);
  assert(stream === null, 'stream should be null');
});

Deno.test('s3GetObjectText', async () => {
  await s3PutObject(clientR2, { bucket: bucketR2, key: 'hello/world', body: 'Hello World' });
  const text = await s3GetObjectText(clientR2, { bucket: bucketR2, key: 'hello/world' });
  assertEquals(text, 'Hello World');
});

Deno.test('s3ListObjects R2', async () => {
  const list = await s3ListObjects(clientR2, { bucket: bucketR2, prefix: '' });
  assert(list.content.length > 0, 'S3ListObjects returned no content');
  assert(list.prefixes.length === 0, 'S3ListObjects returned no prefixes');
});

Deno.test('s3ListObjects AWS', async () => {
  const list = await s3ListObjects(clientAWS, { bucket: bucketAWS, prefix: '' });
  assert(list.content.length > 0, 'S3ListObjects returned no content');
  assert(list.prefixes.length === 0, 'S3ListObjects returned no prefixes');
});

Deno.test('s3ListObjects nonexistingKey', async () => {
  const list = await s3ListObjects(clientR2, { bucket: bucketR2, prefix: 'nonexistingKey/' });
  assert(list.content.length === 0, 'S3ListObjects returned non-empty list');
  assert(list.prefixes.length === 0, 'S3ListObjects returned non-empty prefixes');
});

Deno.test('s3ListObjects commonPrefix', async () => {
  const list = await s3ListObjects(clientR2, { bucket: bucketR2, delimiter: '/' });
  await Deno.writeTextFile('./data/s3ListObjectsCommonPrefix.json', JSON.stringify(list, null, 2));
  assert(list.content.length === 0, 'S3ListObjects returned non-empty list');
  assert(list.prefixes.length > 0, 'S3ListObjects returned no prefixes');
});

// todo: test pagination on ListObjects

// ListBuckets
Deno.test('listBuckets', async () => {
  const result = await s3ListBuckets(clientAWS, { prefix: 'rits' });
  assert(!result.continuationToken, 'ListBuckets returned a continuation token');
  assert(result.buckets.length > 0, 'ListBuckets returned no buckets');
  assert(result.owner.id, 'ListBuckets returned no owner id');
  assert(result.buckets.some((bucket) => bucket.name === bucketAWS), `ListBuckets returned no bucket ${bucketAWS}`);
});

// CreateBucket
// DeleteBucket

Deno.test('multipartUpload', async () => {
  const _10MB_ = 10 * 1024 * 1024;
  const body = new Uint8Array(_10MB_ * 5);
  for (let i = 0; i < body.length; i++) body[i] = (i + i >> 16) % 256;
  await S3MultipartUpload(clientR2, {
    bucket: bucketR2,
    key: 'hello/big',
    nextPart: (partNumber: number) =>
      Promise.resolve({
        body: body.slice((partNumber - 1) * _10MB_, partNumber * _10MB_),
        isFinalPart: partNumber === 5,
      }),
  });
  const response = await s3HeadObject(clientR2, { bucket: bucketR2, key: 'hello/big' });
  assert(response.ok, 'S3HeadObject failed');
  assertEquals(response.headers.get('content-length'), `${body.byteLength}`);
});

Deno.test('multipartUpload - tooSmall', async () => {
  const _1MB_ = 1024 * 1024;
  const body = new Uint8Array(_1MB_ * 5);
  for (let i = 0; i < body.length; i++) body[i] = (i + i >> 16) % 256;
  let error: Error | undefined = undefined;
  try {
    await S3MultipartUpload(clientR2, {
      bucket: bucketR2,
      key: 'hello/small',
      nextPart: (partNumber: number) =>
        Promise.resolve({
          body: body.slice((partNumber - 1) * _1MB_, partNumber * _1MB_),
          isFinalPart: partNumber === 5,
        }),
    });
  } catch (err) {
    error = err as Error;
  }
  assert(!!error, 'An error should have be thrown');
  assertIsError(error, Error);
});

Deno.test('multipartUploadStream', async () => {
  const _10MB_ = 10 * 1024 * 1024;
  const body = new Uint8Array(_10MB_ * 5);
  for (let i = 0; i < body.length; i++) body[i] = (i + i >> 16) % 256;

  const stream = new ReadableStream({
    start(controller) {
      for (let i = 0; i < 5; i++) {
        controller.enqueue(body.slice(i * _10MB_, (i + 1) * _10MB_));
      }
      controller.close();
    },
  });

  await S3MultipartUploadStream(clientR2, {
    bucket: bucketR2,
    key: 'hello/stream',
    stream,
  });

  const response = await s3HeadObject(clientR2, { bucket: bucketR2, key: 'hello/stream' });
  assert(response.ok, 'S3HeadObject failed');
  assertEquals(response.headers.get('content-length'), `${body.byteLength}`);
});

Deno.test('awsAddIfOptions', () => {
  // Test valid options
  const validRequest: AWSRequest = {
    headers: {},
    method: 'GET',
    path: '/',
    service: 's3',
    queryParameters: {},
    checkResponse: true,
  };

  // Test 1. Just no options
  const request1 = { ...validRequest };
  awsAddIfOptions(request1, {});
  assertEquals(request1.headers['If-Match'], undefined);
  assertEquals(request1.headers['If-Modified-Since'], undefined);

  // Test 2. ifMatch
  const request2 = { ...validRequest };
  awsAddIfOptions(request2, {
    ifMatch: 'etag1',
    ifModifiedSince: 'date1',
  });
  assertEquals(request2.headers['If-Match'], 'etag1');
  assertEquals(request2.headers['If-Modified-Since'], 'date1');

  // Test 3. ifNoneMatch
  const request3 = { ...validRequest };
  awsAddIfOptions(request3, {
    ifNoneMatch: 'etag2',
    ifUnmodifiedSince: 'date2',
  });
  assertEquals(request3.headers['If-None-Match'], 'etag2');
  assertEquals(request3.headers['If-Unmodified-Since'], 'date2');

  // Test 4. Invalid options
  const request4 = { ...validRequest };
  const [error] = tryCatch(() =>
    awsAddIfOptions(request4, {
      ifMatch: 'etag1',
      ifNoneMatch: 'etag2',
    })
  );
  assertIsError(error);
  assert(error.message.includes('ifMatch and ifNoneMatch cannot be used together'));

  const request5 = { ...validRequest };
  const [error2] = tryCatch(() =>
    awsAddIfOptions(request5, {
      ifModifiedSince: 'date1',
      ifUnmodifiedSince: 'date2',
    })
  );
  assertIsError(error2);
  assert(error2.message.includes('ifModifiedSince and ifUnmodifiedSince cannot be used together'));
});

Deno.test('s3PutObject - garage', async () => {
  // https://garagehq.deuxfleurs.fr/documentation/reference-manual/s3-compatibility/
  console.time('s3PutObject - garage');
  const result = await s3PutObject(clientGarage, {
    bucket: bucketGarage,
    key: 'hello/world',
    body: 'Hello World',
  });
  console.timeEnd('s3PutObject - garage');
  assert(result.ok, 'S3PutObject failed');
});
