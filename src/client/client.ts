import { signRequest } from './awsSignature.ts';
import type { AWSConfig, AWSFullRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { ClientConfig } from './clientConfig.ts';
import { AwsminiError, AwsminiRequestError } from '../misc/AwsminiError.ts';

export class AWSClient {
  private clientConfig: ClientConfig;
  private config: AWSConfig | undefined;
  private fetch: typeof fetch;

  constructor(clientConfig: ClientConfig) {
    this.clientConfig = clientConfig;
    this.fetch = this.clientConfig.fetch ?? fetch;
  }

  private getConfig(): AWSConfig {
    if (!this.config) {
      const clientConfig = this.clientConfig;
      // todo: support extensions for loading from .awsconfig, etc.
      // IMDSv2: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html
      const region = clientConfig.region;
      if (region === undefined) throw new AwsminiError('Region is not set');
      const accessKeyId = clientConfig.accessKeyId;
      if (accessKeyId === undefined) throw new AwsminiError('Access key ID is not set');
      const secretAccessKey = clientConfig.secretAccessKey;
      if (secretAccessKey === undefined) throw new AwsminiError('Secret access key is not set');
      const endpoint = clientConfig.endpoint;
      const url = endpoint ? new URL(endpoint) : undefined;

      const result = {
        region,
        accessKeyId,
        secretAccessKey,
        sessionToken: clientConfig.sessionToken,
        protocol: url ? url.protocol.replace(':', '') : 'https',
        host: url ? url.host : '',
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
