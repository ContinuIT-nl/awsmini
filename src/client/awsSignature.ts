import type { AWSConfig, AWSFullRequest } from '../misc/awsTypes.ts';
import { bufferToHex, emptyHashSha256, encodeRfc3986, hashSha256, hmacSha256 } from '../misc/utilities.ts';

const encoder = new TextEncoder();

const signingKeyCache = new Map<string, ArrayBuffer>(); // todo: use a LRU cache

const getSigningKey = async (secretAccessKey: string, date: string, region: string, service: string) => {
  const cacheKey = `${secretAccessKey}-${date}-${region}-${service}`;
  if (signingKeyCache.has(cacheKey)) return signingKeyCache.get(cacheKey)!;
  const dateKey = await hmacSha256(encoder.encode(`AWS4${secretAccessKey}`), encoder.encode(date));
  const dateRegionKey = await hmacSha256(dateKey, encoder.encode(region));
  const dateRegionServiceKey = await hmacSha256(dateRegionKey, encoder.encode(service));
  const signingKey = await hmacSha256(dateRegionServiceKey, encoder.encode('aws4_request'));
  signingKeyCache.set(cacheKey, signingKey);
  return signingKey;
};

export async function signRequest(request: AWSFullRequest, config: AWSConfig) {
  // Set host header
  request.headers.host = request.host;

  // Determine the SHA256 of the content of the request
  const hasBody = request.body && request.body.length > 0;
  if (!request.headers['x-amz-content-sha256']) {
    const sha256 = hasBody ? await hashSha256(request.body!) : emptyHashSha256;
    request.headers['x-amz-content-sha256'] = sha256;
  }
  const bodyHash = request.headers['x-amz-content-sha256'];
  if (hasBody && !request.headers['content-length']) {
    request.headers['content-length'] = request.body!.length.toString();
  }

  // Include session token if provided
  if (config.sessionToken) {
    request.headers['x-amz-security-token'] = config.sessionToken;
  }

  // Set date to current date if not provided
  const dateTime = request.headers['x-amz-date'] ?? new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
  request.headers['x-amz-date'] = dateTime;
  const date = dateTime.slice(0, 8);

  // Canonical query parameters
  const parameterEntries = Object.entries(request.queryParameters).sort();
  const parameterString = parameterEntries.map(
    ([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`,
  ).join('&');

  // Canonical headers (we might need to filter out some headers)
  const headerEntries = Object.entries(request.headers).sort((a, b) => a[0] < b[0] ? -1 : 1);
  const headerString = headerEntries.map(([key, value]) => `${key}:${value.trim()}`).join('\n');
  const headerNames = headerEntries.map(([key]) => key).join(';');

  // Build canonical request and hash it
  const canonicalRequest =
    `${request.method}\n${request.path}\n${parameterString}\n${headerString}\n\n${headerNames}\n${bodyHash}`;
  const canonicalRequestHash = await hashSha256(encoder.encode(canonicalRequest));

  // AWS4 signature
  const credentialString = `${date}/${config.region}/${request.service}/aws4_request`;
  const signingKey = await getSigningKey(config.secretAccessKey, date, config.region, request.service);
  const stringToSign = `AWS4-HMAC-SHA256\n${dateTime}\n${credentialString}\n${canonicalRequestHash}`;
  const signature = bufferToHex(await hmacSha256(signingKey, encoder.encode(stringToSign)));

  // Add authorization header with AWS4 signature
  request.headers.authorization =
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialString}, SignedHeaders=${headerNames}, Signature=${signature}`;
}
