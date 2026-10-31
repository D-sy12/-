import React from 'react';
import { View, Text } from '@tarojs/components';
import PaperList from '@/components/PaperList';
import styles from './index.module.scss';

function ExamPage() {
  return (
    <View className={styles.page}>
      <View className={styles.banner}>
        <Text className={styles.bannerTitle}>📝 四级真题模考</Text>
        <Text className={styles.bannerDesc}>
          130 分钟全真计时：写作 / 听力 / 选词填空 / 长篇阅读 / 仔细阅读 / 翻译，交卷即时出分并生成错题对照
        </Text>
      </View>
      <PaperList mode="exam" />
    </View>
  );
}

export default ExamPage;
