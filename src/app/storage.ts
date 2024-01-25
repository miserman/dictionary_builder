import type {HistoryContainer, NumberObject, PasswordRequestCallback, TermTypes} from './building'

type StoredKey = {salt: Uint8Array; key: CryptoKey}
const keys: {[index: string]: StoredKey} = {}
const encoder = new TextEncoder()
const decoder = new TextDecoder()
async function getKey(name: string, password: string, salt: Uint8Array): Promise<StoredKey | undefined> {
  if (!(name in keys)) {
    const baseKey = await window.crypto.subtle.importKey('raw', encoder.encode(password), {name: 'PBKDF2'}, false, [
      'deriveBits',
      'deriveKey',
    ])
    keys[name] = {
      salt,
      key: await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 5e5,
          hash: 'SHA-256',
        },
        baseKey,
        {name: 'AES-GCM', length: 256},
        true,
        ['encrypt', 'decrypt']
      ),
    }
  }
  return keys[name]
}
async function encrypt(name: string, content: any, password?: string) {
  const key = password ? await getKey(name, password, window.crypto.getRandomValues(new Uint8Array(16))) : keys[name]
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  if (key) {
    try {
      const encrypted = await window.crypto.subtle.encrypt(
        {name: 'AES-GCM', iv},
        key.key,
        encoder.encode(JSON.stringify(content))
      )
      return iv.toString() + ',' + key.salt.toString() + ',' + new Uint8Array(encrypted).toString()
    } catch {
      console.error('failed to encrypt ' + name)
    }
  }
}
async function decrypt(name: string, content: string, password?: string) {
  const buffer = Uint8Array.from(content.split(',').map(v => +v)).buffer
  const key = password ? await getKey(name, password, new Uint8Array(buffer, 12, 16)) : keys[name]
  if (key) {
    try {
      const decrypted = await window.crypto.subtle.decrypt(
        {name: 'AES-GCM', iv: new Uint8Array(buffer, 0, 12)},
        key.key,
        new Uint8Array(buffer, 28)
      )
      return JSON.parse(decoder.decode(decrypted))
    } catch {
      console.error('failed to decrypt ' + name)
    }
  }
}

export async function removeStorage(name: string, use_db: boolean) {
  if (!use_db) {
    localStorage.removeItem(name)
  }
}
export async function setStorage(name: string, prefix: string, value: any, use_db: boolean, password?: string) {
  const content = password || name in keys ? await encrypt(name, value, password) : JSON.stringify(value)
  if (content) {
    try {
      if (!use_db) {
        localStorage.setItem(prefix + name, content)
      }
    } catch {
      console.error('failed to store ' + name)
    }
  }
}
export async function getStorage(
  name: string,
  prefix: string,
  resolve: (content: any) => void,
  use_db: boolean,
  requestPass: (name: string, resolve: PasswordRequestCallback) => void,
  fallback?: any
) {
  const raw = localStorage.getItem(prefix + name) as string
  if (raw) {
    if (raw[0] === '{') {
      resolve(JSON.parse(raw))
    } else {
      if (!(name in keys)) {
        requestPass(name, () => async (password: string) => {
          const content = await decrypt(name, raw, password)
          if (content) {
            resolve(content)
          } else {
            delete keys[name]
            throw Error
          }
        })
        return
      }
      resolve(await decrypt(name, raw))
    }
  } else if (fallback) {
    resolve(fallback)
  }
}

export type DictEntry = {added: number; type: TermTypes; categories: NumberObject; sense: string}
export type Dict = {[index: string]: DictEntry}
const dictionaries: {[index: string]: Dict} = {}
export async function loadHistory(
  dictName: string,
  setHistory: (hist: HistoryContainer) => void,
  requestPass: (name: string, resolve: PasswordRequestCallback) => void,
  use_db: boolean
) {
  if ('undefined' === typeof window) {
    setHistory({edits: [], position: -1})
  } else
    getStorage(
      dictName,
      'dict_history_',
      history => {
        if (history) setHistory(history)
      },
      use_db,
      requestPass,
      {edits: [], position: -1}
    )
}
export async function loadDictionary(
  name: string,
  setDict: (dict: Dict) => void,
  requestPass: (name: string, resolve: PasswordRequestCallback) => void,
  use_db: boolean
) {
  if (name in dictionaries) {
    setDict(dictionaries[name])
  } else {
    getStorage(
      name,
      'dict_',
      dict => {
        if (dict) {
          dictionaries[name] = dict
          setDict(dict)
        }
      },
      use_db,
      requestPass
    )
  }
}
