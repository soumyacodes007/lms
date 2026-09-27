export type NcctOfflineSnapshot<T> = {
  savedAt: string;
  value: T;
};

type StoredSnapshot = {
  cacheKey: string;
  cryptoKey: CryptoKey;
  iv: Uint8Array<ArrayBuffer>;
  ciphertext: ArrayBuffer;
  savedAt: string;
};

const DATABASE_NAME = 'ncct-lms-offline';
const STORE_NAME = 'snapshots';
const DATABASE_VERSION = 1;

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Offline cache request failed'));
  });
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Offline cache database could not open'));
  });
}

export async function saveNcctOfflineSnapshot<T>(cacheKey: string, value: T) {
  const database = await openDatabase();
  try {
    const cryptoKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      new TextEncoder().encode(JSON.stringify(value))
    );
    const record: StoredSnapshot = { cacheKey, cryptoKey, iv, ciphertext, savedAt: new Date().toISOString() };
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    await requestResult(transaction.objectStore(STORE_NAME).put(record));
    return { savedAt: record.savedAt };
  } finally {
    database.close();
  }
}

export async function readNcctOfflineSnapshot<T>(cacheKey: string): Promise<NcctOfflineSnapshot<T> | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const record = await requestResult(
      transaction.objectStore(STORE_NAME).get(cacheKey) as IDBRequest<StoredSnapshot | undefined>
    );
    if (!record) return null;
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: record.iv },
      record.cryptoKey,
      record.ciphertext
    );
    return { savedAt: record.savedAt, value: JSON.parse(new TextDecoder().decode(plaintext)) as T };
  } finally {
    database.close();
  }
}

export async function clearNcctOfflineSnapshot(cacheKey: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    await requestResult(transaction.objectStore(STORE_NAME).delete(cacheKey));
  } finally {
    database.close();
  }
}
