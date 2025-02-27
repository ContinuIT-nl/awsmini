import { signRequest } from './awsSignature.ts';
import type { AWSConfig, AWSFullRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { ClientConfig } from './clientConfig.ts';
import { AwsminiError, AwsminiRequestError } from '../misc/AwsminiError.ts';
import { encodeRfc3986 } from '../misc/utilities.ts';

export class AWSClient {
  private config: AWSConfig;
  private fetch: typeof fetch;

  constructor(clientConfig: ClientConfig) {
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
      // todo: maxRetries etc
    };
    this.config = result;

    this.fetch = clientConfig.fetch ?? fetch;
  }

  async execute(request: AWSRequest): Promise<Response> {
    const host = this.config.host || `${request.service}.${this.config.region}.amazonaws.com`;

    const fullRequest: AWSFullRequest = {
      ...request,
      path: request.path.split('/').map(encodeRfc3986).join('/'),
      host: request.subhost ? `${request.subhost}.${host}` : host,
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
