// ==================== 柳韵新声 主应用逻辑 ====================

// ========== 导航 ==========
function navigateTo(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const target = document.getElementById(section);
  if (target) target.classList.add('active');
  const link = document.querySelector(`[data-section="${section}"]`);
  if (link) link.classList.add('active');
  if (section === 'quiz') initQuiz();
  if (section === 'piano') initPiano();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(link.dataset.section);
  });
});

function handleHash() {
  const hash = window.location.hash.slice(1);
  if (hash && ['home','quiz','piano'].includes(hash)) navigateTo(hash);
}
window.addEventListener('hashchange', handleHash);
handleHash();

// ========== 音效 ==========
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playClickSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 800; osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
  } catch(e) {}
}

function playCorrectSound() {
  try {
    const ctx = getAudioCtx();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t); osc.stop(t + 0.25);
    });
  } catch(e) {}
}

function playWrongSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 200; osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35);
  } catch(e) {}
}

// ========== 柳琴音色合成 ==========
function playLiuqinNote(freq, volume) {
  if (!volume) volume = 0.7;
  try {
    const ctx = getAudioCtx();
    const sr = ctx.sampleRate;
    const delayLen = Math.round(sr / freq);
    const delay = ctx.createDelay(sr);
    delay.delayTime.value = delayLen / sr;
    const fb = ctx.createGain();
    fb.gain.value = 0.94;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = Math.min(freq * 4, sr * 0.4);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = Math.max(freq * 0.5, 80);
    const out = ctx.createGain();
    out.gain.value = volume;

    const noiseLen = Math.floor(sr * 0.03);
    const buf = ctx.createBuffer(1, noiseLen, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.2));
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    noise.connect(delay); delay.connect(lp); lp.connect(hp);
    hp.connect(fb); fb.connect(delay); hp.connect(out); out.connect(ctx.destination);

    const now = ctx.currentTime;
    out.gain.setValueAtTime(volume, now);
    out.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    fb.gain.setValueAtTime(0.94, now);
    fb.gain.linearRampToValueAtTime(0.5, now + 0.8);
    fb.gain.linearRampToValueAtTime(0.1, now + 1.5);
    noise.start(now); noise.stop(now + 0.03);
  } catch(e) {}
}

// ========== 虚拟柳琴 ==========
let currentOctave = 1, pianoVolume = 0.7;

function initPiano() {
  const container = document.getElementById('pianoKeys');
  const notes = PIANO_NOTES[OCTAVE_NAMES[currentOctave]];
  container.innerHTML = '';
  notes.forEach(note => {
    const key = document.createElement('div');
    key.className = 'piano-key';
    key.textContent = note.label;
    key.dataset.freq = note.freq;
    key.dataset.name = note.name;
    key.addEventListener('mousedown', (e) => { e.preventDefault(); key.classList.add('pressed'); playLiuqinNote(note.freq, pianoVolume); });
    key.addEventListener('mouseup', () => key.classList.remove('pressed'));
    key.addEventListener('mouseleave', () => key.classList.remove('pressed'));
    key.addEventListener('touchstart', (e) => { e.preventDefault(); key.classList.add('pressed'); playLiuqinNote(note.freq, pianoVolume); });
    key.addEventListener('touchend', () => key.classList.remove('pressed'));
    container.appendChild(key);
  });
  document.getElementById('octaveLabel').textContent = OCTAVE_LABELS[currentOctave];
  renderScoreCards();
}

function shiftOctave(d) { playClickSound(); currentOctave = Math.max(0, Math.min(2, currentOctave + d)); initPiano(); }
function setVolume(v) { pianoVolume = v / 100; }

function renderScoreCards() {
  const container = document.getElementById('scoreCards');
  container.innerHTML = '';
  const map = {};
  OCTAVE_NAMES.forEach(o => PIANO_NOTES[o].forEach(n => map[n.name] = n.freq));
  melodies.forEach(m => {
    const card = document.createElement('div');
    card.className = 'score-card';
    card.innerHTML = '<div class="score-name">' + m.name + '</div>';
    card.addEventListener('click', () => playMelody(m));
    container.appendChild(card);
  });
}

