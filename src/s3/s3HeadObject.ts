import type { AWSClient } from '../client/AWSClient.ts';
import { cancelBody, type Prettify } from '../misc/utilities.ts';
import { awsAddIfOptions, type AWSIfOptions, S3KeyOptions, type S3KeyRequest } from './s3.ts';

/**
 * The request type for the S3HeadObject function
 *
 * @typedef {Object} s3HeadObjectRequest
 * @property {string} bucket - The bucket to get the object from
 * @property {string} key - The key of the object to get
 * @property {string|undefined} [signal] - abort signal
 * @property {boolean} [checkResponse=true] - check the response
 * @property {string|undefined} [ifMatch] - if-match
 * @property {string|undefined} [ifNoneMatch] - if-none-match
 * @property {string|undefined} [ifModifiedSince] - if-modified-since
 * @property {string|undefined} [ifUnmodifiedSince] - if-unmodified-since
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html
 */
export type S3HeadObjectRequest = Prettify<S3KeyRequest & AWSIfOptions>;

/**
 * Get the metadata of an object from S3
 *
 * @param client - An AWSClient instance
 * @param request - A S3HeadObjectRequest instance
 * @returns The Response object containing the statuscode and headers
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html
 *
 * @example
 * ```ts
 * const response = await S3HeadObject(client, { bucket: 'bucket', key: 'key' });
 * console.log(response.ok, response.headers);
 * ```
 */
export async function s3HeadObject(client: AWSClient, request: S3HeadObjectRequest): Promise<Response> {
  const req = S3KeyOptions(request, 'HEAD', client.options?.s3PathStyleUrl ?? false);
  awsAddIfOptions(req, request);
  return cancelBody(await client.execute(req));
}

// Interesting headers:
//   content-type:                 application/json
//   etag:                         W/"23257c322898f8b8524280ede61e9375"
//   x-amz-checksum-crc32:         oPFISA==
//   x-amz-meta-s3b-last-modified: 20250124T001124Z
//   x-amz-meta-sha256:            c61c3b9a8361985b1f4e492904d93d99a300ac727463bb7a262a8b7b57192ea7
