/* ============================================================
 *  ai-adapter.js  —  한국 장기 AI 어댑터 (Fairy-Stockfish WASM)
 *
 *  역할:
 *   - assets/engine/stockfish.js 로더를 비동기로 초기화
 *   - 우리 board → SF용 FEN 변환 (검증 완료: 대문자=초/r, row0=위)
 *   - go depth N → bestmove 수신 → 우리 [fr,fc,tr,tc]로 파싱
 *   - script.js는 window.JanggiAI.bestMove(board, turn) 하나만 호출
 *
 *  설계 메모:
 *   - engine.js(로컬 룰 엔진)는 그대로 유지. 이 어댑터는 "수 계산"만 위임.
 *   - 로더/통신 책임을 script.js에서 분리 (비동기·워커·외부의존 격리).
 *   - 좌표/FEN/파싱 로직은 node 검산 통과분과 동일 (adapter_core 검증분).
 *   - 엔진이 안 깨어나도 게임이 멈추지 않게: 상태를 외부에서 읽을 수 있게 노출.
 *
 *  의존:
 *   - 전역 Stockfish (assets/engine/stockfish.js가 <script>로 먼저 로드돼야 함)
 *   - 엔진 파일 위치: ENGINE_DIR 아래 stockfish.js / .wasm / .worker.js
 * ============================================================ */
