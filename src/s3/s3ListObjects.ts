import type { AWSClient } from '../client/AWSClient.ts';
import type { Prettify } from '../misc/utilities.ts';
import { S3BaseOptions, type S3BucketRequest } from './s3.ts';
import { parseListObjects } from './ListObjectParser.ts';
import type { ListObjectResult } from './types.ts';

/**
 * The request type for the S3ListObjects function
 *
 * @typedef {Object} S3ListObjectsRequest
 * @property {string} [bucket] - The bucket to list objects from
 * @property {string} [prefix] - The prefix to filter objects by
 * @property {string} [delimiter] - The delimiter to group objects by
 * @property {AbortSignal} [signal] - The signal to use for the request
 * @property {boolean} [checkResponse] - Whether to check the response
 */

export type S3ListObjectsRequest = Prettify<S3BucketRequest & { prefix?: string; delimiter?: string }>;

/**
 * List objects in a bucket
 *
 * @param client - An AWSClient instance
 * @param request - A S3ListObjectsRequest instance
 * @returns The ListObjectResult object
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjects.html
 *
 * @example
 * ```ts
 * const result = await S3ListObjects(client, { bucket: 'bucket', prefix: 'hello/' });
 * console.log(result);
 * ```
 */
export async function s3ListObjects(client: AWSClient, request: S3ListObjectsRequest): Promise<ListObjectResult> {
  const req = S3BaseOptions(request, 'GET');
  if (request.prefix) req.queryParameters['prefix'] = request.prefix; // todo: URI encoding
  if (request.delimiter) req.queryParameters['delimiter'] = request.delimiter; // todo: URI encoding
  const response = await client.execute(req);
  return parseListObjects(await response.text());
}

// https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html
// export async function S3ListObjectsV2(request: S3ListObjectsV2Request) {
//   const req = S3BaseOptions(request, 'GET');
//   if (request.prefix) req.queryParameters['prefix'] = request.prefix;
//   if (request.delimiter) req.queryParameters['delimiter'] = request.delimiter;
//   const response = await request.client.execute(req);
//   return parseListObjects(await response.text());
// }

// todo: implement S3ListObjectsV2
// todo: implement pagination / continuation token
