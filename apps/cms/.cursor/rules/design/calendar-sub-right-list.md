# 캘린더 우측 일별 리스트 (`calendar-sub-right-list`)

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

체크박스 영역: 행 세로 중앙(`align-items: center`), `__checkbox` hit area(예: 52×52) + mint 배경 hover — 정산 `settlement-list-item__checkbox`·UJAT `ujat-institution-application-list-item__checkbox` 패턴. **행 shell hover와 별도**로 item CSS에만 둔다.

---

## 구현 참고

| 용도 | 파일 |
|------|------|
| 프로그램 일정 | `calendar-sub-right-list.tsx` → `CalendarSubRightProgramList` |
| UJAT 기관 신청 | `calendar-sub-right-list.tsx` → `CalendarSubRightInstitutionApplicationList` |
| 프로그램 상세 스케줄 리스트 | `program-schedule-list.tsx` |
| 정산 (레거시) | `CalendarSubRightSettlementList` — 현재 `settlement-list-item.css`에 hover 중복. **신규/수정 시 `calendar-list-item` 패턴으로 통일 권장** |

도메인 예: UJAT 기관 — `item-list/ujat-institution-application.tsx` (내부 레이아웃만), shell은 리스트에서 `calendar-list-item`으로 감쌈.

### 풀페이지 모달에서 페이지 스크롤 + 우측 리스트 고정

- 캘린더 뷰 루트에 `ujat-institution-application-calendar-view--page-scroll` (또는 동일 패턴의 `--no-inner-scroll` 래퍼).
- `detail-fullpage-modal__content`가 `overflow-x: hidden`이면 `position: sticky`가 깨짐 → `:has(...--page-scroll)` 시 `overflow-x: clip` (`detail-fullpage-modal.css`, 강사 정산 캘린더와 동일).
- `.calendar-sub-right-list`에 `position: sticky`, `top: var(--calendar-set-sticky-top)`, `align-items: flex-start` 부모.
- 하단 여백 52px: 테이블 → `detail-fullpage-modal__content` `padding-bottom`. 캘린더 → `__content` `padding-bottom: 0` + `ujat-institution-application-list__page-bottom-spacer`(52px 블록). sticky `max-height`에서 52px 차감.

---

## 금지

- `.calendar-list` 안에서 `.calendar-list-item` 없이 도메인 루트만 렌더링 (hover·간격 불일치)
- 도메인 CSS에서 `:hover`로 mint 효과를 다시 정의하거나 **끄기** (`border-width: 1px !important` 등)
- `calendar-sub-right.css`와 다른 transition/hover 토큰을 item 파일에 복제

---

**Last updated:** 2026-05-15
