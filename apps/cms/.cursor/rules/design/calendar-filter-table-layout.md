# FilterTableLayout 안 `calendar-set` — sticky·스크롤·상단 정렬

**목적:** 정산(지급조서·계좌 지급) 등 **필터 카드 안**에 캘린더를 넣을 때, 프로그램 목록 캘린더와 **동일 UX**를 유지한다.

**코드:** `FilterTableLayout` `contentVariant="calendar"` · `filter-table-layout.css` · `calendar-layout.css` · `widgets/layout/layout.css`

**관련:** [calendar-common.md](./calendar-common.md) · [calendar-sub-right-list.md](./calendar-sub-right-list.md)

---

## DOM (필수)

```
layout-content (세로·가로 스크롤 + sticky 기준)
  └─ (선택) page content-wrapper — overflow: visible
       └─ FilterTableLayout.filter-table-layout--calendar-view
            ├─ filter / divider / toolbar
            └─ filter-table-layout__calendar-body  ← overflow: visible만
                 └─ calendar-set
```

- **금지:** `calendar-set`을 FilterTableLayout **밖**으로 빼서 “프로그램 목록처럼” 맞추기 — 정산 등 요구 화면은 **카드 안** 유지.
- **금지:** `__calendar-body`·`filter-table-layout__table`·카드 래퍼에 `overflow-x: auto` / `overflow-y: auto` — **중간 scrollport 생성 = sticky 깨짐**.

---

## scrollport·sticky (단일 소스)

| 항목 | 규칙 |
|------|------|
| **세로·가로 스크롤** | `layout-content:has(.calendar-set)` (`layout.css` · `calendar-layout.css`) |
| **`__calendar-body`** | `overflow: visible` (`filter-table-layout.css`) |
| **sticky 기준** | `layout-content` — **가장 가까운 scroll ancestor**가 중간 래퍼가 되면 안 됨 |
| **`--calendar-set-sticky-top`** | `calc(16px + var(--cms-layout-content-padding-top))` — FilterTableLayout·프로그램 목록 동일 |

### 열별 sticky (`calendar-layout.css` — **override 금지**)

| 패턴 | sticky | scroll 중 동작 |
|------|--------|----------------|
| **3열** (`calendar-sub-left` 있음) | 좌(미니·검색)·우(리스트) | 중앙 메인은 일반 흐름(위로 스크롤됨), **양옆만 따라옴** |
| **2열** (`:not(:has(.calendar-sub-left))`) | 메인·우 | **둘 다** sticky |

- **금지:** 상단 flush 맞추려 `position: static`으로 sticky **전면 해제** — scroll top=0 정렬은 grid·padding으로 맞추고 sticky는 유지.
- **금지:** `layout-content:has(.filter-table-layout--calendar-view) { overflow-x: hidden }` — 프로그램 목록과 scrollport 분리.

---

## scroll top = 0 — shell 상단 flush

- `calendar-set`: `align-items: start`, `margin-top: 0` (FilterTableLayout 안)
- **3열:** `calendar-main` `padding-top: var(--calendar-mini-padding, 20px)` — mini·list shell과 **내부 여백 통일** (카드 외곽은 grid 행 상단 flush)
- **2열:** `grid-template-areas: 'main sub-right'` 명시 (`filter-table-layout.css`)

---

## 가로 폭·내부 스크롤

- FilterTableLayout 안 `calendar-set`: `min-width: 0` — 카드 폭 안에서 grid `minmax`로 배분, **공간 충분 시 카드 내부 가로 스크롤 없음**
- grid 최소 치수 미만일 때만 **`layout-content` 가로 스크롤** (페이지 레벨)
- **금지:** `calendar-set`에 고정 `min-width: 1480px` 등 페이지별 재부여 → 불필요한 **카드 안** 가로 스크롤

---

## 적용 화면

| 화면 | 열 | `contentVariant` |
|------|-----|------------------|
| 지급조서 확인 | 2열 | `'calendar'` |
| 계좌 지급 확인 | 3열 (미니+검색) | `'calendar'` |
| 프로그램 목록 캘린더 | 3열 | FilterTableLayout **밖** (`program-list-calendar-view-container`) — sticky 규칙은 동일 |

---

## 회귀 방지 — 자주 실패한 패치

1. **`__calendar-body { overflow-x: auto }`** → sticky scrollport가 layout-content가 아님 → **계단형 상단·따라오기 실패**
2. **sticky `static` override** → 맨 위 정렬은 되나 **스크롤 시 좌·우 고정 사라짐**
3. **FilterTableLayout 밖으로 이동** → 요구사항 위반 + 필터·캘린더 카드 분리
4. **2열에서 메인만 static** → 지급조서 등 2열은 메인·우 **둘 다** sticky여야 함

---

## PR·수동 QA 체크리스트

- [ ] `contentVariant="calendar"` + `calendar.css` import
- [ ] DevTools: `__calendar-body` computed `overflow` = **visible**
- [ ] **scroll top=0:** 미니·메인·우측(또는 2열 메인·우) **카드 shell 상단 flush**
- [ ] **세로 스크롤:** 3열 좌·우 / 2열 메인+우 **sticky 따라옴**
- [ ] 카드 폭 충분 시 FilterTableLayout **내부** 불필요 가로 스크롤 없음
- [ ] 좁은 뷰포트: `layout-content`에서만 가로 스크롤

**Last updated:** 2026-05-29
