/* ============================================
   英语四级词根背单词 - 主应用逻辑
   ============================================ */

// ---------- 全局数据 ----------
const ALL_WORDS = getAllWords();       // 扁平化的所有单词
const FAV_KEY = 'cet4_favorites';      // localStorage 收藏键名
let currentView = 'search';            // 当前视图（与 HTML 默认 active 一致）
let favorites = loadFavorites();       // 收藏列表（单词字符串数组）

// ---------- 工具函数 ----------
function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
}

function isFavorite(word) {
  return favorites.includes(word);
}

function toggleFavorite(word) {
  if (isFavorite(word)) {
    favorites = favorites.filter(w => w !== word);
  } else {
    favorites.push(word);
  }
  saveFavorites();
}

function getWordData(wordStr) {
  return ALL_WORDS.find(w => w.word === wordStr);
}

// ---------- 导航 ----------
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// 保存各视图离开时的滚动位置，返回时恢复
const viewScrollState = {};

function saveScrollState(view) {
  const state = { windowY: window.scrollY };
  if (view === 'browse') {
    const sb = document.querySelector('.root-index-sidebar');
    if (sb) state.sidebarTop = sb.scrollTop;
  } else if (view === 'allwords') {
    const sb = document.querySelector('.allwords-sidebar');
    if (sb) state.sidebarTop = sb.scrollTop;
  }
  viewScrollState[view] = state;
}

function restoreScrollState(view) {
  const state = viewScrollState[view];
  if (!state) return;
  window.scrollTo({ top: state.windowY || 0, behavior: 'auto' });
  if (state.sidebarTop != null) {
    setTimeout(() => {
      let sb;
      if (view === 'browse') sb = document.querySelector('.root-index-sidebar');
      else if (view === 'allwords') sb = document.querySelector('.allwords-sidebar');
      if (sb) sb.scrollTop = state.sidebarTop;
    }, 0);
  }
}

function switchView(view) {
  // 保存当前视图的滚动位置
  if (currentView) saveScrollState(currentView);

  // 离开真题答题页时停止听力音频并退出全屏
  if (currentView === 'exam' && view !== 'exam') {
    stopExamAudio();
    exitExamFullscreen();
  }
  // 离开听力练习页时停止音频并退出全屏
  if (currentView === 'listen' && view !== 'listen') {
    stopListenAudio();
    document.body.classList.remove('listen-fullscreen');
  }

  currentView = view;
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('active', v.id === 'view-' + view);
  });
  if (view === 'favorites') renderFavorites();
  if (view === 'practice') initPractice();
  if (view === 'allwords') renderAllWords();
  if (view === 'affixes') renderAffixes();
  if (view === 'intensive') renderIntensive();
  if (view === 'exam') renderExamSelect();
  if (view === 'listen') renderListenSelect();
  // 词根浏览只在加载时渲染一次
  // 恢复上次离开时的滚动位置
  restoreScrollState(view);
}

// ---------- 词根浏览 ----------
function renderBrowse() {
  const listEl = document.getElementById('rootList');
  const indexEl = document.getElementById('rootIndex');
  let html = '';
  let indexHtml = '';
  const seenLetters = new Set();

  CET4_WORDS.forEach((group, gi) => {
    const letter = group.root[0].toUpperCase();
    const isFirstOfLetter = !seenLetters.has(letter);
    if (isFirstOfLetter) {
      seenLetters.add(letter);
      indexHtml += `<a href="#root-${letter}" data-letter="${letter}">${letter}</a>`;
    }
    // 仅该字母首个词根卡片写入锚点 id，避免重复 id
    const anchorId = isFirstOfLetter ? `root-${letter}` : '';

    html += `<div class="root-card" ${anchorId ? `id="${anchorId}"` : ''} data-letter="${letter}">`;
    html += `<div class="root-header">
               <span class="root-name">${group.root}</span>
               <span class="root-meaning">${group.meaning} · ${group.words.length}词</span>
             </div>`;
    html += `<div class="root-word-list">`;
    group.words.forEach(w => {
      const fav = isFavorite(w.word);
      let affixHtml = '';
      if (w.prefix) affixHtml += `<span class="word-affix prefix">前缀: ${w.prefix}</span>`;
      if (w.suffix) affixHtml += `<span class="word-affix suffix">后缀: ${w.suffix}</span>`;
      html += `<div class="word-item" data-word="${w.word}">
                 <div class="word-main">
                   <span class="word-en">${w.word}</span>
                   <span class="word-phonetic">${w.phonetic || ''}</span>
                   ${affixHtml}
                   <div class="word-cn">${w.meaning}</div>
                 </div>
                 <button class="fav-btn ${fav ? 'active' : ''}" data-word="${w.word}" title="${fav ? '取消收藏' : '收藏'}">
                   ${fav ? '⭐' : '☆'}
                 </button>
               </div>`;
    });
    html += `</div></div>`;
  });

  listEl.innerHTML = html;
  indexEl.innerHTML = indexHtml;
  document.getElementById('rootCount').textContent = CET4_WORDS.length;
  document.getElementById('wordCount').textContent = ALL_WORDS.length;

  // 字母点击：平滑滚动到对应词根，且顶部避开导航栏
  indexEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const letter = a.dataset.letter;
      const target = document.getElementById(`root-${letter}`);
      if (target) {
        const top = target.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top, behavior: 'smooth' });
        // 高亮当前字母
        indexEl.querySelectorAll('a').forEach(x => x.classList.remove('active'));
        a.classList.add('active');
      }
    });
  });

  // 滚动时高亮当前可视区域的首字母
  let scrollTimer = null;
  window.addEventListener('scroll', () => {
    if (scrollTimer) return;
    scrollTimer = requestAnimationFrame(() => {
      scrollTimer = null;
      const cards = listEl.querySelectorAll('.root-card');
      const headerOffset = 140;
      let currentLetter = '';
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        if (rect.top <= headerOffset) {
          currentLetter = card.dataset.letter;
        } else {
          break;
        }
      }
      if (currentLetter) {
        indexEl.querySelectorAll('a').forEach(x => {
          x.classList.toggle('active', x.dataset.letter === currentLetter);
        });
      }
    });
  }, { passive: true });

  // 绑定事件
  listEl.querySelectorAll('.word-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('fav-btn')) return;
      showWordModal(item.dataset.word);
    });
  });
  listEl.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const w = btn.dataset.word;
      toggleFavorite(w);
      btn.classList.toggle('active');
      btn.textContent = isFavorite(w) ? '⭐' : '☆';
    });
  });
}

// ---------- 渲染前后缀视图 ----------
function renderAffixes() {
  function renderAffixList(list, containerId) {
    const el = document.getElementById(containerId);
    let h = '';
    list.forEach(item => {
      h += `<div class="affixes-item"><span class="affix-name">${item.affix}</span><span class="affix-meaning">${item.meaning}</span></div>`;
    });
    el.innerHTML = h;
  }
  renderAffixList(PREFIXES, 'affixPrefixList');
  renderAffixList(SUFFIXES, 'affixSuffixList');
}

// ---------- 渲染全部词汇视图（按字母分组） ----------
function renderAllWords() {
  const listEl = document.getElementById('extraWordsList');
  const lettersEl = document.getElementById('allWordsLetters');
  document.getElementById('allWordsCount').textContent = ALL_WORDS.length;

  const grouped = {};
  ALL_WORDS.forEach(w => {
    const letter = w.word[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(w);
  });
  const letters = Object.keys(grouped).sort();
  let letterHtml = '';
  let listHtml = '';
  letters.forEach(letter => {
    letterHtml += `<a href="#aw-${letter}">${letter}</a>`;
    listHtml += `<div class="extra-letter-group" id="aw-${letter}"><h4>${letter}</h4>`;
    grouped[letter].forEach(w => {
      const fav = isFavorite(w.word);
      const rootTag = w.root ? `<span style="color:var(--primary-dark);font-size:12px;">[${w.root}]</span> ` : '';
      listHtml += `<div class="extra-word-item" data-word="${w.word}">
        <div class="ew-left">
          <span class="ew-word">${w.word}</span>
          <span class="ew-phonetic">${w.phonetic || ''}</span>
          ${rootTag}
          <div class="ew-meaning">${w.meaning}</div>
        </div>
        <button class="fav-btn ${fav ? 'active' : ''}" data-word="${w.word}">${fav ? '⭐' : '☆'}</button>
      </div>`;
    });
    listHtml += `</div>`;
  });
  lettersEl.innerHTML = letterHtml;
  listEl.innerHTML = listHtml;

  // 字母跳转
  lettersEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.getAttribute('href').substring(1);
      const target = document.getElementById(id);
      if (target) {
        const top = target.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // 点击弹窗 + 收藏
  listEl.querySelectorAll('.extra-word-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('fav-btn')) return;
      showWordModal(item.dataset.word);
    });
  });
  listEl.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const w = btn.dataset.word;
      toggleFavorite(w);
      btn.classList.toggle('active');
      btn.textContent = isFavorite(w) ? '⭐' : '☆';
    });
  });
}

