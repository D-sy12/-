import { useSyncExternalStore } from 'react';

// 跨 tab 页面的轻量交互状态
export type VocabSegment = 'roots' | 'words' | 'affixes';

interface UiState {
  vocabSegment: VocabSegment;
  homeSearchFocus: number; // 自增计数：首页九宫格点击“单词搜索”时触发输入框聚焦
}

let state: UiState = {
  vocabSegment: 'roots',
  homeSearchFocus: 0,
};

// 主页九宫格指定的词汇页目标分段（普通全局变量，vocab 页 useDidShow 时消费）
let pendingVocabSegment: VocabSegment | null = null;

const listeners = new Set<() => void>();

function setState(patch: Partial<UiState>) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}

export function setVocabSegment(seg: VocabSegment) {
  state = { ...state, vocabSegment: seg };
}

export function goVocabSegment(seg: VocabSegment) {
  pendingVocabSegment = seg;
  state = { ...state, vocabSegment: seg };
}

export function consumeVocabSegment(): VocabSegment | null {
  const seg = pendingVocabSegment;
  pendingVocabSegment = null;
  return seg;
}

export function triggerHomeSearchFocus() {
  setState({ homeSearchFocus: state.homeSearchFocus + 1 });
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useUiState(): UiState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
