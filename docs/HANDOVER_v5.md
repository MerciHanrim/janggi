# 한국 장기(Janggi) 웹 게임 — 인수인계서 v5

> Cozy Shelter 블로그(cozyshelter.tistory.com) 임베드를 염두에 둔 한국 장기 위젯.
> 한림(데이지=Claude 호칭, 반말 사용)과 함께 개발. "루미"는 한림이 병행 사용하는 별도 AI(이미지 생성·디자인 자문).
> v5는 v4 이후 **AI 대국 통합 + Netlify 배포 + 강도/속도 외부 검증** 세션을 반영한다.
> 작업 들어갈 때 이 문서를 먼저 연다. (배경=PROJECT_NOTES.md, 테마 설계=THEME_SYSTEM_DESIGN.md)

---

## 0. 작업 환경 메모 (★ 다음 세션 데이지가 먼저 알 것)

- **샌드박스 네트워크 차단됨**: WASM 다운로드·시각 스크린샷 등 외부 의존 작업은 이 환경에서 못 돌림. 코드 편집·`node` 문법검증·로컬 로직 검산은 가능.
- **시각 검증은 한림이 로컬에서**: 변경 후 한림이 로컬 서버로 띄워 스크린샷 올려줌. 데이지는 정적 검산(로직 시뮬레이션, 경로 대조, 중괄호 짝, id↔getElementById)으로 보조.
- **검증 방식**: 매 수정 후 `node --check`로 JS 파싱 + 중괄호/괄호 짝. 경로 하드코딩 grep + 실제 파일 교차검증(대소문자까지). HTML id ↔ JS getElementById 매칭. engine.js를 node require해서 가짜 판으로 로직 시뮬레이션.
- **로컬 경로**: `C:\Work Space\Coding\1_Ongoing\Janggi` (한 폴더 = 한 저장소 = github.com/MerciHanrim/janggi).
- 파일 타임스탬프: 한림 PC는 KST(UTC+9), 샌드박스는 UTC. 같은 파일 다른 시각일 뿐.
- **커밋 메시지 규칙**: 제목은 영어 한 줄, 본문은 한글 상세. 이미 push된 커밋은 소급 수정 안 함.
- ⚠️ **콘솔 한글 깨짐**: 윈도우 cmd는 한글 커밋 메시지 깨짐(표시상 에러일 뿐 커밋·push는 정상). `chcp 65001` 먼저 치면 완화. PowerShell/Git Bash 권장.
- **로컬 AI 테스트 서버**: `serve.py`(COOP/COEP 헤더 주는 로컬 서버). `python serve.py` → localhost:8000. 일반 `http.server`는 COOP/COEP를 못 줘서 멀티스레드 엔진(SharedArrayBuffer)이 안 깨어남 — AI 테스트는 반드시 serve.py로.

---

## 1. 현재 완성 상태 (✅ 동작)

**기능**: 룰 엔진, 상차림 4종+자동, 합법수 표시, 잡기, 무르기, 기보, i18n(한/영), 진영 선택(초/한)→상차림 흐름, 대국 시작 안개 연출, 항복, 승/패 2층 표시, 재대국 자동배정, 장군 표시(문구+궁 강조+소리+버스트+중앙글자), 외통/무승부 구분, 제한시간 구조(ruleOptions). **AI 대국(Fairy-Stockfish WASM)**. 반응형. **Netlify 배포 라이브**.

**★ 배포 (라이브)**:
- **주소: https://janggi-game.netlify.app**
- Netlify 계정 pieceofspring@gmail.com, 팀 pieceofspring's team.
- **GitHub 연동 배포** (MerciHanrim/janggi, main 브랜치). push 하면 **자동 재배포**. mj님 피드백 루프 돌리기 좋음.
- COOP/COEP 헤더는 `_headers` + `netlify.toml` 둘 다 루트에 둠 → `crossOriginIsolated: true` 확인됨(SharedArrayBuffer 켜짐 = 멀티스레드 엔진 동작).
- ⚠️ **GitHub Pages 안 씀**: Pages는 COOP/COEP 헤더를 못 줘서 멀티스레드 WASM이 안 깨어남. 그래서 Netlify로 감.
- ⚠️ **임베드 금지**: 티스토리·네이버 카페는 부모 페이지 COOP/COEP를 우리가 못 줘서, iframe 안에선 AI가 안 깨어남. 블로그/카페엔 **URL 링크만** 걸 것(iframe 임베드 X). Cozy Shelter 장기 소개 글도 링크 방식으로 수정 완료.

---