// ---------- 搜索 ----------
function doSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const resultsEl = document.getElementById('searchResults');
  const guideEl = document.getElementById('examGuide');
  if (!q) {
    resultsEl.innerHTML = '';
    if (guideEl) guideEl.style.display = '';
    return;
  }
  if (guideEl) guideEl.style.display = 'none';
  const results = ALL_WORDS.filter(w =>
    w.word.toLowerCase().includes(q) ||
    w.meaning.includes(q) ||
    w.root.toLowerCase().includes(q) ||
    w.rootMeaning.includes(q)
  );
  if (results.length === 0) {
    resultsEl.innerHTML = '<div class="no-result">未找到相关单词</div>';
    return;
  }
  let html = '';
  results.forEach(w => {
    const fav = isFavorite(w.word);
    const rootTag = w.root ? `<span class="root-tag">词根: ${w.root} (${w.rootMeaning})</span>` : '';
    html += `<div class="result-item" data-word="${w.word}">
               <div>
                 <div><strong>${w.word}</strong> <span class="word-phonetic">${w.phonetic || ''}</span></div>
                 <div class="word-cn">${w.meaning}</div>
                 <div class="result-meta">
                   ${rootTag}
                 </div>
               </div>
               <button class="fav-btn ${fav ? 'active' : ''}" data-word="${w.word}">${fav ? '⭐' : '☆'}</button>
             </div>`;
  });
  resultsEl.innerHTML = html;

  resultsEl.querySelectorAll('.result-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('fav-btn')) return;
      showWordModal(item.dataset.word);
    });
  });
  resultsEl.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const w = btn.dataset.word;
      toggleFavorite(w);
      btn.classList.toggle('active');
      btn.textContent = isFavorite(w) ? '⭐' : '☆';
    });
  });
}

document.getElementById('searchBtn').addEventListener('click', doSearch);
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch();
});

// ---------- 收藏 ----------
function renderFavorites() {
  const listEl = document.getElementById('favoritesList');
  document.getElementById('favCount').textContent = favorites.length;
  if (favorites.length === 0) {
    listEl.innerHTML = '<div class="fav-empty">还没有收藏的单词，去浏览或搜索中收藏难记的单词吧！</div>';
    return;
  }
  let html = '';
  favorites.forEach(wordStr => {
    const w = getWordData(wordStr);
    if (!w) return;
    const rootTag = w.root ? `<span class="root-tag">词根: ${w.root} (${w.rootMeaning})</span>` : '';
    html += `<div class="result-item" data-word="${w.word}">
               <div>
                 <div><strong>${w.word}</strong> <span class="word-phonetic">${w.phonetic || ''}</span></div>
                 <div class="word-cn">${w.meaning}</div>
                 <div class="result-meta">
                   ${rootTag}
                 </div>
               </div>
               <button class="fav-btn active" data-word="${w.word}">⭐</button>
             </div>`;
  });
  listEl.innerHTML = html;

  listEl.querySelectorAll('.result-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('fav-btn')) return;
      showWordModal(item.dataset.word);
    });
  });
  listEl.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const w = btn.dataset.word;
      toggleFavorite(w);
      renderFavorites();
    });
  });
}

// ---------- 单词详情弹窗 ----------
function showWordModal(wordStr) {
  const w = getWordData(wordStr);
  if (!w) return;
  const body = document.getElementById('modalBody');
  const fav = isFavorite(w.word);
  let affixText = '';
  if (w.prefix) affixText += `前缀: <strong>${w.prefix}</strong> &nbsp; `;
  if (w.suffix) affixText += `后缀: <strong>${w.suffix}</strong>`;

  // 显示同词根的扩展单词（前/后缀扩展）
  const sameRoot = CET4_WORDS.find(g => g.root === w.root);
  let relatedHtml = '';
  if (sameRoot && sameRoot.words.length > 1) {
    relatedHtml = '<div style="margin-top:16px;"><strong>同词根扩展单词：</strong><div style="margin-top:8px;">';
    sameRoot.words.forEach(rw => {
      if (rw.word === w.word) return;
      let tag = '';
      if (rw.prefix) tag += `<span class="word-affix prefix">前缀:${rw.prefix}</span> `;
      if (rw.suffix) tag += `<span class="word-affix suffix">后缀:${rw.suffix}</span>`;
      relatedHtml += `<div style="padding:6px 0; border-bottom:1px dashed #eee; cursor:pointer;" class="related-word" data-word="${rw.word}">
        <strong>${rw.word}</strong> <span style="color:#888;font-size:13px;">${rw.phonetic || ''}</span> ${tag}
        <div style="font-size:13px;color:#555;">${rw.meaning}</div>
      </div>`;
    });
    relatedHtml += '</div></div>';
  }

  body.innerHTML = `
    <div class="modal-word">${w.word} <span class="modal-phonetic">${w.phonetic || ''}</span></div>
    <div class="modal-meaning">${w.meaning}</div>
    ${w.root ? `<div class="modal-root-info">词根 <strong>${w.root}</strong> — ${w.rootMeaning}</div>` : ''}
    ${affixText ? `<div class="modal-affix">${affixText}</div>` : ''}
    <button class="modal-fav-btn ${fav ? 'active' : ''}" id="modalFavBtn">
      ${fav ? '⭐ 已收藏' : '☆ 收藏单词'}
    </button>
    ${relatedHtml}
  `;
  document.getElementById('wordModal').classList.add('show');

  document.getElementById('modalFavBtn').addEventListener('click', () => {
    toggleFavorite(w.word);
    showWordModal(w.word); // 刷新
  });
  body.querySelectorAll('.related-word').forEach(el => {
    el.addEventListener('click', () => showWordModal(el.dataset.word));
  });
}

document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('wordModal').classList.remove('show');
});
document.getElementById('wordModal').addEventListener('click', (e) => {
  if (e.target.id === 'wordModal') {
    document.getElementById('wordModal').classList.remove('show');
  }
});

// ---------- 练习模式 ----------
let practiceWords = [];
let practiceIdx = 0;
let practiceMode = 'cn2en';
let practiceCorrect = 0;
let practiceWrong = 0;
let practiceShown = false;

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    practiceMode = btn.dataset.mode;
    initPractice();
  });
});

