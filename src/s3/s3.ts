import type { AWSBaseRequest, AWSRequest, HTTPMethod } from '../misc/awsTypes.ts';
import type { AWSClient } from '../client/client.ts';
import { AwsminiS3Error } from '../misc/AwsminiError.ts';
import { addQueryParameters, type Prettify } from '../misc/utilities.ts';
import { parseListBuckets } from './ListBucketsParser.ts';
import { parseListObjects } from './ListObjectParser.ts';
import type { ListObjectResult, S3BucketListResult } from './types.ts';

// types
type AWSS3BaseRequest = AWSBaseRequest & { bucket: string };

type AWSS3KeyRequest = AWSS3BaseRequest & { key: string };

// Precondition Header Fields
// See https://datatracker.ietf.org/doc/html/rfc7232#section-3
type AWSIfOptions = {
  ifMatch?: string;
  ifNoneMatch?: string;
  ifModifiedSince?: string;
  ifUnmodifiedSince?: string;
};

export type S3CopyObjectRequest = Prettify<AWSS3KeyRequest & { sourceBucket: string; sourceKey: string }>;

export type S3DeleteObjectRequest = Prettify<AWSS3KeyRequest>;
export type S3GetObjectRequest = Prettify<AWSS3KeyRequest & AWSIfOptions>;
export type S3HeadObjectRequest = Prettify<AWSS3KeyRequest & AWSIfOptions>;
export type S3PutObjectRequest = Prettify<AWSS3KeyRequest & { body: Uint8Array; contentSha256?: string | true }>;

export type S3ListObjectsRequest = Prettify<AWSS3BaseRequest & { prefix?: string; delimiter?: string }>;

export type S3CreateMultipartUploadRequest = Prettify<AWSS3KeyRequest>;
export type S3CompleteMultipartUploadRequest = Prettify<AWSS3KeyRequest & { uploadId: string; body: Uint8Array }>;
export type S3AbortMultipartUploadRequest = Prettify<AWSS3KeyRequest & { uploadId: string }>;
export type S3UploadPartRequest = Prettify<
  AWSS3KeyRequest & { uploadId: string; partNumber: number; body: Uint8Array }
>;

const S3ListBucketsParameters = ['bucketRegion', 'continuationToken', 'maxBuckets', 'prefix'] as const;

export type S3ListBucketsRequest = Prettify<
  AWSBaseRequest & Partial<{ [K in (typeof S3ListBucketsParameters)[number]]: string }>
>;

// Request building
const S3KeyOptions = (request: AWSS3KeyRequest, method: HTTPMethod): AWSRequest => {
  if (!request.key) throw new AwsminiS3Error('Key is required and should be at least one character long');
  return {
    method,
    subhost: request.bucket,
    path: `/${request.key}`,
    service: 's3',
    queryParameters: {},
    headers: {},
    checkResponse: request.checkResponse ?? true,
    signal: request.signal,
  };
};

const S3BaseOptions = (request: AWSS3BaseRequest, method: HTTPMethod): AWSRequest => ({
  method,
  subhost: request.bucket,
  path: '/',
  service: 's3',
  queryParameters: {},
  headers: {},
  checkResponse: request.checkResponse ?? true,
  signal: request.signal,
});

// Precondition Header Fields

const AWSAddIfOptions = (req: AWSRequest, options: AWSIfOptions) => {
  // Validate options
  if (options.ifMatch && !options.ifNoneMatch) {
    throw new AwsminiS3Error('ifMatch and ifNoneMatch cannot be used together');
  }
  if (options.ifNoneMatch && !options.ifMatch) {
    throw new AwsminiS3Error('ifNoneMatch and ifMatch cannot be used together');
  }
  if (options.ifModifiedSince && !options.ifUnmodifiedSince) {
    throw new AwsminiS3Error('ifModifiedSince and ifUnmodifiedSince cannot be used together');
  }
  if (options.ifUnmodifiedSince && !options.ifModifiedSince) {
    throw new AwsminiS3Error('ifUnmodifiedSince and ifModifiedSince cannot be used together');
  }

  // Add options
  if (options.ifMatch) req.headers['If-Match'] = options.ifMatch;
  if (options.ifNoneMatch) req.headers['If-None-Match'] = options.ifNoneMatch;
  if (options.ifModifiedSince) req.headers['If-Modified-Since'] = options.ifModifiedSince;
  if (options.ifUnmodifiedSince) req.headers['If-Unmodified-Since'] = options.ifUnmodifiedSince;
};

// Response handling

const cancelBody = (response: Response) => {
  response.body?.cancel();
  return response;
};

/// https://docs.aws.amazon.com/AmazonS3/latest/API/API_CopyObject.html
export async function S3CopyObject(client: AWSClient, request: S3CopyObjectRequest): Promise<Response> {
  const req = S3KeyOptions(request, 'PUT');
  req.headers['x-amz-copy-source'] = `${request.sourceBucket}/${request.sourceKey}`;
  return cancelBody(await client.execute(req));
}

