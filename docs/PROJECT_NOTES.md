# 프로젝트 노트 (Project Notes)

> 이 저장소가 무엇이고, 구조가 왜 지금처럼 생겼는지에 대한 기록.
> 작업 인수인계는 `HANDOVER_v2.md`, 테마 설계는 `THEME_SYSTEM_DESIGN.md` 참조.

---

## 무엇인가

수묵화 미학의 웹 한국 장기. 사람 대 사람 대국이 완성 단계이며,
다음 목표는 Fairy-Stockfish 기반 AI 대국이다. Cozy Shelter 블로그
임베드를 염두에 두고 만든 위젯이지만, 저장소 자체는 한림의 작업
보관·이어가기를 1차 목적으로 한다.

## 구조 의사결정

### 단일 파일 → 3분리 (이 저장소 첫 정리)

원래 `index.html` 한 파일(약 1355줄)에 마크업·CSS·게임로직·i18n이
전부 들어 있었다. 저장소를 만들면서 다음으로 나눴다.

```
index.html  마크업 + css/js 링크
style.css   전체 스타일
script.js   게임 로직 · 렌더링 · i18n · 버튼 핸들러 (한 파일로 통합)
engine.js   순수 룰 엔진 — 무수정 유지
```

- **왜 지금 나눴나**: 저장소도 없고, 외부 공개도 없고, AI·테마도 미구현인
  시점이라 구조를 바꿔도 깨질 의존성이 적었다. AI·기보저장·테마가 붙은
  뒤에는 같은 정리가 훨씬 비싸진다.
- **script.js를 더 쪼개지 않은 이유**: i18n을 별도 파일로 빼는 선택도
  있었지만, 이번 목표는 "파일 수 늘리기"가 아니라 "정상 동작 유지하며
  분리"였다. i18n 분리는 필요해지면 나중에.
- **engine.js는 손대지 않는다**: 검증된 룰 계산기이고 `window.JanggiEngine`
  으로만 노출한다. 외형·구조 변경의 영향권 밖에 둔다.

### assets/ 경로 정리

배경·기물 이미지를 루트에서 `assets/` 아래로 옮기고, 코드의 하드코딩
경로를 한 번에 맞췄다.

```
board-bg.png            → assets/board/board-bg.png
board-bg-flip.png       → assets/board/board-bg-flip.png
pieces/baekja/<진영>/   → assets/pieces/baekja/<진영>/
```

- CSS 배경 2곳, `script.js`의 `PIECE_IMG` 14개를 수정.
- `assets/ui/`는 향후 UI 아이콘용으로 예약(현재 비어 있어 `.gitkeep` 유지).

### 라이선스 분리

- 코드는 GPLv3. Fairy-Stockfish(GPLv3) 통합을 계획하므로 처음부터
  프로젝트 전체를 GPLv3로 선언한다(의무는 실제 통합 시 발동하지만,
  방향이 정해졌으므로 미리 박아 혼선을 없앤다).
- 에셋은 `ASSETS_LICENSE.md`로 분리해 All Rights Reserved로 보호.
  카피레프트가 직접 제작한 시각 자산까지 끌고 가지 않도록.

## 알려진 이슈 / 확인 필요

- ~~`assets/pieces/baekja/chu/K.png` 글자 오류~~ **(해결)**: 초 궁이 `菜`로
  잘못 새겨져 있던 문제. 루미로 `楚`(청록) 재생성 후, 검은 배경을
  flood-fill 투명화(가장자리 연결 영역만, 글자 음각 보존)하고 1024×1024로
  맞춰 교체 완료. 다른 13장과 규격 통일.

## 다음 작업 (요약 — 상세는 HANDOVER_v2.md)

1. chu/K.png(楚) 교체
2. AI 대국 (Fairy-Stockfish WASM, GPLv3) — 1순위
3. 테마 시스템 (THEMES 래퍼 + faction 참조로 하드코딩 제거)
4. GitHub Pages 배포 + 티스토리 iframe 확인
