// 全部词汇（词根词 + 补充词）的扁平列表，供搜索 / 练习 / 收藏使用
import { getAllWords } from './words';
import type { FlatWord } from './words';

export const ALL_WORDS: FlatWord[] = getAllWords();
