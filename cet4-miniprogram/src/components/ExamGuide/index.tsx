import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface SectionRow {
  part: string;
  content: string;
  time: string;
  score: string;
}

const SECTION_ROWS: SectionRow[] = [
  { part: 'Part I', content: '写作', time: '30 分钟', score: '15%（106.5 分）' },
  { part: 'Part II', content: '听力理解（25 题）', time: '25 分钟', score: '35%（248.5 分）' },
  { part: 'Part III', content: '阅读理解（30 题）', time: '40 分钟', score: '35%（248.5 分）' },
  { part: 'Part IV', content: '翻译（汉译英）', time: '30 分钟', score: '15%（106.5 分）' },
];

const TIPS: Array<{ title: string; items: string[] }> = [
  {
    title: '🧭 时间怎么分',
    items: [
      '写作 30 分钟：先花 3 分钟列提纲，正文分三段，留 2 分钟检查拼写与语法。',
      '听力 25 分钟：利用读题时间先看选项，听关键词，不要在一题上纠缠。',
      '阅读 40 分钟：选词填空 10 分钟、长篇阅读 12 分钟、仔细阅读 18 分钟。',
      '翻译 30 分钟：先通读原文抓主干，再逐句翻译，最后检查时态与单复数。',
    ],
  },
  {
    title: '📝 客观题技巧',
    items: [
      '选词填空先判断空格词性，再从词库中匹配，不确定的先跳过。',
      '长篇阅读先读题干圈关键词，再回原文定位段落，优先做有明显同义替换的题。',
      '仔细阅读按顺序定位，注意转折词 but / however 后的内容。',
      '所有客观题都要填涂，不要空题，交卷前统一核对答题卡。',
    ],
  },
  {
    title: '⚠️ 注意事项',
    items: [
      '听力音频只播放一遍，开始播放后不要暂停或退出页面。',
      '本模考按 130 分钟倒计时，时间到会自动交卷。',
      '写作与翻译为主观题，系统不自动评分，请对照参考范文自评。',
      '模考成绩会保存在本地，可在选卷列表查看历史最高分。',
    ],
  },
];

/** 考试说明 / 分值分布 / 答题技巧（可折叠） */
function ExamGuide() {
  const [open, setOpen] = useState<number | null>(0);
  const toggle = (i: number) => setOpen((cur) => (cur === i ? null : i));

  return (
    <View className={styles.wrap}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>四级真题模考 · 考前必读</Text>
        <Text className={styles.heroSub}>130 分钟全真计时，客观题即时出分</Text>
        <View className={styles.heroStats}>
          <View className={styles.heroStat}>
            <Text className={styles.heroNum}>710</Text>
            <Text className={styles.heroLabel}>总分</Text>
          </View>
          <View className={styles.heroStat}>
            <Text className={styles.heroNum}>130</Text>
            <Text className={styles.heroLabel}>分钟</Text>
          </View>
          <View className={styles.heroStat}>
            <Text className={styles.heroNum}>55</Text>
            <Text className={styles.heroLabel}>客观题</Text>
          </View>
        </View>
      </View>

      {SECTION_ROWS && (
        <View className={styles.card}>
          <View className={styles.cardHead} onClick={() => toggle(0)}>
            <Text className={styles.cardTitle}>📊 题型与分值分布</Text>
            <Text className={classnames(styles.arrow, open === 0 && styles.arrowOpen)}>⌄</Text>
          </View>
          {open === 0 && (
            <View className={styles.cardBody}>
              <View className={styles.table}>
                <View className={classnames(styles.tr, styles.th)}>
                  <Text className={styles.td}>部分</Text>
                  <Text className={styles.td}>内容</Text>
                  <Text className={styles.td}>时间</Text>
                  <Text className={styles.td}>分值</Text>
                </View>
                {SECTION_ROWS.map((row) => (
                  <View key={row.part} className={styles.tr}>
                    <Text className={styles.td}>{row.part}</Text>
                    <Text className={styles.td}>{row.content}</Text>
                    <Text className={styles.td}>{row.time}</Text>
                    <Text className={styles.td}>{row.score}</Text>
                  </View>
                ))}
                <View className={classnames(styles.tr, styles.totalRow)}>
                  <Text className={styles.td}>合计</Text>
                  <Text className={styles.td}>写作 + 听力 + 阅读 + 翻译</Text>
                  <Text className={styles.td}>130 分钟</Text>
                  <Text className={styles.td}>710 分</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {TIPS.map((tip, i) => {
        const idx = i + 1;
        return (
          <View key={tip.title} className={styles.card}>
            <View className={styles.cardHead} onClick={() => toggle(idx)}>
              <Text className={styles.cardTitle}>{tip.title}</Text>
              <Text className={classnames(styles.arrow, open === idx && styles.arrowOpen)}>⌄</Text>
            </View>
            {open === idx && (
              <View className={styles.cardBody}>
                {tip.items.map((item, k) => (
                  <Text key={k} className={styles.tipItem}>
                    · {item}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <View className={styles.tipBox}>
        首次模考建议先完整做一套，熟悉流程后再针对性刷分；听力与阅读占总分 70%，优先突破。
      </View>
    </View>
  );
}

export default ExamGuide;
