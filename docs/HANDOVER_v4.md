# 한국 장기(Janggi) 웹 게임 — 인수인계서 v4

> Cozy Shelter 블로그(cozyshelter.tistory.com) 임베드용 한국 장기 위젯.
> 한림(데이지=Claude 호칭, 반말 사용)과 함께 개발. "루미"는 한림이 병행 사용하는 별도 AI(이미지 생성·디자인).
> v4는 v3 이후 "장군 표시 + 위쪽 진영 뒤집기 제거" 세션을 반영한다.

---

## 0. 작업 환경 메모 (★ 다음 세션 데이지가 먼저 알 것)

- **샌드박스 네트워크 차단됨**: playwright 스크린샷, Fairy-Stockfish WASM 다운로드 등 외부 의존 작업은 이 환경에서 못 돌림. 코드 편집·`node` 문법검증·Pillow 이미지처리·로컬 로직 검산은 가능.
- **시각 검증은 한림이 로컬에서**: 변경 후 한림이 `python -m http.server`로 띄워 스크린샷 올려줌. 데이지는 정적 검산(로직 시뮬레이션, 경로 대조, 중괄호 짝, id↔getElementById 매칭)으로 보조.
- **검증 방식**: 매 수정 후 `node --check`로 JS 파싱 + 중괄호/괄호 짝. 경로 하드코딩 grep + 실제 파일 교차검증(대소문자까지 — Pages는 리눅스라 구분함). HTML id ↔ JS getElementById 매칭. 가능하면 engine.js를 node로 require해서 가짜 판 만들어 로직 시뮬레이션(이번 세션에 isInCheck 검산에 사용).
- **로컬 경로**: `C:\Work Space\Coding\1_Ongoing\Janggi` (한 폴더 = 한 저장소).
- 파일 타임스탬프: 한림 PC는 KST(UTC+9), 샌드박스는 UTC. 같은 파일 다른 시각일 뿐.
- ⚠️ **압축 배포 시 폴더 한 겹 주의**: zip이 `Janggi/` 폴더째 묶이므로 풀 때 `Janggi/Janggi/` 주의. 서버가 읽는 위치 = index.html 있는 위치인지 확인.

---

## 1. 현재 완성 상태 (✅ 동작)

**기능**: 룰 엔진, 상차림 4종+자동, 사람 vs 사람, 합법수 표시, 잡기, 무르기, 기보, i18n(한/영), 진영 선택(초/한)→상차림 흐름, 대국 시작 안개 연출, 항복(돌 던지기), 승/패 2층 표시, 재대국 자동배정. **장군 표시(상태창 문구 + 궁 강조)**. 반응형 75:25.

**이번(v4) 세션 변경 — 2건**:

### 변경 1. 장군(Check) 표시 UI ✅ (정적 검산 완료, 한림 로컬 시각 검증 완료)
> 핵심 설계: **장군은 이벤트 결과가 아니라 "현재 판의 파생값"으로 다룬다.** 그래서 doMove·undo·setLang·reset 어디서 와도 render()와 refreshStatus()만 다시 부르면 자동으로 맞는다. 상태를 따로 저장하지 않는다.
- **궁 강조**: `render()` 시작에서 `Eng.isInCheck(board,'r'|'b')`를 각 1회 계산(`checkSide`), 장군당한 side의 K 기물에만 `.in-check` 클래스 부여. board만 바뀌면 자동 반영됨.
- **상태창 문구**: `refreshStatus(fallback)` 신설. 현재 차례(turn)가 장군이면 "장군!" 우선, 아니면 fallback(없으면 pickPiece). doMove·undo·setLang이 전부 이걸 호출하도록 통일. doMove에 박혀있던 장군 분기 제거.
  - undo는 `refreshStatus(t('undone'))` — 무른 자리가 장군이면 "장군!", 아니면 "물렀습니다".
  - setLang은 `refreshStatus()` 호출로 진행 중 장군 문구를 새 언어로 복원.
- **CSS `.in-check`**: 붉은 drop-shadow 링 + 금빛 약광(`--glow`) + 은은한 pulse(opacity 0.92~1, 1.6s). sel+in-check 동시 케이스 별도 처리. (글자/배경 톤 안 깨지게 transform pulse 안 씀.)
- i18n `check`(ko/en)는 v3에 이미 있었음. "장군!" 문구가 곧 "멍군해야 한다"는 안내라, 멍군 별도 UI는 1차에선 생략(엔진 legalMoves가 장군 안 받는 수를 이미 제거).

