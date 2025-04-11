import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest } from './sqs.ts';

/**
 * SqsMessageAttribute
 *
 * @typedef {Object} SqsMessageAttribute
 * @property {string} DataType - The data type of the message attribute.
 * @property {string} BinaryValue - The binary value of the message attribute.
 * @property {string} StringValue - The string value of the message attribute.
 */
export type SqsMessageAttribute = {
  DataType: 'String' | 'Number' | 'Binary';
  BinaryValue?: string;
  StringValue?: string;
  // Not implemented. Reserved for future use.
  // StringListValues?: string[];
  // BinaryListValues?: string[];
};

/**
 * SqsMessageToSend
 *
 * @typedef {Object} SqsMessageToSend
 * @property {string} MessageBody - The body of the message to send. 1 byte to 256 KB.
 *                                  A message can include only XML, JSON, and unformatted text.
 *                                  Supported characters are #x9 | #xA | #xD | #x20 to #xD7FF | #xE000 to #xFFFD | #x10000 to #x10FFFF
 * @property {Record<string, SqsMessageAttribute>} MessageAttributes - The attributes of the message to send.
 * @property {string} MessageDeduplicationId - The deduplication id of the message to send.
 *                                             This parameter applies only to FIFO (first-in-first-out) queues.
 * @property {string} MessageGroupId - The group id of the message to send.
 *                                     This parameter applies only to FIFO (first-in-first-out) queues.
 * @property {Record<string, SqsMessageAttribute>} MessageSystemAttributes - The system attributes of the message to send.
 *   Can only contain AWSTraceHeader which must be a AWS X-Ray trace header string.
 * @property {number} DelaySeconds - The delay in seconds for the message to be sent.
 */
export type SqsMessageToSend = {
  MessageBody: string;
  MessageAttributes?: Record<string, SqsMessageAttribute>;
  MessageDeduplicationId?: string;
  MessageGroupId?: string;
  MessageSystemAttributes?: Record<'AWSTraceHeader', SqsMessageAttribute>;
  DelaySeconds?: number;
};

/**
 * SqsSendMessageRequest
 *
 * @typedef {Object} SqsSendMessageRequest
 * @property {string} queueUrl - The URL of the queue to send the message to.
 * @property {string} messageBody - The body of the message to send.
 */
export type SqsSendMessageRequest = Prettify<AWSBaseRequest & SqsMessageToSend & { QueueUrl: string }>;

/**
 * SqsSendMessageResponse
 *
 * @typedef {Object} SqsSendMessageResponse
 * @property {string} MessageId - The id of the message to send.
 * @property {string} MD5OfMessageBody - The MD5 hash of the message body.
 * @property {string} MD5OfMessageAttributes - The MD5 hash of the message attributes.
 * @property {string} MD5OfMessageSystemAttributes - The MD5 hash of the message attributes.
 * @property {string} SequenceNumber - The sequence number of the message to send.
 */
export type SqsSendMessageResponse = {
  MessageId: string;
  MD5OfMessageBody: string;
  MD5OfMessageAttributes: string;
  MD5OfMessageSystemAttributes: string;
  SequenceNumber: string;
};

/**
 * sqsSendMessage
 *
 * @param {SqsSendMessageRequest} request - The request to send the message to the queue.
 * @returns {Promise<SqsSendMessageResponse>} - The response from the queue.
 */
export const sqsSendMessage = async (
  client: AWSClient,
  request: SqsSendMessageRequest,
): Promise<SqsSendMessageResponse> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.SendMessage', request);
  const response = await client.execute(awsRequest);
  const json = await response.json();
  return json as SqsSendMessageResponse;
};
