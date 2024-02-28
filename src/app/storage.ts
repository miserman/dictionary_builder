import type {HistoryContainer, NumberObject, PasswordRequestCallback, TermTypes} from './building'
import {CoarseSenseMap} from './resources'

// compression
async function compress(content: any) {
  const streamReader = new Blob([JSON.stringify(content)])
    .stream()
    .pipeThrough(new CompressionStream('gzip'))
    .getReader()
  const chunks = []
  while (true) {
    const {done, value} = await streamReader.read()
    if (done) break
    chunks.push(value)
  }
  return new Blob(chunks)
}
export async function decompress(blob: Blob) {
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'))
  const json = await new Response(stream).json()
  return json
}

// encryption
type StoredKey = {salt: Uint8Array; key: CryptoKey}
const keys: {[index: string]: StoredKey} = {}
const encoder = new TextEncoder()
async function getKey(name: string, password: string, salt: Uint8Array): Promise<StoredKey | undefined> {
  if (!(name in keys)) {
    const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), {name: 'PBKDF2'}, false, [
      'deriveKey',
    ])
    keys[name] = {
      salt,
      key: await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 1e6,
          hash: 'SHA-256',
        },
        baseKey,
        {name: 'AES-GCM', length: 256},
        false,
        ['encrypt', 'decrypt']
      ),
    }
  }
  return keys[name]
}
async function encrypt(name: string, content: any, password?: string) {
  const key = password ? await getKey(name, password, crypto.getRandomValues(new Uint8Array(16))) : keys[name]
  if (key) {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encrypted = await crypto.subtle.encrypt(
        {name: 'AES-GCM', iv},
        key.key,
        new Uint8Array(await (await compress(content)).arrayBuffer())
      )
      return new Blob([iv, key.salt, encrypted])
    } catch {
      console.error('failed to encrypt ' + name)
    }
  }
}
function parseStoredString(raw: string): Promise<Blob> {
  return new Promise(async resolve => {
    resolve(await fetch('data:application/octet-stream;base64,' + raw.substring(1)).then(res => res.blob()))
  })
}
async function decrypt(name: string, content: string | Blob, password?: string) {
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
    } catch {}
  }
}

// indexedDB
type storedItem = {name: string; encrypted?: boolean; content: Blob}
type DBName = 'resources' | 'building' | 'coarse_sense_map'
const DBVersions = {resources: 3, building: 1, coarse_sense_map: 1}
function openDB(name: DBName): Promise<IDBDatabase | undefined> {
  return new Promise(resolve => {
    const req = indexedDB.open('dictionary_builder_' + name, DBVersions[name])
    req.onupgradeneeded = () => {
      const db = req.result
      if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name)
      db.createObjectStore(name, {keyPath: 'name'})
    }
    req.onsuccess = () => {
      resolve(req.result)
    }
  })
}
const IDB = {
  setItem: async function (item: storedItem, database: DBName): Promise<boolean> {
    const db = await openDB(database)
    return new Promise(resolve => {
      if (db) {
        const req = db.transaction([database], 'readwrite', {durability: 'relaxed'}).objectStore(database).put(item)
        req.onerror = e => {
          throw Error('failed to store item ' + item.name)
        }
        req.onsuccess = () => resolve(true)
      } else {
        throw Error
      }
    })
  },
  getItem: async function (name: string, database: DBName): Promise<storedItem | null> {
    const db = await openDB(database)
    return new Promise(resolve => {
      if (db) {
        const req = db.transaction([database], 'readonly', {durability: 'relaxed'}).objectStore(database).get(name)
        req.onerror = () => resolve(null)
        req.onsuccess = () => {
          resolve(req.result)
        }
      } else {
        resolve(null)
      }
    })
  },
  removeItem: async function (name: string, database: DBName): Promise<boolean> {
    const db = await openDB(database)
    return new Promise(resolve => {
      if (db) {
        const req = db.transaction([database], 'readwrite', {durability: 'relaxed'}).objectStore(database).delete(name)
        req.onerror = () => resolve(false)
        req.onsuccess = () => resolve(true)
      } else {
        resolve(false)
      }
    })
  },
}

// interface
export async function loadResource(name: string) {
  const resource = await IDB.getItem(name, 'resources')
  return resource
}
export async function saveResource(name: string, content: any) {
  IDB.setItem({name, encrypted: false, content: await compress(content)}, 'resources')
}
export async function removeStorage(name: string, prefix: string) {
  delete keys[name]
  IDB.removeItem(prefix + name, name === 'coarse_sense_map' ? name : 'building')
  localStorage.removeItem(prefix + name)
}
function writeBlob(blob: Blob, encrypted: boolean): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onloadend = async () => {
      resolve((encrypted ? 'e' : 'c') + (reader.result as string).split(';base64,')[1])
    }
  })
}
export async function setStorage(name: string, prefix: string, value: any, use_db: boolean, password?: string) {
  const encrypted = !!password || name in keys
  const content = await (encrypted ? encrypt(name, value, password) : compress(value))
  if (content) {
    try {
      if (use_db) {
        IDB.setItem({name: prefix + name, encrypted, content}, name === 'coarse_sense_map' ? name : 'building')
      } else {
        localStorage.setItem(prefix + name, await writeBlob(content, encrypted))
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
  fallback: any
) {
  const key = prefix + name
  const dbName = key === 'coarse_sense_map' ? key : 'building'
  let raw = use_db ? await IDB.getItem(key, key === 'coarse_sense_map' ? key : dbName) : localStorage.getItem(key)
  if (!raw) raw = use_db ? localStorage.getItem(key) : await IDB.getItem(key, dbName)
  if (raw) {
    if ('string' === typeof raw && (raw[0] === '{' || raw[0] === 'c')) {
      resolve(raw[0] === '{' ? JSON.parse(raw) : await decompress(await parseStoredString(raw)))
    } else if ('string' === typeof raw || raw.encrypted) {
      const encrypted = 'string' === typeof raw ? raw : raw.content
      if (name in keys) {
        resolve(await decrypt(name, encrypted))
      } else {
        requestPass(name, () => async (password: string) => {
          const content = await decrypt(name, encrypted, password)
          if (content) {
            resolve(content)
          } else {
            delete keys[name]
            throw Error
          }
        })
      }
    } else {
      resolve(await decompress(raw.content))
    }
  } else {
    resolve(fallback)
  }
}

export type DictEntry = {term?: string; added: number; type: TermTypes; categories: NumberObject; sense: string}
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
export function deleteDictionary(name: string) {
  delete dictionaries[name]
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
      requestPass,
      {}
    )
  }
}
export async function loadSenseMap(
  setSenseMap: (map: CoarseSenseMap) => void,
  requestPass: (name: string, resolve: PasswordRequestCallback) => void
) {
  getStorage('coarse_sense_map', '', map => (map ? setSenseMap(map) : undefined), true, requestPass, {})
}
