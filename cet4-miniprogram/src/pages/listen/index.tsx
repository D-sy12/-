import React from 'react';
import { View, Text } from '@tarojs/components';
import PaperList from '@/components/PaperList';
import styles from './index.module.scss';

function ListenPage() {
  return (
    <View className={styles.page}>
      <View className={styles.banner}>
        <Text className={styles.bannerTitle}>🎧 真题听力训练</Text>
        <Text className={styles.bannerDesc}>
          选择一套真题，在线播放听力音频；支持英文原文 / 中文译文 / 题目译文对照，两种判分模式自由切换
        </Text>
      </View>
      <PaperList mode="listen" />
    </View>
  );
}

export default ListenPage;
