import { addElement, emptyXmlEvents, type XmlEvents, xmlScanner } from '@continuit/xmlscanner';
import type { S3Bucket, S3BucketListResult } from './types.ts';

export class ListBucketsParser {
  // Events
  private readonly events: XmlEvents;

  // Internal state while parsing
  private result: S3BucketListResult = { buckets: [], owner: { id: '' } };
  private activeBucket: Partial<S3Bucket> | null = null;

  // Setup parser
  constructor() {
    const events = emptyXmlEvents();

    // See https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html

    // Buckets
    const bucket = addElement(events, 'ListAllMyBucketsResult/Buckets/Bucket');
    bucket.tagopen = () => this.activeBucket = {};
    bucket.tagclose = () => {
      this.result.buckets.push(this.activeBucket as S3Bucket); // todo: validate
      this.activeBucket = null;
    };
    addElement(bucket, 'Name').text = (text: string) => this.activeBucket!.name = text;
    addElement(bucket, 'CreationDate').text = (text: string) => this.activeBucket!.creationDate = text;
    addElement(bucket, 'Region').text = (text: string) => this.activeBucket!.region = text;

    // Owner
    const owner = addElement(events, 'ListAllMyBucketsResult/Owner');
    addElement(owner, 'DisplayName').text = (text: string) => this.result.owner.displayName = text;
    addElement(owner, 'ID').text = (text: string) => this.result.owner.id = text;

    // Other
    addElement(events, 'ListAllMyBucketsResult/ContinuationToken').text = (text: string) =>
      this.result.continuationToken = text;
    addElement(events, 'ListAllMyBucketsResult/Prefix').text = (text: string) => this.result.prefix = text;

    // full parser definition
    this.events = events;
  }

  cleanup() {
    this.result = { buckets: [], owner: { id: '' } };
  }

  parse(xml: string) {
    this.cleanup();
    xmlScanner(xml, this.events);
    const result = this.result;
    this.cleanup();
    return result;
  }
}

let listBucketsParser: ListBucketsParser | null = null;

export function parseListBuckets(xml: string) {
  if (!listBucketsParser) listBucketsParser = new ListBucketsParser();
  return listBucketsParser.parse(xml);
}