#### 변경 1-b. 장군 연출 — 소리 + 일회성 시각 버스트 (v4 추가)
> ★★★ 설계 구분: **상시 강조(.in-check 링)는 파생값**(render에서 매번), **소리·버스트는 이벤트**(doMove에서 새 장군 걸린 순간에만). render는 undo/setLang/resize에서도 불리므로, 거기에 소리를 묶으면 중복 발동함. 그래서 doMove에서만 `if (Eng.isInCheck(board, turn)) fireCheckFx();`로 트리거.
- **소리**: `playCheckSound()` — 파일 우선, 합성 폴백 구조.
  - 1순위 `assets/sound/check.mp3` 재생. 없거나 play() 실패 시 `_checkAudioFailed` 플래그 세우고 `synthCheckSound()`로 떨어짐.
  - **현재 음원 파일 없음 → 합성음이 남. 나중에 check.mp3만 그 경로에 넣으면 코드 수정 없이 파일로 전환.** (음원 라이선스는 GPLv3 호환 확인 필요. 한림이 직접 넣어야 함 — 샌드박스 네트워크 차단.)
  - `synthCheckSound()`: Web Audio로 징 느낌 합성. G3(196Hz) triangle + 277Hz sine 배음, 빠른 어택(0.012s)·긴 감쇠(1.5s). 톤 조정은 freqs/엔벨로프에서.
  - ⚠️ 브라우저 정책: 합성음은 사용자 제스처(클릭/터치) 후에만 남. 장기는 기물 클릭으로 두니 첫 수 시점엔 제스처 확보됨 → 실사용 문제없음. AudioContext는 lazy 생성 + suspended면 resume.
- **시각**: `spawnCheckBurst()` — `Eng.findKing(board, turn)`으로 장군당한 궁 좌표 구해 그 자리에 일회성 붉은 파동(`.check-burst`, 0.85s, scale 0.3→3.4 퍼지며 소멸). ink-splat과 같은 결.
- `fireCheckFx()` = spawnCheckBurst() + playCheckSound() 묶음.

#### 변경 1-c. 기물 놓는 소리 (백자 "딱") — v4 추가
- **매 수마다** doMove의 applyMove 직후 `playMoveSound()` 호출. check와 동일한 파일-우선/합성-폴백 구조.
  - 1순위 `assets/sound/move.mp3`, 없으면 `synthMoveSound()`. 폴백 플래그(`_moveAudioFailed`)는 check(`_checkAudioFailed`)와 독립 — 한쪽 파일만 있어도 됨.
  - `synthMoveSound()`: 두 겹 합성 — (1) 고역통과(2.2kHz) 노이즈 버스트로 도자기 표면 질감, (2) 880Hz 짧은 triangle 톤 클릭(피치 ±4% 미세 변동으로 반복감 완화). 길이 ~0.1초. 조정 포인트: highpass freq(날카로움), osc freq(무게감).
- 장군 거는 수에선 "딱"(놓기) → "뎅"(장군) 순으로 자연스럽게 겹침. 두 합성음은 `_audioCtx` 공유하되 각자 독립 노드라 충돌 없음.
- ★ 음원 라이선스 주의: 프로젝트가 GPLv3 공개 저장소라 음원은 **순수 CC0 1순위**(Freesound CC0 필터). Pixabay·Mixkit은 "로열티 프리"지 CC0 아님 → 파일째 커밋 시 재배포 제약 가능. 받으면 ASSETS_LICENSE.md에 "CC0, 출처 X" 기재. 파일명 `check.mp3`/`move.mp3`로 맞춰 `assets/sound/`에 넣으면 코드 수정 없이 자동 전환.

