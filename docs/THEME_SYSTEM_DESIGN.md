# 장기 테마 시스템 + 진영 분리 설계

> 한림·데이지·루미 합의안. 코드 작업 전 박제용 설계 문서.
> 작업 들어갈 때 이 문서를 먼저 연다.

---

## 핵심 원칙 (★ 절대 어기지 않기)

1. **엔진 type 키는 그대로 유지**: `K`(궁/장) `R`(차) `H`(마) `E`(상) `C`(포) `A`(사) `P`(졸/병)
   - engine.js는 검증 완료된 룰 계산기. 외형 바꾸자고 절대 건드리지 않는다.
   - `general/cha/ma` 같은 "예쁜 키" 금지. 무조건 엔진 키.
   - engine.js는 앞으로도 K/R/H/E/C/A/P만 본다.
2. **테마 = 외형 묶음, 진영 선택 = 배치 결정**. 이 둘을 분리한다.
   - `side`(r/b)는 **보드상의 자리**일 뿐 (r=아래/선공, b=위).
   - 실제 세력은 `sideFaction[side]`가 결정.
3. **하드코딩 금지**: 코드에서 직접 `"초(楚)"`, `"한(漢)"`, `red`, `teal`, `board-bg.png`를
   쓰지 않는다. 항상 현재 테마/faction에서 꺼내 쓴다.

---

## 데이터 구조

```js
const THEMES = {
  baekja: {
    name: '백자',
    bg: 'board-bg.png',          // 1차: 모든 테마가 공유. 필드는 열어둔다.
    factions: {
      chu: {
        name: '초(楚)', shortName: '초',
        color: '#1f4e5f',        // 코드 기존값 --blue (청록). 루미 #2f7f82 아님.
        pieces: {                // 엔진 키 그대로
          K: 'pieces/baekja/chu/K.png',
          R: 'pieces/baekja/chu/R.png',
          H: 'pieces/baekja/chu/H.png',
          E: 'pieces/baekja/chu/E.png',
          C: 'pieces/baekja/chu/C.png',
          A: 'pieces/baekja/chu/A.png',
          P: 'pieces/baekja/chu/P.png',
        },
        hanja: { K:'楚', R:'車', H:'馬', E:'象', C:'包', A:'士', P:'卒' },
      },
      han: {
        name: '한(漢)', shortName: '한',
        color: '#9e2b25',        // 코드 기존값 --red (빨강). 루미 #a63b32 아님.
        pieces: {
          K: 'pieces/baekja/han/K.png',
          R: 'pieces/baekja/han/R.png',
          H: 'pieces/baekja/han/H.png',
          E: 'pieces/baekja/han/E.png',
          C: 'pieces/baekja/han/C.png',
          A: 'pieces/baekja/han/A.png',
          P: 'pieces/baekja/han/P.png',
        },
        hanja: { K:'漢', R:'車', H:'馬', E:'象', C:'包', A:'士', P:'兵' },
      },
    },
  },
};
```

### 게임 상태

```js
let currentThemeId = 'baekja';
let sideFaction = { r: 'chu', b: 'han' };  // 진영 선택에서 뒤집힘
// 한 진영을 아래로 고르면: { r:'han', b:'chu' }
```

### 꺼내 쓰는 표준 흐름

```js
const theme = THEMES[currentThemeId];
const p = board[y][x];                       // p.type 은 엔진 키 (K/R/H/E/...)
const faction = theme.factions[ sideFaction[p.side] ];
const img   = faction.pieces[p.type];        // 이미지 경로
const glyph = faction.hanja[p.type];         // 표시 글자
const color = faction.color;                 // 진영 색
```

---

## 세 가지 결정 (합의 완료)

### 1. side ↔ faction 분리 — 채택
- `r/b`는 보드 자리, `sideFaction`이 세력 매핑.
- 진영 선택(인수인계서 작업 A)은 결국 `sideFaction`을 뒤집는 일이 됨 → 가벼워짐.
- 한 vs 초든 조선 vs 일본이든 "누가 아래냐"는 진영 선택이 결정.

### 2. 기물 식별 — (a) 형상 + 작은 문자 병기
- 장기는 기물 기능 구분이 게임성의 핵심. 멋보다 판독성 우선.
- 메인 형상은 테마 스타일, 중앙/하단에 아주 작은 표식 문자(車馬象包士卒將).
- 조선/일본 테마라도 기능 문자는 유지. (한글 모드 차/마/상/포/사/졸/장 옵션 여지)
- 순수 형상만으로 7종 구분 X → "형상 + 작은 글자로 확정".

