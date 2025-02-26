import { signRequest } from './awsSignature.ts';
import type { AWSConfig, AWSFullRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { ClientConfig } from './clientConfig.ts';
import * as process from 'node:process';
import { AwsminiError, AwsminiRequestError } from '../misc/AwsminiError.ts';

type Environment = Record<string, string>;

// Only access env once and only if needed.
let cacheEnv: Environment | undefined;
const env = () => cacheEnv ?? (cacheEnv = process.env as Environment);

function parseEndpoint(endpoint: string | undefined) {
  if (!endpoint) {
    return { protocol: 'https', host: '' };
  }
  const url = new URL(endpoint);
  return { protocol: url.protocol.replace(':', ''), host: url.host };
}

export class AWSClient {
  private clientConfig: ClientConfig;
  private config: AWSConfig | undefined;
  private fetch: typeof fetch;

  constructor(config?: ClientConfig) {
    this.clientConfig = config ?? {};
    this.fetch = this.clientConfig.fetch ?? fetch; // todo: allow to set a default for all further constructor invocations
  }

  private getConfig(): AWSConfig {
    if (!this.config) {
      const clientConfig = this.clientConfig;
      // todo: support extensions for loading from .awsconfig, etc.
      // IMDSv2: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html

      const region = clientConfig.region ?? env().AWS_REGION ?? env().AWS_DEFAULT_REGION ?? env().AMAZON_REGION;
      if (region === undefined) throw new AwsminiError('Region is not set');

      const accessKeyId = clientConfig.accessKeyId ?? env().AWS_ACCESS_KEY_ID ?? env().AWS_ACCESS_KEY;
      if (accessKeyId === undefined) throw new AwsminiError('Access key ID is not set');

      const secretAccessKey = clientConfig.secretAccessKey ?? env().AWS_SECRET_ACCESS_KEY ?? env().AWS_SECRET_KEY;
      if (secretAccessKey === undefined) throw new AwsminiError('Secret access key is not set');

      const result = {
        region,
        accessKeyId,
        secretAccessKey,
        sessionToken: clientConfig.sessionToken ?? env().AWS_SESSION_TOKEN,
        ...parseEndpoint(clientConfig.endpoint ?? env().AWS_ENDPOINT_URL),
        // maxRetries etc
      };
      this.config = result;
    }
    return this.config;
  }

  async execute(request: AWSRequest): Promise<Response> {
    const config = this.getConfig();

    const host = config.host || `${request.service}.${config.region}.amazonaws.com`;

    const fullRequest: AWSFullRequest = {
      ...request,
      host: request.subhost ? `${request.subhost}.${host}` : host,
      region: config.region,
    };

    await signRequest(fullRequest, config);

    const params = Object.entries(fullRequest.queryParameters).map(
      ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    ).join('&');

    const url = `${config.protocol}://${fullRequest.host}${fullRequest.path}${params ? '?' + params : ''}`;

    const headers = Object.entries(fullRequest.headers)
      .filter(([_key, value]) => value)
      .map(([key, value]) => [key, value]);

    const response = await this.fetch(url, {
      method: fullRequest.method,
      headers,
      body: fullRequest.body,
      signal: fullRequest.signal,
    });
    if (request.checkResponse && !response.ok) {
      const errorsText = await response.text();
      const errors = errorsText.match(/<Error><Code>(.*?)<\/Code><Message>(.*?)<\/Message><\/Error>/);
      throw new AwsminiRequestError(
        `HTTP ${response.status} ${response.statusText}: [${errors?.[1] ?? 'unknown error'}] ${
          errors?.[2] ?? errorsText
        }`,
      );
    }
    // todo: handle retries, timeouts, etc.
    return response;
  }
}
