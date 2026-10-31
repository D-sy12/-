import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { HIGH_FREQ_WORDS, HIGH_FREQ_PHRASES, ESSAY_SENTENCES } from '@/data/intensive';
import type { PhraseItem, EssayItem } from '@/data/intensive';
import styles from './index.module.scss';

type ViewKey = 'menu' | 'words' | 'phrases' | 'essay';

const PHRASE_GROUPS: Array<{ key: PhraseItem['category']; name: string; desc: string }> = [
  { key: 'verb', name: '动词短语', desc: '写作与阅读中的高频动词搭配' },
  { key: 'prep', name: '名词 / 介词短语', desc: '固定搭配，快速提分' },
  { key: 'writing', name: '写作加分搭配', desc: '作文里直接套用的亮点表达' },
];

const ESSAY_GROUPS: Array<{ key: EssayItem['category']; name: string }> = [
  { key: 'opening', name: '开头句' },
  { key: 'comparison', name: '对比与比较' },
  { key: 'reason', name: '原因与解释' },
  { key: 'proscons', name: '利弊分析' },
  { key: 'suggestion', name: '建议与措施' },
  { key: 'conclusion', name: '结尾句' },
];

interface MenuCard {
  key: ViewKey;
  icon: string;
  title: string;
  count: string;
  desc: string;
  color: string;
}

const MENU_CARDS: MenuCard[] = [
  {
    key: 'words',
    icon: '🔥',
    title: '高频核心词',
    count: `${HIGH_FREQ_WORDS.length} 词`,
    desc: '考前必过的高频词汇，按字母速查',
    color: '#4f7cff',
  },
  {
    key: 'phrases',
    icon: '💡',
    title: '高频短语搭配',
    count: `${HIGH_FREQ_PHRASES.length} 条`,
    desc: '动词 / 介词 / 写作三类黄金短语',
    color: '#ff7a59',
  },
  {
    key: 'essay',
    title: '写作万能句式',
    icon: '✍️',
    count: `${ESSAY_SENTENCES.length} 句`,
    desc: '开头、论证、结尾六类模板句',
    color: '#27ae60',
  },
];

function IntensivePage() {
  const [view, setView] = useState<ViewKey>('menu');

  const wordsByLetter = useMemo(() => {
    const map = new Map<string, typeof HIGH_FREQ_WORDS>();
    HIGH_FREQ_WORDS.forEach((w) => {
      const l = w.word[0].toUpperCase();
      if (!map.has(l)) map.set(l, []);
      map.get(l)!.push(w);
    });
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, []);

  return (
    <View className={styles.page}>
      {view !== 'menu' && (
        <View className={styles.subBar}>
          <Text className={styles.backBtn} onClick={() => setView('menu')}>
            ‹ 返回
          </Text>
          <Text className={styles.subTitle}>
            {view === 'words' && '高频核心词'}
            {view === 'phrases' && '高频短语搭配'}
            {view === 'essay' && '写作万能句式'}
          </Text>
        </View>
      )}

      {view === 'menu' && (
        <View className={styles.menu}>
          {MENU_CARDS.map((c) => (
            <View
              key={c.key}
              className={styles.menuCard}
              onClick={() => setView(c.key)}
            >
              <View className={styles.menuIcon} style={{ backgroundColor: c.color }}>
                <Text>{c.icon}</Text>
              </View>
              <View className={styles.menuInfo}>
                <View className={styles.menuTitleRow}>
                  <Text className={styles.menuTitle}>{c.title}</Text>
                  <Text className={styles.menuCount}>{c.count}</Text>
                </View>
                <Text className={styles.menuDesc}>{c.desc}</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
          <View className={styles.tipBox}>
            <Text className={styles.tipTitle}>📌 使用建议</Text>
            <Text className={styles.tipText}>
              {'\n'}考前时间紧，优先过一遍高频核心词；{'\n'}
              短语与句式建议在考前两天背诵，写作时直接套用；{'\n'}
              带 ★ 的为重点推荐条目。
            </Text>
          </View>
        </View>
      )}

      {view === 'words' && (
        <ScrollView scrollY className={styles.detailScroll}>
          {wordsByLetter.map(([letter, items]) => (
            <View key={letter} className={styles.section}>
              <View className={styles.sectionHead}>{letter}</View>
              <View className={styles.sectionBody}>
                {items.map((w) => (
                  <View key={w.word} className={styles.wordItem}>
                    <Text className={styles.wordEn}>{w.word}</Text>
                    <Text className={styles.wordCn}>{w.meaning}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {view === 'phrases' && (
        <ScrollView scrollY className={styles.detailScroll}>
          {PHRASE_GROUPS.map((g) => {
            const items = HIGH_FREQ_PHRASES.filter((p) => p.category === g.key);
            return (
              <View key={g.key} className={styles.section}>
                <View className={styles.sectionHeadWide}>
                  <Text className={styles.sectionName}>{g.name}</Text>
                  <Text className={styles.sectionDesc}>{g.desc}</Text>
                </View>
                <View className={styles.sectionBody}>
                  {items.map((p) => (
                    <View key={p.phrase} className={styles.wordItem}>
                      <View className={styles.phraseHead}>
                        <Text className={styles.wordEn}>{p.phrase}</Text>
                        {p.starred && <Text className={styles.star}>★</Text>}
                      </View>
                      <Text className={styles.wordCn}>{p.meaning}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {view === 'essay' && (
        <ScrollView scrollY className={styles.detailScroll}>
          {ESSAY_GROUPS.map((g) => {
            const items = ESSAY_SENTENCES.filter((s) => s.category === g.key);
            if (!items.length) return null;
            return (
              <View key={g.key} className={styles.section}>
                <View className={styles.sectionHeadWide}>
                  <Text className={styles.sectionName}>{g.name}</Text>
                </View>
                {items.map((s, i) => (
                  <View key={i} className={styles.essayCard}>
                    <View className={styles.phraseHead}>
                      <Text className={styles.essayEn}>{s.sentence}</Text>
                      {s.starred && <Text className={styles.star}>★</Text>}
                    </View>
                    <Text className={styles.essayCn}>{s.translation}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

export default IntensivePage;
