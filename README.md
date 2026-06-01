# Janggi (한국 장기)

수묵화 미학을 입힌 웹 한국 장기. 백자 팔각 기물, 산수화 배경, 한/영 i18n,
진영 선택, 기보, 항복(돌 던지기), 상차림 4종을 갖춘 사람 대 사람 대국 위젯.

Cozy Shelter(cozyshelter.tistory.com) 임베드를 염두에 두고 만들어졌으며,
이후 Fairy-Stockfish(Janggi 변종) 기반 AI 대국 추가를 계획하고 있다.

## 실행

로컬에서 정적 서버로 띄운다. `file://` 직접 열기는 CORS로 `engine.js`/CSS/JS
로드가 막히므로 반드시 HTTP 서버를 쓴다.

```bash
python -m http.server
# 브라우저에서 http://localhost:8000
```

## 구조

```
Janggi/
├─ index.html              UI 마크업 + CSS/JS 링크
├─ style.css               전체 스타일 (수묵 테마, 반응형 75:25)
├─ script.js               게임 로직 · 렌더링 · i18n · 버튼 핸들러
├─ engine.js               순수 룰 엔진 (window.JanggiEngine) — 외형과 독립
│
├─ assets/
│  ├─ board/               배경 2종 (정방향 / 180도)
│  ├─ pieces/baekja/       백자 테마 기물 (chu 청록 / han 인주, 각 7종)
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

## 라이선스

- **코드** (`index.html`, `style.css`, `script.js`, `engine.js`): GPLv3.
  Fairy-Stockfish(GPLv3) 통합을 계획하므로 프로젝트 전체를 GPLv3로 둔다.
  자세한 내용은 [`LICENSE`](LICENSE).
- **시각 에셋** (`assets/` 하위 기물·배경 이미지): 코드 라이선스와 별개.
  [`ASSETS_LICENSE.md`](ASSETS_LICENSE.md) 참조.
