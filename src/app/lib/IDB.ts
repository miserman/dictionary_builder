type storedItem = {name: string; encrypted?: boolean; content: Blob}
type DBName = 'resources' | 'building' | 'coarse_sense_map'
const DBVersions = {resources: 7, building: 1, coarse_sense_map: 1}
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
export const IDB = {
  setItem: async function (item: storedItem, database: DBName): Promise<boolean> {
    const db = await openDB(database)
    return new Promise(resolve => {
      if (db) {
        const req = db.transaction([database], 'readwrite', {durability: 'relaxed'}).objectStore(database).put(item)
        req.onerror = () => {
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
