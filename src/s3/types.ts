export type S3Owner = {
  displayName?: string;
  id: string;
};

export type S3Object = {
  key: string;
  size: number;
  lastModified: string;
  etag: string;
  storageClass: string;
  checksumAlgorithm: string;
  checksumType: string;
  owner: S3Owner;
  // restoreStatus { IsRestoreInProgress: boolean; RestoreExpiryDate: string; }
};

export type ListObjectResult = {
  content: S3Object[];
  prefixes: string[];
  isTruncated: boolean;
  marker: string;
  continuationToken?: string;
};

export type S3Bucket = {
  region?: string;
  creationDate: string;
  name: string;
};

export type S3BucketListResult = {
  buckets: S3Bucket[];
  owner: S3Owner;
  continuationToken?: string;
  prefix?: string;
};
