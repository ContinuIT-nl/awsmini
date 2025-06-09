import { addElement, emptyXmlEvents, xmlScanner } from '@continuit/xmlscanner';
import type { S3DeletedObject, S3DeleteError, S3DeleteObjectsResult } from './types.ts';

class DeleteObjectsParser {
  // Events
  private readonly events = emptyXmlEvents();

  // Internal state while parsing
  private result: S3DeleteObjectsResult = { deleted: [], errors: [] };
  private activeDeleted: Partial<S3DeletedObject> = {};
  private activeError: Partial<S3DeleteError> = {};

  // Setup parser
  constructor() {
    const events = emptyXmlEvents();

    // See: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjects.html

    // Contents
    const deleted = addElement(events, 'DeleteResult/Deleted');
    deleted.tagopen = () => this.activeDeleted = {};
    deleted.tagclose = () => this.result.deleted.push(this.activeDeleted as S3DeletedObject);
    addElement(deleted, 'Key').text = (text: string) => this.activeDeleted.key = text;
    addElement(deleted, 'VersionId').text = (text: string) => this.activeDeleted.versionId = text;
    addElement(deleted, 'DeleteMarker').text = (text: string) => this.activeDeleted.deleteMarker = text === 'true';
    addElement(deleted, 'DeleteMarkerVersionId').text = (text: string) =>
      this.activeDeleted.deleteMarkerVersionId = text;

    // Errors
    const errors = addElement(events, 'DeleteResult/Error');
    errors.tagopen = () => this.activeError = {};
    errors.tagclose = () => this.result.errors.push(this.activeError as S3DeleteError);
    addElement(errors, 'Key').text = (text: string) => this.activeError.key = text;
    addElement(errors, 'VersionId').text = (text: string) => this.activeError.versionId = text;
    addElement(errors, 'Code').text = (text: string) => this.activeError.code = text;
    addElement(errors, 'Message').text = (text: string) => this.activeError.message = text;
    this.events = events;

    this.cleanup();
  }

  cleanup() {
    this.result = { deleted: [], errors: [] };
  }

  parse(xml: string) {
    this.cleanup();
    xmlScanner(xml, this.events);
    const result = this.result;
    this.cleanup();
    return result;
  }
}

let deleteObjectsParser: DeleteObjectsParser | null = null;

export function parseDeleteObjects(xml: string): S3DeleteObjectsResult {
  if (!deleteObjectsParser) deleteObjectsParser = new DeleteObjectsParser();
  return deleteObjectsParser.parse(xml);
}
