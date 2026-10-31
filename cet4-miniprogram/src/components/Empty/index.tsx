import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyProps {
  icon?: string;
  text: string;
  hint?: string;
}

/** 通用空状态 */
function Empty({ icon = '📭', text, hint }: EmptyProps) {
  return (
    <View className={styles.empty}>
      <Text className={styles.icon}>{icon}</Text>
      <Text className={styles.text}>{text}</Text>
      {!!hint && <Text className={styles.hint}>{hint}</Text>}
    </View>
  );
}

export default Empty;
