import type { AWSClient } from '../client/AWSClient.ts';
import { cancelBody, type Prettify } from '../misc/utilities.ts';
import { S3KeyOptions, type S3KeyRequest } from './s3.ts';

/**
 * The request type for the s3CompleteMultipartUpload function
 *
 * @typedef {Object} S3CompleteMultipartUploadRequest
 * @property {string} bucket - The name of the bucket
 * @property {string} key - The key of the object being uploaded
 * @property {string} uploadId - The upload ID of the multipart upload
 * @property {Uint8Array} body - The body of the multipart upload (XML)
 */
export type S3CompleteMultipartUploadRequest = Prettify<S3KeyRequest & { uploadId: string; body: Uint8Array }>;

/**
 * Complete a multipart upload
 *
 * @param client - An AWSClient instance
 * @param request - A S3CompleteMultipartUploadRequest instance
 * @returns The Response object containing the statuscode and headers and XML body
 *
 * ```xml
 *  <CompleteMultipartUpload xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
 *    <Part>
 *      <ETag>string</ETag>
 *      <PartNumber>integer</PartNumber>
 *    </Part>
 *    ...
 *  </CompleteMultipartUpload>
 * ```
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_CompleteMultipartUpload.html
 *
 * @example
 * ```ts
 * const response = await S3CompleteMultipartUpload(client, {
 *   bucket: 'bucket',
 *   key: 'key',
 *   uploadId: 'uploadId',
 *   body: buildMultipartUploadBody(['etag1', 'etag2', 'etag3'])
 * });
 * console.log(response.ok, response.headers);
 * ```
 *
 * @note Use S3MultipartUploadStream or S3MultipartUpload for a higher level API to do multipart uploads.
 */
export async function s3CompleteMultipartUpload(
  client: AWSClient,
  request: S3CompleteMultipartUploadRequest,
): Promise<Response> {
  const req = S3KeyOptions(request, 'POST');
  req.queryParameters['uploadId'] = request.uploadId;
  req.body = request.body;
  return cancelBody(await client.execute(req));
}
