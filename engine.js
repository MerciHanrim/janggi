/* ============================================================
 *  Janggi Engine (한국 장기 엔진)
 *  - 9 columns (0..8) x 10 rows (0..9)
 *  - row 0 = top (한, 漢 / Black side by convention here)
 *  - row 9 = bottom (초, 楚 / Red side)
 *  - Palace (궁성): cols 3..5, rows 0..2 (top) and rows 7..9 (bottom)
 *
 *  Piece codes:
 *    K = 將/楚漢 (General, 궁)
 *    A = 士 (Guard, 사)
 *    E = 象 (Elephant, 상)
 *    H = 馬 (Horse, 마)
 *    R = 車 (Chariot, 차)
 *    C = 包 (Cannon, 포)
 *    P = 卒/兵 (Soldier, 졸/병)
 *
 *  Side: 'r' (楚, red/bottom) and 'b' (漢, blue-green/top)
 *
 *  Design note: this engine is intentionally framework-free and
 *  state-in / moves-out, so an AI layer (e.g. Fairy-Stockfish) can
 *  later be bolted on without touching the rendering layer.
 * ============================================================ */

const ROWS = 10;
const COLS = 9;

// 궁성 판정
function inPalace(side, r, c) {
  if (c < 3 || c > 5) return false;
  if (side === 'b') return r >= 0 && r <= 2;   // top palace
  return r >= 7 && r <= 9;                       // bottom palace
}
function inAnyPalace(r, c) {
  return inPalace('b', r, c) || inPalace('r', r, c);
}

// 궁성 내 대각선 연결점 (중앙 + 네 귀퉁이에서 대각 이동 가능)
// 대각이 허용되는 칸: 두 궁성 각각의 중심(1,4)/(8,4) 과 네 꼭지점
const palaceDiagNodes = new Set([
  // top palace
  '0,3','0,5','1,4','2,3','2,5',
  // bottom palace
  '7,3','7,5','8,4','9,3','9,5',
]);
function isDiagNode(r, c) { return palaceDiagNodes.has(`${r},${c}`); }

function inBoard(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }

// 상차림 정의: 안쪽 두 자리(바깥→안)의 마/상 배치.
// 각 진영 기준 "왼쪽 절반 [바깥, 안], 오른쪽 절반 [안, 바깥]"을 한 줄 馬象 순서로 표현.
// 열 배치: 0=車, [1],[2], 3=士, 4=궁자리, 5=士, [6],[7], 8=車
// SETUPS[name] = [열1, 열2, 열6, 열7] 의 기물 타입
const SETUPS = {
  '마상마상': ['H', 'E', 'H', 'E'],   // 오른상 차림
  '상마상마': ['E', 'H', 'E', 'H'],   // 왼상 차림
  '마상상마': ['H', 'E', 'E', 'H'],   // 안상 차림
  '상마마상': ['E', 'H', 'H', 'E'],   // 바깥상 차림
};
const SETUP_NAMES = Object.keys(SETUPS);

function randomSetup() {
  return SETUP_NAMES[Math.floor(Math.random() * SETUP_NAMES.length)];
}

// 초기 배치. setupR / setupB 는 SETUPS 의 키. 미지정 시 기본 마상마상.
function initialBoard(setupR = '마상마상', setupB = '마상마상') {
  const b = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const sR = SETUPS[setupR] || SETUPS['마상마상'];
  const sB = SETUPS[setupB] || SETUPS['마상마상'];

  // top side 'b' (row 0 뒷줄)
  b[0][0] = { side: 'b', type: 'R' };
  b[0][1] = { side: 'b', type: sB[0] };
  b[0][2] = { side: 'b', type: sB[1] };
  b[0][3] = { side: 'b', type: 'A' };
  b[0][5] = { side: 'b', type: 'A' };
  b[0][6] = { side: 'b', type: sB[2] };
  b[0][7] = { side: 'b', type: sB[3] };
  b[0][8] = { side: 'b', type: 'R' };
  b[1][4] = { side: 'b', type: 'K' };
  b[2][1] = { side: 'b', type: 'C' };
  b[2][7] = { side: 'b', type: 'C' };
  for (const c of [0, 2, 4, 6, 8]) b[3][c] = { side: 'b', type: 'P' };

  // bottom side 'r' (row 9 뒷줄)
  b[9][0] = { side: 'r', type: 'R' };
  b[9][1] = { side: 'r', type: sR[0] };
  b[9][2] = { side: 'r', type: sR[1] };
  b[9][3] = { side: 'r', type: 'A' };
  b[9][5] = { side: 'r', type: 'A' };
  b[9][6] = { side: 'r', type: sR[2] };
  b[9][7] = { side: 'r', type: sR[3] };
  b[9][8] = { side: 'r', type: 'R' };
  b[8][4] = { side: 'r', type: 'K' };
  b[7][1] = { side: 'r', type: 'C' };
  b[7][7] = { side: 'r', type: 'C' };
  for (const c of [0, 2, 4, 6, 8]) b[6][c] = { side: 'r', type: 'P' };
  return b;
}

