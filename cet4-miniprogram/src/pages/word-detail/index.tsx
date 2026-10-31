import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { CET4_WORDS } from '@/data/words';
import type { FlatWord, WordEntry, RootGroup } from '@/data/words';
import { ALL_WORDS } from '@/data/wordsFlat';
import StarButton from '@/components/StarButton';
import Empty from '@/components/Empty';
import styles from './index.module.scss';

function WordDetailPage() {
  const router = useRouter();
  const word = decodeURIComponent(router.params.word || '');

  const detail = useMemo(() => {
    const hit = ALL_WORDS.find((w) => w.word === word);
    let group: RootGroup | undefined;
    if (hit?.root) {
      group = CET4_WORDS.find((g) => g.root === hit.root);
    } else {
      // 兜底：即使没有词根标注，也尝试在词根库中匹配
      group = CET4_WORDS.find((g) => g.words.some((x) => x.word === word));
    }
    return { hit, group };
  }, [word]);

  const { hit, group } = detail;

  const goWord = (w: string) => {
    Taro.redirectTo({
      url: `/pages/word-detail/index?word=${encodeURIComponent(w)}`,
    });
  };

  if (!hit) {
    return (
      <View className={styles.page}>
        <Empty icon="🔍" text="未找到该单词" hint="返回列表重新选择吧" />
      </View>
    );
  }

  const flat: FlatWord = hit;
  const related: Array<WordEntry & { isSelf: boolean }> = group
    ? group.words.map((w) => ({ ...w, isSelf: w.word === word }))
    : [];

  return (
    <View className={styles.page}>
      {/* 主卡 */}
      <View className={styles.heroCard}>
        <View className={styles.heroTop}>
          <Text className={styles.word}>{flat.word}</Text>
          <StarButton word={flat.word} size="md" />
        </View>
        {!!flat.phonetic && <Text className={styles.phonetic}>{flat.phonetic}</Text>}
        <Text className={styles.meaning}>{flat.meaning}</Text>

        {(group || flat.prefix || flat.suffix) && (
          <View className={styles.tagBox}>
            {group && (
              <View className={styles.tag}>
                <Text className={styles.tagLabel}>词根</Text>
                <Text className={styles.tagValue}>
                  {group.root}（{group.meaning}）
                </Text>
              </View>
            )}
            {!!flat.prefix && (
              <View className={styles.tag}>
                <Text className={styles.tagLabel}>前缀</Text>
                <Text className={styles.tagValue}>{flat.prefix}</Text>
              </View>
            )}
            {!!flat.suffix && (
              <View className={styles.tag}>
                <Text className={styles.tagLabel}>后缀</Text>
                <Text className={styles.tagValue}>{flat.suffix}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 同根词扩展 */}
      {related.length > 0 && (
        <View className={styles.relCard}>
          <View className={styles.relHead}>
            <Text className={styles.relTitle}>同词根扩展词</Text>
            <Text className={styles.relSub}>
              词根 {group!.root} · {related.length} 词
            </Text>
          </View>
          <View className={styles.relList}>
            {related.map((w) => (
              <View
                key={w.word}
                className={w.isSelf ? styles.relItemSelf : styles.relItem}
                onClick={() => !w.isSelf && goWord(w.word)}
              >
                <View className={styles.relMain}>
                  <Text className={styles.relWord}>{w.word}</Text>
                  <Text className={styles.relMeaning}>{w.meaning}</Text>
                </View>
                {w.isSelf ? (
                  <Text className={styles.selfTag}>当前</Text>
                ) : (
                  <Text className={styles.relArrow}>›</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default WordDetailPage;
