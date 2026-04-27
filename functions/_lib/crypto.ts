const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

const randomHex = (bytes = 16) => {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const hashPassword = async (password: string, salt: string) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );

  return toHex(bits);
};

export const createPassword = async (password: string) => {
  const salt = randomHex(16);
  const passwordHash = await hashPassword(password, salt);
  return { salt, passwordHash };
};

export const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
};

export const generateSessionId = (secret: string) => `${randomHex(24)}${secret.slice(0, 8)}`;
