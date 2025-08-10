import {compress, decompress} from './compression'

type StoredKey = {salt: Uint8Array<ArrayBuffer>; key: CryptoKey}
export const keys: {[index: string]: StoredKey} = {}
const encoder = new TextEncoder()
async function getKey(name: string, password: string, salt: Uint8Array<ArrayBuffer>): Promise<StoredKey | undefined> {
  if (!(name in keys)) {
    const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), {name: 'PBKDF2'}, false, [
      'deriveKey',
    ])
    keys[name] = {
      salt,
      key: await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          hash: 'SHA-256',
          salt,
          iterations: 1e6,
        } as Pbkdf2Params,
        baseKey,
        {name: 'AES-GCM', length: 256},
        false,
        ['encrypt', 'decrypt']
      ),
    }
  }
  return keys[name]
}
export async function encrypt(name: string, content: object, password?: string) {
  const key =
    password && !(name in keys) ? await getKey(name, password, crypto.getRandomValues(new Uint8Array(16))) : keys[name]
  if (key) {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encrypted = await crypto.subtle.encrypt(
        {name: 'AES-GCM', iv},
        key.key,
        new Uint8Array(await (await compress(content)).arrayBuffer())
      )
      return new Blob([iv, key.salt, encrypted])
    } catch (e) {
      console.error('failed to encrypt ' + name + ': ' + e)
    }
  }
}
export function parseStoredString(raw: string): Promise<Blob> {
  return new Promise(async resolve => {
    resolve(await fetch('data:application/octet-stream;base64,' + raw.substring(1)).then(res => res.blob()))
  })
}
export async function decrypt(name: string, content: string | Blob, password?: string) {
  const buffer = await ('string' === typeof content
    ? (await parseStoredString(content)).arrayBuffer()
    : content.arrayBuffer())
  const key = password ? await getKey(name, password, new Uint8Array(buffer, 12, 16)) : keys[name]
  if (key) {
    try {
      const decrypted = await crypto.subtle.decrypt(
        {name: 'AES-GCM', iv: new Uint8Array(buffer, 0, 12)},
        key.key,
        new Uint8Array(buffer, 28)
      )
      return decompress(new Blob([decrypted]))
    } catch (e) {
      console.error('failed to decrypt ' + name + ': ' + e)
    }
  }
}
