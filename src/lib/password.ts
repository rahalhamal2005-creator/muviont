function hexToUint8Array(hex: string): Uint8Array {
  const match = hex.match(/.{1,2}/g);
  return new Uint8Array(match ? match.map(byte => parseInt(byte, 16)) : []);
}

function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function pbkdf2Hex(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 1000,
      hash: "SHA-512"
    },
    keyMaterial,
    512
  );
  return uint8ArrayToHex(new Uint8Array(derivedBits));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const hashHex = await pbkdf2Hex(password, salt);
  const saltHex = uint8ArrayToHex(salt);
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedValue: string): Promise<boolean> {
  const [saltHex, originalHash] = storedValue.split(":");
  if (!saltHex || !originalHash) return false;
  const salt = hexToUint8Array(saltHex);
  const hashHex = await pbkdf2Hex(password, salt);
  return hashHex === originalHash;
}
