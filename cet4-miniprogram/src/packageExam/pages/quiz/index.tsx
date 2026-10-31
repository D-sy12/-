import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { getPaper } from '../../data/papers';
import { audioUrl } from '@/utils/config';
import { formatPaperId } from '@/data/paperList';
import type { Paper, ListenQuestion, ReviewItem } from '@/types/paper';
import { addListenPracticeLog, addExamScore } from '@/utils/storage';
import ScoreCircle from '@/components/ScoreCircle';
import Empty from '@/components/Empty';
import styles from './index.module.scss';

type AudioCtx = ReturnType<typeof Taro.createInnerAudioContext>;

const EXAM_TOTAL_SECONDS = 130 * 60;

// ============================================================
// 通用小组件
// ============================================================

/** 远程听力音频播放条（离开页面自动销毁） */
function AudioBar({ pid }: { pid: string }) {
  const ctxRef = useRef<AudioCtx | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const ctx = Taro.createInnerAudioContext();
    ctx.src = audioUrl(pid);
    ctx.autoplay = false;
    ctx.onPlay(() => {
      setPlaying(true);
      setFailed(false);
    });
    ctx.onPause(() => setPlaying(false));
    ctx.onEnded(() => setPlaying(false));
    ctx.onError((err) => {
      console.error('[Audio] playback error', err);
      setPlaying(false);
      setFailed(true);
    });
    ctx.onTimeUpdate(() => {
      setCur(ctx.currentTime || 0);
      if (ctx.duration) setDur(ctx.duration);
    });
    ctxRef.current = ctx;
    return () => {
      ctx.destroy();
      ctxRef.current = null;
    };
  }, [pid]);

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return '00:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const toggle = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (playing) ctx.pause();
    else ctx.play();
  };

  return (
    <View className={styles.audioBar}>
      <View className={styles.audioBtn} onClick={toggle}>
        {playing ? '⏸' : '▶️'}
      </View>
      <View className={styles.audioInfo}>
        <Text className={styles.audioTitle}>
          {failed ? '⚠️ 音频加载失败（仍可作答）' : playing ? '正在播放听力音频…' : '点击播放听力音频'}
        </Text>
        <Text className={styles.audioTime}>
          {fmt(cur)} / {fmt(dur)}
        </Text>
      </View>
    </View>
  );
}

type OptState = 'none' | 'selected' | 'correct' | 'wrong';

function OptionRow({
  letter,
  text,
  state,
  disabled,
  onClick,
}: {
  letter: string;
  text: string;
  state: OptState;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <View
      className={classnames(
        styles.opt,
        state === 'selected' && styles.optSelected,
        state === 'correct' && styles.optCorrect,
        state === 'wrong' && styles.optWrong,
        disabled && styles.optDisabled
      )}
      onClick={() => !disabled && onClick()}
    >
      <Text className={styles.optLetter}>{letter})</Text>
      <Text className={styles.optText}>{text}</Text>
    </View>
  );
}

/** 小开关 */
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <View className={styles.switchItem} onClick={onChange}>
      <View className={classnames(styles.switchBox, checked && styles.switchOn)}>
        {checked && <Text className={styles.switchTick}>✓</Text>}
      </View>
      <Text className={styles.switchLabel}>{label}</Text>
    </View>
  );
}

/** 段落文本（按换行拆段） */
function Passage({ text }: { text: string }) {
  const paras = (text || '').split(/\n+/).filter((p) => p.trim());
  return (
    <View className={styles.passage}>
      {paras.map((p, i) => (
        <Text key={i} className={styles.passageP}>
          {p}
        </Text>
      ))}
    </View>
  );
}

/** 结果得分 + 统计 */
function ResultSummary({
  score,
  lines,
  note,
}: {
  score: number;
  lines: Array<[string, string]>;
  note?: string;
}) {
  return (
    <View className={styles.scoreBox}>
      <ScoreCircle score={score} size="lg" />
      <View className={styles.scoreLines}>
        {lines.map(([k, v]) => (
          <Text key={k} className={styles.scoreLine}>
            {k} <Text className={styles.scoreStrong}>{v}</Text>
          </Text>
        ))}
        {!!note && <Text className={styles.scoreNote}>{note}</Text>}
      </View>
    </View>
  );
}