function playMelody(m) {
  playClickSound();
  const map = {};
  OCTAVE_NAMES.forEach(o => PIANO_NOTES[o].forEach(n => map[n.name] = n.freq));
  const names = m.notes.split(/\s+/);
  const intv = 60000 / m.bpm;
  names.forEach((name, i) => {
    if (map[name]) {
      setTimeout(() => {
        playLiuqinNote(map[name], pianoVolume);
        document.querySelectorAll('.piano-key').forEach(k => {
          if (k.dataset.name === name) { k.classList.add('pressed'); setTimeout(() => k.classList.remove('pressed'), 200); }
        });
      }, i * intv);
    }
  });
}

// ========== 梨园考场 ==========
let currentQuizType = 'choice';
let totalScore = 0;
let choiceDone = 0, fillDone = 0, tfDone = 0;

// 单选题 10题一关
let choiceRoundIdx = 0;
let choiceUserAnswers = [];
let choiceSubmitted = false;
let filteredChoiceRounds = [];

// 填空题
let fillIdx = 0, filteredFill = [];

// 判断题
let tfIdx = 0, filteredTF = [];

// ===== 筛选 =====
function getFiltered(src, cat, lvl) {
  return src.filter(q => {
    if (cat !== 'all' && q.category && !q.category.includes(cat)) return false;
    if (lvl !== 'all' && q.level !== lvl) return false;
    return true;
  });
}

function buildRounds(qs) {
  const groups = {};
  qs.forEach(function(q) {
    var k = q.category + '|' + q.level;
    if (!groups[k]) groups[k] = [];
    groups[k].push(q);
  });
  var catOrder = ['腔调篇', '乐器篇', '动作篇'];
  var lvlOrder = ['入门级', '进阶级', '高阶'];
  return Object.values(groups).map(function(g) {
    return {
      label: g[0].category.replace(/\（.+/, '') + ' · ' + g[0].level,
      sortCat: catOrder.indexOf(g[0].category.replace(/\（.+/, '').substring(0, 3)),
      sortLvl: lvlOrder.indexOf(g[0].level),
      questions: g
    };
  }).sort(function(a, b) { return a.sortCat - b.sortCat || a.sortLvl - b.sortLvl; });
}

// ===== 进度存储 =====
var STORAGE_KEY = 'liuyunxs_progress';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch(e) { return {}; }
}

function saveProgress(prog) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
}

function markRoundPassed(roundKey, score) {
  var prog = loadProgress();
  if (!prog[roundKey] || prog[roundKey].score < score) {
    prog[roundKey] = { passed: true, score: score, time: Date.now() };
    saveProgress(prog);
  }
}

function isRoundUnlocked(roundKey, roundIdx) {
  if (roundIdx === 0) return true;  // 第一关始终解锁
  var prog = loadProgress();
  // 前一关必须通过
  var prevKey = Object.keys(filteredChoiceRounds).length > 0 ? getRoundKey(roundIdx - 1) : null;
  if (prevKey !== null) return !!(prog[prevKey] && prog[prevKey].passed);
  return false;
}

function getRoundKey(idx) {
  // 在 filteredChoiceRounds 中查找
  if (idx < 0 || idx >= filteredChoiceRounds.length) return null;
  var r = filteredChoiceRounds[idx];
  return (r.questions[0].category + '|' + r.questions[0].level).replace(/[（(].+[）)]/, '').trim();
}

function applyChoiceFilter() {
  var cat = document.getElementById('filterChoiceCat').value;
  var lvl = document.getElementById('filterChoiceLevel').value;
  filteredChoiceRounds = buildRounds(getFiltered(choiceQuestions, cat, lvl));
  choiceRoundIdx = 0;
  initChoiceRound();
}

function applyFillFilter() {
  var cat = document.getElementById('filterFillCat').value;
  var lvl = document.getElementById('filterFillLevel').value;
  filteredFill = getFiltered(fillQuestions, cat, lvl);
  fillIdx = 0;
  document.getElementById('fillFilterInfo').textContent = filteredFill.length + ' 题';
  renderFillQuestion();
}