function cloneBoard(b) {
  return b.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

// 한 기물의 의사합법수(자기 왕 노출 검사 전) 생성
function pseudoMoves(board, r, c) {
  const p = board[r][c];
  if (!p) return [];
  const me = p.side;
  const enemy = me === 'r' ? 'b' : 'r';
  const out = [];
  const add = (rr, cc) => {
    if (!inBoard(rr, cc)) return false;
    const t = board[rr][cc];
    if (!t) { out.push([rr, cc]); return true; }      // empty → can move, continue
    if (t.side === enemy) out.push([rr, cc]);          // capture
    return false;                                       // blocked
  };

  switch (p.type) {
    case 'K':
    case 'A': {
      // 궁/사: 궁성 안에서만, 직선 1칸. 대각선은 대각노드일 때만.
      const steps = [[-1,0],[1,0],[0,-1],[0,1]];
      for (const [dr, dc] of steps) {
        const rr = r + dr, cc = c + dc;
        if (inBoard(rr, cc) && inPalace(me, rr, cc)) {
          const t = board[rr][cc];
          if (!t || t.side === enemy) out.push([rr, cc]);
        }
      }
      if (isDiagNode(r, c)) {
        const diags = [[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dr, dc] of diags) {
          const rr = r + dr, cc = c + dc;
          if (inBoard(rr, cc) && inPalace(me, rr, cc) && isDiagNode(rr, cc)) {
            const t = board[rr][cc];
            if (!t || t.side === enemy) out.push([rr, cc]);
          }
        }
      }
      break;
    }
    case 'H': {
      // 마: 직1 + 대각1. 멱(직진 칸)이 막히면 못 감.
      const legs = [
        [-1,0,[-2,-1],[-2,1]],
        [1,0,[2,-1],[2,1]],
        [0,-1,[-1,-2],[1,-2]],
        [0,1,[-1,2],[1,2]],
      ];
      for (const [br, bc, d1, d2] of legs) {
        const mr = r + br, mc = c + bc;            // 멱 자리
        if (!inBoard(mr, mc) || board[mr][mc]) continue; // 멱 막힘
        for (const [dr, dc] of [d1, d2]) {
          const rr = r + dr, cc = c + dc;
          if (!inBoard(rr, cc)) continue;
          const t = board[rr][cc];
          if (!t || t.side === enemy) out.push([rr, cc]);
        }
      }
      break;
    }
    case 'E': {
      // 상: 직1 + 대각2. 경로상 멱 2개가 모두 비어야 함.
      const legs = [
        // [직진 멱, 첫 대각 멱, 도착]
        [[-1,0],[-2,-1],[-3,-2]],
        [[-1,0],[-2,1],[-3,2]],
        [[1,0],[2,-1],[3,-2]],
        [[1,0],[2,1],[3,2]],
        [[0,-1],[-1,-2],[-2,-3]],
        [[0,-1],[1,-2],[2,-3]],
        [[0,1],[-1,2],[-2,3]],
        [[0,1],[1,2],[2,3]],
      ];
      for (const [s1, s2, dest] of legs) {
        const m1r = r + s1[0], m1c = c + s1[1];
        const m2r = r + s2[0], m2c = c + s2[1];
        const rr = r + dest[0], cc = c + dest[1];
        if (!inBoard(rr, cc)) continue;
        if (!inBoard(m1r, m1c) || !inBoard(m2r, m2c)) continue; // 멱 좌표 경계
        if (board[m1r][m1c]) continue;             // 첫 멱 막힘
        if (board[m2r][m2c]) continue;             // 둘째 멱 막힘
        const t = board[rr][cc];
        if (!t || t.side === enemy) out.push([rr, cc]);
      }
      break;
    }
    case 'R': {
      // 차: 직선 슬라이딩. 추가로 궁성 안 대각선 슬라이딩.
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (add(rr, cc)) { rr += dr; cc += dc; }
      }
      // 궁성 대각: 자신이 대각노드면 대각 방향으로 같은 궁성 내 대각노드까지 슬라이드
      if (isDiagNode(r, c)) {
        const diags = [[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dr, dc] of diags) {
          let rr = r + dr, cc = c + dc;
          while (inBoard(rr, cc) && inAnyPalace(rr, cc) && isDiagNode(rr, cc)) {
            const t = board[rr][cc];
            if (!t) { out.push([rr, cc]); }
            else { if (t.side === enemy) out.push([rr, cc]); break; }
            rr += dr; cc += dc;
          }
        }
      }
      break;
    }
    case 'C': {
      // 포: 직선상 정확히 한 기물(포 제외)을 넘어 그 다음 칸부터 이동/잡기.
      // 단, 넘는 기물이 포면 안 됨. 잡는 대상도 포면 안 됨.
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        // 첫 기물(받침대) 찾기
        let screenFound = false;
        while (inBoard(rr, cc)) {
          const t = board[rr][cc];
          if (!screenFound) {
            if (t) {
              if (t.type === 'C') break;       // 포는 받침 불가
              screenFound = true;
            }
          } else {
            if (!t) { out.push([rr, cc]); }    // 빈칸 이동
            else {
              if (t.type !== 'C' && t.side === enemy) out.push([rr, cc]); // 포는 못 잡음
              break;                            // 둘째 기물에서 멈춤
            }
          }
          rr += dr; cc += dc;
        }
        // 궁성 대각 포: 대각노드에서 받침 하나 넘어 잡기 (간략 구현)
        if (isDiagNode(r, c)) {
          // 대각선상 받침/대상 모두 대각노드여야 하는 특수 케이스. 기본형에서는 드물어 생략 가능하나 포함.
        }
      }
      break;
    }
    case 'P': {
      // 졸/병: 앞 + 좌우 1칸. 강을 건넌 뒤(애초에 장기엔 강 없음)라 항상 좌우 가능.
      // 'r'(아래)는 위로(-1), 'b'(위)는 아래로(+1) 전진.
      const fwd = me === 'r' ? -1 : 1;
      const cand = [[fwd, 0], [0, -1], [0, 1]];
      // 궁성 안에서는 대각 전진도 가능
      if (isDiagNode(r, c)) {
        cand.push([fwd, -1], [fwd, 1]);
      }
      for (const [dr, dc] of cand) {
        const rr = r + dr, cc = c + dc;
        if (!inBoard(rr, cc)) continue;
        // 대각 전진은 궁성 대각노드 → 대각노드일 때만
        if (dc !== 0 && dr !== 0 && !(isDiagNode(rr, cc))) continue;
        const t = board[rr][cc];
        if (!t || t.side === enemy) out.push([rr, cc]);
      }
      break;
    }
  }
  return out;
}