#### 변경 1-d. 중앙 "장군" 선언 연출 — v4 추가 (한림 로컬 시각 검증 완료)
- 장군 순간 보드 중앙에 "장군"(en "Check") 글자가 떴다 0.85s 만에 걷힘. **시작 안개(mist)와 같은 디자인 언어** — 종이빛 안개에 옅은 적먹을 섞고 글자는 `--red-deep`. 더 짧고 임팩트 있게.
- `spawnCheckAnnounce()`가 `frame`에 동적 생성(index.html 무수정). 연속 장군 시 직전 잔상 제거. fireCheckFx = 파동(spawnCheckBurst) + 중앙글자(spawnCheckAnnounce) + 소리(playCheckSound).
- 궁 파동(check-burst)도 v4에서 강화(scale 4.6, glow 키움).
- i18n에 `checkWord`('장군'/'Check') 추가. z-index: 기물(2)<궁강조(4)<파동(6)<**장군글자(9)**<win(10)<setup(20).
- ★ 디자인 규칙 확립: "중요한 순간을 안개+글자로 선언" — 시작="대국 시작", 장군="장군". 외통 등에도 같은 패턴 재사용 가능.
- 멍군: 별도 연출 없음(의도적). 장군은 시각 강조, 멍군은 상태창 안내 문구로 갈음 — 둘 다 화려하면 초보가 혼란. check 문구를 "장군! ○ 왕을 구하는 수를 두세요"로 보강. "멍군" 단어 설명은 향후 튜토리얼에서.

#### 변경 1-e. 외통(checkmate) / 무승부(stalemate) 구분 ✅ (★ engine.js 수정)
- **engine.js `gameStatus` 수정**: 합법수 0일 때를 둘로 구분. 장군O→`{over,loser,reason:'checkmate'}`(패), 장군X(수막힘)→`{over,draw:true,reason:'stalemate'}`(무승부). 기존 over/loser 구조 유지해 호환.
  - ※ 수막힘(stalemate)은 장기 특성상 실전에 거의 안 나옴(기물이 늘 갈 곳 있음) → 방어적 분기/안전망 성격. 실제로 보는 건 외통.
- script.js: doMove가 draw/reason을 endGame에 전달. endGame에 무승부(winner=null) 분기. renderEndMessages가 외통="외통 — ○ 승리", 무승부="비김/무승부"로 표시. i18n ko/en 추가(outcomeDraw, drawLine, byCheckmate 등). CSS에 win-faction.draw/h2.draw 색.
- ⚠️ **빅장(대궁 무승부) 미구현 — 별도 큰 작업.** 검색 확인: 빅장은 금지수가 아니라 합법수+무승부 메커니즘(대궁 유지 시 비김). 현재 engine.js `kingsFaceEachOther`는 대궁을 금지수로 막는데, 이는 정통 룰과 어긋남. 제대로 하려면 (a) 엔진의 대궁 금지를 합법+무승부로 전환, (b) 친선/점수제 룰 옵션, (c) 기물 점수 합산 시스템까지 딸려옴. → 5-E로 분리.

#### 변경 1-f. 제한 시간 + ruleOptions 구조 — v4 추가
- **`ruleOptions` 객체 신설** (★ 룰 옵션 확장 지점): 현재 `timeMode`('none'|'simple'), `baseSeconds`(기본 600=10분). 향후 입주: 무르기 횟수 제한, 빅장 처리, 점수제, 초읽기('byoyomi')/피셔 등.
- **단순 카운트다운 시계**: 자기 차례 쪽만 1초씩 감소(setInterval). 0이면 `reason:'timeout'`으로 endGame→"시간패 — ○ 승리". 기본 `timeMode:'none'`이라 평소엔 시계 숨김.
- 시계 UI: 상태창 위 `#clockBar` 동적 생성(index.html 무수정). 현재 차례 금빛 강조(.active), 30초 이하 붉게(.low). 연결: beginGame(초기화·시작)/doMove(차례마다 재시작)/endGame(정지)/undo(재개)/startSetup(정지).
- ⚠️ **테스트 방법**: 기본 'none'이라 안 보임 + 켜는 UI 아직 없음(1차는 구조+로직). 임시로 `ruleOptions.timeMode='simple'`, 짧게 보려면 `baseSeconds=20`. 끝나면 'none'으로 복귀.
- ⚠️ 한계(1차): undo 시 시간 복원 안 함(차례만 복귀, 잔여시간 유지). setInterval은 백그라운드 탭에서 느려질 수 있음 → 정밀하게는 추후 timestamp 기반.

