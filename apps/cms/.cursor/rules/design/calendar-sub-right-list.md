# 캘린더 우측 일별 리스트 (`calendar-sub-right-list`)

**상위 규칙 (필수):** [calendar-common.md](./calendar-common.md)

**Scope:** `shared/components/calendar` — 메인 캘린더와 함께 쓰는 우측 `.calendar-sub-right-list` / `.calendar-list` 영역.

**Styles:** `styles/calendar-sub-right.css` (import: `styles/calendar.css`)

---

## 공통 행 shell (필수)

일별 리스트의 **각 행**은 반드시 아래 구조를 따른다.

1. 컨테이너: `.calendar-list` (빈 목록 시 `.calendar-list--empty` 추가)
2. 행: `.calendar-list-item`
3. 내용 래퍼: `.calendar-list-item__column` (또는 동일 역할의 단일 column)
4. 도메인 UI: `item-list/*` 컴포넌트 (제목·메타·체크박스 등)

### 일정 색상이 있는 행

프로그램·UJAT 기관 신청 등 `SCHEDULE_COLORS` 배경/테두리를 쓰는 경우:

```tsx
<div
  className="calendar-list-item"
  data-has-color="true"
  style={{
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
  }}
>
  <div className="calendar-list-item__column">{/* 도메인 콘텐츠 */}</div>
</div>
```

- **배경·테두리·hover·cursor·transition**은 `.calendar-list-item`에만 둔다.
- 도메인 전용 CSS(`*-list-item.css`)에는 **hover / cursor / border-width / box-shadow 재정의를 추가하지 않는다.**

### Hover (mint)

`calendar-sub-right.css`의 `.calendar-list-item:hover`만 사용한다.

- 2px mint 테두리 (`--JA-mint-01`)
- 배경 `#fff`, 그림자

클릭 가능한 프로그램 행은 `onClick`을 `.calendar-list-item`에 둔다. 체크박스·버튼은 `stopPropagation`으로 행 클릭과 분리한다.

체크박스 영역: `.calendar-list-item__checkbox` (`calendar-sub-right.css`) — `padding: 12px`, `border-radius: 6px`, hover `rgba(1, 161, 175, 0.06)`. **행 shell hover와 별도**로 공통 shell에만 둔다. item CSS에서 hit area·hover 재정의 금지.

### 체크박스 마크업 (필수)

| ✅ | ❌ |
|----|-----|
| `className="calendar-list-item__checkbox"` | `ujat-*-list-item__checkbox`, `settlement-list-item__checkbox` 등 도메인 전용 hit 래퍼 |
| `stopPropagation` on checkbox wrapper | 체크박스 hover를 item CSS에 새로 작성 |

신규 `CalendarSubRight*` / `item-list/*` 추가 시 institution·settlement 파일을 **복사하지 말고** 위 클래스만 붙인다. (`calendar.css` import ≠ hover 자동 적용 — **클래스 연결**이 필요.)

**사례 — UJAT 2차 면접:** 최초 구현에서 `ujat-volunteer-interview2-list-item__checkbox`만 사용 → 공통 hover 미적용. 수정: 래퍼를 `calendar-list-item__checkbox`로 교체, item CSS의 checkbox 블록 삭제.

---

## 7:3 카드형 우측 vs `calendar-set` 3열

- **`calendar-set` + `.calendar-sub-right-list`:** 미니 캘린더·검색이 있는 3열. 우측은 sticky 400px 래퍼.
- **`CalendarSplitCardLayout` + `.calendar-split-card--right`:** 7:3 카드. 우측에는 **`.calendar-list`만** 두고 `.calendar-sub-right-list` 래퍼를 **추가하지 않는다.** → [calendar-split-card-layout.md](./calendar-split-card-layout.md)
- **7:3 카드 안의 `.calendar-list`:** 기본 `calendar-sub-right.css`의 border·box-shadow는 **끈 상태**여야 한다. shell은 `.calendar-split-card--right`만 담당.

---

## 구현 참고

| 용도 | 파일 |
|------|------|
| 프로그램 일정 | `calendar-sub-right-list.tsx` → `CalendarSubRightProgramList` |
| UJAT 기관 신청 | `CalendarSubRightInstitutionApplicationList` + `item-list/ujat-institution-application.tsx` — 체크박스 **`calendar-list-item__checkbox`** |
| UJAT 봉사자 1차 서류 합격 | `CalendarSubRightVolunteerInterviewList` + `item-list/ujat-volunteer-interview.tsx` (체크박스 없음) |
| UJAT 봉사자 2차 면접 | `CalendarSubRightVolunteerInterview2List` + `item-list/ujat-volunteer-interview2.tsx` — 체크박스 **`calendar-list-item__checkbox`** |
| 프로그램 상세 스케줄 리스트 | `program-schedule-list.tsx` |
| 정산 | `CalendarSubRightSettlementList` + `item-list/settlement.tsx` — 체크박스 **`calendar-list-item__checkbox`** |

도메인 예: UJAT 기관 — `item-list/ujat-institution-application.tsx` (내부 레이아웃만), shell은 리스트에서 `calendar-list-item`으로 감쌈.

### 풀페이지 모달에서 페이지 스크롤 + 우측 리스트 고정

- 캘린더 뷰 루트에 `ujat-institution-application-calendar-view--page-scroll` (또는 동일 패턴의 `--no-inner-scroll` 래퍼).
- `detail-fullpage-modal__content`가 `overflow-x: hidden`이면 `position: sticky`가 깨짐 → `:has(...--page-scroll)` 시 `overflow-x: clip` (`detail-fullpage-modal.css`, 강사 정산 캘린더와 동일).
- `.calendar-sub-right-list`에 `position: sticky`, `top: var(--calendar-set-sticky-top)`, `align-items: flex-start` 부모.
- 하단 여백 52px: 테이블 → `detail-fullpage-modal__content` `padding-bottom`. 캘린더 → `__content` `padding-bottom: 0` + `ujat-institution-application-list__page-bottom-spacer`(52px 블록). sticky `max-height`에서 52px 차감.

---

## 금지

- 7:3 카드 우측에 `applicant-schedule-list`·커스텀 리스트 루트로 `.calendar-list-item` shell 우회
- 7:3 카드 우측에 `.calendar-sub-right-list` 래퍼 추가 (이중 래퍼)
- `.calendar-list` 안에서 `.calendar-list-item` 없이 도메인 루트만 렌더링 (hover·간격 불일치)
- 도메인 CSS에서 `:hover`로 mint 효과를 다시 정의하거나 **끄기** (`border-width: 1px !important` 등)
- `calendar-sub-right.css`와 다른 transition/hover 토큰을 item 파일에 복제
- 체크박스 hit 영역에 도메인 전용 `__checkbox` 클래스 사용 (공통 `.calendar-list-item__checkbox` 우회)

---

**Last updated:** 2026-05-29
