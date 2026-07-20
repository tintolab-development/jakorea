---
priority: critical
always_include: true
category: coding
---

# Prefer shared CMS controls (`Cms*`)

For **new or touched** UI in `apps/cms/src/**`, prefer components under `shared/ui` instead of raw Ant controls when equivalents exist.

## SSOT (CMS only)

제품 룩의 단일 원본은 **`theme-provider` + `apps/cms/src/shared/*`** 이다.

- `/design-system`은 동일 Current 컴포넌트의 **라이브 카탈로그**다. `page.css`는 데모 레이아웃만.
- **`apps/platform/**`, `packages/ui`는 CMS DS 공통화 범위 밖**이다. CMS `shared`/`theme-provider` 변경이 Platform에 전달되지 않는다.
- 로드맵·체크리스트: [`docs/design-system/cms-shared-ssot-migration.md`](../../docs/design-system/cms-shared-ssot-migration.md)
- DS/`shared`/토큰 변경 시 Impact audit 지표 갱신: [`design/design-system-impact-audit.mdc`](../design/design-system-impact-audit.mdc) (`/design-system#impact-audit`)

## Mandatory

1. If `shared/ui` provides a control for the job, **do not** drop raw Ant `Button`, `Input`, `Select`, `Radio`, `Checkbox`, `Switch`, `DatePicker` in new code.  
2. Standard replacements include **`CmsInput`, `CmsSelect`, `CmsRadio(Group)`, `CmsCheckbox`, `CmsToggle`, `CmsDatePicker`, `CmsDateRangePicker`, `CmsButton`**.  
3. Use `CmsButton` for CMS-styled actions and `LoadingButton` where the Ant default button appearance is required. Deleted button wrappers must not be reintroduced.
4. Avoid importing **other features’ CSS** into new components for styling shortcuts.  
5. Prefer **`EditableStatusBadge` / domain `*StatusBadge` (`@/shared/components`)** over bare `Tag` walls for state.
   - 강사 정산 배지는 `InstructorPaymentStatusBadge`, 권한 승인·반려 모달은 `PermissionModal`을 사용한다.
   - 편집 상태 셀은 `StatusDropdownCell`의 generic `style` 또는 `tagLayout="default"`를 기본으로 하고, 현행 명시적 레이아웃만 사용한다.
   - 삭제된 `StatusBadge`/`StatusDisplay` (`shared/ui`), `AppButton`/`FilterSearchButton`, `SettlementStatusBadge`, `PermissionRejectModal`, `AuthLoadingButton`, `tag132` API를 import·alias·옵션으로 복원하지 않는다.
6. For member-style forms, prefer **`DetailInfoForm`** patterns where applicable.
7. 관리 목록은 **`FilterTableLayout` + `TableFilterGroup` + `cms-data-table`** 스택을 우선한다.

## Design System coverage

- **Current:** 신규 화면 사용 가능. 공개 `/design-system`의 일반 섹션에 라이브 데모 제공.
- **Not catalogued:** 고아·내부 구현·도메인 전체 화면·공용 구현이 없는 UI. 카탈로그를 채우기 위해 가짜 공통 컴포넌트를 만들지 않는다.

## Allowed exceptions (의도적)

| 영역 | 허용 | 비고 |
|------|------|------|
| Auth | `LoadingButton` | antd 기본 룩이 필요한 인증 플로우. raw `Button`은 `LoadingButton`/`CmsButton`으로 정리 |
| Dashboard 위젯 본체 | Not catalogued | 위젯 셸을 shared로 승격하지 않음. 액션은 `CmsButton`/`LoadingButton`. presentational만 DS `#dashboard` 데모 — 감사: `docs/design-system/dashboard-widget-catalog-audit.md` |
| 도메인 풀페이지·유형별 UI | Not catalogued / `variant` 분기 | `program-type-isolation` 준수. 기본값은 원래 유형 유지 |
| shared 동등물 없음 | raw Ant + TODO | 아래 Fallback |

## Exceptions (fallback)

Only when no shared wrapper exists **and** extending it is out of scope—leave:

```tsx
// TODO(custom-ui): Ant fallback until shared wrapper exists.
```

## Scope

All new pages/modals/filters; any edit that adds inputs must follow the same rule.  
공통 룩 변경(Phase 5)은 채택률 확보·회귀 검증 후에만 `shared`/`theme-provider`에서 수행한다.

**Last updated:** 2026-07-15
