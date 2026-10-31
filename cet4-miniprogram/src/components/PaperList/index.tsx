import React, { useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { groupPapersByYear, formatPaperId } from '@/data/paperList';
import { getStorage, KEY_EXAM_SCORES } from '@/utils/storage';
import type { ExamScoreRecord } from '@/utils/storage';
import ExamGuide from '@/components/ExamGuide';
import styles from './index.module.scss';

interface PaperListProps {
  mode: 'exam' | 'listen';
}

/** 按年份分组的真题选卷列表 */
function PaperList({ mode }: PaperListProps) {
  const groups = useMemo(() => groupPapersByYear(), []);
  const [scores, setScores] = useState<Record<string, number>>({});

  useDidShow(() => {
    if (mode !== 'exam') return;
    const records = getStorage<ExamScoreRecord[]>(KEY_EXAM_SCORES, []);
    const best: Record<string, number> = {};
    records.forEach((r) => {
      if (best[r.pid] === undefined || r.score > best[r.pid]) best[r.pid] = r.score;
    });
    setScores(best);
  });

  const start = (pid: string) => {
    Taro.navigateTo({
      url: `/packageExam/pages/quiz/index?pid=${pid}&mode=${mode}`,
    });
  };

  return (
    <View className={styles.wrap}>
      {mode === 'exam' && <ExamGuide />}

      {groups.map((g) => (
        <View key={g.year} className={styles.yearBlock}>
          <View className={styles.yearHead}>
            <Text className={styles.yearText}>{g.year} 年真题</Text>
            <Text className={styles.yearCount}>{g.papers.length} 套</Text>
          </View>
          {g.papers.map((pid) => (
            <View key={pid} className={styles.paperRow} onClick={() => start(pid)}>
              <View className={styles.paperMain}>
                <Text className={styles.paperTitle}>{formatPaperId(pid)}</Text>
                <Text className={styles.paperSub}>
                  {mode === 'exam' ? '130 分钟全真模考 · 55 道客观题' : '听力专项 · 25 题'}
                </Text>
              </View>
              {mode === 'exam' && scores[pid] !== undefined ? (
                <View className={styles.scoreTag}>
                  <Text className={styles.scoreNum}>{scores[pid]}</Text>
                  <Text className={styles.scoreLabel}>最高分</Text>
                </View>
              ) : (
                <Text className={styles.paperArrow}>›</Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export default PaperList;