### 3. 배경 — 1차는 공유 배경 1개
- `theme.bg` 필드는 열어두되, 모든 테마가 기본 `board-bg.png` 공유.
- 테마마다 배경 바꾸면 매번 재검수 필요(중앙 비움/격자 충돌/가독성/180도 회전/위아래 뒤집힘).
- 여유 생기면 `theme.bg`만 바꿔 확장.

---

## 코드 작업 시 손대야 할 곳 (index.html, engine.js 제외)

테마/진영 분리하면 아래 하드코딩들을 전부 faction 참조로 교체해야 함:

- **PIECE_IMG 매핑** (~524줄) → `faction.pieces[type]`
- **HANJA 매핑** (~518줄) → `faction.hanja[type]`. side가 아니라 faction에 묶여야
  "초가 위로 가도 卒/兵 글자가 진영 따라감".
- **합법수 점 색** `.dot-r`/`.dot-b` CSS (~211줄) → 지금은 side에 색 박힘.
  faction.color를 인라인 스타일 또는 CSS 변수로 동적 적용하도록 리팩토링.
- **상태창/기보/승리 메시지**의 `"초(楚)"`/`"한(漢)"` 문구 → `faction.name`.
- **상차림 제목** "초(楚)의 상차림을 고르세요" → faction.name.
- **기보 글자색** `.mv-r`/`.mv-b`, **잡은 기물 칩** 색 → faction.color 기준.

주의: `captured.r`/`captured.b`, `turn==='r'` 같은 **자리 기준 로직은 그대로**.
바뀌는 건 "그 자리를 어떤 세력으로 그리느냐"뿐.

---

## 작업 순서 제안

1. THEMES 구조 + sideFaction 상태 추가 (뼈대).
2. render/HANJA/색을 faction 참조로 교체 (엔진 키 유지하므로 엔진 무관).
3. 진영 선택 UI를 상차림 선택 흐름에 연결 (작업 A) — sideFaction 뒤집기 + 배경 180도 회전.
4. (이후) 새 테마는 THEMES에 항목 추가 + pieces PNG만 떨구면 끝. 코드 변경 없음.

## 에셋 폴더 규칙

```
pieces/
  baekja/
    chu/  K.png R.png H.png E.png C.png A.png P.png
    han/  K.png R.png H.png E.png C.png A.png P.png
  joseon/        (예: 조선 vs 일본 — 나중에)
    joseon/ ...
    japan/  ...
```
현재 기존 PNG(01_CHU_GENERAL_JANG.png 등)는 baekja 테마로 재배치하거나,
PIECE_IMG 매핑만 새 폴더 규칙으로 바꿔 옮기면 됨.

---

## 승/패 표시 원칙 (네트워크 대비 — 확정)

- 승리 오버레이는 2층: 작은 줄 "한(漢) 승리"(누가 이겼나 + 진영색), 큰 줄 "승리/패배"(내 관점).
- **승/패는 playerFaction 관점**으로 표시. playerFaction = "이 화면의 주인".
  - AI 모드: 플레이어 기준으로 명확.
  - 네트워크 플레이: 클라이언트별로 playerFaction을 다르게 주면 각자 화면에 자기 기준 승/패가 뜸. 이 구조를 지금 박아두면 네트워크 가서 그대로 작동.
  - 로컬 PC vs PC: 화면 아래 앉은 사람(playerFaction) 기준.
- 진영 정보(누가 이겼나)와 관점(내가 이겼나)을 분리해서 둘 다 보관 → 네트워크의 토대.

## 아이디어 뱅크 (나중에 검토)

1. **진영 선택 카드 순서**: 재대국 자동배정이 한이면 한 카드를 먼저(왼쪽) 표시. 첫 판은 초 먼저(전통 선수). 작은 UX 디테일.
2. **AI 난이도 따라 자동선택**: 자동선택 시 AI 난이도에 따라 플레이어 진영/핸디캡 결정. AI 작업(B)과 함께.
3. **레이팅 동점 처리**: 동점이면 동전 던지기로 선후공(공수 순서) 결정.
4. **MMR 기반 진영 배정**: 점수차가 나면 높은 쪽이 한(후수, 핸디캡). "이긴 쪽이 한" 규칙의 확장 — 실력 높은 쪽이 불리한 후수를 갖는 핸디캡 철학.
   - 3·4는 네트워크/레이팅 시스템 도입 시. 핸디캡 철학이 "이긴 쪽이 한"과 일관됨.