function getPracticeSource() {
  const src = document.querySelector('input[name="src"]:checked').value;
  if (src === 'fav') {
    return ALL_WORDS.filter(w => favorites.includes(w.word));
  }
  return [...ALL_WORDS];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initPractice() {
  practiceWords = shuffle(getPracticeSource());
  practiceIdx = 0;
  practiceCorrect = 0;
  practiceWrong = 0;
  document.getElementById('practiceSummary').textContent = '';
  if (practiceWords.length === 0) {
    document.getElementById('practicePrompt').textContent = '没有可练习的单词';
    document.getElementById('practiceInput').disabled = true;
    return;
  }
  document.getElementById('practiceInput').disabled = false;
  document.getElementById('totalIdx').textContent = practiceWords.length;
  showPracticeQuestion();
}

function showPracticeQuestion() {
  practiceShown = false;
  const resultEl = document.getElementById('practiceResult');
  resultEl.textContent = '';
  resultEl.className = 'practice-result';
  document.getElementById('practiceInput').value = '';
  document.getElementById('practiceInput').focus();

  const w = practiceWords[practiceIdx];
  document.getElementById('curIdx').textContent = practiceIdx + 1;

  const promptEl = document.getElementById('practicePrompt');
  if (practiceMode === 'cn2en') {
    // 看中文写英文
    const hint = w.root ? `<span class="phonetic-hint">提示：词根 ${w.root} (${w.rootMeaning})</span>` : '';
    promptEl.innerHTML = `${w.meaning}${hint}`;
  } else {
    // 看英文写中文
    promptEl.innerHTML = `${w.word}<span class="phonetic-hint">${w.phonetic || ''}</span>`;
  }
}

function checkAnswer() {
  const w = practiceWords[practiceIdx];
  const input = document.getElementById('practiceInput').value.trim();
  const resultEl = document.getElementById('practiceResult');
  if (!input) return;

  let correct = false;
  if (practiceMode === 'cn2en') {
    correct = input.toLowerCase() === w.word.toLowerCase();
    if (correct) {
      practiceCorrect++;
      resultEl.className = 'practice-result correct';
      resultEl.innerHTML = `✅ 正确！<span class="answer-show">${w.word} ${w.phonetic || ''}</span>`;
    } else {
      practiceWrong++;
      resultEl.className = 'practice-result wrong';
      resultEl.innerHTML = `❌ 错误。正确答案：<span class="answer-show">${w.word} ${w.phonetic || ''}</span><br><span style="font-size:13px;">${w.meaning}</span>`;
      if (!isFavorite(w.word)) {
        toggleFavorite(w.word);
        resultEl.innerHTML += '<div style="font-size:12px;color:var(--accent);margin-top:6px;">已自动加入收藏</div>';
      }
    }
  } else {
    // 看英文写中文：只要包含正确释义关键词即算对（宽松匹配）
    const cleanAns = w.meaning.replace(/[a-zA-Z.\/\s]/g, '');
    // 提取中文释义（去掉词性标注如 v. n. adj.）
    const cnParts = w.meaning.split(/[;；,，]/).map(s => s.trim()).filter(s => /[\u4e00-\u9fa5]/.test(s));
    correct = cnParts.some(part => input.includes(part.replace(/[a-zA-Z.]/g, '').trim()));
    if (correct) {
      practiceCorrect++;
      resultEl.className = 'practice-result correct';
      resultEl.innerHTML = `✅ 正确！<span class="answer-show">${w.meaning}</span>`;
    } else {
      practiceWrong++;
      resultEl.className = 'practice-result wrong';
      resultEl.innerHTML = `❌ 参考答案：<span class="answer-show">${w.meaning}</span>`;
      if (!isFavorite(w.word)) {
        toggleFavorite(w.word);
        resultEl.innerHTML += '<div style="font-size:12px;color:var(--accent);margin-top:6px;">已自动加入收藏</div>';
      }
    }
  }
  practiceShown = true;
  document.getElementById('curIdx').textContent = practiceIdx + 1;
  updateSummary();
}

function nextQuestion() {
  practiceIdx++;
  if (practiceIdx >= practiceWords.length) {
    showFinalSummary();
  } else {
    showPracticeQuestion();
  }
}

function showAnswer() {
  const w = practiceWords[practiceIdx];
  const resultEl = document.getElementById('practiceResult');
  resultEl.className = 'practice-result';
  if (practiceMode === 'cn2en') {
    resultEl.innerHTML = `答案：<span class="answer-show">${w.word} ${w.phonetic || ''}</span><br><span style="font-size:13px;">${w.meaning}</span>`;
  } else {
    resultEl.innerHTML = `答案：<span class="answer-show">${w.meaning}</span>`;
  }
  practiceShown = true;
}

function updateSummary() {
  const total = practiceCorrect + practiceWrong;
  const rate = total > 0 ? Math.round(practiceCorrect / total * 100) : 0;
  document.getElementById('practiceSummary').innerHTML =
    `正确 <strong style="color:var(--success)">${practiceCorrect}</strong> · 错误 <strong style="color:var(--danger)">${practiceWrong}</strong> · 正确率 <strong>${rate}%</strong>`;
}

function showFinalSummary() {
  const total = practiceCorrect + practiceWrong;
  const rate = total > 0 ? Math.round(practiceCorrect / total * 100) : 0;
  // 保存单词练习记录到本地
  try {
    const log = JSON.parse(localStorage.getItem('cet4_practice_log') || '{}');
    if (!log.word) log.word = [];
    log.word.unshift({ total, correct: practiceCorrect, wrong: practiceWrong, rate, date: new Date().toISOString() });
    if (log.word.length > 50) log.word.length = 50;
    localStorage.setItem('cet4_practice_log', JSON.stringify(log));
  } catch (e) {}
  document.getElementById('practicePrompt').innerHTML = `🎉 练习完成！`;
  document.getElementById('practiceInput').disabled = true;
  document.getElementById('practiceResult').innerHTML = '';
  document.getElementById('practiceSummary').innerHTML =
    `<div style="font-size:18px;">共 ${practiceWords.length} 题，正确 ${practiceCorrect} 题，错误 ${practiceWrong} 题，正确率 <strong>${rate}%</strong></div>
     <button style="margin-top:16px;padding:10px 24px;background:var(--primary);color:#fff;border:none;border-radius:8px;cursor:pointer;" onclick="initPractice()">再来一轮</button>`;
}

document.getElementById('checkBtn').addEventListener('click', () => {
  if (!practiceShown) {
    checkAnswer();
  } else {
    nextQuestion();
  }
});
document.getElementById('practiceInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (!practiceShown) checkAnswer();
    else nextQuestion();
  }
});
document.getElementById('skipBtn').addEventListener('click', nextQuestion);
document.getElementById('showBtn').addEventListener('click', showAnswer);

// 切换练习词源时重新初始化
document.querySelectorAll('input[name="src"]').forEach(r => {
  r.addEventListener('change', initPractice);
});

// ---------- 考前应急 ----------
let currentIntensiveModule = 'words';
const INTENSIVE_CATEGORY_NAMES = {
  verb: '动词短语',
  noun_prep: '名词/介词短语',
  writing: '写作加分搭配',
  opening: '开头引入',
  comparison: '对比观点',
  reason: '分析原因',
  proscons: '利弊影响',
  suggestion: '建议措施',
  conclusion: '结尾总结'
};

function renderIntensive() {
  document.getElementById('intWordsCount').textContent = HIGH_FREQ_WORDS.length + ' 词';
  document.getElementById('intPhrasesCount').textContent = HIGH_FREQ_PHRASES.length + ' 条';
  document.getElementById('intEssayCount').textContent = ESSAY_SENTENCES.length + ' 句';
  document.getElementById('intensiveModules').style.display = 'flex';
  document.getElementById('intensiveDetail').style.display = 'none';
}

document.querySelectorAll('.intensive-card').forEach(card => {
  card.addEventListener('click', () => showIntensiveList(card.dataset.module));
});

function showIntensiveList(module) {
  currentIntensiveModule = module;
  const listEl = document.getElementById('intensiveList');
  let html = '';

  if (module === 'words') {
    // 按首字母分组
    const grouped = {};
    HIGH_FREQ_WORDS.forEach(w => {
      const letter = w.word[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(w);
    });
    const letters = Object.keys(grouped).sort();

    let letterHtml = '';
    let listHtml = '<div class="int-list-title">高频词汇（' + HIGH_FREQ_WORDS.length + ' 词）</div>';
    letters.forEach(letter => {
      letterHtml += `<a href="#hf-${letter}" data-letter="${letter}">${letter}<span class="hf-letter-count">${grouped[letter].length}</span></a>`;
      listHtml += `<div class="hf-letter-group" id="hf-${letter}"><h4>${letter}</h4><div class="int-word-grid">`;
      grouped[letter].forEach(w => {
        listHtml += `<div class="int-word-item">
          <div class="int-word-en">${w.word}</div>
          <div class="int-word-cn">${w.meaning}</div>
        </div>`;
      });
      listHtml += `</div></div>`;
    });

    html = `<div class="int-words-layout">
      <aside class="int-words-sidebar">
        <div class="sidebar-title">字母导航</div>
        <div class="int-words-letters">${letterHtml}</div>
      </aside>
      <div class="int-words-content">${listHtml}</div>
    </div>`;

    listEl.innerHTML = html;
    document.getElementById('intensiveModules').style.display = 'none';
    document.getElementById('intensiveDetail').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'auto' });

    // 字母跳转
    listEl.querySelectorAll('.int-words-letters a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const id = a.getAttribute('href').substring(1);
        const target = document.getElementById(id);
        if (target) {
          const top = target.getBoundingClientRect().top + window.pageYOffset - 90;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
    return;
  } else if (module === 'phrases') {
    const cats = [{ key: 'verb', name: '动词短语' }, { key: 'noun_prep', name: '名词 / 介词短语' }, { key: 'writing', name: '写作加分搭配' }];
    cats.forEach(c => {
      const items = HIGH_FREQ_PHRASES.filter(p => p.category === c.key);
      if (!items.length) return;
      html += `<div class="int-cat-title">${c.name}（${items.length}）</div>`;
      html += '<div class="int-phrase-list">';
      items.forEach(p => {
        html += `<div class="int-phrase-item">
          <span class="int-phrase-en">${p.starred ? '★ ' : ''}${p.phrase}</span>
          <span class="int-phrase-cn">${p.meaning}</span>
        </div>`;
      });
      html += '</div>';
    });
  } else {
    const cats = [
      { key: 'opening', name: '一、开头引入' },
      { key: 'comparison', name: '二、对比不同观点' },
      { key: 'reason', name: '三、分析原因' },
      { key: 'proscons', name: '四、表达利弊影响' },
      { key: 'suggestion', name: '五、建议措施' },
      { key: 'conclusion', name: '六、个人观点与结尾' }
    ];
    cats.forEach(c => {
      const items = ESSAY_SENTENCES.filter(s => s.category === c.key);
      if (!items.length) return;
      html += `<div class="int-cat-title">${c.name}（${items.length}）</div>`;
      html += '<div class="int-sentence-list">';
      items.forEach(s => {
        html += `<div class="int-sentence-item">
          <div class="int-sentence-en">${s.starred ? '★ ' : ''}${s.sentence}</div>
          <div class="int-sentence-cn">${s.translation}</div>
        </div>`;
      });
      html += '</div>';
    });
  }

  listEl.innerHTML = html;
  document.getElementById('intensiveModules').style.display = 'none';
  document.getElementById('intensiveDetail').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'auto' });
}

