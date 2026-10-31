import React, { useMemo, useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { ALL_WORDS } from '@/data/wordsFlat';
import type { FlatWord } from '@/data/words';
import { goVocabSegment, useUiState } from '@/utils/uiStore';
import WordRow from '@/components/WordRow';
import styles from './index.module.scss';

interface GridItem {
  key: string;
  icon: string;
  name: string;
  color: string;
}

const GRID_ITEMS: GridItem[] = [
  { key: 'roots', icon: '🪵', name: '词根背单词', color: '#4f7cff' },
  { key: 'words', icon: '📖', name: '四级词汇', color: '#27ae60' },
  { key: 'affixes', icon: '📝', name: '前后词缀', color: '#ff7a59' },
  { key: 'search', icon: '🔍', name: '单词搜索', color: '#8e7cff' },
  { key: 'exam', icon: '📝', name: '真题模考', color: '#e67e22' },
  { key: 'listen', icon: '🎧', name: '听力训练', color: '#16a085' },
  { key: 'practice', icon: '✏️', name: '单词练习', color: '#3498db' },
  { key: 'favorites', icon: '⭐', name: '我的收藏', color: '#f1c40f' },
  { key: 'intensive', icon: '🚨', name: '考前应急', color: '#e74c3c' },
];

function HomePage() {
  const ui = useUiState();
  const [keyword, setKeyword] = useState('');
  const [focus, setFocus] = useState(false);

  const trimmed = keyword.trim();

  const results = useMemo<FlatWord[]>(() => {
    if (!trimmed) return [];
    const key = trimmed.toLowerCase();
    return ALL_WORDS.filter(
      (w) => w.word.toLowerCase().includes(key) || w.meaning.includes(trimmed)
    ).slice(0, 50);
  }, [trimmed]);

  const onGridTap = (item: GridItem) => {
    switch (item.key) {
      case 'roots':
      case 'words':
      case 'affixes':
        goVocabSegment(item.key);
        Taro.switchTab({ url: '/pages/vocab/index' });
        break;
      case 'search':
        setFocus(true);
        break;
      case 'exam':
        Taro.switchTab({ url: '/pages/exam/index' });
        break;
      case 'listen':
        Taro.switchTab({ url: '/pages/listen/index' });
        break;
      case 'practice':
        Taro.switchTab({ url: '/pages/practice/index' });
        break;
      case 'favorites':
        Taro.navigateTo({ url: '/pages/favorites/index' });
        break;
      case 'intensive':
        Taro.navigateTo({ url: '/pages/intensive/index' });
        break;
      default:
        break;
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.searchCard}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            value={keyword}
            focus={focus || ui.homeSearchFocus > 0}
            placeholder="搜索单词或中文释义"
            confirmType="search"
            onInput={(e) => setKeyword(e.detail.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
          {!!keyword && (
            <Text className={styles.clearBtn} onClick={() => setKeyword('')}>
              ✕
            </Text>
          )}
        </View>
        <Text className={styles.searchHint}>
          {trimmed ? `找到 ${results.length} 个相关单词` : '支持英文单词、中文释义模糊搜索'}
        </Text>
      </View>

      {!!trimmed && (
        <View className={styles.resultList}>
          {results.length === 0 ? (
            <View className={styles.resultHead}>没有找到相关单词，换个关键词试试</View>
          ) : (
            <>
              <View className={styles.resultHead}>
                搜索结果 <Text className={styles.resultCount}>{results.length}</Text> 条
                {results.length >= 50 ? '（仅显示前 50 条）' : ''}
              </View>
              {results.map((w) => (
                <WordRow key={w.word} word={w} showRoot />
              ))}
            </>
          )}
        </View>
      )}

      <View className={styles.gridWrap}>
        <View className={styles.grid}>
          {GRID_ITEMS.map((item) => (
            <View key={item.key} className={styles.gridItem} onClick={() => onGridTap(item)}>
              <View className={styles.gridIcon} style={{ backgroundColor: item.color }}>
                <Text>{item.icon}</Text>
              </View>
              <Text className={styles.gridName}>{item.name}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default HomePage;
