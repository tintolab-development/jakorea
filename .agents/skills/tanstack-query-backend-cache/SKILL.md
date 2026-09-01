---
name: tanstack-query-backend-cache
description: >-
  Audit, design, implement, and verify TanStack Query v5 caching policies for
  backend API responses in JaKorea CMS and Platform. Use when adding an API,
  creating a query or mutation hook, reviewing caching, optimizing API calls,
  fixing stale frontend data, adding pagination or infinite scroll, or changing
  authentication or permissions.
---

# TanStack Query Backend Cache

Frontend **server-state** caching for backend API responses via TanStack Query v5.
Not browser HTTP, CDN, Redis, backend app cache, or Service Worker.

Applies to **both** apps:

| App | Path | Query key root | RQ today |
| --- | --- | --- | --- |
| CMS | `apps/cms` | `['cms', …]` | Yes — follow existing factories + this skill |
| Platform | `apps/platform` | `['platform', …]` | No — introduce RQ only with this policy |

Persistent constraints: [backend-response-cache-policy.mdc](../../rules/backend-response-cache-policy.mdc)

References (read as needed):

- [cache-policy-matrix.md](references/cache-policy-matrix.md)
- [query-key-guidelines.md](references/query-key-guidelines.md)
- [mutation-cache-sync.md](references/mutation-cache-sync.md)

## When to use

- Add/change API query or mutation hooks
- Review or optimize caching / duplicate requests
- Fix stale UI after create/update/delete
- Add pagination, infinite query, or prefetch
- Change auth, logout, account, or org/tenant scope
- Introduce TanStack Query into Platform

## Workflow

Copy and track:

```text
Cache task:
- [ ] 1 Discover
- [ ] 2 Classify
- [ ] 3 Select policy
- [ ] 4 Implement
- [ ] 5 Validate
- [ ] 6 Report
```

### Step 1: Discover

Inspect the **target app** only (CMS vs Platform — do not mix):

1. `package.json` — `@tanstack/react-query` version (must be v5).
2. `QueryClient` / `QueryClientProvider` / defaults (`staleTime`, `gcTime`, retry, refetch*).
3. API client (axios/fetch), interceptors, error shape for HTTP status.
4. Auth logout / MFA / account / org-switch — existing `clear*` / `removeQueries` / `clear()`.
5. Query key factories under `features/**/api/*-query-keys.ts` and `shared/api`.
6. All `useQuery` / `useMutation` / `useInfiniteQuery` / `invalidateQueries` / `setQueryData`.
7. Zustand/Context stores that duplicate backend payloads.

**Verified CMS facts (do not re-assume blindly — re-check if code moved):**

- Client: `apps/cms/src/shared/lib/query-client.ts` — `staleTime: 60_000`, `retry: 1`; no global `gcTime` / focus policy yet.
- Provider: `apps/cms/src/app/providers/query-provider.tsx`
- Logout clears 7 domains via `clear*QueryCache` in `auth-store.ts`; notifications / form-templates / general-programs / legacy `['users']` may still leak — fix when touching auth or those domains.
- No Devtools, no persist, no `queryOptions` factories yet (prefer introducing them).
- Platform: no RQ dependency as of last audit.

### Step 2: Classify

Assign each query to A–G (see rule + matrix):

| Class | Meaning |
| --- | --- |
| A | Static reference |
| B | Low-frequency reference |
| C | Standard list |
| D | Detail |
| E | Frequently changing operational |
| F | User/role/tenant/org scoped (combine with A–E) |
| G | One-time / non-cacheable (prefer mutation or direct call) |

For each query record: change frequency, stale impact, sensitivity, size, navigation frequency, mutation frequency, cross-user variance, derived counts/status.

### Step 3: Select policy

Choose and **document a reason** for:

- `staleTime`, `gcTime`
- refetch (focus / reconnect / mount / interval)
- retry
- pagination / infinite / prefetch
- mutation sync
- logout / scope cleanup
- persistence eligibility (default: **no**)

Baseline QueryClient (adapt `getHttpStatus` to the app’s axios/error shape — do not invent):

```ts
defaultOptions: {
  queries: {
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      const status = getHttpStatus(error)
      if ([400, 401, 403, 404, 409, 422].includes(status ?? -1)) return false
      return failureCount < 2
    },
    retryDelay: (i) => Math.min(1000 * 2 ** i, 10_000),
  },
  mutations: { retry: false },
}
```

Do not raise global `staleTime` only to cut traffic.

### Step 4: Implement

Order (no blind repo-wide rewrite):

1. Fix QueryClient defaults if needed (one app at a time).
2. Establish / align query key factories (`['cms'| 'platform', domain, …]`).
3. Add domain `queryOptions` / `infiniteQueryOptions`.
4. Apply policy to **1–2 representative domains**, verify, then migrate incrementally.
5. Complete logout / scope-switch cleanup for all user-scoped keys.
6. Remove safe Zustand/server-state duplication only when behavior is preserved.
7. Preserve public hook interfaces where possible.

CMS dashboard: keep `scope('remote'|'mock')` and existing clear helpers — extend coverage, do not drop auth-boundary rules.

Platform first RQ setup checklist:

- [ ] Add `@tanstack/react-query` v5
- [ ] Singleton `queryClient` + provider
- [ ] `['platform', …]` key factories
- [ ] Logout removes platform queries
- [ ] Status-aware retry from Platform API error shape

### Step 5: Validate

- Typecheck / lint / existing tests for the app (`pnpm --filter cms …` or platform equivalent).
- Devtools + Network: revisit fresh page → no unnecessary refetch within `staleTime`.
- After create/update/delete/status: list + detail + counts consistent.
- Filter/page changes: no previous-filter data shown as current; no page key collisions.
- Infinite query resets on filter/scope change.
- Logout / account switch: previous user data not visible.
- 4xx not retried; mutations not auto-retried; no unfiltered `invalidateQueries()`.

### Step 6: Report

Return:

1. Executive summary (old vs new)
2. Findings with severity + paths
3. Classification / matrix decisions
4. Files created/modified
5. Query key + mutation sync + auth cleanup changes
6. Verification commands + results
7. Risks: confirmed / assumptions / backend-dependent / deferred

## Hard constraints

- v5 only; `gcTime` not `cacheTime`; no `any`; no hiding type errors
- No unfiltered `invalidateQueries()`
- No cross-user/tenant cache reuse; clear sensitive data on logout
- No caching command-like responses as normal resources
- No full query-cache persistence by default
- No aggressive polling without stop condition
- Do not rewrite unrelated code; respect FSD/feature folder conventions per app
- Distinguish verified facts from assumptions

## Anti-patterns in this repo

- Query key roots missing app prefix (`form-templates`, `general-programs`) — migrate to `['cms', …]` when touching those domains
- Logout clearing only a subset of domains
- Legacy `['users', …]` beside `memberQueryKeys`
- Broad `invalidateQueries({ queryKey: domain.all })` without considering list vs detail — acceptable as domain-scoped max; never empty filter
- Duplicating list/detail payloads in Zustand while also using RQ
