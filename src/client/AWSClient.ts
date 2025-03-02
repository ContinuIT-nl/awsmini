import { signRequest } from './awsSignature.ts';
import type { AWSConfig, AWSFullRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { ClientConfig } from './clientConfig.ts';
import { AwsminiError } from '../misc/AwsminiError.ts';
import { encodeRfc3986, tryCatch } from '../misc/utilities.ts';

/**
 * AWS Client
 *
 * @description
 * This class is used to make requests to AWS (and compatible) services.
 * Given a configuration, it will sign requests and execute them.
 *
 * @example
 * ```ts
 * const client = new AWSClient({
 *   region: 'us-east-1',
 *   accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
 *   secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
 * });
 * ```
 *
 * The configuration can be loaded from environment variables using the `clientConfigEnv` function.
 *
 * ```ts
 * const client = new AWSClient(clientConfigEnv({}));
 * ```
 *
 * Describe other options here
 */
export class AWSClient {
  private config: AWSConfig;
  private fetch: typeof fetch;

  /**
   * Constructor
   *
   * @param clientConfig - The configuration for the client.
   *
   * @throws {AwsminiError} If the region, access key ID or secret access key is not set.
   */
  constructor(clientConfig: ClientConfig) {
    // todo: Also SSO, IMDSv2: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html
    // Sanity checks. Collect errors in an array and throw all findings in one Error.
    const errors: string[] = [];
    if (!clientConfig.region) errors.push('region is not set');
    if (!clientConfig.accessKeyId) errors.push('accessKeyId is not set');
    if (!clientConfig.secretAccessKey) errors.push('secretAccessKey is not set');
    const [err, url] = tryCatch(() => clientConfig.endpoint ? new URL(clientConfig.endpoint) : undefined);
    if (err) errors.push('endpoint is not a valid URL or empty');
    if (errors.length > 0) throw new AwsminiError(errors.join(', '), 'clientConfig');

    const result = {
      region: clientConfig.region!,
      accessKeyId: clientConfig.accessKeyId!,
      secretAccessKey: clientConfig.secretAccessKey!,
      sessionToken: clientConfig.sessionToken,
      protocol: url ? url.protocol.replace(':', '') : 'https',
      host: url ? url.host : '',
      // todo: maxRetries etc
    };
    this.config = result;
    this.fetch = clientConfig.fetch ?? fetch;
  }

  /**
   * Execute a request
   * This is used internally by AWSmini. Normally you don't need to call this method directly.
   *
   * @param request - The request to execute.
   *
   * @returns The response from the request.
   */
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

    const headers = Object.entries(fullRequest.headers).filter(([_key, value]) => value);

    const response = await this.fetch(url, {
      method: fullRequest.method,
      headers,
      body: fullRequest.body,
      signal: fullRequest.signal,
    });
    if (request.checkResponse && !response.ok) {
      const errorsText = await response.text();
      const errors = errorsText.match(/<Error><Code>(.*?)<\/Code><Message>(.*?)<\/Message><\/Error>/);
      throw new AwsminiError(
        `HTTP ${response.status} ${response.statusText}: [${errors?.[1] ?? 'unknown error'}] ${
          errors?.[2] ?? errorsText
        }`,
        'aws',
        {
          statusCode: response.status,
        },
      );
    }
    // todo: handle retries, timeouts, etc.
    return response;
  }
}