### 변경 2. 위쪽 진영 180도 뒤집기 제거 ✅
- v3까지: `render()`에서 화면 위쪽(y<50) 기물에 `.up` 클래스 → CSS `rotate(180deg)`. 마주 앉은 실물판 흉내.
- v4: **제거.** 근거 — 이 게임은 `playerFaction`="화면의 주인"이 전제고, 진영 선택이 `flipped`로 내 진영을 늘 아래에 놓는다. 즉 각 플레이어는 자기 화면에서 항상 아래·정방향으로 본다. **네트워크 플레이가 주력이면 180도 뒤집기는 모순**(마주 앉은 상대가 화면에 없음)이라 끔.
- 제거 항목: script.js `up` 클래스 부여 1줄, CSS `.piece.up` 회전 규칙, (장군 세션에서 회전 보존용으로 만들었던) `.in-check.up` 분기 + `checkPulseUp` keyframe.
- 부수효과: v3에서 한(漢) 궁이 거꾸로 떠 `菜`처럼 보이던 현상 해소.
- ⚠️ 핫시트(한 화면 번갈아 두기) 한정으로 뒤집기가 의미 있었음 → **아이디어 뱅크에 "상대 기물 뒤집기 on/off 토글" 보류 항목으로 이관.**

## 2. 파일 구조 (= 저장소 = 로컬 폴더)

```
Janggi/
├─ index.html              마크업 + CSS/JS 링크 (★ v4 무수정)
├─ style.css               전체 스타일 (수묵 테마, 반응형). v4에서 710줄
├─ script.js               게임로직·렌더링·i18n·핸들러·연출·사운드·시계. v4에서 958줄
├─ engine.js               순수 룰 엔진. window.JanggiEngine. ★최소 수정만 (v4: gameStatus에 외통/무승부 구분 추가, 375줄)
│
├─ assets/
│  ├─ board/   board-bg.png  board-bg-flip.png
│  ├─ pieces/baekja/chu/   K R H E C A P .png   초(청록) 7종. 투명배경 1024px
│  ├─ pieces/baekja/han/   K R H E C A P .png   한(인주) 7종
│  ├─ sound/   check.mp3  move.mp3 (★ 예정 — 현재 없음, 없으면 Web Audio 합성 폴백)
│  ├─ engine/  (★ 예정 — Fairy-Stockfish NNUE WASM: stockfish.js/.wasm/+worker. 5-B 참조)
│  └─ ui/      (.gitkeep — 예약)
│
├─ docs/   HANDOVER_v4.md  THEME_SYSTEM_DESIGN.md  PROJECT_NOTES.md
│
├─ README.md  LICENSE  ASSETS_LICENSE.md  .gitignore
```
⚠️ 로컬 실행: `file://` 직접 열기는 CORS로 막힘 → `python -m http.server` 사용. ★ 서버는 **반드시 index.html 있는 폴더(저장소 루트)에서** 띄울 것 — 홈 디렉토리 등에서 띄우면 "Directory listing"만 뜸. `cd <저장소 루트>` 먼저, 그다음 `python -m http.server 8000` → localhost:8000.

## 3. 핵심 설계 규칙 (★ 절대 헷갈리면 안 됨)

### 진영·색·위치 (★★★ 최종)
- **초(楚) = 청록 = 코드 `'r'` = 아래 기본 = 선수**(엔진 turn='r'로 시작, 불변)
- **한(漢) = 인주 빨강 = 코드 `'b'` = 위 기본 = 후수**
- ⚠️ 변수명 `r`/`b`지만 색은 r=청록, b=빨강 (과거 색만 뒤집은 잔재)
- CSS 변수: `--blue:#1f4e5f`(청록=초), `--red:#9e2b25`(빨강=한). 변수명과 색 불일치 주의.
- HANJA(script.js): `r:{...K:'楚',P:'卒'}`, `b:{...K:'漢',P:'兵'}` — 초=楚/卒, 한=漢/兵.

### 선수 vs 화면배치 분리 (★ 진영 선택의 핵심)
- **선수는 언제나 초(turn='r')** — 엔진 불변.
- **진영 선택 = `flipped` 토글** — 화면 상하만 뒤집음. (초 선택 flipped=false / 한 선택 flipped=true)
- `playerFaction`('chu'|'han') = "이 화면의 주인". 승/패는 이 관점. **네트워크 대비 핵심**.
- ★ v4 보강: 각 플레이어는 자기 화면에서 항상 자기 기물을 아래·정방향으로 본다. 기물 개별 회전(.up) 없음.