function applyTFFilter() {
  var cat = document.getElementById('filterTFCat').value;
  var lvl = document.getElementById('filterTFLevel').value;
  filteredTF = getFiltered(trueFalseQuestions, cat, lvl);
  tfIdx = 0;
  document.getElementById('tfFilterInfo').textContent = filteredTF.length + ' 题';
  renderTrueFalseQuestion();
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ===== 题型切换 =====
document.querySelectorAll('.quiz-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    playClickSound();
    document.querySelectorAll('.quiz-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.quiz-panel').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    currentQuizType = this.dataset.quizType;
    document.getElementById('quiz' + cap(currentQuizType)).classList.add('active');

    document.getElementById('filterChoice').style.display = currentQuizType === 'choice' ? 'flex' : 'none';
    document.getElementById('filterFill').style.display = currentQuizType === 'fill' ? 'flex' : 'none';
    document.getElementById('filterTF').style.display = currentQuizType === 'truefalse' ? 'flex' : 'none';

    if (currentQuizType === 'choice') initChoiceRound();
    else if (currentQuizType === 'fill') renderFillQuestion();
    else renderTrueFalseQuestion();
  });
});

function initQuiz() {
  applyChoiceFilter();
  applyFillFilter();
  applyTFFilter();
  totalScore = 0; choiceDone = 0; fillDone = 0; tfDone = 0;
  updateScoreDisplay();
}

function updateScoreDisplay() {
  document.getElementById('quizScore').textContent = totalScore;
  var done = choiceDone + fillDone + tfDone;
  document.getElementById('quizProgress').textContent = done + '/' + (choiceQuestions.length + fillQuestions.length + trueFalseQuestions.length);
  var stars = done > 0 ? Math.min(5, Math.floor(totalScore / (done * 10) * 5)) : 0;
  document.getElementById('quizStars').innerHTML = Array(stars + 1).join('⭐') + Array(6 - stars).join('☆');
}

// ===== 单选题 10题一关 =====
function initChoiceRound() {
  choiceUserAnswers = new Array(10).fill(-1);
  choiceSubmitted = false;
  document.getElementById('choiceFilterInfo').textContent = filteredChoiceRounds.length + ' 关 ' + filteredChoiceRounds.reduce(function(s, r) { return s + r.questions.length; }, 0) + ' 题';
  renderChoiceRound();
}

function renderChoiceRound() {
  var list = document.getElementById('choiceQuestionList');
  var nav = document.getElementById('choiceLevelNav');
  var levelMap = document.getElementById('choiceLevelMap');
  var prevBtn = document.getElementById('choicePrevBtn');
  var nextBtn = document.getElementById('choiceNextBtn');

  if (filteredChoiceRounds.length === 0) {
    nav.style.display = 'none';
    levelMap.innerHTML = '';
    list.innerHTML = '<div class="question-card"><p style="text-align:center;padding:40px">当前筛选条件下没有题目，请调整筛选</p></div>';
    document.getElementById('choiceSubmitBtn').style.display = 'none';
    document.getElementById('choiceRetryBtn').style.display = 'none';
    return;
  }

  // 确保当前关是已解锁的
  var roundKey = getRoundKey(choiceRoundIdx);
  if (!isRoundUnlocked(roundKey, choiceRoundIdx) && choiceRoundIdx > 0) {
    // 往前找到第一个未解锁的
    for (var i = 0; i < filteredChoiceRounds.length; i++) {
      if (isRoundUnlocked(getRoundKey(i), i)) choiceRoundIdx = i;
      else break;
    }
  }

  nav.style.display = 'flex';
  var round = filteredChoiceRounds[choiceRoundIdx];
  var unlocked = isRoundUnlocked(getRoundKey(choiceRoundIdx), choiceRoundIdx);
  var alreadyDone = loadProgress()[getRoundKey(choiceRoundIdx)];

  document.getElementById('choiceLevelTitle').textContent = '第 ' + (choiceRoundIdx + 1) + ' 关 — ' + round.label;
  choiceUserAnswers = new Array(round.questions.length).fill(-1);

  // 关卡地图
  levelMap.innerHTML = '';
  for (var di = 0; di < filteredChoiceRounds.length; di++) {
    var dot = document.createElement('span');
    dot.className = 'level-dot';
    var dk = getRoundKey(di);
    var done = loadProgress()[dk];
    if (di === choiceRoundIdx) { dot.className += ' current'; dot.textContent = (di + 1); }
    else if (done && done.passed) { dot.className += ' done'; dot.textContent = '✓'; }
    else if (!isRoundUnlocked(dk, di)) { dot.className += ' locked'; dot.textContent = '🔒'; }
    else { dot.textContent = (di + 1); dot.style.cursor = 'pointer'; dot.title = '点击跳转'; dot.onclick = (function(idx) { return function() { if (idx <= choiceRoundIdx || (loadProgress()[getRoundKey(idx - 1)] && loadProgress()[getRoundKey(idx - 1)].passed)) { choiceRoundIdx = idx; initChoiceRound(); } }; })(di); }
    levelMap.appendChild(dot);
  }

  // 前后按钮
  prevBtn.disabled = (choiceRoundIdx === 0);
  var nextUnlocked = choiceRoundIdx + 1 < filteredChoiceRounds.length && isRoundUnlocked(getRoundKey(choiceRoundIdx + 1), choiceRoundIdx + 1);
  nextBtn.disabled = !nextUnlocked;

  // 渲染题目
  list.innerHTML = '';
  round.questions.forEach(function(q, qi) {
    var card = document.createElement('div');
    card.className = 'mini-question-card';
    card.id = 'cq-' + qi;
    var optsHTML = q.options.map(function(opt, oi) {
      return '<button class="mini-opt" onclick="selectChoiceOpt(' + qi + ',' + oi + ')">' + ['A','B','C','D'][oi] + '. ' + opt + '</button>';
    }).join('');
    card.innerHTML =
      '<div class="mini-q-header"><span class="mini-q-num">第 ' + (qi + 1) + ' 题</span><span class="mini-q-result" id="cqr-' + qi + '"></span></div>' +
      '<div class="mini-q-text">' + q.question + '</div>' +
      '<div class="mini-options" id="c-opts-' + qi + '">' + optsHTML + '</div>' +
      '<div class="mini-q-explain" id="cqe-' + qi + '">' + q.explanation + '</div>';
    list.appendChild(card);
  });

  document.getElementById('choiceSubmitBtn').style.display = 'inline-block';
  document.getElementById('choiceSubmitBtn').textContent = '交卷评分';
  document.getElementById('choiceRetryBtn').style.display = 'none';
  document.getElementById('choiceRoundScore').style.display = 'none';
}

