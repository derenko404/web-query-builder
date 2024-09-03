// indexedDB
export function isTablesAndFieldsExists(
  dbName: string,
  storeName: string,
  requiredFields: string[]
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName)

    request.onsuccess = function (event) {
      // @ts-ignore
      const db = event.target.result
      const transaction = db.transaction(storeName, 'readonly')
      const objectStore = transaction.objectStore(storeName)

      // Get a single record to inspect its fields
      const getRequest = objectStore.getAll() // or use get(key) for a specific record

      getRequest.onsuccess = function () {
        const records = getRequest.result

        if (records.length === 0) {
          resolve(false)
          return
        }

        // Inspect the first record for required fields
        const sampleRecord = records[0]

        const hasAllFields = requiredFields.every(
          (field) => field in sampleRecord
        )
        resolve(hasAllFields)
      }

      getRequest.onerror = function () {
        reject('Failed to retrieve records')
      }
    }

    request.onerror = function () {
      reject('Failed to open database')
    }
  })
}

export class MockLocalStorage {
  private store: Record<string, string>

  constructor() {
    this.store = {}
  }

  getItem(key: string) {
    return this.store[key] || null
  }

  setItem(key: string, value: string) {
    this.store[key] = value
  }

  removeItem(key: string) {
    delete this.store[key]
  }

  clear() {}
}

// export class MockTestStorageAdapter implements StorageAdapter {
//   private storage: Record<string, any>;

//   constructor() {
//     this.storage = {};
//   }

//   async connect() {
//     return this;
//   }

//   async get(key: string, filter?: (record: any) => boolean) {
//     const table = this.storage[key];

//     if (table && Array.isArray(table)) {
//       if (filter) {
//         return {
//           records: table.filter(filter)
//         };
//       } else {
//         return {
//           records: table
//         };
//       }
//     } else {
//       return {
//         records: []
//       };
//     }
//   }

//   async set(key: string, record: any) {
//     const table = this.storage[key];

//     if (table && Array.isArray(table)) {
//       this.storage[key] = [...table, record];

//       return {
//         records: [record]
//       }
//     } else {
//       this.storage[key] = [record];
//       return {
//         records: [record]
//       }
//     }
//   }

//   async delete() {

//   };

//   async add(key: string, value: any) {
//     return {
//       records: [value]
//     }
//   }
// };
