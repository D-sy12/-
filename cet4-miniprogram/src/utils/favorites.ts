import { useSyncExternalStore } from 'react';
import { getStorage, setStorage, KEY_FAVORITES } from './storage';

// 收藏夹：与网页版一致的字符串数组（存单词原形，顺序即收藏顺序）
let favorites: string[] = load();

const listeners = new Set<() => void>();

function load(): string[] {
  const raw = getStorage<string[]>(KEY_FAVORITES, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((w) => typeof w === 'string' && w);
}

function emit() {
  listeners.forEach((fn) => fn());
}

function persist(next: string[]): void {
  favorites = next;
  setStorage(KEY_FAVORITES, next);
  emit();
}

function sameWord(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function getFavorites(): string[] {
  return favorites;
}

export function isFavorite(word: string): boolean {
  return favorites.some((w) => sameWord(w, word));
}

/** 收藏 / 取消收藏，返回切换后的状态（true 表示已收藏） */
export function toggleFavorite(word: string): boolean {
  if (!word) return false;
  const exists = isFavorite(word);
  if (exists) {
    persist(favorites.filter((w) => !sameWord(w, word)));
    return false;
  }
  persist([word, ...favorites]);
  return true;
}

/** 清空收藏（调试或设置页可用） */
export function clearFavorites(): void {
  persist([]);
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** 响应式读取收藏列表 */
export function useFavorites(): string[] {
  return useSyncExternalStore(
    subscribe,
    () => favorites,
    () => favorites
  );
}
