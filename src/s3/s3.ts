import type { AWSBaseRequest, AWSRequest, HTTPMethod } from '../misc/awsTypes.ts';
import { AwsminiS3Error } from '../misc/AwsminiError.ts';

// types
export type S3BucketRequest = AWSBaseRequest & { bucket: string };

export type S3KeyRequest = S3BucketRequest & { key: string };

// Request building
export const S3KeyOptions = (request: S3KeyRequest, method: HTTPMethod): AWSRequest => {
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

export const S3BaseOptions = (request: S3BucketRequest, method: HTTPMethod): AWSRequest => ({
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
// See https://datatracker.ietf.org/doc/html/rfc7232#section-3
export type AWSIfOptions = {
  ifMatch?: string;
  ifNoneMatch?: string;
  ifModifiedSince?: string;
  ifUnmodifiedSince?: string;
};

export const awsAddIfOptions = (req: AWSRequest, options: AWSIfOptions) => {
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
