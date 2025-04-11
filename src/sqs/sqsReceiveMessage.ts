import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';
import type { Prettify } from '../misc/utilities.ts';
import type { AWSClient } from '../mod.ts';
import { sqsAwsRequest } from './sqs.ts';

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
    messageSystemAttributes?: (
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

export type SqsMessageAttribute = {
  BinaryListValues?: string[];
  BinaryValue?: string;
  DataType: string;
  StringListValues?: string[];
  StringValue?: string;
};

export type SqsMessage = {
  Attributes: Record<string, string>;
  Body: string;
  MD5OfBody: string;
  MD5OfMessageAttributes: string;
  MessageAttributes: Record<string, SqsMessageAttribute>; // todo: do some translation here
  MessageId: string;
  ReceiptHandle: string;
};

/**
 * SqsReceiveMessageResponse
 *
 * @typedef {Object} SqsReceiveMessageResponse
 * @property {SqsMessage[]} Messages - The messages received from the queue.
 */

export type SqsReceiveMessageResponse = {
  Messages: SqsMessage[];
};

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
    MessageSystemAttributes: request.messageSystemAttributes,
    ReceiveRequestAttemptId: request.receiveRequestAttemptId,
  });
  const response = await client.execute(awsRequest);
  const responseBody = await response.json();
  return responseBody as SqsReceiveMessageResponse;
  // todo: conversion and simplification here
};
