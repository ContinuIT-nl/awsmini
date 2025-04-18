import type { AWSClient } from '../client/AWSClient.ts';
import { type Prettify, xmlEscape } from '../misc/utilities.ts';
import { s3AbortMultipartUpload } from './s3AbortMultipartUpload.ts';
import { s3CompleteMultipartUpload } from './s3CompleteMultipartUpload.ts';
import { s3CreateMultipartUpload, type S3CreateMultipartUploadRequest } from './s3CreateMultipartUpload.ts';
import { s3UploadPart } from './s3UploadPart.ts';
import { AwsminiError } from '../misc/AwsminiError.ts';

export type S3MultipartUploadPart = {
  body: Uint8Array;
  isFinalPart: boolean;
};

export type S3MultipartUploadRequest = Prettify<
  S3CreateMultipartUploadRequest & {
    nextPart: (partNumber: number) => Promise<S3MultipartUploadPart>;
  }
>;

// todo: streaming variant needs some work

/**
 * Initiates a multipart upload to S3, uploads each part, and completes the upload.
 * If any part fails to upload, the multipart upload is aborted.
 *
 * @param {S3MultipartUploadRequest} request - The multipart upload request object.
 * @returns {Promise<void>} A promise that resolves when the upload is complete.
 * @throws {AwsminiS3Error} If any part fails to upload or if the multipart upload is aborted.
 *
 * @example
 * ```ts
 * await S3MultipartUpload(client, {
 *   bucket: 'bucket',
 *   key: 'key',
 *   nextPart: async (partNumber) => {
 *     const body = await fetch(`https://example.com/file.txt?part=${partNumber}`);
 *     return {
 *       body: new Uint8Array(await body.arrayBuffer()),
 *       isFinalPart: partNumber === 10
 *     };
 *   }
 * });
 * ```
 */
export async function S3MultipartUpload(client: AWSClient, request: S3MultipartUploadRequest): Promise<void> {
  const uploadId = await s3CreateMultipartUpload(client, request);
  const etags: string[] = [];
  try {
    // The parts list must be specified in order by part number.
    for (let partNumber = 1;;) {
      const { body, isFinalPart } = await request.nextPart(partNumber);
      // Parts (except the last one) should be at least 5MB in size (EntityTooSmall)
      if (!isFinalPart && (body.byteLength < 5 * 1024 * 1024)) {
        throw new AwsminiError('Part is too small', 's3');
      }
      const uploadRequest = await s3UploadPart(client, {
        bucket: request.bucket,
        key: request.key,
        uploadId,
        partNumber,
        body,
        signal: request.signal,
        checkResponse: true,
      });
      const etag = uploadRequest.headers.get('etag');
      if (!etag) {
        throw new AwsminiError('No etag returned from S3UploadPart', 's3');
      }
      etags.push(etag);
      if (isFinalPart) break;
      if (partNumber >= 10000) {
        throw new AwsminiError('Too many parts (max 10000)', 's3');
      }
      partNumber++;
    }
    await s3CompleteMultipartUpload(client, {
      bucket: request.bucket,
      key: request.key,
      uploadId,
      signal: request.signal,
      body: buildMultipartUploadBody(etags),
    });
  } catch (error) {
    await s3AbortMultipartUpload(client, {
      bucket: request.bucket,
      key: request.key,
      uploadId,
    });
    if (error instanceof AwsminiError) throw error;
    throw new AwsminiError('Multipart upload failed', 's3', {
      cause: error instanceof Error ? error : new Error(String(error)), // todo: makeError in  utilities.ts
    });
  }
}

/**
 * Builds the body for a complete multipart upload request.
 * @param etags - The etags of the parts to upload.
 * @returns The body for a complete multipart upload request.
 */
export const buildMultipartUploadBody = (etags: string[]): Uint8Array => {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<CompleteMultipartUpload xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    ...etags.map((etag, i) => `<Part><ETag>${xmlEscape(etag)}</ETag><PartNumber>${i + 1}</PartNumber></Part>`),
    '</CompleteMultipartUpload>',
  ];
  return new TextEncoder().encode(xml.join(''));
};

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
 *
 * @example
 * ```ts
 * await S3MultipartUploadStream(client, { bucket: 'bucket', key: 'key', stream });
 * ```
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
      // todo: this still needs checking/error handling/see if buffering works correctly

      // Determine if this is the final part
      const isFinalPart = isStreamDone;

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
