import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { ALL_WORDS } from '@/data/wordsFlat';
import type { FlatWord } from '@/data/words';
import { useFavorites, toggleFavorite, isFavorite } from '@/utils/favorites';
import { addWordPracticeLog } from '@/utils/storage';
import Empty from '@/components/Empty';
import styles from './index.module.scss';

type Mode = 'cn2en' | 'en2cn';
type Source = 'all' | 'fav';
type ResultKind = 'correct' | 'wrong' | 'show';

interface ResultState {
  kind: ResultKind;
  autoFaved?: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 看英文写中文的宽松判分：释义任一中文片段被答案包含即算对
function gradeEn2Cn(meaning: string, input: string): boolean {
  const cnParts = meaning
    .split(/[;；,，]/)
    .map((s) => s.trim())
    .filter((s) => /[\u4e00-\u9fa5]/.test(s));
  return cnParts.some((part) => input.includes(part.replace(/[a-zA-Z.]/g, '').trim()));
}

function PracticePage() {
  const favorites = useFavorites();
  const [mode, setMode] = useState<Mode>('cn2en');
  const [source, setSource] = useState<Source>('all');
  const [roundKey, setRoundKey] = useState(0);

  const [words, setWords] = useState<FlatWord[]>([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [input, setInput] = useState('');
  const [shown, setShown] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [finished, setFinished] = useState(false);

  const sourceWords = useMemo(() => {
    if (source === 'fav') {
      const favSet = new Set(favorites);
      return ALL_WORDS.filter((w) => favSet.has(w.word));
    }
    return ALL_WORDS;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, favorites.length]);

  const startRound = React.useCallback(() => {
    setWords(shuffle(sourceWords));
    setIdx(0);
    setCorrect(0);
    setWrong(0);
    setInput('');
    setShown(false);
    setResult(null);
    setFinished(false);
  }, [sourceWords]);

  // 模式/词源/重开 时重新出题
  useEffect(() => {
    startRound();
  }, [mode, source, roundKey, startRound]);

  const current = words[idx];
  const total = words.length;
  const answered = correct + wrong;
  const rate = answered ? Math.round((correct / answered) * 100) : 0;

  const doCheck = () => {
    if (!current) return;
    const ans = input.trim();
    if (!ans) {
      Taro.showToast({ title: '请先输入答案', icon: 'none' });
      return;
    }
    let ok = false;
    let autoFaved = false;
    if (mode === 'cn2en') {
      ok = ans.toLowerCase() === current.word.toLowerCase();
    } else {
      ok = gradeEn2Cn(current.meaning, ans);
    }
    if (ok) {
      setCorrect((c) => c + 1);
    } else {
      setWrong((c) => c + 1);
      if (!isFavorite(current.word)) {
        toggleFavorite(current.word);
        autoFaved = true;
      }
    }
    setResult({ kind: ok ? 'correct' : 'wrong', autoFaved });
    setShown(true);
  };

  const doSkip = () => {
    goNext();
  };

  const doShow = () => {
    setResult({ kind: 'show' });
    setShown(true);
  };

  const goNext = () => {
    if (idx + 1 >= total) {
      // 本轮结束：落库（此刻 correct/wrong 为最新渲染闭包值）
      const finalAnswered = correct + wrong;
      const finalRate = finalAnswered ? Math.round((correct / finalAnswered) * 100) : 0;
      addWordPracticeLog({
        total,
        correct,
        wrong,
        rate: finalRate,
        date: new Date().toISOString(),
      });
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
      setInput('');
      setShown(false);
      setResult(null);
    }
  };

  const handleNext = goNext;

  return (
    <View className={styles.page}>
      {/* 快捷入口 */}
      <View className={styles.quickEntries}>
        <View className={styles.quickCard} onClick={() => Taro.navigateTo({ url: '/pages/favorites/index' })}>
          <Text className={styles.quickIcon}>⭐</Text>
          <Text className={styles.quickName}>我的收藏{favorites.length ? `（${favorites.length}）` : ''}</Text>
        </View>
        <View className={styles.quickCard} onClick={() => Taro.navigateTo({ url: '/pages/intensive/index' })}>
          <Text className={styles.quickIcon}>🚨</Text>
          <Text className={styles.quickName}>考前应急</Text>
        </View>
      </View>

      {/* 模式切换 */}
      <View className={styles.modeBar}>
        <View
          className={classnames(styles.modeBtn, mode === 'cn2en' && styles.modeActive)}
          onClick={() => setMode('cn2en')}
        >
          看中文写英文
        </View>
        <View
          className={classnames(styles.modeBtn, mode === 'en2cn' && styles.modeActive)}
          onClick={() => setMode('en2cn')}
        >
          看英文写中文
        </View>
      </View>

      {/* 词源 */}
      <View className={styles.sourceBar}>
        <View
          className={classnames(styles.sourceOpt, source === 'all' && styles.sourceActive)}
          onClick={() => setSource('all')}
        >
          四级词汇
        </View>
        <View
          className={classnames(styles.sourceOpt, source === 'fav' && styles.sourceActive)}
          onClick={() => setSource('fav')}
        >
          仅收藏（{favorites.length}）
        </View>
      </View>

      {total === 0 ? (
        <Empty
          icon="⭐"
          text="收藏夹里还没有单词"
          hint="先去词根浏览或搜索中收藏难记的单词吧"
        />
      ) : finished ? (
        <View className={styles.summaryCard}>
          <Text className={styles.summaryEmoji}>🎉</Text>
          <Text className={styles.summaryTitle}>练习完成！</Text>
          <View className={styles.summaryStats}>
            <View className={styles.sumItem}>
              <Text className={styles.sumNum}>{total}</Text>
              <Text className={styles.sumLabel}>总题数</Text>
            </View>
            <View className={styles.sumItem}>
              <Text className={classnames(styles.sumNum, styles.good)}>{correct}</Text>
              <Text className={styles.sumLabel}>正确</Text>
            </View>
            <View className={styles.sumItem}>
              <Text className={classnames(styles.sumNum, styles.bad)}>{wrong}</Text>
              <Text className={styles.sumLabel}>错误</Text>
            </View>
            <View className={styles.sumItem}>
              <Text className={styles.sumNum}>{rate}%</Text>
              <Text className={styles.sumLabel}>正确率</Text>
            </View>
          </View>
          <Text className={styles.sumTip}>答错的单词已自动加入收藏，方便重点复习</Text>
          <Button className={styles.againBtn} onClick={() => setRoundKey((k) => k + 1)}>
            再来一轮
          </Button>
        </View>
      ) : (
        current && (
          <View className={styles.practiceCard}>
            <View className={styles.progress}>
              第 <Text className={styles.progressNum}>{idx + 1}</Text> / {total} 题
              {answered > 0 && (
                <Text className={styles.liveRate}>
                  正确 {correct} · 错误 {wrong} · 正确率 {rate}%
                </Text>
              )}
            </View>

            <View className={styles.prompt}>
              {mode === 'cn2en' ? (
                <Text className={styles.promptCn}>{current.meaning}</Text>
              ) : (
                <View className={styles.promptEnWrap}>
                  <Text className={styles.promptEn}>{current.word}</Text>
                  <Text className={styles.promptPhonetic}>{current.phonetic}</Text>
                </View>
              )}
              {mode === 'cn2en' && current.root && (
                <Text className={styles.promptHint}>
                  提示：词根 {current.root}（{current.rootMeaning}）
                </Text>
              )}
            </View>

            <Input
              className={styles.answerInput}
              value={input}
              placeholder={mode === 'cn2en' ? '在这里输入英文单词…' : '输入中文释义（关键词即可）…'}
              confirmType="done"
              onInput={(e) => setInput(e.detail.value)}
              onConfirm={() => (shown ? handleNext() : doCheck())}
            />

            <View className={styles.actions}>
              <Button
                className={classnames(styles.actBtn, styles.primaryBtn)}
                onClick={() => (shown ? handleNext() : doCheck())}
              >
                {shown ? (idx + 1 >= total ? '查看成绩' : '下一题') : '提交答案'}
              </Button>
              <View className={styles.actRow}>
                <Button className={classnames(styles.actBtn, styles.ghostBtn)} onClick={doSkip}>
                  跳过
                </Button>
                <Button className={classnames(styles.actBtn, styles.ghostBtn)} onClick={doShow}>
                  显示答案
                </Button>
              </View>
            </View>

            {result && (
              <View
                className={classnames(
                  styles.resultBox,
                  result.kind === 'correct' && styles.resCorrect,
                  result.kind === 'wrong' && styles.resWrong,
                  result.kind === 'show' && styles.resShow
                )}
              >
                {result.kind === 'correct' && (
                  <Text className={styles.resTitle}>✅ 正确！</Text>
                )}
                {result.kind === 'wrong' && <Text className={styles.resTitle}>❌ 错误。</Text>}
                {result.kind === 'show' && <Text className={styles.resTitle}>参考答案</Text>}
                <View className={styles.resAnswer}>
                  <Text className={styles.resWord}>{current.word}</Text>
                  {!!current.phonetic && <Text className={styles.resPhonetic}>{current.phonetic}</Text>}
                </View>
                <Text className={styles.resMeaning}>{current.meaning}</Text>
                {result.autoFaved && <Text className={styles.resFav}>已自动加入收藏 ⭐</Text>}
              </View>
            )}
          </View>
        )
      )}
    </View>
  );
}

export default PracticePage;
