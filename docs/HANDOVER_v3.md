# 한국 장기(Janggi) 웹 게임 — 인수인계서 v3

> Cozy Shelter 블로그(cozyshelter.tistory.com) 임베드용 한국 장기 위젯.
> 한림(데이지=Claude 호칭, 반말 사용)과 함께 개발. "루미"는 한림이 병행 사용하는 별도 AI(이미지 생성·디자인).
> v3는 v2 이후 "저장소화 세션"을 반영한다: 단일 index.html → 3분리, assets/ 경로 정리, GPLv3 저장소 구성, 초 궁(楚) 글자 교체.

---

## 0. 작업 환경 메모 (★ 다음 세션 데이지가 먼저 알 것)

- **샌드박스 네트워크 차단됨**: playwright 스크린샷, Fairy-Stockfish WASM 다운로드 등 외부 의존 작업은 이 환경에서 못 돌림. 코드 편집·`node` 문법검증·Pillow 이미지처리·로컬 로직 검산은 가능.
- **시각 검증은 한림이 로컬에서**: 변경 후 한림이 `python -m http.server`로 띄워 스크린샷 올려줌. 데이지는 정적 검산(로직 시뮬레이션, 경로 대조, 중괄호 짝, id↔getElementById 매칭)으로 보조.
- **검증 방식**: 매 수정 후 `node --check`로 JS 파싱 + 중괄호/괄호 짝. 경로 하드코딩 grep + 실제 파일 교차검증(대소문자까지 — Pages는 리눅스라 구분함). HTML id ↔ JS getElementById 매칭.
- **로컬 경로**: `C:\Work Space\Coding\1_Ongoing\Janggi` (한 폴더 = 한 저장소. FNS처럼 워크스페이스/퍼블릭 분리 안 함 — 통째 GPLv3 공개 전제라 분리 실익 없음).
- 파일 타임스탬프: 한림 PC는 KST(UTC+9), 샌드박스는 UTC. 같은 파일 다른 시각일 뿐.
- ⚠️ **압축 배포 시 폴더 한 겹 주의**: zip이 `Janggi/` 폴더째 묶이므로, 이미 `Janggi` 폴더 안에서 풀면 `Janggi/Janggi/`가 됨. 풀고 나서 서버가 읽는 위치 = index.html 있는 위치인지 확인.

---

## 1. 현재 완성 상태 (✅ 동작, 시각 검증 완료)

**기능**: 룰 엔진, 상차림 4종+자동, 사람 vs 사람, 합법수 표시, 잡기, 무르기, 기보, i18n(한/영), 진영 선택(초/한)→상차림 흐름, 대국 시작 안개 연출, 항복(돌 던지기), 승/패 2층 표시, 재대국 자동배정. 반응형 75:25.

**이번(저장소화) 세션 변경**:
- **단일 → 3분리**: 기존 `index.html`(약 1355줄, CSS·JS·i18n 전부 내장)을 분리.
  - `index.html` (86줄): 마크업 + css/js 링크만.
  - `style.css` (596줄): 전체 스타일.
  - `script.js` (668줄): 게임로직·렌더링·i18n·버튼핸들러 한 파일 통합.
  - `engine.js` (367줄): ★ 무수정. `window.JanggiEngine`.
- **assets/ 경로 정리**: 배경·기물을 루트에서 `assets/` 아래로. 코드 경로 전부 현행화.
- **GPLv3 저장소 구성**: LICENSE(GPLv3 전문), ASSETS_LICENSE.md(에셋 All Rights Reserved 분리), README.md, .gitignore, docs/.
- **초 궁(楚) 글자 교체**: chu/K.png가 `菜`로 잘못 새겨져 있던 것 → 루미 `楚` 재생성 → flood-fill 투명화 + 1024 리사이즈로 교체. (한 K는 원래 정상)

## 2. 파일 구조 (= 저장소 = 로컬 폴더, 이대로)

```
Janggi/
├─ index.html              마크업 + CSS/JS 링크
├─ style.css               전체 스타일 (수묵 테마, 반응형)
├─ script.js               게임로직·렌더링·i18n·핸들러
├─ engine.js               순수 룰 엔진. window.JanggiEngine. ★건드리지 말 것
│
├─ assets/
│  ├─ board/   board-bg.png  board-bg-flip.png
│  ├─ pieces/baekja/chu/   K R H E C A P .png   초(청록) 7종. 투명배경 1024px
│  ├─ pieces/baekja/han/   K R H E C A P .png   한(인주) 7종
│  └─ ui/      (.gitkeep — 예약)
│
├─ docs/   HANDOVER_v3.md  THEME_SYSTEM_DESIGN.md  PROJECT_NOTES.md
│
├─ README.md  LICENSE  ASSETS_LICENSE.md  .gitignore
```
⚠️ 로컬 실행: `file://` 직접 열기는 CORS로 engine.js/CSS/JS 막힘 → `python -m http.server` 사용.

## 3. 핵심 설계 규칙 (★ 절대 헷갈리면 안 됨)

### 진영·색·위치 (★★★ 최종)
- **초(楚) = 청록 = 코드 `'r'` = 아래 기본 = 선수**(엔진 turn='r'로 시작, 불변)
- **한(漢) = 인주 빨강 = 코드 `'b'` = 위 기본 = 후수**
- ⚠️ 변수명 `r`/`b`지만 색은 r=청록, b=빨강 (과거 색만 뒤집은 잔재)
- CSS 변수: `--blue: #1f4e5f`(청록=초), `--red: #9e2b25`(빨강=한). 변수명과 색 불일치 주의.
- HANJA(script.js): `r:{...K:'楚', P:'卒'}`, `b:{...K:'漢', P:'兵'}` — 초=楚/卒, 한=漢/兵 (한국 장기 정식)

