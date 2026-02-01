import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLocalStorageOptions<T> {
  key: string;
  defaultValue: T;
  debounceMs?: number;
}

export function useLocalStorage<T>({ key, defaultValue, debounceMs = 500 }: UseLocalStorageOptions<T>) {
  // 初始化状态，尝试从localStorage读取
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : defaultValue;
    } catch (e) {
      console.error(`Error loading ${key} from localStorage:`, e);
      return defaultValue;
    }
  });

  // 使用ref存储timeout ID，避免在useEffect中创建新的函数
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 防抖写入localStorage
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error(`Error saving ${key} to localStorage:`, e);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, value, debounceMs]);

  // 重置为默认值
  const reset = useCallback(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  // 从localStorage重新加载
  const reload = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setValue(JSON.parse(saved) as T);
      }
    } catch (e) {
      console.error(`Error reloading ${key} from localStorage:`, e);
    }
  }, [key]);

  return { value, setValue, reset, reload };
}

export default useLocalStorage;
