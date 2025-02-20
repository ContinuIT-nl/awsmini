export type ClientConfig = Partial<{
  /// AWS region like `us-west-1`. if not provided, defaults to environment variable `AWS_REGION` or `AWS_DEFAULT_REGION`
  region: string;
  /// AWS access key ID; if not provided, defaults to environment variable `AWS_ACCESS_KEY_ID`
  accessKeyId: string;
  /// AWS secret access key; if not provided, defaults to environment variable `AWS_SECRET_ACCESS_KEY`
  secretAccessKey: string;
  /// AWS profile name; if not provided, defaults to environment variable `AWS_PROFILE` and constant `default`
  profile: string;
  /// AWS session token; if not provided, defaults to environment variable `AWS_SESSION_TOKEN`
  sessionToken: string;
  /// S3 endpoint; if not provided, defaults to environment variable `S3ENDPOINT`
  endpoint: string;
  /// alternative fetch implementation
  fetch: typeof fetch;
}>;
