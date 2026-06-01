(function () {
  // engine.js가 module.exports로만 내보내므로, 브라우저용으로 함수들을 다시 참조.
  // → engine.js를 브라우저에서도 쓰도록 아래에서 직접 로드한 전역 함수 사용.
  const Eng = window.JanggiEngine;

  const ROWS = 10, COLS = 9;
  const frame = document.getElementById('frame');
  const mistOverlay = document.getElementById('mistOverlay');
  const elSub = document.querySelector('.title-bar .sub');
  const elTurnSuffix = document.getElementById('turnSuffix');
  const elMovelogTitle = document.getElementById('movelogTitle');
  const elUndo = document.getElementById('undoBtn');
  const elReset = document.getElementById('resetBtn');
  const elResign = document.getElementById('resignBtn');
  const resignConfirmBox = document.getElementById('resignConfirm');
  const elResignConfirmText = document.getElementById('resignConfirmText');
  const elResignYes = document.getElementById('resignYes');
  const elResignNo = document.getElementById('resignNo');
  const elWinHint = document.getElementById('winHint');
  const elMistText = document.getElementById('mistText');
  const langKo = document.getElementById('langKo');
  const langEn = document.getElementById('langEn');
  const langLabel = document.getElementById('langLabel');
  const grid = document.getElementById('grid');
  const piecesLayer = document.getElementById('pieces');
  const statusEl = document.getElementById('status');
  const turnLabel = document.getElementById('turnLabel');
  const msgEl = document.getElementById('msg');
  const capR = document.getElementById('capR');
  const capB = document.getElementById('capB');
  const winOverlay = document.getElementById('winOverlay');
  const winTitle = document.getElementById('winTitle');
  const winFactionLine = document.getElementById('winFactionLine');
  const setupOverlay = document.getElementById('setupOverlay');
  const setupStep = document.getElementById('setupStep');
  const setupGrid = document.getElementById('setupGrid');
  const setupSideLabel = document.getElementById('setupSideLabel');
  const setupTitleWrap = setupStep.querySelector('.setup-title');
  const setupSkip = document.getElementById('setupSkip');
  const movelog = document.getElementById('movelog');

  const HANJA = {
    r: { K:'楚', A:'士', E:'象', H:'馬', R:'車', C:'包', P:'卒' },
    b: { K:'漢', A:'士', E:'象', H:'馬', R:'車', C:'包', P:'兵' },
  };

  // 보드 위 기물 이미지 (백자 팔각알). r=초(CHU), b=한(HAN)
  // 에셋 구조: pieces/{테마}/{진영}/{기물키}.png — 테마 시스템 대비
  const PIECE_IMG = {
    r: { K:'assets/pieces/baekja/chu/K.png', R:'assets/pieces/baekja/chu/R.png', H:'assets/pieces/baekja/chu/H.png',
         E:'assets/pieces/baekja/chu/E.png', C:'assets/pieces/baekja/chu/C.png', A:'assets/pieces/baekja/chu/A.png', P:'assets/pieces/baekja/chu/P.png' },
    b: { K:'assets/pieces/baekja/han/K.png', R:'assets/pieces/baekja/han/R.png', H:'assets/pieces/baekja/han/H.png',
         E:'assets/pieces/baekja/han/E.png', C:'assets/pieces/baekja/han/C.png', A:'assets/pieces/baekja/han/A.png', P:'assets/pieces/baekja/han/P.png' },
  };

  // ── i18n: UI 문구만 번역. 기물 한자·상차림 배치는 불변 ──────────
  // 시작 언어: 브라우저가 한국어면 ko, 아니면 en
  let lang = (navigator.language || 'ko').toLowerCase().startsWith('ko') ? 'ko' : 'en';

  const I18N = {
    ko: {
      sub: 'JANGGI · 한국 장기',
      langLabel: '언어 선택 :',
      chooseFaction: '진영을 고르세요',
      chuName: '초(楚)', hanName: '한(漢)',
      chuSub: '선수 · 청록', hanSub: '후수 · 인주',
      factionNoteDefault: '고른 진영이 화면 아래에 놓입니다 · 선수는 항상 초(楚)',
      autoWon: '직전 판 승리 — 이번엔 한(漢)으로 자동 배정되었습니다. 바꾸려면 다른 진영을 고르세요.',
      autoLost: '직전 판 패배 — 이번엔 초(楚)로 자동 배정되었습니다. 바꾸려면 다른 진영을 고르세요.',
      setupTitlePre: '의 상차림을 고르세요',   // <b>초(楚)</b>의 상차림을 고르세요
      autoPick: '자동 선택(무작위)',
      turnLabel: '차례', mistStart: '대국 시작',
      undo: '무르기', reset: '처음부터', flip: '판 뒤집기',
      resign: '돌 던지기', resignConfirm: '정말 돌을 던지시겠습니까?',
      resignYes: '예', resignNo: '아니오',
      resigned: (s) => `${s} 항복 — 돌을 던졌습니다`,
      capByChu: '초가 잡음', capByHan: '한이 잡음',
      capChuEmpty: '초가 잡은 기물', capHanEmpty: '한이 잡은 기물',
      movelogTitle: '기 보', movelogEmpty: '아직 둔 수가 없습니다',
      pickPiece: '기물을 골라 두세요',
      pickDest: '둘 곳을 고르세요', cantMove: '둘 수 없는 기물입니다',
      notYourTurn: (s) => `지금은 ${s} 차례입니다`,
      check: (s) => `장군! ${s} 왕이 위험합니다`,
      myFaction: (you, sR, sB) => `내 진영: ${you} · 초 ${sR} · 한 ${sB}`,
      chuFirst: '초(楚) 선수', hanSecond: '한(漢) 후수',
      win: (s) => `${s} 승리`,
      outcomeWin: '승리', outcomeLose: '패배',
      factionWon: (s) => `${s} 승리`,
      youWon: '승리했습니다 · 다음 판은 한(漢)으로',
      youLost: '패배했습니다 · 다음 판은 초(楚)로',
      undone: '한 수 물렀습니다',
      winHint: '다시 두려면 ‘처음부터’를 누르세요',
    },
    en: {
      sub: 'JANGGI · Korean Chess',
      langLabel: 'Language :',
      chooseFaction: 'Choose your side',
      chuName: 'Cho (楚)', hanName: 'Han (漢)',
      chuSub: 'First · Teal', hanSub: 'Second · Red',
      factionNoteDefault: 'Your side sits at the bottom · Cho (楚) always moves first',
      autoWon: 'You won the last game — assigned Han (漢) this time. Pick the other side to change.',
      autoLost: 'You lost the last game — assigned Cho (楚) this time. Pick the other side to change.',
      setupTitlePre: ' — choose the formation',   // <b>Cho (楚)</b> — choose the formation
      autoPick: 'Auto (random)',
      turnLabel: 'to move', mistStart: 'Game Start',
      undo: 'Undo', reset: 'New Game', flip: 'Flip Board',
      resign: 'Surrender', resignConfirm: 'Surrender this game?',
      resignYes: 'Yes', resignNo: 'No',
      resigned: (s) => `${s} surrendered`,
      capByChu: 'Cho captured', capByHan: 'Han captured',
      capChuEmpty: 'Captured by Cho', capHanEmpty: 'Captured by Han',
      movelogTitle: 'Moves', movelogEmpty: 'No moves yet',
      pickPiece: 'Select a piece to move',
      pickDest: 'Choose a destination', cantMove: 'This piece has no legal moves',
      notYourTurn: (s) => `It's ${s}'s turn`,
      check: (s) => `Check! ${s}'s general is in danger`,
      myFaction: (you, sR, sB) => `You: ${you} · Cho ${sR} · Han ${sB}`,
      chuFirst: 'Cho (楚) · First', hanSecond: 'Han (漢) · Second',
      win: (s) => `${s} wins`,
      outcomeWin: 'Victory', outcomeLose: 'Defeat',
      factionWon: (s) => `${s} wins`,
      youWon: 'You won · next game you play Han (漢)',
      youLost: 'You lost · next game you play Cho (楚)',
      undone: 'Move undone',
      winHint: 'Press “New Game” to play again',
    },
  };
  function t(key, ...args) {
    const v = (I18N[lang] && I18N[lang][key]);
    if (typeof v === 'function') return v(...args);
    return v != null ? v : key;
  }
  // 진영 표기 (언어별). 자리(r/b) → 표기. 기물 한자와 무관한 UI 라벨.
  function factionLabel(side) { return side === 'r' ? t('chuName') : t('hanName'); }
  // 상차림 음역 (영어 모드용). 한국어는 원래 이름 그대로.
  const SETUP_ROMAN = {
    '마상마상': 'Ma Sang-Ma Sang', '상마상마': 'Sang Ma-Sang Ma',
    '마상상마': 'Ma Sang-Sang Ma', '상마마상': 'Sang Ma-Ma Sang',
  };
  function setupLabel(name) { return lang === 'en' ? (SETUP_ROMAN[name] || name) : name; }

  let board, turn, selected, legalForSel, history, flipped, gameOver;

  let setupChoice = { r: null, b: null }; // 각 진영 차림
  let setupPhase = 'r'; // 현재 차림 고르는 진영
  let moveLog = []; // 기보
  const captured = { r: [], b: [] }; // r이 잡은 b기물 등

  // 진영/매치 상태
  // playerFaction: 플레이어가 고른 세력 'chu'|'han'. chu면 flipped=false(초 아래), han이면 flipped=true(한 아래).
  let playerFaction = 'chu';
  let lastResult = null;   // 직전 판 승자 세력 'chu'|'han' (재대국 자동배정용). null이면 첫 판.
  let factionAutoAssigned = false;  // 현재 진영단계가 자동배정 안내 상태인지 (언어전환 시 유지용)
  let endState = null;  // 게임 종료 상태 {winner, reason, loser} — 언어전환 시 메시지 재생성용
  const factionStep = document.getElementById('factionStep');
  const factionGrid = document.getElementById('factionGrid');
  const factionNote = document.getElementById('factionNote');

  // ── 진영 선택 단계 ────────────────────────────────
  function startSetup() {
    setupChoice = { r: null, b: null };
    setupPhase = 'r';
    winOverlay.classList.remove('show');
    // 재대국 자동배정: 직전 승자는 한(후수), 패자는 초(선수)
    if (lastResult) {
      // 플레이어가 직전에 이겼으면 → 이번엔 한. 졌으면 → 초.
      const playerWonLast = (lastResult === playerFaction);
      playerFaction = playerWonLast ? 'han' : 'chu';
      factionAutoAssigned = true;
      renderFactionStep(true);   // 자동배정 안내 포함
    } else {
      factionAutoAssigned = false;
      renderFactionStep(false);
    }
    factionStep.style.display = '';
    setupStep.style.display = 'none';
    setupOverlay.classList.add('show');
  }

  function renderFactionStep(autoAssigned) {
    factionGrid.innerHTML = '';
    const cards = [
      { id:'chu', name:t('chuName'), sub:t('chuSub'), img: PIECE_IMG.r.K, cls:'chu' },
      { id:'han', name:t('hanName'), sub:t('hanSub'), img: PIECE_IMG.b.K, cls:'han' },
    ];
    for (const c of cards) {
      const card = document.createElement('div');
      card.className = 'faction-card ' + c.cls;
      card.innerHTML =
        `<div class="fc-piece"><img src="${c.img}" alt="${c.name}" draggable="false"></div>` +
        `<div class="fc-name">${c.name}<span class="fc-sub">${c.sub}</span></div>`;
      card.onclick = (e) => { e.stopPropagation(); chooseFaction(c.id); };
      factionGrid.appendChild(card);
    }
    if (autoAssigned) {
      const won = (playerFaction === 'han');
      factionNote.textContent = won ? t('autoWon') : t('autoLost');
    } else {
      factionNote.textContent = t('factionNoteDefault');
    }
    // 진영 단계 제목도 갱신
    const ft = factionStep.querySelector('.setup-title');
    if (ft) ft.textContent = t('chooseFaction');
  }

  function chooseFaction(id) {
    playerFaction = id;
    // chu → flipped=false (초 아래), han → flipped=true (한 아래, 위쪽 초가 선수)
    factionStep.style.display = 'none';
    setupStep.style.display = '';
    setupPhase = 'r';
    renderSetupStep();
  }

  function miniBoardHTML(side, setupName) {
    // 변별에 필요한 안쪽 馬·象 네 칸만 표시: [왼바깥, 왼안, 오른안, 오른바깥]
    // SETUPS[name] = [열1, 열2, 열6, 열7] = [왼바깥, 왼안, 오른안, 오른바깥]
    const s = Eng.SETUPS[setupName];
    const cell = (t) =>
      `<div class="cell filled"><img src="${PIECE_IMG[side][t]}" alt="${HANJA[side][t]}" draggable="false"></div>`;
    return cell(s[0]) + cell(s[1]) + cell(s[2]) + cell(s[3]);
  }

  function renderSetupStep() {
    const side = setupPhase;
    setupSideLabel.textContent = factionLabel(side);
    // "<b>초(楚)</b>의 상차림을 고르세요" 구조 — 접미부만 교체
    const titleNode = setupTitleWrap;
    // setupSideLabel은 <b>, 그 뒤 텍스트노드를 접미부로
    let suffix = titleNode.lastChild;
    if (suffix && suffix.nodeType === 3) suffix.textContent = t('setupTitlePre');
    setupTitleWrap.classList.toggle('r', side === 'r');
    setupTitleWrap.classList.toggle('b', side === 'b');
    setupGrid.innerHTML = '';
    for (const name of Eng.SETUP_NAMES) {
      const card = document.createElement('div');
      card.className = 'setup-card';
      card.innerHTML =
        `<div class="mini">${miniBoardHTML(side, name)}</div>` +
        `<div class="name">${setupLabel(name)}</div>`;
      card.onclick = (e) => { e.stopPropagation(); chooseSetup(side, name); };
      setupGrid.appendChild(card);
    }
    setupSkip.textContent = t('autoPick');
  }

  function chooseSetup(side, name) {
    setupChoice[side] = name;
    if (setupPhase === 'r') {
      setupPhase = 'b';
      renderSetupStep();
    } else {
      finishSetup();
    }
  }

  function skipSetup() {
    // 현재 진영 무작위 → 다음으로
    chooseSetup(setupPhase, Eng.randomSetup());
  }

  function finishSetup() {
    const sR = setupChoice.r || Eng.randomSetup();
    const sB = setupChoice.b || Eng.randomSetup();
    setupOverlay.classList.remove('show');
    beginGame(sR, sB);
  }

  function beginGame(sR, sB) {
    board = Eng.initialBoard(sR, sB);
    turn = 'r';                       // 선수는 언제나 초(r). 엔진 불변.
    selected = null;
    legalForSel = [];
    history = [];
    // 진영 선택 반영: 플레이어가 고른 세력이 화면 아래.
    // chu → flipped=false(초 아래), han → flipped=true(한 아래, 위쪽 초가 선수)
    flipped = (playerFaction === 'han');
    frame.classList.toggle('flipped', flipped);
    gameOver = false;
    endState = null;
    captured.r = []; captured.b = [];
    moveLog = [];
    winOverlay.classList.remove('show');
    resignConfirmBox.classList.remove('show');
    updateTurnUI();
    drawGrid();
    render();
    renderMovelog();
    const youAre = playerFaction === 'chu' ? t('chuFirst') : t('hanSecond');
    setStatus(t('myFaction', youAre, setupLabel(sR), setupLabel(sB)));
    playMistIntro();
  }

  function playMistIntro() {
    // 애니메이션 재시작을 위해 클래스 제거 후 리플로우 → 재부착
    mistOverlay.classList.remove('run');
    void mistOverlay.offsetWidth;
    mistOverlay.classList.add('run');
  }

  function reset() {
    startSetup();
  }

  function drawGrid() {
    grid.innerHTML = '';
    const W = 100, H = 100;
    const cw = W / (COLS - 1);
    const ch = H / (ROWS - 1);
    grid.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const ns = 'http://www.w3.org/2000/svg';
    // 가로선
    for (let r = 0; r < ROWS; r++) {
      const ln = document.createElementNS(ns, 'line');
      ln.setAttribute('x1', 0); ln.setAttribute('x2', W);
      ln.setAttribute('y1', r * ch); ln.setAttribute('y2', r * ch);
      grid.appendChild(ln);
    }
    // 세로선 (가운데 강은 없지만, 외곽선은 끝까지 / 내부선도 끝까지 — 장기는 강이 없음)
    for (let c = 0; c < COLS; c++) {
      const ln = document.createElementNS(ns, 'line');
      ln.setAttribute('y1', 0); ln.setAttribute('y2', H);
      ln.setAttribute('x1', c * cw); ln.setAttribute('x2', c * cw);
      grid.appendChild(ln);
    }
    // 궁성 대각선 (위/아래)
    const diag = (r1,c1,r2,c2) => {
      const ln = document.createElementNS(ns, 'line');
      ln.setAttribute('class','palace');
      ln.setAttribute('x1', c1*cw); ln.setAttribute('y1', r1*ch);
      ln.setAttribute('x2', c2*cw); ln.setAttribute('y2', r2*ch);
      grid.appendChild(ln);
    };
    diag(0,3,2,5); diag(0,5,2,3);   // top palace
    diag(7,3,9,5); diag(7,5,9,3);   // bottom palace
  }

  function posToXY(r, c) {
    // flipped면 위아래/좌우 반전
    const rr = flipped ? (ROWS - 1 - r) : r;
    const cc = flipped ? (COLS - 1 - c) : c;
    const x = (cc / (COLS - 1)) * 100;
    const y = (rr / (ROWS - 1)) * 100;
    return { x, y };
  }

  function sizeBoard() {
    // board-frame은 board-col 폭을 채움(width:100%). 그 폭 기준 height를 비율대로 고정.
    const RATIO = 0.92; // 높이/폭
    const w = frame.clientWidth;
    if (w <= 0) return;
    const h = w * RATIO;
    frame.style.height = h + 'px';
    // 격자·기물 레이어가 정확히 같은 영역을 쓰도록 픽셀 inset을 통일
    const pad = w * 0.06; // 가로세로 동일 픽셀 여백
    const innerW = w - 2 * pad;
    const innerH = h - 2 * pad;
    for (const el of [grid, piecesLayer]) {
      el.style.left = pad + 'px';
      el.style.top = pad + 'px';
      el.style.width = innerW + 'px';
      el.style.height = innerH + 'px';
    }
  }

  function render() {
    sizeBoard();
    if (!board) return;
    piecesLayer.innerHTML = '';
    // 마지막 둔 수 하이라이트 (기물보다 아래)
    if (moveLog.length) {
      const last = moveLog[moveLog.length - 1];
      for (const [mr, mc] of [last.from, last.to]) {
        const { x, y } = posToXY(mr, mc);
        const mk = document.createElement('div');
        mk.className = 'last-mark';
        mk.style.left = x + '%';
        mk.style.top = y + '%';
        piecesLayer.appendChild(mk);
      }
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = board[r][c];
        if (!p) continue;
        const { x, y } = posToXY(r, c);
        const el = document.createElement('div');
        el.className = `piece ${p.side}`;
        if (y < 50) el.classList.add('up'); // 화면 위쪽 진영 → 180도 회전(마주 앉은 대국)
        if (selected && selected[0] === r && selected[1] === c) el.classList.add('sel');
        el.style.left = x + '%';
        el.style.top = y + '%';
        el.innerHTML = `<img class="piece-img" src="${PIECE_IMG[p.side][p.type]}" alt="${HANJA[p.side][p.type]}" draggable="false">`;
        el.onclick = (e) => { e.stopPropagation(); onPieceClick(r, c); };
        piecesLayer.appendChild(el);
      }
    }
    // 합법수 점
    for (const [rr, cc] of legalForSel) {
      const { x, y } = posToXY(rr, cc);
      const dot = document.createElement('div');
      const isCap = !!board[rr][cc];
      dot.className = 'dot dot-' + turn + (isCap ? ' capture' : '');
      dot.style.left = x + '%';
      dot.style.top = y + '%';
      dot.onclick = (e) => { e.stopPropagation(); doMove(rr, cc); };
      piecesLayer.appendChild(dot);
    }
    renderCaptured();
  }

  function renderCaptured() {
    // captured.r = 초가 잡은 한(b)의 기물들
    if (captured.r.length) {
      capR.innerHTML = `<span class="cap-label">${t('capByChu')}</span>` +
        captured.r.map(tp => `<span class="cap-chip b">${HANJA.b[tp]}</span>`).join('');
    } else {
      capR.innerHTML = `<span class="cap-label">${t('capChuEmpty')}</span>`;
    }
    if (captured.b.length) {
      capB.innerHTML = captured.b.map(tp => `<span class="cap-chip r">${HANJA.r[tp]}</span>`).join('') +
        `<span class="cap-label">${t('capByHan')}</span>`;
    } else {
      capB.innerHTML = `<span class="cap-label">${t('capHanEmpty')}</span>`;
    }
  }

  function onPieceClick(r, c) {
    if (gameOver) return;
    const p = board[r][c];
    // 합법수 도착점이면 이동
    if (selected && legalForSel.some(([rr,cc]) => rr===r && cc===c)) {
      doMove(r, c);
      return;
    }
    if (p && p.side === turn) {
      selected = [r, c];
      legalForSel = Eng.legalMoves(board, r, c);
      setStatus(legalForSel.length ? t('pickDest') : t('cantMove'));
      render();
    } else if (p) {
      setStatus(t('notYourTurn', factionLabel(turn)));
    }
  }

  function coordName(r, c) {
    // 열: 가(0)~자(8) 한글 줄이름, 행: 1~10 (위에서부터)
    const colNames = ['1','2','3','4','5','6','7','8','9'];
    return colNames[c] + (r + 1);
  }

  function doMove(tr, tc) {
    const [fr, fc] = selected;
    const mover = board[fr][fc];
    history.push({
      board: Eng.cloneBoard(board), turn,
      capR: [...captured.r], capB: [...captured.b],
      logLen: moveLog.length,
    });
    const target = board[tr][tc];
    const res = Eng.applyMove(board, fr, fc, tr, tc);
    board = res.board;
    let capType = null;
    if (res.captured) {
      captured[turn].push(res.captured.type);
      capType = res.captured.type;
      spawnSplat(tr, tc);
    }
    // 기보 기록
    moveLog.push({
      side: turn,
      piece: mover.type,
      from: [fr, fc],
      to: [tr, tc],
      cap: capType,
    });
    selected = null;
    legalForSel = [];
    turn = turn === 'r' ? 'b' : 'r';
    render();
    renderMovelog();
    updateTurnUI();
    // 종료/장군 판정
    const st = Eng.gameStatus(board, turn);
    if (st.over) {
      endGame(st.loser === 'r' ? 'b' : 'r');
    } else if (Eng.isInCheck(board, turn)) {
      setStatus(t('check', factionLabel(turn)));
    } else {
      setStatus(t('pickPiece'));
    }
  }

  function moveText(m) {
    if (!m) return '';
    const pieceCh = HANJA[m.side][m.piece];
    const capStr = m.cap ? `×${HANJA[m.side === 'r' ? 'b' : 'r'][m.cap]}` : '';
    return `<span class="mv-piece">${pieceCh}</span>${coordName(...m.from)}→${coordName(...m.to)}${capStr}`;
  }

  function renderMovelog() {
    if (!moveLog.length) {
      movelog.innerHTML = `<div class="empty">${t('movelogEmpty')}</div>`;
      return;
    }
    // 초(r) 먼저 두므로 (r, b) 쌍으로 묶음
    let rows = '';
    for (let i = 0; i < moveLog.length; i += 2) {
      const mr = moveLog[i];        // 초
      const mb = moveLog[i + 1];    // 한 (없을 수 있음)
      const n = i / 2 + 1;
      rows +=
        `<li><span class="num">${n}</span>` +
        `<span class="mv-cell mv-r">${moveText(mr)}</span>` +
        `<span class="mv-cell mv-b">${mb ? moveText(mb) : ''}</span></li>`;
    }
    movelog.innerHTML = rows;
    movelog.scrollTop = movelog.scrollHeight;
  }

  function spawnSplat(r, c) {
    const { x, y } = posToXY(r, c);
    const s = document.createElement('div');
    s.className = 'ink-splat';
    s.style.left = x + '%';
    s.style.top = y + '%';
    piecesLayer.appendChild(s);
    setTimeout(() => s.remove(), 650);
  }

  function updateTurnUI() {
    statusEl.classList.toggle('turn-r', turn === 'r');
    statusEl.classList.toggle('turn-b', turn === 'b');
    turnLabel.textContent = factionLabel(turn);
  }

  function endGame(winner, reason) {
    gameOver = true;
    // winner는 자리(r/b). r=초(chu), b=한(han) — flipped 무관.
    lastResult = (winner === 'r') ? 'chu' : 'han';
    const loser = (winner === 'r') ? 'b' : 'r';
    endState = { winner, reason: reason || null, loser };
    winOverlay.classList.add('show');
    renderEndMessages();
  }

  // 종료 오버레이·상태창 문구를 현재 언어로 (그)리기 — endGame과 언어전환에서 공용
  function renderEndMessages() {
    if (!endState) return;
    const { winner, reason, loser } = endState;
    const winnerFaction = (winner === 'r') ? 'chu' : 'han';
    const iWon = (winnerFaction === playerFaction);
    // 작은 줄: 누가 이겼나 (진영 + 진영색)
    winFactionLine.textContent = t('factionWon', factionLabel(winner));
    winFactionLine.className = 'win-faction ' + winnerFaction;
    // 큰 줄: 내 관점 승/패 (네트워크/AI 대비 — playerFaction이 이 화면의 주인)
    winTitle.textContent = iWon ? t('outcomeWin') : t('outcomeLose');
    winTitle.className = iWon ? 'win' : 'lose';
    // 상태창
    if (reason === 'resign') {
      setStatus(t('resigned', factionLabel(loser)));
    } else {
      setStatus(iWon ? t('youWon') : t('youLost'));
    }
  }

  function setStatus(msg) { msgEl.textContent = msg; }

  // 정적 UI 문구 갱신 (로드 시 + 언어 전환 시)
  function applyStaticI18n() {
    elSub.textContent = t('sub');
    langLabel.textContent = t('langLabel');
    elTurnSuffix.textContent = t('turnLabel');
    elMovelogTitle.textContent = t('movelogTitle');
    elUndo.textContent = t('undo');
    elReset.textContent = t('reset');
    elResign.textContent = t('resign');
    elResignConfirmText.textContent = t('resignConfirm');
    elResignYes.textContent = t('resignYes');
    elResignNo.textContent = t('resignNo');
    elWinHint.textContent = t('winHint');
    elMistText.textContent = t('mistStart');
    langKo.classList.toggle('active', lang === 'ko');
    langEn.classList.toggle('active', lang === 'en');
    document.documentElement.lang = lang;
  }

  function setLang(next) {
    if (next === lang) return;
    lang = next;
    applyStaticI18n();
    // 현재 보이는 동적 영역 다시 그리기
    if (setupOverlay.classList.contains('show')) {
      // 셋업 중: 보이는 단계 갱신
      if (factionStep.style.display !== 'none') {
        renderFactionStep(factionAutoAssigned);
      } else {
        renderSetupStep();
      }
    }
    if (board) {
      updateTurnUI();
      renderCaptured();
      renderMovelog();
    }
    // 게임이 끝난 상태면 종료 오버레이·상태창 문구도 현재 언어로 다시
    if (gameOver && endState) {
      renderEndMessages();
    }
  }

  function undo() {
    if (!history.length || gameOver) {
      if (gameOver) { /* 종료 후엔 reset 권장 */ }
      return;
    }
    const prev = history.pop();
    board = prev.board;
    turn = prev.turn;
    captured.r = prev.capR;
    captured.b = prev.capB;
    if (typeof prev.logLen === 'number') moveLog.length = prev.logLen;
    selected = null; legalForSel = [];
    gameOver = false;
    endState = null;
    winOverlay.classList.remove('show');
    render();
    renderMovelog();
    updateTurnUI();
    setStatus(t('undone'));
  }

  document.getElementById('resetBtn').onclick = reset;
  document.getElementById('undoBtn').onclick = undo;
  // 돌 던지기(항복): 확인 UI 표시 → 예 누르면 현재 차례 쪽 패배
  elResign.onclick = () => {
    if (gameOver) return;
    resignConfirmBox.classList.add('show');
  };
  elResignNo.onclick = () => { resignConfirmBox.classList.remove('show'); };
  elResignYes.onclick = () => {
    resignConfirmBox.classList.remove('show');
    if (gameOver) return;
    // 현재 차례(turn) 쪽이 항복 → 상대가 승리
    const loser = turn;
    const winner = (turn === 'r') ? 'b' : 'r';
    setStatus(t('resigned', factionLabel(loser)));
    endGame(winner, 'resign');
  };
  document.getElementById('frame').onclick = () => {
    if (selected) { selected = null; legalForSel = []; render(); }
  };
  setupSkip.onclick = (e) => { e.stopPropagation(); skipSetup(); };
  langKo.onclick = () => setLang('ko');
  langEn.onclick = () => setLang('en');

  window.addEventListener('resize', () => { sizeBoard(); });

  applyStaticI18n();   // 시작 언어(브라우저 기준) 정적 문구 적용
  reset();

  // 레이아웃·폰트가 안정된 뒤 보드 크기 재계산 (첫 렌더에서 폭을 작게 읽는 문제 방지)
  requestAnimationFrame(() => { sizeBoard(); render(); });
  setTimeout(() => { sizeBoard(); render(); }, 200);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { sizeBoard(); render(); });
  }
})();
