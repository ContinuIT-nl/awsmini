import type { AWSClient } from '../mod.ts';
import { type LambdaFunction, lambdaListFunctions, type LambdaListFunctionsRequest } from './lambdaListFunctions.ts';

export type LambdaListFunctionsAllRequest = Omit<LambdaListFunctionsRequest, 'marker'>;

/**
 * List Lambda functions utility function that returns an async generator of Lambda functions
 * @param client AWSClient
 * @param request LambdaListFunctionsRequest
 * @returns AsyncGenerator<LambdaFunction>
 *
 * @example
 * ```ts
 * for await (const func of lambdaListFunctionsAll(client, {})) {
 *   console.log(func.FunctionName);
 * }
 * ```
 */
export async function* lambdaListFunctionsAll(
  client: AWSClient,
  request: LambdaListFunctionsAllRequest,
): AsyncGenerator<LambdaFunction> {
  let marker: string | null | undefined = undefined;
  do {
    const result = await lambdaListFunctions(client, { ...request, marker });
    for (const func of result.Functions) yield func;
    marker = result.NextMarker;
  } while (marker);
}
