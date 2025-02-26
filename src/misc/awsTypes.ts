export type HTTPMethod = 'HEAD' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type AWSRequest = {
  method: HTTPMethod;
  subhost: string | undefined;
  path: string;
  service: 's3'; // todo: add the other services supported here
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
