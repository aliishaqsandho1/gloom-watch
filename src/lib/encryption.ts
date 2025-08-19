// Encryption utilities with custom mapping encoder (as requested) and AES-GCM fallback

// ---- AES (fallback for old messages) ----
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

export const generateEncryptionKey = async (): Promise<string> => {
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
};

const importKey = async (keyString: string): Promise<CryptoKey> => {
  const keyBuffer = Uint8Array.from(atob(keyString), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey('raw', keyBuffer, { name: ALGORITHM }, false, ['encrypt', 'decrypt']);
};

export const encryptMessageAES = async (message: string, keyString: string): Promise<string> => {
  const key = await importKey(keyString);
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, data);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
};

export const decryptMessageAES = async (encryptedMessage: string, keyString: string): Promise<string> => {
  try {
    const key = await importKey(keyString);
    const combined = Uint8Array.from(atob(encryptedMessage), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, encrypted);
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch {
    throw new Error('AES decrypt failed');
  }
};

export const getUserEncryptionKey = async (userId: string): Promise<string> => {
  const storageKey = `encryption_key_${userId}`;
  let key = localStorage.getItem(storageKey);
  if (!key) {
    key = await generateEncryptionKey();
    localStorage.setItem(storageKey, key);
  }
  return key;
};

// ---- Custom mapping codec (primary) ----
const alphabetToComplexValue: Record<string, string> = {
  "A": "X9@3!vBnqQ", "B": "y$7Pf3#ZMx", "C": "4%TgHs2!uP", "D": "Jv6w*R9$bQ", "E": "pL3&7W!zRx",
  "F": "M!2b6X%aTr", "G": "tW9*8!oPyQ", "H": "g#3u!kY9wH", "I": "dL5&X1!zQv", "J": "R8!bq$2NvM",
  "K": "3!Yc7t*JpP", "L": "v*9WgH!4Xr", "M": "7!$3PbqFyZ", "N": "pX2!L6gRbH", "O": "8*V!wY3zJr",
  "P": "k2Q!L6w*Mv", "Q": "o*P9!t7X3J", "R": "d7!L6kH9$P", "S": "R3!8V*z4wQ", "T": "g5X!o3&9Lb",
  "U": "H!p4q7$Y8v", "V": "2o!M8Vg3wQ", "W": "zR3!*7L9Xk", "X": "pQ*2L7!Yv8", "Y": "g4Xo!8&3rT",
  "Z": "7wR!$3Lk9H", "a": "x9P!3v4$Jy", "b": "5#PqR!8zL2", "c": "kX6!7o3*Hv", "d": "3g4!8LbW9Q",
  "e": "v7!2R6*qLp", "f": "tX!5g9$2wJ", "g": "Y3p!*7L9Hv", "h": "4o!R5k3&8X", "i": "L9!zX7g4oH",
  "j": "3$6!LkP9wQ", "k": "v2!*R7L3oX", "l": "8t!3Pq$7Y4", "m": "L*9o3!2V7X", "n": "5!$g7R3L9v",
  "o": "3X9!*2k4Hv", "p": "w7!L4g3&8X", "q": "P5o!*R9L3X", "r": "7v2!*o3L9Q", "s": "L4$9g!7P3H",
  "t": "8!R3X2L5oQ", "u": "o3!*7g4L9X", "v": "P7!L2k$9g3", "w": "4R3!7L8X$o", "x": "t2!9Pq3L7X",
  "y": "X9g!$3oL7P", "z": "3L7!2o9*Xg", " ": "L9!*3g2o7X", "!": "g4$7o3!L9X", "@": "P3!7L2q8$R",
  "#": "7L9!*4o3Xg", "$": "2q$7!3L8oX", "%": "R3*9L7!o4P", "^": "4!L9$7o3gX", "&": "g3!*7L2o9X",
  "*": "P7!$3L4o9X", "(": "9L4*3!o7gX", ")": "L3!2o7$9Xg", "\n": "L9!*o3g4X7",
  "0": "X9!3L7o$2g", "1": "L4$3g!7oX9", "2": "3o7!*9L2Xg", "3": "gX9!4o7$L3",
  "4": "7L3!9g2o$X", "5": "Xo3!2L7$g9", "6": "3L7!4o9X$g", "7": "L3!7X2$g9o",
  "8": "9o3!*7L4gX", "9": "7L3!9gX2$o"
};

const complexValueToAlphabet: Record<string, string> = Object.entries(alphabetToComplexValue)
  .reduce((acc, [k, v]) => { acc[v] = k; return acc; }, {} as Record<string, string>);

const SEGMENT_LENGTH = alphabetToComplexValue['A'].length;

const encodeMap = (input: string): string => {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    out += alphabetToComplexValue[ch] ?? ch; // leave unknowns as-is
  }
  return out;
};

const decodeMap = (input: string): string | null => {
  if (input.length % SEGMENT_LENGTH !== 0) return null;
  let decoded = '';
  for (let i = 0; i + SEGMENT_LENGTH <= input.length; i += SEGMENT_LENGTH) {
    const seg = input.substring(i, i + SEGMENT_LENGTH);
    const ch = complexValueToAlphabet[seg];
    if (!ch) return null; // not a valid mapping payload
    decoded += ch;
  }
  return decoded;
};

const isProbablyBase64Ciphertext = (s: string) => /^[A-Za-z0-9+/=]+$/.test(s) && s.length > 24;

// Primary API used by the app
export const encryptMessage = async (message: string, _keyString: string): Promise<string> => {
  // Use mapping encoder for new messages (no shared key required)
  return encodeMap(message);
};

export const decryptMessage = async (payload: string, keyString: string): Promise<string> => {
  // 1) Try mapping decode
  const mapped = decodeMap(payload);
  if (mapped !== null) return mapped;

  // 2) Try AES (for older messages created before this change)
  if (isProbablyBase64Ciphertext(payload)) {
    try {
      return await decryptMessageAES(payload, keyString);
    } catch {
      // fall through
    }
  }

  // 3) Return as-is (likely already plaintext)
  return payload;
};