## 2. 이번(v5) 세션 변경 — AI 대국 통합

### 변경 A. Fairy-Stockfish NNUE WASM 통합 ✅ (배포 환경에서 16수+ 정상 대국 확인)

**받은 엔진**: `fairy-stockfish-nnue.wasm` 1.1.11 (GPL-3.0, 멀티스레드 빌드). `assets/engine/`에 3개 배치:
- `stockfish.js` (로더/글루, ~64kB)
- `stockfish.wasm` (엔진 바이너리, NNUE 내장, ~1.64MB)
- `stockfish.worker.js` (워커, ~3.3kB)
- (uci.js·package.json은 참고용, 미배치)
- ⚠️ `ffish`/`ffish-es6`(룰 라이브러리)와 혼동 금지 — 우리가 받은 건 AI 검색 엔진. 룰은 engine.js가 그대로 담당.

**ai-adapter.js 신설** (★ AI 통신은 여기로 분리, script.js에 안 섞음):
- `window.JanggiAI.bestMove(board, turn, depth)` → Promise로 `[fr,fc,tr,tc]` 반환.
- UCI 프로토콜(UCCI 아님). `setoption name UCI_Variant value janggi`.
- **stockfish.js는 AI 첫 수 때 동적 로드** (`loadStockfishScript`). 페이지 로드 시 즉시 로드하면 멀티스레드 로더가 전체 JS 실행을 멈추는 문제가 있어, 첫 수 시점으로 미룸.
- `window.aiMove()` 콘솔 디버그 안전장치.

**좌표 매핑 (★ 로컬 node 실측 완료, SF와 일치 확인)**:
- 우리 [r,c] (r:0=위/한, 9=아래/초; c:0~8) → UCI: file='a'+c, rank=ROWS-r (r=9→rank1, r=0→rank10). 두 자리 rank(a10) 파싱 처리.
- FEN: 대문자=초(r), row0(위)부터. 기물문자 R/n(馬)/b(象)/a(士)/k(將)/c(包)/p(卒). side-to-move 초='w', 한='b'.
- SF janggi startpos FEN가 우리 '마상상마' 상차림과 글자단위 일치 확인. SF bestmove가 우리 합법수에 포함됨도 확인.
- SF 변종: janggi 외 janggicasual/janggimodern/janggitraditional 존재(빅장·점수제 향후 카드). NNUE 런타임 로드는 강도 조절 시 추후.

**script.js 배선**:
- 전역: `aiSide`(AI 자리 r/b/null), `aiThinking` 플래그, `AI_DEPTH = 12`.
- 진영 선택 시 사람 진영의 **반대편을 aiSide로 자동 배정**. 사람은 자기 진영 상차림만 고르고, AI 쪽은 무작위 자동(셋업 한 단계 축소).
- `maybeAiMove()`/`runAiTurn()`: doMove 끝·beginGame 끝·undo 끝에서 트리거. AI 수도 selected 세팅 후 **doMove 경유** → 연출·소리·장군·기보 자동.
- AI 대국 시 undo는 두 수 되감기(사람+AI), aiThinking 중엔 무르기 차단.
- i18n 추가(ko/en): aiThinking, aiWaking, aiFailLong, aiRetry, aiWatch, perspMine/perspAi/perspHuman.

### 변경 B. AI 강도 + 생각시간 (외부 검증 완료)

- **AI_DEPTH = 12** (탐색 깊이, 중수 수준). Skill Level은 **미적용** — "한 번에 한 변수" 원칙으로 depth만 조정.
- **최소 생각 시간 = 2500~4000ms 랜덤** (`runAiTurn`의 `minThinkMs`). 계산이 빨리 끝나도 그 시간 동안 "상대가 수를 고르고 있습니다 ···" 유지 후 착수(`commitMove`). 매번 랜덤이라 사람이 수마다 다르게 고민하는 호흡.
  - ※ 처음 1.5~2.5초로 넣었으나, mj님(외부 테스터) "거침없이 빠르다"(=망설임 없어 기계 같음) 피드백 받고 2.5~4초로 상향.
- **★ 강도 외부 검증 (mj님, 10년 만에 두는 중급자)**: "컴퓨터 실력 = 적당함, 중급은 된다. 본인은 무조건 진다." → **depth 12가 중급자 기준 '적당'으로 검증됨.** 난이도 메뉴 없이 중수 하나로 가는 방향 확정. (단 한림=초보 기준으론 못 이기는 강도. 강도 폭이 필요하다는 데이터로 쌓아둠 — 난이도는 모드 메뉴 작업 때 재논의.)

