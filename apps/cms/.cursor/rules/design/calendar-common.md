# CMS 공통 캘린더 (`shared/components/calendar`)

**목적:** 도메인·화면이 공통 캘린더 UI에서 벗어나지 않도록, **단일 소스**와 레이아웃 분기만 문서화한다.

**코드 진입:** `@/shared/components/calendar`  
**스타일 진입:** `@/shared/components/calendar/styles/calendar.css` (페이지에서 이 체인만 import — 도메인 CSS로 shell·셀 재정의 금지)

---

## 레이아웃 분기 (둘 중 하나만)

| 패턴 | 언제 | 컴포넌트 | shell CSS |
|------|------|----------|-----------|
| **3열** `calendar-set` | 미니·검색 + 메인 + 우측 리스트 | `CalendarSet` / `CalendarMain` + `calendar-main-container` | `calendar-main.css`, `calendar-sub-left.css`, `calendar-sub-right-list` + `.calendar-list` |
| **7:3 카드** split | 풀폭 모달·참여 기관·UJAT 면접 | `CalendarSplitCardLayout` | `calendar-split-card-layout.css` |

→ 상세: [calendar-split-card-layout.md](./calendar-split-card-layout.md) · [calendar-sub-right-list.md](./calendar-sub-right-list.md)

**절대 혼용 금지:** split-card 좌측에 `calendar-main-container`, split-card 우측에 `.calendar-sub-right-list` 래퍼, split-card 바깥에 `participating-institutions-calendar-card` 재생성.

---

## shell 토큰 (카드 외곽 — 페이지에서 복제·변형 금지)

`calendar-main.css` · `calendar-sub-right.css` (`.calendar-list`) · `calendar-split-card-layout.css` (`.calendar-split-card`) **shell 값**:

```css
/* 메인·split-card·미니 — 그림자 shell */
box-shadow: 0 0 16px 0 rgba(0, 0, 0, 0.06);
border-radius: var(--16, 16px); /* 16px */

/* 3열 우측 .calendar-list — border shell (shadow와 동시 사용 금지) */
border: 1px solid var(--color-border-light);
border-radius: 16px;
```

| | `CalendarMain` (3열) | `.calendar-list` (3열 우측) | `.calendar-split-card` (7:3 바깥) |
|---|---------------------|----------------------------|-----------------------------------|
| 그림자 | O (`calendar-main`) | **X** | O — **유일 shell** |
| `border` 카드 테두리 | X | `1px solid var(--color-border-light)` | **X** (`border: none`) |
| 안쪽 중복 | — | — | 안쪽 `calendar-main` / `.calendar-list`의 shadow·border·padding **OFF** (layout CSS) |

7:3에서는 **바깥 카드 = 그림자만** (선 테두리로 카드 표현 금지).  
3열 우측 `.calendar-list` = **border만** (`calendar-search`와 동일 — **border + box-shadow 동시 금지**). 부모 `.calendar-sub-right-list`는 sticky·치수만, border/shadow/radius **없음**.

**회귀 (이중 테두리):** `.calendar-list`에 border·box-shadow를 같이 주거나, `.calendar-sub-right-list`에 shell을 주면 `overflow: hidden` 클리핑과 겹쳐 모서리에 선이 두 줄로 보인다.

---

## 메인 캘린더 그리드 치수 (필수 — `CalendarMain`)