function selectChoiceOpt(qi, oi) {
  if (choiceSubmitted) return;
  choiceUserAnswers[qi] = oi;
  var opts = document.querySelectorAll('#c-opts-' + qi + ' .mini-opt');
  for (var i = 0; i < opts.length; i++) opts[i].classList.remove('selected');
  opts[oi].classList.add('selected');
}

function submitChoiceRound() {
  if (choiceSubmitted || filteredChoiceRounds.length === 0) return;
  choiceSubmitted = true;

  var round = filteredChoiceRounds[choiceRoundIdx];
  var correctCount = 0;

  round.questions.forEach(function(q, qi) {
    var sel = choiceUserAnswers[qi];
    var card = document.getElementById('cq-' + qi);
    var result = document.getElementById('cqr-' + qi);
    var opts = document.querySelectorAll('#c-opts-' + qi + ' .mini-opt');
    var explain = document.getElementById('cqe-' + qi);

    for (var i = 0; i < opts.length; i++) opts[i].style.pointerEvents = 'none';
    explain.classList.add('show');

    if (sel === q.answer) {
      correctCount++;
      card.classList.add('answered-correct');
      result.textContent = ' ✓ ';
      result.classList.add('show');
      opts[sel].classList.add('correct-answer');
    } else {
      card.classList.add('answered-wrong');
      result.textContent = ' ✗ ';
      result.classList.add('show');
      if (sel >= 0) opts[sel].classList.add('wrong-answer');
      opts[q.answer].classList.add('correct-answer');
    }
  });

  choiceDone += correctCount;
  totalScore += correctCount * 10;
  updateScoreDisplay();
  if (correctCount === round.questions.length) playCorrectSound(); else playWrongSound();

  var scoreDiv = document.getElementById('choiceRoundScore');
  scoreDiv.style.display = 'block';
  var pct = correctCount / round.questions.length;
  var passed = pct >= 0.6;
  var roundKey = getRoundKey(choiceRoundIdx);

  if (passed) {
    markRoundPassed(roundKey, correctCount);
    scoreDiv.className = 'round-score great';
    scoreDiv.textContent = '🎉 通关！' + correctCount * 10 + ' 分（' + correctCount + '/' + round.questions.length + '）';
    // 启用下一关按钮
    if (choiceRoundIdx + 1 < filteredChoiceRounds.length) {
      document.getElementById('choiceNextBtn').disabled = false;
    }
  } else if (pct >= 0.5) {
    scoreDiv.className = 'round-score good';
    scoreDiv.textContent = '📖 ' + correctCount * 10 + ' 分（' + correctCount + '/' + round.questions.length + '）— 需 60 分通关，继续加油！';
  } else {
    scoreDiv.className = 'round-score fail';
    scoreDiv.textContent = '💪 ' + correctCount * 10 + ' 分（' + correctCount + '/' + round.questions.length + '）— 需 60 分通关，要多补课哦！';
  }

  // 更新关卡地图状态
  renderLevelMapDots();

  document.getElementById('choiceSubmitBtn').style.display = 'none';
  document.getElementById('choiceRetryBtn').style.display = 'inline-block';
}

