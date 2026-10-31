import Taro from '@tarojs/taro';

// 与网页版保持一致的本地存储键名
export const KEY_FAVORITES = 'cet4_favorites';
export const KEY_PRACTICE_LOG = 'cet4_practice_log';
export const KEY_EXAM_SCORES = 'cet4_exam_scores';

export function getStorage<T>(key: string, fallback: T): T {
  try {
    const v = Taro.getStorageSync(key);
    if (v === '' || v === null || v === undefined) return fallback;
    if (typeof v === 'string') return JSON.parse(v) as T;
    return v as T;
  } catch (e) {
    console.error('[Storage] read failed:', key, e);
    return fallback;
  }
}

export function setStorage(key: string, value: unknown): void {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    console.error('[Storage] write failed:', key, e);
  }
}

export interface WordPracticeRecord {
  total: number;
  correct: number;
  wrong: number;
  rate: number;
  date: string;
}

export interface ListenPracticeRecord {
  pid: string;
  score: number;
  correct: number;
  total: number;
  answered: number;
  date: string;
}

export interface ExamScoreRecord {
  pid: string;
  score: number;
  correct: number;
  total: number;
  date: string;
}

export function addWordPracticeLog(rec: WordPracticeRecord): void {
  const log = getStorage<{ word?: WordPracticeRecord[]; listen?: ListenPracticeRecord[] }>(
    KEY_PRACTICE_LOG,
    {}
  );
  if (!log.word) log.word = [];
  log.word.unshift(rec);
  if (log.word.length > 50) log.word.length = 50;
  setStorage(KEY_PRACTICE_LOG, log);
}

export function addListenPracticeLog(rec: ListenPracticeRecord): void {
  const log = getStorage<{ word?: WordPracticeRecord[]; listen?: ListenPracticeRecord[] }>(
    KEY_PRACTICE_LOG,
    {}
  );
  if (!log.listen) log.listen = [];
  log.listen.unshift(rec);
  if (log.listen.length > 50) log.listen.length = 50;
  setStorage(KEY_PRACTICE_LOG, log);
}

export function addExamScore(rec: ExamScoreRecord): void {
  const scores = getStorage<ExamScoreRecord[]>(KEY_EXAM_SCORES, []);
  scores.unshift(rec);
  if (scores.length > 50) scores.length = 50;
  setStorage(KEY_EXAM_SCORES, scores);
}
