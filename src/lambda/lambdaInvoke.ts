import type { AWSClient } from '../client/AWSClient.ts';
import { AwsminiError } from '../misc/AwsminiError.ts';
import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { Prettify } from '../misc/utilities.ts';

/**
 * LambdaInvokeRequest
 *
 * @typedef {Object} LambdaInvokeRequest
 * @property {string} functionName - The name of the function to invoke
 * @property {string} [accountId] - The account ID of the function to invoke
 * @property {Uint8Array} payload - The payload to invoke the function with
 * @property {string} [invocationType] - The invocation type to use
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
    accountId?: string | undefined; // like 123456789012
    payload: Uint8Array;
    invocationType?: 'RequestResponse' | 'Event' | 'DryRun';
    logType?: 'Tail' | 'None';
    clientContext?: string;
    qualifier?: string;
  }
>;

/**
 * Invoke a Lambda function
 * @param client AWSClient
 * @param request LambdaInvokeRequest
 * @returns Response
 */
export async function lambdaInvoke(client: AWSClient, request: LambdaInvokeRequest): Promise<Response> {
  const req: AWSRequest = {
    method: 'POST',
    service: 'lambda',
    path: `/2015-03-31/functions/${request.functionName}/invocations`,
    body: request.payload,
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
  return await client.execute(req);
  // todo: headers['X-Amz-Log-Result'], check case sensitivity -> base64 decode
  // todo: headers['x-amz-function-error'], check case sensitivity
  // todo: headers['x-amz-executed-version'], check case sensitivity
}
