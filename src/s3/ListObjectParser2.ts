import { addElement, emptyXmlEvents, xmlScanner } from '@continuit/xmlscanner';
import type { S3Object, S3Owner } from './types.ts';
import { ListObjectResult } from '../mod.ts';

class ListObjectParser {
  // Events
  private readonly events = emptyXmlEvents();

  // Internal state while parsing
  private result: ListObjectResult = { content: [], prefixes: [], isTruncated: false, marker: '' };
  private activeContent: Partial<S3Object> & { owner: S3Owner } = { owner: { id: '' } };

  // Setup parser
  constructor() {
    const events = emptyXmlEvents();

    // See: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjects.html
    // See: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html

    // Contents
    const contents = addElement(events, 'ListBucketResult/Contents');
    contents.tagopen = () => this.activeContent = { owner: { id: '' } };
    contents.tagclose = () => this.result.content.push(this.activeContent as S3Object);
    addElement(contents, 'Key').text = (text: string) => this.activeContent.key = text;
    addElement(contents, 'Size').text = (text: string) => this.activeContent.size = Number(text);
    addElement(contents, 'LastModified').text = (text: string) => this.activeContent.lastModified = text;
    addElement(contents, 'ETag').text = (text: string) => this.activeContent.etag = text;
    addElement(contents, 'StorageClass').text = (text: string) => this.activeContent.storageClass = text;
    addElement(contents, 'ChecksumAlgorithm').text = (text: string) => this.activeContent.checksumAlgorithm = text;
    addElement(contents, 'ChecksumType').text = (text: string) => this.activeContent.checksumType = text;
    addElement(contents, 'Owner/ID').text = (text: string) => this.activeContent.owner.id = text;
    addElement(contents, 'Owner/DisplayName').text = (text: string) => this.activeContent.owner.displayName = text;
    // also: restoreStatus

    // common prefixes
    addElement(events, 'ListBucketResult/CommonPrefixes/Prefix').text = (text: string) =>
      this.result.prefixes.push(text);

    // continuation
    addElement(events, 'ListBucketResult/IsTruncated').text = (text: string) =>
      this.result.isTruncated = text === 'true';
    addElement(events, 'ListBucketResult/Marker').text = (text: string) => this.result.marker = text;
    this.events = events;

    this.cleanup();
  }

  cleanup() {
    this.result = { content: [], prefixes: [], isTruncated: false, marker: '' };
  }

  parse(xml: string) {
    this.cleanup();
    xmlScanner(xml, this.events);
    const result = this.result;
    this.cleanup();
    return result;
  }
}

let listObjectParser: ListObjectParser | null = null;

export function parseListObjects(xml: string) {
  if (!listObjectParser) listObjectParser = new ListObjectParser();
  return listObjectParser.parse(xml);
}
