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

### 체크박스 hit 영역 (필수 — 페이지 공통)

체크박스가 있는 우측 행은 **반드시** 공통 클래스만 사용한다.

```tsx
<div
  className="calendar-list-item__checkbox"
  onClick={e => e.stopPropagation()}
  onKeyDown={e => e.stopPropagation()}
>
  <Checkbox … />
</div>
```

- **스타일 단일 소스:** `styles/calendar-sub-right.css` — hover `rgba(1, 161, 175, 0.06)`, `padding: 12px`, `border-radius: 6px`
- **금지:** `*-list-item__checkbox` 등 도메인 전용 클래스로 hit area·hover 재구현
- **금지:** institution/settlement CSS를 “참고해서” 페이지별 hover 복제

**2차 면접 대상자 목록에서 미적용됐던 이유 (회귀 방지):**

1. `CalendarSubRightVolunteerInterview2List`·`ujat-volunteer-interview2-list-item` 신규 추가 시, 당시 rule이 `settlement-list-item__checkbox` / `ujat-institution-application-list-item__checkbox` **페이지별 패턴**만 가리키고 공통 클래스명을 강제하지 않음.
2. 2차 면접 item은 `ujat-volunteer-interview2-list-item__checkbox`만 두고 flex 정렬만 넣었고, **hover·padding·radius를 item CSS에 넣지 않음** → 공통 shell과 연결되지 않아 hover 없음.
3. `calendar.css` import만으로는 부족 — **마크업에 `calendar-list-item__checkbox` 클래스가 있어야** `calendar-sub-right.css` 규칙이 적용됨.

→ 상세·DOM: [calendar-sub-right-list.md](./calendar-sub-right-list.md)

---

## 화면별 구현 체크리스트 (PR·리뷰)

- [ ] `calendar.css` import (도메인 파일이 `calendar-main` shell·셀 상태를 덮어쓰지 않음)
- [ ] 7:3이면 `CalendarSplitCardLayout` + `className="calendar-split-card-main"`만
- [ ] 우측 `CalendarSubRight*` — `.calendar-list` 구조
- [ ] 체크박스 있으면 래퍼 className **`calendar-list-item__checkbox`만** (도메인 `__checkbox` 금지) — DevTools hover 시 mint 6% 배경
- [ ] 주간 토글 시 **선택일 유지** + 해당 주 그리드 표시 (월 1일 주로 튀지 않음)
- [ ] [오늘] 클릭 시 선택일·주/월 앵커 모두 오늘
- [ ] DevTools: `.calendar-split-card`에 `box-shadow` 있고 `border` 없음
- [ ] DevTools: 선택 셀에 **셀 전체 border 2px** 없음, 날짜 mint 원만
- [ ] `participating-institutions-calendar-view.css`에 **popover/tooltip만** 추가 (그리드·셀 상태 X)

### 알려진 레거시 (신규 코드 따라가지 말 것)

| 화면 | 이슈 |
|------|------|
| 참여 기관 기본 우측 | `ApplicantScheduleList` — `CalendarSubRight*`로 이전 예정 |
| `applicant-calendar-view.css` | 우측 `border: #f0f0f0` — split-card 이전 패턴 |

---

## 날짜·모드 네비게이션 (공통 — 모든 `CalendarMain`)

**코드:** `lib/calendar-navigation.ts` · `lib/use-calendar-navigation-state.ts` · `CalendarMain` 내부 `handleModeChange` / [오늘]

| 규칙 | 동작 |
|------|------|
| **초기 진입** | `selectedDate` = 실시간 오늘. `currentMonth`(표시 앵커) = 모드에 맞게 오늘 기준 (`월간` → 해당 월 1일, `주간` → 해당 주 시작) |
| **월간 → 주간 전환** | `CalendarMain`이 **현재 `selectedDate`가 속한 주**로 앵커 이동 (`syncViewAnchorOnModeChange`). 월 1일 앵커에 묶이지 않음 |
| **[오늘] 버튼** | 선택일·표시 앵커 모두 오늘 (`goToTodayState`). `CalendarMain`이 처리 — 페이지별 `onTodayClick` **불필요**(중복 시에도 `onMonthChange`로 앵커 보정) |
| **주간 헤더 연·월** | `resolveWeekViewHeaderTitle` — 선택일이 표시 주에 있으면 선택일 기준, 없으면 주 중앙(목) 기준. **`weekDates[0]`(주 시작)만 쓰지 말 것** (월초 선택 시 전월로 표기됨) |

### 페이지 구현

```tsx
// 권장: 3열·split 공통 state
const {
  selectedDate,
  currentMonth,
  mode,
  onSelectDate,
  onMonthChange,
  onModeChange,
} = useCalendarNavigationState('month')

<CalendarMain
  selectedDate={selectedDate}
  currentMonth={currentMonth}
  mode={mode}
  onSelectDate={onSelectDate}
  onMonthChange={onMonthChange}
  onModeChange={onModeChange}  // 모드만 set — 앵커는 CalendarMain이 selectedDate 기준 동기화
/>
```

- **금지:** `currentMonth`만 `startOf('month')`로 초기화하고 `selectedDate`만 `dayjs()` — 주간 전환 시 다른 주로 점프
- **금지:** `onModeChange`에서 앵커를 갱신하지 않고 `setMode`만 (→ `CalendarMain`이 보정하므로 동작은 하나, 중복 구현 불필요)
- **금지:** [오늘]에서 주간인데 `startOf('month')`만 호출하는 페이지 전용 handler

초기 state만 수동일 때: `createInitialCalendarNavigationState(mode)` 사용.

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

**Last updated:** 2026-05-29 (날짜·모드 네비게이션 공통화)
