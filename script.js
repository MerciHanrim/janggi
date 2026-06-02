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
  // langLabel은 타이틀바 ⚙ 드롭다운으로 이동 — HTML에 없음, null-safe 처리
  const langLabel = document.getElementById('langLabel');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsDropdown = document.getElementById('settingsDropdown');
  const settingsBackdrop = document.getElementById('settingsBackdrop');
  const grid = document.getElementById('grid');
  const piecesLayer = document.getElementById('pieces');
  const statusEl = document.getElementById('status');
  const turnLabel = document.getElementById('turnLabel');
  const turnPersp = document.getElementById('turnPersp');
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
    r: { K:'assets/pieces/baekja/chu/chu_k.webp', R:'assets/pieces/baekja/chu/chu_r.webp', H:'assets/pieces/baekja/chu/chu_h.webp',
         E:'assets/pieces/baekja/chu/chu_e.webp', C:'assets/pieces/baekja/chu/chu_c.webp', A:'assets/pieces/baekja/chu/chu_a.webp', P:'assets/pieces/baekja/chu/chu_p.webp' },
    b: { K:'assets/pieces/baekja/han/han_k.webp', R:'assets/pieces/baekja/han/han_r.webp', H:'assets/pieces/baekja/han/han_h.webp',
         E:'assets/pieces/baekja/han/han_e.webp', C:'assets/pieces/baekja/han/han_c.webp', A:'assets/pieces/baekja/han/han_a.webp', P:'assets/pieces/baekja/han/han_p.webp' },
  };

  // 튜토리얼 카드 전용 이미지 — baekja_tut 고정 (테마 시스템 확장과 무관)
  const TUT_PIECE_IMG = {
    r: { K:'assets/pieces/baekja_tut/chu/chu_k_tut.webp', R:'assets/pieces/baekja_tut/chu/chu_r_tut.webp', H:'assets/pieces/baekja_tut/chu/chu_h_tut.webp',
         E:'assets/pieces/baekja_tut/chu/chu_e_tut.webp', C:'assets/pieces/baekja_tut/chu/chu_c_tut.webp', A:'assets/pieces/baekja_tut/chu/chu_a_tut.webp', P:'assets/pieces/baekja_tut/chu/chu_p_tut.webp' },
    b: { K:'assets/pieces/baekja_tut/han/han_k_tut.webp', R:'assets/pieces/baekja_tut/han/han_r_tut.webp', H:'assets/pieces/baekja_tut/han/han_h_tut.webp',
         E:'assets/pieces/baekja_tut/han/han_e_tut.webp', C:'assets/pieces/baekja_tut/han/han_c_tut.webp', A:'assets/pieces/baekja_tut/han/han_a_tut.webp', P:'assets/pieces/baekja_tut/han/han_p_tut.webp' },
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
      check: (s) => `장군! ${s} 왕을 구하는 수를 두세요`,
      checkWord: '장군',
      myFaction: (you, sR, sB) => `내 진영: ${you} · 초 ${sR} · 한 ${sB}`,
      chuFirst: '초(楚) 선수', hanSecond: '한(漢) 후수',
      win: (s) => `${s} 승리`,
      outcomeWin: '승리', outcomeLose: '패배',
      factionWon: (s) => `${s} 승리`,
      youWon: '승리했습니다 · 다음 판은 한(漢)으로',
      youLost: '패배했습니다 · 다음 판은 초(楚)로',
      outcomeDraw: '무승부', drawLine: '비김',
      drawStalemate: '둘 곳이 없어 무승부입니다',
      byCheckmate: (s) => `외통 — ${s} 승리`,
      byTimeout: (s) => `시간패 — ${s} 승리`,
      undone: '한 수 물렀습니다',
      winHint: '다시 두려면 ‘처음부터’를 누르세요',
      // ★ AI 대국 문구 (루미 톤: 보이지 않는 기객, 조용한 안내)
      aiThinking: '건너편이 잠시 생각합니다',
      aiWaking: 'AI 상대를 깨우는 중입니다',
      aiFailLong: 'AI 상대를 깨우는 중입니다. 브라우저 환경에 따라 잠시 멈출 수 있어요. 지금은 혼자 판을 살펴볼 수 있습니다.',
      aiRetry: '다시 깨우기',
      aiWatch: '판만 보기',
      // ★ 관점 줄 (내 차례인지 즉시 보이게)
      perspMine: '당신이 둘 차례입니다',
      perspAi: '상대가 수를 고르고 있습니다',
      perspHuman: (s) => `${s}이(가) 둘 차례입니다`,   // AI 없는 모드용
      // ★ 모드 메뉴 / 강도 선택
      levelTitle: '오늘은 어떻게 두실까요?',
      modeCpu: '컴퓨터와 두기', modeCpuSub: 'AI 상대와 대국',
      modeTutorial: '장기 배우기', modeTutorialSub: '기물 행마법과 이기는 방법',
      modeHuman: '사람과 두기', modeHumanSub: '준비 중입니다',
      modeReview: '복기하기', modeReviewSub: '준비 중입니다',
      modeComing: '아직 준비 중입니다',
      levelPlayCpu: '컴퓨터와 두기',
      lvBeginnerName: '초심자', lvBeginnerSub: '처음 장기를 배우는 분을 위한 상대',
      lvFriendName: '익숙한 벗', lvFriendSub: '가볍게 한 판 즐길 수 있는 상대',
      lvMasterName: '노련한 기객', lvMasterSub: '쉽게 빈틈을 보이지 않는 상대',
      lvExpertName: '대국수', lvExpertSub: '한 치의 빈틈도 허락하지 않는 상대',
      levelNote: '마음에 드는 상대를 고르세요 · 한 판이 끝나면 다시 고를 수 있습니다',
      settingsBgLabel: '장기판 배경',
      bgSansuHwa: '산수화', bgSimple: '심플',
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
      pickPiece: 'Select a piece',
      pickDest: 'Choose a destination', cantMove: 'This piece has no legal moves',
      notYourTurn: (s) => `It's ${s}'s turn`,
      check: (s) => `Check! Save ${s}'s general`,
      checkWord: 'Check',
      myFaction: (you, sR, sB) => `You: ${you} · Cho ${sR} · Han ${sB}`,
      chuFirst: 'Cho (楚) · First', hanSecond: 'Han (漢) · Second',
      win: (s) => `${s} wins`,
      outcomeWin: 'Victory', outcomeLose: 'Defeat',
      factionWon: (s) => `${s} wins`,
      youWon: 'You won · next game you play Han (漢)',
      youLost: 'You lost · next game you play Cho (楚)',
      outcomeDraw: 'Draw', drawLine: 'Stalemate',
      drawStalemate: 'No legal moves — the game is a draw',
      byCheckmate: (s) => `Checkmate — ${s} wins`,
      byTimeout: (s) => `Timeout — ${s} wins`,
      undone: 'Move undone',
      winHint: 'Press “New Game” to play again',
      // AI opponent strings (quiet, unseen-player tone)
      aiThinking: 'Your opponent is considering a move',
      aiWaking: 'Waking the AI opponent',
      aiFailLong: 'Waking the AI opponent. Depending on your browser it may pause for a moment. For now you can study the board on your own.',
      aiRetry: 'Wake again',
      aiWatch: 'Just view the board',
      // perspective line (so it's instantly clear whose turn it is)
      perspMine: 'Your move',
      perspAi: 'Your opponent is choosing a move',
      perspHuman: (s) => `${s} to move`,
      // strength selection (small foyer — "How would you like to play today?")
      levelTitle: 'How would you like to play today?',
      modeCpu: 'Play with Computer', modeCpuSub: 'Play against the AI',
      modeTutorial: 'Learn Janggi', modeTutorialSub: 'How pieces move and how to win',
      modeHuman: 'Play with a Friend', modeHumanSub: 'Coming soon',
      modeReview: 'Review a Game', modeReviewSub: 'Coming soon',
      modeComing: 'This mode is not yet available',
      levelPlayCpu: 'Play with Computer',
      lvBeginnerName: 'Beginner', lvBeginnerSub: 'For someone learning Janggi for the first time',
      lvFriendName: 'Familiar Friend', lvFriendSub: 'A relaxed opponent for a casual game',
      lvMasterName: 'Seasoned Player', lvMasterSub: 'Rarely leaves an opening',
      lvExpertName: 'Master', lvExpertSub: 'Allows not a single opening',
      levelNote: 'Choose your opponent · you can pick again after each game',
      settingsBgLabel: 'Board Background',
      bgSansuHwa: 'Ink Wash', bgSimple: 'Simple',
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

  // ── 대국 룰 옵션 (★ 확장 지점) ──────────────────────────────
  // 향후 입주 예정: 무르기 횟수 제한, 빅장(대궁 무승부) 처리, 점수제 등.
  // timeMode: 'none'(시간 없음·기본) | 'simple'(단순 카운트다운).
  //   확장 예약: 'byoyomi'(초읽기), 'fischer'(가산). 1차는 simple만 구현.
  const ruleOptions = {
    timeMode: 'none',
    baseSeconds: 600,     // simple 모드 각 진영 기본 시간(초). 기본 10분.
    // byoyomiSeconds: 30,  // (확장 예약) 초읽기 1수당 초
  };
  // 타이머 상태: 각 진영 남은 시간(초), 인터벌 핸들.
  let clock = { r: 0, b: 0 };
  let clockTimer = null;

  // ── AI 대국 상태 (★ AI 통합) ──────────────────────────────
  // aiSide: AI가 두는 자리('r'|'b'|null). null이면 AI 없음(사람끼리 — 1차엔 거의 없음).
  //   사람이 고른 진영(playerFaction)의 반대편이 AI. 선수는 항상 초(turn='r').
  //   사람=chu → aiSide='b' / 사람=han → aiSide='r'(AI 선공).
  let aiSide = null;
  let aiThinking = false;   // 중복 호출 방지 플래그

  // ── AI 강도 3단계 (★ 강도 다변화) ─────────────────────────
  //   pc vs ai 구조라 AI 강도가 곧 "상대 그 자체". 강도 폭이 게임성 필수 요소.
  //   skill = Skill Level(0~20): 낮을수록 일부러 차선수 섞음("실수하는 상대").
  //           약한 상대의 핵심은 depth가 아니라 skill — 초보가 이겨보는 경험은 AI의 실수에서 나옴.
  //   depth = 탐색 깊이.
  //   ※ 생각 시간(호흡)은 강도와 무관하게 세 단계 모두 동일(2.5~4초). 강도는 skill/depth로만 가름.
  //     약하다고 빨리 두면 "거침없이 빠르다"의 기계 느낌이 돌아옴.
  //   id는 식물 성장 단계(새싹→잎→대나무)로 강도 위계와 겹침. 다실 톤 유지(Easy/Normal/Hard 아님).
  //   ★ 값 근거: 실측된 강도는 skill12/depth12 하나뿐인데 한림·mj님 둘 다 "못 이김".
  //     → 검증된 그 점을 맨 위(노련한 기객)에 놓고, 아래 두 칸은 추측으로 더 약하게 배치.
  //     (추측을 위로 쌓지 않음. 미측정 강도를 "노련한 기객"이라 부르던 이전 배치를 바로잡음.)
  //   ★ 노출 제어: 강도 정의(AI_LEVELS)와 화면 노출(AI_LEVEL_ORDER)을 분리.
  //     expert(🎍 대국수)는 값만 예약해두고 UI엔 안 띄움. "선택지가 늘면 좋은 게 아니라
  //     뭐가 뭔지 모르겠다가 먼저 옴" — 검증 안 된 단계를 미리 늘어놓지 않음(다실 톤).
  //     실제 고수층이 4단계를 원한다는 데이터가 쌓이면 AI_LEVEL_ORDER에 'expert'만 추가하면 공개됨.
  //   ※ 생각 시간(호흡)도 강도별로 미세하게 다름(thinkMin~thinkMax ms). 단 강도를 만드는 게 아니라
  //     "사람이 고민하는 모습"을 만드는 용도. 차이는 0.5~1초로 작게 — 시간이 강도를 가르지 않음.
  //     사람은 상대 강도를 '실력 50% + 생각하는 모습 50%'로 느낌. 강도=skill/depth, 인격=시간.
  //     ★ 약한 AI라고 빨리 두지 않음(빠르면 약한 게 아니라 "계산기 느낌"). 초심자도 최소 2.5초.
  //     강할수록 살짝 더 신중(사람도 그러함). 셋 다 "다실에서 고민하는 호흡" 안에 머묾.
  const AI_LEVELS = {
    beginner: { skill: 0,  depth: 1,  thinkMin: 2500, thinkMax: 3500 },   // 🌱 초심자 — depth 1로 하향. 앞을 거의 못 보는 수준. "이겨보는 경험" 우선.
    friend:   { skill: 3,  depth: 4,  thinkMin: 3000, thinkMax: 4000 },   // 🍃 익숙한 벗 — 초심자↔노련한 기객 계단 유지용 하향(추측). 가끔 이기고 가끔 지는 중간.
    master:   { skill: 6,  depth: 8,  thinkMin: 3500, thinkMax: 5000 },   // 🎋 노련한 기객 — skill 6/depth 8. 계단 유지용(추측).
    expert:   { skill: 20, depth: 15, thinkMin: 4000, thinkMax: 5500 },   // 🎍 대국수 — (비공개 예약) 고수층 데이터 쌓이면 공개
  };
  // ★ UI에 노출할 강도 순서. expert는 의도적으로 제외(값만 살아있음).
  const AI_LEVEL_ORDER = ['beginner', 'friend', 'master'];
  // 강도별 표시 정보(이모지·라벨키). expert도 정의는 둠 — 공개 시 ORDER에만 추가하면 됨.
  const AI_LEVEL_META = {
    beginner: { emoji: '🌱', nameKey: 'lvBeginnerName', subKey: 'lvBeginnerSub' },
    friend:   { emoji: '🍃', nameKey: 'lvFriendName',   subKey: 'lvFriendSub'   },
    master:   { emoji: '🎋', nameKey: 'lvMasterName',   subKey: 'lvMasterSub'   },
    expert:   { emoji: '🎍', nameKey: 'lvExpertName',   subKey: 'lvExpertSub'   },
  };
  let aiLevel = 'friend';   // 현재 강도. 첫 진입 시 강도 선택에서 정함. 재대국 땐 유지.

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
  const levelStep = document.getElementById('levelStep');
  const levelStepTitle = document.getElementById('levelStepTitle');
  const modeGrid = document.getElementById('modeGrid');
  const levelSubPanel = document.getElementById('levelSubPanel');
  const levelPlayLabel = document.getElementById('levelPlayLabel');
  const levelNote = document.getElementById('levelNote');
  const levelGrid = document.getElementById('levelGrid');

  // ── 튜토리얼 모드 ────────────────────────────────────────
  //   tutorialMode: true면 대국 상태(turn/aiSide/history/moveLog)와 완전 분리.
  //   phase: 'intro'(설명) → 'practice'(자유연습) → 'mission'(미션) → 'success'/'fail'
  let tutorialMode = false;
  let tutorialScenario = null;
  let tutorialPhase = 'intro';   // 'intro' | 'practice' | 'mission' | 'success' | 'fail'
  let tutorialMovesLeft = 0;        // 미션 남은 수

  // 기물 선택 오버레이 DOM
  const tutorialPieceOverlay = document.getElementById('tutorialPieceOverlay');
  const tutorialPieceGrid = document.getElementById('tutorialPieceGrid');
  const tutorialPieceTitle = document.getElementById('tutorialPieceTitle');

  // ── 시나리오 정의 ──────────────────────────────────────
  //   pieces: 배치 목록
  //   missionMoves: 미션 허용 수
  //   missionKey: 미션 설명 i18n 키
  const TUTORIAL_SCENARIOS = {
    rook: {
      nameKey: 'tutRookName',
      descKey: 'tutRookDesc',
      practiceActionKey: 'tutRookAction',
      missionKey: 'tutRookMission',
      missionMoves: 3,
      pieces: [
        { side: 'r', type: 'R', r: 5, c: 4 },
        { side: 'b', type: 'P', r: 5, c: 7 },
        { side: 'b', type: 'P', r: 2, c: 4 },
        { side: 'r', type: 'P', r: 8, c: 4 },
      ],
    },
    horse: {
      nameKey: 'tutHorseName',
      descKey: 'tutHorseDesc',
      practiceActionKey: 'tutHorseAction',
      missionKey: 'tutHorseMission',
      missionMoves: 3,
      pieces: [
        { side: 'r', type: 'H', r: 6, c: 4 },
        { side: 'b', type: 'P', r: 4, c: 5 },
        { side: 'r', type: 'P', r: 5, c: 4 },
      ],
    },
    elephant: {
      nameKey: 'tutElephantName',
      descKey: 'tutElephantDesc',
      practiceActionKey: 'tutElephantAction',
      missionKey: 'tutElephantMission',
      missionMoves: 3,
      pieces: [
        { side: 'r', type: 'E', r: 6, c: 4 },
        { side: 'b', type: 'P', r: 3, c: 2 },
        { side: 'r', type: 'P', r: 5, c: 4 },
      ],
    },
    cannon: {
      nameKey: 'tutCannonName',
      descKey: 'tutCannonDesc',
      practiceActionKey: 'tutCannonAction',
      missionKey: 'tutCannonMission',
      missionMoves: 3,
      pieces: [
        { side: 'r', type: 'C', r: 6, c: 4 },
        { side: 'r', type: 'P', r: 3, c: 4 },
        { side: 'b', type: 'P', r: 1, c: 4 },
        { side: 'b', type: 'P', r: 6, c: 7 },
      ],
    },
    guard: {
      nameKey: 'tutGuardName',
      descKey: 'tutGuardDesc',
      practiceActionKey: 'tutGuardAction',
      missionKey: 'tutGuardMission',
      missionMoves: 4,
      pieces: [
        { side: 'r', type: 'A', r: 8, c: 4 },
        { side: 'b', type: 'P', r: 7, c: 3 },
      ],
    },
    king: {
      nameKey: 'tutKingName',
      descKey: 'tutKingDesc',
      practiceActionKey: 'tutKingAction',
      missionKey: 'tutKingMission',
      missionMoves: 4,
      pieces: [
        { side: 'r', type: 'K', r: 9, c: 4 },
        { side: 'b', type: 'P', r: 7, c: 3 },
      ],
    },
    soldier: {
      nameKey: 'tutSoldierName',
      descKey: 'tutSoldierDesc',
      practiceActionKey: 'tutSoldierAction',
      missionKey: 'tutSoldierMission',
      missionMoves: 3,
      pieces: [
        { side: 'r', type: 'P', r: 5, c: 4 },
        { side: 'b', type: 'P', r: 3, c: 4 },
        { side: 'b', type: 'P', r: 5, c: 6 },
      ],
    },
  };

  // 기물 선택 화면 목록
  const TUTORIAL_PIECE_LIST = [
    { id: 'rook',     type: 'R', nameKey: 'tutRookName',     active: true  },
    { id: 'horse',    type: 'H', nameKey: 'tutHorseName',    active: true  },
    { id: 'elephant', type: 'E', nameKey: 'tutElephantName', active: true  },
    { id: 'cannon',   type: 'C', nameKey: 'tutCannonName',   active: true  },
    { id: 'guard',    type: 'A', nameKey: 'tutGuardName',    active: true  },
    { id: 'king',     type: 'K', nameKey: 'tutKingName',     active: true  },
    { id: 'soldier',  type: 'P', nameKey: 'tutSoldierName',  active: true  },
  ];

  // i18n 튜토리얼 키
  const TUTORIAL_I18N = {
    ko: {
      tutPieceTitle: '기물을 골라 행마법을 배워보세요',
      tutRookName: '차(車)', tutHorseName: '마(馬)', tutElephantName: '상(象)',
      tutCannonName: '포(包)', tutGuardName: '사(士)', tutSoldierName: '졸(卒)', tutKingName: '장(將)',
      // 설명
      tutRookDesc: '차는 직선으로 얼마든지 이동할 수 있습니다. 아군 기물은 지나갈 수 없고, 적 기물은 잡으며 멈춥니다.',
      tutHorseDesc: '마는 직선 한 칸 + 대각선 한 칸으로 이동합니다. 직선 방향(멱)에 기물이 있으면 그쪽으로는 이동할 수 없습니다.',
      tutElephantDesc: '상은 직선 한 칸 + 대각선 두 칸으로 이동합니다. 경로에 기물이 하나라도 있으면 그 방향으로 이동할 수 없습니다.',
      tutCannonDesc: '포는 반드시 기물 하나(받침)를 넘어서 이동하거나 잡을 수 있습니다. 받침이 없으면 이동도 잡기도 안 됩니다. 포로 포를 잡을 수 없습니다.',
      tutGuardDesc: '사는 궁성 안에서만 이동할 수 있습니다. 직선 한 칸, 그리고 대각선 연결점에서는 대각선으로도 이동합니다.',
      tutKingDesc: '장은 사와 같은 방식으로 궁성 안에서만 이동합니다. 장을 잡히면 패배합니다.',
      tutSoldierDesc: '졸/병은 앞으로 한 칸, 또는 옆으로 한 칸 이동할 수 있습니다. 뒤로는 물러날 수 없습니다.',
      // 자유연습 행동 안내 (짧게 — 상태창에 표시)
      tutRookAction: '차를 눌러 갈 수 있는 곳을 살펴보세요.',
      tutHorseAction: '마를 눌러 이동 가능한 곳을 확인하세요.',
      tutElephantAction: '상을 눌러 이동 가능한 곳을 확인하세요.',
      tutCannonAction: '포를 눌러보세요. 받침이 있는 방향만 이동됩니다.',
      tutGuardAction: '사를 눌러보세요. 궁성 안에서만 움직입니다.',
      tutKingAction: '장을 눌러보세요. 궁성 안에서만 움직입니다.',
      tutSoldierAction: '졸을 눌러보세요. 앞과 옆으로만 이동합니다.',
      // 미션
      tutRookMission: '3수 안에 적 병을 잡아보세요.',
      tutHorseMission: '3수 안에 적 병을 잡아보세요.',
      tutElephantMission: '3수 안에 적 병을 잡아보세요.',
      tutCannonMission: '3수 안에 받침을 넘어 적 병을 잡아보세요.',
      tutGuardMission: '4수 안에 적 병을 잡아보세요.',
      tutKingMission: '4수 안에 적 병을 잡아보세요.',
      tutSoldierMission: '3수 안에 적 병을 잡아보세요.',
      // 공통 UI
      tutPracticeStart: '연습했어요',
      tutIntroStart: '직접 움직여 보기',
      tutMovesLeft: (n) => `남은 수: ${n}`,
      tutSuccess: '성공!',
      tutSuccessMsg: (n) => `${n}수 안에 적 기물을 잡았습니다.`,
      tutFail: '아쉽습니다.',
      tutFailMsg: '적 기물을 잡지 못했습니다.',
      tutRetry: '다시 해보기',
      tutBackToPractice: '자유 연습으로',
      tutNextPiece: '다른 기물 배우기',
      tutReset: '다시 해보기',
      tutExit: '처음으로',
      tutComing: '아직 준비 중입니다',
    },
    en: {
      tutPieceTitle: 'Choose a piece to learn how it moves',
      tutRookName: 'Chariot (車)', tutHorseName: 'Horse (馬)', tutElephantName: 'Elephant (象)',
      tutCannonName: 'Cannon (包)', tutGuardName: 'Guard (士)', tutSoldierName: 'Soldier (卒)', tutKingName: 'General (將)',
      tutRookDesc: 'The Chariot moves any number of squares in a straight line. It cannot pass through friendly pieces, and captures by landing on an enemy piece.',
      tutHorseDesc: 'The Horse moves one step straight then one step diagonally. If a piece is blocking the straight step, the Horse cannot move in that direction.',
      tutElephantDesc: 'The Elephant moves one step straight then two steps diagonally. If any piece blocks the path, it cannot move in that direction.',
      tutCannonDesc: 'The Cannon must jump over exactly one piece (a screen) to move or capture. Without a screen, it cannot move. It cannot capture another Cannon.',
      tutGuardDesc: 'The Guard can only move within the palace — one step straight, or diagonally along the marked lines.',
      tutKingDesc: 'The General moves like the Guard within the palace. If the General is captured, the game is lost.',
      tutSoldierDesc: 'The Soldier can move one step forward or sideways. It cannot retreat.',
      tutRookAction: 'Click the Chariot to see where it can go.',
      tutHorseAction: 'Click the Horse to see its moves.',
      tutElephantAction: 'Click the Elephant to see its moves.',
      tutCannonAction: 'Click the Cannon. Only directions with a screen piece are available.',
      tutGuardAction: 'Click the Guard. It can only move within the palace.',
      tutKingAction: 'Click the General. It can only move within the palace.',
      tutSoldierAction: 'Click the Soldier. It can move forward or sideways only.',
      tutRookMission: 'Capture an enemy soldier within 3 moves.',
      tutHorseMission: 'Capture an enemy soldier within 3 moves.',
      tutElephantMission: 'Capture an enemy soldier within 3 moves.',
      tutCannonMission: 'Jump over the screen and capture the enemy soldier within 3 moves.',
      tutGuardMission: 'Capture the enemy soldier within 4 moves.',
      tutKingMission: 'Capture the enemy soldier within 4 moves.',
      tutSoldierMission: 'Capture the enemy soldier within 3 moves.',
      tutPracticeStart: 'Start Mission',
      tutIntroStart: 'Try Moving It',
      tutMovesLeft: (n) => `Moves left: ${n}`,
      tutSuccess: 'Success!',
      tutSuccessMsg: (n) => `You captured the enemy piece within ${n} moves.`,
      tutFail: 'Not quite.',
      tutFailMsg: 'You did not capture the enemy piece.',
      tutRetry: 'Try Again',
      tutBackToPractice: 'Back to Practice',
      tutNextPiece: 'Learn Another Piece',
      tutReset: 'Try Again',
      tutExit: 'Back to Menu',
      tutComing: 'Not available yet',
    },
  };
  function tt(key, ...args) {
    const d = TUTORIAL_I18N[lang] || TUTORIAL_I18N.ko;
    const v = d[key];
    if (typeof v === 'function') return v(...args);
    return v != null ? v : key;
  }

  // ── 튜토리얼 진입 ──────────────────────────────────────
  function enterTutorial() {
    tutorialMode = true;
    aiSide = null;
    aiThinking = false;
    gameOver = false;
    endState = null;
    selected = null;
    legalForSel = [];
    winOverlay.classList.remove('show');
    setupOverlay.classList.remove('show');
    stopClock();
    renderTutorialSidePanel();
    showTutorialPieceSelect();
  }

  // 기물 선택 오버레이 표시
  function showTutorialPieceSelect() {
    tutorialPieceOverlay.style.display = 'flex';
    renderTutorialPieceGrid();
    if (tutorialPieceTitle) tutorialPieceTitle.textContent = tt('tutPieceTitle');
  }

  function renderTutorialPieceGrid() {
    tutorialPieceGrid.innerHTML = '';
    for (const p of TUTORIAL_PIECE_LIST) {
      const card = document.createElement('div');
      card.className = 'tut-piece-card' + (p.active ? '' : ' tut-coming');
      card.innerHTML =
        `<div class="tut-piece-img"><img src="${TUT_PIECE_IMG.r[p.type]}" alt="${tt(p.nameKey)}" draggable="false"></div>` +
        `<span class="tut-piece-name">${tt(p.nameKey)}</span>`;
      if (p.active) {
        card.onclick = (e) => { e.stopPropagation(); startTutorialScenario(p.id); };
      } else {
        card.onclick = (e) => {
          e.stopPropagation();
          const nameEl = card.querySelector('.tut-piece-name');
          if (card.dataset.coming) return;
          card.dataset.coming = '1';
          const orig = nameEl.textContent;
          nameEl.textContent = tt('tutComing');
          setTimeout(() => { nameEl.textContent = orig; delete card.dataset.coming; }, 1800);
        };
      }
      tutorialPieceGrid.appendChild(card);
    }
  }

  // 시나리오 시작 (intro phase로 — 설명 확인 후 연습 진입)
  function startTutorialScenario(id) {
    const scenario = TUTORIAL_SCENARIOS[id];
    if (!scenario) return;
    tutorialScenario = id;
    tutorialPhase = 'intro';
    tutorialMovesLeft = 0;
    tutorialPieceOverlay.style.display = 'none';
    loadTutorialBoard(scenario);
    renderTutorialSidePanel(id);
  }

  // 보드에 시나리오 배치
  function loadTutorialBoard(scenario) {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    for (const p of scenario.pieces) {
      board[p.r][p.c] = { side: p.side, type: p.type };
    }
    flipped = false;
    frame.classList.remove('flipped');
    turn = 'r';
    selected = null;
    legalForSel = [];
    moveLog = [];
    drawGrid();
    render();
  }

  // 미션 시작 (자유연습 → 미션 phase)
  function startTutorialMission() {
    const scenario = TUTORIAL_SCENARIOS[tutorialScenario];
    if (!scenario) return;
    tutorialPhase = 'mission';
    tutorialMovesLeft = scenario.missionMoves;
    // 미션용 보드 리셋
    loadTutorialBoard(scenario);
    renderTutorialSidePanel(tutorialScenario);
  }

  // 튜토리얼 전용 사이드 패널 렌더 (phase별)
  function renderTutorialSidePanel(scenarioId) {
    capR.style.display = 'none';
    capB.style.display = 'none';
    document.querySelector('.movelog-wrap').style.display = 'none';
    document.querySelector('.controls').style.display = 'none';
    document.querySelector('.resign-confirm').style.display = 'none';

    let tutPanel = document.getElementById('tutorialSidePanel');
    if (!tutPanel) {
      tutPanel = document.createElement('div');
      tutPanel.id = 'tutorialSidePanel';
      tutPanel.className = 'tutorial-side-panel';
      document.querySelector('.side-panel').appendChild(tutPanel);
    }
    tutPanel.style.display = '';

    const scenario = scenarioId ? TUTORIAL_SCENARIOS[scenarioId] : null;
    const phase = tutorialPhase;

    let html = '';
    if (!scenario) {
      // 기물 선택 전 빈 상태
    } else if (phase === 'intro') {
      html =
        `<div class="tut-desc">${tt(scenario.descKey)}</div>` +
        `<div class="tut-buttons">` +
        `<button class="tut-btn tut-mission-start tut-btn-primary" id="tutIntroStartBtn">${tt('tutIntroStart')}</button>` +
        `<button class="tut-btn tut-next-piece" id="tutNextPieceBtn">${tt('tutNextPiece')}</button>` +
        `<button class="tut-btn tut-exit" id="tutExitBtn">${tt('tutExit')}</button>` +
        `</div>`;
    } else if (phase === 'practice') {
      html =
        `<div class="tut-desc">${tt(scenario.descKey)}</div>` +
        `<div class="tut-buttons">` +
        `<button class="tut-btn tut-mission-start" id="tutMissionStartBtn">${tt('tutPracticeStart')}</button>` +
        `<button class="tut-btn tut-next-piece" id="tutNextPieceBtn">${tt('tutNextPiece')}</button>` +
        `<button class="tut-btn tut-exit" id="tutExitBtn">${tt('tutExit')}</button>` +
        `</div>`;
    } else if (phase === 'mission') {
      html =
        `<div class="tut-desc">${tt(scenario.missionKey)}</div>` +
        `<div class="tut-moves-left" id="tutMovesLeft">${tt('tutMovesLeft', tutorialMovesLeft)}</div>` +
        `<div class="tut-buttons">` +
        `<button class="tut-btn tut-reset" id="tutRetryBtn">${tt('tutRetry')}</button>` +
        `<button class="tut-btn tut-next-piece" id="tutNextPieceBtn">${tt('tutNextPiece')}</button>` +
        `<button class="tut-btn tut-exit" id="tutExitBtn">${tt('tutExit')}</button>` +
        `</div>`;
    } else if (phase === 'success') {
      const used = scenario.missionMoves - tutorialMovesLeft;
      html =
        `<div class="tut-result tut-result-success">` +
        `<div class="tut-result-title">${tt('tutSuccess')}</div>` +
        `<div class="tut-result-msg">${tt('tutSuccessMsg', used)}</div>` +
        `</div>` +
        `<div class="tut-buttons">` +
        `<button class="tut-btn tut-next-piece" id="tutNextPieceBtn">${tt('tutNextPiece')}</button>` +
        `<button class="tut-btn tut-reset" id="tutRetryBtn">${tt('tutRetry')}</button>` +
        `<button class="tut-btn tut-exit" id="tutExitBtn">${tt('tutExit')}</button>` +
        `</div>`;
    } else if (phase === 'fail') {
      html =
        `<div class="tut-result tut-result-fail">` +
        `<div class="tut-result-title">${tt('tutFail')}</div>` +
        `<div class="tut-result-msg">${tt('tutFailMsg')}</div>` +
        `</div>` +
        `<div class="tut-buttons">` +
        `<button class="tut-btn tut-mission-start" id="tutRetryBtn">${tt('tutRetry')}</button>` +
        `<button class="tut-btn tut-next-piece" id="tutNextPieceBtn">${tt('tutNextPiece')}</button>` +
        `<button class="tut-btn tut-exit" id="tutExitBtn">${tt('tutExit')}</button>` +
        `</div>`;
    }

    tutPanel.innerHTML = html;

    // 버튼 핸들러 바인딩
    const introStartBtn = document.getElementById('tutIntroStartBtn');
    if (introStartBtn) introStartBtn.onclick = () => {
      tutorialPhase = 'practice';
      renderTutorialSidePanel(tutorialScenario);
    };

    const missionStartBtn = document.getElementById('tutMissionStartBtn');
    if (missionStartBtn) missionStartBtn.onclick = () => startTutorialMission();

    const retryBtn = document.getElementById('tutRetryBtn');
    if (retryBtn) retryBtn.onclick = () => startTutorialScenario(tutorialScenario);

    const nextPieceBtn = document.getElementById('tutNextPieceBtn');
    if (nextPieceBtn) nextPieceBtn.onclick = () => {
      tutorialScenario = null;
      tutorialPhase = 'practice';
      board = null;
      piecesLayer.innerHTML = '';
      showTutorialPieceSelect();
    };

    const exitBtn = document.getElementById('tutExitBtn');
    if (exitBtn) exitBtn.onclick = () => exitTutorial();

    // 상태창
    turnLabel.textContent = '';
    elTurnSuffix.textContent = '';
    turnPersp.textContent = '';
    if (phase === 'intro' && scenario) setStatus(tt(scenario.practiceActionKey));
    else if (phase === 'practice' && scenario) setStatus(tt(scenario.practiceActionKey));
    else if (phase === 'mission') setStatus(tt('tutMovesLeft', tutorialMovesLeft));
    else setStatus('');
  }

  // 튜토리얼 전용 이동
  function doTutorialMove(tr, tc) {
    if (tutorialPhase === 'intro') return;
    const [fr, fc] = selected;
    const res = Eng.applyMove(board, fr, fc, tr, tc);
    const captured = res.captured;
    board = res.board;
    if (captured) {
      playCaptureSound();
      spawnSplat(tr, tc);
    } else {
      playMoveSound();
    }
    selected = null;
    legalForSel = [];

    // 미션 phase: 수 차감 + 성공/실패 판정
    if (tutorialPhase === 'mission') {
      tutorialMovesLeft--;

      if (captured && captured.side === 'b') {
        // 적 기물 잡음 → 성공
        tutorialPhase = 'success';
        render();
        renderTutorialSidePanel(tutorialScenario);
        return;
      }

      if (tutorialMovesLeft <= 0) {
        // 수 소진 → 실패
        tutorialPhase = 'fail';
        render();
        renderTutorialSidePanel(tutorialScenario);
        return;
      }

      // 남은 수 갱신
      const movesLeftEl = document.getElementById('tutMovesLeft');
      if (movesLeftEl) movesLeftEl.textContent = tt('tutMovesLeft', tutorialMovesLeft);
      setStatus(tt('tutMovesLeft', tutorialMovesLeft));
    }

    render();
  }

  // 튜토리얼 종료 → 모드 메뉴로
  function exitTutorial() {
    tutorialMode = false;
    tutorialScenario = null;
    tutorialPhase = 'practice';
    tutorialMovesLeft = 0;
    board = null;
    tutorialPieceOverlay.style.display = 'none';

    capR.style.display = '';
    capB.style.display = '';
    document.querySelector('.movelog-wrap').style.display = '';
    document.querySelector('.controls').style.display = '';
    document.querySelector('.resign-confirm').style.display = '';
    const tutPanel = document.getElementById('tutorialSidePanel');
    if (tutPanel) tutPanel.style.display = 'none';

    piecesLayer.innerHTML = '';
    applyStaticI18n();
    reset();
  }

  //   진입·재대국("처음부터") 모두: 강도 선택 → 진영 → 상차림 → 대국.
  //   "처음부터"는 글자 그대로 맨 처음(강도 선택)으로 돌아간다. 강도 선택은 "설정"이 아니라
  //   "오늘의 상대를 정하는 과정" — 매 대국 다시 골라도 카드 한 번이라 부담 없음.
  //   (나중에 풀 모드 메뉴가 생기면 이 자리가 자연스럽게 "대국 방식 선택"으로 자람.)
  let levelPicked = false;   // 이번 강도 선택 화면에서 카드를 눌렀는지 (언어전환 재렌더 시 강조 유지용)

  function startSetup() {
    stopClock();
    // ★ AI 상태 초기화 (새 판 시작 — 직전 판 설정 잔재 제거).
    aiThinking = false;
    aiSide = null;
    clearAiFailUI();
    frame.classList.remove('ai-thinking');
    setupChoice = { r: null, b: null };
    setupPhase = 'r';
    winOverlay.classList.remove('show');
    setupOverlay.classList.add('show');

    // 언제나 강도 선택부터 (처음부터 = 정말 처음).
    showLevelStep();
  }

  // 모드 메뉴 화면 표시 (첫 진입점 — "오늘은 어떻게 두실까요?")
  function showLevelStep() {
    levelPicked = false;
    levelStep.style.display = '';
    factionStep.style.display = 'none';
    setupStep.style.display = 'none';
    // 강도 서브패널 숨기고 모드 메뉴부터
    modeGrid.style.display = '';
    levelSubPanel.style.display = 'none';
    renderModeGrid();
    if (levelStepTitle) levelStepTitle.textContent = t('levelTitle');
  }

  // 강도 선택 서브패널 표시 ("컴퓨터와 두기" 선택 후)
  function showLevelGrid() {
    modeGrid.style.display = 'none';
    levelSubPanel.style.display = '';
    renderLevelStep();
  }

  // 모드 메뉴 카드 렌더
  const MODE_LIST = [
    { id: 'cpu',      nameKey: 'modeCpu',      subKey: 'modeCpuSub',      icon: '弈', active: true  },
    { id: 'tutorial', nameKey: 'modeTutorial', subKey: 'modeTutorialSub', icon: '學', active: true  },
    { id: 'human',    nameKey: 'modeHuman',    subKey: 'modeHumanSub',    icon: '對', active: false },
    { id: 'review',   nameKey: 'modeReview',   subKey: 'modeReviewSub',   icon: '譜', active: false },
  ];
  function renderModeGrid() {
    modeGrid.innerHTML = '';
    for (const m of MODE_LIST) {
      const card = document.createElement('div');
      card.className = 'mode-card' + (m.active ? '' : ' mode-coming');
      card.innerHTML =
        `<span class="mode-icon">${m.icon}</span>` +
        `<span class="mode-text"><span class="mode-name">${t(m.nameKey)}</span>` +
        `<span class="mode-sub">${t(m.subKey)}</span></span>`;
      if (m.active) {
        card.onclick = (e) => { e.stopPropagation(); onModeSelect(m.id); };
      } else {
        card.onclick = (e) => { e.stopPropagation(); showComingSoon(card); };
      }
      modeGrid.appendChild(card);
    }
  }

  function showComingSoon(card) {
    if (card.dataset.coming) return;
    card.dataset.coming = '1';
    const orig = card.querySelector('.mode-sub').textContent;
    card.querySelector('.mode-sub').textContent = t('modeComing');
    const tid = setTimeout(() => {
      card.querySelector('.mode-sub').textContent = orig;
      delete card.dataset.coming;
    }, 2000);
    card._comingTimer = tid;
  }

  function onModeSelect(id) {
    if (id === 'cpu') {
      showLevelGrid();
    } else if (id === 'tutorial') {
      enterTutorial();
    }
    // human / review: 추후 분기 추가
  }

  // 진영 선택 단계로 진입 (강도는 직전 강도 선택에서 정해진 상태)
  function startFactionStep() {
    levelStep.style.display = 'none';
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
  }

  // 강도 선택지 렌더 (진영 카드와 같은 패턴). AI_LEVEL_ORDER에 있는 것만 노출.
  function renderLevelStep() {
    levelGrid.innerHTML = '';
    for (const id of AI_LEVEL_ORDER) {
      const meta = AI_LEVEL_META[id];
      if (!meta) continue;
      const card = document.createElement('div');
      const isCurrent = levelPicked && id === aiLevel;
      card.className = 'level-card' + (isCurrent ? ' current' : '');
      card.innerHTML =
        `<div class="lv-emoji">${meta.emoji}</div>` +
        `<div class="lv-text"><div class="lv-name">${t(meta.nameKey)}</div>` +
        `<div class="lv-sub">${t(meta.subKey)}</div></div>`;
      card.onclick = (e) => { e.stopPropagation(); chooseLevel(id, card); };
      levelGrid.appendChild(card);
    }
    if (levelStepTitle) levelStepTitle.textContent = t('levelTitle');
    if (levelPlayLabel) levelPlayLabel.textContent = t('levelPlayCpu');
    if (levelNote) levelNote.textContent = t('levelNote');
  }

  let levelPicking = false;   // 선택 피드백 진행 중 중복 클릭 방지
  function chooseLevel(id, cardEl) {
    if (levelPicking) return;          // 0.4초 피드백 중엔 다른 카드 무시
    if (!AI_LEVELS[id]) return;
    levelPicking = true;
    aiLevel = id;
    levelPicked = true;
    // 클릭 순간 그 카드만 강조 — "선택되었습니다" 찰나의 피드백.
    for (const c of levelGrid.children) c.classList.remove('current');
    if (cardEl) cardEl.classList.add('current');
    // 잠깐 머무른 뒤 진영 선택으로 (무엇을 골랐는지 눈으로 확인할 틈).
    setTimeout(() => {
      levelPicking = false;
      startFactionStep();
    }, 420);
  }

  function renderFactionStep(autoAssigned) {
    factionGrid.innerHTML = '';
    const cards = [
      { id:'chu', name:t('chuName'), sub:t('chuSub'), img: TUT_PIECE_IMG.r.K, cls:'chu' },
      { id:'han', name:t('hanName'), sub:t('hanSub'), img: TUT_PIECE_IMG.b.K, cls:'han' },
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
    // ★ AI 대국: 사람이 고른 진영의 반대편이 AI. 선수는 항상 초(turn='r').
    //   사람=chu → 사람이 초(r), AI=한(b).  사람=han → 사람이 한(b), AI=초(r) 선공.
    aiSide = (id === 'chu') ? 'b' : 'r';
    const humanSide = (id === 'chu') ? 'r' : 'b';
    // chu → flipped=false (초 아래), han → flipped=true (한 아래, 위쪽 초가 선수)
    factionStep.style.display = 'none';
    setupStep.style.display = '';
    // ★ 사람은 자기 진영 상차림만 고른다. AI 진영은 자동(무작위).
    setupChoice = { r: null, b: null };
    setupPhase = humanSide;
    renderSetupStep();
  }

  function miniBoardHTML(side, setupName) {
    const s = Eng.SETUPS[setupName];
    const imgMap = TUT_PIECE_IMG[side] || TUT_PIECE_IMG.r;
    const cell = (t) =>
      `<div class="cell filled"><img src="${imgMap[t]}" alt="${HANJA[side][t]}" draggable="false"></div>`;
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
    // ★ AI 대국: 사람은 자기 진영만 고름. 고른 즉시 AI 진영은 무작위로 채우고 시작.
    if (aiSide) {
      setupChoice[aiSide] = Eng.randomSetup();
      finishSetup();
      return;
    }
    // (폴백) AI 없는 사람끼리 모드 — 기존 r→b 순서. 현재 1차엔 도달하지 않음.
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
    // 시계 초기화 (simple 모드면 각 진영 baseSeconds로)
    clock.r = clock.b = ruleOptions.baseSeconds;
    renderClock();
    const youAre = playerFaction === 'chu' ? t('chuFirst') : t('hanSecond');
    setStatus(t('myFaction', youAre, setupLabel(sR), setupLabel(sB)));
    playMistIntro();
    startClock();   // timeMode 'none'이면 내부에서 즉시 빠져나감
    // ★ AI가 선공(turn='r'이 AI 자리)이면 첫 수를 AI에게. 안개 인트로 살짝 뒤.
    maybeAiMove();
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
    // 장군 판정은 현재 판의 파생값 — 매 render에서 r/b 각각 1회만 계산.
    // 장군당한 side의 궁(K)에 .in-check 클래스를 붙인다.
    const checkSide = { r: Eng.isInCheck(board, 'r'), b: Eng.isInCheck(board, 'b') };
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
        if (p.type === 'K' && checkSide[p.side]) el.classList.add('in-check');
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
      dot.onclick = (e) => { e.stopPropagation(); tutorialMode ? doTutorialMove(rr, cc) : doMove(rr, cc); };
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
    // ★ 튜토리얼 모드: AI 없음, turn 체크 없이 플레이어(r) 기물만 선택 가능
    if (tutorialMode) {
      if (tutorialPhase === 'intro') return;    // intro 중엔 기물 선택 차단
      const p = board[r][c];
      if (selected && legalForSel.some(([rr, cc]) => rr === r && cc === c)) {
        doTutorialMove(r, c);
        return;
      }
      if (p && p.side === 'r') {
        selected = [r, c];
        // 튜토리얼: 왕 안전 검사 없이 순수 행마법만 표시 (왕이 없으니 legalMoves 쓰면 전부 차단됨)
        legalForSel = Eng.pseudoMoves(board, r, c);
        render();
      } else {
        selected = null;
        legalForSel = [];
        render();
      }
      return;
    }
    // ★ AI 차례면 사람 입력 무시 (AI가 두는 중 또는 둘 차례).
    if (aiSide && turn === aiSide) return;
    const p = board[r][c];
    // 합법수 도착점이면 이동
    if (selected && legalForSel.some(([rr,cc]) => rr===r && cc===c)) {
      doMove(r, c);
      return;
    }
    if (p && p.side === turn) {
      selected = [r, c];
      legalForSel = Eng.legalMoves(board, r, c);
      playPickSound();   // 기물 선택 소리
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
      playCaptureSound();   // 잡기 전용 소리
      spawnSplat(tr, tc);
    } else {
      playMoveSound();   // 일반 이동 소리
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
    renderClock();   // 새 차례 강조 갱신
    // 종료/장군 판정
    const st = Eng.gameStatus(board, turn);
    if (st.over) {
      stopClock();
      if (st.draw) {
        endGame(null, 'stalemate');   // 수막힘 무승부 (승자 없음)
      } else {
        endGame(st.loser === 'r' ? 'b' : 'r', st.reason);   // 외통 등 — 승자 전달
      }
    } else {
      refreshStatus();   // 장군이면 "장군!", 아니면 기물 고르세요 (파생 문구)
      // ★ 이벤트성 연출: 이번 수로 새로 장군이 걸린 경우에만. undo/setLang에선 안 울림.
      if (Eng.isInCheck(board, turn)) fireCheckFx();
      startClock();   // 새 차례 쪽 시계 시작 (none이면 무동작)
      // ★ 다음 차례가 AI면 AI에게 위임 (연출·소리·장군은 doMove 경유라 자동 적용).
      maybeAiMove();
    }
  }

  // ── AI 턴 처리 (★ AI 통합) ────────────────────────────────
  // 현재 차례가 AI 자리면 AI에게 수를 위임. 사람 수와 동일하게 doMove를 거치므로
  // 연출·소리·장군·기보·시계·종료판정이 전부 자동으로 적용된다.
  function maybeAiMove() {
    if (!aiSide || gameOver) return;
    if (turn !== aiSide) return;
    if (aiThinking) return;
    runAiTurn();
  }

  function runAiTurn() {
    if (typeof window.JanggiAI === 'undefined') {
      showAiFailUI();   // 어댑터/로더 자체가 없음
      return;
    }
    aiThinking = true;
    clearAiFailUI();
    // "건너편이 잠시 생각합니다" — 보이지 않는 기객 (루미 톤). 번쩍임 없는 조용한 안내.
    setStatus(t('aiThinking'));
    frame.classList.add('ai-thinking');   // CSS: 옅은 먹 번짐 + 느린 호흡

    // ★ 최소 생각 시간 (루미 안): 계산이 빨리 끝나도 그 시간 동안 "생각 중" 유지.
    //   매번 같은 시간이면 그것도 기계 같으니 흔들리게. 사람이 수마다 다르게 고민하는 호흡.
    //   ※ 강도별로 미세하게 다름(AI_LEVELS의 thinkMin~thinkMax). 강도를 만드는 게 아니라
    //     "고민하는 모습"을 만드는 용도 — 차이는 작게(0.5~1초). 강할수록 살짝 더 신중.
    //   ※ 약하다고 빨리 두지 않음. 초심자도 최소 2.5초(빠르면 "계산기 느낌"이 남).
    //   ※ mj님(외부 테스터) "거침없이 빠르다" 피드백 반영분(1.5~2.5 → 2.5~4초)이 출발점.
    const tlv = AI_LEVELS[aiLevel] || AI_LEVELS.master;
    const tMin = tlv.thinkMin || 2500;
    const tMax = tlv.thinkMax || 4000;
    const minThinkMs = tMin + Math.random() * (tMax - tMin);
    const startedAt = Date.now();
    const snapshotTurn = turn;

    // 착수 처리 (즉시든 딜레이 후든 동일 경로).
    const commitMove = (mv) => {
      aiThinking = false;
      frame.classList.remove('ai-thinking');
      // 비동기 사이 판이 바뀌었을 수 있음(무르기/리셋). 방어.
      if (gameOver || turn !== snapshotTurn || turn !== aiSide) return;

      let fr, fc, tr, tc;
      let usable = false;
      if (mv) {
        [fr, fc, tr, tc] = mv;
        const legal = Eng.legalMoves(board, fr, fc);
        if (legal.some(([rr, cc]) => rr === tr && cc === tc)) {
          selected = [fr, fc];
          legalForSel = legal;
          usable = true;
        }
      }

      // ★ 안전망: 엔진(SF) 수가 우리 룰상 불법이거나 없을 때.
      //   SF의 janggi 구현과 우리 engine.js 룰이 특정 국면(빅장/장군 등)에서
      //   갈릴 수 있음. 그때 멈추지 말고 우리 합법수 중 하나를 둔다 — "끝까지 두는 경험" 우선.
      //   잡는 수를 먼저 고려(SF의 공격 의도에 그나마 근접), 없으면 임의 합법수.
      if (!usable) {
        if (mv) console.warn('[JanggiAI] 엔진 수가 로컬 룰과 불일치 → 자체 합법수로 대체:', mv);
        const all = Eng.allLegalMoves(board, turn);
        if (all.length === 0) {
          // 둘 수가 정말 하나도 없음 = 외통/스테일메이트. doMove 경유 없이 종료 판정에 맡김.
          // (정상적으로는 직전 doMove에서 이미 gameOver 처리됨. 여기 오면 방어적 종료.)
          showAiFailUI();
          return;
        }
        // 잡는 수 우선
        const captures = all.filter(([, , rr, cc]) => board[rr][cc]);
        const pick = (captures.length ? captures : all)[
          Math.floor(Math.random() * (captures.length ? captures.length : all.length))
        ];
        [fr, fc, tr, tc] = pick;
        selected = [fr, fc];
        legalForSel = Eng.legalMoves(board, fr, fc);
      }

      // 사람 수와 동일 경로: doMove로 연출·소리·장군·기보 자동.
      doMove(tr, tc);
    };

    // 현재 판/차례를 그대로 넘긴다. (가) 매 수 전체 FEN 재생성 방식.
    const lv = AI_LEVELS[aiLevel] || AI_LEVELS.friend;   // ★ 현재 강도(depth·skill)
    window.JanggiAI.bestMove(board, turn, lv.depth, lv.skill).then((mv) => {
      // 계산이 최소 시간보다 빨리 끝났으면 남은 만큼 기다렸다가 착수.
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, minThinkMs - elapsed);
      if (wait > 0) {
        setTimeout(() => commitMove(mv), wait);
      } else {
        commitMove(mv);
      }
    }).catch((e) => {
      aiThinking = false;
      frame.classList.remove('ai-thinking');
      console.warn('[JanggiAI] bestMove 실패:', e && e.message);
      showAiFailUI();
    });
  }

  // 실패 UX (루미 안): 기술 오류처럼 안 보이게. 조용한 안내 + "다시 깨우기"/"판만 보기".
  function showAiFailUI() {
    setStatus(t('aiWaking'));
    let box = document.getElementById('aiFailBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'aiFailBox';
      box.className = 'ai-fail';
      box.innerHTML =
        `<span class="ai-fail-text" id="aiFailText"></span>` +
        `<div class="ai-fail-buttons">` +
        `<button id="aiRetry" class="ai-retry"></button>` +
        `<button id="aiWatch" class="ai-watch"></button>` +
        `</div>`;
      statusEl.parentNode.insertBefore(box, statusEl.nextSibling);
      document.getElementById('aiRetry').onclick = () => {
        clearAiFailUI();
        // 엔진 상태에 따라 재시도. init부터 다시.
        runAiTurn();
      };
      document.getElementById('aiWatch').onclick = () => {
        // "판만 보기": AI 끄고 사람이 양쪽 다 둘 수 있게 (이미 board는 그려져 있음).
        clearAiFailUI();
        aiSide = null;
        refreshPersp();
        refreshStatus();
      };
    }
    document.getElementById('aiFailText').textContent = t('aiFailLong');
    document.getElementById('aiRetry').textContent = t('aiRetry');
    document.getElementById('aiWatch').textContent = t('aiWatch');
    box.classList.add('show');
  }
  function clearAiFailUI() {
    const box = document.getElementById('aiFailBox');
    if (box) box.classList.remove('show');
  }

  // ── 디버그/검증 안전장치 (★ 인수인계서 C 안) ──────────────
  // 콘솔에서 window.aiMove() 호출 → 현재 판에 AI 한 수 강제. 엔진 점검용.
  window.aiMove = function () {
    if (!board) { console.log('판이 아직 없음'); return; }
    console.log('[aiMove] 현재 차례:', turn, '/ AI 자리:', aiSide,
                '/ 엔진상태:', window.JanggiAI && window.JanggiAI.getState());
    const t0 = turn;
    const dbgLv = AI_LEVELS[aiLevel] || AI_LEVELS.friend;
    window.JanggiAI.bestMove(board, turn, dbgLv.depth, dbgLv.skill).then((mv) => {
      console.log('[aiMove] bestmove →', mv);
      if (!mv || gameOver || turn !== t0) return;
      const legal = Eng.legalMoves(board, mv[0], mv[1]);
      if (legal.some(([r, c]) => r === mv[2] && c === mv[3])) {
        selected = [mv[0], mv[1]]; legalForSel = legal; doMove(mv[2], mv[3]);
      } else {
        console.warn('[aiMove] 합법수 아님:', mv);
      }
    }).catch((e) => console.error('[aiMove] 실패:', e));
  };

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

  // ── 장군 청각/시각 연출 (★ 이벤트성 — doMove에서 새 장군 발생 시에만) ──
  // 소리: 파일이 있으면 파일, 없으면 Web Audio 합성(징 비슷한 금속 울림).
  let _checkAudioEl = null;
  let _checkAudioFailed = false;
  let _audioCtx = null;
  const CHECK_SOUND_SRC      = 'assets/sound/janggi_sfx_checkmate.mp3';
  let _moveAudioEl = null;
  let _moveAudioFailed = false;
  const MOVE_SOUND_SRC       = 'assets/sound/janggi_sfx_move.mp3';
  let _captureAudioEl = null;
  let _captureAudioFailed = false;
  const CAPTURE_SOUND_SRC    = 'assets/sound/janggi_sfx_capture.mp3';
  let _pickAudioEl = null;
  let _pickAudioFailed = false;
  const PICK_SOUND_SRC       = 'assets/sound/janggi_sfx_pick.mp3';

  function playCheckSound() {
    // 1순위: 음원 파일. 로드 실패 이력이 있으면 바로 합성으로.
    if (!_checkAudioFailed) {
      try {
        if (!_checkAudioEl) {
          _checkAudioEl = new Audio(CHECK_SOUND_SRC);
          _checkAudioEl.addEventListener('error', () => { _checkAudioFailed = true; });
        }
        if (!_checkAudioFailed) {
          _checkAudioEl.currentTime = 0;
          const pr = _checkAudioEl.play();
          if (pr && pr.catch) pr.catch(() => { _checkAudioFailed = true; synthCheckSound(); });
          return;
        }
      } catch (e) {
        _checkAudioFailed = true;
      }
    }
    synthCheckSound();
  }

  // Web Audio 합성: 두 음(징 기음 + 배음)을 빠른 어택·긴 감쇠로. 사용자 제스처 후에만 소리남(브라우저 정책).
  function synthCheckSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!_audioCtx) _audioCtx = new Ctx();
      if (_audioCtx.state === 'suspended') _audioCtx.resume();
      const ctx = _audioCtx;
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);
      // 징 느낌: 약간 불협한 두 배음
      const freqs = [196, 277];   // G3 + 약간 위 — 금속 울림감
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.value = f;
        g.gain.value = i === 0 ? 1.0 : 0.5;
        osc.connect(g); g.connect(master);
        osc.start(now);
        osc.stop(now + 1.6);
      });
      // 엔벨로프: 빠른 어택 → 긴 감쇠
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.35, now + 0.012);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    } catch (e) { /* 오디오 불가 환경 — 무음으로 폴백 */ }
  }

  // 장군당한 궁 위치에 일회성 붉은 파동
  function spawnCheckBurst() {
    const k = Eng.findKing(board, turn);   // turn = 방금 장군당한(둘 차례) 쪽
    if (!k) return;
    const { x, y } = posToXY(k[0], k[1]);
    const burst = document.createElement('div');
    burst.className = 'check-burst';
    burst.style.left = x + '%';
    burst.style.top = y + '%';
    piecesLayer.appendChild(burst);
    setTimeout(() => burst.remove(), 900);
  }

  // 보드 중앙에 "장군" 글자 — 안개 결로 떴다 걷힘 (일회성, 0.8s)
  // mist-overlay와 같은 디자인 언어. index.html 무수정 위해 동적 생성.
  function spawnCheckAnnounce() {
    // 직전 잔상이 남아있으면 제거(연속 장군 시 깔끔하게)
    const old = frame.querySelector('.check-announce');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.className = 'check-announce';
    const span = document.createElement('span');
    span.className = 'check-announce-text';
    span.textContent = t('checkWord');
    ov.appendChild(span);
    frame.appendChild(ov);   // pieces가 아니라 frame에 — 보드 전체 덮음(mist와 같은 위치)
    setTimeout(() => ov.remove(), 850);
  }

  // 새 장군 발생 시 호출 — 소리 + 궁 파동 + 중앙 글자
  function fireCheckFx() {
    spawnCheckBurst();
    spawnCheckAnnounce();
    playCheckSound();
  }

  // ── 기물 놓는 소리 (백자알 "딱") — 매 수마다. check와 동일한 파일-우선/합성-폴백 구조. ──
  function playMoveSound() {
    if (!_moveAudioFailed) {
      try {
        if (!_moveAudioEl) {
          _moveAudioEl = new Audio(MOVE_SOUND_SRC);
          _moveAudioEl.addEventListener('error', () => { _moveAudioFailed = true; });
        }
        if (!_moveAudioFailed) {
          _moveAudioEl.currentTime = 0;
          const pr = _moveAudioEl.play();
          if (pr && pr.catch) pr.catch(() => { _moveAudioFailed = true; synthMoveSound(); });
          return;
        }
      } catch (e) {
        _moveAudioFailed = true;
      }
    }
    synthMoveSound();
  }

  // 기물 잡기 소리 — 파일 우선, 폴백은 moveSound 합성
  function playCaptureSound() {
    if (!_captureAudioFailed) {
      try {
        if (!_captureAudioEl) {
          _captureAudioEl = new Audio(CAPTURE_SOUND_SRC);
          _captureAudioEl.addEventListener('error', () => { _captureAudioFailed = true; });
        }
        if (!_captureAudioFailed) {
          _captureAudioEl.currentTime = 0;
          const pr = _captureAudioEl.play();
          if (pr && pr.catch) pr.catch(() => { _captureAudioFailed = true; synthMoveSound(); });
          return;
        }
      } catch (e) {
        _captureAudioFailed = true;
      }
    }
    synthMoveSound();
  }

  // 기물 선택 소리 — 파일 우선, 폴백은 moveSound 합성
  function playPickSound() {
    if (!_pickAudioFailed) {
      try {
        if (!_pickAudioEl) {
          _pickAudioEl = new Audio(PICK_SOUND_SRC);
          _pickAudioEl.addEventListener('error', () => { _pickAudioFailed = true; });
        }
        if (!_pickAudioFailed) {
          _pickAudioEl.currentTime = 0;
          const pr = _pickAudioEl.play();
          if (pr && pr.catch) pr.catch(() => { _pickAudioFailed = true; });
          return;
        }
      } catch (e) {
        _pickAudioFailed = true;
      }
    }
  }

  // Web Audio 합성: 도자기가 나무에 닿는 짧은 "딱". 노이즈 버스트(고역) + 짧은 톤 클릭, 빠른 감쇠.
  function synthMoveSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!_audioCtx) _audioCtx = new Ctx();
      if (_audioCtx.state === 'suspended') _audioCtx.resume();
      const ctx = _audioCtx;
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);

      // (1) 짧은 노이즈 버스트 — 도자기 표면의 "딱" 질감. 고역통과로 맑게.
      const dur = 0.09;
      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3); // 빠른 감쇠
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2200;   // 2~5kHz 고역 강조 → 도자기 맑은 느낌
      const ng = ctx.createGain();
      ng.gain.value = 0.6;
      noise.connect(hp); hp.connect(ng); ng.connect(master);
      noise.start(now);

      // (2) 짧은 톤 클릭 — 알맹이의 단단한 무게감. 미세 피치 변동으로 반복감 완화.
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 880 * (0.96 + Math.random() * 0.08);  // ±4% 변동
      osc.connect(og); og.connect(master);
      og.gain.setValueAtTime(0.0001, now);
      og.gain.exponentialRampToValueAtTime(0.5, now + 0.004);
      og.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) { /* 오디오 불가 — 무음 폴백 */ }
  }

  // ── 대국 시계 (timeMode 'simple') ──────────────────────────
  // 자기 차례인 쪽의 시간만 1초씩 감소. 0이면 timeout 패.
  function clockEnabled() { return ruleOptions.timeMode !== 'none'; }

  function startClock() {
    stopClock();
    if (!clockEnabled() || gameOver) return;
    clockTimer = setInterval(() => {
      if (gameOver) { stopClock(); return; }
      clock[turn] = Math.max(0, clock[turn] - 1);
      renderClock();
      if (clock[turn] <= 0) {
        stopClock();
        // 시간 떨어진 쪽(turn) 패 → 상대 승리
        endGame(turn === 'r' ? 'b' : 'r', 'timeout');
      }
    }, 1000);
  }
  function stopClock() {
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
  }

  function fmtClock(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  // 시계 표시 — 상태창 위에 동적 요소(없으면 생성). index.html 무수정 유지.
  function renderClock() {
    let bar = document.getElementById('clockBar');
    if (!clockEnabled()) { if (bar) bar.remove(); return; }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'clockBar';
      bar.className = 'clock-bar';
      bar.innerHTML =
        '<span class="clock r" id="clockR"></span>' +
        '<span class="clock b" id="clockB"></span>';
      statusEl.parentNode.insertBefore(bar, statusEl);
    }
    const cr = document.getElementById('clockR');
    const cb = document.getElementById('clockB');
    if (cr) {
      cr.textContent = factionLabel('r') + ' ' + fmtClock(clock.r);
      cr.classList.toggle('active', turn === 'r' && !gameOver);
      cr.classList.toggle('low', clock.r <= 30);
    }
    if (cb) {
      cb.textContent = factionLabel('b') + ' ' + fmtClock(clock.b);
      cb.classList.toggle('active', turn === 'b' && !gameOver);
      cb.classList.toggle('low', clock.b <= 30);
    }
  }

  function updateTurnUI() {
    statusEl.classList.toggle('turn-r', turn === 'r');
    statusEl.classList.toggle('turn-b', turn === 'b');
    turnLabel.textContent = factionLabel(turn);
    refreshPersp();
  }

  // ★ 관점 줄 갱신: 지금 turn이 "내 쪽"이냐 "상대(AI) 쪽"이냐를 분명히.
  //   playerFaction(chu/han) → 자리(r/b). turn이 내 자리면 "당신 차례",
  //   AI 자리면 "상대가 생각 중". AI 없는 모드면 누구 차례인지만 표시.
  function refreshPersp() {
    if (!turnPersp) return;
    if (gameOver) { turnPersp.textContent = ''; turnPersp.className = 'turn-persp'; return; }
    const humanSide = (playerFaction === 'chu') ? 'r' : 'b';
    if (aiSide) {
      if (turn === humanSide) {
        turnPersp.textContent = t('perspMine');
        turnPersp.className = 'turn-persp mine';
      } else {
        // 상대(AI) 차례 — 수묵 점 세 개가 천천히 차오르는 안내 (스피너 대신).
        turnPersp.innerHTML = t('perspAi') +
          ' <span class="ai-dots"><i>·</i><i>·</i><i>·</i></span>';
        turnPersp.className = 'turn-persp theirs';
      }
    } else {
      // AI 없는 모드(판만 보기 등): 누구 차례인지만 담담하게
      turnPersp.textContent = t('perspHuman', factionLabel(turn));
      turnPersp.className = 'turn-persp';
    }
  }

  function endGame(winner, reason) {
    gameOver = true;
    stopClock();
    if (winner === null) {
      // 무승부 (수막힘 등) — 승자/패자 없음. 재대국 자동배정용 lastResult는 유지(직전 결과 보존).
      endState = { winner: null, reason: reason || 'draw', loser: null, draw: true };
    } else {
      // winner는 자리(r/b). r=초(chu), b=한(han) — flipped 무관.
      lastResult = (winner === 'r') ? 'chu' : 'han';
      const loser = (winner === 'r') ? 'b' : 'r';
      endState = { winner, reason: reason || null, loser, draw: false };
    }
    winOverlay.classList.add('show');
    refreshPersp();   // gameOver면 관점 줄 비움
    renderEndMessages();
  }

  // 종료 오버레이·상태창 문구를 현재 언어로 (그)리기 — endGame과 언어전환에서 공용
  function renderEndMessages() {
    if (!endState) return;
    const { winner, reason, loser, draw } = endState;
    if (draw) {
      // 무승부: 진영 승리줄 대신 "비김", 큰 줄은 "무승부"
      winFactionLine.textContent = t('drawLine');
      winFactionLine.className = 'win-faction draw';
      winTitle.textContent = t('outcomeDraw');
      winTitle.className = 'draw';
      setStatus(reason === 'stalemate' ? t('drawStalemate') : t('outcomeDraw'));
      return;
    }
    const winnerFaction = (winner === 'r') ? 'chu' : 'han';
    const iWon = (winnerFaction === playerFaction);
    // 작은 줄: 누가 이겼나 (진영 + 진영색). 외통/시간패면 사유 명시
    winFactionLine.textContent =
      (reason === 'checkmate') ? t('byCheckmate', factionLabel(winner))
      : (reason === 'timeout') ? t('byTimeout', factionLabel(winner))
      : t('factionWon', factionLabel(winner));
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

  // 상태창 문구를 현재 판의 파생값으로 갱신. 장군이면 우선 "장군!", 아니면 기본 문구.
  // fallback: 장군이 아닐 때 쓸 문구(예: 무르기 후 "물렀습니다"). 미지정 시 pickPiece.
  function refreshStatus(fallback) {
    if (!board || gameOver) return;
    if (tutorialMode) return;   // 튜토리얼 중엔 장군 판정 안 함
    if (Eng.isInCheck(board, turn)) {
      setStatus(t('check', factionLabel(turn)));
    } else {
      setStatus(fallback != null ? fallback : t('pickPiece'));
    }
  }

  // 정적 UI 문구 갱신 (로드 시 + 언어 전환 시)
  function applyStaticI18n() {
    elSub.textContent = t('sub');
    if (langLabel) langLabel.textContent = t('langLabel');   // ⚙ 드롭다운 이동 후 null-safe
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
    const settingsBgLabel = document.getElementById('settingsBgLabel');
    if (settingsBgLabel) settingsBgLabel.textContent = t('settingsBgLabel');
    const bgSansuHwaBtn = document.getElementById('bgSansuHwa');
    if (bgSansuHwaBtn) bgSansuHwaBtn.textContent = t('bgSansuHwa');
    const bgSimpleBtn = document.getElementById('bgSimple');
    if (bgSimpleBtn) bgSimpleBtn.textContent = t('bgSimple');
  }

  function setLang(next) {
    if (next === lang) return;
    lang = next;
    applyStaticI18n();
    // 튜토리얼 중이면 사이드 패널만 재렌더
    if (tutorialMode) {
      if (tutorialPieceOverlay.style.display !== 'none') {
        if (tutorialPieceTitle) tutorialPieceTitle.textContent = tt('tutPieceTitle');
        renderTutorialPieceGrid();
      } else if (tutorialScenario) {
        renderTutorialSidePanel(tutorialScenario);
      }
      return;
    }
    // 현재 보이는 동적 영역 다시 그리기
    if (setupOverlay.classList.contains('show')) {
      // 셋업 중: 보이는 단계 갱신
      if (levelStep.style.display !== 'none') {
        if (levelSubPanel.style.display !== 'none') {
          renderLevelStep();   // 강도 서브패널 중
        } else {
          renderModeGrid();    // 모드 메뉴 중
          if (levelStepTitle) levelStepTitle.textContent = t('levelTitle');
        }
      } else if (factionStep.style.display !== 'none') {
        renderFactionStep(factionAutoAssigned);
      } else {
        renderSetupStep();
      }
    }
    if (board) {
      updateTurnUI();
      renderCaptured();
      renderMovelog();
      refreshStatus();   // 진행 중 장군 상태면 새 언어로 "장군!" 복원
    }
    // 게임이 끝난 상태면 종료 오버레이·상태창 문구도 현재 언어로 다시
    if (gameOver && endState) {
      renderEndMessages();
    }
  }

  function undo() {
    if (gameOver) return;
    // ★ AI가 생각 중이면 무르기 막음 (수가 들어오는 중 되감으면 꼬임).
    if (aiThinking) return;
    if (!history.length) return;
    // 한 수 되감기 (공통).
    const popOne = () => {
      const prev = history.pop();
      board = prev.board;
      turn = prev.turn;
      captured.r = prev.capR;
      captured.b = prev.capB;
      if (typeof prev.logLen === 'number') moveLog.length = prev.logLen;
    };
    popOne();
    // ★ AI 대국: 되감은 결과가 AI 차례면, 사람 차례가 될 때까지 한 번 더 되감음.
    //   (사람 한 수 + AI 한 수 = 두 단계를 함께 무르는 효과 → 멈춤 방지.)
    if (aiSide && turn === aiSide && history.length) {
      popOne();
    }
    selected = null; legalForSel = [];
    gameOver = false;
    endState = null;
    clearAiFailUI();
    winOverlay.classList.remove('show');
    render();
    renderMovelog();
    updateTurnUI();
    refreshStatus(t('undone'));   // 무른 자리가 장군이면 "장군!" 우선, 아니면 "물렀습니다"
    renderClock();
    startClock();   // 진행 상태로 복귀 — 현재 차례 시계 재개 (none이면 무동작)
    // 되감은 뒤에도 여전히 AI 차례면(첫 수가 AI였던 경우 등) AI에게 위임.
    maybeAiMove();
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
  langKo.onclick = () => { setLang('ko'); closeSettings(); };
  langEn.onclick = () => { setLang('en'); closeSettings(); };

  // ── 장기판 배경 선택 ──────────────────────────────────────
  // bg: 'sansuHwa'(기본) | 'simple'. 배경 추가 시 BG_LIST에만 추가하면 됨.
  let boardBg = 'sansuHwa';
  const BG_LIST = [
    { id: 'sansuHwa', cls: null,        btnId: 'bgSansuHwa' },
    { id: 'simple',   cls: 'bg-simple', btnId: 'bgSimple'   },
  ];
  function applyBoardBg(id) {
    boardBg = id;
    // frame 클래스 교체 — cls가 null이면 제거만
    for (const b of BG_LIST) {
      if (b.cls) frame.classList.remove(b.cls);
    }
    const target = BG_LIST.find(b => b.id === id);
    if (target && target.cls) frame.classList.add(target.cls);
    // 버튼 active 표시
    for (const b of BG_LIST) {
      const btn = document.getElementById(b.btnId);
      if (btn) btn.classList.toggle('active', b.id === id);
    }
  }
  document.getElementById('bgSansuHwa').onclick = () => { applyBoardBg('sansuHwa'); };
  document.getElementById('bgSimple').onclick   = () => { applyBoardBg('simple'); };

  // ⚙ 설정 드롭다운 토글
  function openSettings() {
    settingsDropdown.classList.add('open');
    settingsBackdrop.classList.add('open');
  }
  function closeSettings() {
    settingsDropdown.classList.remove('open');
    settingsBackdrop.classList.remove('open');
  }
  settingsBtn.onclick = (e) => {
    e.stopPropagation();
    settingsDropdown.classList.contains('open') ? closeSettings() : openSettings();
  };
  settingsBackdrop.onclick = closeSettings;

  window.addEventListener('resize', () => { sizeBoard(); });

  // ── 모바일 AudioContext unlock (iOS Safari 대응) ────────────
  // iOS Safari: 제스처 핸들러 안에서 동기적으로 ctx 생성 + resume + 무음 재생해야 unlock됨.
  // `once` 옵션 대신 플래그로 중복 실행 방지 (구형 iOS 호환).
  let _audioUnlocked = false;
  function unlockAudio() {
    if (_audioUnlocked) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    // 동기적으로 생성·resume
    if (!_audioCtx) _audioCtx = new Ctx();
    _audioCtx.resume().then(() => {
      // resume 완료 후 무음 버퍼 재생
      const buf = _audioCtx.createBuffer(1, 1, _audioCtx.sampleRate);
      const src = _audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(_audioCtx.destination);
      src.start(0);
      _audioUnlocked = true;
    });
  }
  document.addEventListener('touchstart', unlockAudio, { passive: true });
  document.addEventListener('touchend',   unlockAudio, { passive: true });
  document.addEventListener('click',      unlockAudio);

  applyStaticI18n();   // 시작 언어(브라우저 기준) 정적 문구 적용
  reset();

  // 레이아웃·폰트가 안정된 뒤 보드 크기 재계산 (첫 렌더에서 폭을 작게 읽는 문제 방지)
  requestAnimationFrame(() => { sizeBoard(); render(); });
  setTimeout(() => { sizeBoard(); render(); }, 200);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { sizeBoard(); render(); });
  }
})();