// ---------- 真题模考 ----------
let examData = null;
let examHasAudio = false;
let examAnswers = {}; // {qNum: userAnswer}

const PAPER_LIST = [
  "2025-12-1","2025-12-2","2025-12-3","2025-06-1","2025-06-2","2025-06-3",
  "2024-12-1","2024-12-2","2024-12-3","2024-06-1","2024-06-2","2024-06-3",
  "2023-12-1","2023-12-2","2023-12-3","2023-06-1","2023-06-2","2023-06-3","2023-03-1","2023-03-2","2023-03-3",
  "2022-12-1","2022-12-2","2022-12-3","2022-09-1","2022-09-2","2022-09-3","2022-06-1","2022-06-2","2022-06-3",
  "2021-12-1","2021-12-2","2021-12-3","2021-06-1","2021-06-2","2021-06-3",
  "2020-12-1","2020-12-2","2020-12-3","2020-09-1","2020-09-2","2020-09-3"
];

function formatPaperId(pid) {
  const [y, m, s] = pid.split("-");
  return `${y}年${parseInt(m)}月 第${s}套`;
}

function stopExamAudio() {
  document.querySelectorAll('#examArea audio').forEach(a => { a.pause(); a.currentTime = 0; });
}

function renderExamSelect() {
  stopExamAudio();
  document.getElementById('examSelect').style.display = '';
  document.getElementById('examArea').style.display = 'none';
  document.getElementById('examResult').style.display = 'none';
  const groups = {};
  PAPER_LIST.forEach(pid => {
    const y = pid.split("-")[0];
    if (!groups[y]) groups[y] = [];
    groups[y].push(pid);
  });
  let html = '';
  Object.keys(groups).sort((a,b) => b-a).forEach(year => {
    html += `<div class="exam-year-group"><h3>${year}年</h3><div class="exam-paper-grid">`;
    groups[year].forEach(pid => {
      html += `<div class="exam-paper-card" onclick="startExam('${pid}')">
        <div class="exam-paper-name">${formatPaperId(pid)}</div>
        <div class="exam-paper-tag">点击开始答题</div>
      </div>`;
    });
    html += `</div></div>`;
  });
  document.getElementById('examYearGroups').innerHTML = html;
}

async function startExam(pid) {
  examAnswers = {};
  try {
    const resp = await fetch(`js/papers/${pid}.json?v=20260930b`);
    if (!resp.ok) throw new Error("试卷数据加载失败");
    examData = await resp.json();
  } catch(e) {
    alert("试卷数据加载失败：" + e.message);
    return;
  }
  // 检查听力音频是否存在
  try {
    const audioResp = await fetch(`audio/${pid}.mp3`, { method: 'HEAD' });
    examHasAudio = audioResp.ok && parseInt(audioResp.headers.get('content-length') || 0) > 0;
  } catch {
    examHasAudio = false;
  }
  document.getElementById('examSelect').style.display = 'none';
  document.getElementById('examResult').style.display = 'none';
  document.getElementById('examArea').style.display = '';
  document.getElementById('examTitle').textContent = formatPaperId(pid);
  renderExamSections();
  document.body.classList.add('exam-fullscreen');
  startExamTimer();
  window.scrollTo(0, 0);
  syncDownloadBarOffset();
}

// 同步下载栏与固定 header 的间距（适配不同屏幕高度）
function syncDownloadBarOffset() {
  requestAnimationFrame(() => {
    const header = document.querySelector('.exam-header');
    const h = header ? header.offsetHeight : 80;
    const bar = document.querySelector('.exam-download-bar');
    if (bar) bar.style.marginTop = (h + 8) + 'px';
    const result = document.getElementById('examResult');
    if (result) result.style.paddingTop = (h + 12) + 'px';
  });
}
window.addEventListener('resize', syncDownloadBarOffset);

// ---------- 倒计时 ----------
const EXAM_TOTAL_SECONDS = 130 * 60; // 四级考试总时长 130 分钟
let examTimerInterval = null;
let examRemaining = EXAM_TOTAL_SECONDS;

function fmtTime(s) {
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function updateTimerDisplay() {
  const el = document.getElementById('examTimer');
  if (!el) return;
  el.textContent = '⏱ ' + fmtTime(examRemaining);
  el.classList.remove('warning', 'danger');
  if (examRemaining <= 5 * 60) el.classList.add('danger');
  else if (examRemaining <= 20 * 60) el.classList.add('warning');
}

function startExamTimer() {
  stopExamTimer();
  examRemaining = EXAM_TOTAL_SECONDS;
  updateTimerDisplay();
  examTimerInterval = setInterval(() => {
    examRemaining--;
    updateTimerDisplay();
    if (examRemaining <= 0) {
      stopExamTimer();
      alert('考试时间到，自动交卷！');
      examSubmit();
    }
  }, 1000);
}

function stopExamTimer() {
  if (examTimerInterval) {
    clearInterval(examTimerInterval);
    examTimerInterval = null;
  }
}

function exitExamFullscreen() {
  document.body.classList.remove('exam-fullscreen');
  stopExamTimer();
}

function renderExamSections() {
  const d = examData;
  const audioPlayerHtml = examHasAudio
    ? `<audio controls src="audio/${d.id}.mp3" preload="none">您的浏览器不支持音频播放</audio>
       <p class="muted small">点击播放听力音频，听完后选择答案</p>`
    : `<div class="exam-no-audio">⚠️ 本套试卷暂无听力音频材料，您仍可作答听力题目</div>`;

  const audioHtml = d.listening.length ? `
    <div class="exam-section">
      <h3>🎧 Part II 听力理解（25题）</h3>
      <div class="exam-audio-player" id="audioPlayer-${d.id}">
        ${audioPlayerHtml}
      </div>
      <div class="exam-questions">${d.listening.map(q => renderMCQ(q, "listening")).join("")}</div>
    </div>` : '';

  const clozeHtml = d.word_bank && Object.keys(d.word_bank).length ? `
    <div class="exam-section">
      <h3>📝 Part III Section A 选词填空（10题）</h3>
      <div class="exam-word-bank">
        ${Object.entries(d.word_bank).sort().map(([l,w]) => `<span class="word-bank-item"><b>${l})</b> ${w}</span>`).join("")}
      </div>
      <div class="exam-passage">${d.cloze_passage || ""}</div>
      <div class="exam-questions">
        ${Array.from({length:10},(_,i)=>{
          const num = 26+i;
          return `<div class="exam-q-item" data-q="${num}">
            <span class="q-num">${num}.</span>
            <select class="q-select" onchange="setAnswer(${num}, this.value)">
              <option value="">--</option>
              ${Object.keys(d.word_bank).sort().map(l=>`<option value="${l}">${l}</option>`).join("")}
            </select>
          </div>`;
        }).join("")}
      </div>
    </div>` : '';

  const lrHtml = d.long_reading && d.long_reading.length ? `
    <div class="exam-section">
      <h3>📖 Part III Section B 长篇阅读（10题）</h3>
      <div class="exam-passage">${d.long_reading_passage || ""}</div>
      <div class="exam-questions">${d.long_reading.map(q => renderLetterSelect(q, "A", "K")).join("")}</div>
    </div>` : '';

  const rc1Html = d.reading_1 && d.reading_1.length ? `
    <div class="exam-section">
      <h3>📰 Part III Section C (1) 阅读理解（5题）</h3>
      <div class="exam-passage">${d.reading_passage_1 || ""}</div>
      <div class="exam-questions">${d.reading_1.map(q => renderMCQ(q, "rc1")).join("")}</div>
    </div>` : '';

  const rc2Html = d.reading_2 && d.reading_2.length ? `
    <div class="exam-section">
      <h3>📰 Part III Section C (2) 阅读理解（5题）</h3>
      <div class="exam-passage">${d.reading_passage_2 || ""}</div>
      <div class="exam-questions">${d.reading_2.map(q => renderMCQ(q, "rc2")).join("")}</div>
    </div>` : '';

  const writingHtml = d.writing ? `
    <div class="exam-section">
      <h3>✍️ Part I 写作</h3>
      <div class="exam-passage">${d.writing}</div>
      <p class="muted small">（写作无标准答案，请自行对照范文练习）</p>
    </div>` : '';

  const transHtml = d.translation ? `
    <div class="exam-section">
      <h3>🌏 Part IV 汉译英</h3>
      <div class="exam-passage">${d.translation}</div>
      <p class="muted small">（翻译无标准答案，请自行对照参考译文练习）</p>
    </div>` : '';

  document.getElementById('examSections').innerHTML =
    writingHtml + audioHtml + clozeHtml + lrHtml + rc1Html + rc2Html + transHtml;
}

