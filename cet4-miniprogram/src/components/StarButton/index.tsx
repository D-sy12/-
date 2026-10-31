import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useFavorites, toggleFavorite } from '@/utils/favorites';
import styles from './index.module.scss';

interface StarButtonProps {
  word: string;
  size?: 'sm' | 'md';
}

/** 星标收藏按钮（点击不冒泡，避免触发整行跳转） */
function StarButton({ word, size = 'sm' }: StarButtonProps) {
  const favorites = useFavorites();
  const active = favorites.some((w) => w.toLowerCase() === word.toLowerCase());

  const onClick = (e: any) => {
    // Taro 事件对象：阻止冒泡到 WordRow 的点击
    e?.stopPropagation?.();
    const now = toggleFavorite(word);
    Taro.showToast({
      title: now ? '已收藏' : '已取消收藏',
      icon: 'none',
      duration: 1000,
    });
  };

  return (
    <View
      className={classnames(styles.star, styles[size], active && styles.active)}
      onClick={onClick}
    >
      <Text className={styles.icon}>{active ? '★' : '☆'}</Text>
    </View>
  );
}

export default StarButton;
