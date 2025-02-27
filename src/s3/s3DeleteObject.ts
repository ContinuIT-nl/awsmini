import type { AWSClient } from '../client/AWSClient.ts';
import type { Prettify } from '../misc/utilities.ts';
import { type AWSS3KeyRequest, cancelBody, S3KeyOptions } from './s3.ts';

// todo: if-match, x-amz-if-match-last-modified-time, x-amz-if-match-size

/**
 * The request type for the S3DeleteObject function
 * @typedef {Object} s3DeleteObjectRequest
 * @property {string} bucket - The bucket to delete the object from
 * @property {string} key - The key of the object to delete
 * @property {string|undefined} [signal] - abort signal
 * @property {boolean} [checkResponse=true] - check the response
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html
 */
export type S3DeleteObjectRequest = Prettify<AWSS3KeyRequest>;

/**
 * Delete an object from S3
 *
 * @param client - An AWSClient instance
 * @param request - A S3DeleteObjectRequest instance
 * @returns The Response object containing the statuscode and headers
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html
 *
 * @example
 * ```ts
 * const response = await S3DeleteObject(client, { bucket: 'bucket', key: 'key' });
 * console.log(response.ok, response.headers);
 * ```
 */
export async function s3DeleteObject(client: AWSClient, request: S3DeleteObjectRequest): Promise<Response> {
  const req = S3KeyOptions(request, 'DELETE');
  return cancelBody(await client.execute(req));
}