### 변경 C. 우측 패널 가독성 (루미 3차 피드백)

- **차례 줄**: 1.6rem, font-weight 800 (우측 패널 최대 정보, "0.5초 안에 누구 차례인지").
- **관점 줄**: "당신이 둘 차례입니다" / "상대가 수를 고르고 있습니다 ···" — 내 차례=청록 강조, AI 차례=수묵 점 세 개 애니메이션(`ai-dots`, 스피너 대신).
- **상태창 상단 먹색 강조선** 3px (차례색: 초=청록/한=인주). 기보창과 시각 무게 분리.
- **보조 텍스트 확대 + 대비** (고연령 사용자 — 장기 사용자층): 새 색 변수 `--ink-read`(#3a352f, ink-soft보다 진함). 내 진영 설명 0.9rem, 잡은 기물 라벨 0.78rem, 기보 제목 0.86rem, 기보 본문 0.88rem, 빈줄 0.86rem.
  - ※ 루미 통찰: "글자 키우기보다 대비 올리기가 체감 효과 더 클 수도." 크기는 +1~2px만, 대비를 같이 올림.
- **버튼 차등**: 무르기=강조(700) / 처음부터=보통(600) / 돌 던지기=옅게+인주빛(opacity 0.8, transparent). `white-space:nowrap`로 줄바꿈 해결.
- **패널 폭**: board-col flex 3→2.7, side-panel min-width 232px. 기보 max-height 260→305px. (여백은 채우지 않고 유지 — 루미: 수묵화 여백 살리기, "대공사 아닌 polish".)
- 영어 문구 "Select a piece to move" → "Select a piece" (루미: 짧고 체스 UI 느낌).

---

## 3. ★★★ 알려진 이슈 / 미해결 (다음 세션 주의)

### ★ 미해결 근본 버그: SF가 우리 룰상 불법인 수를 고집 → 대국 멈춤

- **증상**: 특정 중반 국면에서 SF(엔진)가 낸 bestmove가 우리 engine.js 합법수에 없어서 막힘. 재시도(다시 깨우기)해도 같은 수를 고집 → 대국이 그 자리서 완전히 멈춤.
- **재현된 케이스 (2026-06-01)**: AI가 두려던 수 = `[1,4,2,5]` (한(漢)의 궁을 궁성 [1,4]→[2,5]로 이동). 한림이 17수에 궁을 옮긴(`楚59→69`) 직후 한 차례에서 발생. 16수까진 정상이었음.
- **원인 추정**: SF의 janggi 구현과 우리 engine.js의 **빅장/장군 판정이 갈리는 지점**. 빈 판에선 `[1,4]→[2,5]`가 우리 룰상 합법인데(node 검증), 그 실제 국면에선 우리 `legalMoves`(장군 필터 포함)가 그 수를 제거함 → 즉 그 수가 우리 룰상 "자기 왕을 위험에 빠뜨리는 수"(빅장/장군 노출)로 걸렸을 가능성. SF는 그 변종에선 합법으로 보고 고집.
- **현재 처리 = 안전망(증상 차단)만**: `commitMove`에서 SF 수가 우리 합법수에 없으면 → **우리 `allLegalMoves` 중 하나를 둠**(잡는 수 우선 → 없으면 임의). 합법수가 있는 한 대국이 절대 안 멈춤. (커밋 91443f8)
  - 이 안전망으로 정상 대국에선 실패 UI("AI 깨우는 중")가 더는 안 뜸. 루미가 지적한 "정상 대국에 깨우는 중 박스가 뜨는 시각 혼란"도 자동 해결됨.
- **★ 근본 해결은 추후**: engine.js의 빅장 처리(`kingsFaceEachOther`가 대궁을 금지수로 막는 것)를 SF 기준(빅장=합법수+무승부 메커니즘)과 일치시켜야 함. 이건 5-E(빅장+점수제) 작업과 엮임. 그때 같이.

### 기타
- favicon.ico 404, assets/sound/move.mp3·check.mp3 404는 **정상**(favicon 없음, 사운드는 Web Audio 합성 폴백 신호). 게임 무관.

---

## 4. 파일 구조

```
Janggi/  (= github.com/MerciHanrim/janggi, Netlify 연동)
├─ index.html              마크업 + CSS/JS 링크. (#turnPersp 관점 줄 추가됨)
├─ style.css               전체 스타일. (가독성·--ink-read·ai-dots·버튼 차등 반영)
├─ script.js               게임로직·렌더·i18n·핸들러·연출·사운드·시계·AI 배선.
├─ engine.js               순수 룰 엔진. window.JanggiEngine. ★최소 수정만.
├─ ai-adapter.js           ★ 신설. window.JanggiAI. SF WASM 통신(UCI), 좌표/FEN 변환, stockfish.js 동적 로드.
├─ serve.py                ★ 신설. 로컬 COOP/COEP 헤더 서버(AI 테스트용). python serve.py → :8000.
├─ _headers                ★ 신설. Netlify COOP/COEP (cross-origin isolation).
├─ netlify.toml            ★ 신설. Netlify 빌드 설정(publish=".") + 헤더.
│
├─ assets/
│  ├─ board/   board-bg.png  board-bg-flip.png
│  ├─ pieces/baekja/chu|han/   K R H E C A P .png   (초=청록, 한=인주, 1024px 투명)
│  ├─ sound/   (check.mp3 move.mp3 — 현재 없음, 합성 폴백)
│  ├─ engine/  stockfish.js  stockfish.wasm  stockfish.worker.js  ★ 배치됨
│  └─ ui/      (.gitkeep)
│
├─ docs/   HANDOVER_v5.md  THEME_SYSTEM_DESIGN.md  PROJECT_NOTES.md
├─ README.md  LICENSE(GPLv3)  ASSETS_LICENSE.md  .gitignore
```
※ `.tgz` 원본 압축은 저장소 밖(추적 안 됨)에 둠.
⚠️ AI 테스트는 `python serve.py`로(COOP/COEP 필요). 일반 http.server는 헤더 없어 AI 안 깨어남.

## 5. 핵심 설계 규칙 (★ 절대 헷갈리면 안 됨)

### 진영·색·위치 (★★★ 최종)
- **초(楚) = 청록 = 코드 `'r'` = 아래 기본 = 선수**(엔진 turn='r'로 시작, 불변)
- **한(漢) = 인주 빨강 = 코드 `'b'` = 위 기본 = 후수**
- ⚠️ 변수명 `r`/`b`지만 색은 r=청록, b=빨강 (과거 잔재). CSS `--blue:#1f4e5f`(청록=초), `--red:#9e2b25`(빨강=한).
- HANJA: `r:{K:'楚',P:'卒'...}`, `b:{K:'漢',P:'兵'...}`.

### 선수 vs 화면배치 분리
- 선수는 언제나 초(turn='r') — 엔진 불변. 진영 선택 = `flipped` 토글(화면 상하만). `playerFaction`('chu'|'han') = "이 화면의 주인", 승/패는 이 관점(네트워크 대비).

### AI 배선 (★ v5)
- AI 통신은 ai-adapter.js로 분리. script.js는 `window.JanggiAI.bestMove()`만 호출.
- AI 수도 doMove 경유 → 연출·소리·장군·기보 자동(누가 두든 동일 경로).
- **안전망 필수**: SF 수가 우리 합법수에 없을 수 있음(3번 참조). commitMove에서 항상 검증 후, 불법이면 우리 allLegalMoves로 대체. 이 안전망 제거 금지.

### 장군은 파생값
- `Eng.isInCheck(board, side)`로 매 render/refreshStatus 재계산. 별도 플래그 저장 금지. (상시 강조=파생값, 소리·버스트=이벤트는 doMove에서만.)

## 6. 다음 작업 (우선순위) — ★ 다음 세션 시작점

> AI 대국·배포·강도검증 완료. 다음은 **mj님 추가 피드백 → 모드 메뉴 → 튜토리얼** 흐름.

### A. mj님 피드백 수렴 (진행 중)
- 생각시간 2.5~4초 상향한 버전에 대한 mj님 추가 반응 받기. (강도는 "적당" 검증됨 → 유지.)
- 한림(초보)은 depth 12를 못 이김. mj님(중급)은 "적당". → 강도 폭(난이도)이 필요한지 판단할 데이터. 난이도는 아래 모드 메뉴 작업 때 같이 결정.

### B. 대국 방식 모드 메뉴 ("입구를 정돈하는 현관" — 루미 설계, 합의 완료)
- **컨셉**: 난이도 메뉴와 달리 다실 톤을 안 해침. "오늘은 어떻게 두실까요?"
- **위치**: 진영 선택 **앞**. (진영 선택 화면 안에 넣지 않음 — 한 화면이 역할 과다.)
- **메뉴명은 직관적으로, 다실 감성은 설명문에.** (메뉴명 "컴퓨터와 두기", 설명문 "조용한 상대와 한 판 둡니다".)
- **항목 (3~4칸)**:
  - 컴퓨터와 두기 / Play with Computer — "조용한 상대와 한 판 둡니다" (활성)
  - 장기 배우기 / Learn Janggi — "기물의 길을 하나씩 익힙니다" (튜토리얼, 아래 C)
  - 사람과 두기 / Play with Someone — `준비 중` (네트워크, 향후)
  - 복기하기 / Review Game — `준비 중`
- **준비 중 항목**: 흐리게 보여주되, 클릭 시 "아직 준비 중입니다" 안내(무반응 금지).
- 구현은 startSetup→chooseFaction 흐름에 한 단계 앞에 끼우는 작업.
- ★ 난이도 메뉴: 1차엔 안 만듦(다실 컨셉, 한번 넣으면 빼기 어려움 — 루미). 필요해지면 작명은 숫자·계급 아닌 분위기("기객: 초심자/익숙한 벗/노련한 기객").

### C. 튜토리얼 / 장기 배우기 (모드 메뉴 B에 연결, 큰 작업)
- 기물 행마법, 멍군 용어 설명, 초보자 가이드. engine.js의 `legalMoves`를 재활용해 "이 기물 누르면 갈 수 있는 곳 표시" 가능.
- 한림 강점(QA·교육적 설명)과 맞물림. 한 세션 통째 들어갈 작업.

### D. 빅장 + 점수제 룰 묶음 (별도 큰 작업) — ★ 근본 버그(3번)와 연결
- 빅장(대궁 무승부)은 금지수가 아니라 합법수+무승부 메커니즘. engine.js `kingsFaceEachOther`가 대궁을 금지수로 막는 것을 SF 기준과 일치시켜야 함 → **3번의 근본 버그가 여기서 해결됨.**
- 빅장·소삼능·점수 계산·실시간 점수 표시·반복수·시간종료 점수비교가 다 "점수제"에 엮임. 한 번에.
- ※ mj님 외부 검증: 이 묶음(빅장 제안·수용·거부, 소삼능, 점수)을 사용자도 원함 확인. SF 변종 janggicasual/modern/traditional이 카드가 될 수 있음.

### 아이디어 뱅크
- ★ **장기판 배경 선택** (mj님 새 제안): 무지/화이트/실물 장기판/산수화/십장생/한·초 지도/인물 등. 테마 시스템(THEME_SYSTEM_DESIGN)의 좋은 첫 진입점 — 배경은 이미 교체 가능 구조라 고르는 UI만 붙이면 됨.
- ★ **시간 설정 UI**: ruleOptions.timeMode/baseSeconds 켜는 UI. 1-f에서 로직·구조 완료, UI만. + 피셔/초읽기 확장. (mj님도 시간제한·피셔 원함.)
- ★ **모바일 UX**: 세로(판 작아 가독성↓)/가로(아랫줄 잘림·패널 좁아짐) 둘 다 이슈. 레퍼런스=Chess.com 모바일(판 최대화+하단 탭바). 단 AI 캐릭터 방향은 우리 수묵화 톤과 달라 구조만 참고.
- ★ **음원 파일 교체**: assets/sound/check.mp3·move.mp3 넣으면 합성음 대신 자동(CC0 1순위). 잡기 "사삭" 효과음(mj님 제안)도 같은 폴백 구조로.
- ★ **다국어 확장** (독일 등 — 해외 반응 좋음, mj님): i18n 구조 있어 사전만 추가. 단 빅장/멍군 등 장기 용어 번역이 난점(음역+설명).
- ★ **멀티플레이**: GitHub Pages 불가, 별도 서버 필요(WebSocket or WebRTC). 클라이언트 구조(playerFaction/flipped)는 이미 네트워크 대비 설계됨. 우선순위 낮음.
- 테마 시스템(THEME_SYSTEM_DESIGN) 본격 작업, 상대 기물 뒤집기 토글, 도움말 한자표.

## 7. 톤 메모
- 한림에게 반말, 데이지 호칭. 표준 한국어. ❌ 기호 안 씀. em dash 지양(콜론 등으로).
- Cozy Shelter는 동서양 융합 수묵화 미학. "수묵화 위의 장기 — 작은 장기 다실(茶室)" 컨셉(루미).
- 한림은 게임 UI 관점·디테일에 강함. 데이지·루미 의견과 교차검증하며 진행. **결정은 한림.**
- 외부 매체(mj님 카페 댓글, 블로그 글)는 비개발자 대상 — 내부 호칭 없이 "이미 됨/곧 함/새로 적음"으로 풀어쓰기.
