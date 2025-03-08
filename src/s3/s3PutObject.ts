import type { AWSClient } from '../client/AWSClient.ts';
import { cancelBody, type Prettify } from '../misc/utilities.ts';
import { S3KeyOptions, type S3KeyRequest } from './s3.ts';

/**
 * The request type for the S3PutObject function
 *
 * @typedef {Object} S3PutObjectRequest
 * @property {string} bucket - The bucket to put the object in
 * @property {string} key - The key of the object to put
 * @property {Uint8Array|string} body - The body of the object to put
 * @property {string|boolean} [contentSha256] - The hex encoded SHA256 hash of the object to put, or true to calculate it automatically.
 *                                              If not provided / set to false no hash will be sent.
 * @property {AbortSignal} [signal] - An optional AbortSignal to cancel the request
 * @property {boolean} [checkResponse] - Whether to check the response
 */
export type S3PutObjectRequest = Prettify<S3KeyRequest & { body: Uint8Array | string; contentSha256?: string | true }>;

/**
 * Put an object into S3
 *
 * @param client - An AWSClient instance
 * @param request - A S3PutObjectRequest instance
 * @returns The Response object containing the statuscode and headers
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html
 *
 * @example
 * ```ts
 * const body = new TextEncoder().encode('Hello, world!');
 * const response = await S3PutObject(client, { bucket: 'bucket', key: 'key', body });
 * console.log(response.ok, response.headers);
 * ```
 */
export async function s3PutObject(client: AWSClient, request: S3PutObjectRequest): Promise<Response> {
  const req = S3KeyOptions(request, 'PUT');
  req.body = typeof request.body === 'string' ? new TextEncoder().encode(request.body) : request.body;
  const sha256 = request.contentSha256
    ? (typeof request.contentSha256 === 'string' ? request.contentSha256 : '')
    : 'UNSIGNED-PAYLOAD';
  req.headers['x-amz-content-sha256'] = sha256;
  return cancelBody(await client.execute(req));
}