/// https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html
export async function S3GetObject(client: AWSClient, request: S3GetObjectRequest): Promise<Uint8Array> {
  const req = S3KeyOptions(request, 'GET');
  AWSAddIfOptions(req, request);
  return (await client.execute(req)).bytes();
  // todo: handle streaming, range requests, etc.
}

/// https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html
export async function S3HeadObject(client: AWSClient, request: S3HeadObjectRequest): Promise<Response> {
  const req = S3KeyOptions(request, 'HEAD');
  AWSAddIfOptions(req, request);
  return cancelBody(await client.execute(req));
}
// Interesting headers:
//   content-type:                 application/json
//   etag:                         W/"23257c322898f8b8524280ede61e9375"
//   x-amz-checksum-crc32:         oPFISA==
//   x-amz-meta-s3b-last-modified: 20250124T001124Z
//   x-amz-meta-sha256:            c61c3b9a8361985b1f4e492904d93d99a300ac727463bb7a262a8b7b57192ea7

// https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html
export async function S3PutObject(client: AWSClient, request: S3PutObjectRequest): Promise<Response> {
  const req = S3KeyOptions(request, 'PUT');
  req.body = request.body;
  const sha256 = request.contentSha256
    ? (typeof request.contentSha256 === 'string' ? request.contentSha256 : '')
    : 'UNSIGNED-PAYLOAD';
  req.headers['x-amz-content-sha256'] = sha256;
  return cancelBody(await client.execute(req));
}

// https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html
export async function S3DeleteObject(client: AWSClient, request: S3DeleteObjectRequest): Promise<Response> {
  const req = S3KeyOptions(request, 'DELETE');
  return cancelBody(await client.execute(req));
}
// todo: if-match, x-amz-if-match-last-modified-time, x-amz-if-match-size

// https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjects.html
export async function S3ListObjects(client: AWSClient, request: S3ListObjectsRequest): Promise<ListObjectResult> {
  const req = S3BaseOptions(request, 'GET');
  // todo: more clean here, URI encoding
  if (request.prefix) req.queryParameters['prefix'] = request.prefix;
  if (request.delimiter) req.queryParameters['delimiter'] = request.delimiter;
  const response = await client.execute(req);
  return parseListObjects(await response.text());
}

// todo: handle pagination (in higher level function)

// https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html
// export async function S3ListObjectsV2(request: S3ListObjectsV2Request) {
//   const req = S3BaseOptions(request, 'GET');
//   if (request.prefix) req.queryParameters['prefix'] = request.prefix;
//   if (request.delimiter) req.queryParameters['delimiter'] = request.delimiter;
//   const response = await request.client.execute(req);
//   return parseListObjects(await response.text());
// }

export async function S3CreateMultipartUpload(
  client: AWSClient,
  request: S3CreateMultipartUploadRequest,
): Promise<string> {
  const req = S3KeyOptions(request, 'POST');
  req.queryParameters['uploads'] = '';
  const response = await client.execute(req);
  // Cache-Control, Content-Disposition, Content-Encoding, Content-Language, Content-Type, Expires
  // <InitiateMultipartUploadResult>
  //  <Bucket>string</Bucket>
  //  <Key>string</Key>
  //  <UploadId>string</UploadId>
  // </InitiateMultipartUploadResult> --> extract uploadId
  const text = await response.text();
  const uploadId = text.match(/<UploadId>(.*?)<\/UploadId>/)?.[1];
  if (!uploadId) throw new AwsminiS3Error('UploadId not found');
  return uploadId;
}

export async function S3UploadPart(client: AWSClient, request: S3UploadPartRequest): Promise<Response> {
  const req = S3KeyOptions(request, 'PUT');
  req.queryParameters['uploadId'] = request.uploadId;
  req.queryParameters['partNumber'] = request.partNumber.toString();
  req.body = request.body;
  // req.headers['x-amz-content-sha256'] = 'UNSIGNED-PAYLOAD';
  return cancelBody(await client.execute(req));
}

// <CompleteMultipartUpload xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
//   <Part><ETag>string</ETag><PartNumber>integer</PartNumber></Part>
// </CompleteMultipartUpload>
export async function S3CompleteMultipartUpload(
  client: AWSClient,
  request: S3CompleteMultipartUploadRequest,
): Promise<Response> {
  const req = S3KeyOptions(request, 'POST');
  req.queryParameters['uploadId'] = request.uploadId;
  req.body = request.body;
  return cancelBody(await client.execute(req));
}

export async function S3AbortMultipartUpload(
  client: AWSClient,
  request: S3AbortMultipartUploadRequest,
): Promise<Response> {
  const req = S3KeyOptions(request, 'DELETE');
  req.queryParameters['uploadId'] = request.uploadId;
  return await client.execute(req);
}

// https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html
export async function S3ListBuckets(client: AWSClient, request: S3ListBucketsRequest): Promise<S3BucketListResult> {
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
