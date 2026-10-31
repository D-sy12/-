import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { FlatWord } from '@/data/words';
import StarButton from '@/components/StarButton';
import styles from './index.module.scss';

interface WordRowProps {
  word: FlatWord;
  showRoot?: boolean; // 显示词根标签（全部词汇/搜索/收藏）
  showAffix?: boolean; // 显示前后缀标签（词根浏览）
}

/** 通用单词行：点击进详情页，右侧星标收藏 */
function WordRow({ word, showRoot = false, showAffix = false }: WordRowProps) {
  const goDetail = () => {
    Taro.navigateTo({
      url: `/pages/word-detail/index?word=${encodeURIComponent(word.word)}`,
    });
  };

  return (
    <View className={styles.wordItem} onClick={goDetail}>
      <View className={styles.wordMain}>
        <View className={styles.wordHead}>
          <Text className={styles.wordEn}>{word.word}</Text>
          {!!word.phonetic && <Text className={styles.wordPhonetic}>{word.phonetic}</Text>}
        </View>
        {(showAffix && (word.prefix || word.suffix)) && (
          <View className={styles.affixLine}>
            {!!word.prefix && <Text className={styles.affixPrefix}>前缀：{word.prefix}</Text>}
            {!!word.suffix && <Text className={styles.affixSuffix}>后缀：{word.suffix}</Text>}
          </View>
        )}
        {showRoot && !!word.root && <Text className={styles.rootTag}>词根：{word.root}（{word.rootMeaning}）</Text>}
        <Text className={styles.wordCn}>{word.meaning}</Text>
      </View>
      <StarButton word={word.word} />
    </View>
  );
}

export default WordRow;
