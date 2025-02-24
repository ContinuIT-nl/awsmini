import { xmlEscape } from '../utilities.ts';
import { S3AbortMultipartUpload, S3CompleteMultipartUpload, S3CreateMultipartUpload, S3UploadPart } from './s3.ts';
import type { S3CreateMultipartUploadRequest } from './s3.ts';

export type multipartUploadRequest = S3CreateMultipartUploadRequest & {
  nextPart: (partNumber: number) => { body: Uint8Array; isFinalPart: boolean };
};

// todo: also create a streaming variant

export async function multipartUpload(request: multipartUploadRequest): Promise<void> {
  const uploadId = await S3CreateMultipartUpload(request);
  try {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<CompleteMultipartUpload xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    ];
    // The parts list must be specified in order by part number.
    for (let partNumber = 1;;) {
      const { body, isFinalPart } = request.nextPart(partNumber);
      // Parts (except the last one) should be at least 5MB in size (EntityTooSmall)
      if (!isFinalPart && (body.byteLength < 5 * 1024 * 1024)) throw new Error('Part is too small');
      const uploadRequest = await S3UploadPart({
        client: request.client,
        bucket: request.bucket,
        key: request.key,
        uploadId,
        partNumber,
        body,
        signal: request.signal,
        checkResponse: true,
      });
      const etag = uploadRequest.headers.get('etag');
      if (!etag) throw new Error('No etag returned from S3UploadPart');
      // todo: escape etag?
      xml.push(`<Part><ETag>${xmlEscape(etag)}</ETag><PartNumber>${partNumber}</PartNumber></Part>`);
      if (isFinalPart) break;
      if (partNumber >= 10000) throw new Error('Too many parts');
      partNumber++;
    }
    xml.push('</CompleteMultipartUpload>');
    const body = new TextEncoder().encode(xml.join(''));

    await S3CompleteMultipartUpload({
      client: request.client,
      bucket: request.bucket,
      key: request.key,
      uploadId,
      signal: request.signal,
      body,
    });
  } catch (error) {
    await S3AbortMultipartUpload({
      client: request.client,
      bucket: request.bucket,
      key: request.key,
      uploadId,
    });
    throw error;
  }
}
