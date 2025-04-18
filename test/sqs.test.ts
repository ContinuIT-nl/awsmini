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
  type SqsReceiveMessage,
  sqsReceiveMessage,
  sqsSendMessage,
  sqsSendMessageBatch,
  type SqsSendMessageBatchRequestEntry,
} from '../src/mod.ts';
import { tryCatchAsync } from '../src/misc/utilities.ts';

const randomSuffix = Math.random().toString(36).substring(2, 15);

Deno.test('sqs - sqsListQueues', async () => {
  const [err, result] = await tryCatchAsync(sqsListQueues(clientAWS, { queueNamePrefix: 'test-queue' }));
  if (err) {
    assert(err.message.includes('The specified queue does not exist.'));
  } else {
    assert(result, 'result should be present');
    if (result.QueueUrls) {
      for (const queueUrl of result.QueueUrls) {
        console.log('>>> deleting queue', queueUrl);
        await sqsDeleteQueue(clientAWS, { queueUrl });
        await sleep(1000);
      }
    }
  }
});

Deno.test('sqs - create/list/delete queue', async () => {
  const queueName = `test-queue-${randomSuffix}`;
  console.log('queueName', queueName);

  const result = await sqsCreateQueue(clientAWS, { queueName });
  assert(result.QueueUrl, 'queueUrl should be present');

  const result3 = await sqsGetQueueUrl(clientAWS, { queueName });
  assert(result3.QueueUrl, 'queueUrl should be present');
  assert(result3.QueueUrl === result.QueueUrl, 'queueUrl should be the same');

  const result4 = await sqsGetQueueAttributes(clientAWS, { queueUrl: result.QueueUrl });
  assert(result4.Attributes, 'attributes should be present');
  assert(Object.keys(result4.Attributes).length > 0, 'attributes should be present');

  await sqsPurgeQueue(clientAWS, { queueUrl: result.QueueUrl });

  await sleep(1000);

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

  const entries: SqsSendMessageBatchRequestEntry[] = [
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
    {
      id: '3',
      messageBody: 'No attributes!',
    },
  ];

  const result2 = await sqsSendMessageBatch(clientAWS, {
    queueUrl: result.QueueUrl,
    entries,
  });
  assert((result2.Failed?.length ?? 0) === 0, JSON.stringify(result2.Failed, null, 2));
  assert((result2.Successful?.length ?? 0) === 3, 'Successful should be 3');

  // Wait for message to be received

  const messages: SqsReceiveMessage[] = [];

  while (messages.length < 3) {
    const result3 = await sqsReceiveMessage(clientAWS, {
      queueUrl: result.QueueUrl,
      maxNumberOfMessages: 3 - messages.length,
      messageAttributeNames: ['All'],
      messageSystemAttributeNames: ['All'],
    });
    if (result3.length > 0) {
      messages.push(...result3);
    } else {
      await sleep(1000);
      console.log('waiting for messages');
    }
  }

  assert(messages.length === 3, `3 messages should be present but found ${messages.length}`);
  for (const message of result2?.Successful ?? []) {
    const recvMessage = messages.find((m) => m.messageId === message.MessageId);
    assert(recvMessage, `message ${message.MessageId} should be present`);
    assertEquals(
      recvMessage.body,
      entries.find((e) => e.id === message.Id)?.messageBody,
      `body should be ${entries.find((e) => e.id === message.Id)?.messageBody}`,
    );
  }

  // Delete message
  const result4 = await sqsDeleteMessageBatch(clientAWS, {
    queueUrl: result.QueueUrl,
    entries: messages.map((e, i) => ({ id: `id-${i}`, receiptHandle: e.receiptHandle })),
  });
  assertEquals(result4.successful?.length ?? 0, 3, 'successful should be 3');
  assertEquals(result4.failed?.length ?? 0, 0, 'failed should be 0');

  // Delete queue
  await sqsDeleteQueue(clientAWS, { queueUrl: result.QueueUrl });
});
