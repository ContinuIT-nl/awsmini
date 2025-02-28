import type { AWSClient } from '../client/AWSClient.ts';
import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import { addQueryParameters, type Prettify } from '../misc/utilities.ts';
import { parseListBuckets } from './ListBucketsParser.ts';
import type { S3BucketListResult } from './types.ts';

const S3ListBucketsParameters = ['bucketRegion', 'continuationToken', 'maxBuckets', 'prefix'] as const;

/**
 * The request type for the S3ListBuckets function
 *
 * @typedef {Object} S3ListBucketsRequest
 * @property {string} [bucketRegion] - The region of the bucket to list
 * @property {string} [continuationToken] - The continuation token
 * @property {number} [maxBuckets] - The maximum number of buckets to return
 * @property {string} [prefix] - The prefix to filter the buckets by
 * @property {AbortSignal} [signal] - An optional AbortSignal to cancel the request
 * @property {boolean} [checkResponse] - Whether to check the response
 */
export type S3ListBucketsRequest = Prettify<
  AWSBaseRequest & Partial<{ [K in (typeof S3ListBucketsParameters)[number]]: string }>
>;

/**
 * List buckets
 *
 * @param client - An AWSClient instance
 * @param request - A S3ListBucketsRequest instance
 * @returns The S3BucketListResult object
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html
 *
 * @example
 * ```ts
 * const result = await S3ListBuckets(client);
 * console.log(result);
 * ```
 */
export async function s3ListBuckets(client: AWSClient, request: S3ListBucketsRequest): Promise<S3BucketListResult> {
  const req: AWSRequest = {
    method: 'GET',
    checkResponse: request.checkResponse ?? true,
    queryParameters: {},
    headers: {},
    signal: request.signal,
    subhost: '',
    path: '/',
    service: 's3',
  };
  addQueryParameters(request, req, S3ListBucketsParameters);
  const response = await client.execute(req);
  return parseListBuckets(await response.text());
}
