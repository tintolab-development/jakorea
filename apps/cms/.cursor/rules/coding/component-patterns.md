# Shared UI components (`@/shared/ui`)

**Reference:** [ui-principles.md](../design/ui-principles.md)  
Use these for consistent user-facing patterns across CMS.

---

## Design System 분류

- **Current:** 신규 화면 사용 가능. `Cms*`, `CmsButton`, `LoadingButton`, `EditableStatusBadge`, `AppStatusBadge`, 도메인 `*StatusBadge`, `InstructorPaymentStatusBadge`, `PermissionModal`, `StatusDropdownCell`, `DetailInfoForm`, `CrossTable`.
- **Not catalogued:** 호출 0 고아, 상위 컴포넌트 내부 조각, 화면 의존성이 큰 도메인 모달·전체 화면, 공용 구현이 없는 UI.

삭제된 `StatusBadge`/`StatusDisplay` (`shared/ui`), `AppButton`/`FilterSearchButton`, `SettlementStatusBadge`, `PermissionRejectModal`, `AuthLoadingButton` 및 `StatusDropdownCell tagLayout="tag132"`는 사용 가능한 API로 취급하거나 재도입하지 않는다.

---

## 1. `SingleCTA` (`@/shared/ui/single-cta`)

One primary action: **`targetUrl` or `onClick` required** (not neither).

```tsx
<SingleCTA label="Apply" targetUrl="/applications/new" type="primary" />
<SingleCTA label="Submit" onClick={submit} loading={loading} />
```

---

## 2. `GuideMessage` / `GuideParagraph`

Fixed guidance from server — **no paraphrasing**; preserve order for `GuideParagraph`.

```tsx
<GuideMessage message={server.guide} type="info" />
<GuideParagraph messages={server.lines} type="secondary" />
```

---

## 3. `ResultScreen`

Completion / outcome pages: `status`, `title`, optional `subTitle`, `description`, `guideMessages`, `cta`.

---

## 4. `EmptyState`

Empty lists with optional CTA (`description`, optional `cta`).

---

## 5. `StatusTimeline`

Show history of status steps with `items` + `statusLabels` / `statusColors`.

---

## 6. `CrossTable` (`@/shared/ui/cross-table`)

행·열 헤더가 교차하는 가변 격자(예: 학년 × 교시). **인라인 matrix `<table>` 금지** — [cross-table.md](../design/cross-table.md).

```tsx
<CrossTable
  corner="학년 / 교시"
  columnHeaders={['1교시', '2교시']}
  rows={[{ rowHeader: '1학년', cells: ['09:00 ~ 09:40', '-'] }]}
/>
```

`DetailInfoForm` 안에서는 `DetailInfoForm.Row type="custom"`으로 감싼다.

---

## 7. `DetailInfoForm` 다블록 기본 정보

상태 블록 + 프로필 블록 등 **연속 격자**는 Form 2개(`title` / `hideHeader`) + `applicant-instructor-basic-info` 래퍼.  
로컬 gap·border CSS 추가 금지. → [detail-info-form-layout.mdc](../design/detail-info-form-layout.mdc)

---

## Common compositions

- **Status + next action:** Current domain status badge + conditional `SingleCTA`.
- **Result:** `ResultScreen` with success/error and optional CTA.  
- **Empty:** `EmptyState` + CTA to create or navigate.

---

## Engineering habits

1. Prefer small, testable pieces; extract hooks when logic grows.  
2. Split files **> ~200 lines**; keep UI vs data hooks separated.  
3. Run `pnpm typecheck` before merge.

See [refactoring-principles.md](./refactoring-principles.md), [custom-hooks.md](./custom-hooks.md).

**Last updated:** 2026-07-15
