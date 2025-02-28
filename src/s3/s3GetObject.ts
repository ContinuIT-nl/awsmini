import type { AWSClient } from '../client/AWSClient.ts';
import type { Prettify } from '../misc/utilities.ts';
import { awsAddIfOptions, type AWSIfOptions, S3KeyOptions, type S3KeyRequest } from './s3.ts';

/**
 * Get an object from S3
 *
 * @typedef {Object} s3GetObjectRequest
 * @property {string} bucket - The bucket to get the object from
 * @property {string} key - The key of the object to get
 * @property {string|undefined} [signal] - abort signal
 * @property {boolean} [checkResponse=true] - check the response
 * @property {string|undefined} [ifMatch] - if-match
 * @property {string|undefined} [ifNoneMatch] - if-none-match
 * @property {string|undefined} [ifModifiedSince] - if-modified-since
 * @property {string|undefined} [ifUnmodifiedSince] - if-unmodified-since
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html
 */
export type S3GetObjectRequest = Prettify<S3KeyRequest & AWSIfOptions>;

/**
 * Get an object from S3
 *
 * @param client - An AWSClient instance
 * @param request - A S3GetObjectRequest instance
 * @returns The Uint8Array containing the object
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html
 *
 * @example
 * ```ts
 * const response = await S3GetObject(client, { bucket: 'bucket', key: 'key' });
 * console.log(response.byteLength);
 * ```
 */
export async function s3GetObject(client: AWSClient, request: S3GetObjectRequest): Promise<Uint8Array> {
  const req = S3KeyOptions(request, 'GET');
  awsAddIfOptions(req, request);
  return (await client.execute(req)).bytes();
  // todo: handle streaming, range requests, etc.
}
