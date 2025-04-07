import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { AWSClient } from '../client/AWSClient.ts';
import type { Prettify } from '../misc/utilities.ts';

// todo: see if we need to compose this type and reuse parts in other lambda calls.

/**
 * Lambda function configuration
 *
 * @see https://docs.aws.amazon.com/lambda/latest/api/API_FunctionConfiguration.html
 */
export type LambdaFunction = {
  Architectures?: ('x86_64' | 'arm64')[] | null;
  CodeSha256?: string | null;
  CodeSize?: number | null;
  DeadLetterConfig?: {
    TargetArn?: string;
  } | null;
  Description?: string | null;
  Environment?: {
    Variables?: Record<string, string>;
    Error?: {
      ErrorCode?: string;
      Message?: string;
    };
  } | null;
  EphemeralStorage?: {
    Size: number;
  } | null;
  FileSystemConfigs?: {
    Arn: string;
    LocalMountPath: string;
  }[] | null;
  FunctionArn: string;
  FunctionName: string;
  Handler?: string | null;
  ImageConfigResponse?: {
    Error?: {
      ErrorCode?: string;
      Message?: string;
    };
    ImageConfig?: {
      Command?: string[];
      EntryPoint?: string[];
      WorkingDirectory?: string;
    };
  } | null;
  KMSKeyArn?: string | null;
  LastModified: string;
  LastUpdateStatus?: 'Successful' | 'Failed' | 'InProgress' | null;
  LastUpdateStatusReason?: string | null;
  LastUpdateStatusReasonCode?: string | null;
  Layers?:
    | Array<{
      Arn: string;
      CodeSize?: number;
      SigningJobArn?: string;
      SigningProfileVersionArn?: string;
    }>
    | null;
  LoggingConfig?: {
    ApplicationLogLevel?: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | null;
    LogFormat?: 'JSON' | 'TEXT';
    LogGroup?: string;
    SystemLogLevel?: 'DEBUG' | 'INFO' | 'WARN' | null;
  } | null;
  MasterArn?: string | null;
  MemorySize?: number | null;
  PackageType?: 'Zip' | 'Image' | null;
  RevisionId?: string | null;
  Role: string;
  Runtime?: string | null;
  RuntimeVersionConfig?: {
    Error?: {
      ErrorCode?: string;
      Message?: string;
    };
    RuntimeVersionArn?: string;
  } | null;
  SigningJobArn?: string | null;
  SigningProfileVersionArn?: string | null;
  SnapStart?: {
    ApplyOn?: 'PublishedVersions' | 'None';
    OptimizationStatus?: 'On' | 'Off';
  } | null;
  State?: 'Pending' | 'Active' | 'Inactive' | 'Failed' | null;
  StateReason?: string | null;
  StateReasonCode?: string | null;
  Timeout?: number | null;
  TracingConfig?: {
    Mode?: 'Active' | 'PassThrough';
  } | null;
  Version?: string | null;
  VpcConfig?: {
    SecurityGroupIds?: string[];
    SubnetIds?: string[];
    VpcId?: string;
  } | null;
};

/**
 * Response type for ListFunctions API call
 *
 * @see https://docs.aws.amazon.com/lambda/latest/api/API_ListFunctions.html
 */
export type LambdaListFunctionsResponse = {
  Functions: LambdaFunction[];
  NextMarker?: string | null;
};

/**
 * List Lambda functions
 *
 * @typedef {Object} LambdaListFunctionsRequest
 * @property {string} [functionVersion] - The version of the function to list
 * @property {string} [marker] - The marker to start the list from
 * @property {string} [masterRegion] - The region to list the functions from
 * @property {number} [maxItems] - The maximum number of items to return. 1..10000, effectively 1..50.
 * @property {string|undefined} [signal] - abort signal
 * @property {boolean} [checkResponse=true] - check the response
 *
 * @see https://docs.aws.amazon.com/lambda/latest/dg/API_ListFunctions.html
 */
export type LambdaListFunctionsRequest = Prettify<
  AWSBaseRequest & {
    functionVersion?: 'ALL';
    marker?: string;
    masterRegion?: string | 'ALL';
    maxItems?: number;
  }
>;

/**
 * List Lambda functions
 * @param client AWSClient
 * @param request LambdaListFunctionsRequest
 * @returns Promise<LambdaListFunctionsResponse>
 *
 * @see https://docs.aws.amazon.com/lambda/latest/dg/API_ListFunctions.html
 *
 * @example
 * ```ts
 * const response = await lambdaListFunctions(client, {});
 * console.log('Functions:', response.Functions.map((f) => f.FunctionName).join(', '));
 */
export async function lambdaListFunctions(
  client: AWSClient,
  request: LambdaListFunctionsRequest,
): Promise<LambdaListFunctionsResponse> {
  const req: AWSRequest = {
    method: 'GET',
    service: 'lambda',
    path: '/2015-03-31/functions',
    queryParameters: {},
    headers: {},
    checkResponse: request.checkResponse ?? true,
    signal: request.signal,
  };
  // todo: automate these
  if (request.functionVersion) req.queryParameters['FunctionVersion'] = request.functionVersion;
  if (request.marker) req.queryParameters['Marker'] = request.marker;
  if (request.masterRegion) req.queryParameters['MasterRegion'] = request.masterRegion;
  if (request.maxItems) req.queryParameters['MaxItems'] = request.maxItems.toString();
  const response = await client.execute(req);
  return await response.json() as LambdaListFunctionsResponse;
}

/**
 * List Lambda functions
 * @param client AWSClient
 * @param request LambdaListFunctionsRequest
 * @returns Promise<LambdaListFunctionsResponse>
 *
 * @example
 * ```ts
 * for await (const func of lambdaListFunctionsAll(client, {})) {
 *   console.log(func.FunctionName);
 * }
 * ```  
 */
export async function *lambdaListFunctionsAll(client: AWSClient, request: LambdaListFunctionsRequest): AsyncGenerator<LambdaFunction> {
  for (;;) {
    const result = await lambdaListFunctions(client, request);
    for (const func of result.Functions) yield func;
    if (!result.NextMarker) break;
    request.marker = result.NextMarker;
  }
};