### 장군은 파생값 (★ v4 신규 원칙)
- 장군 상태 = `Eng.isInCheck(board, side)`로 매 render/refreshStatus에서 재계산. 별도 플래그·이벤트 저장 금지.
- 새 상태창 문구를 추가할 땐 가능하면 refreshStatus 경유(장군 우선순위 유지).

### 재대국 자동배정 (확정)
- endGame에서 결과 저장. startSetup에서 직전 승자→한(후수), 패자→초(선수) 자동배정. 사용자가 다른 진영 누르면 무시 가능. `factionAutoAssigned` 플래그로 언어전환 시 안내문 유지.

### 기물 식별 / 테마 (THEME_SYSTEM_DESIGN.md 참조)
- 엔진 type 키 K/R/H/E/C/A/P **불변**. 테마도 같은 키. 테마=외형 묶음, 진영선택=배치. 1차는 배경 공유.

## 4. 코드 핵심 위치 (★ v4 측정값)

### script.js (958줄)
| 항목 | 줄 |
|------|-----|
| HANJA 매핑 | 42 |
| I18N 사전 (ko/en) — check/checkWord/draw/timeout 등 | 60~ |
| t() 헬퍼 | 128 |
| 상태변수 board,turn,...gameOver | 150 |
| **ruleOptions (★ 룰 옵션 확장점) / clock·clockTimer** | 158 / 164 |
| startSetup (stopClock 포함) | 183 |
| beginGame (flipped·안개·시계 초기화/시작) | 293 |
| render (checkSide 계산·.in-check 부여) | 394 |
| doMove (playMoveSound·종료(draw/reason)·fireCheckFx·시계 재시작) | 483 |
| **playCheckSound / synthCheckSound (징)** | 581 / 603 |
| **spawnCheckBurst (궁 파동)** | 634 |
| **spawnCheckAnnounce (중앙 "장군" 글자)** | 648 |
| **fireCheckFx (파동+중앙글자+소리)** | 663 |
| **playMoveSound / synthMoveSound (백자 딱)** | 671 / 692 |
| **clockEnabled / startClock / stopClock / renderClock (시계)** | 737 / 739 / 753 / 763 |
| updateTurnUI | 789 |
| endGame (stopClock·무승부 winner=null 분기) | 795 |
| renderEndMessages (외통/시간패/무승부 분기) | 812 |
| **refreshStatus (★ 장군 파생 문구)** | 847 |
| undo (refreshStatus·시계 재개) | 900 |

### style.css (710줄)
| 항목 | 줄 |
|------|-----|
| 색 변수 --red/--blue 등 | 9~12 |
| **.clock-bar 시계 (.active/.low)** | 81~106 |
| 배경 url(assets/board/...) | 129, 137 |
| **.in-check 궁 강조 / @keyframes checkPulse** | 222~ |
| 합법수 점 .dot-r/.dot-b | 271~ |
| **.check-burst 파동 / @keyframes checkBurst** | 294~308 |
| **.check-announce 중앙글자 / @keyframes checkMist(Text)** | 315~344 |
| 잡은 기물 칩 .cap-chip.r/.b | 395~ |
| 기보 글자색 .mv-r/.mv-b | 438~ |
| **무승부 색 .win-faction.draw / h2.draw** | 510 / 514 |

엔진(engine.js, 375줄 — v4에서 gameStatus만 수정): `window.JanggiEngine = { initialBoard, legalMoves, allLegalMoves, applyMove, isInCheck, gameStatus, kingsFaceEachOther, findKing, SETUPS, SETUP_NAMES, randomSetup, ... }`
- gameStatus(board, side) → `{over, loser?, draw?, reason?}` (reason: 'checkmate'|'stalemate'). 줄 346.

## 5. 다음 작업 (우선순위) — ★ 다음 세션 시작점
> 진행 흐름: 장군 표시 UI(문구·궁 강조·소리·버스트)는 v4에서 **완료**. 멍군은 "장군!" 문구로 갈음(별도 UI 없음). → **다음 큰 작업은 AI 대국(B). 단 WASM 파일 확보가 선행 조건.**

