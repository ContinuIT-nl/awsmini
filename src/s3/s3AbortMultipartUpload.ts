import type { AWSClient } from '../client/AWSClient.ts';
import type { Prettify } from '../misc/utilities.ts';
import { cancelBody } from '../misc/utilities.ts';
import { S3KeyOptions, type S3KeyRequest } from './s3.ts';

/**
 * The request type for the s3AbortMultipartUpload function
 *
 * @typedef {Object} S3AbortMultipartUploadRequest
 * @property {string} bucket - The name of the bucket
 * @property {string} key - The key of the object being uploaded
 * @property {string} uploadId - The upload ID of the multipart upload to be aborted
 * @property {AbortSignal} [signal] - An optional AbortSignal to cancel the request
 * @property {boolean} [checkResponse] - Whether to check the response
 */
export type S3AbortMultipartUploadRequest = Prettify<S3KeyRequest & { uploadId: string }>;

/**
 * Abort a multipart upload
 *
 * @param client - An AWSClient instance
 * @param request - A S3AbortMultipartUploadRequest instance
 * @returns The Response object containing the statuscode and headers
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_AbortMultipartUpload.html
 *
 * @example
 * ```ts
 * const response = await S3AbortMultipartUpload(client, { bucket: 'bucket', key: 'key', uploadId: 'uploadId' });
 * console.log(response.ok, response.headers);
 * ```
 *
 * @note Use S3MultipartUploadStream or S3MultipartUpload for a higher level API to do multipart uploads.
 */
export async function s3AbortMultipartUpload(
  client: AWSClient,
  request: S3AbortMultipartUploadRequest,
): Promise<Response> {
  const req = S3KeyOptions(request, 'DELETE', client.options.s3PathStyleUrl);
  req.queryParameters['uploadId'] = request.uploadId;
  return cancelBody(await client.execute(req));
}
