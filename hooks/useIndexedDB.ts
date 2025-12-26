import { useState, useEffect, useCallback } from 'react';

/**
 * IndexedDB 配置
 */
const DB_NAME = 'xiuxian-game-db';
const DB_VERSION = 2; // 升级版本号以支持新存储
const STORE_NAMES = {
  ADVENTURE_TEMPLATES: 'adventure-templates',
  BREAKTHROUGH_DESCRIPTIONS: 'breakthrough-descriptions',
  ENEMY_NAMES: 'enemy-names',
};

/**
 * IndexedDB Hook
 * 用于管理事件模板、突破描述和敌人名称的存储和读取
 */
export function useIndexedDB() {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 初始化 IndexedDB
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB 打开失败:', request.error);
      setIsReady(false);
    };

    request.onsuccess = () => {
      const database = request.result;
      setDb(database);
      setIsReady(true);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // 创建对象存储（如果不存在）
      Object.values(STORE_NAMES).forEach(storeName => {
        if (!database.objectStoreNames.contains(storeName)) {
          const objectStore = database.createObjectStore(storeName, { keyPath: 'id' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      });
    };

    return () => {
      if (db) {
        db.close();
      }
    };
  }, []);

  /**
   * 通用保存函数
   */
  const saveToStore = useCallback(async (
    storeName: string,
    items: any[],
    itemType: string
  ): Promise<void> => {
    if (!db || !isReady) {
      throw new Error('IndexedDB 未就绪');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const objectStore = transaction.objectStore(storeName);

      // 先清空现有数据
      const clearRequest = objectStore.clear();
      clearRequest.onsuccess = () => {
        // 保存新数据
        const savePromises = items.map((item, index) => {
          return new Promise<void>((resolveItem, rejectItem) => {
            const dbItem = {
              id: `${itemType}-${index}`,
              data: item,
              timestamp: Date.now(),
            };
            const request = objectStore.add(dbItem);
            request.onsuccess = () => resolveItem();
            request.onerror = () => rejectItem(request.error);
          });
        });

        Promise.all(savePromises)
          .then(() => {
            console.log(`成功保存 ${items.length} 个${itemType}到 IndexedDB`);
            resolve();
          })
          .catch(reject);
      };

      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }, [db, isReady]);

  /**
   * 通用读取函数
   */
  const loadFromStore = useCallback(async (
    storeName: string,
    itemType: string
  ): Promise<any[] | null> => {
    if (!db || !isReady) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const results = request.result;
        if (results.length === 0) {
          resolve(null);
        } else {
          // 按 id 排序并提取数据
          const items = results
            .sort((a, b) => {
              const aIndex = parseInt(a.id.replace(`${itemType}-`, ''));
              const bIndex = parseInt(b.id.replace(`${itemType}-`, ''));
              return aIndex - bIndex;
            })
            .map(item => item.data);
          console.log(`从 IndexedDB 加载了 ${items.length} 个${itemType}`);
          resolve(items);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }, [db, isReady]);

  /**
   * 通用检查函数
   */
  const hasInStore = useCallback(async (storeName: string): Promise<boolean> => {
    if (!db || !isReady) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.count();

      request.onsuccess = () => {
        resolve(request.result > 0);
      };

      request.onerror = () => reject(request.error);
    });
  }, [db, isReady]);

  /**
   * 保存事件模板到 IndexedDB
   */
  const saveTemplates = useCallback(async (templates: any[]): Promise<void> => {
    return saveToStore(STORE_NAMES.ADVENTURE_TEMPLATES, templates, 'template');
  }, [saveToStore]);

  /**
   * 从 IndexedDB 读取事件模板
   */
  const loadTemplates = useCallback(async (): Promise<any[] | null> => {
    return loadFromStore(STORE_NAMES.ADVENTURE_TEMPLATES, 'template');
  }, [loadFromStore]);

  /**
   * 检查 IndexedDB 中是否有事件模板
   */
  const hasTemplates = useCallback(async (): Promise<boolean> => {
    return hasInStore(STORE_NAMES.ADVENTURE_TEMPLATES);
  }, [hasInStore]);

  /**
   * 保存突破描述模板到 IndexedDB
   */
  const saveBreakthroughDescriptions = useCallback(async (descriptions: any[]): Promise<void> => {
    return saveToStore(STORE_NAMES.BREAKTHROUGH_DESCRIPTIONS, descriptions, 'breakthrough');
  }, [saveToStore]);

  /**
   * 从 IndexedDB 读取突破描述模板
   */
  const loadBreakthroughDescriptions = useCallback(async (): Promise<any[] | null> => {
    return loadFromStore(STORE_NAMES.BREAKTHROUGH_DESCRIPTIONS, 'breakthrough');
  }, [loadFromStore]);

  /**
   * 检查 IndexedDB 中是否有突破描述模板
   */
  const hasBreakthroughDescriptions = useCallback(async (): Promise<boolean> => {
    return hasInStore(STORE_NAMES.BREAKTHROUGH_DESCRIPTIONS);
  }, [hasInStore]);

  /**
   * 保存敌人名称模板到 IndexedDB
   */
  const saveEnemyNames = useCallback(async (names: any[]): Promise<void> => {
    return saveToStore(STORE_NAMES.ENEMY_NAMES, names, 'enemy');
  }, [saveToStore]);

  /**
   * 从 IndexedDB 读取敌人名称模板
   */
  const loadEnemyNames = useCallback(async (): Promise<any[] | null> => {
    return loadFromStore(STORE_NAMES.ENEMY_NAMES, 'enemy');
  }, [loadFromStore]);

  /**
   * 检查 IndexedDB 中是否有敌人名称模板
   */
  const hasEnemyNames = useCallback(async (): Promise<boolean> => {
    return hasInStore(STORE_NAMES.ENEMY_NAMES);
  }, [hasInStore]);

  /**
   * 清空 IndexedDB 中的事件模板
   */
  const clearTemplates = useCallback(async (): Promise<void> => {
    if (!db || !isReady) {
      throw new Error('IndexedDB 未就绪');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAMES.ADVENTURE_TEMPLATES], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAMES.ADVENTURE_TEMPLATES);
      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log('已清空 IndexedDB 中的事件模板');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }, [db, isReady]);

  return {
    isReady,
    saveTemplates,
    loadTemplates,
    hasTemplates,
    clearTemplates,
    saveBreakthroughDescriptions,
    loadBreakthroughDescriptions,
    hasBreakthroughDescriptions,
    saveEnemyNames,
    loadEnemyNames,
    hasEnemyNames,
  };
}