function renderMCQ(q, section) {
  return `<div class="exam-q-item" data-q="${q.num}">
    <div class="q-stem"><span class="q-num">${q.num}.</span> ${q.stem || ""}</div>
    <div class="q-options">
      ${Object.entries(q.options).map(([l, txt]) => `
        <label class="q-opt">
          <input type="radio" name="q-${q.num}" value="${l}" onchange="setAnswer(${q.num},'${l}')">
          <span class="opt-letter">${l})</span> ${txt}
        </label>`).join("")}
    </div>
  </div>`;
}

function renderLetterSelect(q, from, to) {
  const letters = [];
  for (let c = from.charCodeAt(0); c <= to.charCodeAt(0); c++) letters.push(String.fromCharCode(c));
  return `<div class="exam-q-item" data-q="${q.num}">
    <div class="q-stem"><span class="q-num">${q.num}.</span> ${q.stem}</div>
    <select class="q-select" onchange="setAnswer(${q.num}, this.value)">
      <option value="">--</option>
      ${letters.map(l => `<option value="${l}">${l}</option>`).join("")}
    </select>
  </div>`;
}

function setAnswer(num, val) {
  examAnswers[num] = val;
}

function examBack() {
  stopExamAudio();
  exitExamFullscreen();
  document.getElementById('examArea').style.display = 'none';
  document.getElementById('examResult').style.display = 'none';
  document.getElementById('examSelect').style.display = '';
  examData = null;
  examAnswers = {};
}

function examSubmit() {
  if (!examData) return;
  stopExamTimer();
  const answers = examData.answers || {};
  const total = Object.keys(answers).length;
  let correct = 0;
  const review = [];
  for (const numStr in answers) {
    const num = parseInt(numStr);
    const correctAns = answers[numStr];
    const userAns = examAnswers[num] || "";
    const isRight = userAns.toUpperCase() === correctAns.toUpperCase();
    if (isRight) correct++;
    review.push({ num, correct: correctAns, user: userAns, right: isRight });
  }
  const score = total ? Math.round(correct / total * 100) : 0;
  // 保存模考成绩到本地
  try {
    const scores = JSON.parse(localStorage.getItem('cet4_exam_scores') || '[]');
    scores.unshift({ pid: examData.id, score, correct, total, date: new Date().toISOString() });
    if (scores.length > 50) scores.length = 50;
    localStorage.setItem('cet4_exam_scores', JSON.stringify(scores));
  } catch (e) {}
  document.getElementById('examArea').style.display = 'none';
  document.getElementById('examResult').style.display = '';
  syncDownloadBarOffset();
  document.getElementById('resultTitle').textContent = formatPaperId(examData.id) + " · 成绩";
  document.getElementById('examScoreBox').innerHTML = `
    <div class="score-circle">${score}</div>
    <div class="score-detail">
      <p>正确 <b>${correct}</b> / ${total} 题</p>
      <p>客观题得分率 <b>${score}%</b></p>
      <p class="muted small">写作与翻译为主观题，未计入自动评分</p>
    </div>`;
  review.sort((a,b) => a.num - b.num);
  document.getElementById('examAnswerReview').innerHTML = `
    <h3>📋 答题对照</h3>
    <div class="review-grid">${review.map(r => `
      <div class="review-item ${r.right ? 'right' : 'wrong'}">
        <span class="r-num">${r.num}</span>
        <span class="r-user">你的: ${r.user || '未答'}</span>
        <span class="r-correct">正确: ${r.correct}</span>
        <span class="r-mark">${r.right ? '✓' : '✗'}</span>
      </div>`).join("")}</div>`;
  window.scrollTo(0, 0);
}

// ---------- 听力练习 ----------
let listenData = null;
let listenAnswers = {};
let listenCurIdx = 0;
let listenScore = 0;
let listenAnswered = new Set();
let listenMode = 'overall'; // 'overall' = 全部答完再对答案, 'perQ' = 选一题对一题

function renderListenSelect() {
  stopListenAudio();
  document.getElementById('listenSelect').style.display = '';
  document.getElementById('listenArea').style.display = 'none';
  document.getElementById('listenResult').style.display = 'none';
  const groups = {};
  PAPER_LIST.forEach(pid => {
    const y = pid.split("-")[0];
    if (!groups[y]) groups[y] = [];
    groups[y].push(pid);
  });
  let html = '';
  Object.keys(groups).sort((a,b) => b-a).forEach(year => {
    html += `<div class="exam-year-group"><h3>${year}年</h3><div class="exam-year-cards">`;
    groups[year].forEach(pid => {
      html += `<div class="exam-paper-card" onclick="startListen('${pid}')">
        <div class="exam-paper-name">${formatPaperId(pid)}</div>
        <div class="exam-paper-tag">25 道听力题</div>
      </div>`;
    });
    html += `</div></div>`;
  });
  document.getElementById('listenYearGroups').innerHTML = html;
}

function stopListenAudio() {
  const a = document.getElementById('listenAudio');
  if (a) { a.pause(); a.currentTime = 0; }
}

async function startListen(pid) {
  listenAnswers = {};
  listenAnswered = new Set();
  listenScore = 0;
  listenCurIdx = 0;
  listenMode = 'overall';
  // Reset mode radio to default
  const modeRadios = document.querySelectorAll('input[name=listenMode]');
  modeRadios.forEach(r => { r.checked = (r.value === 'overall'); });
  try {
    const resp = await fetch(`js/papers/${pid}.json?v=20260930b`);
    if (!resp.ok) throw new Error("试卷数据加载失败");
    listenData = await resp.json();
  } catch(e) {
    alert("试卷数据加载失败：" + e.message);
    return;
  }
  if (!listenData.listening || !listenData.listening.length) {
    alert("本套试卷暂无听力题目");
    return;
  }
  document.getElementById('listenSelect').style.display = 'none';
  document.getElementById('listenResult').style.display = 'none';
  document.getElementById('listenArea').style.display = '';
  document.getElementById('listenTitle').textContent = formatPaperId(pid);
  // Audio
  const audio = document.getElementById('listenAudio');
  const hint = document.getElementById('listenAudioHint');
  // Check audio exists
  try {
    const ar = await fetch(`audio/${pid}.mp3`, { method: 'HEAD' });
    if (ar.ok && parseInt(ar.headers.get('content-length') || 0) > 0) {
      audio.src = `audio/${pid}.mp3`;
      audio.style.display = '';
      hint.textContent = '点击播放听力音频，听完后选择答案';
    } else {
      audio.removeAttribute('src');
      audio.style.display = 'none';
      hint.innerHTML = '<span class="exam-no-audio">⚠️ 本套试卷暂无听力音频材料，您仍可作答</span>';
    }
  } catch {
    audio.removeAttribute('src');
    audio.style.display = 'none';
    hint.innerHTML = '<span class="exam-no-audio">⚠️ 本套试卷暂无听力音频材料，您仍可作答</span>';
  }
  document.getElementById('listenTotal').textContent = listenData.listening.length;
  // 重置原文开关（英文、中文均默认关闭）
  const enT = document.getElementById('scriptEnToggle');
  const cnT = document.getElementById('scriptCnToggle');
  if (enT) enT.checked = false;
  if (cnT) cnT.checked = false;
  // 重置题目原文/译文开关（默认关闭）
  const qStemT = document.getElementById('qStemToggle');
  const qCnT = document.getElementById('qCnToggle');
  if (qStemT) qStemT.checked = false;
  if (qCnT) qCnT.checked = false;
  updateScriptBoxes();
  document.body.classList.add('listen-fullscreen');
  renderListenQuestion();
  window.scrollTo(0, 0);
}

// ---------- 听力原文/译文显示 ----------
function getListenScript() {
  return (listenData && listenData.listening_script) || null;
}

