import { assert } from '@std/assert';
import { clientAWS, sleep } from './testUtilities.ts';
import {
  sqsCreateQueue,
  sqsDeleteMessage,
  sqsDeleteQueue,
  sqsGetQueueAttributes,
  sqsGetQueueUrl,
  sqsListQueues,
  sqsPurgeQueue,
  sqsReceiveMessage,
  sqsSendMessage,
} from '../src/mod.ts';

const randomSuffix = Math.random().toString(36).substring(2, 15);

Deno.test('sqs - create/list/delete queue', async () => {
  const queueName = `test-queue-${randomSuffix}`;
  console.log('queueName', queueName);

  const result = await sqsCreateQueue(clientAWS, { queueName });
  assert(result.QueueUrl, 'queueUrl should be present');

  const result2 = await sqsListQueues(clientAWS, { queueNamePrefix: 'test' });
  assert(result2.QueueUrls.length > 0, 'QueueUrls should be present');
  assert(result2.QueueUrls.includes(result.QueueUrl), 'QueueUrl should be present');

  const result3 = await sqsGetQueueUrl(clientAWS, { queueName });
  assert(result3.QueueUrl, 'queueUrl should be present');
  assert(result3.QueueUrl === result.QueueUrl, 'queueUrl should be the same');

  const result4 = await sqsGetQueueAttributes(clientAWS, { queueUrl: result.QueueUrl });
  assert(result4.Attributes, 'attributes should be present');
  assert(Object.keys(result4.Attributes).length > 0, 'attributes should be present');

  await sqsPurgeQueue(clientAWS, { queueUrl: result.QueueUrl });

  await sqsDeleteQueue(clientAWS, { queueUrl: result.QueueUrl });
});

Deno.test('sqs - send message', async () => {
  const queueName = `test-queue2-${randomSuffix}`;
  console.log('queueName', queueName);

  const result = await sqsCreateQueue(clientAWS, { queueName });
  assert(result.QueueUrl, 'queueUrl should be present');

  const result2 = await sqsSendMessage(clientAWS, {
    queueUrl: result.QueueUrl,
    messageBody: 'Hello, world!',
    messageAttributes: { test: 'test' },
  });
  assert(result2.messageId, 'messageId should be present');
  assert(result2.md5OfMessageAttributes, 'md5OfMessageAttributes should be present');
  assert(result2.md5OfMessageBody, 'md5OfMessageBody should be present');

  // Wait for message to be received
  await sleep(1000);

  const result3 = await sqsReceiveMessage(clientAWS, {
    queueUrl: result.QueueUrl,
    maxNumberOfMessages: 1,
    messageAttributeNames: ['All'],
    messageSystemAttributeNames: ['All'],
  });
  console.log('result3', result3);
  assert(result3.length > 0, 'messages should be present');
  assert(result3[0].body, 'body should be present');
  assert(result3[0].body === 'Hello, world!', 'body should be Hello, world!');
  assert(result3[0].messageId, 'messageId should be present');
  assert(result3[0].receiptHandle, 'receiptHandle should be present');

  // Delete message
  await sqsDeleteMessage(clientAWS, { queueUrl: result.QueueUrl, receiptHandle: result3[0].receiptHandle });

  // Delete queue
  await sqsDeleteQueue(clientAWS, { queueUrl: result.QueueUrl });
});
