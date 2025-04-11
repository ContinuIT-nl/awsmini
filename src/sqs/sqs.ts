import type { AWSBaseRequest, AWSRequest } from '../misc/awsTypes.ts';

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

// todo: message types here,

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
    ? { DataType: 'Binary', BinaryValue: value.toString() } // todo: real implementation
    : { DataType: typeof value === 'number' ? 'Number' : 'String', StringValue: value.toString() };

export const sqsUnmarshallAttribute = (attribute: MessageAttributeValue): string | number | Uint8Array =>
    attribute.DataType === 'Binary' ? new Uint8Array(0)
  : attribute.DataType === 'Number' ? Number(attribute.StringValue)
  : attribute.StringValue ?? '';

// todo: SendMessageBatch
// todo: DeleteMessageBatch
