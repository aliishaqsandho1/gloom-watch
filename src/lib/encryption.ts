// End-to-end encryption utilities for chat messages
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// Generate a new encryption key for a user
export const generateEncryptionKey = async (): Promise<string> => {
  const key = await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
  
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
};

// Import key from base64 string
const importKey = async (keyString: string): Promise<CryptoKey> => {
  const keyBuffer = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt a message
export const encryptMessage = async (message: string, keyString: string): Promise<string> => {
  const key = await importKey(keyString);
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Generate a random IV for each message
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    data
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
};

// Decrypt a message
export const decryptMessage = async (encryptedMessage: string, keyString: string): Promise<string> => {
  try {
    const key = await importKey(keyString);
    const combined = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Encrypted Message - Unable to Decrypt]';
  }
};

// Get or generate user encryption key
export const getUserEncryptionKey = async (userId: string): Promise<string> => {
  const storageKey = `encryption_key_${userId}`;
  let key = localStorage.getItem(storageKey);
  
  if (!key) {
    key = await generateEncryptionKey();
    localStorage.setItem(storageKey, key);
  }
  
  return key;
};