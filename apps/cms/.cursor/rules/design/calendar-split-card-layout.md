# 7:3 카드형 캘린더 분할 (`CalendarSplitCardLayout`)

**상위 규칙 (필수):** [calendar-common.md](./calendar-common.md) — shell 토큰·셀 단일 소스·체크리스트

**Scope:** 참여 기관·UJAT 봉사자 면접 등 **좌 캘린더 7 : 우 일별 리스트 3** 풀폭 카드 레이아웃.

**Styles:** `shared/components/calendar/styles/calendar-split-card-layout.css` (import: `styles/calendar.css`)

**Component:** `CalendarSplitCardLayout` — `left` / `right` 슬롯만 받는다. 로딩은 `loading` prop.

---

## 이중 카드가 보이는 이유 (자주 놓치는 부분)

스크린샷처럼 **래퍼가 2개**처럼 보이는 경우, DOM `<div>` 개수만 보면 안 된다.

| 레이어 | 역할 |
|--------|------|
| `.calendar-split-card--left` / `--right` | 7:3 **유일한** shell — `box-shadow: 0 0 16px …` (`calendar-main` / `.calendar-list`와 동일). **`border`로 카드 테두리 금지** |
| `.calendar-main` (`calendar-main.css`) | `calendar-set`용 **내장 카드** (그림자·radius·패딩) |
| `.calendar-list` (`calendar-sub-right.css`) | `calendar-sub-right-list`용 **내장 카드** (그림자·radius·패딩) |

split-card 안에 `CalendarMain` / `CalendarSubRight*`를 넣으면 **CSS가 카드를 두 겹** 그린다.  
→ `calendar-split-card-layout.css`에서 `.calendar-split-card--left > .calendar-main`, `.calendar-split-card--right > .calendar-list`의 box-shadow·border·padding을 **반드시 제거**한다. (페이지에서 `<div>`를 더 빼는 것만으로는 해결되지 않음.)

**선(테두리)으로 보이는 경우:** 바깥 `.calendar-split-card`에 `border: 1px solid #f0f0f0`만 주고 `box-shadow`를 빼면 공통 캘린더와 다르게 보인다. shell은 그림자만 쓴다.

---

## 좌측 캘린더 (필수)

1. `CalendarSplitCardLayout`의 `left`에 **`CalendarMain`만** 둔다.
2. **`calendar-main-container`를 추가하지 않는다.** (`calendar-set` 3열 레이아웃 전용. 7:3 카드 좌측은 `.calendar-split-card--left`가 flex 컨테이너 역할.)
3. `CalendarMain`에는 `className="calendar-split-card-main"`만 추가한다.
4. split-card 안에서는 **`calendar-main`에 별도 카드 스타일을 주지 않는다** — shell은 `calendar-split-card-layout.css`.
5. **그리드·요일 헤더·일정 칩**만 `calendar-split-card-main.css`(shared). **셀 min 116×124px·주간 56px/h**는 `calendar-main.css` / `calendar-cell.css` / `calendar-antd-override.css` 토큰 — **도메인 CSS에서 `.calendar-cell--*`·고정 px 재정의 금지.** `participating-institutions-calendar-view.css` 등은 tooltip/popover만.
6. 주간 시간 격자(`.calendar-week--time-grid`)에서는 좌측 카드 고정 높이(900px)를 쓰지 않는다. `calendar-split-card-layout.css`의 `:has(.calendar-week--time-grid)` 분기로 `height:auto` + `overflow:visible`이 적용되어야 한다.

### 셀 상호작용 (공통 `CalendarMain`과 동일)

| 상태 | 공통 (`calendar-cell.css`) | 금지 (과거 참여 기관 오버라이드) |
|------|---------------------------|----------------------------------|
| 호버 | `background: var(--status-hover-bg)` | `:hover { }` 비우기 |
| 선택 | 날짜 숫자에 mint 원형 배지 | 셀 전체 `border: 2px` |
| 오늘(미선택) | 일반 날짜 숫자 | 오늘에 항상 mint 원 |
| 타월 | `#f8f9fa` 배경 | 배경 제거·텍스트만 회색 |

페이지·도메인 CSS에서 `.calendar-split-card-main .calendar-cell--selected` 등을 **추가하지 않는다.** 재발 시 DevTools에서 해당 선택자가 `calendar-cell.css`보다 specificity가 높은지 확인.

```tsx
<CalendarSplitCardLayout
  left={
    <CalendarMain
      className="calendar-split-card-main"
      events={events}
      /* ... */
    />
  }
  right={/* 아래 우측 규칙 */}
/>
```

### 금지 (좌측)

- `calendar-main-container` + `CalendarMain` 중첩
- `participating-institutions-calendar-card--left` 등 **레이아웃 카드를 페이지에서 다시 만드는 것** (`CalendarSplitCardLayout`이 이미 제공)
- `CalendarMain` 바깥에 의미 없는 `<div>` 래퍼만 추가하는 것
- split-card 사용 시 `calendar-main`에 `box-shadow` / `border-radius` / 추가 `padding`을 **페이지 CSS로 다시 켜는 것**

---

## 우측 일별 리스트 (필수)

1. **공통 리스트 shell:** `CalendarSubRightList` / `CalendarSubRightVolunteerInterviewList` / `CalendarSubRightSettlementList` 등 — 내부가 `.calendar-list` + `.calendar-list-item` 구조 ([calendar-sub-right-list.md](./calendar-sub-right-list.md)).
2. **`calendar-sub-right-list` 클래스 래퍼를 7:3 카드 우측에 추가하지 않는다.** (`calendar-set` 3열 sticky 전용. 카드 우측은 `.calendar-split-card--right` + `.calendar-list` 직접. 너비·높이는 [calendar-common.md](./calendar-common.md) `--calendar-sub-right-list-*` 토큰.)
3. **`applicant-schedule-list` / 도메인 전용 리스트 루트를 새로 만들지 않는다.** 신규 도메인은 `item-list/*` + `CalendarSubRight*` 목록 컴포넌트로 확장.
4. 필터·툴바만 필요하면 `calendar-split-card-right__toolbar` 한 겹만 허용. 그 아래는 공통 리스트 컴포넌트.

```tsx
right={
  <CalendarSubRightVolunteerInterviewList
    rows={dayListRows}
    onRowClick={handleListRowClick}
    resolveRowColors={resolveRowColors}
  />
}
```

### 금지 (우측)

- `participating-institutions-calendar-default-right` 등 **리스트 전용 래퍼** 재도입
- `.calendar-list` 없이 `applicant-schedule-item` 마크업만 복제
- 도메인 CSS에서 `.calendar-list-item` hover 재정의
- split-card 우측에서 `.calendar-list`에 테두리·그림자·radius를 **다시 주는 것** (우측 카드와 이중 shell)

---

## 화면별 참고

| 화면 | 좌 | 우 |
|------|----|----|
| UJAT 봉사자 면접(서류합격·2차) | `ujat-volunteer-doc-passed-calendar-view.tsx` | `CalendarSubRightVolunteerInterviewList` |
| 참여 기관 | `participating-institutions-calendar-view.tsx` | 기관 필터 + `ApplicantScheduleList` (레거시, 점진 이전) |
| 프로그램 목록·정산 등 3열 | `CalendarSet` / `calendar-set` | `calendar-sub-right-list` + `calendar-main-container` |

---

**Styles:** `calendar-split-card-layout.css`, `calendar-split-card-main.css` (그리드만), `calendar-cell.css` (상호작용)

**Last updated:** 2026-05-28
