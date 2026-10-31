import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { CET4_WORDS, PREFIXES, SUFFIXES } from '@/data/words';
import type { FlatWord } from '@/data/words';
import { ALL_WORDS } from '@/data/wordsFlat';
import { consumeVocabSegment, useUiState, type VocabSegment } from '@/utils/uiStore';
import WordRow from '@/components/WordRow';
import styles from './index.module.scss';

// ---------- 字母索引 + 联动滚动通用容器 ----------
interface LetterGroupData {
  letter: string;
  node: React.ReactNode;
}

interface RectResult {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface LetterScrollProps {
  idPrefix: string;
  letters: string[];
  groups: LetterGroupData[];
}

function LetterScroll({ idPrefix, letters, groups }: LetterScrollProps) {
  const [active, setActive] = useState(letters[0] || '');
  const [intoId, setIntoId] = useState('');
  const offsetsRef = useRef<number[]>([]);
  const measureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = () => {
    Taro.createSelectorQuery()
      .selectAll(`.${styles.anchor}`)
      .boundingClientRect()
      .select(`.${styles.svContent}`)
      .boundingClientRect()
      .exec((res) => {
        try {
          const rects = res?.[0] as RectResult[] | undefined;
          const svRect = res?.[1] as RectResult | undefined;
          if (!rects || !svRect || !rects.length) return;
          offsetsRef.current = rects.map((r) => r.top - svRect.top);
        } catch (e) {
          console.error('[Vocab] measure failed', e);
        }
      });
  };

  const scheduleMeasure = () => {
    if (measureTimer.current) clearTimeout(measureTimer.current);
    measureTimer.current = setTimeout(measure, 120);
  };

  useEffect(() => {
    scheduleMeasure();
    return () => {
      if (measureTimer.current) clearTimeout(measureTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPrefix]);

  const onScroll = (e) => {
    const top = e.detail.scrollTop as number;
    const offsets = offsetsRef.current;
    if (!offsets.length) {
      scheduleMeasure();
      return;
    }
    let cur = letters[0] || '';
    for (let i = 0; i < offsets.length; i++) {
      if (top + 24 >= offsets[i]) cur = letters[i];
      else break;
    }
    setActive(cur);
  };

  const tapLetter = (letter: string) => {
    setIntoId('');
    setTimeout(() => {
      setIntoId(`${idPrefix}-${letter}`);
      setActive(letter);
    }, 20);
  };

  return (
    <View className={styles.letterLayout}>
      <ScrollView
        scrollY
        className={styles.svContent}
        scrollIntoView={intoId}
        scrollWithAnimation
        onScroll={onScroll}
        enhanced
        showScrollbar={false}
      >
        {groups.map((g) => (
          <View key={g.letter} id={`${idPrefix}-${g.letter}`} className={styles.anchor}>
            {g.node}
          </View>
        ))}
        <View className={styles.listBottom} />
      </ScrollView>
      <View className={styles.letterBar}>
        {letters.map((l) => (
          <Text
            key={l}
            className={classnames(styles.letterItem, active === l && styles.letterActive)}
            onClick={() => tapLetter(l)}
          >
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ---------- 词根浏览分段 ----------
function RootsSegment() {
  const data = useMemo(() => {
    const groups: LetterGroupData[] = [];
    const letters: string[] = [];
    const seen = new Set<string>();
    CET4_WORDS.forEach((g) => {
      const letter = g.root[0].toUpperCase();
      if (!seen.has(letter)) {
        seen.add(letter);
        letters.push(letter);
      }
    });
    // 按字母聚合成节点
    const nodesByLetter = new Map<string, React.ReactNode[]>();
    CET4_WORDS.forEach((g) => {
      const letter = g.root[0].toUpperCase();
      if (!nodesByLetter.has(letter)) nodesByLetter.set(letter, []);
      nodesByLetter.get(letter)!.push(
        <View key={g.root} className={styles.rootCard}>
          <View className={styles.rootHeader}>
            <Text className={styles.rootName}>{g.root}</Text>
            <Text className={styles.rootMeaning}>
              {g.meaning} · {g.words.length}词
            </Text>
          </View>
          <View className={styles.rootWordList}>
            {g.words.map((w) => {
              const flat: FlatWord = {
                word: w.word,
                phonetic: w.phonetic,
                meaning: w.meaning,
                prefix: w.prefix,
                suffix: w.suffix,
                root: g.root,
                rootMeaning: g.meaning,
              };
              return <WordRow key={w.word} word={flat} showAffix />;
            })}
          </View>
        </View>
      );
    });
    letters.forEach((l) => {
      groups.push({ letter: l, node: <View className={styles.groupPad}>{nodesByLetter.get(l)}</View> });
    });
    return { groups, letters };
  }, []);

  return (
    <LetterScroll idPrefix="root" letters={data.letters} groups={data.groups} />
  );
}

// ---------- 全部词汇分段 ----------
function WordsSegment() {
  const data = useMemo(() => {
    const map = new Map<string, FlatWord[]>();
    ALL_WORDS.forEach((w) => {
      const letter = (w.word[0] || '#').toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(w);
    });
    const letters = [...map.keys()].sort();
    return { map, letters };
  }, []);

  const [openLetter, setOpenLetter] = useState(data.letters[0] || '');

  return (
    <View className={styles.letterLayout}>
      <ScrollView scrollY className={styles.svContent} enhanced showScrollbar={false}>
        {data.letters.map((l) => {
          const words = data.map.get(l)!;
          const open = openLetter === l;
          return (
            <View key={l} className={styles.groupPad}>
              <View className={styles.letterHeader} onClick={() => setOpenLetter(open ? '' : l)}>
                <Text>
                  {l} · {words.length}词
                </Text>
                <Text className={styles.letterArrow}>{open ? '▲' : '▼'}</Text>
              </View>
              {open && (
                <View className={styles.flatGroup}>
                  {words.map((w) => (
                    <WordRow key={w.word} word={w} />
                  ))}
                </View>
              )}
            </View>
          );
        })}
        <View className={styles.listBottom} />
      </ScrollView>
      <View className={styles.letterBar}>
        {data.letters.map((l) => (
          <Text
            key={l}
            className={classnames(styles.letterItem, openLetter === l && styles.letterActive)}
            onClick={() => setOpenLetter(l)}
          >
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ---------- 前后词缀分段 ----------
function AffixesSegment() {
  return (
    <ScrollView scrollY className={styles.affixScroll} enhanced showScrollbar={false}>
      <View className={styles.groupPad}>
        <View className={styles.affixCol}>
          <Text className={styles.affixColTitle}>📖 常见前缀（{PREFIXES.length}）</Text>
          {PREFIXES.map((it) => (
            <View key={it.affix} className={styles.affixItem}>
              <Text className={styles.affixName}>{it.affix}</Text>
              <Text className={styles.affixMeaning}>{it.meaning}</Text>
            </View>
          ))}
        </View>
        <View className={styles.affixCol}>
          <Text className={styles.affixColTitle}>📖 常见后缀（{SUFFIXES.length}）</Text>
          {SUFFIXES.map((it) => (
            <View key={it.affix} className={styles.affixItem}>
              <Text className={styles.affixName}>{it.affix}</Text>
              <Text className={styles.affixMeaning}>{it.meaning}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const SEGMENTS: Array<{ key: VocabSegment; name: string }> = [
  { key: 'roots', name: '🪵 词根浏览' },
  { key: 'words', name: '📖 四级词汇' },
  { key: 'affixes', name: '📝 前后词缀' },
];

function VocabPage() {
  const ui = useUiState();
  const [segment, setSegment] = useState<VocabSegment>(ui.vocabSegment);

  // 主页九宫格跳转会先写入目标分段，这里在页面每次显示时消费
  useDidShow(() => {
    const target = consumeVocabSegment();
    if (target) setSegment(target);
  });

  return (
    <View className={styles.page}>
      <View className={styles.segmentBar}>
        {SEGMENTS.map((s) => (
          <View
            key={s.key}
            className={classnames(styles.segmentItem, segment === s.key && styles.segmentActive)}
            onClick={() => setSegment(s.key)}
          >
            <Text>{s.name}</Text>
          </View>
        ))}
      </View>
      <View className={styles.segmentBody}>
        {segment === 'roots' && <RootsSegment />}
        {segment === 'words' && <WordsSegment />}
        {segment === 'affixes' && <AffixesSegment />}
      </View>
    </View>
  );
}

export default VocabPage;
