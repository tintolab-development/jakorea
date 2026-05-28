# CMS 공통 캘린더 (`shared/components/calendar`)

**목적:** 도메인·화면이 공통 캘린더 UI에서 벗어나지 않도록, **단일 소스**와 레이아웃 분기만 문서화한다.

**코드 진입:** `@/shared/components/calendar`  
**스타일 진입:** `@/shared/components/calendar/styles/calendar.css` (페이지에서 이 체인만 import — 도메인 CSS로 shell·셀 재정의 금지)

---

## 레이아웃 분기 (둘 중 하나만)

| 패턴 | 언제 | 컴포넌트 | shell CSS |
|------|------|----------|-----------|
| **3열** `calendar-set` | 미니·검색 + 메인 + 우측 400px | `CalendarSet` / `CalendarMain` + `calendar-main-container` | `calendar-main.css`, `calendar-sub-right-list` + `.calendar-list` |
| **7:3 카드** split | 풀폭 모달·참여 기관·UJAT 면접 | `CalendarSplitCardLayout` | `calendar-split-card-layout.css` |

→ 상세: [calendar-split-card-layout.md](./calendar-split-card-layout.md) · [calendar-sub-right-list.md](./calendar-sub-right-list.md)

**절대 혼용 금지:** split-card 좌측에 `calendar-main-container`, split-card 우측에 `.calendar-sub-right-list` 래퍼, split-card 바깥에 `participating-institutions-calendar-card` 재생성.

---

## shell 토큰 (카드 외곽 — 페이지에서 복제·변형 금지)

`calendar-main.css` · `calendar-sub-right.css` (`.calendar-list`) · `calendar-split-card-layout.css` (`.calendar-split-card`) **동일 값**:

```css
box-shadow: 0 0 16px 0 rgba(0, 0, 0, 0.06);
border-radius: var(--16, 16px); /* 16px */
```

| | `CalendarMain` (3열) | `.calendar-list` (3열 우측) | `.calendar-split-card` (7:3 바깥) |
|---|---------------------|----------------------------|-----------------------------------|
| 그림자 | O (`calendar-main`) | O | O — **유일 shell** |
| `border` 카드 테두리 | X | `1px solid var(--color-border-light)` | **X** (`border: none`) |
| 안쪽 중복 | — | — | 안쪽 `calendar-main` / `.calendar-list`의 shadow·border·padding **OFF** (layout CSS) |

7:3에서는 **바깥 카드 = 그림자만** (선 테두리로 카드 표현 금지).  
3열 우측 `.calendar-list`만 얇은 border + shadow 조합 — split-card 우측과 다름(의도).

---

## 셀 상호작용 (단일 소스)

**파일:** `styles/calendar-cell.css`  
**금지:** 페이지·`participating-institutions-calendar-view.css` 등에서 `.calendar-cell--selected` / `--today` / `:hover` 재정의.

| 상태 | 공통 동작 |
|------|-----------|
| 호버 | `background: var(--status-hover-bg)` |
| 선택 | 날짜 숫자 mint 원형 |
| 오늘(미선택) | 일반 숫자 (mint 원 **아님**) |
| 타월 | `#f8f9fa` 배경 |

7:3 그리드 **크기·요일 헤더·일정 칩**만 `calendar-split-card-main.css` — **상호작용 아님**.

---

## 우측 일별 리스트 (단일 shell)

**행:** `.calendar-list` > `.calendar-list-item` > `.calendar-list-item__column` > `item-list/*`  
**컴포넌트:** `CalendarSubRightList` / `CalendarSubRightVolunteerInterviewList` / …  
**금지:** `applicant-schedule-list` 신규 복제, split-card 안 `.calendar-list`에 shadow·border 재부여.

→ [calendar-sub-right-list.md](./calendar-sub-right-list.md)

---

## 화면별 구현 체크리스트 (PR·리뷰)

- [ ] `calendar.css` import (도메인 파일이 `calendar-main` shell·셀 상태를 덮어쓰지 않음)
- [ ] 7:3이면 `CalendarSplitCardLayout` + `className="calendar-split-card-main"`만
- [ ] 우측 `CalendarSubRight*` — `.calendar-list` 구조
- [ ] DevTools: `.calendar-split-card`에 `box-shadow` 있고 `border` 없음
- [ ] DevTools: 선택 셀에 **셀 전체 border 2px** 없음, 날짜 mint 원만
- [ ] `participating-institutions-calendar-view.css`에 **popover/tooltip만** 추가 (그리드·셀 상태 X)

### 알려진 레거시 (신규 코드 따라가지 말 것)

| 화면 | 이슈 |
|------|------|
| 참여 기관 기본 우측 | `ApplicantScheduleList` — `CalendarSubRight*`로 이전 예정 |
| `applicant-calendar-view.css` | 우측 `border: #f0f0f0` — split-card 이전 패턴 |

---

## 월간 셀 strip — shell 공유 / 내부 UI 페이지별

**공통 (모든 events 모드):**

- `.calendar-event` strip shell — `backgroundColor`, 선택 상태, overflow `+N`
- `SCHEDULE_COLORS` / `resolveEventColors` / `colorMap` — bg·text·border 강조색
- strip 크기·border-radius — `calendar-split-card-main.css` 등 공통 CSS

**페이지별 (hook으로만 주입, 공통에 도메인 로직 금지):**

| prop | 역할 |
|------|------|
| `buildMonthCellRows` | 해당 날짜 이벤트 → strip 행 목록 (UJAT: 지원자별 슬롯 묶음) |
| `renderMonthEventContent` | strip **내부** ReactNode (텍스트 레이아웃·구분선 등) |

미지정 시 기본: 이벤트 1:1 + `title` 단일 줄 (`defaultCalendarMonthEventTitle`).

**UJAT 예:** `ujat-volunteer-calendar-month-cells.tsx` — `CalendarMain`에 두 hook 전달.  
**다른 화면:** hook 없음 → UJAT `이름 | 시간` 표기 **절대 미적용**.

헬퍼(선택): `CalendarMonthEventTitleWithDivider` — divider UI 재사용용, UJAT 전용 아님.

---

## 관련 규칙

- [calendar-split-card-layout.md](./calendar-split-card-layout.md) — 7:3 DOM·이중 shell
- [calendar-sub-right-list.md](./calendar-sub-right-list.md) — 우측 리스트 행
- [calendar-week-time-grid.md](./calendar-week-time-grid.md) — 주간 격자
- [schedule-calendar-ux.md](./schedule-calendar-ux.md) — 클릭 UX

**Last updated:** 2026-05-29
