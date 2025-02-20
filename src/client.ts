import { signRequest } from './awsSignature.ts';
import type { ClientConfig } from './clientConfig.ts';
import * as process from 'node:process';

type Environment = Record<string, string>;

let cacheEnv: Environment | undefined;
const env = () => cacheEnv ?? (cacheEnv = process.env as Environment);

// Use a caching strategy here
// const _loadAwsConfig = (_config: ClientConfig) => {

function parseEndpoint(endpoint: string | undefined) {
  if (!endpoint) {
    return { protocol: 'https', host: '' };
  }
  const url = new URL(endpoint);
  return { protocol: url.protocol.replace(':', ''), host: url.host };
}

function enrichConfig(config: ClientConfig) {
  const result = {
    region: config.region ?? (env().AWS_REGION ?? env().AWS_DEFAULT_REGION ?? env().AMAZON_REGION), // || loadAwsConfig(config).region,
    accessKeyId: config.accessKeyId ?? (env().AWS_ACCESS_KEY_ID ?? env().AWS_ACCESS_KEY), // ~/.aws/credentials
    secretAccessKey: config.secretAccessKey ?? (env().AWS_SECRET_ACCESS_KEY ?? env().AWS_SECRET_KEY), // ~/.aws/credentials
    sessionToken: config.sessionToken ?? (env().AWS_SESSION_TOKEN ?? undefined), // ~/.aws/credentials
    ...parseEndpoint(config.endpoint ?? env().AWS_ENDPOINT_URL), // || loadAwsConfig(config).endpoint,
    // maxRetries etc
  };
  if (result.region === undefined) {
    throw new Error('Region is not set');
  }
  return result;
}

export type AWSConfig = ReturnType<typeof enrichConfig>;

// IMDSv2: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html

export class AWSClient {
  private config: AWSConfig;
  private fetch: typeof fetch;

  constructor(config?: ClientConfig) {
    this.config = enrichConfig(config ?? {});
    this.fetch = config?.fetch ?? fetch; // todo: allow to set a default for all further constructor invocations
  }

  async execute(request: AWSRequest) {
    const fullRequest: AWSFullRequest = {
      ...request,
      host: this.getHost(request.service, request.subhost),
      region: this.config.region,
    };
    await signRequest(fullRequest, this.config);

    const params = Object.entries(fullRequest.queryParameters).map(
      ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    ).join('&');

    const url = `${this.config.protocol}://${fullRequest.host}${fullRequest.path}${params ? '?' + params : ''}`;

    const headers = Object.entries(fullRequest.headers)
      .filter(([_key, value]) => value)
      .map(([key, value]) => [key, value]);

    const response = await this.fetch(url, {
      method: fullRequest.method,
      headers,
      body: fullRequest.body,
      signal: fullRequest.signal,
    });
    // should we throw an error if the response is not ok?
    if (request.checkResponse && !response.ok) {
      const errorsText = await response.text();
      const errors = errorsText.match(/<Error><Code>(.*?)<\/Code><Message>(.*?)<\/Message><\/Error>/);
      throw new Error(
        `HTTP ${response.status} ${response.statusText}: ${errors?.[1] ?? 'unknown error'} ${
          errors?.[2] ?? errorsText
        }`,
      );
    }
    // todo: handle retries, timeouts, etc.
    return response;
  }

  private getHost(service: string, prefix?: string) {
    const host = this.config.host || `${service}.${this.config.region}.amazonaws.com`;
    return prefix ? `${prefix}.${host}` : host;
  }
}

export type HTTPMethod = 'HEAD' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type AWSRequest = {
  method: HTTPMethod;
  subhost: string | undefined;
  path: string;
  service: 's3';
  queryParameters: Record<string, string>;
  headers: Record<string, string>;
  body?: Uint8Array;
  signal?: AbortSignal;
  checkResponse: boolean;
};

export type AWSFullRequest = AWSRequest & { host: string; region: string };

export type AWSBaseRequest = {
  client: AWSClient;
  signal?: AbortSignal;
  checkResponse?: boolean;
};