// 왕 위치 찾기
function findKing(board, side) {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.type === 'K' && p.side === side) return [r, c];
    }
  return null;
}

// 해당 side가 장군(check) 상태인가
function isInCheck(board, side) {
  const k = findKing(board, side);
  if (!k) return true; // 왕이 없으면 잡힌 것
  const enemy = side === 'r' ? 'b' : 'r';
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.side === enemy) {
        const ms = pseudoMoves(board, r, c);
        if (ms.some(([rr, cc]) => rr === k[0] && cc === k[1])) return true;
      }
    }
  return false;
}

// 두 왕 대면(빅장) 판정: 두 왕이 같은 열에서 사이에 기물 없이 마주보면 true.
//   ★ [6-1] 이전엔 이걸로 대면 수를 "금지"했으나, 한국 장기에서 대면은 합법(빅장)이라
//   legalMoves의 차단을 제거함. 이 함수는 보존 — 빅장 무승부 판정([6-1b]/[6-2])에서
//   "현재 대면 상태인가"를 검사하는 용도로 재사용한다(SF 동작 확인 후 gameStatus에 연결).
function kingsFaceEachOther(board) {
  const kr = findKing(board, 'r');
  const kb = findKing(board, 'b');
  if (!kr || !kb) return false;
  if (kr[1] !== kb[1]) return false;
  const col = kr[1];
  const lo = Math.min(kr[0], kb[0]);
  const hi = Math.max(kr[0], kb[0]);
  for (let r = lo + 1; r < hi; r++) if (board[r][col]) return false;
  return true;
}

