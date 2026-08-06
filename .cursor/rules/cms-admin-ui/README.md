# CMS · Admin 공유 UI 룰

**Homepage Admin** (`apps/admin`)과 **CMS** (`apps/cms`)가 같이 따르는 **시각·목록·필터 의도** SSOT.

앱 전용 구현(스택 이름·경로·도메인 스펙)은 각 앱 `.cursor/rules` 에 두고, 여기에는 **숫자·의도·금지 패턴**만 둔다.

| 공유 룰 | 내용 |
|---------|------|
| [filter-area-dimensions.mdc](./filter-area-dimensions.mdc) | 필터 칸 240 · gap 12 · 조회 160×44 · dateRange 500 |
| [list-filter-url-sync.mdc](./list-filter-url-sync.mdc) | draft + 조회 · `searchParams` 단일 소스 |
| [list-table-shell.mdc](./list-table-shell.mdc) | 목록 카드 padding 20 · 툴바 gap 16 · 액션 8 |
| [cms-data-table.mdc](./cms-data-table.mdc) | `cms-data-table` th/td 패딩·높이 |
| [table-th.mdc](./table-th.mdc) | th `--BG-header` · `--table-line` |
| [table-td-divider.mdc](./table-td-divider.mdc) | 값 셀 문자 `\|` 금지 · 디바이더 컴포넌트 |
| [styling-tokens.mdc](./styling-tokens.mdc) | color/spacing 토큰 우선 |

## 앱 어댑터

| 앱 | 진입 문서 |
|----|-----------|
| Admin | [`apps/admin/.cursor/rules/README.md`](../../../apps/admin/.cursor/rules/README.md) |
| CMS | [`apps/cms/.cursor/rules/README.md`](../../../apps/cms/.cursor/rules/README.md) |

## 원칙

1. **공통 스펙 변경** → 이 폴더만 수정한다. 앱 문서에 숫자를 다시 박지 않는다.
2. **스택이 다른 것** (예: CMS `useTablePage` vs Admin `useListFilterUrl`)은 앱 어댑터에만 적는다.
3. CMS `process/*`·프로그램 유형·캘린더 전용 스펙은 **공유하지 않는다**.

**Last updated:** 2026-08-06
