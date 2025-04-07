# awsmini

Access AWS (compatible) services fast with simple tree-shakeable code

This module is a work in progress.

## Setup AWS client

The class AWSClient is used to perform the requests you want to make.
When setting up an instance, you can specify the credentials and a few other parameters.

If you want to set the parameters manually, you can do:

```typescript
const client = new AWSClient({
  region: 'us-east-1',
  accessKeyId: 'my-access-key',
  secretAccessKey: 'my-secret-access-key',
  ...
});
```

If the class is instantiated in a non-browser environment, you can get the information from a different number of sources:

### From environment variables

```typescript
const client = new AWSClient(clientConfigEnv());
```

The configuration should be present in the environment variables (example for connecting to R2):

```ini
AWS_ENDPOINT_URL=https://some-user-id.r2.cloudflarestorage.com
AWS_ACCESS_KEY=my-access-key
AWS_SECRET_KEY=my-secret-key
AWS_REGION=auto
```

### From `~/.aws`

To be implemented

### From SSO

To be implemented

### From IMDSv2

To be implemented

### Combining several sources

Better explanation here

```typescript
const client = new AWSClient(clientConfigEnv(clientConfigFromSSO()));
```

## S3 Examples

### S3CopyObject

```typescript
import { s3CopyObject } from './src/s3/s3CopyObject.ts';

const client = obtainClient(); // See Setup AWS client

// Copy an object from one location to another
const response = await s3CopyObject(client, {
  bucket: 'destination-bucket',
  key: 'destination-key.txt',
  sourceBucket: 'source-bucket',
  sourceKey: 'source-key.txt',
});

console.log('Copy successful:', response.ok);
```

### S3GetObject

```typescript
import { s3GetObject } from './src/s3/s3GetObject.ts';

const client = obtainClient(); // See Setup AWS client

// Get an object from S3
const data = await s3GetObject(client, {
  bucket: 'my-bucket',
  key: 'my-file.txt',
});

// Convert binary data to text if needed
const textContent = new TextDecoder().decode(data);
console.log('File content:', textContent);
```

### S3HeadObject

```typescript
import { s3HeadObject } from './src/s3/s3HeadObject.ts';

const client = obtainClient(); // See Setup AWS client

// Get object metadata without downloading the object
const response = await s3HeadObject(client, {
  bucket: 'my-bucket',
  key: 'my-file.txt',
});

console.log('Content type:', response.headers.get('content-type'));
console.log('ETag:', response.headers.get('etag'));
console.log('Content length:', response.headers.get('content-length'));
```

### S3PutObject

```typescript
import { s3PutObject } from './src/s3/s3PutObject.ts';

const client = obtainClient(); // See Setup AWS client

// Upload a text file to S3
const content = 'Hello, World!';
const data = new TextEncoder().encode(content);

const response = await s3PutObject(client, {
  bucket: 'my-bucket',
  key: 'hello.txt',
  body: data,
});

console.log('Upload successful:', response.status === 200);
```

### S3DeleteObject

```typescript
import { s3DeleteObject } from './src/s3/s3DeleteObject.ts';

const client = obtainClient(); // See Setup AWS client

// Delete an object from S3
const response = await s3DeleteObject(client, {
  bucket: 'my-bucket',
  key: 'file-to-delete.txt',
});

console.log('Delete successful:', response.ok);
```

### S3ListObjects

Warning: There is a 1000 file limit (see pagination). Reference the wrapper.
Note: When using a delimiter, you get common prefixes; without a delimiter, you get files.

```typescript
import { s3ListObjects } from './src/s3/s3ListObjects.ts';

const client = obtainClient(); // See Setup AWS client

// List objects in a bucket with a prefix
const result = await s3ListObjects(client, {
  bucket: 'my-bucket',
  prefix: 'folder/',
  delimiter: '/',
});

console.log('Folders:', result.commonPrefixes);
console.log('Files:', result.contents.map((item) => item.key));
```

### S3CreateMultipartUpload

See the wrapper for more details.

```typescript
import { s3CreateMultipartUpload } from './src/s3/s3CreateMultipartUpload.ts';

const client = obtainClient(); // See Setup AWS client

// Initiate a multipart upload
const uploadId = await s3CreateMultipartUpload(client, {
  bucket: 'my-bucket',
  key: 'large-file.zip',
});

console.log('Multipart upload initiated with ID:', uploadId);
```

### S3UploadPart

Note: There is a 5MB minimum limit and a 10000 parts maximum limit.

```typescript
import { s3UploadPart } from './src/s3/s3UploadPart.ts';

const client = obtainClient(); // See Setup AWS client

// Upload a part of a multipart upload
const partData = new Uint8Array(6 * 1024 * 1024); // 6MB of data
const response = await s3UploadPart(client, {
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
import { s3CompleteMultipartUpload } from './src/s3/s3CompleteMultipartUpload.ts';

const client = obtainClient(); // See Setup AWS client

// Complete a multipart upload with the ETags of all parts

const response = await s3CompleteMultipartUpload(client, {
  bucket: 'my-bucket',
  key: 'large-file.zip',
  uploadId: 'YOUR_UPLOAD_ID',
  body: buildMultipartUploadBody(['etag1', 'etag2', 'etag3'])
});

console.log('Multipart upload completed successfully:', response.status === 200);
```

### S3AbortMultipartUpload

```typescript
import { s3AbortMultipartUpload } from './src/s3/s3AbortMultipartUpload.ts';

const client = obtainClient(); // See Setup AWS client

// Abort a multipart upload
const response = await s3AbortMultipartUpload(client, {
  bucket: 'my-bucket',
  key: 'large-file.zip',
  uploadId: 'YOUR_UPLOAD_ID',
});

console.log('Multipart upload aborted successfully:', response.status === 204);
```

### S3ListBuckets

```typescript
import { s3ListBuckets } from './src/s3/s3ListBuckets.ts';

const client = obtainClient(); // See Setup AWS client

// List all buckets
const result = await s3ListBuckets(client, {});

console.log('Buckets:', result.buckets.map((bucket) => bucket.name));
```
