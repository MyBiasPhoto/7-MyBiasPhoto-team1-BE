import { randomBytes, randomUUID } from 'crypto';

export function generateOpaqueToken(bytes = 48) {
  return randomBytes(bytes).toString('base64url');
}

export function generateOpaqueId() {
  return 'opaque_' + randomUUID();
}