(function () {
  'use strict';

  const ROWS = 10, COLS = 9;
  const ENGINE_DIR = 'assets/engine/';   // 상대경로 (하위경로 배포에서도 작동)
  const ENGINE_LOADER = ENGINE_DIR + 'stockfish.js';

  // stockfish.js를 동적으로 1회 주입 (페이지 로드 시 멀티스레드 로더가
  // 전체 JS를 멈추는 것을 방지 — AI가 필요한 순간에만 로드).
  let _loaderPromise = null;
  function loadStockfishScript() {
    if (_loaderPromise) return _loaderPromise;
    _loaderPromise = new Promise((resolve, reject) => {
      if (typeof Stockfish === 'function') { resolve(); return; }
      const s = document.createElement('script');
      s.src = ENGINE_LOADER;
      s.onload = () => {
        if (typeof Stockfish === 'function') resolve();
        else reject(new Error('stockfish.js 로드됐으나 Stockfish 전역이 없음'));
      };
      s.onerror = () => reject(new Error('stockfish.js 로드 실패: ' + ENGINE_LOADER));
      document.head.appendChild(s);
    });
    return _loaderPromise;
  }

  // ── 기물 타입 ↔ FEN 문자 (검증 완료) ──────────────────────
  //   R=車 H=馬(n) E=象(b) A=士(a) K=將(k) C=包(c) P=卒(p)
  const TYPE_TO_FEN = { R: 'r', H: 'n', E: 'b', A: 'a', K: 'k', C: 'c', P: 'p' };

  // ── 좌표 변환 (검증 완료) ────────────────────────────────
  //   우리 [r,c]: r 0=맨위(한/b) .. 9=맨아래(초/r),  c 0..8
  //   UCI: file='a'+c,  rank = ROWS - r  → r=9→1, r=0→10
  function toUci(r, c) { return String.fromCharCode(97 + c) + (ROWS - r); }
  function sqFromUci(sq) {
    const file = sq.charCodeAt(0) - 97;
    const rank = parseInt(sq.slice(1), 10);
    return [ROWS - rank, file];
  }
  // bestmove 문자열 → [fr,fc,tr,tc] (두자리 rank "a10" 안전 파싱)
  function parseBestmove(mv) {
    if (!mv || mv === '(none)') return null;
    const m = mv.match(/^([a-i])(\d{1,2})([a-i])(\d{1,2})/);
    if (!m) return null;
    const [, f1, r1, f2, r2] = m;
    const [fr, fc] = sqFromUci(f1 + r1);
    const [tr, tc] = sqFromUci(f2 + r2);
    return [fr, fc, tr, tc];
  }

  // ── board → 완전 FEN ("<board> w|b - - 0 1") ──────────────
  //   turn: 'r'(초)→ 'w',  'b'(한)→ 'b'
  function boardToFen(board, turn) {
    const rows = [];
    for (let r = 0; r < ROWS; r++) {
      let s = '', empty = 0;
      for (let c = 0; c < COLS; c++) {
        const p = board[r][c];
        if (!p) { empty++; continue; }
        if (empty) { s += empty; empty = 0; }
        const ch = TYPE_TO_FEN[p.type];
        s += (p.side === 'r') ? ch.toUpperCase() : ch;
      }
      if (empty) s += empty;
      rows.push(s);
    }
    const stm = (turn === 'r') ? 'w' : 'b';
    return `${rows.join('/')} ${stm} - - 0 1`;
  }

  // ── 엔진 상태 (외부에서 읽기용) ───────────────────────────
  //   'idle'(미초기화) | 'loading' | 'ready' | 'thinking' | 'failed'
  let _state = 'idle';
  let _sf = null;             // Stockfish 인스턴스
  let _readyResolve = null;
  let _readyPromise = null;
  let _initStarted = false;
  let _lastError = null;

  // 한 번에 하나의 go만 — 진행 중 bestmove 리스너
  let _pendingBest = null;   // { resolve, reject }
  let _goTimer = null;

  function getState() { return _state; }
  function getLastError() { return _lastError; }

  // ── 엔진 초기화 (lazy, 1회) ───────────────────────────────
  function init() {
    if (_initStarted) return _readyPromise;
    _initStarted = true;
    _state = 'loading';

    _readyPromise = new Promise((resolve, reject) => {
      _readyResolve = resolve;

      loadStockfishScript().then(() => {
        if (typeof Stockfish !== 'function') {
          _state = 'failed';
          _lastError = 'Stockfish 로더가 없습니다 (stockfish.js 미로드)';
          reject(new Error(_lastError));
          return;
        }

        let sfOptions = {
          locateFile: (path) => ENGINE_DIR + path,   // .wasm / .worker.js 경로
        };

        return Promise.resolve(Stockfish(sfOptions)).then((sf) => {
          _sf = sf;

          sf.addMessageListener((line) => {
            if (typeof line !== 'string') return;
            // bestmove 수신 → 대기 중 go 해결
            if (line.startsWith('bestmove')) {
              const mv = line.split(/\s+/)[1];
              if (_pendingBest) {
                const pb = _pendingBest;
                _pendingBest = null;
                if (_goTimer) { clearTimeout(_goTimer); _goTimer = null; }
                _state = 'ready';
                pb.resolve(parseBestmove(mv));
              }
            }
          });

          // UCI 핸드셰이크 + 장기 변종
          sf.postMessage('uci');
          sf.postMessage('setoption name UCI_Variant value janggi');
          sf.postMessage('isready');

          _state = 'ready';
          resolve(true);
        });
      }).catch((e) => {
        _state = 'failed';
        _lastError = (e && e.message) ? e.message : String(e);
        reject(e);
      });
    });

    return _readyPromise;
  }

  // ── 현재 판에 대해 AI 한 수 계산 ──────────────────────────
  //   board: 우리 board, turn: 둘 차례('r'|'b'), depth: 탐색 깊이
  //   반환: Promise<[fr,fc,tr,tc] | null>
  //   타임아웃/실패 시 reject. 호출부에서 안전하게 catch할 것.
  function bestMove(board, turn, depth) {
    depth = depth || 8;   // 1차 기본 깊이. 입문자 친화 — 추후 조절.
    return init().then(() => {
      if (_state === 'failed' || !_sf) {
        return Promise.reject(new Error(_lastError || 'engine not ready'));
      }
      // 직전 go가 안 끝났으면 거부 (한 번에 하나)
      if (_pendingBest) {
        return Promise.reject(new Error('AI가 이미 수를 계산 중입니다'));
      }
      return new Promise((resolve, reject) => {
        _pendingBest = { resolve, reject };
        _state = 'thinking';

        const fen = boardToFen(board, turn);
        _sf.postMessage('position fen ' + fen);
        _sf.postMessage('go depth ' + depth);

        // 안전장치: 25초 내 bestmove 없으면 타임아웃
        _goTimer = setTimeout(() => {
          if (_pendingBest) {
            const pb = _pendingBest;
            _pendingBest = null;
            _state = 'ready';
            reject(new Error('AI 응답 타임아웃'));
          }
        }, 25000);
      });
    });
  }

  // ── 공개 API ──────────────────────────────────────────────
  window.JanggiAI = {
    init,
    bestMove,
    getState,
    getLastError,
    // 디버그/검증용 노출 (node 검산분과 동일 로직)
    _boardToFen: boardToFen,
    _toUci: toUci,
    _parseBestmove: parseBestmove,
  };
})();
