import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface ScoreCircleProps {
  score: number;
  size?: 'md' | 'lg';
}

/** 百分制得分圆环：≥85 绿色，≥60 蓝色，其余红色 */
function ScoreCircle({ score, size = 'md' }: ScoreCircleProps) {
  const level = score >= 85 ? 'good' : score >= 60 ? 'mid' : 'bad';
  return (
    <View className={classnames(styles.circle, styles[size], styles[level])}>
      <Text className={styles.num}>{score}</Text>
    </View>
  );
}

export default ScoreCircle;
