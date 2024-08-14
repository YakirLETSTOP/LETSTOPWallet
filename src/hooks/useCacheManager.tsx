import {useState, useEffect, useCallback, useRef} from 'react';
import CacheManager from '../utils/CacheManager';

function useCacheManager<T>(
  key: string,
  fetchFunction: (...args: any[]) => Promise<T>,
  expirationTime: number,
  fetchParams: any[] = [],
): [T | null, boolean, () => Promise<void>, boolean] {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const isLoadingRef = useRef(false);

  const loadData = useCallback(
    async (force: boolean = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      try {
        // First, try to get data from cache
        const cachedData = (await CacheManager.getCachedData(key)) as T;
        if (cachedData && !force) {
          setData(cachedData);
          setIsLoading(false);
        }

        // Then, check if we need to fetch fresh data
        if (
          force ||
          !cachedData ||
          CacheManager.isExpired(key, expirationTime)
        ) {
          if (force) setIsRefreshing(true);
          const freshData = await CacheManager.getData(
            key,
            fetchFunction,
            force ? 0 : expirationTime,
            fetchParams,
          );
          setData(freshData);
        }
      } catch (error) {
        console.error(`Error loading data for key ${key}:`, error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isLoadingRef.current = false;
      }
    },
    [key, fetchFunction, expirationTime],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => loadData(true), [loadData]);

  return [data, isLoading, refresh, isRefreshing];
}

export default useCacheManager;
