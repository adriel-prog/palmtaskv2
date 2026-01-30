
import { Task, NonBuyer, TaskSkuMap, ProductImage, Consultant } from './types';

const DB_NAME = 'PalmTaskDB';
const DB_VERSION = 5; // Incremented for Consultant Store
const TASK_STORE = 'tasks';
const NON_BUYER_STORE = 'non_buyers';
const SKU_MAP_STORE = 'sku_map';
const PRODUCT_IMG_STORE = 'product_images';
const CONSULTANT_STORE = 'consultants';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('Error opening IndexedDB');

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(TASK_STORE)) {
        db.createObjectStore(TASK_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(NON_BUYER_STORE)) {
        db.createObjectStore(NON_BUYER_STORE, { keyPath: 'pdvCode' }); 
      }

      if (!db.objectStoreNames.contains(SKU_MAP_STORE)) {
        db.createObjectStore(SKU_MAP_STORE, { keyPath: 'hashId' });
      }

      if (!db.objectStoreNames.contains(PRODUCT_IMG_STORE)) {
        db.createObjectStore(PRODUCT_IMG_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(CONSULTANT_STORE)) {
        db.createObjectStore(CONSULTANT_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const saveTasksToDB = async (tasks: Task[]): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TASK_STORE], 'readwrite');
      const store = transaction.objectStore(TASK_STORE);
      store.clear();
      tasks.forEach(task => store.put(task));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error saving tasks:', error);
    throw error;
  }
};

export const saveNonBuyersToDB = async (items: NonBuyer[]): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([NON_BUYER_STORE], 'readwrite');
      const store = transaction.objectStore(NON_BUYER_STORE);
      store.clear();
      items.forEach(item => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error saving non-buyers:', error);
    throw error;
  }
};

export const saveSkuMapToDB = async (items: TaskSkuMap[]): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SKU_MAP_STORE], 'readwrite');
      const store = transaction.objectStore(SKU_MAP_STORE);
      store.clear();
      items.forEach(item => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error saving sku map:', error);
    throw error;
  }
};

export const saveProductImagesToDB = async (items: ProductImage[]): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PRODUCT_IMG_STORE], 'readwrite');
      const store = transaction.objectStore(PRODUCT_IMG_STORE);
      store.clear();
      items.forEach(item => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error saving product images:', error);
    throw error;
  }
};

export const saveConsultantsToDB = async (items: Consultant[]): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONSULTANT_STORE], 'readwrite');
      const store = transaction.objectStore(CONSULTANT_STORE);
      store.clear();
      items.forEach(item => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error saving consultants:', error);
    throw error;
  }
};

export const getTasksFromDB = async (): Promise<Task[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TASK_STORE], 'readonly');
      const store = transaction.objectStore(TASK_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Task[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    return [];
  }
};

export const getNonBuyersFromDB = async (): Promise<NonBuyer[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(NON_BUYER_STORE)) {
          resolve([]);
          return;
      }
      const transaction = db.transaction([NON_BUYER_STORE], 'readonly');
      const store = transaction.objectStore(NON_BUYER_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as NonBuyer[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    return [];
  }
};

export const getSkuMapFromDB = async (): Promise<TaskSkuMap[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(SKU_MAP_STORE)) {
          resolve([]);
          return;
      }
      const transaction = db.transaction([SKU_MAP_STORE], 'readonly');
      const store = transaction.objectStore(SKU_MAP_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as TaskSkuMap[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    return [];
  }
};

export const getProductImagesFromDB = async (): Promise<ProductImage[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(PRODUCT_IMG_STORE)) {
          resolve([]);
          return;
      }
      const transaction = db.transaction([PRODUCT_IMG_STORE], 'readonly');
      const store = transaction.objectStore(PRODUCT_IMG_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as ProductImage[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    return [];
  }
};

export const getConsultantsFromDB = async (): Promise<Consultant[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(CONSULTANT_STORE)) {
          resolve([]);
          return;
      }
      const transaction = db.transaction([CONSULTANT_STORE], 'readonly');
      const store = transaction.objectStore(CONSULTANT_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Consultant[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    return [];
  }
};
