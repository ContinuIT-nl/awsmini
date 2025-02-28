import type { AWSClient } from '../client/AWSClient.ts';
import { AwsminiS3Error } from '../misc/AwsminiError.ts';
import type { Prettify } from '../misc/utilities.ts';
import { S3KeyOptions, type S3KeyRequest } from './s3.ts';

/**
 * The request type for the s3CreateMultipartUpload function
 *
 * @typedef {Object} S3CreateMultipartUploadRequest
 * @property {string} bucket - The name of the bucket
 * @property {string} key - The key of the object
 * @property {AbortSignal} [signal] - An optional AbortSignal to cancel the request
 * @property {boolean} [checkResponse] - Whether to check the response
 */
export type S3CreateMultipartUploadRequest = Prettify<S3KeyRequest>;
// todo: SHA256 option

/**
 * Create a multipart upload
 *
 * @param client - An AWSClient instance
 * @param request - A S3CreateMultipartUploadRequest instance
 * @returns The uploadId
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateMultipartUpload.html
 *
 * @example
 * ```ts
 * const uploadId = await S3CreateMultipartUpload(client, { bucket: 'bucket', key: 'key' });
 * console.log(uploadId);
 * ```
 *
 * @note Use S3MultipartUploadStream or S3MultipartUpload for a higher level API to do multipart uploads.
 */
export async function s3CreateMultipartUpload(
  client: AWSClient,
  request: S3CreateMultipartUploadRequest,
): Promise<string> {
  const req = S3KeyOptions(request, 'POST');
  req.queryParameters['uploads'] = '';
  const response = await client.execute(req);
  // Todo: Cache-Control, Content-Disposition, Content-Encoding, Content-Language, Content-Type, Expires
  const text = await response.text();
  // <InitiateMultipartUploadResult><Bucket>string</Bucket><Key>string</Key><UploadId>string</UploadId></InitiateMultipartUploadResult>
  const uploadId = text.match(/<UploadId>(.*?)<\/UploadId>/)?.[1];
  if (!uploadId) throw new AwsminiS3Error('UploadId not found');
  return uploadId;
}
