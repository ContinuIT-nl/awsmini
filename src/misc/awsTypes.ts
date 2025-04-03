/**
 * The HTTP method to use for the request.
 * This is used internally by AWSmini.
 */
export type HTTPMethod = 'HEAD' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * The service to use for the request.
 * This is used internally by AWSmini.
 */
export type AWSRequestService = 's3' | 'lambda';

/**
 * The request details used when calling `AWSClient.execute`.
 * This is used internally by AWSmini.
 */
export type AWSRequest = {
  method: HTTPMethod;
  subhost?: string;
  path: string;
  service: AWSRequestService;
  queryParameters: Record<string, string>;
  headers: Record<string, string>;
  body?: Uint8Array;
  signal?: AbortSignal;
  checkResponse: boolean;
};

export type AWSFullRequest = AWSRequest & { host: string; region: string };

export type AWSBaseRequest = {
  signal?: AbortSignal;
  checkResponse?: boolean;
};

export type AWSConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  protocol: string;
  host: string;
};
