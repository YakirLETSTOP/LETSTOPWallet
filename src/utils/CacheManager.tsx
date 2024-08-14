// CacheManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheItem<T> = {
  data: T;
  expiration: number;
};

type UpdateCallback<T> = (data: T) => void;

class CacheManager {
  private static cache: Record<string, CacheItem<any>> = {};
  private static updateCallbacks: Record<string, Set<UpdateCallback<any>>> = {};

  static async getData<T>(
    key: string,
    fetchFunction: (...args: any[]) => Promise<T>,
    expirationTime: number,
    fetchParams: any[] = [],
  ): Promise<T> {
    const currentTime = Date.now();
    const cachedItem = this.cache[key];
    if (
      expirationTime === 0 ||
      !cachedItem ||
      cachedItem.expiration <= currentTime
    ) {
      console.log(
        'Expiration param: ' +
          (expirationTime > 0 ? expirationTime / 1000 : 'none'),
      );
      console.log(
        'cachedItem expiration: ' +
          (cachedItem?.expiration ? cachedItem?.expiration / 1000 : 'none'),
      );
      try {
        const freshData = await fetchFunction(...fetchParams);
        await this.setData(key, freshData, expirationTime);
        return freshData;
      } catch (error) {
        console.error(`Error fetching data for key ${key}:`, error);
        if (cachedItem) {
          return cachedItem.data;
        }
        throw error;
      }
    }

    return cachedItem.data;
  }

  static async getCachedData<T>(key: string): Promise<T | null> {
    const cachedItem = this.cache[key];
    if (cachedItem) {
      return cachedItem.data;
    }
    return null;
  }

  static isExpired(key: string, expirationTime: number): boolean {
    const cachedItem = this.cache[key];
    if (!cachedItem) return true;
    return Date.now() > cachedItem.expiration;
  }

  static async setData<T>(
    key: string,
    data: T,
    expirationTime: number,
  ): Promise<void> {
    const expiration = Date.now() + expirationTime;
    this.cache[key] = {data, expiration};
    await AsyncStorage.setItem(key, JSON.stringify({data, expiration}));
    this.notifyUpdateCallbacks(key, data);
  }

  static async clearCache(key: string): Promise<void> {
    delete this.cache[key];
    await AsyncStorage.removeItem(key);
    this.notifyUpdateCallbacks(key, null);
  }

  static registerUpdateCallback<T>(
    key: string,
    callback: UpdateCallback<T>,
  ): void {
    if (!this.updateCallbacks[key]) {
      this.updateCallbacks[key] = new Set();
    }
    this.updateCallbacks[key].add(callback);
  }

  static unregisterUpdateCallback<T>(
    key: string,
    callback: UpdateCallback<T>,
  ): void {
    if (this.updateCallbacks[key]) {
      this.updateCallbacks[key].delete(callback);
    }
  }

  private static notifyUpdateCallbacks<T>(key: string, data: T): void {
    if (this.updateCallbacks[key]) {
      this.updateCallbacks[key].forEach(callback => callback(data));
    }
  }

  static async initializeCache(): Promise<void> {
    await AsyncStorage.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      items.forEach(([key, value]) => {
        if (value) {
          const {data, expiration} = JSON.parse(value);
          this.cache[key] = {data, expiration};
        }
      });
    } catch (error) {
      console.error('Error initializing cache:', error);
    }
  }
}

CacheManager.initializeCache();

export default CacheManager;
