import {
  type AWSClient,
  s3CopyObject,
  s3DeleteObject,
  s3DeleteObjects,
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
import { clientAWS, clientGarage, clientR2, clientS3H, duration_ms } from './testUtilities.ts';
import { tryCatch, tryCatchAsync } from '../src/misc/utilities.ts';
import type { AWSRequest } from '../src/misc/awsTypes.ts';
import { AwsminiError } from '../src/misc/AwsminiError.ts';

// Bucket names
const bucketR2 = process.env.TEST_BUCKET_R2;
const bucketAWS = process.env.TEST_BUCKET_AWS;
const bucketHetzner = process.env.TEST_BUCKET_HETZNER;
const bucketGarage = process.env.TEST_BUCKET_GARAGE;
if (!bucketR2 || !bucketAWS || !bucketHetzner || !bucketGarage) {
  throw new Error('TEST_BUCKET_R2 and TEST_BUCKET_AWS and TEST_BUCKET_HETZNER and TEST_BUCKET_GARAGE must be set.');
}

// Primitives
async function testPutObjectText(client: AWSClient, bucket: string, key: string, body: string) {
  const result = await s3PutObject(client, { bucket, key, body });
  assert(result.ok, 's3PutObject failed');
}

async function testPutObjectBinary(client: AWSClient, bucket: string, key: string, body: Uint8Array) {
  const result = await s3PutObject(client, { bucket, key, body });
  assert(result.ok, 's3PutObject failed');
}

async function testCopyObject(client: AWSClient, bucket: string, key: string, sourceKey: string) {
  const result = await s3CopyObject(client, { bucket, key, sourceBucket: bucket, sourceKey });
  assert(result.ok, 's3CopyObject failed');
}

async function testHeadObject(client: AWSClient, bucket: string, key: string, bodyLength: number) {
  const result = await s3HeadObject(client, { bucket, key });
  assert(result.ok, 'S3HeadObject failed');
  assertEquals(result.headers.get('content-length'), `${bodyLength}`);
}

async function testGetObjectText(client: AWSClient, bucket: string, key: string, body: string) {
  const result = await s3GetObjectText(client, { bucket, key });
  assertEquals(result, body);
}

async function testGetObject(client: AWSClient, bucket: string, key: string, body: Uint8Array) {
  const result = await s3GetObject(client, { bucket, key });
  assertEquals(result, body);
}

async function testDeleteObject(client: AWSClient, bucket: string, key: string) {
  const result = await s3DeleteObject(client, { bucket, key });
  assert(result.ok, 's3DeleteObject failed');
}

// Tests
Deno.test('Basic object operations (Put, Head, Get, Copy, Delete)', async () => {
  const key = 'hello/world';
  const key2 = 'hello/again';
  const body = 'Hello World\n'.repeat(1000); // 12kb, only ASCII characters so length is comparable.

  const putHeadGetDelete = async (client: AWSClient, bucket: string) => {
    await testPutObjectText(client, bucket, key, body);
    await testHeadObject(client, bucket, key, body.length);
    await testGetObjectText(client, bucket, key, body);
    await testCopyObject(client, bucket, key2, key);
    await testGetObjectText(client, bucket, key2, body);
    await testDeleteObject(client, bucket, key);
    await testDeleteObject(client, bucket, key2);
  };

  await putHeadGetDelete(clientR2, bucketR2);
  await putHeadGetDelete(clientAWS, bucketAWS);
  await putHeadGetDelete(clientS3H, bucketHetzner);
  await putHeadGetDelete(clientGarage, bucketGarage);
});

Deno.test('PutObject - with sha256', async () => {
  const key = 'hello/empty';
  const body = new Uint8Array(0);
  const key2 = 'hello/full';
  const body2 = new Uint8Array(3);
  const contentSha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const putWithHash = async (client: AWSClient, bucket: string) => {
    const result = await s3PutObject(client, { bucket, key, body, contentSha256 });
    assert(result.ok, 'S3PutObject failed');
    const result2 = await s3PutObject(client, { bucket, key: key2, body: body2, contentSha256: true });
    assert(result2.ok, 'S3PutObject failed');
    await testDeleteObject(client, bucket, key);
    await testDeleteObject(client, bucket, key2);
  };

  await putWithHash(clientR2, bucketR2);
  await putWithHash(clientAWS, bucketAWS);
  await putWithHash(clientS3H, bucketHetzner);
  await putWithHash(clientGarage, bucketGarage);
});

Deno.test('PutObject - special characters', async () => {
  const key = '2025-02-27T01:15:19.952Z.html';
  const body = new Uint8Array(100);

  const putSpecialCharacters = async (client: AWSClient, bucket: string) => {
    await testPutObjectBinary(client, bucket, key, body);
    await testGetObject(client, bucket, key, body);
    await testDeleteObject(client, bucket, key);
  };

  await putSpecialCharacters(clientR2, bucketR2);
  await putSpecialCharacters(clientAWS, bucketAWS);
  await putSpecialCharacters(clientS3H, bucketHetzner);
  await putSpecialCharacters(clientGarage, bucketGarage);
});

Deno.test.only('PutObject - GetObject - Performance', async () => {
  const keys = new Array(10).fill(0).map((_, i) => `hello/world-${i}`);
  const keys2 = new Array(10).fill(0).map((_, i) => `hello/world-${i}-copy`);
  const values = new Array(10).fill(0).map((_, i) => `Hello blob${i}\n`.repeat(1000)); // 12kb, only ASCII characters

  const putGetPerformance = async (client: AWSClient, bucket: string) => ({
    putSeq_ms: await duration_ms(async () => {
      for (let i = 0; i < keys.length; i++) await testPutObjectText(client, bucket, keys[i], values[i]);
    }),
    putConc_ms: await duration_ms(async () => {
      await Promise.all(keys.map((key, i) => testPutObjectText(client, bucket, key, values[i])));
    }),
    getSeq_ms: await duration_ms(async () => {
      for (let i = 0; i < keys.length; i++) await testGetObjectText(client, bucket, keys[i], values[i]);
    }),
    getConc_ms: await duration_ms(async () => {
      await Promise.all(keys.map((key, i) => testGetObjectText(client, bucket, key, values[i])));
    }),
    copySeq_ms: await duration_ms(async () => {
      for (let i = 0; i < keys.length; i++) await testCopyObject(client, bucket, keys2[i], keys[i]);
    }),
    copyConc_ms: await duration_ms(async () => {
      await Promise.all(keys.map((key, i) => testCopyObject(client, bucket, keys2[i], key))); // todo: parallel copy
    }),
    deleteSeq_ms: await duration_ms(async () => {
      for (let i = 0; i < keys.length; i++) await testDeleteObject(client, bucket, keys[i]);
    }),
    deleteConc_ms: await duration_ms(async () => {
      await s3DeleteObjects(client, { bucket, keys: keys2 });
    }),
  });

  console.table({
    R2: await putGetPerformance(clientR2, bucketR2),
    AWS: await putGetPerformance(clientAWS, bucketAWS),
    Hetzner: await putGetPerformance(clientS3H, bucketHetzner),
    Garage: await putGetPerformance(clientGarage, bucketGarage),
  });
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

Deno.test('s3DeleteObject nonexisting', async () => {
  await testDeleteObject(clientR2, bucketR2, 'nonexisting/key');
});

Deno.test('s3HeadObject abort', async () => {
  const [err, result] = await tryCatchAsync(s3HeadObject(clientR2, {
    bucket: bucketR2,
    key: 'hello/world',
    signal: AbortSignal.timeout(10),
  }));
  assertEquals(err?.name, 'TimeoutError', 's3HeadObject should have failed with TimeoutError');
  assertEquals(result, null, 's3HeadObject timed out, no result should be returned');
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

Deno.test('s3ListBuckets - garage', async () => {
  // https://garagehq.deuxfleurs.fr/documentation/reference-manual/s3-compatibility/
  const result = await s3ListBuckets(clientGarage, { prefix: '' });
  assert(result.buckets.length > 0, 'S3ListBuckets returned no buckets');
  assert(
    result.buckets.some((bucket) => bucket.name === bucketGarage),
    `S3ListBuckets returned no bucket ${bucketGarage}`,
  );
});
