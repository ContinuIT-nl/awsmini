import * as process from 'node:process';
import { clientAWS } from './testUtilities.ts';
import { lambdaInvoke, lambdaListFunctions } from '../src/mod.ts';
import { assert } from '@std/assert';

const lambdaName = process.env.LAMBDA_NAME;
if (!lambdaName) {
  throw new Error('LAMBDA_NAME is not set');
}

Deno.test('lambda - invoke', async () => {
  const payload = new TextEncoder().encode(JSON.stringify({ id: '1234567890' }));
  const result = await lambdaInvoke(clientAWS, { functionName: lambdaName, payload });
  const response = await result.json();
  console.log(JSON.stringify(response, null, 2));
});

Deno.test('lambda - list functions', async () => {
  const result = await lambdaListFunctions(clientAWS, {});
  const functionNames = result.Functions.map((f) => f.FunctionName);
  assert(functionNames.length > 0);
  assert(functionNames.includes(lambdaName));
});
