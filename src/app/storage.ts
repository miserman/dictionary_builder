import type {HistoryContainer, NumberObject, PasswordRequestCallback, TermTypes} from './building'
import {IDB} from './lib/IDB'
import {compress, decompress} from './lib/compression'
import {decrypt, encrypt, keys, parseStoredString} from './lib/encryption'
import type {SenseMapSetterFun} from './resources'

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
type getStorageArgs = [
  string,
  string,
  (content: any) => void,
  boolean,
  (name: string, resolve: PasswordRequestCallback) => void,
  any
]
const requestQueue: Map<string, getStorageArgs> = new Map()
const requestManager = {running: ''}
export async function getStorage(
  name: string,
  prefix: string,
  resolve: (content: any) => void,
  use_db: boolean,
  requestPass: (name: string, resolve: PasswordRequestCallback) => void,
  fallback: any
) {
  const key = prefix + name
  if (!requestQueue.has(key)) {
    requestQueue.set(key, [...arguments] as getStorageArgs)
    const complete = (content?: any) => {
      requestQueue.delete(key)
      resolve(content)
      const nextRequest = requestQueue.keys().next()
      if (nextRequest.value) {
        requestManager.running = nextRequest.value
        const args = requestQueue.get(nextRequest.value)
        if (args) {
          requestQueue.delete(nextRequest.value)
          getStorage.apply(void 0, args)
        }
      }
    }
    if (requestQueue.size === 1) requestManager.running = key
    if (key === requestManager.running) {
      const dbName = name === 'coarse_sense_map' ? name : 'building'
      let raw = use_db ? await IDB.getItem(key, key === 'coarse_sense_map' ? key : dbName) : localStorage.getItem(key)
      if (!raw) raw = use_db ? localStorage.getItem(key) : await IDB.getItem(key, dbName)
      if (raw) {
        if ('string' === typeof raw && (raw[0] === '{' || raw[0] === 'c')) {
          complete(raw[0] === '{' ? JSON.parse(raw) : await decompress(await parseStoredString(raw)))
        } else if ('string' === typeof raw || raw.encrypted) {
          const encrypted = 'string' === typeof raw ? raw : raw.content
          if (name in keys) {
            complete(await decrypt(name, encrypted))
          } else {
            requestPass(name, () => async (password: string) => {
              if (password) {
                const content = await decrypt(name, encrypted, password)
                if (content) {
                  complete(content)
                } else {
                  requestQueue.delete(key)
                  delete keys[name]
                  throw Error
                }
              } else {
                complete()
              }
            })
          }
        } else {
          complete(await decompress(raw.content))
        }
      } else {
        complete(fallback)
      }
    }
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
export function saveDictionary(name: string, dict: Dict, use_db: boolean, password?: string) {
  dictionaries[name] = dict
  setStorage(name, 'dict_', dict, use_db, password)
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
  setSenseMap: SenseMapSetterFun,
  requestPass: (name: string, resolve: PasswordRequestCallback) => void
) {
  getStorage(
    'coarse_sense_map',
    'original_',
    rawMap => {
      if (rawMap) {
        getStorage(
          'coarse_sense_map',
          '',
          map => (map ? setSenseMap(map, {rawMap, store: true}) : undefined),
          true,
          requestPass,
          {}
        )
      }
    },
    true,
    requestPass,
    void 0
  )
}
