import { assert, assertEquals, assertIsError, assertNotStrictEquals } from '@std/assert';
import { capitalize, encodeRfc3986, tryCatch, tryCatchAsync } from '../src/misc/utilities.ts';
import { sleep } from './testUtilities.ts';

Deno.test('tryCatch', () => {
  const [error, result] = tryCatch(() => {
    return 'test';
  });
  assert(error === null, 'error should be null');
  assert(result === 'test', 'result should be test');

  const [error2, result2] = tryCatch(() => {
    throw new Error('test');
  });
  assert(error2 !== null, 'error should not be null');
  assert(result2 === null, 'result should be null');
});

Deno.test('tryCatchAsync', async () => {
  const [error, result] = await tryCatchAsync(
    new Promise((resolve) => {
      setTimeout(() => {
        resolve('test');
      }, 10);
    }),
  );
  assert(error === null, 'error should be null');
  assert(result === 'test', 'result should be test');

  const [error2, result2] = await tryCatchAsync(
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('test'));
      }, 10);
    }),
  );
  assert(error2 !== null, 'error should not be null');
  assert(result2 === null, 'result should be null');

  const [error3, result3] = await tryCatchAsync(
    new Promise((_, reject) => {
      setTimeout(() => {
        reject('test');
      }, 10);
    }),
  );
  assertIsError(error3, Error);
  assert(result3 === null, 'result should be null');
});

Deno.test('tryCatchAsync - direct exception', async () => {
  const [error, result] = await tryCatchAsync(
    new Promise((_, reject) => {
      reject(new Error('test'));
    }),
  );
  assertIsError(error, Error);
  assert(result === null, 'result should be null');
});

// todo: test what happens if an exception is thrown directly in the promise creation instead of a setTimeout

Deno.test('sleep - 10ms', async () => {
  const start = Date.now();
  await sleep(10);
  const end = Date.now();
  assert(end - start >= 10, 'sleep should have taken at least 10ms');
});

Deno.test('capitalize', () => {
  const result = capitalize({
    abc: 'test',
    def: 0,
    ghi: undefined,
  });
  assertNotStrictEquals(result, {
    abc: 'test',
    def: '0',
  });

  assertEquals(capitalize(undefined), undefined);
});

Deno.test('encodeRfc3986', () => {
  assertEquals(encodeRfc3986('test'), 'test');
  assertEquals(encodeRfc3986('test!'), 'test%21');
  assertEquals(encodeRfc3986('test@'), 'test%40');
  assertEquals(encodeRfc3986('test#'), 'test%23');
  assertEquals(encodeRfc3986('test$'), 'test%24');
  assertEquals(encodeRfc3986('test&'), 'test%26');
  assertEquals(encodeRfc3986('test '), 'test%20');
});
