import * as process from 'node:process';
import { clientAWS } from './testUtilities.ts';
import { lambdaInvoke, lambdaListFunctions, lambdaListFunctionsAll } from '../src/mod.ts';
import { assert, assertEquals, assertGreater, assertIsError } from '@std/assert';
import { tryCatchAsync } from '../src/misc/utilities.ts';
import { AwsminiError } from '../src/misc/AwsminiError.ts';

const lambdaName = process.env.LAMBDA_NAME;
if (!lambdaName) {
  throw new Error('LAMBDA_NAME is not set');
}

Deno.test('lambda - invoke', async () => {
  const result = await lambdaInvoke(clientAWS, {
    functionName: lambdaName,
    payload: { id: '1234567890' },
    logType: 'Tail',
  });
  assertEquals(result.response, 'TEST');
  assert(result.logResult, 'log result should be present');

  const result2 = await lambdaInvoke(clientAWS, {
    functionName: lambdaName,
    payload: { id: '1234567890' },
    clientContext: { test: 'test' },
    checkResponse: true,
  });
  assertEquals(result2.response, 'TEST');
  assert(!result2.logResult, 'log result should be empty');
  // console.log(result.logResult ?? 'no log result');
});

Deno.test('lambda - invoke - error', async () => {
  const [error, result] = await tryCatchAsync(
    lambdaInvoke(clientAWS, { functionName: 'non-existing-function-name', payload: {} }),
  );
  assertIsError(error, AwsminiError, '404');
  assert(!result, 'result should be undefined');
});

Deno.test('lambda - list functions', async () => {
  const result = await lambdaListFunctions(clientAWS, {});
  const functionNames = result.Functions.map((f) => f.FunctionName);
  assertGreater(functionNames.length, 0);
  assert(functionNames.includes(lambdaName));
});

Deno.test('lambda - list functions', async () => {
  const funcs: string[] = [];
  for await (const func of lambdaListFunctionsAll(clientAWS, {})) {
    funcs.push(func.FunctionName);
  }
  assertGreater(funcs.length, 0);
  funcs.sort((a, b) => a.localeCompare(b));
  console.log(funcs.join('\n'));
});
