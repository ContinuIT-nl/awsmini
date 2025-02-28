/**
 * Base error class for all Awsmini errors
 * Extends the native Error class with additional properties
 */
export class AwsminiError extends Error {
  /** HTTP status code (if applicable) */
  statusCode?: number;
  /** The AWS service that caused the error */
  service: string;

  /**
   * Creates a new AwsminiError
   *
   * @param message Error message
   * @param options Additional error options
   * @param options.statusCode HTTP status code (if applicable)
   * @param options.cause The original error that caused this error
   * @param options.context Additional context or metadata
   */
  constructor(message: string, service: string, options?: { statusCode?: number; cause?: Error }) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options?.statusCode;
    this.cause = options?.cause;
    this.service = service;
  }
}
