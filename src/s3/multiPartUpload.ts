import type { AWSClient } from '../client.ts';
import { type Prettify, xmlEscape } from '../utilities.ts';
import { S3AbortMultipartUpload, S3CompleteMultipartUpload, S3CreateMultipartUpload, S3UploadPart } from './s3.ts';
import type { S3CreateMultipartUploadRequest } from './s3.ts';

export type S3MultipartUploadPart = {
  body: Uint8Array;
  isFinalPart: boolean;
};

export type S3MultipartUploadRequest = Prettify<
  S3CreateMultipartUploadRequest & {
    nextPart: (partNumber: number) => Promise<S3MultipartUploadPart>;
  }
>;

// todo: own error type
// todo: streaming variant
//
/**
 * Initiates a multipart upload to S3, uploads each part, and completes the upload.
 * If any part fails to upload, the multipart upload is aborted.
 *
 * @param {S3MultipartUploadRequest} request - The multipart upload request object.
 * {AWSClient} request.client - The AWS client to use for the upload.
 * {string} request.bucket - The name of the S3 bucket.
 * {string} request.key - The key for the S3 object.
 * {AbortSignal} [request.signal] - An optional AbortSignal to cancel the request.
 * {function} request.nextPart - A function that returns the next part to upload.
 * {Uint8Array} request.nextPart.body - The body of the part to upload.
 * {boolean} request.nextPart.isFinalPart - Whether the part is the final part of the upload.
 * @returns {Promise<void>} A promise that resolves when the upload is complete.
 * @throws {Error} If any part fails to upload or if the multipart upload is aborted.
 */

export async function S3MultipartUpload(client: AWSClient, request: S3MultipartUploadRequest): Promise<void> {
  const uploadId = await S3CreateMultipartUpload(client, request);
  try {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<CompleteMultipartUpload xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    ];
    // The parts list must be specified in order by part number.
    for (let partNumber = 1;;) {
      const { body, isFinalPart } = await request.nextPart(partNumber);
      // Parts (except the last one) should be at least 5MB in size (EntityTooSmall)
      if (!isFinalPart && (body.byteLength < 5 * 1024 * 1024)) throw new Error('Part is too small');
      const uploadRequest = await S3UploadPart(client, {
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

    await S3CompleteMultipartUpload(client, {
      bucket: request.bucket,
      key: request.key,
      uploadId,
      signal: request.signal,
      body,
    });
  } catch (error) {
    await S3AbortMultipartUpload(client, {
      bucket: request.bucket,
      key: request.key,
      uploadId,
    });
    throw error;
  }
}

export type S3MultipartUploadStreamRequest = Prettify<
  Omit<S3MultipartUploadRequest, 'nextPart'> & { stream: ReadableStream<Uint8Array> }
>;

/**
 * Uploads a stream to S3 using multipart upload.
 * Reads the stream in chunks of 10MB and uploads each chunk as a part.
 *
 * @param client The AWS client
 * @param request The multipart upload request with a stream instead of a nextPart callback
 * @returns A promise that resolves when the upload is complete
 */
export function S3MultipartUploadStream(client: AWSClient, request: S3MultipartUploadStreamRequest): Promise<void> {
  const _10MB_ = 10 * 1024 * 1024;
  const reader = request.stream.getReader();

  let buffer: Uint8Array = new Uint8Array(0);
  let isStreamDone = false;

  return S3MultipartUpload(client, {
    ...request,
    nextPart: async (_partNumber: number) => {
      // If we have at least 10MB in the buffer or the stream is done, return a part
      while (buffer.byteLength < _10MB_ && !isStreamDone) {
        const { done, value } = await reader.read();

        if (done) {
          isStreamDone = true;
          break;
        }

        if (value) {
          // Combine existing buffer with new chunk
          const newBuffer = new Uint8Array(buffer.byteLength + value.byteLength);
          newBuffer.set(buffer);
          newBuffer.set(value, buffer.byteLength);
          buffer = newBuffer;
        }
      }

      // Determine if this is the final part
      const isFinalPart = isStreamDone;

      // For non-final parts, ensure we have at least 5MB (S3 requirement)
      if (!isFinalPart && buffer.byteLength < 5 * 1024 * 1024) {
        throw new Error('Part is too small');
      }

      let partBuffer: Uint8Array;

      if (isFinalPart) {
        // For the final part, use whatever is left in the buffer
        partBuffer = buffer;
        buffer = new Uint8Array(0);
      } else {
        // For non-final parts, use exactly 10MB
        partBuffer = buffer.slice(0, _10MB_);
        buffer = buffer.slice(_10MB_);
      }

      return {
        body: partBuffer,
        isFinalPart,
      };
    },
  });
}
