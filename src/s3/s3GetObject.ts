import type { AWSClient } from '../client/AWSClient.ts';
import { AwsminiError } from '../misc/AwsminiError.ts';
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

export async function s3GetObjectRaw(client: AWSClient, request: S3GetObjectRequest): Promise<Response> {
  const req = S3KeyOptions(request, 'GET', client.options?.s3PathStyleUrl ?? false);
  awsAddIfOptions(req, request);
  return await client.execute(req);
}

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
  return (await s3GetObjectRaw(client, request)).bytes();
}

/**
 * Get an object from S3 as a stream
 *
 * @param client - An AWSClient instance
 * @param request - A S3GetObjectRequest instance
 * @returns The stream of the object
 */
export async function s3GetObjectStream(client: AWSClient, request: S3GetObjectRequest): Promise<ReadableStream> {
  const response = await s3GetObjectRaw(client, request);
  if (response.status !== 200 || !response.body) {
    throw new AwsminiError('Failed to get object', 's3', { statusCode: response.status });
  }
  return response.body;
}

/**
 * Get an object from S3 as a string
 *
 * @param client - An AWSClient instance
 * @param request - A S3GetObjectRequest instance
 * @returns The object as a string
 */
export async function s3GetObjectText(client: AWSClient, request: S3GetObjectRequest): Promise<string> {
  return (await s3GetObjectRaw(client, request)).text();
}
