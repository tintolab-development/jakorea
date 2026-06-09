# Shared UI components (`@/shared/ui`)

**Reference:** [ui-principles.md](../design/ui-principles.md)  
Use these for consistent user-facing patterns across CMS.

---

## 1. `StatusDisplay` (`@/shared/ui/status-display`)

Sentence-level status with optional Badge. Pass `status`, `statusLabels`, optional `statusColors`, `showBadge`.

```tsx
<StatusDisplay
  status={application.status}
  statusLabels={{ submitted: 'Application received.', reviewing: 'Under review.' }}
  statusColors={{ submitted: 'default', reviewing: 'processing' }}
/>
```

---

## 2. `SingleCTA` (`@/shared/ui/single-cta`)

One primary action: **`targetUrl` or `onClick` required** (not neither).

```tsx
<SingleCTA label="Apply" targetUrl="/applications/new" type="primary" />
<SingleCTA label="Submit" onClick={submit} loading={loading} />
```

---

## 3. `GuideMessage` / `GuideParagraph`

Fixed guidance from server — **no paraphrasing**; preserve order for `GuideParagraph`.

```tsx
<GuideMessage message={server.guide} type="info" />
<GuideParagraph messages={server.lines} type="secondary" />
```

---

## 4. `ResultScreen`

Completion / outcome pages: `status`, `title`, optional `subTitle`, `description`, `guideMessages`, `cta`.

---

## 5. `EmptyState`

Empty lists with optional CTA (`description`, optional `cta`).

---

## 6. `StatusTimeline`

Show history of status steps with `items` + `statusLabels` / `statusColors`.

---

## 7. `CrossTable` (`@/shared/ui/cross-table`)

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

## 8. `DetailInfoForm` 다블록 기본 정보

상태 블록 + 프로필 블록 등 **연속 격자**는 Form 2개(`title` / `hideHeader`) + `applicant-instructor-basic-info` 래퍼.  
로컬 gap·border CSS 추가 금지. → [detail-info-form-layout.mdc](../design/detail-info-form-layout.mdc)

---

## Common compositions

- **Status + next action:** `StatusDisplay` + conditional `SingleCTA` from API `nextAction`.  
- **Result:** `ResultScreen` with success/error and optional CTA.  
- **Empty:** `EmptyState` + CTA to create or navigate.

---

## Engineering habits

1. Prefer small, testable pieces; extract hooks when logic grows.  
2. Split files **> ~200 lines**; keep UI vs data hooks separated.  
3. Run `pnpm typecheck` before merge.

See [refactoring-principles.md](./refactoring-principles.md), [custom-hooks.md](./custom-hooks.md).

**Last updated:** 2026-05-19