### A. Git 커밋 (v4 변경 반영)
- script.js / style.css 교체 커밋. engine.js·index.html 무수정. HANDOVER_v4.md를 docs/에.
- 저장소 `github.com/MerciHanrim/janggi`. Pages: https://mercihanrim.github.io/janggi/

### B. AI 대국 — Fairy-Stockfish NNUE WASM (별도 대규모 작업) ★ 1순위 (장군 UI 완료됨 → 다음은 이것)
> 검색 확인(2026-06): Fairy-Stockfish는 Janggi를 내장 변종으로 지원, WASM/NNUE 포트는 GPL-3.0 공개. 우리 GPLv3와 호환.
> 참고 데모: fairy-stockfish-nnue-wasm.vercel.app / 소스: github.com/gbtami/fairy-stockfish.wasm

**핵심 구분 (★ 헷갈리지 말 것)**
- `ffish` / `ffish-es6` (npm) = **룰/보드 라이브러리** (합법수 생성·판 관리). 우리 engine.js가 이미 하는 일 → **우리한텐 불필요.**
- **Fairy-Stockfish NNUE WASM** = 수를 계산해주는 **AI 엔진**. ★ 우리가 붙일 건 이쪽.

**준비 절차 (⚠️ 네트워크 차단 — 파일 확보는 한림이, 통합 코드는 데이지가)**
1. gbtami/fairy-stockfish.wasm의 빌드 산출물(`src/emscripten/public`) 또는 npm 패키지에서 받기.
2. 나오는 한 묶음을 `assets/engine/`에 저장:
   - `stockfish.js` (로더/글루 코드)
   - `stockfish.wasm` (엔진 바이너리)
   - worker 파일(있으면) — 별도 스레드 구동용
3. **받은 파일(특히 로더 .js)을 데이지에게 업로드** → 그래야 정확한 통합 코드 작성 가능.

**통합 설계**
- engine.js는 **로컬 룰 엔진으로 그대로 유지** (합법수 검증·렌더 그대로).
- script.js에 어댑터 추가 또는 `ai-adapter.js` 신규.
- 엔진과는 **UCI 텍스트 프로토콜**로 통신: `position ...` 보내고 `go depth N` → `bestmove ...` 받음. (★ UCCI 아님 — Fairy-Stockfish는 변종도 UCI로 통일.)
- 난이도 = `go depth N`의 N(탐색 깊이). 선수=초(turn='r') 고정이므로 "사람 진영 선택 → AI 선공" 자연 연결. AI는 turn 기준(flipped 무관).

**주요 통합 리스크**
1. ★ **좌표 매핑**: 우리 [row,col] ↔ 엔진 UCI 좌표. 장기는 체스와 표기가 달라 제일 까다로움. bestmove 문자열 파싱 → doMove 입력 변환.
2. **GitHub Pages / WASM worker 로딩**: 상대경로·MIME·worker 스크립트 경로.
3. **SharedArrayBuffer / worker 호환**: 필요 시 COOP/COEP 보안 헤더가 Pages에서 문제될 수 있음.

**1차 목표**: AI가 현재 판에 대해 합법적인 bestmove 하나를 반환하게 만들기. (UI·난이도·연출은 그다음.)
- 장군 표시·소리·놓는 소리 전부 AI 대국에서 그대로 유효(연출은 doMove 경유라 누가 두든 자동).
- ⚠️ 라이선스: Fairy-Stockfish GPLv3 → 프로젝트 전체 GPLv3 선언 완료. 엔진 파일은 GPLv3라 그대로 동봉 OK. 게임 에셋(기물·배경)은 ASSETS_LICENSE.md로 분리 보호 유지.

**★ AI Direction Note (방향 — 겉은 한 명, 안은 조절 여지)**
```
First AI implementation should use a single opponent only.
Do not add visible difficulty tiers during the initial WASM integration.

Primary goal:
- load Fairy-Stockfish WASM
- send current board position
- receive bestmove
- convert engine move to local coordinates
- execute one legal AI move

Difficulty / strength tuning is deferred until after the AI successfully plays moves.

Project direction:
The AI should feel like one quiet opponent rather than a competitive difficulty ladder.
Visible Easy/Normal/Hard style menus are not planned for the first version.
However, internal strength adjustment may remain possible later to keep the experience beginner-friendly.
```
요약: 1차는 단일 상대·연결만. 보이는 난이도 메뉴 없음("한 명의 조용한 대국 상대"). 단 내부 강도 조절 여지는 남겨둠(입문자 친화). 정체성 확정은 "한 수 제대로 두기" 성공 후로 미룸.