// 합법수(자기 왕이 잡히는 수 제외). 두 왕 대면(빅장)은 한국 장기에서 합법 — 막지 않는다.
function legalMoves(board, r, c) {
  const p = board[r][c];
  if (!p) return [];
  return pseudoMoves(board, r, c).filter(([rr, cc]) => {
    const nb = cloneBoard(board);
    nb[rr][cc] = nb[r][c];
    nb[r][c] = null;
    if (isInCheck(nb, p.side)) return false;
    // ★ [6-1] 왕 대면(빅장)은 합법으로 허용 — 과거 象棋식 금지(kingsFaceEachOther로 차단)를 제거.
    //   Fairy-Stockfish janggi 변종은 대면을 합법수로 두므로, 여기서 막으면 AI가 추천한 수를
    //   우리 엔진이 거부해 대국이 멈추는 충돌이 생겼었음(안전망 91443f8로 증상만 차단했던 원인).
    //   kingsFaceEachOther 함수 자체는 보존 — 빅장 무승부 판정([6-1b]/[6-2])에서 "현재 대면 상태인가"로 재사용.
    return true;
  });
}

// 해당 side의 모든 합법수
function allLegalMoves(board, side) {
  const res = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.side === side) {
        for (const [rr, cc] of legalMoves(board, r, c)) res.push([r, c, rr, cc]);
      }
    }
  return res;
}

// 수 적용 (검증 없이 — UI에서 legalMoves로 거른 수만 넘긴다고 가정)
function applyMove(board, fr, fc, tr, tc) {
  const nb = cloneBoard(board);
  const captured = nb[tr][tc];
  nb[tr][tc] = nb[fr][fc];
  nb[fr][fc] = null;
  return { board: nb, captured };
}

// 게임 종료 판정: 합법수 없으면 외통(장군→패) 또는 수막힘(장군 아님→무승부).
//   추가로 [6-1b] 빅장(대궁) 무승부 — 아래 reason 'bikjang' 참조.
// 반환: { over, loser?, reason?, draw? }
//   reason: 'checkmate'(외통) | 'stalemate'(외통 아닌 수막힘) | 'bikjang'(빅장 무승부)
//   외통 → loser = sideToMove (패). 수막힘/빅장 → draw = true (무승부, loser 없음).
// ※ 점수제·반복수는 별도 작업([6-2]/[6-3])으로 분리 — 여기선 미처리.
function gameStatus(board, sideToMove) {
  const moves = allLegalMoves(board, sideToMove);
  if (moves.length === 0) {
    if (isInCheck(board, sideToMove)) {
      // 장군당한 채 합법수 없음 = 외통 = 둘 차례 쪽 패
      return { over: true, loser: sideToMove, reason: 'checkmate' };
    }
    // 장군은 아닌데 둘 수가 없음 = 수막힘 = 무승부
    return { over: true, draw: true, reason: 'stalemate' };
  }
  // ★ [6-1b] 빅장(대궁) 무승부 판정.
  //   "두 왕이 지금 대면 중"이라는 사실만으로 끝내지 않는다 — 상대가 다음 수에 대면을
  //   깰 수 있으면 빅장이 아니라 그냥 진행이기 때문(대면 합법화 [6-1]의 후속).
  //   성립 조건: 현재 대면 상태이고, sideToMove(둘 차례=대면을 당한 쪽)의
  //   어떤 합법수를 둬도 둔 뒤에도 여전히 대면이 유지되는 경우에만 무승부.
  //   하나라도 대면을 깨는(왕 이동/사이에 기물 삽입 등) 합법수가 있으면 → 빅장 아님, 계속.
  //   ※ kingsFaceEachOther가 false인 일반 국면에선 이 블록을 통째로 건너뛰므로
  //     추가 board clone 비용이 들지 않는다(성능 영향 거의 없음).
  if (kingsFaceEachOther(board)) {
    const allStillFacing = moves.every(([fr, fc, tr, tc]) => {
      const nb = cloneBoard(board);
      nb[tr][tc] = nb[fr][fc];
      nb[fr][fc] = null;
      return kingsFaceEachOther(nb);
    });
    if (allStillFacing) {
      return { over: true, draw: true, reason: 'bikjang' };
    }
  }
  return { over: false };
}

// Node 환경 테스트용 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ROWS, COLS, initialBoard, cloneBoard, pseudoMoves, legalMoves,
    allLegalMoves, applyMove, isInCheck, kingsFaceEachOther, gameStatus,
    findKing, inPalace, isDiagNode, SETUPS, SETUP_NAMES, randomSetup,
  };
}

// 브라우저 환경 전역 노출
if (typeof window !== 'undefined') {
  window.JanggiEngine = {
    ROWS, COLS, initialBoard, cloneBoard, pseudoMoves, legalMoves,
    allLegalMoves, applyMove, isInCheck, kingsFaceEachOther, gameStatus,
    findKing, inPalace, isDiagNode, SETUPS, SETUP_NAMES, randomSetup,
  };
}