function updateScriptBoxes() {
  const script = getListenScript();
  const enT = document.getElementById('scriptEnToggle');
  const cnT = document.getElementById('scriptCnToggle');
  const enBox = document.getElementById('scriptEnBox');
  const cnBox = document.getElementById('scriptCnBox');
  const enContent = document.getElementById('scriptEnContent');
  const cnContent = document.getElementById('scriptCnContent');
  if (!enBox || !cnBox || !enContent || !cnContent) return;
  // 英文原文区
  if (enT && enT.checked) {
    enBox.style.display = '';
    enContent.innerHTML = (script && script.en && script.en.trim())
      ? script.en.split(/\n+/).map(p => `<p>${p}</p>`).join('')
      : '<p class="script-none">暂无本套试卷的英文原文，敬请期待</p>';
  } else {
    enBox.style.display = 'none';
  }
  // 中文译文区（与英文独立）
  if (cnT && cnT.checked) {
    cnBox.style.display = '';
    cnContent.innerHTML = (script && script.cn && script.cn.trim())
      ? script.cn.split(/\n+/).map(p => `<p>${p}</p>`).join('')
      : '<p class="script-none">暂无本套试卷的中文译文，敬请期待</p>';
  } else {
    cnBox.style.display = 'none';
  }
}

function toggleScript() {
  updateScriptBoxes();
}

function renderListenQuestion() {
  const q = listenData.listening[listenCurIdx];
  const total = listenData.listening.length;
  document.getElementById('listenCur').textContent = listenCurIdx + 1;
  // In overall mode, don't show live score
  document.getElementById('listenScore').textContent = (listenMode === 'perQ') ? listenScore : '—';
  const answered = listenAnswered.has(q.num);
  const userAns = listenAnswers[q.num] || '';
  const correctAns = (listenData.answers || {})[String(q.num)] || '';
  const showFeedback = (listenMode === 'perQ') && answered;
  let optionsHtml = '';
  for (const [letter, text] of Object.entries(q.options || {})) {
    let cls = 'listen-opt';
    let mark = '';
    if (showFeedback) {
      if (letter === correctAns) cls += ' opt-correct';
      else if (letter === userAns) cls += ' opt-wrong';
      if (letter === correctAns) mark = ' <span class="opt-mark">✓ 正确答案</span>';
    }
    const checked = (letter === userAns) ? 'checked' : '';
    // In perQ mode, disable after answering; in overall mode, allow changing answer
    const disabled = (listenMode === 'perQ' && answered) ? 'disabled' : '';
    optionsHtml += `<label class="${cls}">
      <input type="radio" name="listenQ" value="${letter}" ${checked} ${disabled} onchange="listenAnswer('${letter}')" />
      <span><b>${letter})</b> ${text}</span>${mark}
    </label>`;
  }
  let feedbackHtml = '';
  if (showFeedback) {
    const right = userAns.toUpperCase() === correctAns.toUpperCase();
    feedbackHtml = `<div class="listen-feedback ${right ? 'fb-right' : 'fb-wrong'}">
      ${right ? '🎉 回答正确！' : `❌ 回答错误，正确答案是 <b>${correctAns}</b>`}
    </div>`;
  } else if (listenMode === 'overall' && answered) {
    feedbackHtml = `<div class="listen-feedback fb-pending">✓ 已作答（${userAns}），全部完成后统一对答案</div>`;
  }
  // 题目原文 & 题目译文（按开关显示）
  let stemExtra = '';
  const qStemT = document.getElementById('qStemToggle');
  const qCnT = document.getElementById('qCnToggle');
  if (qStemT && qStemT.checked && q.stem) {
    stemExtra += `<div class="listen-q-stem"><b>Q.</b> ${q.stem}</div>`;
  }
  if (qCnT && qCnT.checked) {
    if (q.stem_cn) stemExtra += `<div class="listen-q-stem-cn"><b>题目：</b>${q.stem_cn}</div>`;
    if (q.options_cn && Object.keys(q.options_cn).length) {
      let optCn = '';
      for (const [letter, text] of Object.entries(q.options_cn)) {
        optCn += `<div><b>${letter})</b> ${text}</div>`;
      }
      stemExtra += `<div class="listen-q-opt-cn">${optCn}</div>`;
    }
  }
  document.getElementById('listenCard').innerHTML = `
    <div class="listen-q-num">第 ${q.num} 题</div>
    ${stemExtra}
    <div class="listen-q-options">${optionsHtml}</div>
    ${feedbackHtml}
  `;
  document.getElementById('listenPrevBtn').style.visibility = listenCurIdx === 0 ? 'hidden' : 'visible';
  document.getElementById('listenNextBtn').textContent = (listenCurIdx === total - 1) ? '查看结果' : '下一题';
}

function setListenMode(mode) {
  listenMode = mode;
  // If switching to perQ mode, recalculate score from already answered questions
  if (mode === 'perQ') {
    listenScore = 0;
    listenData.listening.forEach(q => {
      const userAns = listenAnswers[q.num] || '';
      const correctAns = (listenData.answers || {})[String(q.num)] || '';
      if (userAns && userAns.toUpperCase() === correctAns.toUpperCase()) listenScore++;
    });
  } else {
    // Switching to overall mode: don't show score live, it will be calculated at finish
    listenScore = 0;
  }
  renderListenQuestion();
}

function listenAnswer(letter) {
  const q = listenData.listening[listenCurIdx];
  const correctAns = (listenData.answers || {})[String(q.num)] || '';
  if (listenMode === 'perQ') {
    // perQ mode: lock after first answer
    if (listenAnswered.has(q.num)) return;
    listenAnswers[q.num] = letter;
    listenAnswered.add(q.num);
    if (letter.toUpperCase() === correctAns.toUpperCase()) listenScore++;
  } else {
    // overall mode: allow changing answer until finish
    const wasAnswered = listenAnswered.has(q.num);
    listenAnswers[q.num] = letter;
    if (!wasAnswered) listenAnswered.add(q.num);
  }
  renderListenQuestion();
}

function listenNext() {
  const total = listenData.listening.length;
  if (listenCurIdx < total - 1) {
    listenCurIdx++;
    renderListenQuestion();
  } else {
    listenFinish();
  }
}

function listenPrev() {
  if (listenCurIdx > 0) {
    listenCurIdx--;
    renderListenQuestion();
  }
}

function listenFinish() {
  stopListenAudio();
  const total = listenData.listening.length;
  // Calculate score (for overall mode, score wasn't tracked live)
  let finalScore = 0;
  listenData.listening.forEach(q => {
    const userAns = (listenAnswers[q.num] || '').toUpperCase();
    const correctAns = ((listenData.answers || {})[String(q.num)] || '').toUpperCase();
    if (userAns && userAns === correctAns) finalScore++;
  });
  const answered = listenAnswered.size;
  const score = total ? Math.round(finalScore / total * 100) : 0;
  // 保存听力练习记录到本地
  try {
    const log = JSON.parse(localStorage.getItem('cet4_practice_log') || '{}');
    if (!log.listen) log.listen = [];
    log.listen.unshift({ pid: listenData.id, score, correct: finalScore, total, answered, date: new Date().toISOString() });
    if (log.listen.length > 50) log.listen.length = 50;
    localStorage.setItem('cet4_practice_log', JSON.stringify(log));
  } catch (e) {}
  document.getElementById('listenArea').style.display = 'none';
  document.getElementById('listenResult').style.display = '';
  // Build review
  let reviewHtml = '';
  listenData.listening.forEach((q, i) => {
    const userAns = listenAnswers[q.num] || '未答';
    const correctAns = (listenData.answers || {})[String(q.num)] || '';
    const right = userAns.toUpperCase() === correctAns.toUpperCase();
    reviewHtml += `<div class="review-item ${right ? 'right' : 'wrong'}">
      <span class="r-num">${q.num}</span>
      <span class="r-user">你的: ${userAns}</span>
      <span class="r-correct">正确: ${correctAns}</span>
      <span class="r-mark">${right ? '✓' : '✗'}</span>
    </div>`;
  });
  document.getElementById('listenResultBox').innerHTML = `
    <div class="exam-score-box">
      <div class="score-circle">${score}</div>
      <div class="score-detail">
        <p>正确 <b>${finalScore}</b> / ${total} 题</p>
        <p>已作答 <b>${answered}</b> / ${total} 题</p>
        <p>听力得分率 <b>${score}%</b></p>
      </div>
    </div>
    <div style="text-align:center; margin: 20px 0;">
      <button class="btn-back" onclick="listenBack()">← 再选一套</button>
    </div>
    <h3>📋 答题对照</h3>
    <div class="review-grid">${reviewHtml}</div>
  `;
  window.scrollTo(0, 0);
}

function listenBack() {
  stopListenAudio();
  document.body.classList.remove('listen-fullscreen');
  document.getElementById('listenArea').style.display = 'none';
  document.getElementById('listenResult').style.display = 'none';
  document.getElementById('listenSelect').style.display = '';
  listenData = null;
  listenAnswers = {};
  listenAnswered = new Set();
  listenScore = 0;
  listenCurIdx = 0;
}

// ---------- 下载功能 ----------

