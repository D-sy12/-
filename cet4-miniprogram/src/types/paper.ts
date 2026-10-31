// 真题试卷数据结构（与 cet4-vocab/js/papers/*.json 保持一致）

/** 听力 / 阅读单选题 */
export interface ListenQuestion {
  num: number;
  stem: string;
  options: Record<string, string>;
  stem_cn?: string;
  options_cn?: Record<string, string>;
}

/** 听力原文（英文原文 / 中文译文） */
export interface ListeningScript {
  en?: string;
  cn?: string;
}

/** 一套完整真题 */
export interface Paper {
  id: string;
  /** Part I 写作题目 */
  writing: string;
  /** Part II 听力 25 题 */
  listening: ListenQuestion[];
  /** Part III Section A 选词填空词库（A-O） */
  word_bank: Record<string, string>;
  /** 选词填空原文（含 26-35 空） */
  cloze_passage: string;
  /** Part III Section B 长篇阅读原文 */
  long_reading_passage: string;
  /** 长篇阅读段落匹配题干（36-45） */
  long_reading?: ListenQuestion[];
  /** Part III Section C 仔细阅读两篇 */
  reading_passage_1: string;
  reading_1: ListenQuestion[];
  reading_passage_2: string;
  reading_2: ListenQuestion[];
  /** Part IV 汉译英 */
  translation: string;
  /** 客观题标准答案：题号 -> 选项字母 */
  answers: Record<string, string>;
  listening_script?: ListeningScript;
}

/** 答题对照项 */
export interface ReviewItem {
  num: number;
  correct: string;
  user: string;
  right: boolean;
}
