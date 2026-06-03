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
  const langZhHans = document.getElementById('langZhHans');
  const langZhHant = document.getElementById('langZhHant');
  const langJa = document.getElementById('langJa');
  const langDe = document.getElementById('langDe');
  const langFr = document.getElementById('langFr');
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
  const winScore = document.getElementById('winScore');   // [6-2 UI] 무승부 점수 보조 줄
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
  // 개발 중에만 누락 키 경고를 띄우는 플래그. 배포 시 false 유지(콘솔 깨끗).
  const DEBUG_I18N = false;
  // 언어 선택 저장 키. 새로고침/재방문 시 이 값을 먼저 본다.
  const LANG_STORE_KEY = 'janggi.lang';
  // 지원 언어 목록 (저장값 검증용 — 모르는 값이 저장돼 있으면 무시).
  const SUPPORTED_LANGS = ['ko', 'en', 'zh-Hans', 'zh-Hant', 'ja', 'de', 'fr'];
  // 브라우저 언어 추측: 한국어→ko, 중국어→지역별 간체/번체, 일·독·불→각 언어, 그 외→en.
  function detectLang() {
    const raw = (navigator.language || 'en').toLowerCase();
    if (raw.startsWith('ko')) return 'ko';
    if (raw.startsWith('zh')) {
      // 번체권: 대만(tw)·홍콩(hk)·마카오(mo). 그 외 중국어는 간체 기본.
      if (/-(tw|hk|mo)\b/.test(raw) || raw.includes('hant')) return 'zh-Hant';
      return 'zh-Hans';
    }
    if (raw.startsWith('ja')) return 'ja';
    if (raw.startsWith('de')) return 'de';
    if (raw.startsWith('fr')) return 'fr';
    return 'en';
  }
  // 시작 언어: 저장값이 있으면 그걸 쓰고, 없거나 모르는 값이면 브라우저 추측.
  let lang = detectLang();
  try {
    const saved = localStorage.getItem(LANG_STORE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) lang = saved;
  } catch (e) { /* localStorage 차단(사생활 모드 등) 시 추측값 그대로 */ }

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
      // ★ [6] 전통 규칙 종료 표시 — 빅장(draw+score) / 반복수(승패)
      outcomeDrawBikjang: '무승부 (빅장)',
      drawBikjang: '빅장 — 점수로 가립니다',
      scoreLead: (s, n) => `${s} ${n}점 우세`,
      chuShort: '초', hanShort: '한',   // 격차 줄용 — 한자 병기 없는 짧은 진영명(반복 회피)
      byCheckmate: (s) => `외통 — ${s} 승리`,
      byTimeout: (s) => `시간패 — ${s} 승리`,
      //   반복수는 무승부가 아니라 실격패(연맹 규정) → 승/패 화면. "반복수 — {승자} 승리".
      byRepetition: (s) => `반복수 — ${s} 승리`,
      //   ★ [6-3c] 반복수 종료 부제 — 빅장 점수줄처럼 화면이 스스로 사유를 설명(왜 끝났는지).
      //   winScore(결과 보조 설명 줄)를 점수가 아닌 사유 한 줄로 재사용.
      //   ★ 톤: 사람은 컴퓨터 대국에서 반복수 시 거의 항상 패배 쪽을 봄. 순수 중립("반복되었습니다")은
      //   패배와 연결이 약하고, 책임 추궁("당신이 반복")은 다실 톤이 깨짐 → 가운데("…종료되었습니다").
      repetitionReason: '같은 국면이 네 번 반복되어 대국이 종료되었습니다',
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
      modeRules: '장기 규칙', modeRulesSub: '장군·외통·승리 조건',
      modeHuman: '사람과 두기', modeHumanSub: '준비 중입니다',
      modeReview: '복기하기', modeReviewSub: '준비 중입니다',
      modeComing: '아직 준비 중입니다',
      levelPlayCpu: '컴퓨터와 두기',
      lvBeginnerName: '초심자', lvBeginnerSub: '처음 장기를 배우는 분을 위한 상대',
      lvFriendName: '익숙한 벗', lvFriendSub: '가볍게 한 판 즐길 수 있는 상대',
      lvMasterName: '노련한 기객', lvMasterSub: '쉽게 빈틈을 보이지 않는 상대',
      lvExpertName: '대국수', lvExpertSub: '한 치의 빈틈도 허락하지 않는 상대',
      levelNote: '마음에 드는 상대를 고르세요 · 한 판이 끝나면 다시 고를 수 있습니다',
      settingsLangLabel: '언어',
      settingsBtnLabel: '설정',
      settingsBgLabel: '장기판 배경',
      bgSansuHwa: '산수화', bgSimple: '심플', bgWood: '원목', bgSipjangsaeng: '십장생', bgPaper: '한지',
      rulesTitle: '장기 규칙',
      rulesSubtitle: '게임을 시작하기 전에 알아두면 좋은 기본 규칙',
      rulesExLabel: '예시',
      rulesClose: '닫기',
      aboutTitle: '소개',
      aboutClose: '닫기',
      aboutSections: [
        {
          title: '소개',
          body: '장기는 한국의 전통 전략 보드게임으로, 흔히 Korean chess로 소개됩니다.',
        },
        {
          title: '크레딧',
          body: '기물과 장기판 이미지: 이 프로젝트를 위해 제작\n효과음: Pixabay / taure',
          link: { url: 'https://pixabay.com/sound-effects/', label: 'Pixabay' },
        },
      ],
      rulesSections: [
        {
          title: '장기의 목표',
          body: '장기는 두 진영이 겨루는 한국의 전통 보드게임입니다. 상대의 왕(楚 또는 漢)을 외통으로 몰아넣으면 승리합니다. 내 왕을 지키면서 상대의 왕을 공격하는 것이 핵심입니다.',
          example: null,
        },
        {
          title: '장군 (Check)',
          body: '상대의 왕을 다음 수에 잡을 수 있는 상태를 장군이라고 합니다. 장군을 받으면 반드시 왕을 안전한 곳으로 옮기거나, 공격을 막거나, 공격하는 기물을 잡아 위협에서 벗어나야 합니다.',
          example: '차가 상대의 왕을 일직선으로 겨누고 있는 경우.',
        },
        {
          title: '양수겸장 (Double Check)',
          body: '한 수로 두 기물이 동시에 왕을 노리는 경우를 양수겸장이라고 합니다. 두 위협을 한 번에 막을 수는 없으므로, 두 공격을 모두 피하려면 왕을 안전한 칸으로 옮기는 길밖에 없습니다. 옮길 곳마저 없으면 외통입니다.',
          example: '왕을 막고 있던 기물이 비켜서며, 그 자리 뒤의 기물과 비켜선 기물이 함께 왕을 겨누는 경우.',
        },
        {
          title: '외통 (Checkmate)',
          body: '장군을 받았지만 어떤 방법으로도 벗어날 수 없는 상태를 외통이라고 합니다. 왕을 옮길 수도, 공격을 막을 수도, 공격하는 기물을 잡을 수도 없으면 외통이며, 이 순간 대국이 끝납니다.',
          example: '왕이 도망갈 칸이 모두 막혀 있고, 공격을 막을 기물도 없는 경우.',
        },
        {
          title: '승리 조건',
          body: '상대를 외통으로 몰면 승리합니다. 또한 상대가 스스로 돌을 던지면 그 즉시 이깁니다.',
          example: null,
        },
        {
          title: '빅장 (점수제 무승부)',
          body: '양쪽 왕이 같은 세로줄에서 마주 보고, 그 사이를 가로막는 기물이 하나도 없는 상태를 빅장이라고 합니다. 차례인 쪽이 이 마주 봄을 풀 수 있는 합법적인 수가 하나도 없으면 대국은 무승부로 끝납니다. 이때 승부는 남은 기물의 점수로 가립니다. 차는 13점, 포는 7점, 마는 5점, 상과 사는 각 3점, 병(졸)은 2점이며 왕은 0점입니다. 후수인 한(漢)은 먼저 두는 불리함을 보정받아 1.5점을 더 받습니다. 점수가 높은 쪽이 빅장 무승부에서 우세를 가져갑니다.',
          example: '두 왕이 같은 줄에서 마주 본 채, 차례인 쪽이 그 줄을 벗어나거나 사이를 막을 방법이 전혀 없는 경우.',
        },
        {
          title: '반복수',
          body: '똑같은 배치가 같은 차례에 거듭 나타나는 것을 반복수라고 합니다. 같은 국면을 세 번까지는 둘 수 있지만, 같은 국면을 네 번째로 반복한 쪽이 실격패합니다. 빅장과 달리 반복수는 무승부가 아니라 승패가 갈리는 종료입니다. 한쪽이 계속 장군을 걸어 무한정 대국을 끄는 만년장을 막기 위한 규칙입니다.',
          example: '한 기물로 같은 자리를 오가며 장군을 거듭 거는 경우, 네 번째 같은 국면에서 그 쪽이 패합니다.',
        },
        {
          title: '알아두기',
          body: '이 게임은 장군과 외통, 돌던지기에 더해 빅장(점수제 무승부)과 반복수까지 적용합니다. 행마법과 상차림 등 더 자세한 내용은 장기를 직접 두며 익혀 보세요.',
          example: null,
        },
      ],
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
      outcomeDrawBikjang: 'Draw (Bikjang)',
      drawBikjang: 'Bikjang — decided by points',
      scoreLead: (s, n) => `${s} leads by ${n}`,
      chuShort: 'Cho', hanShort: 'Han',
      byCheckmate: (s) => `Checkmate — ${s} wins`,
      byTimeout: (s) => `Timeout — ${s} wins`,
      // ★ [6-3b] Repetition is a forfeit loss (federation rule), not a draw → win/lose screen.
      byRepetition: (s) => `Repetition — ${s} wins`,
      repetitionReason: 'The same position occurred four times, ending the game',
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
      modeRules: 'Rules', modeRulesSub: 'Check, checkmate, how to win',
      modeHuman: 'Play with a Friend', modeHumanSub: 'Coming soon',
      modeReview: 'Review a Game', modeReviewSub: 'Coming soon',
      modeComing: 'This mode is not yet available',
      levelPlayCpu: 'Play with Computer',
      lvBeginnerName: 'Beginner', lvBeginnerSub: 'For someone learning Janggi for the first time',
      lvFriendName: 'Familiar Friend', lvFriendSub: 'A relaxed opponent for a casual game',
      lvMasterName: 'Seasoned Player', lvMasterSub: 'Rarely leaves an opening',
      lvExpertName: 'Master', lvExpertSub: 'Allows not a single opening',
      levelNote: 'Choose your opponent · you can pick again after each game',
      settingsLangLabel: 'Language',
      settingsBtnLabel: 'Settings',
      settingsBgLabel: 'Board Background',
      bgSansuHwa: 'Ink Wash', bgSimple: 'Simple', bgWood: 'Wood', bgSipjangsaeng: 'Sipjangsaeng', bgPaper: 'Hanji',
      rulesTitle: 'How to Play Janggi',
      rulesSubtitle: "The basics you'll want to know before your first game",
      rulesExLabel: 'Example',
      rulesClose: 'Close',
      aboutTitle: 'About',
      aboutClose: 'Close',
      aboutSections: [
        {
          title: 'About',
          body: 'Korean Janggi is a traditional Korean strategy board game, often described as Korean chess.',
        },
        {
          title: 'Credits',
          body: 'Piece & board artwork: created for this project\nSound effects: Pixabay / taure',
          link: { url: 'https://pixabay.com/sound-effects/', label: 'Pixabay' },
        },
      ],
      rulesSections: [
        {
          title: 'The Goal',
          body: "Janggi is a traditional Korean board game played between two sides. You win by trapping your opponent's General (楚 or 漢) in checkmate. The key is to defend your own General while attacking your opponent's.",
          example: null,
        },
        {
          title: 'Check',
          body: "When your opponent's General could be captured on the next move, it is in check. A General in check must escape the threat: move to a safe spot, block the attack, or capture the attacking piece.",
          example: 'A Chariot lined up directly against the opposing General.',
        },
        {
          title: 'Double Check',
          body: 'When a single move puts two pieces in attack on the General at once, it is a double check. No single block or capture can answer both threats, so the only escape is to move the General to a safe square. If it has nowhere to go, it is checkmate.',
          example: 'A piece shielding the General steps aside, so that it and the piece behind it both attack the General at the same time.',
        },
        {
          title: 'Checkmate',
          body: 'When a General is in check and cannot escape by any means, it is checkmate. If the General cannot move, the attack cannot be blocked, and the attacking piece cannot be captured, it is checkmate and the game ends.',
          example: 'The General has no safe square to flee to, and no piece can block the attack.',
        },
        {
          title: 'How to Win',
          body: 'Trap your opponent in checkmate to win. You also win immediately if your opponent resigns.',
          example: null,
        },
        {
          title: 'Bikjang (Scored Draw)',
          body: "Bikjang occurs when both Generals face each other on the same file with no piece standing between them. If the side to move has no legal way to break this face-off, the game ends in a draw. The outcome is then decided by the points of the remaining pieces: the Chariot is worth 13, the Cannon 7, the Horse 5, the Elephant and Guard 3 each, the Soldier 2, and the General 0. Han (漢), moving second, receives an extra 1.5 points to offset the disadvantage of going later. The side with more points takes the edge in a Bikjang draw.",
          example: 'The two Generals face each other on the same file, and the side to move has no way to leave that file or block the space between them.',
        },
        {
          title: 'Repetition',
          body: 'Repetition is when the same arrangement recurs with the same side to move. A position may be repeated up to three times, but the side that creates the same position for the fourth time loses by forfeit. Unlike Bikjang, repetition ends the game with a winner and a loser rather than a draw. The rule exists to stop a player from dragging the game on forever with perpetual check.',
          example: 'A piece shuttles back and forth giving check again and again; on the fourth identical position, that side loses.',
        },
        {
          title: 'Good to Know',
          body: 'Alongside check, checkmate, and resignation, this game applies Bikjang (a scored draw) and repetition. For more on how the pieces move and the opening formations, the best way to learn is to play.',
          example: null,
        },
      ],
    },
    'zh-Hans': {
      sub: 'JANGGI · 韩国象棋',
      langLabel: '语言 :',
      chooseFaction: '请选择阵营',
      chuName: '楚', hanName: '汉',
      chuSub: '先手 · 青绿', hanSub: '后手 · 朱红',
      factionNoteDefault: '所选阵营位于棋盘下方 · 楚方始终先行',
      autoWon: '上一局获胜 — 本局自动分配为汉方。如需更改，请选择另一阵营。',
      autoLost: '上一局落败 — 本局自动分配为楚方。如需更改，请选择另一阵营。',
      setupTitlePre: ' 的布阵',   // <b>楚</b> 的布阵
      autoPick: '自动选择（随机）',
      turnLabel: '行棋', mistStart: '对局开始',
      undo: '悔棋', reset: '重新开始', flip: '翻转棋盘',
      resign: '认输', resignConfirm: '确定要认输吗？',
      resignYes: '是', resignNo: '否',
      resigned: (s) => `${s} 认输 — 已投子`,
      capByChu: '楚方吃子', capByHan: '汉方吃子',
      capChuEmpty: '楚方吃掉的棋子', capHanEmpty: '汉方吃掉的棋子',
      movelogTitle: '棋 谱', movelogEmpty: '尚无棋步',
      pickPiece: '请选择棋子',
      pickDest: '请选择落点', cantMove: '该棋子无合法走法',
      notYourTurn: (s) => `现在轮到 ${s} 行棋`,
      check: (s) => `将军！请走子保护 ${s} 方的将`,
      checkWord: '将军',
      myFaction: (you, sR, sB) => `我的阵营：${you} · 楚 ${sR} · 汉 ${sB}`,
      chuFirst: '楚 · 先手', hanSecond: '汉 · 后手',
      win: (s) => `${s} 方获胜`,
      outcomeWin: '胜', outcomeLose: '负',
      factionWon: (s) => `${s} 方获胜`,
      youWon: '你获胜了 · 下一局执汉',
      youLost: '你落败了 · 下一局执楚',
      outcomeDraw: '和棋', drawLine: '和局',
      drawStalemate: '无子可动 — 本局为和棋',
      outcomeDrawBikjang: '和棋（逼将）',
      drawBikjang: '逼将 — 由点数决定胜负',
      scoreLead: (s, n) => `${s} 领先 ${n} 分`,
      chuShort: '楚', hanShort: '汉',
      byCheckmate: (s) => `将死 — ${s} 方获胜`,
      byTimeout: (s) => `超时 — ${s} 方获胜`,
      byRepetition: (s) => `重复局面 — ${s} 方获胜`,
      repetitionReason: '同一局面出现四次，本局结束',
      undone: '已悔一步',
      winHint: '若要再下一局，请点击“重新开始”',
      aiThinking: '对面正在思考',
      aiWaking: '正在唤醒 AI 对手',
      aiFailLong: '正在唤醒 AI 对手。视浏览器环境可能会短暂停顿。此刻你可以先自行研究棋局。',
      aiRetry: '重新唤醒',
      aiWatch: '只看棋盘',
      perspMine: '轮到你行棋',
      perspAi: '对手正在选择走法',
      perspHuman: (s) => `轮到 ${s} 行棋`,
      levelTitle: '今天想怎么下？',
      modeCpu: '与电脑对弈', modeCpuSub: '与 AI 对手对局',
      modeTutorial: '学习象棋', modeTutorialSub: '棋子走法与取胜之道',
      modeRules: '象棋规则', modeRulesSub: '将军 · 将死 · 取胜条件',
      modeHuman: '与人对弈', modeHumanSub: '敬请期待',
      modeReview: '复盘', modeReviewSub: '敬请期待',
      modeComing: '该模式尚未开放',
      levelPlayCpu: '与电脑对弈',
      lvBeginnerName: '初学者', lvBeginnerSub: '为初次学习象棋的人准备的对手',
      lvFriendName: '熟悉的棋友', lvFriendSub: '轻松对弈一局的对手',
      lvMasterName: '老练的棋客', lvMasterSub: '不轻易露出破绽的对手',
      lvExpertName: '国手', lvExpertSub: '不容许一丝破绽的对手',
      levelNote: '请选择心仪的对手 · 每局结束后可重新选择',
      settingsLangLabel: '语言',
      settingsBtnLabel: '设置',
      settingsBgLabel: '棋盘背景',
      bgSansuHwa: '山水画', bgSimple: '简约', bgWood: '原木', bgSipjangsaeng: '十长生', bgPaper: '韩纸',
      rulesTitle: '象棋规则',
      rulesSubtitle: '开局前值得了解的基本规则',
      rulesExLabel: '示例',
      rulesClose: '关闭',
      aboutTitle: '关于',
      aboutClose: '关闭',
      aboutSections: [
        {
          title: '关于',
          body: '韩国象棋（장기）是韩国传统的策略棋类游戏，常被介绍为韩国象棋（Korean chess）。',
        },
        {
          title: '鸣谢',
          body: '棋子与棋盘图像：为本项目制作\n音效：Pixabay / taure',
          link: { url: 'https://pixabay.com/sound-effects/', label: 'Pixabay' },
        },
      ],
      rulesSections: [
        {
          title: '象棋的目标',
          body: '韩国象棋是两方对弈的韩国传统棋类游戏。将对方的将（楚或汉）逼入将死即可获胜。核心在于守护己方的将，同时攻击对方的将。',
          example: null,
        },
        {
          title: '将军 (Check)',
          body: '当对方的将在下一步可能被吃掉时，称为将军。被将军时，必须解除威胁：将移到安全之处、挡住攻击，或吃掉发动攻击的棋子。',
          example: '车在一条直线上正对对方的将。',
        },
        {
          title: '双将 (Double Check)',
          body: '一步之内有两枚棋子同时将军，称为双将。由于无法一次挡住或吃掉两个威胁，唯一的解法是把将移到安全格。若无处可移，即为将死。',
          example: '原本挡在将前的棋子让开，使它与其身后的棋子同时正对将。',
        },
        {
          title: '将死 (Checkmate)',
          body: '被将军且无论如何都无法解除时，称为将死。若将无法移动、攻击无法阻挡、攻击的棋子也无法吃掉，即为将死，此刻对局结束。',
          example: '将无安全格可逃，也没有棋子能挡住攻击。',
        },
        {
          title: '取胜条件',
          body: '将对方逼入将死即可获胜。此外，对方主动认输时立即取胜。',
          example: null,
        },
        {
          title: '逼将（计分和棋）',
          body: '双方的将在同一纵线上相对，且两者之间没有任何棋子相隔，这种状态称为逼将。若轮到行棋的一方没有任何合法走法可以解除这种相对，本局即以和棋结束。此时胜负由剩余棋子的点数决定：车为13分，炮为7分，马为5分，象与士各3分，兵（卒）为2分，将为0分。后手的汉方为弥补后行的不利，额外获得1.5分。点数较高的一方在逼将和棋中占优。',
          example: '双方的将在同一纵线上相对，轮到行棋的一方既无法离开该纵线，也无法在两者之间放子相隔。',
        },
        {
          title: '重复局面',
          body: '同一布局在同一方行棋时反复出现，称为重复局面。同一局面最多可重复三次，但第四次造成相同局面的一方判负。与逼将不同，重复局面并非和棋，而是分出胜负的结束方式。此规则用于防止一方以连续将军无限拖延对局。',
          example: '一枚棋子来回移动反复将军，在第四次出现相同局面时，该方落败。',
        },
        {
          title: '须知',
          body: '本游戏在将军、将死与认输之外，还采用逼将（计分和棋）与重复局面规则。关于各棋子的走法与布阵等更多内容，最好的学习方式就是亲自对弈。',
          example: null,
        },
      ],
    },
    'zh-Hant': {
      sub: 'JANGGI · 韓國象棋',
      langLabel: '語言 :',
      chooseFaction: '請選擇陣營',
      chuName: '楚', hanName: '漢',
      chuSub: '先手 · 青綠', hanSub: '後手 · 朱紅',
      factionNoteDefault: '所選陣營位於棋盤下方 · 楚方始終先行',
      autoWon: '上一局獲勝 — 本局自動分配為漢方。如需更改，請選擇另一陣營。',
      autoLost: '上一局落敗 — 本局自動分配為楚方。如需更改，請選擇另一陣營。',
      setupTitlePre: ' 的佈陣',   // <b>楚</b> 的佈陣
      autoPick: '自動選擇（隨機）',
      turnLabel: '行棋', mistStart: '對局開始',
      undo: '悔棋', reset: '重新開始', flip: '翻轉棋盤',
      resign: '認輸', resignConfirm: '確定要認輸嗎？',
      resignYes: '是', resignNo: '否',
      resigned: (s) => `${s} 認輸 — 已投子`,
      capByChu: '楚方吃子', capByHan: '漢方吃子',
      capChuEmpty: '楚方吃掉的棋子', capHanEmpty: '漢方吃掉的棋子',
      movelogTitle: '棋 譜', movelogEmpty: '尚無棋步',
      pickPiece: '請選擇棋子',
      pickDest: '請選擇落點', cantMove: '該棋子無合法走法',
      notYourTurn: (s) => `現在輪到 ${s} 行棋`,
      check: (s) => `將軍！請走子保護 ${s} 方的將`,
      checkWord: '將軍',
      myFaction: (you, sR, sB) => `我的陣營：${you} · 楚 ${sR} · 漢 ${sB}`,
      chuFirst: '楚 · 先手', hanSecond: '漢 · 後手',
      win: (s) => `${s} 方獲勝`,
      outcomeWin: '勝', outcomeLose: '負',
      factionWon: (s) => `${s} 方獲勝`,
      youWon: '你獲勝了 · 下一局執漢',
      youLost: '你落敗了 · 下一局執楚',
      outcomeDraw: '和棋', drawLine: '和局',
      drawStalemate: '無子可動 — 本局為和棋',
      outcomeDrawBikjang: '和棋（逼將）',
      drawBikjang: '逼將 — 由點數決定勝負',
      scoreLead: (s, n) => `${s} 領先 ${n} 分`,
      chuShort: '楚', hanShort: '漢',
      byCheckmate: (s) => `將死 — ${s} 方獲勝`,
      byTimeout: (s) => `超時 — ${s} 方獲勝`,
      byRepetition: (s) => `重複局面 — ${s} 方獲勝`,
      repetitionReason: '同一局面出現四次，本局結束',
      undone: '已悔一步',
      winHint: '若要再下一局，請點擊「重新開始」',
      aiThinking: '對面正在思考',
      aiWaking: '正在喚醒 AI 對手',
      aiFailLong: '正在喚醒 AI 對手。視瀏覽器環境可能會短暫停頓。此刻你可以先自行研究棋局。',
      aiRetry: '重新喚醒',
      aiWatch: '只看棋盤',
      perspMine: '輪到你行棋',
      perspAi: '對手正在選擇走法',
      perspHuman: (s) => `輪到 ${s} 行棋`,
      levelTitle: '今天想怎麼下？',
      modeCpu: '與電腦對弈', modeCpuSub: '與 AI 對手對局',
      modeTutorial: '學習象棋', modeTutorialSub: '棋子走法與取勝之道',
      modeRules: '象棋規則', modeRulesSub: '將軍 · 將死 · 取勝條件',
      modeHuman: '與人對弈', modeHumanSub: '敬請期待',
      modeReview: '覆盤', modeReviewSub: '敬請期待',
      modeComing: '該模式尚未開放',
      levelPlayCpu: '與電腦對弈',
      lvBeginnerName: '初學者', lvBeginnerSub: '為初次學習象棋的人準備的對手',
      lvFriendName: '熟悉的棋友', lvFriendSub: '輕鬆對弈一局的對手',
      lvMasterName: '老練的棋客', lvMasterSub: '不輕易露出破綻的對手',
      lvExpertName: '國手', lvExpertSub: '不容許一絲破綻的對手',
      levelNote: '請選擇心儀的對手 · 每局結束後可重新選擇',
      settingsLangLabel: '語言',
      settingsBtnLabel: '設定',
      settingsBgLabel: '棋盤背景',
      bgSansuHwa: '山水畫', bgSimple: '簡約', bgWood: '原木', bgSipjangsaeng: '十長生', bgPaper: '韓紙',
      rulesTitle: '象棋規則',
      rulesSubtitle: '開局前值得了解的基本規則',
      rulesExLabel: '範例',
      rulesClose: '關閉',
      aboutTitle: '關於',
      aboutClose: '關閉',
      aboutSections: [
        {
          title: '關於',
          body: '韓國象棋（장기）是韓國傳統的策略棋類遊戲，常被介紹為韓國象棋（Korean chess）。',
        },
        {
          title: '鳴謝',
          body: '棋子與棋盤圖像：為本專案製作\n音效：Pixabay / taure',
          link: { url: 'https://pixabay.com/sound-effects/', label: 'Pixabay' },
        },
      ],
      rulesSections: [
        {
          title: '象棋的目標',
          body: '韓國象棋是兩方對弈的韓國傳統棋類遊戲。將對方的將（楚或漢）逼入將死即可獲勝。核心在於守護己方的將，同時攻擊對方的將。',
          example: null,
        },
        {
          title: '將軍 (Check)',
          body: '當對方的將在下一步可能被吃掉時，稱為將軍。被將軍時，必須解除威脅：將移到安全之處、擋住攻擊，或吃掉發動攻擊的棋子。',
          example: '車在一條直線上正對對方的將。',
        },
        {
          title: '雙將 (Double Check)',
          body: '一步之內有兩枚棋子同時將軍，稱為雙將。由於無法一次擋住或吃掉兩個威脅，唯一的解法是把將移到安全格。若無處可移，即為將死。',
          example: '原本擋在將前的棋子讓開，使它與其身後的棋子同時正對將。',
        },
        {
          title: '將死 (Checkmate)',
          body: '被將軍且無論如何都無法解除時，稱為將死。若將無法移動、攻擊無法阻擋、攻擊的棋子也無法吃掉，即為將死，此刻對局結束。',
          example: '將無安全格可逃，也沒有棋子能擋住攻擊。',
        },
        {
          title: '取勝條件',
          body: '將對方逼入將死即可獲勝。此外，對方主動認輸時立即取勝。',
          example: null,
        },
        {
          title: '逼將（計分和棋）',
          body: '雙方的將在同一縱線上相對，且兩者之間沒有任何棋子相隔，這種狀態稱為逼將。若輪到行棋的一方沒有任何合法走法可以解除這種相對，本局即以和棋結束。此時勝負由剩餘棋子的點數決定：車為13分，炮為7分，馬為5分，象與士各3分，兵（卒）為2分，將為0分。後手的漢方為彌補後行的不利，額外獲得1.5分。點數較高的一方在逼將和棋中占優。',
          example: '雙方的將在同一縱線上相對，輪到行棋的一方既無法離開該縱線，也無法在兩者之間放子相隔。',
        },
        {
          title: '重複局面',
          body: '同一佈局在同一方行棋時反覆出現，稱為重複局面。同一局面最多可重複三次，但第四次造成相同局面的一方判負。與逼將不同，重複局面並非和棋，而是分出勝負的結束方式。此規則用於防止一方以連續將軍無限拖延對局。',
          example: '一枚棋子來回移動反覆將軍，在第四次出現相同局面時，該方落敗。',
        },
        {
          title: '須知',
          body: '本遊戲在將軍、將死與認輸之外，還採用逼將（計分和棋）與重複局面規則。關於各棋子的走法與佈陣等更多內容，最好的學習方式就是親自對弈。',
          example: null,
        },
      ],
    },
    ja: {
      sub: 'JANGGI · 韓国将棋（チャンギ）',
      langLabel: '言語 :',
      chooseFaction: '陣営を選んでください',
      chuName: '楚（チョ）', hanName: '漢（ハン）',
      chuSub: '先手 · 青緑', hanSub: '後手 · 朱',
      factionNoteDefault: '選んだ陣営が画面の下側に配置されます · 先手は常に楚',
      autoWon: '前局は勝利 — 今回は自動的に漢に割り当てられました。変更するには別の陣営を選んでください。',
      autoLost: '前局は敗北 — 今回は自動的に楚に割り当てられました。変更するには別の陣営を選んでください。',
      setupTitlePre: ' の駒組みを選んでください',   // <b>楚</b> の駒組みを選んでください
      autoPick: '自動選択（ランダム）',
      turnLabel: 'の手番', mistStart: '対局開始',
      undo: '待った', reset: '最初から', flip: '盤を反転',
      resign: '投了', resignConfirm: '本当に投了しますか？',
      resignYes: 'はい', resignNo: 'いいえ',
      resigned: (s) => `${s} 投了 — 負けを認めました`,
      capByChu: '楚が取った', capByHan: '漢が取った',
      capChuEmpty: '楚が取った駒', capHanEmpty: '漢が取った駒',
      movelogTitle: '棋 譜', movelogEmpty: 'まだ手がありません',
      pickPiece: '駒を選んでください',
      pickDest: '移動先を選んでください', cantMove: 'この駒は動かせません',
      notYourTurn: (s) => `今は ${s} の手番です`,
      check: (s) => `王手！${s} の王を守る手を指してください`,
      checkWord: '王手',
      myFaction: (you, sR, sB) => `自分の陣営：${you} · 楚 ${sR} · 漢 ${sB}`,
      chuFirst: '楚 · 先手', hanSecond: '漢 · 後手',
      win: (s) => `${s} の勝ち`,
      outcomeWin: '勝ち', outcomeLose: '負け',
      factionWon: (s) => `${s} の勝ち`,
      youWon: '勝ちました · 次局は漢を持ちます',
      youLost: '負けました · 次局は楚を持ちます',
      outcomeDraw: '引き分け', drawLine: '引き分け',
      drawStalemate: '指す手がなく引き分けです',
      outcomeDrawBikjang: '引き分け（ビッカン）',
      drawBikjang: 'ビッカン — 点数で決します',
      scoreLead: (s, n) => `${s} が ${n} 点リード`,
      chuShort: '楚', hanShort: '漢',
      byCheckmate: (s) => `詰み — ${s} の勝ち`,
      byTimeout: (s) => `時間切れ — ${s} の勝ち`,
      byRepetition: (s) => `局面反復 — ${s} の勝ち`,
      repetitionReason: '同じ局面が四回繰り返され、対局が終了しました',
      undone: '一手戻しました',
      winHint: 'もう一度指すには「最初から」を押してください',
      aiThinking: '相手が少し考えています',
      aiWaking: 'AI 対戦相手を起動しています',
      aiFailLong: 'AI 対戦相手を起動しています。ブラウザ環境によっては少し止まることがあります。今は一人で盤を眺めることができます。',
      aiRetry: 'もう一度起動',
      aiWatch: '盤だけ見る',
      perspMine: 'あなたの手番です',
      perspAi: '相手が手を選んでいます',
      perspHuman: (s) => `${s} の手番です`,
      levelTitle: '今日はどう指しますか？',
      modeCpu: 'コンピュータと対局', modeCpuSub: 'AI 相手と対局',
      modeTutorial: '将棋を学ぶ', modeTutorialSub: '駒の動かし方と勝ち方',
      modeRules: 'ルール', modeRulesSub: '王手 · 詰み · 勝利条件',
      modeHuman: '人と対局', modeHumanSub: '準備中です',
      modeReview: '振り返り', modeReviewSub: '準備中です',
      modeComing: 'このモードはまだ利用できません',
      levelPlayCpu: 'コンピュータと対局',
      lvBeginnerName: '初心者', lvBeginnerSub: '初めて学ぶ方のための相手',
      lvFriendName: '気軽な相手', lvFriendSub: '気軽に一局楽しめる相手',
      lvMasterName: '熟練の打ち手', lvMasterSub: 'なかなか隙を見せない相手',
      lvExpertName: '名人', lvExpertSub: '一切の隙を許さない相手',
      levelNote: 'お好みの相手を選んでください · 一局終わるごとに選び直せます',
      settingsLangLabel: '言語',
      settingsBtnLabel: '設定',
      settingsBgLabel: '盤の背景',
      bgSansuHwa: '山水画', bgSimple: 'シンプル', bgWood: '木目', bgSipjangsaeng: '十長生', bgPaper: '韓紙',
      rulesTitle: 'チャンギのルール',
      rulesSubtitle: '対局を始める前に知っておきたい基本ルール',
      rulesExLabel: '例',
      rulesClose: '閉じる',
      aboutTitle: 'このゲームについて',
      aboutClose: '閉じる',
      aboutSections: [
        {
          title: 'このゲームについて',
          body: 'チャンギ（장기）は韓国の伝統的な戦略ボードゲームで、しばしば「韓国将棋（Korean chess）」として紹介されます。',
        },
        {
          title: 'クレジット',
          body: '駒と盤の画像：本プロジェクトのために制作\n効果音：Pixabay / taure',
          link: { url: 'https://pixabay.com/sound-effects/', label: 'Pixabay' },
        },
      ],
      rulesSections: [
        {
          title: 'チャンギの目的',
          body: 'チャンギは二つの陣営が対戦する韓国の伝統的なボードゲームです。相手の王（楚または漢）を詰みに追い込めば勝ちです。自分の王を守りながら相手の王を攻めるのが核心です。',
          example: null,
        },
        {
          title: '王手（Check）',
          body: '相手の王を次の手で取れる状態を王手といいます。王手をかけられたら、必ず脅威から逃れなければなりません：王を安全な場所へ動かす、攻撃を遮る、または攻めている駒を取る、のいずれかです。',
          example: '車（チャ）が相手の王を一直線に狙っている場合。',
        },
        {
          title: '両王手（Double Check）',
          body: '一手で二つの駒が同時に王を狙う状態を両王手といいます。二つの脅威を一度に遮ったり取ったりはできないため、唯一の逃れ方は王を安全な升へ動かすことです。動かす先もなければ詰みです。',
          example: '王の前を遮っていた駒がどき、その駒と背後の駒が同時に王を狙う場合。',
        },
        {
          title: '詰み（Checkmate）',
          body: '王手をかけられ、どうやっても逃れられない状態を詰みといいます。王を動かすことも、攻撃を遮ることも、攻めている駒を取ることもできなければ詰みであり、この瞬間に対局が終わります。',
          example: '王の逃げ場がすべて塞がれ、攻撃を遮る駒もない場合。',
        },
        {
          title: '勝利条件',
          body: '相手を詰みに追い込めば勝ちです。また、相手が自ら投了した場合もその時点で勝ちとなります。',
          example: null,
        },
        {
          title: 'ビッカン（点数で決める引き分け）',
          body: '両陣営の王が同じ縦の列で向かい合い、その間を遮る駒が一つもない状態をビッカン（Bikjang）といいます。手番の側がこの向かい合いを解く合法手を一つも持たないとき、対局は引き分けとなります。このとき勝敗は残った駒の点数で決めます。車は13点、包は7点、馬は5点、象と士は各3点、兵（卒）は2点、王は0点です。後手の漢は後に指す不利を補うため、1.5点が加算されます。点数の高い側がビッカンの引き分けで優位となります。',
          example: '両王が同じ列で向かい合い、手番の側がその列から離れることも、間を遮ることもできない場合。',
        },
        {
          title: '局面反復',
          body: '同じ配置が同じ手番で繰り返し現れることを局面反復といいます。同じ局面は三回まで許されますが、四回目に同じ局面を作った側が反則負けとなります。ビッカンと違い、局面反復は引き分けではなく勝敗の決まる終局です。一方が王手を繰り返して対局を無限に引き延ばすのを防ぐためのルールです。',
          example: '一つの駒が同じ場所を行き来して王手を繰り返す場合、四回目の同一局面でその側が負けとなります。',
        },
        {
          title: '覚えておくこと',
          body: 'このゲームは王手・詰み・投了に加えて、ビッカン（点数で決める引き分け）と局面反復にも対応しています。駒の動かし方や駒組みなど、さらに詳しい内容は、実際に指しながら覚えるのが一番です。',
          example: null,
        },
      ],
    },
    de: {
      sub: 'JANGGI · Koreanisches Schach',
      langLabel: 'Sprache :',
      chooseFaction: 'Wähle deine Seite',
      chuName: 'Cho (楚)', hanName: 'Han (漢)',
      chuSub: 'Anziehend · Türkis', hanSub: 'Nachziehend · Rot',
      factionNoteDefault: 'Deine Seite steht unten · Cho (楚) zieht immer zuerst',
      autoWon: 'Letzte Partie gewonnen — diesmal Han (漢) zugewiesen. Wähle die andere Seite, um zu wechseln.',
      autoLost: 'Letzte Partie verloren — diesmal Cho (楚) zugewiesen. Wähle die andere Seite, um zu wechseln.',
      setupTitlePre: ' — wähle die Aufstellung',   // <b>Cho (楚)</b> — wähle die Aufstellung
      autoPick: 'Automatisch (zufällig)',
      turnLabel: 'am Zug', mistStart: 'Spielbeginn',
      undo: 'Zurücknehmen', reset: 'Neue Partie', flip: 'Brett drehen',
      resign: 'Aufgeben', resignConfirm: 'Diese Partie aufgeben?',
      resignYes: 'Ja', resignNo: 'Nein',
      resigned: (s) => `${s} hat aufgegeben`,
      capByChu: 'Cho hat geschlagen', capByHan: 'Han hat geschlagen',
      capChuEmpty: 'Von Cho geschlagen', capHanEmpty: 'Von Han geschlagen',
      movelogTitle: 'Züge', movelogEmpty: 'Noch keine Züge',
      pickPiece: 'Wähle eine Figur',
      pickDest: 'Wähle ein Zielfeld', cantMove: 'Diese Figur hat keine gültigen Züge',
      notYourTurn: (s) => `${s} ist am Zug`,
      check: (s) => `Schach! Rette den General von ${s}`,
      checkWord: 'Schach',
      myFaction: (you, sR, sB) => `Du: ${you} · Cho ${sR} · Han ${sB}`,
      chuFirst: 'Cho (楚) · Anziehend', hanSecond: 'Han (漢) · Nachziehend',
      win: (s) => `${s} gewinnt`,
      outcomeWin: 'Sieg', outcomeLose: 'Niederlage',
      factionWon: (s) => `${s} gewinnt`,
      youWon: 'Du hast gewonnen · nächste Partie spielst du Han (漢)',
      youLost: 'Du hast verloren · nächste Partie spielst du Cho (楚)',
      outcomeDraw: 'Remis', drawLine: 'Patt',
      drawStalemate: 'Keine gültigen Züge — die Partie endet remis',
      outcomeDrawBikjang: 'Remis (Bikjang)',
      drawBikjang: 'Bikjang — Entscheidung nach Punkten',
      scoreLead: (s, n) => `${s} führt mit ${n} Punkten`,
      chuShort: 'Cho', hanShort: 'Han',
      byCheckmate: (s) => `Schachmatt — ${s} gewinnt`,
      byTimeout: (s) => `Zeitüberschreitung — ${s} gewinnt`,
      byRepetition: (s) => `Stellungswiederholung — ${s} gewinnt`,
      repetitionReason: 'Dieselbe Stellung trat viermal auf, die Partie endet',
      undone: 'Zug zurückgenommen',
      winHint: 'Drücke „Neue Partie“, um erneut zu spielen',
      aiThinking: 'Dein Gegner überlegt',
      aiWaking: 'KI-Gegner wird gestartet',
      aiFailLong: 'KI-Gegner wird gestartet. Je nach Browser kann es kurz stocken. Bis dahin kannst du das Brett allein studieren.',
      aiRetry: 'Erneut starten',
      aiWatch: 'Nur das Brett ansehen',
      perspMine: 'Du bist am Zug',
      perspAi: 'Dein Gegner wählt einen Zug',
      perspHuman: (s) => `${s} ist am Zug`,
      levelTitle: 'Wie möchtest du heute spielen?',
      modeCpu: 'Gegen den Computer', modeCpuSub: 'Gegen die KI spielen',
      modeTutorial: 'Janggi lernen', modeTutorialSub: 'Wie Figuren ziehen und wie man gewinnt',
      modeRules: 'Regeln', modeRulesSub: 'Schach, Schachmatt, Siegbedingungen',
      modeHuman: 'Gegen einen Freund', modeHumanSub: 'Demnächst verfügbar',
      modeReview: 'Partie analysieren', modeReviewSub: 'Demnächst verfügbar',
      modeComing: 'Dieser Modus ist noch nicht verfügbar',
      levelPlayCpu: 'Gegen den Computer',
      lvBeginnerName: 'Anfänger', lvBeginnerSub: 'Für alle, die Janggi zum ersten Mal lernen',
      lvFriendName: 'Vertrauter Gegner', lvFriendSub: 'Ein entspannter Gegner für eine lockere Partie',
      lvMasterName: 'Erfahrener Spieler', lvMasterSub: 'Lässt selten eine Lücke',
      lvExpertName: 'Meister', lvExpertSub: 'Lässt nicht die kleinste Lücke zu',
      levelNote: 'Wähle deinen Gegner · nach jeder Partie kannst du neu wählen',
      settingsLangLabel: 'Sprache',
      settingsBtnLabel: 'Einstellungen',
      settingsBgLabel: 'Bretthintergrund',
      bgSansuHwa: 'Tuschmalerei', bgSimple: 'Schlicht', bgWood: 'Holz', bgSipjangsaeng: 'Sipjangsaeng', bgPaper: 'Hanji',
      rulesTitle: 'Janggi-Regeln',
      rulesSubtitle: 'Die Grundlagen, die du vor deiner ersten Partie kennen solltest',
      rulesExLabel: 'Beispiel',
      rulesClose: 'Schließen',
      aboutTitle: 'Über',
      aboutClose: 'Schließen',
      aboutSections: [
        {
          title: 'Über',
          body: 'Janggi ist ein traditionelles koreanisches Strategie-Brettspiel, oft als koreanisches Schach (Korean chess) bezeichnet.',
        },
        {
          title: 'Mitwirkende',
          body: 'Figuren- und Brettgrafik: für dieses Projekt erstellt\nSoundeffekte: Pixabay / taure',
          link: { url: 'https://pixabay.com/sound-effects/', label: 'Pixabay' },
        },
      ],
      rulesSections: [
        {
          title: 'Das Ziel',
          body: 'Janggi ist ein traditionelles koreanisches Brettspiel für zwei Seiten. Du gewinnst, indem du den General des Gegners (楚 oder 漢) schachmatt setzt. Der Kern besteht darin, den eigenen General zu schützen und zugleich den gegnerischen anzugreifen.',
          example: null,
        },
        {
          title: 'Schach (Check)',
          body: 'Wenn der General des Gegners im nächsten Zug geschlagen werden könnte, steht er im Schach. Ein General im Schach muss der Bedrohung entkommen: auf ein sicheres Feld ziehen, den Angriff blockieren oder die angreifende Figur schlagen.',
          example: 'Ein Wagen steht in direkter Linie dem gegnerischen General gegenüber.',
        },
        {
          title: 'Doppelschach (Double Check)',
          body: 'Wenn ein einziger Zug zwei Figuren zugleich den General angreifen lässt, ist es ein Doppelschach. Da man nicht beide Bedrohungen auf einmal blockieren oder schlagen kann, bleibt nur, den General auf ein sicheres Feld zu ziehen. Hat er kein Feld mehr, ist es Schachmatt.',
          example: 'Eine Figur, die den General deckte, zieht beiseite, sodass sie und die Figur dahinter den General gleichzeitig angreifen.',
        },
        {
          title: 'Schachmatt (Checkmate)',
          body: 'Wenn ein General im Schach steht und auf keine Weise entkommen kann, ist es Schachmatt. Kann der General nicht ziehen, der Angriff nicht blockiert und die angreifende Figur nicht geschlagen werden, ist es Schachmatt und die Partie endet.',
          example: 'Der General hat kein sicheres Feld zur Flucht, und keine Figur kann den Angriff blockieren.',
        },
        {
          title: 'Wie man gewinnt',
          body: 'Setze den Gegner schachmatt, um zu gewinnen. Du gewinnst auch sofort, wenn der Gegner aufgibt.',
          example: null,
        },
        {
          title: 'Bikjang (Remis nach Punkten)',
          body: 'Bikjang liegt vor, wenn beide Generäle einander auf derselben Linie gegenüberstehen und kein Stein zwischen ihnen steht. Hat die Seite am Zug keinen legalen Weg, dieses Gegenüber aufzulösen, endet die Partie remis. Über den Ausgang entscheiden dann die Punkte der verbliebenen Steine: der Wagen zählt 13, die Kanone 7, das Pferd 5, Elefant und Wächter je 3, der Soldat 2 und der General 0. Han (漢), das als Zweiter zieht, erhält 1.5 Punkte zusätzlich als Ausgleich für den späteren Zug. Die Seite mit mehr Punkten geht aus dem Bikjang-Remis als überlegen hervor.',
          example: 'Beide Generäle stehen einander auf derselben Linie gegenüber, und die Seite am Zug kann weder die Linie verlassen noch den Raum dazwischen versperren.',
        },
        {
          title: 'Stellungswiederholung',
          body: 'Von Stellungswiederholung spricht man, wenn dieselbe Stellung bei gleicher Zugseite erneut auftritt. Eine Stellung darf bis zu dreimal wiederholt werden; wer sie zum vierten Mal herstellt, verliert durch Regelverstoß. Anders als beim Bikjang endet die Partie hier mit Sieger und Verlierer statt remis. Die Regel verhindert, dass eine Seite die Partie durch Dauerschach endlos hinauszögert.',
          example: 'Ein Stein pendelt hin und her und gibt immer wieder Schach; bei der vierten gleichen Stellung verliert diese Seite.',
        },
        {
          title: 'Gut zu wissen',
          body: 'Neben Schach, Schachmatt und Aufgabe wendet dieses Spiel auch Bikjang (ein Remis nach Punkten) und die Stellungswiederholung an. Wie die Steine ziehen und wie die Eröffnungsaufstellungen aussehen, lernt man am besten beim Spielen selbst.',
          example: null,
        },
      ],
    },
    fr: {
      sub: 'JANGGI · Échecs coréens',
      langLabel: 'Langue :',
      chooseFaction: 'Choisissez votre camp',
      chuName: 'Cho (楚)', hanName: 'Han (漢)',
      chuSub: 'Premier · Turquoise', hanSub: 'Second · Rouge',
      factionNoteDefault: 'Votre camp se place en bas · Cho (楚) joue toujours en premier',
      autoWon: 'Partie précédente gagnée — Han (漢) attribué cette fois. Choisissez l’autre camp pour changer.',
      autoLost: 'Partie précédente perdue — Cho (楚) attribué cette fois. Choisissez l’autre camp pour changer.',
      setupTitlePre: ' — choisissez la formation',   // <b>Cho (楚)</b> — choisissez la formation
      autoPick: 'Automatique (aléatoire)',
      turnLabel: 'au trait', mistStart: 'Début de partie',
      undo: 'Annuler', reset: 'Nouvelle partie', flip: 'Retourner le plateau',
      resign: 'Abandonner', resignConfirm: 'Abandonner cette partie ?',
      resignYes: 'Oui', resignNo: 'Non',
      resigned: (s) => `${s} a abandonné`,
      capByChu: 'Cho a capturé', capByHan: 'Han a capturé',
      capChuEmpty: 'Capturé par Cho', capHanEmpty: 'Capturé par Han',
      movelogTitle: 'Coups', movelogEmpty: 'Aucun coup pour l’instant',
      pickPiece: 'Choisissez une pièce',
      pickDest: 'Choisissez une destination', cantMove: 'Cette pièce n’a aucun coup légal',
      notYourTurn: (s) => `C’est au tour de ${s}`,
      check: (s) => `Échec ! Sauvez le général de ${s}`,
      checkWord: 'Échec',
      myFaction: (you, sR, sB) => `Vous : ${you} · Cho ${sR} · Han ${sB}`,
      chuFirst: 'Cho (楚) · Premier', hanSecond: 'Han (漢) · Second',
      win: (s) => `${s} gagne`,
      outcomeWin: 'Victoire', outcomeLose: 'Défaite',
      factionWon: (s) => `${s} gagne`,
      youWon: 'Vous avez gagné · prochaine partie avec Han (漢)',
      youLost: 'Vous avez perdu · prochaine partie avec Cho (楚)',
      outcomeDraw: 'Nulle', drawLine: 'Pat',
      drawStalemate: 'Aucun coup légal — la partie est nulle',
      outcomeDrawBikjang: 'Nulle (Bikjang)',
      drawBikjang: 'Bikjang — départagé aux points',
      scoreLead: (s, n) => `${s} mène de ${n} points`,
      chuShort: 'Cho', hanShort: 'Han',
      byCheckmate: (s) => `Échec et mat — ${s} gagne`,
      byTimeout: (s) => `Temps écoulé — ${s} gagne`,
      byRepetition: (s) => `Répétition — ${s} gagne`,
      repetitionReason: 'La même position est survenue quatre fois, la partie est terminée',
      undone: 'Coup annulé',
      winHint: 'Appuyez sur « Nouvelle partie » pour rejouer',
      aiThinking: 'Votre adversaire réfléchit',
      aiWaking: 'Réveil de l’adversaire IA',
      aiFailLong: 'Réveil de l’adversaire IA. Selon le navigateur, cela peut se figer un instant. En attendant, vous pouvez étudier le plateau seul.',
      aiRetry: 'Réveiller à nouveau',
      aiWatch: 'Voir seulement le plateau',
      perspMine: 'À vous de jouer',
      perspAi: 'Votre adversaire choisit un coup',
      perspHuman: (s) => `À ${s} de jouer`,
      levelTitle: 'Comment voulez-vous jouer aujourd’hui ?',
      modeCpu: 'Jouer contre l’ordinateur', modeCpuSub: 'Jouer contre l’IA',
      modeTutorial: 'Apprendre le Janggi', modeTutorialSub: 'Déplacement des pièces et comment gagner',
      modeRules: 'Règles', modeRulesSub: 'Échec, échec et mat, conditions de victoire',
      modeHuman: 'Jouer avec un ami', modeHumanSub: 'Bientôt disponible',
      modeReview: 'Analyser une partie', modeReviewSub: 'Bientôt disponible',
      modeComing: 'Ce mode n’est pas encore disponible',
      levelPlayCpu: 'Jouer contre l’ordinateur',
      lvBeginnerName: 'Débutant', lvBeginnerSub: 'Pour qui apprend le Janggi pour la première fois',
      lvFriendName: 'Adversaire familier', lvFriendSub: 'Un adversaire détendu pour une partie tranquille',
      lvMasterName: 'Joueur aguerri', lvMasterSub: 'Laisse rarement une ouverture',
      lvExpertName: 'Maître', lvExpertSub: 'Ne laisse pas la moindre ouverture',
      levelNote: 'Choisissez votre adversaire · vous pouvez rechoisir après chaque partie',
      settingsLangLabel: 'Langue',
      settingsBtnLabel: 'Paramètres',
      settingsBgLabel: 'Fond du plateau',
      bgSansuHwa: 'Lavis', bgSimple: 'Épuré', bgWood: 'Bois', bgSipjangsaeng: 'Sipjangsaeng', bgPaper: 'Hanji',
      rulesTitle: 'Règles du Janggi',
      rulesSubtitle: 'Les bases à connaître avant votre première partie',
      rulesExLabel: 'Exemple',
      rulesClose: 'Fermer',
      aboutTitle: 'À propos',
      aboutClose: 'Fermer',
      aboutSections: [
        {
          title: 'À propos',
          body: 'Le Janggi est un jeu de plateau stratégique traditionnel coréen, souvent présenté comme les échecs coréens (Korean chess).',
        },
        {
          title: 'Crédits',
          body: 'Images des pièces et du plateau : créées pour ce projet\nEffets sonores : Pixabay / taure',
          link: { url: 'https://pixabay.com/sound-effects/', label: 'Pixabay' },
        },
      ],
      rulesSections: [
        {
          title: 'Le but',
          body: 'Le Janggi est un jeu de plateau traditionnel coréen opposant deux camps. Vous gagnez en mettant le général adverse (楚 ou 漢) échec et mat. L’essentiel est de protéger votre propre général tout en attaquant celui de l’adversaire.',
          example: null,
        },
        {
          title: 'Échec (Check)',
          body: 'Lorsque le général adverse pourrait être capturé au coup suivant, il est en échec. Un général en échec doit échapper à la menace : se déplacer vers une case sûre, bloquer l’attaque, ou capturer la pièce attaquante.',
          example: 'Un chariot aligné directement face au général adverse.',
        },
        {
          title: 'Double échec (Double Check)',
          body: 'Lorsqu’un seul coup met deux pièces à attaquer le général en même temps, c’est un double échec. Comme on ne peut ni bloquer ni capturer les deux menaces d’un coup, la seule issue est de déplacer le général vers une case sûre. S’il n’a nulle part où aller, c’est échec et mat.',
          example: 'Une pièce qui protégeait le général s’écarte, de sorte qu’elle et la pièce derrière elle attaquent le général en même temps.',
        },
        {
          title: 'Échec et mat (Checkmate)',
          body: 'Lorsqu’un général est en échec et ne peut s’en échapper par aucun moyen, c’est échec et mat. Si le général ne peut pas bouger, si l’attaque ne peut être bloquée et si la pièce attaquante ne peut être capturée, c’est échec et mat et la partie se termine.',
          example: 'Le général n’a aucune case sûre pour fuir, et aucune pièce ne peut bloquer l’attaque.',
        },
        {
          title: 'Comment gagner',
          body: 'Mettez l’adversaire échec et mat pour gagner. Vous gagnez aussi immédiatement si l’adversaire abandonne.',
          example: null,
        },
        {
          title: 'Bikjang (nulle aux points)',
          body: 'Le Bikjang se produit lorsque les deux Généraux se font face sur la même colonne sans aucune pièce entre eux. Si le camp au trait n’a aucun coup légal pour rompre ce face-à-face, la partie se termine par une nulle. L’issue est alors décidée aux points des pièces restantes : le Char vaut 13, le Canon 7, le Cheval 5, l’Éléphant et le Garde 3 chacun, le Soldat 2 et le Général 0. Han (漢), qui joue en second, reçoit 1.5 point de plus pour compenser le désavantage de jouer après. Le camp ayant le plus de points l’emporte dans la nulle par Bikjang.',
          example: 'Les deux Généraux se font face sur la même colonne, et le camp au trait ne peut ni quitter cette colonne ni bloquer l’espace qui les sépare.',
        },
        {
          title: 'Répétition',
          body: 'On parle de répétition lorsque la même disposition revient avec le même camp au trait. Une position peut être répétée jusqu’à trois fois, mais le camp qui crée la même position pour la quatrième fois perd par forfait. Contrairement au Bikjang, la répétition met fin à la partie avec un vainqueur et un perdant plutôt qu’une nulle. Cette règle empêche un joueur de prolonger la partie indéfiniment par échec perpétuel.',
          example: 'Une pièce fait des allers-retours en donnant échec encore et encore ; à la quatrième position identique, ce camp perd.',
        },
        {
          title: 'Bon à savoir',
          body: 'Outre l’échec, l’échec et mat et l’abandon, ce jeu applique aussi le Bikjang (une nulle aux points) et la répétition. Pour le déplacement des pièces et les dispositions d’ouverture, le mieux est encore d’apprendre en jouant.',
          example: null,
        },
      ],
    },
  };
  function t(key, ...args) {
    // 1순위: 현재 언어 → 2순위: 영어 폴백 → 3순위: 키 그대로(최후의 보루, 화면 안 깨짐)
    let v = (I18N[lang] && I18N[lang][key]);
    if (v == null && lang !== 'en') {
      // 현재 언어에 키가 없음 → 영어로 폴백. 개발 중에는 어떤 키가 빠졌는지 알린다.
      if (DEBUG_I18N) console.warn(`[i18n] Missing "${key}" for "${lang}" → en fallback`);
      v = (I18N.en && I18N.en[key]);
    }
    if (v == null) {
      // 영어에도 없음 → 키를 그대로 노출(눈에 띄게 해서 빠진 곳을 잡게 함).
      if (DEBUG_I18N) console.warn(`[i18n] Missing "${key}" in all langs → key shown`);
      return key;
    }
    if (typeof v === 'function') return v(...args);
    return v;
  }
  // 진영 표기 (언어별). 자리(r/b) → 표기. 기물 한자와 무관한 UI 라벨.
  function factionLabel(side) { return side === 'r' ? t('chuName') : t('hanName'); }
  // 상차림 음역 (영어 모드용). 한국어는 원래 이름 그대로.
  const SETUP_ROMAN = {
    '마상마상': 'Ma Sang-Ma Sang', '상마상마': 'Sang Ma-Sang Ma',
    '마상상마': 'Ma Sang-Sang Ma', '상마마상': 'Sang Ma-Ma Sang',
  };
  // 중국어 상차림 표기 — 馬·象 배치를 한자로 직관화 (보드 위 기물 한자와 통일).
  const SETUP_ZH_HANS = {
    '마상마상': '马象马象', '상마상마': '象马象马',
    '마상상마': '马象象马', '상마마상': '象马马象',
  };
  const SETUP_ZH_HANT = {
    '마상마상': '馬象馬象', '상마상마': '象馬象馬',
    '마상상마': '馬象象馬', '상마마상': '象馬馬象',
  };
  // 일본어 상차림 — 한자 표기(馬·象). 일본어권은 한자를 읽으므로 음역보다 직관적.
  const SETUP_JA = {
    '마상마상': '馬象馬象', '상마상마': '象馬象馬',
    '마상상마': '馬象象馬', '상마마상': '象馬馬象',
  };
  function setupLabel(name) {
    if (lang === 'en') return SETUP_ROMAN[name] || name;
    if (lang === 'zh-Hans') return SETUP_ZH_HANS[name] || name;
    if (lang === 'zh-Hant') return SETUP_ZH_HANT[name] || name;
    if (lang === 'ja') return SETUP_JA[name] || name;
    // 독일어·프랑스어는 한자가 낯서므로 영어와 동일한 로마자 음역을 사용.
    if (lang === 'de' || lang === 'fr') return SETUP_ROMAN[name] || name;
    return name;
  }

  let board, turn, selected, legalForSel, history, flipped, gameOver;
  // ★ [6-3b] 반복수(만년장) 판정용 국면 카운트 맵. key=positionKey(차례 포함) → 출현 횟수.
  //   엔진은 무상태(engine.js) — map은 호출자인 여기서 보유한다(recordPosition 설계).
  //   undo 대비로 history 각 항목에 스냅샷(new Map 복사)을 같이 저장 → 무르면 그 스냅샷으로 복원.
  //   beginGame/reset에서 새 Map 생성 + 초기 국면 1회 기록.
  //   판정: doMove에서 수 둔 뒤 recordPosition 반환이 4면 "방금 둔 쪽" 실격패(연맹 규정: 4회 반복 실격).
  let repMap = new Map();
  // ★ 튜토리얼 전용: 상(象) 선택 시 멱이 막혀 못 가는 칸 정보. [{r,c}] 형태.
  //   대국 화면은 깨끗하게 두기 위해 튜토리얼 + 상에서만 채운다. 그 외엔 항상 [].
  let blockedForSel = [];

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
        { side: 'r', type: 'C', r: 6, c: 4 },   // 포(주인공)
        // 위쪽 정면: 바로 앞이 적 포 → 포는 포를 받침으로 못 씀. 그 너머 적 병도 못 잡음.
        //   (주인공이 가려는 방향 정면에서 막히므로 "포는 포를 못 넘는다"가 눈에 들어옴)
        { side: 'b', type: 'C', r: 4, c: 4 },    // 정면 적 포(받침 불가)
        { side: 'b', type: 'P', r: 2, c: 4 },    // 그 너머 적 병(그래서 못 잡음)
        // 오른쪽: 받침(아군 졸) 넘어 적 병 잡기 — 미션 경로
        { side: 'r', type: 'P', r: 6, c: 6 },    // 받침
        { side: 'b', type: 'P', r: 6, c: 8 },    // 받침 너머 적 병
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
    { id: 'king',     type: 'K', nameKey: 'tutKingName',     subKey: 'tutKingSub',    active: true  },
    { id: 'soldier',  type: 'P', nameKey: 'tutSoldierName',  subKey: 'tutSoldierSub', active: true  },
  ];

  // i18n 튜토리얼 키
  const TUTORIAL_I18N = {
    ko: {
      tutPieceTitle: '기물을 골라 행마법을 배워보세요',
      tutRookName: '차(車)', tutHorseName: '마(馬)', tutElephantName: '상(象)',
      tutCannonName: '포(包)', tutGuardName: '사(士)', tutSoldierName: '졸(卒)', tutKingName: '장(將)',
      // 기물 선택 카드 보조 라벨: 진영마다 글자가 다른 기물(장·졸)만. 같은 역할, 다른 글자.
      tutKingSub: '楚 · 漢', tutSoldierSub: '兵',
      // 설명
      tutRookDesc: '차는 직선으로 얼마든지 이동할 수 있습니다. 아군 기물은 지나갈 수 없고, 적 기물은 잡으며 멈춥니다.',
      tutHorseDesc: '마는 직선 한 칸 + 대각선 한 칸으로 이동합니다. 직선으로 내딛는 첫 칸이 멱(다리)인데, 그 자리에 다른 기물이 있으면 그 방향으로는 갈 수 없습니다. 막힌 멱은 붉게 표시됩니다.',
      tutElephantDesc: '상은 직선 한 칸 + 대각선 두 칸으로 이동합니다. 가는 길에는 멱(다리)이 둘 있는데, 직선 한 칸과 그다음 대각선 한 칸입니다. 둘 중 하나라도 다른 기물에 막히면 그 방향으로는 갈 수 없습니다. 막힌 멱은 붉게 표시됩니다.',
      tutCannonDesc: '포는 반드시 다른 기물 하나를 넘어서 이동하거나 잡습니다. 이때 넘는 기물을 받침이라고 합니다. 받침이 없으면 움직일 수 없습니다. 단, 다른 포는 받침으로 쓸 수 없고 잡을 수도 없습니다.',
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
      tutRookName: 'Chariot', tutHorseName: 'Horse', tutElephantName: 'Elephant',
      tutCannonName: 'Cannon', tutGuardName: 'Guard', tutSoldierName: 'Soldier', tutKingName: 'General',
      tutKingSub: 'Chu · Han', tutSoldierSub: 'Bing',
      tutRookDesc: 'The Chariot moves any number of squares in a straight line. It cannot pass through friendly pieces, and captures by landing on an enemy piece.',
      tutHorseDesc: 'The Horse moves one step straight then one step diagonally. The first straight step is its blocking point; if a piece sits there, the Horse cannot move that way. Blocked points are marked in red.',
      tutElephantDesc: 'The Elephant moves one step straight then two steps diagonally. Its path has two blocking points: the straight step and the first diagonal step. If a piece sits on either one, the Elephant cannot move that way. Blocked points are marked in red.',
      tutCannonDesc: 'The Cannon must jump over exactly one other piece to move or capture. That piece is called the screen. Without a screen, it cannot move. Note: another Cannon cannot serve as a screen and cannot be captured.',
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
    'zh-Hans': {
      tutPieceTitle: '选择一枚棋子，学习它的走法',
      tutRookName: '车', tutHorseName: '马', tutElephantName: '象',
      tutCannonName: '炮', tutGuardName: '士', tutSoldierName: '卒', tutKingName: '将',
      tutKingSub: '楚 · 汉', tutSoldierSub: '兵',
      tutRookDesc: '车沿直线可走任意格数。不能越过己方棋子，吃子时停在敌方棋子所在格。',
      tutHorseDesc: '马走直一步、再斜一步。直行的第一格是它的“蹩腿点”，若该格有棋子，则该方向不能走。被蹩住的点以红色标示。',
      tutElephantDesc: '象走直一步、再斜两步。途中有两个蹩腿点：直行一格与随后的斜行一格。其中任意一个被棋子挡住，该方向便不能走。被蹩住的点以红色标示。',
      tutCannonDesc: '炮必须正好越过另一枚棋子才能移动或吃子，被越过的棋子称为“炮架”。没有炮架便不能走。注意：另一枚炮不能充当炮架，也不能被吃。',
      tutGuardDesc: '士只能在九宫内移动——直行一格，或沿标示的斜线斜行一格。',
      tutKingDesc: '将与士相同，只能在九宫内移动。将被吃掉即落败。',
      tutSoldierDesc: '卒／兵可向前一格或向旁一格移动，不能后退。',
      tutRookAction: '点击车，看看它能走到哪里。',
      tutHorseAction: '点击马，确认它的走法。',
      tutElephantAction: '点击象，确认它的走法。',
      tutCannonAction: '点击炮，只有有炮架的方向才能走。',
      tutGuardAction: '点击士，它只能在九宫内移动。',
      tutKingAction: '点击将，它只能在九宫内移动。',
      tutSoldierAction: '点击卒，它只能向前或向旁移动。',
      tutRookMission: '在3步内吃掉一枚敌方兵。',
      tutHorseMission: '在3步内吃掉一枚敌方兵。',
      tutElephantMission: '在3步内吃掉一枚敌方兵。',
      tutCannonMission: '越过炮架，在3步内吃掉敌方兵。',
      tutGuardMission: '在4步内吃掉敌方兵。',
      tutKingMission: '在4步内吃掉敌方兵。',
      tutSoldierMission: '在3步内吃掉敌方兵。',
      tutPracticeStart: '开始任务',
      tutIntroStart: '试着走一走',
      tutMovesLeft: (n) => `剩余步数：${n}`,
      tutSuccess: '成功！',
      tutSuccessMsg: (n) => `你在 ${n} 步内吃掉了敌方棋子。`,
      tutFail: '差一点。',
      tutFailMsg: '未能吃掉敌方棋子。',
      tutRetry: '再试一次',
      tutBackToPractice: '回到自由练习',
      tutNextPiece: '学习其他棋子',
      tutReset: '再试一次',
      tutExit: '返回菜单',
      tutComing: '尚未开放',
    },
    'zh-Hant': {
      tutPieceTitle: '選擇一枚棋子，學習它的走法',
      tutRookName: '車', tutHorseName: '馬', tutElephantName: '象',
      tutCannonName: '炮', tutGuardName: '士', tutSoldierName: '卒', tutKingName: '將',
      tutKingSub: '楚 · 漢', tutSoldierSub: '兵',
      tutRookDesc: '車沿直線可走任意格數。不能越過己方棋子，吃子時停在敵方棋子所在格。',
      tutHorseDesc: '馬走直一步、再斜一步。直行的第一格是它的「蹩腿點」，若該格有棋子，則該方向不能走。被蹩住的點以紅色標示。',
      tutElephantDesc: '象走直一步、再斜兩步。途中有兩個蹩腿點：直行一格與隨後的斜行一格。其中任意一個被棋子擋住，該方向便不能走。被蹩住的點以紅色標示。',
      tutCannonDesc: '炮必須正好越過另一枚棋子才能移動或吃子，被越過的棋子稱為「炮架」。沒有炮架便不能走。注意：另一枚炮不能充當炮架，也不能被吃。',
      tutGuardDesc: '士只能在九宮內移動——直行一格，或沿標示的斜線斜行一格。',
      tutKingDesc: '將與士相同，只能在九宮內移動。將被吃掉即落敗。',
      tutSoldierDesc: '卒／兵可向前一格或向旁一格移動，不能後退。',
      tutRookAction: '點擊車，看看它能走到哪裡。',
      tutHorseAction: '點擊馬，確認它的走法。',
      tutElephantAction: '點擊象，確認它的走法。',
      tutCannonAction: '點擊炮，只有有炮架的方向才能走。',
      tutGuardAction: '點擊士，它只能在九宮內移動。',
      tutKingAction: '點擊將，它只能在九宮內移動。',
      tutSoldierAction: '點擊卒，它只能向前或向旁移動。',
      tutRookMission: '在3步內吃掉一枚敵方兵。',
      tutHorseMission: '在3步內吃掉一枚敵方兵。',
      tutElephantMission: '在3步內吃掉一枚敵方兵。',
      tutCannonMission: '越過炮架，在3步內吃掉敵方兵。',
      tutGuardMission: '在4步內吃掉敵方兵。',
      tutKingMission: '在4步內吃掉敵方兵。',
      tutSoldierMission: '在3步內吃掉敵方兵。',
      tutPracticeStart: '開始任務',
      tutIntroStart: '試著走一走',
      tutMovesLeft: (n) => `剩餘步數：${n}`,
      tutSuccess: '成功！',
      tutSuccessMsg: (n) => `你在 ${n} 步內吃掉了敵方棋子。`,
      tutFail: '差一點。',
      tutFailMsg: '未能吃掉敵方棋子。',
      tutRetry: '再試一次',
      tutBackToPractice: '回到自由練習',
      tutNextPiece: '學習其他棋子',
      tutReset: '再試一次',
      tutExit: '返回選單',
      tutComing: '尚未開放',
    },
    ja: {
      tutPieceTitle: '駒を選んで動かし方を学びましょう',
      tutRookName: '車', tutHorseName: '馬', tutElephantName: '象',
      tutCannonName: '包', tutGuardName: '士', tutSoldierName: '卒', tutKingName: '将',
      tutKingSub: '楚 · 漢', tutSoldierSub: '兵',
      tutRookDesc: '車は直線に好きなだけ進めます。味方の駒は通り抜けられず、敵の駒は取ってそこで止まります。',
      tutHorseDesc: '馬は直線に一マス、続けて斜めに一マス進みます。直線の最初のマスが「足（あし）」で、そこに駒があるとその方向へは進めません。塞がれた足は赤く表示されます。',
      tutElephantDesc: '象は直線に一マス、続けて斜めに二マス進みます。道中には足が二つあり、直線の一マスとその次の斜め一マスです。どちらか一方でも駒に塞がれると、その方向へは進めません。塞がれた足は赤く表示されます。',
      tutCannonDesc: '包は必ず他の駒を一つだけ飛び越えて動くか取ります。飛び越える駒を「台（だい）」といいます。台がなければ動けません。ただし、別の包は台にできず、取ることもできません。',
      tutGuardDesc: '士は宮城（九宮）の中だけを動けます。直線に一マス、また斜めの結び目では斜めにも進めます。',
      tutKingDesc: '将は士と同じく宮城の中だけを動きます。将を取られると負けです。',
      tutSoldierDesc: '卒／兵は前に一マス、または横に一マス進めます。後ろへは退がれません。',
      tutRookAction: '車を押して、どこへ行けるか見てみましょう。',
      tutHorseAction: '馬を押して、動かし方を確かめましょう。',
      tutElephantAction: '象を押して、動かし方を確かめましょう。',
      tutCannonAction: '包を押してみましょう。台がある方向だけ動けます。',
      tutGuardAction: '士を押してみましょう。宮城の中だけを動きます。',
      tutKingAction: '将を押してみましょう。宮城の中だけを動きます。',
      tutSoldierAction: '卒を押してみましょう。前と横にだけ動きます。',
      tutRookMission: '3手以内に敵の兵を取ってみましょう。',
      tutHorseMission: '3手以内に敵の兵を取ってみましょう。',
      tutElephantMission: '3手以内に敵の兵を取ってみましょう。',
      tutCannonMission: '台を飛び越えて、3手以内に敵の兵を取ってみましょう。',
      tutGuardMission: '4手以内に敵の兵を取ってみましょう。',
      tutKingMission: '4手以内に敵の兵を取ってみましょう。',
      tutSoldierMission: '3手以内に敵の兵を取ってみましょう。',
      tutPracticeStart: 'ミッション開始',
      tutIntroStart: '実際に動かす',
      tutMovesLeft: (n) => `残り手数：${n}`,
      tutSuccess: '成功！',
      tutSuccessMsg: (n) => `${n}手以内に敵の駒を取りました。`,
      tutFail: '惜しい。',
      tutFailMsg: '敵の駒を取れませんでした。',
      tutRetry: 'もう一度',
      tutBackToPractice: '自由練習に戻る',
      tutNextPiece: '別の駒を学ぶ',
      tutReset: 'もう一度',
      tutExit: 'メニューへ',
      tutComing: 'まだ準備中です',
    },
    de: {
      tutPieceTitle: 'Wähle eine Figur und lerne ihren Zug',
      tutRookName: 'Wagen', tutHorseName: 'Pferd', tutElephantName: 'Elefant',
      tutCannonName: 'Kanone', tutGuardName: 'Wächter', tutSoldierName: 'Soldat', tutKingName: 'General',
      tutKingSub: 'Cho · Han', tutSoldierSub: 'Bing',
      tutRookDesc: 'Der Wagen zieht beliebig weit in gerader Linie. Eigene Figuren kann er nicht überspringen; er schlägt, indem er auf einer gegnerischen Figur landet.',
      tutHorseDesc: 'Das Pferd zieht einen Schritt gerade, dann einen Schritt diagonal. Der erste gerade Schritt ist sein Sperrpunkt; steht dort eine Figur, kann das Pferd in diese Richtung nicht ziehen. Gesperrte Punkte werden rot markiert.',
      tutElephantDesc: 'Der Elefant zieht einen Schritt gerade, dann zwei Schritte diagonal. Sein Weg hat zwei Sperrpunkte: den geraden Schritt und den ersten diagonalen Schritt. Steht auf einem davon eine Figur, kann der Elefant in diese Richtung nicht ziehen. Gesperrte Punkte werden rot markiert.',
      tutCannonDesc: 'Die Kanone muss genau eine andere Figur überspringen, um zu ziehen oder zu schlagen. Diese Figur heißt Bock. Ohne Bock kann sie nicht ziehen. Beachte: Eine andere Kanone kann weder als Bock dienen noch geschlagen werden.',
      tutGuardDesc: 'Der Wächter zieht nur innerhalb des Palasts — einen Schritt gerade oder diagonal entlang der markierten Linien.',
      tutKingDesc: 'Der General zieht wie der Wächter innerhalb des Palasts. Wird der General geschlagen, ist die Partie verloren.',
      tutSoldierDesc: 'Der Soldat zieht einen Schritt vorwärts oder zur Seite. Zurück darf er nicht.',
      tutRookAction: 'Klicke den Wagen an, um zu sehen, wohin er ziehen kann.',
      tutHorseAction: 'Klicke das Pferd an, um seine Züge zu sehen.',
      tutElephantAction: 'Klicke den Elefanten an, um seine Züge zu sehen.',
      tutCannonAction: 'Klicke die Kanone an. Nur Richtungen mit einem Bock sind möglich.',
      tutGuardAction: 'Klicke den Wächter an. Er zieht nur innerhalb des Palasts.',
      tutKingAction: 'Klicke den General an. Er zieht nur innerhalb des Palasts.',
      tutSoldierAction: 'Klicke den Soldaten an. Er zieht nur vorwärts oder zur Seite.',
      tutRookMission: 'Schlage innerhalb von 3 Zügen einen gegnerischen Soldaten.',
      tutHorseMission: 'Schlage innerhalb von 3 Zügen einen gegnerischen Soldaten.',
      tutElephantMission: 'Schlage innerhalb von 3 Zügen einen gegnerischen Soldaten.',
      tutCannonMission: 'Überspringe den Bock und schlage innerhalb von 3 Zügen den gegnerischen Soldaten.',
      tutGuardMission: 'Schlage innerhalb von 4 Zügen den gegnerischen Soldaten.',
      tutKingMission: 'Schlage innerhalb von 4 Zügen den gegnerischen Soldaten.',
      tutSoldierMission: 'Schlage innerhalb von 3 Zügen den gegnerischen Soldaten.',
      tutPracticeStart: 'Aufgabe starten',
      tutIntroStart: 'Selbst ziehen',
      tutMovesLeft: (n) => `Verbleibende Züge: ${n}`,
      tutSuccess: 'Geschafft!',
      tutSuccessMsg: (n) => `Du hast die gegnerische Figur innerhalb von ${n} Zügen geschlagen.`,
      tutFail: 'Knapp daneben.',
      tutFailMsg: 'Du hast die gegnerische Figur nicht geschlagen.',
      tutRetry: 'Nochmal',
      tutBackToPractice: 'Zurück zum freien Üben',
      tutNextPiece: 'Andere Figur lernen',
      tutReset: 'Nochmal',
      tutExit: 'Zum Menü',
      tutComing: 'Noch nicht verfügbar',
    },
    fr: {
      tutPieceTitle: 'Choisissez une pièce pour apprendre son déplacement',
      tutRookName: 'Char', tutHorseName: 'Cheval', tutElephantName: 'Éléphant',
      tutCannonName: 'Canon', tutGuardName: 'Garde', tutSoldierName: 'Soldat', tutKingName: 'Général',
      tutKingSub: 'Cho · Han', tutSoldierSub: 'Bing',
      tutRookDesc: 'Le Char se déplace d’autant de cases qu’il veut en ligne droite. Il ne peut pas traverser ses propres pièces, et capture en s’arrêtant sur une pièce ennemie.',
      tutHorseDesc: 'Le Cheval avance d’un pas en ligne droite, puis d’un pas en diagonale. Le premier pas droit est son point de blocage ; si une pièce s’y trouve, le Cheval ne peut pas aller dans cette direction. Les points bloqués sont marqués en rouge.',
      tutElephantDesc: 'L’Éléphant avance d’un pas en ligne droite, puis de deux pas en diagonale. Son chemin compte deux points de blocage : le pas droit et le premier pas diagonal. Si une pièce occupe l’un d’eux, l’Éléphant ne peut pas aller dans cette direction. Les points bloqués sont marqués en rouge.',
      tutCannonDesc: 'Le Canon doit sauter par-dessus exactement une autre pièce pour se déplacer ou capturer. Cette pièce s’appelle l’écran. Sans écran, il ne peut pas bouger. À noter : un autre Canon ne peut ni servir d’écran ni être capturé.',
      tutGuardDesc: 'Le Garde ne se déplace qu’à l’intérieur du palais — d’un pas en ligne droite, ou en diagonale le long des lignes marquées.',
      tutKingDesc: 'Le Général se déplace comme le Garde, à l’intérieur du palais. Si le Général est capturé, la partie est perdue.',
      tutSoldierDesc: 'Le Soldat avance d’un pas vers l’avant ou sur le côté. Il ne peut pas reculer.',
      tutRookAction: 'Cliquez sur le Char pour voir où il peut aller.',
      tutHorseAction: 'Cliquez sur le Cheval pour voir ses déplacements.',
      tutElephantAction: 'Cliquez sur l’Éléphant pour voir ses déplacements.',
      tutCannonAction: 'Cliquez sur le Canon. Seules les directions avec un écran sont possibles.',
      tutGuardAction: 'Cliquez sur le Garde. Il ne se déplace qu’à l’intérieur du palais.',
      tutKingAction: 'Cliquez sur le Général. Il ne se déplace qu’à l’intérieur du palais.',
      tutSoldierAction: 'Cliquez sur le Soldat. Il ne se déplace que vers l’avant ou sur le côté.',
      tutRookMission: 'Capturez un soldat ennemi en 3 coups.',
      tutHorseMission: 'Capturez un soldat ennemi en 3 coups.',
      tutElephantMission: 'Capturez un soldat ennemi en 3 coups.',
      tutCannonMission: 'Sautez par-dessus l’écran et capturez le soldat ennemi en 3 coups.',
      tutGuardMission: 'Capturez le soldat ennemi en 4 coups.',
      tutKingMission: 'Capturez le soldat ennemi en 4 coups.',
      tutSoldierMission: 'Capturez le soldat ennemi en 3 coups.',
      tutPracticeStart: 'Commencer la mission',
      tutIntroStart: 'Essayer de jouer',
      tutMovesLeft: (n) => `Coups restants : ${n}`,
      tutSuccess: 'Réussi !',
      tutSuccessMsg: (n) => `Vous avez capturé la pièce ennemie en ${n} coups.`,
      tutFail: 'Presque.',
      tutFailMsg: 'Vous n’avez pas capturé la pièce ennemie.',
      tutRetry: 'Réessayer',
      tutBackToPractice: 'Retour à l’entraînement libre',
      tutNextPiece: 'Apprendre une autre pièce',
      tutReset: 'Réessayer',
      tutExit: 'Retour au menu',
      tutComing: 'Pas encore disponible',
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
    blockedForSel = [];
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
        `<span class="tut-piece-name">${tt(p.nameKey)}</span>` +
        (p.subKey
          ? `<span class="tut-piece-sub">${tt(p.subKey)}</span>`
          : `<span class="tut-piece-sub is-empty" aria-hidden="true">·</span>`);  // 빈 placeholder: 높이 유지용
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
    blockedForSel = [];
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
      playPickSound();
      tutorialPhase = 'practice';
      frame.classList.remove('tut-intro');
      renderTutorialSidePanel(tutorialScenario);
    };

    const missionStartBtn = document.getElementById('tutMissionStartBtn');
    if (missionStartBtn) missionStartBtn.onclick = () => startTutorialMission();

    const retryBtn = document.getElementById('tutRetryBtn');
    if (retryBtn) retryBtn.onclick = () => { playPickSound(); startTutorialScenario(tutorialScenario); };

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
    blockedForSel = [];

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
    { id: 'rules',    nameKey: 'modeRules',    subKey: 'modeRulesSub',    icon: '則', active: true  },
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
        card.onclick = (e) => { e.stopPropagation(); playPickSound(); onModeSelect(m.id); };
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
    } else if (id === 'rules') {
      openRulesOverlay();
    }
    // human / review: 추후 분기 추가
  }

  // ── 장기 규칙 오버레이 ─────────────────────────────────────
  const rulesOverlay = document.getElementById('rulesOverlay');
  const rulesBackdrop = document.getElementById('rulesBackdrop');
  const rulesPanelBody = document.getElementById('rulesBody');
  const rulesCloseBtn = document.getElementById('rulesClose');

  function renderRules() {
    document.getElementById('rulesTitle').textContent = t('rulesTitle');
    const subEl = document.getElementById('rulesSubtitle');
    if (subEl) subEl.textContent = t('rulesSubtitle');
    rulesCloseBtn.setAttribute('aria-label', t('rulesClose'));
    const sections = t('rulesSections') || [];
    rulesPanelBody.innerHTML = '';
    sections.forEach((sec, i) => {
      const card = document.createElement('div');
      card.className = 'rules-section';
      const num = document.createElement('span');
      num.className = 'rules-num';
      num.textContent = String(i + 1);
      const title = document.createElement('h3');
      title.className = 'rules-section-title';
      title.textContent = sec.title;
      const body = document.createElement('p');
      body.className = 'rules-section-body';
      body.textContent = sec.body;
      card.appendChild(num);
      card.appendChild(title);
      card.appendChild(body);
      if (sec.example) {
        const ex = document.createElement('div');
        ex.className = 'rules-section-ex';
        const exLabel = document.createElement('span');
        exLabel.className = 'rules-ex-label';
        exLabel.textContent = t('rulesExLabel');
        const exText = document.createElement('p');
        exText.className = 'rules-ex-text';
        exText.textContent = sec.example;
        ex.appendChild(exLabel);
        ex.appendChild(exText);
        card.appendChild(ex);
      }
      rulesPanelBody.appendChild(card);
    });
  }

  function openRulesOverlay() {
    renderRules();
    rulesOverlay.style.display = '';
    rulesPanelBody.scrollTop = 0;
    document.addEventListener('keydown', rulesEscHandler);
  }
  function closeRulesOverlay() {
    rulesOverlay.style.display = 'none';
    document.removeEventListener('keydown', rulesEscHandler);
  }
  function rulesEscHandler(e) {
    if (e.key === 'Escape') closeRulesOverlay();
  }
  rulesCloseBtn.onclick = closeRulesOverlay;
  rulesBackdrop.onclick = closeRulesOverlay;

  // ── About / Credits 오버레이 ───────────────────────────────
  // 설정 메뉴 하단 "About / Credits"에서 열림. 규칙 오버레이와 같은 패턴.
  const aboutOverlay = document.getElementById('aboutOverlay');
  const aboutBackdrop = document.getElementById('aboutBackdrop');
  const aboutPanelBody = document.getElementById('aboutBody');
  const aboutCloseBtn = document.getElementById('aboutClose');
  const aboutBtn = document.getElementById('aboutBtn');

  function renderAbout() {
    document.getElementById('aboutTitle').textContent = t('aboutTitle');
    aboutCloseBtn.setAttribute('aria-label', t('aboutClose'));
    const sections = t('aboutSections') || [];
    aboutPanelBody.innerHTML = '';
    sections.forEach((sec) => {
      const card = document.createElement('div');
      card.className = 'rules-section about-section';
      const title = document.createElement('h3');
      title.className = 'rules-section-title';
      title.textContent = sec.title;
      const body = document.createElement('p');
      body.className = 'rules-section-body';
      body.textContent = sec.body;   // \n 줄바꿈은 CSS white-space로 살림
      card.appendChild(title);
      card.appendChild(body);
      if (sec.link) {
        const a = document.createElement('a');
        a.className = 'about-link';
        a.href = sec.link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = sec.link.label;
        card.appendChild(a);
      }
      aboutPanelBody.appendChild(card);
    });
  }

  function openAboutOverlay() {
    renderAbout();
    aboutOverlay.style.display = '';
    aboutPanelBody.scrollTop = 0;
    document.addEventListener('keydown', aboutEscHandler);
  }
  function closeAboutOverlay() {
    aboutOverlay.style.display = 'none';
    document.removeEventListener('keydown', aboutEscHandler);
  }
  function aboutEscHandler(e) {
    if (e.key === 'Escape') closeAboutOverlay();
  }
  aboutCloseBtn.onclick = closeAboutOverlay;
  aboutBackdrop.onclick = closeAboutOverlay;
  if (aboutBtn) aboutBtn.onclick = () => { closeSettings(); openAboutOverlay(); };

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
      card.onclick = (e) => { e.stopPropagation(); playPickSound(); chooseLevel(id, card); };
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
      card.onclick = (e) => { e.stopPropagation(); playPickSound(); chooseFaction(c.id); };
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
      card.onclick = (e) => { e.stopPropagation(); playPickSound(); chooseSetup(side, name); };
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
    blockedForSel = [];
    history = [];
    // ★ [6-3b] 반복수 맵 초기화 + 시작 국면 1회 기록.
    //   turn='r'(초 선수)이 둘 차례인 초기 배치를 첫 국면으로 센다. 이후 같은 배치+같은 차례가
    //   다시 오면 카운트가 누적돼 4회째에 실격 판정이 걸린다.
    repMap = new Map();
    Eng.recordPosition(repMap, board, turn);
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
    // ★ [D] 상(象) 멱 막힘 표시 — 튜토리얼에서만. 길을 가로막은 돌 위에 붉은 표식.
    if (tutorialMode && blockedForSel.length) {
      for (const { r: br, c: bc } of blockedForSel) {
        const { x, y } = posToXY(br, bc);
        const mk = document.createElement('div');
        mk.className = 'block-mark';
        mk.style.left = x + '%';
        mk.style.top = y + '%';
        // 표식은 안내용이라 클릭을 가로채지 않음(아래 기물 클릭이 그대로 동작)
        piecesLayer.appendChild(mk);
      }
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
        // ★ [D] 상(象)·마(馬)일 때 멱이 막혀 못 가는 칸을 함께 계산(학습용 표시)
        blockedForSel = (p.type === 'E') ? elephantBlockedLegs(board, r, c)
                      : (p.type === 'H') ? horseBlockedLegs(board, r, c)
                      : [];
        render();
      } else {
        selected = null;
        legalForSel = [];
        blockedForSel = [];
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
      blockedForSel = [];   // 대국 화면은 막힘 표시 안 함(튜토리얼 전용)
      playPickSound();   // 기물 선택 소리
      setStatus(legalForSel.length ? t('pickDest') : t('cantMove'));
      render();
    } else if (p) {
      setStatus(t('notYourTurn', factionLabel(turn)));
    }
  }

  // ★ [D] 상(象) 멱 막힘 계산 (튜토리얼 학습용)
  //   엔진(engine.js)의 E case와 동일한 8개 경로를 미러링한다.
  //   각 경로는 [직진 멱, 대각 멱, 도착]. 도착칸이 보드 안인데
  //   멱(직진 또는 대각)이 막혀서 갈 수 없는 경우, 그 "막힌 멱 칸"을 모은다.
  //   ※ engine.js를 건드리지 않기 위해 행마 정의만 여기서 복제한다.
  //     엔진 E legs가 바뀌면 이 표도 함께 맞춰야 한다(주석으로 연동 표시).
  const ELEPHANT_LEGS = [
    [[-1,0],[-2,-1],[-3,-2]],
    [[-1,0],[-2,1],[-3,2]],
    [[1,0],[2,-1],[3,-2]],
    [[1,0],[2,1],[3,2]],
    [[0,-1],[-1,-2],[-2,-3]],
    [[0,-1],[1,-2],[2,-3]],
    [[0,1],[-1,2],[-2,3]],
    [[0,1],[1,2],[2,3]],
  ];
  function elephantBlockedLegs(bd, r, c) {
    const inB = (rr, cc) => rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS;
    const blocked = [];   // 막힌 멱 칸들 {r,c}
    for (const [s1, s2, dest] of ELEPHANT_LEGS) {
      const m1r = r + s1[0], m1c = c + s1[1];
      const m2r = r + s2[0], m2c = c + s2[1];
      const dr = r + dest[0], dc = c + dest[1];
      if (!inB(dr, dc)) continue;            // 도착칸이 판 밖이면 애초에 후보 아님
      if (!inB(m1r, m1c) || !inB(m2r, m2c)) continue;
      const b1 = !!bd[m1r][m1c];             // 첫 멱(직진) 막힘?
      const b2 = !!bd[m2r][m2c];             // 둘째 멱(대각) 막힘?
      if (!b1 && !b2) continue;              // 둘 다 비었으면 갈 수 있는 길 → 표시 안 함
      // 막힌 멱 칸을 표시 대상에 추가(중복 제거는 호출부에서)
      if (b1) blocked.push({ r: m1r, c: m1c });
      else if (b2) blocked.push({ r: m2r, c: m2c }); // 직진은 뚫렸는데 대각이 막힌 경우
    }
    // 중복 좌표 제거
    const seen = new Set();
    return blocked.filter(({ r, c }) => {
      const k = `${r},${c}`;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
  }

  // ★ [D] 마(馬) 멱 막힘 계산 (튜토리얼 학습용)
  //   엔진(engine.js)의 H case와 동일한 4개 멱을 미러링한다.
  //   마는 상과 달리 멱이 하나(직진 한 칸)뿐 — 그 멱이 막히면 그 방향
  //   도착 두 곳이 모두 막힌다. 막힌 멱 칸을 표시 대상으로 모은다.
  //   ※ engine.js를 건드리지 않기 위해 행마 정의만 여기서 복제한다.
  //     엔진 H legs가 바뀌면 이 표도 함께 맞춰야 한다(주석으로 연동 표시).
  const HORSE_LEGS = [
    // [멱(직진 한 칸), 도착1, 도착2]
    [[-1,0],[-2,-1],[-2,1]],
    [[1,0],[2,-1],[2,1]],
    [[0,-1],[-1,-2],[1,-2]],
    [[0,1],[-1,2],[1,2]],
  ];
  function horseBlockedLegs(bd, r, c) {
    const inB = (rr, cc) => rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS;
    const blocked = [];   // 막힌 멱 칸들 {r,c}
    for (const [leg, d1, d2] of HORSE_LEGS) {
      const mr = r + leg[0], mc = c + leg[1];   // 멱 자리
      if (!inB(mr, mc)) continue;               // 멱이 판 밖이면 후보 아님
      if (!bd[mr][mc]) continue;                // 멱이 비었으면 갈 수 있는 길 → 표시 안 함
      // 멱이 막힌 경우, 그 방향 도착 둘 중 하나라도 판 안이면 "막혀서 못 가는 길"
      const dests = [d1, d2];
      const reachable = dests.some(([dr, dc]) => inB(r + dr, c + dc));
      if (reachable) blocked.push({ r: mr, c: mc });
    }
    // 중복 좌표 제거
    const seen = new Set();
    return blocked.filter(({ r, c }) => {
      const k = `${r},${c}`;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
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
      // ★ [6-3b] 이 수를 두기 전의 반복수 맵 스냅샷. 값이 숫자뿐이라 new Map 얕은 복사로 충분.
      //   undo가 이 항목을 pop하면 repMap을 이 스냅샷으로 되돌려 반복 카운트를 정확히 복원한다.
      repSnapshot: new Map(repMap),
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
    blockedForSel = [];
    turn = turn === 'r' ? 'b' : 'r';
    render();
    renderMovelog();
    updateTurnUI();
    renderClock();   // 새 차례 강조 갱신
    // ★ [6-3b] 반복수 기록: 방금 수를 둬서 만들어진 국면(+다음 차례 turn)을 카운트.
    //   기록은 항상 한다(외통으로 끝나도 그 국면 자체는 출현한 것). 판정만 아래서 게임 미종료 시.
    const repN = Eng.recordPosition(repMap, board, turn);
    // 종료/장군 판정
    const st = Eng.gameStatus(board, turn);
    if (st.over) {
      stopClock();
      if (st.draw) {
        // 무승부 — 빅장/수막힘 구분 위해 st.reason 그대로 전달(과거 'stalemate' 고정 버그 교정).
        // [6-2] 점수: 엔진이 draw에 st.score({r,b,diff,winner})를 실어 보냄 → 종료 화면 표시용.
        endGame(null, st.reason, st.score);   // 무승부 (승자 없음) — 점수는 endState에 보관
      } else {
        endGame(st.loser === 'r' ? 'b' : 'r', st.reason);   // 외통 등 — 승자 전달
      }
    } else if (repN >= 4) {
      // ★ [6-3b] 반복수 실격패. 연맹 규정: 만년장/반복수는 3회 허용, 4회 반복 시 실격패.
      //   "방금 수를 둔 쪽"이 같은 국면을 4번째로 만든 = 반복 주체 → 실격패(loser).
      //   turn은 이미 다음 차례로 바뀐 상태라, 반복을 만든 쪽은 turn의 반대편이고 승자는 turn.
      //   draw가 아니라 승패 종료(외통과 같은 결) → endGame이 score 미첨부 승/패 화면을 그림.
      //   ※ 현재 구현은 전체 동일국면 반복 기준. 4회째 동일국면을 만든 쪽을 반복 주체로 보고 실격 처리.
      //     만년장/장군 반복 특화 판정(공격측 추적)은 후속 작업에서 좁힐 수 있음.
      stopClock();
      endGame(turn, 'repetition');   // winner = turn(반복 안 한 쪽), loser = 방금 둔 쪽
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

  function endGame(winner, reason, score) {
    gameOver = true;
    stopClock();
    if (winner === null) {
      // 무승부 (수막힘·빅장) — 승자/패자 없음. 재대국 자동배정용 lastResult는 유지(직전 결과 보존).
      // [6-2] score = { r, b, diff, winner } (무승부 때만 엔진이 첨부) → renderEndMessages가 보조 줄로 그림.
      endState = { winner: null, reason: reason || 'draw', loser: null, draw: true, score: score || null };
    } else {
      // winner는 자리(r/b). r=초(chu), b=한(han) — flipped 무관.
      lastResult = (winner === 'r') ? 'chu' : 'han';
      const loser = (winner === 'r') ? 'b' : 'r';
      endState = { winner, reason: reason || null, loser, draw: false, score: null };
    }
    winOverlay.classList.add('show');
    refreshPersp();   // gameOver면 관점 줄 비움
    renderEndMessages();
  }

  // 종료 오버레이·상태창 문구를 현재 언어로 (그)리기 — endGame과 언어전환에서 공용
  function renderEndMessages() {
    if (!endState) return;
    const { winner, reason, loser, draw, score } = endState;
    if (draw) {
      // 무승부: 진영 승리줄 대신 "비김", 큰 줄은 "무승부(+사유)"
      winFactionLine.textContent = t('drawLine');
      winFactionLine.className = 'win-faction draw';
      // [6-2 UI] 빅장/수막힘 구분 — 과거 'stalemate' 고정 버그 교정 후 reason이 정확히 들어옴.
      winTitle.textContent = (reason === 'bikjang') ? t('outcomeDrawBikjang') : t('outcomeDraw');
      winTitle.className = 'draw';
      // [6-2 UI] 점수 보조 줄: 엔진이 무승부에 실어 보낸 score를 옅게 표시.
      //   메인은 무승부, 그 아래 "초 R · 한 B (X점 우세)"로 점수와 격차를 보여줘 학습 효과.
      //   score 없으면(구버전 방어) 빈칸 유지.
      renderScoreLine(score);
      setStatus(reason === 'bikjang' ? t('drawBikjang')
              : reason === 'stalemate' ? t('drawStalemate')
              : t('outcomeDraw'));
      return;
    }
    winScore.textContent = '';   // 승/패 화면엔 점수 줄 없음 (기존 레이아웃 유지)
    // ★ [6-3c] 단, 반복수 종료는 사유가 안 보이면 갑작스러워 winScore를 "사유 보조 줄"로 재사용.
    //   빅장 점수줄과 같은 위계(ws-lead)로 "왜 끝났는지"를 화면이 스스로 설명. score 줄 아님.
    if (reason === 'repetition') {
      winScore.innerHTML = `<span class="ws-lead">${t('repetitionReason')}</span>`;
    }
    const winnerFaction = (winner === 'r') ? 'chu' : 'han';
    const iWon = (winnerFaction === playerFaction);
    // 작은 줄: 누가 이겼나 (진영 + 진영색). 외통/시간패면 사유 명시
    winFactionLine.textContent =
      (reason === 'checkmate') ? t('byCheckmate', factionLabel(winner))
      : (reason === 'timeout') ? t('byTimeout', factionLabel(winner))
      : (reason === 'repetition') ? t('byRepetition', factionLabel(winner))
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

  // [6-2 UI] 무승부 점수 보조 줄을 그린다. score = { r, b, diff, winner }.
  //   형식: "초 72 · 한 73.5 (한 1.5점 우세)". 점수 숫자는 언어 무관, 라벨만 t()로.
  //   winner=null(동점, 덤 1.5라 수학상 불가하나 방어)면 격차 괄호 생략.
  //   score 없으면(외통/구버전) 줄을 비운다.
  function renderScoreLine(score) {
    if (!score) { winScore.innerHTML = ''; return; }
    const fmt = (n) => Number.isInteger(n) ? String(n) : n.toFixed(1);   // 5 / 73.5
    // 1줄: 점수 (진영 한자 병기) — "초(楚) 0 · 한(漢) 5.5"
    const scoreRow = `${factionLabel('r')} ${fmt(score.r)} · ${factionLabel('b')} ${fmt(score.b)}`;
    let html = `<span class="ws-row">${scoreRow}</span>`;
    // 2줄: 격차 — "한 5.5점 우세". 윗줄에서 이미 한(漢)을 봤으니 우세 줄엔 한자 병기 생략(반복 제거).
    //   교육 효과: "빅장이 나면 점수로 가린다"를 독립 줄로 또렷이.
    if (score.winner) {
      const shortName = (score.winner === 'r') ? t('chuShort') : t('hanShort');
      html += `<span class="ws-lead">${t('scoreLead', shortName, fmt(score.diff))}</span>`;
    }
    winScore.innerHTML = html;
  }

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
    // ⚙ 설정 드롭다운의 "언어" 라벨 + ⚙ 버튼 aria-label (이전엔 HTML 한국어 고정이라 언어전환·로드 시 안 바뀜)
    const settingsLangLabel = document.getElementById('settingsLangLabel');
    if (settingsLangLabel) settingsLangLabel.textContent = t('settingsLangLabel');
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.setAttribute('aria-label', t('settingsBtnLabel'));
    // 게임 시작 전 상태 메시지(첫 로드 시 HTML "기물을 골라 두세요" 한국어 잔존 방지).
    // 대국 진행 중이면 setStatus/refreshStatus가 관리하므로 덮지 않는다.
    if (!board) msgEl.textContent = t('pickPiece');
    langKo.classList.toggle('active', lang === 'ko');
    langEn.classList.toggle('active', lang === 'en');
    if (langZhHans) langZhHans.classList.toggle('active', lang === 'zh-Hans');
    if (langZhHant) langZhHant.classList.toggle('active', lang === 'zh-Hant');
    if (langJa) langJa.classList.toggle('active', lang === 'ja');
    if (langDe) langDe.classList.toggle('active', lang === 'de');
    if (langFr) langFr.classList.toggle('active', lang === 'fr');
    document.documentElement.lang = lang;
    const settingsBgLabel = document.getElementById('settingsBgLabel');
    if (settingsBgLabel) settingsBgLabel.textContent = t('settingsBgLabel');
    const bgSansuHwaBtn = document.getElementById('bgSansuHwa');
    if (bgSansuHwaBtn) bgSansuHwaBtn.textContent = t('bgSansuHwa');
    const bgSimpleBtn = document.getElementById('bgSimple');
    if (bgSimpleBtn) bgSimpleBtn.textContent = t('bgSimple');
    const bgWoodBtn = document.getElementById('bgWood');
    if (bgWoodBtn) bgWoodBtn.textContent = t('bgWood');
    const bgSipjangsaengBtn = document.getElementById('bgSipjangsaeng');
    if (bgSipjangsaengBtn) bgSipjangsaengBtn.textContent = t('bgSipjangsaeng');
    const bgPaperBtn = document.getElementById('bgPaper');
    if (bgPaperBtn) bgPaperBtn.textContent = t('bgPaper');
  }

  function setLang(next) {
    if (next === lang) return;
    lang = next;
    // 선택을 저장 → 새로고침·재방문 시 navigator 추측 대신 이 값을 먼저 쓴다.
    try { localStorage.setItem(LANG_STORE_KEY, next); }
    catch (e) { /* localStorage 차단 시 저장만 생략, 동작은 그대로 */ }
    applyStaticI18n();
    // 규칙 오버레이가 열려 있으면 새 언어로 다시 그림
    if (rulesOverlay && rulesOverlay.style.display !== 'none') {
      renderRules();
    }
    // About 오버레이가 열려 있으면 새 언어로 다시 그림
    if (aboutOverlay && aboutOverlay.style.display !== 'none') {
      renderAbout();
    }
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
      // ★ [6-3b] 반복수 맵도 이 수 두기 전 스냅샷으로 되돌린다.
      //   AI 대국에서 popOne이 두 번 불려도(아래) 각 prev가 자기 시점 스냅샷을 들고 있어
      //   마지막 popOne의 스냅샷이 곧 복원될 정확한 상태가 된다.
      //   (구버전 history 항목 방어: repSnapshot 없으면 현 맵 유지.)
      if (prev.repSnapshot) repMap = new Map(prev.repSnapshot);
    };
    popOne();
    // ★ AI 대국: 되감은 결과가 AI 차례면, 사람 차례가 될 때까지 한 번 더 되감음.
    //   (사람 한 수 + AI 한 수 = 두 단계를 함께 무르는 효과 → 멈춤 방지.)
    if (aiSide && turn === aiSide && history.length) {
      popOne();
    }
    selected = null; legalForSel = []; blockedForSel = [];
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
    playPickSound();
    resignConfirmBox.classList.remove('show');
    if (gameOver) return;
    const loser = turn;
    const winner = (turn === 'r') ? 'b' : 'r';
    setStatus(t('resigned', factionLabel(loser)));
    endGame(winner, 'resign');
  };
  document.getElementById('frame').onclick = () => {
    if (selected) { selected = null; legalForSel = []; blockedForSel = []; render(); }
  };
  setupSkip.onclick = (e) => { e.stopPropagation(); skipSetup(); };
  langKo.onclick = () => { setLang('ko'); closeSettings(); };
  langEn.onclick = () => { setLang('en'); closeSettings(); };
  if (langZhHans) langZhHans.onclick = () => { setLang('zh-Hans'); closeSettings(); };
  if (langZhHant) langZhHant.onclick = () => { setLang('zh-Hant'); closeSettings(); };
  if (langJa) langJa.onclick = () => { setLang('ja'); closeSettings(); };
  if (langDe) langDe.onclick = () => { setLang('de'); closeSettings(); };
  if (langFr) langFr.onclick = () => { setLang('fr'); closeSettings(); };

  // ── 장기판 배경 선택 ──────────────────────────────────────
  // bg: 'sansuHwa'(기본) | 'simple'. 배경 추가 시 BG_LIST에만 추가하면 됨.
  let boardBg = 'sansuHwa';
  const BG_LIST = [
    { id: 'sansuHwa',     cls: null,              btnId: 'bgSansuHwa'     },
    { id: 'wood',         cls: 'bg-wood',         btnId: 'bgWood'         },
    { id: 'sipjangsaeng', cls: 'bg-sipjangsaeng', btnId: 'bgSipjangsaeng' },
    { id: 'paper',        cls: 'bg-paper',        btnId: 'bgPaper'        },
    // 심플 배경 보류 (접근성/고대비 모드용). 복구 시 아래 주석 해제 + index.html 버튼 복구
    // { id: 'simple',   cls: 'bg-simple',       btnId: 'bgSimple'       },
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
  document.getElementById('bgSansuHwa').onclick     = () => { applyBoardBg('sansuHwa'); };
  document.getElementById('bgWood').onclick         = () => { applyBoardBg('wood'); };
  document.getElementById('bgSipjangsaeng').onclick = () => { applyBoardBg('sipjangsaeng'); };
  document.getElementById('bgPaper').onclick        = () => { applyBoardBg('paper'); };
  // 심플 보류: const s = document.getElementById('bgSimple'); if (s) s.onclick = () => { applyBoardBg('simple'); };

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

