# Janggi (한국 장기)

수묵화 미학을 입힌 웹 한국 장기. 백자 팔각 기물, 산수화 배경, 한/영 i18n,
진영 선택, 기보, 항복(돌 던지기), 상차림 4종을 갖춘 대국 위젯.

Fairy-Stockfish(Janggi 변종) 기반 AI와 대국할 수 있으며, AI 강도를 세 단계
(초심자 / 익숙한 벗 / 노련한 기객) 중에서 고를 수 있다. Cozy Shelter
(cozyshelter.tistory.com) 임베드를 염두에 두고 만들어졌다.

**라이브: https://korea-janggi.pages.dev**

## 실행

로컬에서 정적 서버로 띄운다. `file://` 직접 열기는 CORS로 `engine.js`/CSS/JS
로드가 막히므로 반드시 HTTP 서버를 쓴다.

```bash
python -m http.server
# 브라우저에서 http://localhost:8000
```

단, **AI 대국을 테스트하려면 COOP/COEP 헤더를 주는 서버가 필요하다.** AI 엔진은
멀티스레드 WASM(SharedArrayBuffer)을 쓰는데, 이 헤더가 없으면 엔진이 켜지지
않는다(`python -m http.server`는 헤더를 주지 못한다). 저장소의 `serve.py`를 쓴다.

```bash
python serve.py
# http://localhost:8000  — COOP/COEP 헤더 포함, AI 대국 동작
```

배포(Cloudflare Pages)에서는 `_headers`가 같은 헤더를 제공한다. 같은
이유로 iframe 임베드는 부모 페이지가 헤더를 줄 수 없어 AI가 켜지지 않으므로,
블로그·카페에는 임베드 대신 링크로 연결한다.

## 구조

```
Janggi/
├─ index.html              UI 마크업 + CSS/JS 링크
├─ style.css               전체 스타일 (수묵 테마, 반응형)
├─ script.js               게임 로직 · 렌더링 · i18n · 버튼 핸들러 · AI 강도 선택
├─ engine.js               순수 룰 엔진 (window.JanggiEngine) — 외형과 독립
├─ ai-adapter.js           AI 어댑터 (window.JanggiAI) — 엔진 통신 · 좌표/FEN 변환
├─ serve.py                COOP/COEP 헤더 로컬 서버 (AI 테스트용)
├─ _headers                배포 헤더 설정 (Cloudflare Pages)
│
├─ assets/
│  ├─ board/               배경 2종 (정방향 / 180도)
│  ├─ pieces/baekja/       백자 테마 기물 (chu 청록 / han 인주, 각 7종)
│  ├─ engine/              Fairy-Stockfish WASM (로더 · 바이너리 · 워커)
│  └─ ui/                  (예약)
│
└─ docs/                   설계·인수인계 문서
```

기물 키는 엔진과 동일하게 `K R H E C A P`
(궁/차/마/상/포/사/졸·병). 외형 테마가 바뀌어도 이 키는 불변이다.

## 진영·색 규칙

- 초(楚) = 청록 = 코드 `'r'` = 기본 아래 = **선수**(엔진 `turn='r'`, 불변)
- 한(漢) = 인주 빨강 = 코드 `'b'` = 기본 위 = 후수

변수명은 `r`/`b`지만 색은 r=청록, b=빨강이다(과거 잔재). 진영 선택은
화면 상하만 뒤집는 `flipped` 토글이며, 선수(초)는 항상 고정이다.

## AI 대국

대국 시작 시 AI 강도를 고른다. 강도는 세 단계이며, 진영을 고르기 전에
선택한다(강도를 바꾸려면 처음부터 다시 시작한다).

- **초심자** — 처음 장기를 배우는 사람을 위한 상대
- **익숙한 벗** — 가볍게 한 판 즐길 수 있는 상대
- **노련한 기객** — 쉽게 빈틈을 보이지 않는 상대

강도는 탐색 깊이보다 엔진의 Skill Level로 주로 조절한다. 낮은 단계는 일부러
최선이 아닌 수를 섞어 초보자도 이겨볼 여지를 남기고, 높은 단계는 빈틈을 거의
주지 않는다. AI는 강도와 무관하게 한 수마다 잠시 생각하는 시간을 두어, 즉답하는
기계가 아니라 마주 앉은 상대처럼 두도록 했다.

룰 판정은 항상 내장 룰 엔진(`engine.js`)이 맡고, AI 어댑터는 수 계산만
위임한다. 엔진이 낸 수가 내부 룰과 어긋나는 드문 경우에는 대국이 멈추지 않도록
유효한 수로 대체한다.

## 라이선스

- **코드** (`index.html`, `style.css`, `script.js`, `engine.js`, `ai-adapter.js`): GPLv3.
  Fairy-Stockfish(GPLv3)를 통합하므로 프로젝트 전체를 GPLv3로 둔다.
  자세한 내용은 [`LICENSE`](LICENSE).
- **AI 엔진** (`assets/engine/` 하위 Fairy-Stockfish WASM): GPLv3.
- **시각 에셋** (`assets/` 하위 기물·배경 이미지): 코드 라이선스와 별개.
  [`ASSETS_LICENSE.md`](ASSETS_LICENSE.md) 참조.
