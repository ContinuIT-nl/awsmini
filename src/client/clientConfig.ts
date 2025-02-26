/**
 * @typedef {Object} ClientConfig
 * @property {string} [region] - AWS region like `us-west-1`. if not provided, defaults to environment variable `AWS_REGION` or `AWS_DEFAULT_REGION`
 * @property {string} [accessKeyId] - AWS access key ID; if not provided, defaults to environment variable `AWS_ACCESS_KEY_ID`
 * @property {string} [secretAccessKey] - AWS secret access key; if not provided, defaults to environment variable `AWS_SECRET_ACCESS_KEY`
 * @property {string} [profile] - AWS profile name; if not provided, defaults to environment variable `AWS_PROFILE` and constant `default`
 * @property {string} [sessionToken] - AWS session token; if not provided, defaults to environment variable `AWS_SESSION_TOKEN`
 * @property {string} [endpoint] - S3 endpoint; if not provided, defaults to environment variable `S3ENDPOINT`
 * @property {typeof fetch} [fetch] - alternative fetch implementation
 */
export type ClientConfig = {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  profile?: string;
  sessionToken?: string;
  endpoint?: string;
  fetch?: typeof fetch;
};
