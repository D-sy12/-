import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { ALL_WORDS } from '@/data/wordsFlat';
import type { FlatWord } from '@/data/words';
import { useFavorites } from '@/utils/favorites';
import WordRow from '@/components/WordRow';
import Empty from '@/components/Empty';
import styles from './index.module.scss';

function FavoritesPage() {
  const favorites = useFavorites();

  // 以收藏顺序为准；ALL_WORDS 中查不到的极少数字眼直接跳过
  const list = useMemo<FlatWord[]>(() => {
    const map = new Map<string, FlatWord>();
    ALL_WORDS.forEach((w) => map.set(w.word, w));
    const out: FlatWord[] = [];
    favorites.forEach((w) => {
      const hit = map.get(w);
      if (hit) out.push(hit);
    });
    return out;
  }, [favorites]);

  return (
    <View className={styles.page}>
      {list.length === 0 ? (
        <Empty
          icon="⭐"
          text="还没有收藏任何单词"
          hint="在单词行右侧点星标收藏，或练习答错的单词会自动收藏"
        />
      ) : (
        <>
          <View className={styles.head}>
            <Text className={styles.headText}>
              共收藏 <Text className={styles.headNum}>{list.length}</Text> 个单词
            </Text>
            <Text
              className={styles.headAction}
              onClick={() => Taro.switchTab({ url: '/pages/practice/index' })}
            >
              去练收藏词 ›
            </Text>
          </View>
          <View className={styles.listWrap}>
            {list.map((w) => (
              <WordRow key={w.word} word={w} showRoot />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

export default FavoritesPage;