### C. 테마 시스템 (THEME_SYSTEM_DESIGN.md)
- PIECE_IMG 경로는 이미 새 구조. HANJA·색을 faction 참조로 묶고 THEMES 래퍼 추가. 한 세션에 몰아서.

### D. 배포
- GitHub Pages → Cozy Shelter iframe. ⚠️ 티스토리 iframe sanitize 확인 필요. 별도 페이지 권장.

### E. 빅장 + 점수제 룰 묶음 (별도 큰 작업 — 1-e에서 분리)
- 빅장(대궁 무승부)은 금지수가 아니라 **합법수+무승부 메커니즘**. 검색 확인: 대궁(궁끼리 사이 기물 없이 마주봄) 상태를 다음 차례까지 안 풀면 무승부('빅'='비김'+'장군').
- 현재 engine.js `kingsFaceEachOther`는 대궁을 금지수로 막음 → 정통 룰과 어긋남. 제대로 하려면:
  1. 엔진 대궁 처리 전환: 금지 → 합법수 허용 + 대궁 유지 시 무승부 판정.
  2. ruleOptions에 친선/점수제 분기 (친선=빅장 무승부 있음 / 대회 점수제=무승부 없이 점수 비교).
  3. 기물 점수 합산 시스템(차2·포3·마·상·사·졸 등). 30점 기준 동일수 반복·궁빅 조건도 점수 의존.
- ⚠️ 묶음 작업: 빅장·반복수(만년장/동일수 3회)·소삼능·시간종료 점수비교가 다 "점수제"에 엮임. 빅장만 떼기 애매하니 한 번에.

### 아이디어 뱅크 (THEME_SYSTEM_DESIGN.md 하단)
- ★ **시간 설정 UI**: ruleOptions.timeMode/baseSeconds를 켜는 체크박스+시간 선택. 위치는 셋업 화면 or 별도 설정 패널(UI 설계 필요). 1-f에서 로직·구조는 완료, UI만 남음. + 시계 정밀도(timestamp 기반), 초읽기('byoyomi') 모드 확장.
- ★ **장군/외통 음원 파일 교체**: assets/sound/check.mp3·move.mp3 넣으면 합성음 대신 자동(CC0 1순위). 항복/잡기 효과음도 같은 폴백 구조로 확장.
- ★ **튜토리얼/배우기 모드**: "멍군" 용어 설명, 기물 행마법, 초보자 가이드. (독립 사이트 구조의 "장기 배우기" 갈래)
- ★ **상대 기물 뒤집기 on/off 토글** (핫시트용 보류 항목)
- 진영 카드 순서 / AI 난이도 자동선택 / 레이팅 동점 동전던지기 / MMR 진영배정
- 도움말/About에 한자-로마자 표. 기보 한자는 영어모드에서도 유지

## 6. 작업 방식 메모
- 매 변경 후 `node --check` + 중괄호 짝 + 경로 grep + id 매칭. 추측 말고 측정.
- engine.js를 node require해서 가짜 판으로 로직 시뮬레이션 가능(isInCheck/legalMoves 검산에 유용). 단 require 경로는 절대경로로.
- i18n 함수 `t`와 변수명 충돌 주의.
- 기물 PNG 검은배경으로 오면 flood-fill 투명화(가장자리 연결 영역, 밝기합<90, 글자 음각 보존). scipy.ndimage.label. 1024×1024 RGBA.
- 배경 PNG 회전 시 용량 폭증 가능 → 한림이 tinypng로 최적화.
- 경로는 상대경로 유지(`assets/...`, 슬래시로 시작 안 함) → 하위 경로 배포에서도 작동.

## 7. 톤 메모
- 한림에게 반말, 데이지 호칭. 표준 한국어. ❌ 기호 안 씀.
- Cozy Shelter는 동서양 융합 수묵화 미학. "수묵화 위의 장기" 컨셉.
- 한림은 게임 UI 관점·디테일에 강함(이번 세션 뒤집기 모순도 한림이 짚음). 데이지 의견과 교차검증하며 진행. 결정은 한림.
