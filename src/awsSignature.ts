import type { AWSConfig, AWSFullRequest } from './client.ts';

const encodeRfc3986 = (str: string) =>
  encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

const hex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

const hmac = async (key: BufferSource, data: BufferSource) => {
  const skey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return await crypto.subtle.sign('HMAC', skey, data);
};

const hash = async (data: BufferSource) => hex(await crypto.subtle.digest('SHA-256', data));

const emptyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const encoder = new TextEncoder();

const singingKeyCache = new Map<string, ArrayBuffer>(); // todo: use a LRU cache

const getSigningKey = async (secretAccessKey: string, date: string, region: string, service: string) => {
  const cacheKey = `${secretAccessKey}-${date}-${region}-${service}`;
  if (singingKeyCache.has(cacheKey)) return singingKeyCache.get(cacheKey)!;
  const dateKey = await hmac(encoder.encode(`AWS4${secretAccessKey}`), encoder.encode(date));
  const dateRegionKey = await hmac(dateKey, encoder.encode(region));
  const dateRegionServiceKey = await hmac(dateRegionKey, encoder.encode(service));
  const signingKey = await hmac(dateRegionServiceKey, encoder.encode('aws4_request'));
  singingKeyCache.set(cacheKey, signingKey);
  return signingKey;
};

export async function signRequest(request: AWSFullRequest, config: AWSConfig) {
  // Set host header
  request.headers.host = request.host;

  // Determine the SHA256 of the content of the request todo: make unsigned payload configurable
  const bodyHash = request.service === 's3'
    ? 'UNSIGNED-PAYLOAD'
    : (request.body && request.body.length > 0 ? await hash(request.body) : emptyHash);
  request.headers['x-amz-content-sha256'] = bodyHash;

  // Include session token if provided
  if (config.sessionToken) {
    request.queryParameters['x-amz-security-token'] = config.sessionToken;
  }

  // Set date to current date if not provided
  const dateTime = request.headers['x-amz-date'] ?? new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
  request.headers['x-amz-date'] = dateTime;
  const date = dateTime.slice(0, 8);

  // Canonical query parameters
  const parameterEntries = Object.entries(request.queryParameters).toSorted();
  const parameterString = parameterEntries.map(
    ([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`,
  ).join('&');

  // Canonical headers (we might need to filter out some headers)
  const headerEntries = Object.entries(request.headers).toSorted();
  const headerString = headerEntries.map(([key, value]) => `${key}:${value.trim()}`).join('\n');
  const headerNames = headerEntries.map(([key]) => key).join(';');

  // Build canonical request and hash it
  const canonicalRequest =
    `${request.method}\n${request.path}\n${parameterString}\n${headerString}\n\n${headerNames}\n${bodyHash}`;
  const canonicalRequestHash = await hash(encoder.encode(canonicalRequest));

  // AWS4 signature
  const credentialString = `${date}/${config.region}/${request.service}/aws4_request`;
  const signingKey = await getSigningKey(config.secretAccessKey, date, config.region, request.service);
  const stringToSign = `AWS4-HMAC-SHA256\n${dateTime}\n${credentialString}\n${canonicalRequestHash}`;
  const signature = hex(await hmac(signingKey, encoder.encode(stringToSign)));

  // Add authorization header with AWS4 signature
  request.headers.authorization =
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialString}, SignedHeaders=${headerNames}, Signature=${signature}`;
}
