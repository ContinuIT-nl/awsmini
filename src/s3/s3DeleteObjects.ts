import type { AWSClient } from '../client/AWSClient.ts';
import { AwsminiError } from '../misc/AwsminiError.ts';
import { bufferToBase64, bufferToHex, hashSha256, type Prettify, xmlEscape } from '../misc/utilities.ts';
import { S3BaseOptions, type S3BucketRequest } from './s3.ts';
import { parseDeleteObjects } from './DeleteObjectsParser.ts';
import type { S3DeleteObjectsResult } from './types.ts';

// todo: if-match, x-amz-if-match-last-modified-time, x-amz-if-match-size

/**
 * The request type for the S3DeleteObject function
 *
 * @typedef {Object} s3DeleteObjectsRequest
 * @property {string} bucket - The bucket to delete the objects from
 * @property {string[]} keys - The keys of the objects to delete, valid values are 1..1000
 * @property {string|undefined} [signal] - abort signal
 * @property {boolean} [checkResponse=true] - check the response
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html
 */
export type S3DeleteObjectsRequest = Prettify<S3BucketRequest & { keys: string[]; quiet?: boolean }>;

/**
 * Delete objects from S3
 *
 * @param client - An AWSClient instance
 * @param request - A S3DeleteObjectsRequest instance
 * @returns The Response object containing the statuscode and headers
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjects.html
 *
 * @example
 * ```ts
 * const response = await S3DeleteObjects(client, { bucket: 'bucket', keys: ['key1', 'key2'] });
 * console.log(response.ok, response.headers);
 * ```
 */
export async function s3DeleteObjects(
  client: AWSClient,
  request: S3DeleteObjectsRequest,
): Promise<S3DeleteObjectsResult> {
  if (request.keys.length === 0) return { deleted: [], errors: [] };
  if (request.keys.length > 1000) throw new AwsminiError('S3DeleteObjects: max 1000 keys', 's3');
  const req = S3BaseOptions(request, 'POST', client.options?.s3PathStyleUrl ?? false);
  req.queryParameters['delete'] = '';
  const body = `<Delete>${request.keys.map((key) => `<Object><Key>${xmlEscape(key)}</Key></Object>`).join('')}${
    request.quiet ? '<Quiet>true</Quiet>' : ''
  }</Delete>`;
  req.body = new TextEncoder().encode(body);
  const hash = await hashSha256(req.body);

  req.headers['x-amz-content-sha256'] = bufferToHex(hash);
  req.headers['x-amz-checksum-sha256'] = bufferToBase64(hash);
  const res = await client.execute(req);
  if (!res.ok) throw new AwsminiError('S3DeleteObjects: failed', 's3', { statusCode: res.status });
  const xmlResponse = await res.text();
  return parseDeleteObjects(xmlResponse);
}
