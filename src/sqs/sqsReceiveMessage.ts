import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { Prettify } from '../misc/utilities.ts';
import type { AWSClient, MessageAttributeValue } from '../mod.ts';
import { sqsAwsRequest, sqsUnmarshallAttribute } from './sqs.ts';

/**
 * SqsReceiveMessageRequest
 *
 * @typedef {Object} SqsReceiveMessageRequest
 * @property {string} queueUrl - The URL of the queue to receive messages from.
 * @property {number} maxNumberOfMessages - The maximum number of messages to receive, 1..10, default 1.
 * @property {number} visibilityTimeout - The visibility timeout for the message, 0..43200, default 30.
 * @property {number} waitTimeSeconds - The wait time for the message, 0..20, default 0, long polling.
 * @property {string[]} MessageAttributeNames - The message attribute names to receive, to receive all set ['All'].
 * @property {string[]} MessageSystemAttributes - The message system attributes to receive, to receive all set ['All'].
 * @property {string} ReceiveRequestAttemptId - The receive request attempt id, Used for Fifo queues.
 */

export type SqsReceiveMessageRequest = Prettify<
  AWSBaseRequest & {
    queueUrl: string;
    maxNumberOfMessages?: number;
    visibilityTimeout?: number;
    waitTimeSeconds?: number;
    messageAttributeNames?: string[];
    messageSystemAttributeNames?: (
      | 'All'
      | 'SenderId'
      | 'SentTimestamp'
      | 'ApproximateReceiveCount'
      | 'ApproximateFirstReceiveTimestamp'
      | 'SequenceNumber'
      | 'MessageDeduplicationId'
      | 'MessageGroupId'
      | 'AWSTraceHeader'
      | 'DeadLetterQueueSourceArn'
    )[];
    receiveRequestAttemptId?: string;
  }
>;

/**
 * SqsMessage - AWS SQS type
 *
 * @typedef {Object} SqsMessage
 * @property {string} MessageId - The message id.
 * @property {string} ReceiptHandle - The receipt handle.
 * @property {string} Body - The body of the message.
 * @property {string} MD5OfBody - The MD5 of the body of the message.
 * @property {string} MD5OfMessageAttributes - The MD5 of the message attributes.
 * @property {Record<string, string>} Attributes - The attributes of the message.
 * @property {Record<string, MessageAttributeValue>} MessageAttributes - The message attributes.
 */
export type SqsMessage = {
  MessageId: string;
  ReceiptHandle: string;
  Body: string;
  MD5OfBody: string;
  MD5OfMessageAttributes: string;
  Attributes: Record<string, string>;
  MessageAttributes: Record<string, MessageAttributeValue>;
};

/**
 * SqsReceiveMessageResponse - AWS SQS type
 *
 * @typedef {Object} SqsReceiveMessageResponse
 * @property {SqsMessage[]} messages - The messages received from the queue.
 */

export type SqsReceiveMessageInternalResponse = {
  Messages: SqsMessage[];
};

export type SqsReceiveMessage = {
  messageId: string;
  receiptHandle: string;
  body: string;
  md5OfBody: string;
  md5OfMessageAttributes: string;
  attributes: Record<string, string>;
  messageAttributes: Record<string, string | number | Uint8Array>;
};

export type SqsReceiveMessageResponse = SqsReceiveMessage[];

/**
 * Receive up to 10 messages from a queue
 * @param client - The AWS client
 * @param request - The request describing the message to receive
 * @returns The response from the AWS service.
 *
 * You must wait 60 seconds after deleting a queue before you can create another with the same name.
 *
 * @example
 * ```ts
 * await sqsReceiveMessage(client, {
 *   queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
 *   maxNumberOfMessages: 10,
 *   visibilityTimeout: 30,
 *   waitTimeSeconds: 0,
 *   messageAttributeNames: ['All'],
 *   messageSystemAttributes: ['All']
 * });
 * ```
 *
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_ReceiveMessage.html
 */
export const sqsReceiveMessage = async (
  client: AWSClient,
  request: SqsReceiveMessageRequest,
): Promise<SqsReceiveMessageResponse> => {
  const awsRequest: AWSRequest = sqsAwsRequest(request, 'AmazonSQS.ReceiveMessage', {
    QueueUrl: request.queueUrl,
    MaxNumberOfMessages: request.maxNumberOfMessages,
    VisibilityTimeout: request.visibilityTimeout,
    WaitTimeSeconds: request.waitTimeSeconds,
    MessageAttributeNames: request.messageAttributeNames,
    MessageSystemAttributeNames: request.messageSystemAttributeNames,
    ReceiveRequestAttemptId: request.receiveRequestAttemptId,
  });
  const response = await client.execute(awsRequest);
  const responseBody = (await response.json()) as SqsReceiveMessageInternalResponse;
  return responseBody.Messages.map((message) => ({
    messageId: message.MessageId,
    receiptHandle: message.ReceiptHandle,
    body: message.Body,
    md5OfBody: message.MD5OfBody,
    md5OfMessageAttributes: message.MD5OfMessageAttributes,
    attributes: message.Attributes,
    messageAttributes: message.MessageAttributes
      ? Object.fromEntries(
        Object.entries(message.MessageAttributes).map(([key, value]) => [key, sqsUnmarshallAttribute(value)]),
      )
      : {},
  }));
};
