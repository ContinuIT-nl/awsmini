import type { AWSClient } from '../client/AWSClient.ts';
import { cancelBody, type Prettify } from '../misc/utilities.ts';
import { S3KeyOptions, type S3KeyRequest } from './s3.ts';

/**
 * The request type for the s3UploadPart function
 *
 * @typedef {Object} S3UploadPartRequest
 * @property {string} bucket - The name of the bucket
 * @property {string} key - The key of the object
 * @property {string} uploadId - The upload ID
 * @property {number} partNumber - The part number
 * @property {Uint8Array} body - The body of the part
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_UploadPart.html
 */
export type S3UploadPartRequest = Prettify<
  S3KeyRequest & { uploadId: string; partNumber: number; body: Uint8Array }
>;

/**
 * Upload a part of a multipart upload
 *
 * @param client - An AWSClient instance
 * @param request - A S3UploadPartRequest instance
 * @returns The Response object containing the statuscode and headers
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_UploadPart.html
 *
 * @example
 * ```ts
 * const response = await S3UploadPart(client, { bucket: 'bucket', key: 'key', uploadId: 'uploadId', partNumber: 1, body: new Uint8Array([1, 2, 3]) });
 * console.log(response.ok, response.headers);
 * ```
 *
 * @note Use S3MultipartUploadStream or S3MultipartUpload for a higher level API to do multipart uploads.
 */
export async function s3UploadPart(client: AWSClient, request: S3UploadPartRequest): Promise<Response> {
  const req = S3KeyOptions(request, 'PUT', client.options?.s3PathStyleUrl ?? false);
  req.queryParameters['partNumber'] = request.partNumber.toString();
  req.queryParameters['uploadId'] = request.uploadId;
  req.body = request.body;
  // req.headers['x-amz-content-sha256'] = 'UNSIGNED-PAYLOAD';
  return cancelBody(await client.execute(req));
}
