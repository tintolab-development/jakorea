# CMS CSS Override 감사 (Phase 4)

공유 스타일 변경이 feature `!important`/hex에 막히지 않도록 감사한 결과와 유지·이관 정책을 기록한다. **시각 값은 동결**한다.

## 정책

| 허용 (feature) | 금지화 방향 |
|----------------|-------------|
| 폭·간격·스크롤·sticky 등 레이아웃 | 색·타이포·상태색 재정의 |
| 도메인 모달 전용 레이아웃 | shared 기본 색을 덮는 hex + `!important` |

공통 룩 변경은 `theme-provider` / `shared/*`만. Platform·`packages/ui` 제외.

## Shared 고파급 파일

| 파일 | `!important` 밀도 | 판정 | 비고 |
|------|-------------------|------|------|
| `shared/components/filter-controls-common.css` | 높음 | **유지** | antd Select/DatePicker 높이·화살표 맞추기용 레이아웃 override. 색은 토큰 |
| `shared/ui/cms-button.css` | 높음 | **유지 + 토큰 fallback** | antd Button 특이도 대응. hex → `var(--color-*)` |
| `shared/ui/cms-data-table.css` | 중 | **유지** | row/hover/border. `--table-line` → `--color-border` alias 권장 |
| `shared/components/status-dropdown-cell.css` | 중 | **유지** | 셀 상태 톤. 브랜드 border는 mint/brand 토큰 |
| `shared/components/date-time-picker-modal.css` | 중 | **축소** | danger border `var(--color-settlement)` |
| `widgets/layout` sidebar/header | 낮음~중 | **유지** | 레이아웃 chrome |

## Feature 고밀도 (후속 축소 후보)

| 파일 | 대략 count | 권고 |
|------|------------|------|
| `features/program/general/ui/add-instructor-modal.css` | ~100 | 레이아웃만 남기고 색 토큰화 (별 PR) |
| `features/template/ui/shared/paragraph-input.css` | ~54 | 템플릿 전용 — Not catalogued 경계 유지 |
| `pages/data-management/sponsor-page.css` | ~51 | 목록 페이지 — shared table와 중복 hex 점검 |
| `features/dashboard/ui/program-schedule-widget.css` | ~44 | Dashboard Not catalogued — 위젯 한정 허용 |
| `features/settlement/.../payment-order-*-modal.css` | 다수 | 도메인 모달 — 값 동결 후 점진 토큰 |

## Phase 4에서 한 일 (값 동일)

- `date-time-picker-modal.css`: `#ff4d4f` → `var(--color-settlement)`
- `status-dropdown-cell.css`: 활성 border → `var(--color-brand-primary)`
- `cms-button.css` / `cms-data-table.css`: 브랜드·면색 fallback을 `:root` 토큰으로 정렬
- 본 감사 표 + `cms-shared-ssot-migration.md` Phase 4 링크

## 신규 PR 체크

- [ ] feature CSS에 색/`!important` 추가 시 이유를 PR에 적고, 가능하면 shared·토큰으로
- [ ] filter/table/button 룩 변경은 shared만
- [ ] 프로그램 유형 UI는 isolation 준수

**Last updated:** 2026-07-15