### 선수 vs 화면배치 분리 (★ 진영 선택의 핵심)
- **선수는 언제나 초(turn='r')** — 엔진 불변.
- **진영 선택 = `flipped` 토글** — 화면 상하만 뒤집음. sideFaction은 안 건드림.
  - 초 선택 → `flipped=false` (초 아래, 내가 선수)
  - 한 선택 → `flipped=true` (한 아래, 위쪽 초가 선수, 내가 후수)
- `playerFaction`('chu'|'han') = "이 화면의 주인". 승/패는 이 관점. **네트워크 대비 핵심**.

### 재대국 자동배정 (확정)
- endGame에서 결과 저장. startSetup에서 직전 승자→한(후수), 패자→초(선수) 자동배정. 사용자가 다른 진영 누르면 무시 가능. `factionAutoAssigned` 플래그로 언어전환 시 안내문 유지.

### 기물 식별 / 테마 (THEME_SYSTEM_DESIGN.md 참조)
- 엔진 type 키 K/R/H/E/C/A/P **불변**. 테마도 같은 키. 테마=외형 묶음, 진영선택=배치. 1차는 배경 공유.

## 4. 코드 핵심 위치 (★ 새 구조 기준 — 측정값)

### script.js (668줄)
| 항목 | 줄 |
|------|-----|
| HANJA 매핑 | 42 |
| PIECE_IMG (assets/pieces/baekja/...) | 49 |
| I18N 사전 (ko/en) | 60 |
| t() 헬퍼 | 128 |
| playerFaction 등 상태변수 | 151~ |
| startSetup (진영단계 진입+자동배정) | 160 |
| renderFactionStep | 180 |
| chooseFaction | 206 |
| renderSetupStep | 224 |
| beginGame (flipped 결정, 배경교체, 안개) | 269 |
| playMistIntro | 294 |
| endGame | 537 |
| renderEndMessages (2층 승패) | 548 |
| applyStaticI18n | 570 |
| setLang | 588 |
| undo | 612 |

### style.css (596줄) — 테마 작업 시 손댈 곳
| 항목 | 줄 |
|------|-----|
| 색 변수 --red/--blue 등 | 9~12 |
| 배경 url(assets/board/...) | 129, 137 |
| 합법수 점 색 .dot-r/.dot-b | 217, 219 |
| 잡은 기물 칩 .cap-chip.r/.b | 283, 284 |
| 기보 글자색 .mv-r/.mv-b | 326, 327 |

엔진(engine.js): `window.JanggiEngine = { initialBoard, legalMoves, allLegalMoves, applyMove, isInCheck, gameStatus, SETUPS, SETUP_NAMES, randomSetup, ... }`

## 5. 다음 작업 (우선순위) — ★ 다음 세션 시작점

### A. Git 초기화 + 첫 커밋 ★ 즉시
- 저장소 한 벌 완성·시각 검증 완료 상태. 첫 커밋만 남음.
- SSH 커밋 서명 전역 ON(`commit.gpgsign=true`). 미서명 커밋은 amend.
- 이후 GitHub 저장소 생성(한림이 직접) + push + Pages 켜기 → 웹 확인.

### B. AI 대국 (별도 대규모 작업) ★ 1순위
- **Fairy-Stockfish WASM** 채택 예정 (Janggi 변종, NNUE). 네트워크 차단 환경이라 WASM 파일은 한림이 받아서 넣어야 함.
- 난이도 = 탐색 깊이. 선수=초 고정이므로 "사람이 한 선택 → AI(초) 선공" 자연 연결. AI는 turn 기준(flipped 무관).
- ⚠️ 라이선스: Fairy-Stockfish GPLv3 → 이미 프로젝트 전체 GPLv3로 선언해둠. 에셋은 ASSETS_LICENSE.md로 분리 보호.

### C. 테마 시스템 (THEME_SYSTEM_DESIGN.md)
- PIECE_IMG 경로는 이미 새 구조라 절반 됨. HANJA·색을 faction 참조로 묶고 THEMES 래퍼 추가. 한 세션에 몰아서 하는 게 안전.

### D. 배포
- GitHub Pages → Cozy Shelter iframe. ⚠️ 티스토리 iframe sanitize 확인 필요. 별도 페이지 권장.

### 아이디어 뱅크 (THEME_SYSTEM_DESIGN.md 하단)
진영 카드 순서 / AI 난이도 자동선택 / 레이팅 동점 동전던지기 / MMR 진영배정.
도움말/About에 한자-로마자 표. 기보 한자는 영어모드에서도 유지.

## 6. 작업 방식 메모
- 매 변경 후 `node --check` + 중괄호 짝 + 경로 grep + id 매칭. 추측 말고 측정.
- i18n 함수 `t`와 변수명 충돌 주의(과거 잡은 이력 있음).
- 기물 PNG 검은배경으로 오면 flood-fill 투명화(가장자리 연결 영역만, 밝기합<90, 글자 음각 보존). scipy.ndimage.label 사용. 기존 규격 1024×1024 RGBA에 맞춤.
- 배경 PNG 회전 시 용량 폭증 가능 → 한림이 tinypng로 최적화.
- 경로는 상대경로 유지(`assets/...`, 슬래시로 시작 안 함) → 하위 경로 배포(Pages 프로젝트 페이지)에서도 작동.

## 7. 톤 메모
- 한림에게 반말, 데이지 호칭. 표준 한국어. ❌ 기호 안 씀.
- Cozy Shelter는 동서양 융합 수묵화 미학. "수묵화 위의 장기" 컨셉.
- 한림은 게임 UI 관점·디테일에 강함. 데이지 의견과 교차검증하며 진행. 결정은 한림.
