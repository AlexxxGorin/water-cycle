import { DailyProgress, getMotivationMessage } from '../types/statistics';

const DB_NAME = 'WaterBalanceDB';
const DB_VERSION = 1;
const STATS_STORE = 'statistics';
const PROGRESS_STORE = 'currentProgress';

interface DBProgress {
  id: 'current';
  goal: number;
  glassesDrunk: number;
  lastUpdate: string;
}

// Инициализация базы данных
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Хранилище для статистики
      if (!db.objectStoreNames.contains(STATS_STORE)) {
        db.createObjectStore(STATS_STORE, { keyPath: 'date' });
      }

      // Хранилище для текущего прогресса
      if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
        db.createObjectStore(PROGRESS_STORE, { keyPath: 'id' });
      }
    };
  });
};

// Получение соединения с базой данных
const getDB = (() => {
  let db: IDBDatabase | null = null;

  return async () => {
    if (!db) {
      db = await initDB();
    }
    return db;
  };
})();

// Сохранение статистики
export const saveStatistics = async (progress: DailyProgress): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STATS_STORE, 'readwrite');
    const store = transaction.objectStore(STATS_STORE);
    const request = store.put(progress);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Получение всей статистики
export const getAllStatistics = async (): Promise<DailyProgress[]> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STATS_STORE, 'readonly');
    const store = transaction.objectStore(STATS_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Сортируем по дате в обратном порядке (новые записи сверху)
      const sortedStats = request.result.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      resolve(sortedStats);
    };
  });
};

// Сохранение текущего прогресса
export const saveCurrentProgress = async (
  goal: number,
  glassesDrunk: number,
  lastUpdate: string
): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROGRESS_STORE, 'readwrite');
    const store = transaction.objectStore(PROGRESS_STORE);
    const progress: DBProgress = {
      id: 'current',
      goal,
      glassesDrunk,
      lastUpdate
    };
    const request = store.put(progress);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Получение текущего прогресса
export const getCurrentProgress = async (): Promise<DBProgress | null> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PROGRESS_STORE, 'readonly');
    const store = transaction.objectStore(PROGRESS_STORE);
    const request = store.get('current');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

// Обновление статистики за определенный день
export const updateDayStatistics = async (date: string, glassesDrunk: number): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STATS_STORE, 'readwrite');
    const store = transaction.objectStore(STATS_STORE);

    // Получаем существующую запись
    const getRequest = store.get(date);

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const existingEntry = getRequest.result;
      if (existingEntry) {
        // Обновляем количество выпитых стаканов и пересчитываем процент
        const percentage = (glassesDrunk / existingEntry.goal) * 100;
        const updatedEntry = {
          ...existingEntry,
          glassesDrunk,
          percentage,
          motivation: getMotivationMessage(percentage)
        };

        const updateRequest = store.put(updatedEntry);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      } else {
        reject(new Error('Запись для указанной даты не найдена'));
      }
    };
  });
};
