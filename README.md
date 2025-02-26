# awsmini

Access AWS (compatible) services fast in with simple tree shakeable code

This module is a work in progress.

## S3 Examples

### S3CopyObject

```typescript
import { AWSClient } from './src/client.ts';
import { S3CopyObject } from './src/s3/s3.ts';

// Create AWS client
const client = new AWSClient({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1',
});

// Copy an object from one location to another
const response = await S3CopyObject(client, {
  bucket: 'destination-bucket',
  key: 'destination-key.txt',
  sourceBucket: 'source-bucket',
  sourceKey: 'source-key.txt',
});

console.log('Copy successful:', response.status === 200);
```

### S3GetObject

```typescript
import { AWSClient } from './src/client.ts';
import { S3GetObject } from './src/s3/s3.ts';

const client = new AWSClient({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1',
});

// Get an object from S3
const data = await S3GetObject(client, {
  bucket: 'my-bucket',
  key: 'my-file.txt',
});

// Convert binary data to text if needed
const textContent = new TextDecoder().decode(data);
console.log('File content:', textContent);
```

### S3HeadObject

```typescript
import { AWSClient } from './src/client.ts';
import { S3HeadObject } from './src/s3/s3.ts';

const client = new AWSClient({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1',
});

// Get object metadata without downloading the object
const response = await S3HeadObject(client, {
  bucket: 'my-bucket',
  key: 'my-file.txt',
});

console.log('Content type:', response.headers.get('content-type'));
console.log('ETag:', response.headers.get('etag'));
console.log('Content length:', response.headers.get('content-length'));
```

### S3PutObject

```typescript
import { AWSClient } from './src/client.ts';
import { S3PutObject } from './src/s3/s3.ts';

const client = new AWSClient({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1',
});

// Upload a text file to S3
const content = 'Hello, World!';
const data = new TextEncoder().encode(content);

const response = await S3PutObject(client, {
  bucket: 'my-bucket',
  key: 'hello.txt',
  body: data,
});

console.log('Upload successful:', response.status === 200);
```

### S3DeleteObject

```typescript
import { AWSClient } from './src/client.ts';
import { S3DeleteObject } from './src/s3/s3.ts';

const client = new AWSClient({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1',
});

// Delete an object from S3
const response = await S3DeleteObject(client, {
  bucket: 'my-bucket',
  key: 'file-to-delete.txt',
});

console.log('Delete successful:', response.status === 204);
```

### S3ListObjects

```typescript
import { AWSClient } from './src/client.ts';
import { S3ListObjects } from './src/s3/s3.ts';

const client = new AWSClient({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1',
});

// List objects in a bucket with a prefix
const result = await S3ListObjects(client, {
  bucket: 'my-bucket',
  prefix: 'folder/',
  delimiter: '/',
});

console.log('Folders:', result.commonPrefixes);
console.log('Files:', result.contents.map((item) => item.key));
```

### S3CreateMultipartUpload

```typescript
import { AWSClient } from './src/client.ts';
import { S3CreateMultipartUpload } from './src/s3/s3.ts';

const client = new AWSClient({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1',
});

// Initiate a multipart upload
const uploadId = await S3CreateMultipartUpload(client, {
  bucket: 'my-bucket',
  key: 'large-file.zip',
});

console.log('Multipart upload initiated with ID:', uploadId);
```

### S3UploadPart

```typescript
import { AWSClient } from './src/client.ts';
import { S3UploadPart } from './src/s3/s3.ts';

const client = new AWSClient({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1',
});

// Upload a part of a multipart upload
const partData = new Uint8Array(6 * 1024 * 1024); // 6MB of data
const response = await S3UploadPart(client, {
  bucket: 'my-bucket',
  key: 'large-file.zip',
  uploadId: 'YOUR_UPLOAD_ID',
  partNumber: 1,
  body: partData,
});

const etag = response.headers.get('etag');
console.log('Part uploaded with ETag:', etag);
```

### S3CompleteMultipartUpload

```typescript
import { AWSClient } from './src/client.ts';
import { S3CompleteMultipartUpload } from './src/s3/s3.ts';

const client = new AWSClient({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1',
});

// Complete a multipart upload with the ETags of all parts
const completeXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<CompleteMultipartUpload xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
  '<Part><ETag>"a54357aff0632cce46d942af68356b38"</ETag><PartNumber>1</PartNumber></Part>',
  '<Part><ETag>"0c78aef83f66abc1fa1e8477f296d394"</ETag><PartNumber>2</PartNumber></Part>',
  '</CompleteMultipartUpload>',
].join('');

const body = new TextEncoder().encode(completeXml);

const response = await S3CompleteMultipartUpload(client, {
  bucket: 'my-bucket',
  key: 'large-file.zip',
  uploadId: 'YOUR_UPLOAD_ID',
  body,
});

console.log('Multipart upload completed successfully:', response.status === 200);
```

### S3AbortMultipartUpload

```typescript
import { AWSClient } from './src/client.ts';
import { S3AbortMultipartUpload } from './src/s3/s3.ts';

const client = new AWSClient({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1',
});

// Abort a multipart upload
const response = await S3AbortMultipartUpload(client, {
  bucket: 'my-bucket',
  key: 'large-file.zip',
  uploadId: 'YOUR_UPLOAD_ID',
});

console.log('Multipart upload aborted successfully:', response.status === 204);
```

### S3ListBuckets

```typescript
import { AWSClient } from './src/client.ts';
import { S3ListBuckets } from './src/s3/s3.ts';

const client = new AWSClient({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1',
});

// List all buckets
const result = await S3ListBuckets(client, {});

console.log('Buckets:', result.buckets.map((bucket) => bucket.name));
```
