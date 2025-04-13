import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import { decodeBase64, encodeBase64 } from '@std/encoding/base64';

/**
 * sqsAwsRequest
 *
 * @param request - The request to send to the AWS SQS service.
 * @param target - The target of the request.
 * @param body - The body of the request.
 * @returns The AWS request.
 */
export const sqsAwsRequest = (request: AWSBaseRequest, target: string, body: unknown): AWSRequest => ({
  method: 'POST',
  path: '/',
  service: 'sqs',
  queryParameters: {},
  headers: {
    'x-amz-target': target,
    'content-type': 'application/x-amz-json-1.0',
  },
  body: new TextEncoder().encode(JSON.stringify(body)),
  checkResponse: true,
  signal: request.signal,
});

/**
 * MessageAttributeValue - AWS SQS type
 *
 * @typedef {Object} MessageAttributeValue
 * @property {string} DataType - The data type of the message attribute.
 * @property {string} BinaryValue - The binary value of the message attribute.
 * @property {string} StringValue - The string value of the message attribute.
 */
export type MessageAttributeValue = {
  DataType: 'String' | 'Number' | 'Binary';
  BinaryValue?: string;
  StringValue?: string;
  // Not implemented. Reserved for future use.
  StringListValues?: string[];
  BinaryListValues?: string[];
};

/**
 * Marshall a value to a MessageAttributeValue
 * @param value - The value to marshall
 * @returns The marshalled value
 */
export const sqsMarshallAttribute = (value: string | number | boolean | Uint8Array): MessageAttributeValue =>
  value instanceof Uint8Array
    ? { DataType: 'Binary', BinaryValue: encodeBase64(value) }
    : { DataType: typeof value === 'number' ? 'Number' : 'String', StringValue: value.toString() };

/**
 * Unmarshall a MessageAttributeValue
 * @param attribute - The attribute to unmarshall
 * @returns The unmarshalled value
 */
export const sqsUnmarshallAttribute = (attribute: MessageAttributeValue): string | number | Uint8Array =>
  attribute.DataType === 'Binary'
    ? decodeBase64(attribute.BinaryValue ?? '')
    : attribute.DataType === 'Number'
    ? Number(attribute.StringValue)
    : attribute.StringValue ?? '';

/**
 * SqsMessageToSend - AWS SQS type
 *
 * @typedef {Object} SqsMessageToSend
 * @property {string} MessageBody - The body of the message to send. 1 byte to 256 KB.
 *                                  A message can include only XML, JSON, and unformatted text.
 *                                  Supported characters are #x9 | #xA | #xD | #x20 to #xD7FF | #xE000 to #xFFFD | #x10000 to #x10FFFF
 * @property {Record<string, MessageAttributeValue>} MessageAttributes - The attributes of the message to send.
 * @property {string} MessageDeduplicationId - The deduplication id of the message to send.
 *                                             This parameter applies only to FIFO (first-in-first-out) queues.
 * @property {string} MessageGroupId - The group id of the message to send.
 *                                     This parameter applies only to FIFO (first-in-first-out) queues.
 * @property {Record<string, MessageAttributeValue>} MessageSystemAttributes - The system attributes of the message to send.
 *   Can only contain AWSTraceHeader which must be a AWS X-Ray trace header string.
 * @property {number} DelaySeconds - The delay in seconds for the message to be sent.
 */
export type SqsMessageToSend = {
  messageBody: string;
  messageAttributes?: Record<string, string | number | Uint8Array>;
  messageDeduplicationId?: string;
  messageGroupId?: string;
  messageSystemAttributes?: Record<'AWSTraceHeader', string>;
  delaySeconds?: number;
};

/**
 * SqsSendMessageResponse - AWS SQS type
 *
 * @typedef {Object} SqsSendMessageResponse
 * @property {string} MessageId - The id of the message to send.
 * @property {string} MD5OfMessageBody - The MD5 hash of the message body.
 * @property {string} MD5OfMessageAttributes - The MD5 hash of the message attributes.
 * @property {string} MD5OfMessageSystemAttributes - The MD5 hash of the message attributes.
 * @property {string} SequenceNumber - The sequence number of the message to send.
 */
export type SqsSendMessageSent = {
  MessageId: string;
  MD5OfMessageBody: string;
  MD5OfMessageAttributes: string;
  MD5OfMessageSystemAttributes: string;
  SequenceNumber: string;
};