function renderLevelMapDots() {
  var levelMap = document.getElementById('choiceLevelMap');
  if (!levelMap) return;
  var dots = levelMap.querySelectorAll('.level-dot');
  for (var di = 0; di < dots.length; di++) {
    var dk = getRoundKey(di);
    var done = loadProgress()[dk];
    dots[di].className = 'level-dot';
    if (di === choiceRoundIdx) { dots[di].className += ' current'; }
    else if (done && done.passed) { dots[di].className += ' done'; dots[di].textContent = '✓'; }
    else if (!isRoundUnlocked(dk, di)) { dots[di].className += ' locked'; dots[di].textContent = '🔒'; }
  }
  // 更新 next 按钮
  if (choiceRoundIdx + 1 < filteredChoiceRounds.length) {
    document.getElementById('choiceNextBtn').disabled = !isRoundUnlocked(getRoundKey(choiceRoundIdx + 1), choiceRoundIdx + 1);
  }
}

function choicePrevLevel() {
  if (filteredChoiceRounds.length === 0) return;
  if (choiceRoundIdx <= 0) return;
  playClickSound();
  choiceRoundIdx--;
  initChoiceRound();
}

function choiceNextLevel() {
  if (filteredChoiceRounds.length === 0) return;
  if (choiceRoundIdx + 1 >= filteredChoiceRounds.length) return;
  // 检查下一关是否解锁
  var nextKey = getRoundKey(choiceRoundIdx + 1);
  if (!isRoundUnlocked(nextKey, choiceRoundIdx + 1)) return;
  playClickSound();
  choiceRoundIdx++;
  initChoiceRound();
}

// ===== 唱词填空题 =====
function renderFillQuestion() {
  if (fillIdx >= filteredFill.length) {
    document.getElementById('fillMeta').textContent = '';
    document.getElementById('fillNum').textContent = '已完成';
    document.getElementById('fillContext').textContent = '本板块全部完成！';
    document.getElementById('fillOptions').innerHTML = '';
    document.getElementById('fillFeedback').className = 'question-feedback correct-fb show';
    document.getElementById('fillFeedback').textContent = '请切换到其他题型或调整筛选条件继续挑战。';
    document.getElementById('fillNext').style.display = 'none';
    return;
  }
  var q = filteredFill[fillIdx];
  document.getElementById('fillMeta').textContent = q.category + ' · ' + q.level;
  document.getElementById('fillNum').textContent = '第 ' + (fillIdx + 1) + ' 题 / 共 ' + filteredFill.length + ' 题';
  document.getElementById('fillContext').innerHTML = q.question.replace(/____/g, '<span class="blank-mark"></span>');
  document.getElementById('fillFeedback').className = 'question-feedback';
  document.getElementById('fillFeedback').textContent = '';
  document.getElementById('fillNext').style.display = 'none';

  var opts = document.getElementById('fillOptions');
  opts.innerHTML = '';
  q.options.forEach(function(opt, i) {
    var btn = document.createElement('button');
    btn.className = 'fill-option';
    btn.textContent = opt;
    btn.addEventListener('click', function() { checkFillAnswer(i); });
    opts.appendChild(btn);
  });
}

