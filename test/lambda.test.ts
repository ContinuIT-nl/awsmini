import * as process from 'node:process';
import { clientAWS, clientAWS2 } from './testUtilities.ts';
import { lambdaInvoke, lambdaListFunctions, lambdaListFunctionsAll } from '../src/mod.ts';
import { assert, assertEquals, assertGreater } from '@std/assert';

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
  // console.log(result.logResult ?? 'no log result');
});

Deno.test('lambda - list functions', async () => {
  const result = await lambdaListFunctions(clientAWS, {});
  const functionNames = result.Functions.map((f) => f.FunctionName);
  assertGreater(functionNames.length, 0);
  assert(functionNames.includes(lambdaName));
});

Deno.test('lambda - list functions', async () => {
  const funcs: string[] = [];
  for await (const func of lambdaListFunctionsAll(clientAWS2, {})) {
    funcs.push(func.FunctionName);
  }
  assertGreater(funcs.length, 0);
  funcs.sort((a, b) => a.localeCompare(b));
  console.log(funcs.join('\n'));
});