// 将 HTML 下载为 Word (.doc)
function downloadWordDoc(html, filename) {
  const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${filename}</title>
<style>
body{font-family:"宋体",SimSun,serif;font-size:12pt;line-height:1.6;color:#222;}
h1{font-size:18pt;text-align:center;margin:12pt 0;}
h2{font-size:14pt;margin:10pt 0 6pt;border-bottom:1px solid #999;padding-bottom:2pt;}
h3{font-size:13pt;margin:8pt 0 4pt;}
p{margin:4pt 0;}
table{border-collapse:collapse;width:100%;margin:6pt 0;}
td,th{border:1px solid #666;padding:4pt 6pt;font-size:11pt;}
.option{margin:2pt 0;}
.wb{display:inline-block;width:32%;margin:2pt 0;}
.ans-row{display:inline-block;width:18%;margin:4pt 0;}
.blank{border-bottom:1px solid #999;display:inline-block;width:90px;}
</style></head><body>${html}</body></html>`;
  const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + '.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 将 HTML 下载为 PDF（分批渲染 + 连续填充页面，避免中间空白）
async function downloadPDF(html, filename) {
  const scale = 2;
  const pageAvailHeightPx = (297 - 20) * 96 / 25.4; // A4 可用高度（mm→px，96dpi）
  const MAX_BATCH_HEIGHT = pageAvailHeightPx * 5; // 每批最多约5页，避免 canvas 超限

  // 用临时 div 测量所有子元素的位置
  const measureDiv = document.createElement('div');
  Object.assign(measureDiv.style, {
    position: 'absolute', left: '-9999px', top: '0',
    width: '794px', padding: '40px', background: '#fff', color: '#222',
    fontFamily: '"宋体",SimSun,serif', fontSize: '14px', lineHeight: '1.7'
  });
  measureDiv.innerHTML = html;
  document.body.appendChild(measureDiv);
  measureDiv.offsetHeight;

  const children = Array.from(measureDiv.children);

  // 按高度分组，每组不超过 MAX_BATCH_HEIGHT
  const batches = [];
  if (children.length) {
    let currentBatch = [];
    let batchStartTop = children[0].offsetTop;
    for (const child of children) {
      const childBottom = child.offsetTop + child.offsetHeight;
      if (childBottom - batchStartTop > MAX_BATCH_HEIGHT && currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [];
        batchStartTop = child.offsetTop;
      }
      currentBatch.push(child);
    }
    if (currentBatch.length) batches.push(currentBatch);
  }
  document.body.removeChild(measureDiv);

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const pageAvailHeightMm = pageHeight - margin * 2;

  // 连续填充：跟踪当前 PDF 页的 Y 位置，跨批次累积内容
  let currentY = margin; // 当前页内容起始 Y（mm）

  for (const batch of batches) {
    const batchDiv = document.createElement('div');
    Object.assign(batchDiv.style, {
      position: 'absolute', left: '-9999px', top: '0',
      width: '794px', padding: '40px', background: '#fff', color: '#222',
      fontFamily: '"宋体",SimSun,serif', fontSize: '14px', lineHeight: '1.7'
    });
    batch.forEach(el => batchDiv.appendChild(el.cloneNode(true)));
    document.body.appendChild(batchDiv);
    batchDiv.offsetHeight;

    // 固定高度切片：不再避免切断元素，确保无空白
    const totalHeight = batchDiv.scrollHeight;
    const pageBreaks = [];
    for (let y = 0; y < totalHeight; y += pageAvailHeightPx) {
      pageBreaks.push(y);
    }

    const canvas = await html2canvas(batchDiv, {
      scale: scale, useCORS: true, backgroundColor: '#ffffff',
      letterRendering: true, windowWidth: batchDiv.scrollWidth
    });
    document.body.removeChild(batchDiv);

    const scaleFactor = contentWidth / canvas.width; // px → mm

    // 逐段添加到 PDF，连续填充当前页
    for (let p = 0; p < pageBreaks.length; p++) {
      const startY = Math.round(pageBreaks[p] * scale);
      const endY = p < pageBreaks.length - 1
        ? Math.round(pageBreaks[p + 1] * scale)
        : canvas.height;
      const sliceHeightPx = Math.max(1, endY - startY);
      const sliceHeightMm = sliceHeightPx * scaleFactor;

      // 裁剪当前段的 canvas
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;
      const ctx = pageCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(canvas, 0, startY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      const imgData = pageCanvas.toDataURL('image/jpeg', 0.92);

      // 连续填充：如果当前页放不下，换新页
      if (currentY + sliceHeightMm > pageHeight - margin + 0.5) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.addImage(imgData, 'JPEG', margin, currentY, contentWidth, sliceHeightMm);
      currentY += sliceHeightMm;
    }
  }

  pdf.save(filename + '.pdf');
}

// 试卷标题
function paperTitle(paper) {
  const p = paper.id.split('-');
  return `${p[0]}年${parseInt(p[1])}月大学英语四级真题（第${p[2]}套）`;
}

// 构建试卷 HTML
function buildExamPaperHTML(paper) {
  let h = `<h1>${paperTitle(paper)}</h1>`;

  // Part I Writing
  if (paper.writing) {
    h += `<h2>Part I Writing (30 minutes)</h2>`;
    h += `<p>${paper.writing.replace(/\n/g, '<br>')}</p>`;
    h += `<p style="margin-top:20px;">（请在此处作答）</p>`;
    for (let i = 0; i < 12; i++) h += `<p style="border-bottom:1px solid #ccc;height:24px;margin:6px 0;"></p>`;
  }

  // Part II Listening
  if (paper.listening && paper.listening.length) {
    h += `<h2>Part II Listening Comprehension (25 minutes)</h2>`;
    h += `<p><i>说明：本部分共 25 题，请根据听到的音频内容作答。</i></p>`;
    paper.listening.forEach(q => {
      h += `<p><b>${q.num}.</b></p>`;
      Object.keys(q.options).forEach(k => {
        h += `<p class="option">&nbsp;&nbsp;&nbsp;&nbsp;${k}. ${q.options[k]}</p>`;
      });
    });
  }

  // Part III Reading
  h += `<h2>Part III Reading Comprehension (40 minutes)</h2>`;

  // Section A 选词填空
  if (paper.word_bank && paper.cloze_passage) {
    h += `<h3>Section A</h3>`;
    h += `<p>Directions: In this section, there is a passage with ten blanks. You are required to select one word for each blank from a list of choices given in a word bank.</p>`;
    h += `<p><b>Word Bank:</b></p>`;
    const wbKeys = Object.keys(paper.word_bank);
    wbKeys.forEach(k => {
      h += `<span class="wb">${k}. ${paper.word_bank[k]}</span>`;
    });
    h += `<p style="margin-top:10px;">${paper.cloze_passage.replace(/\n/g, '<br>')}</p>`;
  }

  // Section B 长篇阅读
  if (paper.long_reading_passage && paper.long_reading && paper.long_reading.length) {
    h += `<h3>Section B</h3>`;
    h += `<p>Directions: In this section, you are going to read a passage with ten statements attached to it. Each statement contains information given in one of the paragraphs. Identify the paragraph from which the information is derived.</p>`;
    h += `<p>${paper.long_reading_passage.replace(/\n/g, '<br>')}</p>`;
    h += `<p><b>Statements:</b></p>`;
    paper.long_reading.forEach(q => {
      h += `<p><b>${q.num}.</b> ${q.stem || ''}</p>`;
    });
  }

  // Section C 仔细阅读
  if (paper.reading_passage_1 && paper.reading_1 && paper.reading_1.length) {
    h += `<h3>Section C - Passage 1</h3>`;
    h += `<p>${paper.reading_passage_1.replace(/\n/g, '<br>')}</p>`;
    paper.reading_1.forEach(q => {
      h += `<p><b>${q.num}.</b> ${q.stem || ''}</p>`;
      Object.keys(q.options).forEach(k => {
        h += `<p class="option">&nbsp;&nbsp;&nbsp;&nbsp;${k}. ${q.options[k]}</p>`;
      });
    });
  }
  if (paper.reading_passage_2 && paper.reading_2 && paper.reading_2.length) {
    h += `<h3>Section C - Passage 2</h3>`;
    h += `<p>${paper.reading_passage_2.replace(/\n/g, '<br>')}</p>`;
    paper.reading_2.forEach(q => {
      h += `<p><b>${q.num}.</b> ${q.stem || ''}</p>`;
      Object.keys(q.options).forEach(k => {
        h += `<p class="option">&nbsp;&nbsp;&nbsp;&nbsp;${k}. ${q.options[k]}</p>`;
      });
    });
  }

  // Part IV Translation
  if (paper.translation) {
    h += `<h2>Part IV Translation (30 minutes)</h2>`;
    h += `<p>${paper.translation.replace(/\n/g, '<br>')}</p>`;
    h += `<p style="margin-top:20px;">（请在此处作答）</p>`;
    for (let i = 0; i < 12; i++) h += `<p style="border-bottom:1px solid #ccc;height:24px;margin:6px 0;"></p>`;
  }

  return h;
}

// 构建答题卡 HTML
function buildAnswerSheetHTML(paper) {
  let h = `<h1>${paperTitle(paper)} - 答题卡</h1>`;
  h += `<p>姓名：__________ &nbsp;&nbsp; 准考证号：____________________ &nbsp;&nbsp; 座位号：__________</p>`;
  h += `<hr>`;

  // Writing
  h += `<h2>Part I Writing</h2>`;
  for (let i = 0; i < 18; i++) h += `<p style="border-bottom:1px solid #999;height:24px;margin:4px 0;"></p>`;

  // Listening 1-25 (ABCD)
  h += `<h2>Part II Listening Comprehension (1-25)</h2>`;
  h += `<table style="border-collapse:collapse;width:100%;">`;
  for (let row = 0; row < 5; row++) {
    h += `<tr>`;
    for (let col = 0; col < 5; col++) {
      const num = row * 5 + col + 1;
      h += `<td style="border:1px solid #999;padding:6px 8px;font-size:12px;">${num}. [A] [B] [C] [D]</td>`;
    }
    h += `</tr>`;
  }
  h += `</table>`;

  // Reading
  h += `<h2>Part III Reading Comprehension</h2>`;

  // Section A 26-35 (A-O 选词填空)
  h += `<h3>Section A (26-35) 选词填空</h3>`;
  h += `<table style="border-collapse:collapse;width:100%;">`;
  for (let row = 0; row < 2; row++) {
    h += `<tr>`;
    for (let col = 0; col < 5; col++) {
      const num = 26 + row * 5 + col;
      h += `<td style="border:1px solid #999;padding:5px 6px;font-size:11px;line-height:1.5;">${num}.<br>[A][B][C][D][E]<br>[F][G][H][I][J]<br>[K][L][M][N][O]</td>`;
    }
    h += `</tr>`;
  }
  h += `</table>`;

  // Section B 36-45 (A-K 长篇阅读)
  h += `<h3>Section B (36-45) 长篇阅读</h3>`;
  h += `<table style="border-collapse:collapse;width:100%;">`;
  for (let row = 0; row < 2; row++) {
    h += `<tr>`;
    for (let col = 0; col < 5; col++) {
      const num = 36 + row * 5 + col;
      h += `<td style="border:1px solid #999;padding:5px 6px;font-size:11px;line-height:1.5;">${num}.<br>[A][B][C][D][E]<br>[F][G][H][I][J][K]</td>`;
    }
    h += `</tr>`;
  }
  h += `</table>`;

  // Section C 46-55 (ABCD)
  h += `<h3>Section C (46-55) 仔细阅读</h3>`;
  h += `<table style="border-collapse:collapse;width:100%;">`;
  for (let row = 0; row < 2; row++) {
    h += `<tr>`;
    for (let col = 0; col < 5; col++) {
      const num = 46 + row * 5 + col;
      h += `<td style="border:1px solid #999;padding:6px 8px;font-size:12px;">${num}. [A] [B] [C] [D]</td>`;
    }
    h += `</tr>`;
  }
  h += `</table>`;

  // Translation
  h += `<h2>Part IV Translation</h2>`;
  for (let i = 0; i < 14; i++) h += `<p style="border-bottom:1px solid #999;height:24px;margin:4px 0;"></p>`;

  return h;
}

function downloadExamPaper(format) {
  if (!examData) return;
  const html = buildExamPaperHTML(examData);
  const fn = `四级真题_${examData.id}_试卷`;
  if (format === 'pdf') downloadPDF(html, fn);
  else downloadWordDoc(html, fn);
}

function downloadAnswerSheet(format) {
  if (!examData) return;
  const html = buildAnswerSheetHTML(examData);
  const fn = `四级真题_${examData.id}_答题卡`;
  if (format === 'pdf') downloadPDF(html, fn);
  else downloadWordDoc(html, fn);
}

function downloadExamAudio() {
  if (!examData || !examHasAudio) {
    alert('本套试卷暂无听力音频');
    return;
  }
  const a = document.createElement('a');
  a.href = `audio/${examData.id}.mp3`;
  a.download = `四级听力_${examData.id}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// 考前应急材料下载
function buildIntensiveHTML() {
  let h = '';
  if (currentIntensiveModule === 'words') {
    h += `<h1 style="text-align:center;font-size:22pt;margin-bottom:4pt;">四级高频词汇</h1>`;
    h += `<p style="text-align:center;color:#666;font-size:11pt;margin:0 0 14pt 0;">共 ${HIGH_FREQ_WORDS.length} 词 · 按字母排序</p>`;
    const grouped = {};
    HIGH_FREQ_WORDS.forEach(w => {
      const letter = w.word[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(w);
    });
    Object.keys(grouped).sort().forEach(letter => {
      h += `<h2 style="font-size:15pt;color:#4f6bed;margin:10px 0 4px 0;padding-bottom:2px;border-bottom:2px solid #4f6bed;display:inline-block;">${letter}</h2>`;
      h += `<table style="width:100%;border-collapse:collapse;margin-bottom:6px;">`;
      const words = grouped[letter];
      // 每行放两个单词，减少页数
      for (let i = 0; i < words.length; i += 2) {
        const w1 = words[i];
        const w2 = words[i + 1];
        h += `<tr>`;
        h += `<td style="width:17%;padding:2px 4px;font-size:11px;font-weight:600;color:#333;border-bottom:1px dashed #eee;vertical-align:top;">${w1.word}</td>`;
        h += `<td style="width:33%;padding:2px 4px;font-size:11px;color:#555;border-bottom:1px dashed #eee;vertical-align:top;line-height:1.4;">${w1.meaning}</td>`;
        if (w2) {
          h += `<td style="width:17%;padding:2px 4px;font-size:11px;font-weight:600;color:#333;border-bottom:1px dashed #eee;vertical-align:top;">${w2.word}</td>`;
          h += `<td style="width:33%;padding:2px 4px;font-size:11px;color:#555;border-bottom:1px dashed #eee;vertical-align:top;line-height:1.4;">${w2.meaning}</td>`;
        } else {
          h += `<td style="width:50%;border-bottom:1px dashed #eee;"></td>`;
        }
        h += `</tr>`;
      }
      h += `</table>`;
    });
  } else if (currentIntensiveModule === 'phrases') {
    h += `<h1>四级高频短语（共 ${HIGH_FREQ_PHRASES.length} 条）</h1>`;
    const cats = [
      { key: 'verb', name: '动词短语' },
      { key: 'noun_prep', name: '名词 / 介词短语' },
      { key: 'writing', name: '写作加分搭配' }
    ];
    cats.forEach(c => {
      const items = HIGH_FREQ_PHRASES.filter(p => p.category === c.key);
      if (!items.length) return;
      h += `<h2>${c.name}（${items.length}）</h2><table>`;
      items.forEach(p => {
        h += `<tr><td style="width:40%;">${p.starred ? '★ ' : ''}${p.phrase}</td><td>${p.meaning}</td></tr>`;
      });
      h += `</table>`;
    });
  } else {
    h += `<h1>四级作文万能句式（共 ${ESSAY_SENTENCES.length} 句）</h1>`;
    const cats = [
      { key: 'opening', name: '一、开头引入' },
      { key: 'comparison', name: '二、对比不同观点' },
      { key: 'reason', name: '三、分析原因' },
      { key: 'proscons', name: '四、表达利弊影响' },
      { key: 'suggestion', name: '五、建议措施' },
      { key: 'conclusion', name: '六、个人观点与结尾' }
    ];
    cats.forEach(c => {
      const items = ESSAY_SENTENCES.filter(s => s.category === c.key);
      if (!items.length) return;
      h += `<h2>${c.name}（${items.length}）</h2>`;
      items.forEach(s => {
        h += `<p><b>${s.starred ? '★ ' : ''}${s.sentence}</b></p>`;
        h += `<p style="color:#666;margin-left:20px;">${s.translation}</p>`;
      });
    });
  }
  return h;
}

function downloadIntensive(format) {
  const html = buildIntensiveHTML();
  const names = { words: '高频词汇', phrases: '高频短语', essay: '作文句式' };
  const fn = `四级考前应急_${names[currentIntensiveModule] || '材料'}`;
  if (format === 'pdf') downloadPDF(html, fn);
  else downloadWordDoc(html, fn);
}

// ---------- 初始化 ----------
renderBrowse();
