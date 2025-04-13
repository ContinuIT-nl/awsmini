import { assert, assertEquals } from '@std/assert';
import { clientAWS, sleep } from './testUtilities.ts';
import {
  sqsCreateQueue,
  sqsDeleteMessage,
  sqsDeleteMessageBatch,
  sqsDeleteQueue,
  sqsGetQueueAttributes,
  sqsGetQueueUrl,
  sqsListQueues,
  sqsPurgeQueue,
  sqsReceiveMessage,
  sqsSendMessage,
  sqsSendMessageBatch,
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

Deno.test('sqs - send message batch', async () => {
  const queueName = `test-queue3-${randomSuffix}`;
  console.log('queueName', queueName);

  const result = await sqsCreateQueue(clientAWS, { queueName });
  assert(result.QueueUrl, 'queueUrl should be present');

  const result2 = await sqsSendMessageBatch(clientAWS, {
    queueUrl: result.QueueUrl,
    entries: [
      {
        id: '1',
        messageBody: 'Hello, world!',
        messageAttributes: { test: 'test', test2: 2, test3: new Uint8Array(1) },
      },
      {
        id: '2',
        messageBody: 'Hello, again!',
        messageAttributes: { test: 'test' },
      },
    ],
  });
  assert((result2.Failed?.length ?? 0) === 0, JSON.stringify(result2.Failed, null, 2));
  assert((result2.Successful?.length ?? 0) === 2, 'Successful should be 2');

  // Wait for message to be received
  await sleep(1000);

  const result3 = await sqsReceiveMessage(clientAWS, {
    queueUrl: result.QueueUrl,
    maxNumberOfMessages: 2,
    messageAttributeNames: ['All'],
    messageSystemAttributeNames: ['All'],
  });
  console.log('result3', result3);
  assert(result3.length === 2, 'messages should be present');
  assert(result3[0].body, 'body should be present');
  assert(result3[0].body === 'Hello, world!', 'body should be Hello, world!');
  assert(result3[1].body, 'body should be present');
  assert(result3[1].body === 'Hello, again!', 'body should be Hello, again!');
  assertEquals(result3[0].messageId, result2.Successful?.[0]?.MessageId, 'messageId should be present');
  assert(result3[0].receiptHandle, 'receiptHandle should be present');
  assertEquals(result3[1].messageId, result2.Successful?.[1]?.MessageId, 'messageId should be present');
  assert(result3[1].receiptHandle, 'receiptHandle should be present');

  // Delete message
  const result4 = await sqsDeleteMessageBatch(clientAWS, {
    queueUrl: result.QueueUrl,
    entries: result3.map((e, i) => ({ id: `id-${i}`, receiptHandle: e.receiptHandle })),
  });
  assertEquals(result4.successful?.length ?? 0, 2, 'successful should be 2');
  assertEquals(result4.failed?.length ?? 0, 0, 'failed should be 0');

  // Delete queue
  await sqsDeleteQueue(clientAWS, { queueUrl: result.QueueUrl });
});