function checkFillAnswer(sel) {
  var q = filteredFill[fillIdx];
  var btns = document.querySelectorAll('#fillOptions .fill-option');
  btns.forEach(function(b) { b.disabled = true; });

  if (sel === q.answer) {
    btns[sel].classList.add('correct');
    totalScore += 10; fillDone++;
    playCorrectSound();
    document.getElementById('fillFeedback').className = 'question-feedback correct-fb show';
  } else {
    btns[sel].classList.add('wrong');
    btns[q.answer].classList.add('correct');
    playWrongSound();
    document.getElementById('fillFeedback').className = 'question-feedback wrong-fb show';
  }
  document.getElementById('fillFeedback').textContent = q.explanation;
  document.getElementById('fillNext').style.display = 'inline-block';
  updateScoreDisplay();
}

function nextFillQuestion() { playClickSound(); fillIdx++; renderFillQuestion(); }

// ===== 知识判断题 =====
function renderTrueFalseQuestion() {
  if (tfIdx >= filteredTF.length) {
    document.getElementById('tfMeta').textContent = '';
    document.getElementById('tfNum').textContent = '已完成';
    document.getElementById('tfQuestion').textContent = '本板块全部完成！';
    document.getElementById('tfBtnTrue').style.display = 'none';
    document.getElementById('tfBtnWrong').style.display = 'none';
    document.getElementById('tfFeedback').className = 'question-feedback correct-fb show';
    document.getElementById('tfFeedback').textContent = '请切换到其他题型或调整筛选条件继续挑战。';
    document.getElementById('tfNext').style.display = 'none';
    return;
  }
  var q = filteredTF[tfIdx];
  document.getElementById('tfMeta').textContent = q.category + ' · ' + q.level;
  document.getElementById('tfNum').textContent = '第 ' + (tfIdx + 1) + ' 题 / 共 ' + filteredTF.length + ' 题';
  document.getElementById('tfQuestion').textContent = q.question;
  document.getElementById('tfFeedback').className = 'question-feedback';
  document.getElementById('tfFeedback').textContent = '';
  document.getElementById('tfNext').style.display = 'none';

  var bt = document.getElementById('tfBtnTrue'), bw = document.getElementById('tfBtnWrong');
  bt.style.display = 'inline-block'; bw.style.display = 'inline-block';
  bt.disabled = false; bw.disabled = false;
  bt.className = 'tf-btn tf-correct'; bw.className = 'tf-btn tf-wrong';
}

function checkTrueFalse(ua) {
  var q = filteredTF[tfIdx];
  var bt = document.getElementById('tfBtnTrue'), bw = document.getElementById('tfBtnWrong');
  bt.disabled = true; bw.disabled = true;

  if (ua === q.answer) {
    if (ua) bt.classList.add('correct'); else bw.classList.add('correct');
    totalScore += 10; tfDone++;
    playCorrectSound();
    document.getElementById('tfFeedback').className = 'question-feedback correct-fb show';
  } else {
    bt.classList.add(ua ? 'wrong' : 'correct');
    bw.classList.add(ua ? 'correct' : 'wrong');
    playWrongSound();
    document.getElementById('tfFeedback').className = 'question-feedback wrong-fb show';
  }
  document.getElementById('tfFeedback').textContent = q.explanation;
  document.getElementById('tfNext').style.display = 'inline-block';
  updateScoreDisplay();
}

function nextTrueFalseQuestion() { playClickSound(); tfIdx++; renderTrueFalseQuestion(); }

// ========== 键盘弹奏 ==========
document.addEventListener('keydown', function(e) {
  if (!document.getElementById('piano').classList.contains('active')) return;
  var keyMap = { a:0, s:1, d:2, f:3, g:4, h:5, j:6 };
  var idx = keyMap[e.key.toLowerCase()];
  if (idx !== undefined) {
    e.preventDefault();
    var notes = PIANO_NOTES[OCTAVE_NAMES[currentOctave]];
    if (idx < notes.length) {
      playLiuqinNote(notes[idx].freq, pianoVolume);
      var keys = document.querySelectorAll('.piano-key');
      if (keys[idx]) { keys[idx].classList.add('pressed'); setTimeout(function() { keys[idx].classList.remove('pressed'); }, 150); }
    }
  }
});

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', function() {
  navigateTo('home');
  document.getElementById('volumeSlider').addEventListener('input', function() { setVolume(this.value); });
});
