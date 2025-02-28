import type { AWSClient } from '../client/AWSClient.ts';
import { cancelBody, type Prettify } from '../misc/utilities.ts';
import { S3KeyOptions, type S3KeyRequest } from './s3.ts';

/**
 * The request type for the S3CopyObject function
 * @typedef {Object} S3CopyObjectRequest
 * @property {string} bucket - The bucket to copy the object to
 * @property {string} key - The key of the object to copy to
 * @property {string} sourceBucket - The bucket to copy the object from
 * @property {string} sourceKey - The key of the object to copy from
 * @property {string|undefined} [signal] - abort signal
 * @property {boolean} [checkResponse=true] - check the response
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_CopyObject.html
 */
export type S3CopyObjectRequest = Prettify<S3KeyRequest & { sourceBucket: string; sourceKey: string }>;

/**
 * Copy an object from one bucket to another
 *
 * @param client - An AWSClient instance
 * @param request - A S3CopyObjectRequest instance
 * @returns The Response object containing the statuscode and headers
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_CopyObject.html
 *
 * @example
 * ```ts
 * const response = await s3CopyObject(client, {
 *   bucket: 'targetBucket',
 *   key: 'targetKey',
 *   sourceBucket: 'sourceBucket',
 *   sourceKey: 'sourceKey' });
 * console.log(response.ok, response.headers);
 * ```
 */
export async function s3CopyObject(client: AWSClient, request: S3CopyObjectRequest): Promise<Response> {
  const req = S3KeyOptions(request, 'PUT');
  req.headers['x-amz-copy-source'] = `${request.sourceBucket}/${request.sourceKey}`;
  return cancelBody(await client.execute(req));
}
