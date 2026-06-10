# 주간 시간 격자 캘린더 (CalendarSet / CalendarMain)

## 프로그램 시각 미설정

- `Program`(또는 이벤트)에 `startTime` / `endTime`이 **없거나** 파싱 불가하면 **종일**로 취급한다.
- **라벨**: 블록에 프로그램명(또는 `timeGridLabel`) + 부가 문구 **`종일`** (단일 일정). 겹침 집약 시에는 `외 N개의 항목` 우선.
- **주간 격자**: `00:00`–`24:00` 전체 높이(24×**56px** = **1344px**)로 블록을 채운다. 상단 32px 스택이 아니다.
- **겹침**: 종일·시간 일정 모두 `buildTimedItemGroupLayouts`로 집약(가장 긴 일정 1블록 + `외 N개의 항목`).

## 시간 설정 있음

- `HH:mm`–`HH:mm` 구간으로 블록 높이·위치 계산.
- 동일 시간대 겹침 → 집약 표시(열 분할 아님).

## Mock

- `/programs/general`: `scheduleTimeEnabled: false` 시드 — `general-programs.ts` 참고.

## 열 최소 너비 (116px)

- 토큰: `--calendar-cell-min-width` (116px) · `--calendar-week-columns-min-width` (7×116px)
- **헤더·본문 동일 9트랙 grid:** `[gutter 112][gap 20][repeat(7, minmax(116px, 1fr))]`
- **래퍼:** `calendar-week-time-grid__sync-scroll` — `__header-row` + `__scroll`을 묶어 동일 가로 폭·좌측 정렬 유지
- **헤더 요일:** `__header-day:nth-child(2..8) { grid-column: 3..9 }` — `:first-of-type` 사용 금지(코너 `div`와 타입 불일치로 열 어긋남)
- **본문:** `calendar-week-time-grid__shell` = 위와 **동일** `grid-template-columns`. `__columns { display: contents }` + `__column:nth-child(n) { grid-column: 3..9 }`
- **금지:** 본문만 `flex`·단일 `minmax(0,1fr)` 셀 — 헤더·요일 열 너비 불일치(DevTools에서 116px 미만 또는 헤더≠본문)
- **금지:** `.calendar-week--time-grid`·`calendar-main`·split-card 좌측에 `flex-shrink`·`min-width:0` — flex 자식이 116px 미만으로 눌림·카드 밖 삐져나옴. `overflow: visible`만으로 해결 금지 → `scroll-host`·`__main` 가로 스크롤 + 좌측 카드 `overflow-x: clip`

**코드:** `styles/calendar-time-grid.css` · `styles/calendar-tokens.css`

**Last updated:** 2026-05-29 (116px 열 min · 56px/시간 · 1344px 총 높이)