**CSS 변수** (`styles/calendar-tokens.css` — `calendar.css` **최상단** import, 모든 배치 래퍼 + `.calendar-main-container` + `.calendar-main`):

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--calendar-cell-min-width` | **116px** | 월간 날짜 칸·주간 요일 열 **최소 너비** |
| `--calendar-cell-min-height` | **124px** | 월간 날짜 칸 **최소 높이** (기본 행 높이) |
| `--calendar-week-hour-px` | **56px** | 주간 시간 격자 **1시간당 높이** |
| `--calendar-week-total-px` | `24 × 56px` = **1344px** | 주간 격자 전체 높이 |

| 규칙 | 동작 |
|------|------|
| **월간 셀** | `min-width: 116px` · `min-height: 124px` · `height: auto`. 테이블 `width: 100%`, 열 `calc(100% / 7)`. **3열 `calendar-set`:** 우측이 400px 미만이면 메인은 min 너비·셀 116px 유지; **우측 400px 도달 후** 메인이 늘어나며 열 확장 |
| **월간 행 높이** | `tbody tr { height: auto }` — 일정·strip 등 **콘텐츠에 따라 행·셀 높이 증가** (124px은 바닥선) |
| **주간 시간 격자** | `week-time-grid-layout.ts` · `week-view.tsx` · `calendar-time-grid.css` — **56px/시간**, 총 1344px. 요일 열 `minmax(116px, 1fr)` |
| **`.calendar-main` · `.calendar-main-container`** | 월간 `min-width` = 7×116px + 좌우 padding(40px) · `min-height` = 6×124px + 요일 헤더(37px) + 상단 nav(50px) + 세로 padding(32px). 주간 `:has(.calendar-week--time-grid)` 시 gutter(112+20px) + 7열 + padding / 1344px + 헤더 — **`--calendar-main-month-*` · `--calendar-main-week-*` 토큰** |
| **3열 가로 분배** | `calendar-layout.css` — **grid** 3열(2열: `:not(:has(.calendar-sub-left))`). 주간 `:has(.calendar-week--time-grid)` 시 메인 `minmax`만 week 토큰으로 교체 |
| **7:3 split 좌측** | `calendar-split-card-layout.css` — **grid** `minmax(메인 min, 1fr) \| minmax(280px, 400px)`. `min-height: 900px` · `overflow: visible` |
| **강사 정산 탭** | `InstructorSettlementCalendarView` = `calendar-set` + `calendar-main-container` + `calendar-sub-right-list` — **공통 min 치수 그대로**. `instructor-payment-tab__calendar-view-container--no-inner-scroll`는 **내부 스크롤만** 끔(`overflow: visible`) — `min-height: 0`으로 공통 치수 **덮어쓰지 않음** |

- **금지:** 페이지·도메인 CSS에서 `.calendar-cell` / `.ant-picker-cell` **고정 width·height(px)** 재정의 (`participating-institutions-calendar-view.css`는 tooltip/popover만)
- **금지:** 주간 `hourPx`를 54px 등 다른 값으로 **페이지별 하드코딩** — `WEEK_TIME_GRID_HOUR_PX`(56) 단일 소스

**코드:** `styles/calendar-tokens.css` · `calendar-main.css` · `calendar-cell.css` · `calendar-antd-override.css` · `calendar-time-grid.css` · `lib/week-time-grid-layout.ts` · `ui/calendar-main.tsx`(`calendar.css` side-effect import)

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

7:3 split **요일 헤더·일정 칩**만 `calendar-split-card-main.css` — **셀 치수·상호작용은 위 그리드 토큰·`calendar-cell.css`**.

---

## 우측 일별 리스트 (단일 shell)

**행:** `.calendar-list` > `.calendar-list-item` > `.calendar-list-item__column` > `item-list/*`  
**컴포넌트:** `CalendarSubRightList` / `CalendarSubRightVolunteerInterviewList` / …  
**금지:** `applicant-schedule-list` 신규 복제, split-card 안 `.calendar-list`에 shadow·border 재부여.

### 영역 치수 (필수 — `calendar-layout.css` · `calendar-sub-right.css`)

**CSS 변수** (`calendar-set` · `calendar-split-card-layout` · 2열 UJAT 루트 등에서 동일 값):

| 토큰 | 값 |
|------|-----|
| `--calendar-sub-right-list-height` | **743px** 고정 |
| `--calendar-sub-right-list-min-width` | **280px** |
| `--calendar-sub-right-list-max-width` | **400px** |

| 규칙 | 동작 |
|------|------|
| **높이** | `.calendar-sub-right-list`(3열) 또는 `.calendar-split-card--right > .calendar-list` 스크롤 영역 = **743px** 고정. 목록 많을 때 **내부 `overflow-y: auto`** (`.calendar-list`) |
| **너비** | `calendar-set` **CSS Grid**: `300px \| minmax(메인 min, 1fr) \| minmax(280px, 400px)`. 우측 트랙이 **400px까지 먼저** 확보된 뒤, 남는 가로만 `1fr` 메인(셀 `calc(100%/7)`). `flex`·`28vw`로 3열 분배 금지 |
| **3열 래퍼** | `.calendar-sub-right-list` — sticky + 위 높이·너비. 자식 `.calendar-list`는 `height: 100%` |
| **7:3 split** | `.calendar-split-card--right` — 동일 너비 clamp. `.calendar-list` 본문만 743px (툴바 `calendar-split-card-right__toolbar`는 별도) |

- **금지:** 페이지·도메인 CSS에서 `.calendar-sub-right-list` / `.calendar-list` **높이·너비 재정의** (sticky·모달 `--page-scroll` 예외만)
- **금지:** 우측을 `width: 400px` 고정만 두고 `min-width: 280px`·clamp 생략

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
- [ ] 메인 ◀▶ 이동: **월간** ±1개월 + 선택일 **해당 월 1일** · **주간** ±1주 + 선택일 **해당 주 월요일** (`shiftCalendarViewByStep`)
- [ ] 메인 그리드: 월간 셀 **min 116×124px** · 주간 **56px/시간** · `.calendar-main` / `.calendar-main-container` **min 치수** (DevTools)
- [ ] [오늘] 클릭 시 선택일·주/월 앵커 모두 오늘
- [ ] 3열 + `CalendarMini`이면 미니·메인 **날짜 state 분리** + 미니 **300×332px** (4·6주월 동일 높이)
- [ ] 3열 + `CalendarSearch`이면 `.calendar-search` **`--calendar-search-height`(391px)** + 필터 목록 내부 스크롤
- [ ] 우측 `.calendar-sub-right-list` / `.calendar-list`: **743px** 높이 · **280~400px** clamp 너비 (DevTools)
- [ ] DevTools 3열 우측: `.calendar-sub-right-list`에 **border·box-shadow 없음** · `.calendar-list`에 **border만**(shadow 없음) — 모서리 이중 선 없음
- [ ] DevTools: `.calendar-split-card`에 `box-shadow` 있고 `border` 없음
- [ ] DevTools: 선택 셀에 **셀 전체 border 2px** 없음, 날짜 mint 원만
- [ ] `participating-institutions-calendar-view.css`에 **popover/tooltip만** 추가 (그리드·셀 상태 X)

### 알려진 레거시 (신규 코드 따라가지 말 것)

| 화면 | 이슈 |
|------|------|
| 참여 기관 기본 우측 | `ApplicantScheduleList` — `CalendarSubRight*`로 이전 예정 |
| `applicant-calendar-view.css` | 우측 `border: #f0f0f0` — split-card 이전 패턴 |

---

## 날짜·모드 네비게이션 (공통 — `CalendarMain`)

**코드:** `lib/calendar-navigation.ts` · `lib/use-calendar-navigation-state.ts` · `CalendarMain` 내부 `handleModeChange` / [오늘]

| 규칙 | 동작 |
|------|------|
| **초기 진입** | `selectedDate` = 실시간 오늘. `currentMonth`(표시 앵커) = 모드에 맞게 오늘 기준 (`월간` → 해당 월 1일, `주간` → 해당 주 시작) |
| **월간 → 주간 전환** | `CalendarMain`이 **현재 `selectedDate`가 속한 주**로 앵커 이동 (`syncViewAnchorOnModeChange`). 월 1일 앵커에 묶이지 않음 |
| **[오늘] 버튼** | 선택일·표시 앵커 모두 오늘 (`goToTodayState`). `CalendarMain`이 처리 — 페이지별 `onTodayClick` **불필요**(중복 시에도 `onMonthChange`로 앵커 보정) |
| **◀▶ 월·주 이동** | `CalendarMain` 헤더 prev/next → `shiftCalendarViewByStep`. **월간:** `viewAnchor` ±1개월 + `selectedDate` = 해당 월 **1일** (`resolveMonthDefaultFocusDate`). **주간:** `viewAnchor` ±1주(주 시작=일) + `selectedDate` = 해당 주 **월요일** (`resolveWeekDefaultFocusDate`). `onSelectDate`·`onMonthChange` **둘 다** 호출 — 앵커만 바꾸고 선택일 유지 **금지** |
| **주간 헤더 연·월** | `resolveWeekViewHeaderTitle` — 선택일이 표시 주에 있으면 선택일 기준, 없으면 주 중앙(목) 기준. **`weekDates[0]`(주 시작)만 쓰지 말 것** (월초 선택 시 전월로 표기됨) |

### 좌측 `CalendarMini` (3열 `calendar-set` — **메인과 날짜 연동 금지**)

**코드:** `lib/use-calendar-mini-state.ts` · **스타일:** `styles/calendar-mini.css`

| 규칙 | 값 / 동작 |
|------|-----------|
| **카드 치수** | `.calendar-mini` = **300×332px** 고정 (`width` / `height` / `min-*` / `max-*`) |
| **주 수** | **4~6주** — `countMiniCalendarWeekRows` → `data-week-rows` + `--calendar-mini-week-rows`. Ant는 **항상 6행** tbody → **`data-week-rows` 초과 행 `display: none`** (6행째 잘림 방지) |
| **전후월 날짜** | `fullCellRender`에서 표시 — `.calendar-mini-cell--other-month` (회색). 타월 클릭 불가(`pointer-events: none`) |
| **요일 색** | 일 `.calendar-mini-cell--sunday` 빨강 · 토 `.calendar-mini-cell--saturday` 파랑 (선택·타월 제외) |
| **선택일** | `.calendar-mini-cell--selected` — mint 배경 + **`border-radius: var(--8, 8px)`** (원형 50% **금지**) |
| **좌측 열** | `calendar-sub-left` **300px** — 미니와 동일 너비 |

- **금지:** `.calendar-mini` `max-height: 370px` 등 구버전 가변 높이
- **금지:** 3열·정산 등 공통 `CalendarMini`에서 페이지 CSS로 **300×332** 재정의 (팝오버·템플릿 `.paragraph-calendar-mini` 등 **스코프 래퍼** 내부만 예외)

| 규칙 | 동작 |
|------|------|
| **state 분리** | 미니: `useCalendarMiniState` · 메인·우측 리스트: `useCalendarNavigationState`(또는 페이지 전용 main state) |
| **미니 날짜/월 변경** | `CalendarMini`의 `onSelectDate` / `onMonthChange` → **미니 state만** 갱신. `CalendarMain`의 `selectedDate` / `currentMonth` **변경 금지** |
| **메인 날짜/월 변경** | `CalendarMain` 핸들러 → 메인 state만. 미니 `currentMonth` / `selectedDate` **변경 금지** |
| **우측 일별 리스트** | **메인** `selectedDate` 기준 (`CalendarSubRight*`) — 미니 선택일과 무관 |
| **`programDates` 등 dot** | 미니에만 전달 가능 — 메인 그리드와 독립 탐색 |

```tsx
const main = useCalendarNavigationState('month')
const mini = useCalendarMiniState()

<CalendarMini
  currentMonth={mini.currentMonth}
  selectedDate={mini.selectedDate}
  onMonthChange={mini.onMonthChange}
  onSelectDate={mini.onSelectDate}
  programDates={programDates}
/>
<CalendarMain
  selectedDate={main.selectedDate}
  currentMonth={main.currentMonth}
  mode={main.mode}
  onSelectDate={main.onSelectDate}
  onMonthChange={main.onMonthChange}
  onModeChange={main.onModeChange}
/>
<CalendarSubRightList selectedDate={main.selectedDate} … />
```

- **금지:** 미니·메인에 동일 `selectedDate` / `currentMonth` / `onSelectDate` / `onMonthChange` 공유
- **금지:** 미니 월 이동 시 메인 `setCurrentMonth` 호출 (과거 `calendar-set`·정산 캘린더 패턴)
- **적용 화면:** `CalendarSet.Main`(프로그램 목록 캘린더), `AccountPaymentsCalendarView`(정산 계좌 지급)

### 좌측 `CalendarSearch` (3열 — 프로그램명 리스트 **391px**)

**코드:** `ui/calendar-search.tsx` · **스타일:** `styles/calendar-sub-left.css` (`.calendar-search`) · **토큰:** `.calendar-set { --calendar-search-height: 391px }` (`calendar-layout.css`)

| 규칙 | 값 |
|------|-----|
| **영역 높이** | `.calendar-search` = **`var(--calendar-search-height)`** (기본 **391px**) — `height` / `min-height` / `max-height` 동일 |
| **레이아웃** | `display: flex; flex-direction: column; overflow: hidden` |
| **검색 입력** | `.calendar-search__input` — `flex-shrink: 0` |
| **프로그램 체크 목록** | `.calendar-search__filters` — `flex: 1; min-height: 0; overflow-y: auto` (항목 많을 때 내부 스크롤) |

- **금지:** `flex: 1`로 좌측 열 나머지 높이를 채우게 하기 (과거 `calendar-set.css` 패턴)
- **금지:** 페이지·도메인 CSS에서 `.calendar-search` / `--calendar-search-height` 재정의
- **적용:** `CalendarSet.Main`, `AccountPaymentsCalendarView` 등 `CalendarSearch`를 `calendar-sub-left` 하단에 두는 3열 화면

### 페이지 구현 (`CalendarMain`만 — split·미니 없음)

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
- **금지:** 헤더 ◀▶에서 `onMonthChange`만 호출하고 `selectedDate`를 이전 날짜에 두기 — 우측 일별 리스트·선택 하이라이트가 어긋남

초기 state만 수동일 때: `createInitialCalendarNavigationState(mode)` 사용.

커스텀 prev/next가 필요할 때만 `shiftCalendarViewByStep(mode, currentMonth, direction)` 재사용 — 로직 중복 구현 금지.

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

**Last updated:** 2026-05-29 (CalendarMini 300×332px 고정)
