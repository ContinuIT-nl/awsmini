import type { AWSClient } from '../client/AWSClient.ts';
import { AwsminiError } from '../misc/AwsminiError.ts';
import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { Prettify } from '../misc/utilities.ts';

/**
 * LambdaInvokeRequest
 *
 * @typedef {Object} LambdaInvokeRequest
 * @property {string} functionName - The name of the function to invoke
 * @property {unknown} payload - The payload to invoke the function with (It must be JSON serializable)
 * @property {string} [invocationType] - The invocation type to use: 'RequestResponse' or 'Event' or 'DryRun'
 * @property {string} [logType] - The log type to use
 * @property {string} [clientContext] - The client context to use
 * @property {string} [qualifier] - The qualifier to use
 * @property {string|undefined} [signal] - abort signal
 * @property {boolean} [checkResponse=true] - check the response
 *
 * @see https://docs.aws.amazon.com/lambda/latest/dg/API_Invoke.html
 */
export type LambdaInvokeRequest = Prettify<
  AWSBaseRequest & {
    functionName: string;
    payload: unknown;
    invocationType?: 'RequestResponse' | 'Event' | 'DryRun';
    logType?: 'Tail' | 'None';
    clientContext?: string;
    qualifier?: string;
  }
>;

/**
 * LambdaInvokeResponse
 *
 * @typedef {Object} LambdaInvokeResponse
 * 
 * @property {unknown} response - The response from the function (JSON decoded)
 * @property {number} statusCode - The status code of the response
 * @property {string|null} logResult - The log tail from the function if logType = 'Tail' was in the request
 * @property {string|null} functionError - The function error of the function if it failed
 * @property {string|null} executedVersion - The executed version of the function
 * @property {string|null} requestId - The request ID from the function invocation
 */
export type LambdaInvokeResponse = {
  response: unknown;
  statusCode: number;
  logResult: string | null;
  functionError: string | null;
  executedVersion: string | null;
  requestId: string | null;
};

/**
 * Invoke a Lambda function
 * @param client AWSClient
 * @param request LambdaInvokeRequest
 * @returns Response
 * 
 * @see https://docs.aws.amazon.com/lambda/latest/dg/API_Invoke.html
 * 
 * @example
 * ```ts
 * const response = await lambdaInvoke(client, { functionName: 'functionName', payload: { id: '1234567890' } });
 * console.log(response.response);
 * ```
*/
export async function lambdaInvoke(client: AWSClient, request: LambdaInvokeRequest): Promise<LambdaInvokeResponse> {
  const req: AWSRequest = {
    method: 'POST',
    service: 'lambda',
    path: `/2015-03-31/functions/${request.functionName}/invocations`,
    body: new TextEncoder().encode(JSON.stringify(request.payload)),
    headers: { 'content-type': 'application/json' },
    queryParameters: {},
    checkResponse: request.checkResponse ?? true,
    signal: request.signal,
  };
  if (request.invocationType) req.headers['x-amz-invocation-type'] = request.invocationType;
  if (request.logType) req.headers['x-amz-log-type'] = request.logType;
  if (request.clientContext) {
    const base64ClientContext = btoa(request.clientContext);
    if (base64ClientContext.length > 3583) throw new AwsminiError('Client context is too long', 'lambda');
    req.headers['x-amz-client-context'] = base64ClientContext;
  }
  if (request.qualifier) req.queryParameters['Qualifier'] = request.qualifier;

  const response = await client.execute(req);

  const logResult = response.headers.get('x-amz-log-result');
  return {
    response: await response.json(),
    statusCode: response.status,
    logResult: logResult ? atob(logResult) : null,
    functionError: response.headers.get('x-amz-function-error'),
    executedVersion: response.headers.get('x-amz-executed-version'),
    requestId: response.headers.get('x-amzn-requestid'),
  };
}