/** 答题对照网格 */
function ReviewGrid({ review }: { review: ReviewItem[] }) {
  return (
    <View className={styles.reviewHead}>
      <Text className={styles.reviewTitle}>📋 答题对照</Text>
      <View className={styles.reviewGrid}>
        {review.map((r) => (
          <View key={r.num} className={classnames(styles.reviewCell, r.right ? styles.cellRight : styles.cellWrong)}>
            <Text className={styles.cellNum}>{r.num}</Text>
            <Text className={styles.cellUser}>{r.user || '未答'}</Text>
            <Text className={styles.cellCorrect}>{r.correct}</Text>
            <Text className={styles.cellMark}>{r.right ? '✓' : '✗'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function buildReview(paper: Paper, answers: Record<number, string>): ReviewItem[] {
  return Object.keys(paper.answers)
    .map((numStr) => {
      const num = parseInt(numStr, 10);
      const correct = paper.answers[numStr];
      const user = answers[num] || '';
      return { num, correct, user, right: user.toUpperCase() === correct.toUpperCase() };
    })
    .sort((a, b) => a.num - b.num);
}

// ============================================================
// 听力模式
// ============================================================

type ListenMode = 'overall' | 'perQ';

function ListenRunner({ paper }: { paper: Paper }) {
  const qs = paper.listening;
  const total = qs.length;
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<ListenMode>('overall');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [answeredSet, setAnsweredSet] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);

  const [scriptEn, setScriptEn] = useState(false);
  const [scriptCn, setScriptCn] = useState(false);
  const [qStem, setQStem] = useState(false);
  const [qCn, setQCn] = useState(false);

  const q: ListenQuestion = qs[idx];
  const userAns = answers[q.num] || '';
  const correctAns = paper.answers[String(q.num)] || '';
  const answered = answeredSet.has(q.num);
  const locked = mode === 'perQ' && answered;

  const pick = (letter: string) => {
    if (locked) return;
    setAnswers((prev) => ({ ...prev, [q.num]: letter }));
    setAnsweredSet((prev) => {
      if (prev.has(q.num)) return prev;
      const next = new Set(prev);
      next.add(q.num);
      return next;
    });
  };

  // 逐题模式下实时得分
  const liveCorrect = useMemo(
    () =>
      qs.filter(
        (item) =>
          answeredSet.has(item.num) &&
          (answers[item.num] || '').toUpperCase() === (paper.answers[String(item.num)] || '').toUpperCase()
      ).length,
    [answers, answeredSet, qs, paper.answers]
  );

  const finish = () => {
    let correct = 0;
    qs.forEach((item) => {
      const ua = (answers[item.num] || '').toUpperCase();
      const ca = (paper.answers[String(item.num)] || '').toUpperCase();
      if (ua && ua === ca) correct++;
    });
    const score = total ? Math.round((correct / total) * 100) : 0;
    addListenPracticeLog({
      pid: paper.id,
      score,
      correct,
      total,
      answered: answeredSet.size,
      date: new Date().toISOString(),
    });
    setFinished(true);
  };

  const review = useMemo(() => {
    if (!finished) return [];
    return qs.map((item) => {
      const ua = answers[item.num] || '';
      const ca = paper.answers[String(item.num)] || '';
      return { num: item.num, correct: ca, user: ua, right: ua.toUpperCase() === ca.toUpperCase() };
    });
  }, [finished, qs, answers, paper.answers]);

  if (finished) {
    const correctCount = review.filter((r) => r.right).length;
    return (
      <View className={styles.resultPage}>
        <ResultSummary
          score={total ? Math.round((correctCount / total) * 100) : 0}
          lines={[
            ['正确', `${correctCount} / ${total} 题`],
            ['已作答', `${answeredSet.size} / ${total} 题`],
            ['听力得分率', `${total ? Math.round((correctCount / total) * 100) : 0}%`],
          ]}
        />
        <View className={styles.resultBtns}>
          <View className={styles.ghostWide} onClick={() => Taro.navigateBack()}>
            ← 再选一套
          </View>
        </View>
        <ReviewGrid review={review} />
      </View>
    );
  }

  const feedbackRight = userAns.toUpperCase() === correctAns.toUpperCase();

  return (
    <View className={styles.runPage}>
      {/* 顶部信息条 */}
      <View className={styles.listenTopBar}>
        <View className={styles.modeSeg}>
          <View
            className={classnames(styles.segBtn, mode === 'overall' && styles.segActive)}
            onClick={() => setMode('overall')}
          >
            统一判分
          </View>
          <View
            className={classnames(styles.segBtn, mode === 'perQ' && styles.segActive)}
            onClick={() => setMode('perQ')}
          >
            逐题判分
          </View>
        </View>
        <Text className={styles.listenScore}>
          第 {idx + 1}/{total} 题 · 得分 {mode === 'perQ' ? liveCorrect : '—'}
        </Text>
      </View>

      <AudioBar pid={paper.id} />

      {/* 辅助开关 */}
      <View className={styles.toggleCard}>
        <View className={styles.toggleRow}>
          <Switch label="材料英文原文" checked={scriptEn} onChange={() => setScriptEn((v) => !v)} />
          <Switch label="材料中文译文" checked={scriptCn} onChange={() => setScriptCn((v) => !v)} />
        </View>
        <View className={styles.toggleRow}>
          <Switch label="题目原文" checked={qStem} onChange={() => setQStem((v) => !v)} />
          <Switch label="题目译文" checked={qCn} onChange={() => setQCn((v) => !v)} />
        </View>
      </View>

      {/* 听力原文 / 译文 */}
      {scriptEn && (
        <View className={styles.scriptBox}>
          <Text className={styles.scriptTitle}>英文原文</Text>
          <Passage text={paper.listening_script?.en || ''} />
          {!paper.listening_script?.en && <Text className={styles.scriptNone}>暂无本套试卷的英文原文</Text>}
        </View>
      )}
      {scriptCn && (
        <View className={styles.scriptBox}>
          <Text className={styles.scriptTitle}>中文译文</Text>
          <Passage text={paper.listening_script?.cn || ''} />
          {!paper.listening_script?.cn && <Text className={styles.scriptNone}>暂无本套试卷的中文译文</Text>}
        </View>
      )}

      {/* 题目卡 */}
      <View className={styles.qCard}>
        <Text className={styles.qNum}>第 {q.num} 题</Text>

        {qStem && !!q.stem && (
          <View className={styles.qStemEn}>
            <Text className={styles.qStemLabel}>Q.</Text>
            <Text className={styles.qStemText}>{q.stem}</Text>
          </View>
        )}
        {qCn && (
          <View className={styles.qCnBox}>
            {!!q.stem_cn && (
              <View className={styles.qCnStem}>
                <Text className={styles.qStemLabel}>题目：</Text>
                <Text className={styles.qStemText}>{q.stem_cn}</Text>
              </View>
            )}
            {!!q.options_cn && Object.keys(q.options_cn).length > 0 && (
              <View className={styles.qCnOpts}>
                {Object.entries(q.options_cn).map(([l, t]) => (
                  <Text key={l} className={styles.qCnOpt}>
                    {l}) {t}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        <View className={styles.optList}>
          {Object.entries(q.options).map(([l, t]) => {
            let state: OptState = 'none';
            if (locked) {
              if (l === correctAns) state = 'correct';
              else if (l === userAns) state = 'wrong';
            } else if (l === userAns) {
              state = 'selected';
            }
            return <OptionRow key={l} letter={l} text={t} state={state} disabled={locked} onClick={() => pick(l)} />;
          })}
        </View>

        {locked && (
          <View className={classnames(styles.feedback, feedbackRight ? styles.fbRight : styles.fbWrong)}>
            {feedbackRight ? '🎉 回答正确！' : `❌ 回答错误，正确答案是 ${correctAns}`}
          </View>
        )}
        {!locked && mode === 'overall' && answered && (
          <View className={classnames(styles.feedback, styles.fbPending)}>
            ✓ 已作答（{userAns}），全部完成后统一对答案
          </View>
        )}
      </View>

      {/* 翻页 */}
      <View className={styles.pager}>
        <View
          className={classnames(styles.pagerBtn, styles.pagerGhost, idx === 0 && styles.pagerHidden)}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
        >
          上一题
        </View>
        <View
          className={classnames(styles.pagerBtn, styles.pagerPrimary)}
          onClick={() => (idx + 1 >= total ? finish() : setIdx((i) => i + 1))}
        >
          {idx + 1 >= total ? '查看结果' : '下一题'}
        </View>
      </View>
    </View>
  );
}

// ============================================================
// 模考模式
// ============================================================

const BANK_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
const LR_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

function ExamRunner({ paper }: { paper: Paper }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [remaining, setRemaining] = useState(EXAM_TOTAL_SECONDS);
  const [submitted, setSubmitted] = useState(false);
  const submitRef = useRef<() => void>(() => {});

  const setAns = (num: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [num]: val }));
  };

  const doSubmit = () => {
    const review = buildReview(paper, answers);
    const correct = review.filter((r) => r.right).length;
    const total = review.length;
    const score = total ? Math.round((correct / total) * 100) : 0;
    addExamScore({ pid: paper.id, score, correct, total, date: new Date().toISOString() });
    setSubmitted(true);
  };
  submitRef.current = doSubmit;

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          Taro.showToast({ title: '考试时间到，自动交卷！', icon: 'none', duration: 2000 });
          setTimeout(() => submitRef.current(), 300);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fmtHMS = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const answeredCount = Object.values(answers).filter((v) => !!v).length;

  const confirmSubmit = () => {
    const total = Object.keys(paper.answers).length;
    const unanswered = total - answeredCount;
    Taro.showModal({
      title: '确认交卷？',
      content: unanswered > 0 ? `还有 ${unanswered} 题未作答，确定要交卷吗？` : '所有题目均已作答，确认交卷？',
      confirmText: '交卷',
      cancelText: '继续答题',
      success: (res) => {
        if (res.confirm) doSubmit();
      },
    });
  };

  if (submitted) {
    const review = buildReview(paper, answers);
    const correct = review.filter((r) => r.right).length;
    const total = review.length;
    const score = total ? Math.round((correct / total) * 100) : 0;
    return (
      <View className={styles.resultPage}>
        <ResultSummary
          score={score}
          lines={[
            ['正确', `${correct} / ${total} 题`],
            ['客观题得分率', `${score}%`],
          ]}
          note="写作与翻译为主观题，未计入自动评分"
        />
        <View className={styles.resultBtns}>
          <View className={styles.ghostWide} onClick={() => Taro.navigateBack()}>
            ← 返回选卷
          </View>
        </View>
        <ReviewGrid review={review} />
      </View>
    );
  }

  const timerCls =
    remaining <= 5 * 60 ? styles.timerDanger : remaining <= 20 * 60 ? styles.timerWarn : styles.timerNormal;

  // 单选题组（听力 / 仔细阅读）
  const renderMcq = (list: ListenQuestion[]) =>
    list.map((item) => (
      <View key={item.num} className={styles.examQ}>
        {!!item.stem && (
          <View className={styles.examStem}>
            <Text className={styles.examQNum}>{item.num}.</Text>
            <Text className={styles.examStemText}>{item.stem}</Text>
          </View>
        )}
        {!item.stem && <Text className={styles.examQNum}>{item.num}.</Text>}
        <View className={styles.optList}>
          {Object.entries(item.options).map(([l, t]) => (
            <OptionRow
              key={l}
              letter={l}
              text={t}
              state={answers[item.num] === l ? 'selected' : 'none'}
              onClick={() => setAns(item.num, l)}
            />
          ))}
        </View>
      </View>
    ));

  // 字母匹配题组（选词填空 A-O / 长篇阅读 A-K）
  const renderLetterQs = (startNum: number, count: number, letters: string[]) =>
    Array.from({ length: count }, (_, i) => startNum + i).map((num) => (
      <View key={num} className={styles.letterQ}>
        <Text className={styles.letterQNum}>{num}.</Text>
        <View className={styles.letterChips}>
          {letters.map((l) => (
            <View
              key={l}
              className={classnames(styles.chip, answers[num] === l && styles.chipActive)}
              onClick={() => setAns(num, l)}
            >
              {l}
            </View>
          ))}
        </View>
        <Text className={styles.letterPicked}>{answers[num] ? `已选 ${answers[num]}` : '未选'}</Text>
      </View>
    ));

  return (
    <View className={styles.examPage}>
      {/* 固定计时条 */}
      <View className={styles.examHeader}>
        <View className={styles.headerBack} onClick={() => Taro.navigateBack()}>
          ‹
        </View>
        <Text className={classnames(styles.timer, timerCls)}>{`⏱ ${fmtHMS(remaining)}`}</Text>
        <View className={styles.submitBtn} onClick={confirmSubmit}>
          交卷
        </View>
      </View>

      <ScrollView scrollY className={styles.examScroll} enhanced showScrollbar={false}>
        <View className={styles.examContent}>
          <View className={styles.progressBanner}>
            <Text className={styles.progressBannerText}>
              {`已答 ${answeredCount} / 55 题 · 剩余 ${fmtHMS(remaining)}`}
            </Text>
          </View>

          {/* Part I 写作 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>✍️ Part I 写作（30分钟）</Text>
            <Passage text={paper.writing} />
            <Text className={styles.sectionNote}>（写作无标准答案，请自行对照范文练习）</Text>
          </View>

          {/* Part II 听力 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>🎧 Part II 听力理解（25题）</Text>
            <AudioBar pid={paper.id} />
            <View className={styles.examQList}>{renderMcq(paper.listening)}</View>
          </View>

          {/* Part III A 选词填空 */}
          {Object.keys(paper.word_bank).length > 0 && (
            <View className={styles.section}>
              <Text className={styles.sectionTitle}>📝 Part III Section A 选词填空（10题）</Text>
              <View className={styles.wordBank}>
                {BANK_LETTERS.map((l) => (
                  <Text key={l} className={styles.bankItem}>
                    <Text className={styles.bankLetter}>{l})</Text> {paper.word_bank[l]}
                  </Text>
                ))}
              </View>
              <Passage text={paper.cloze_passage} />
              <View className={styles.letterQList}>{renderLetterQs(26, 10, BANK_LETTERS)}</View>
            </View>
          )}

          {/* Part III B 长篇阅读 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>📖 Part III Section B 长篇阅读（10题）</Text>
            <Passage text={paper.long_reading_passage} />
            <View className={styles.letterQList}>{renderLetterQs(36, 10, LR_LETTERS)}</View>
          </View>

          {/* Part III C 仔细阅读 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>📰 Part III Section C (1) 阅读理解（5题）</Text>
            <Passage text={paper.reading_passage_1} />
            <View className={styles.examQList}>{renderMcq(paper.reading_1)}</View>
          </View>
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>📰 Part III Section C (2) 阅读理解（5题）</Text>
            <Passage text={paper.reading_passage_2} />
            <View className={styles.examQList}>{renderMcq(paper.reading_2)}</View>
          </View>

          {/* Part IV 翻译 */}
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>🌏 Part IV 汉译英（30分钟）</Text>
            <Passage text={paper.translation} />
            <Text className={styles.sectionNote}>（翻译无标准答案，请自行对照参考译文练习）</Text>
          </View>

          <View className={styles.bottomSubmit}>
            <View className={styles.submitBig} onClick={confirmSubmit}>
              提交试卷 · 已答 {answeredCount}/55
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================
// 页面入口
// ============================================================
function QuizPage() {
  const router = useRouter();
  const mode = (router.params.mode as 'listen' | 'exam') || 'listen';
  const pid = router.params.pid || '';
  const [paper, setPaper] = useState<Paper | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pid) return;
    Taro.setNavigationBarTitle({ title: formatPaperId(pid) });
    setLoading(true);
    getPaper(pid).then((p) => {
      setPaper(p);
      setLoading(false);
    });
  }, [pid]);

  if (loading) {
    return (
      <View className={styles.resultPage}>
        <Text style={{ textAlign: 'center', paddingTop: '200rpx', fontSize: '30rpx', color: '#7f8c9b' }}>
          正在加载试卷…
        </Text>
      </View>
    );
  }

  if (!paper) {
    return (
      <View className={styles.resultPage}>
        <Empty icon="⚠️" text="试卷数据加载失败" hint="请返回重新选择一套真题" />
        <View className={styles.resultBtns}>
          <View className={styles.ghostWide} onClick={() => Taro.navigateBack()}>
            ← 返回
          </View>
        </View>
      </View>
    );
  }

  return mode === 'listen' ? <ListenRunner paper={paper} /> : <ExamRunner paper={paper} />;
}

export default QuizPage;
