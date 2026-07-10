# Query Key Guidelines (JaKorea)

## Hierarchy

```text
[appRoot, domain, ...resource, ...identityOrParams]
```

| App | `appRoot` | Example |
| --- | --- | --- |
| CMS | `'cms'` | `['cms', 'posts', 'notices', 'list', searchParamsKey]` |
| Platform | `'platform'` | `['platform', 'programs', 'list', normalizedParams]` |

Never share keys across apps. Never omit `appRoot` on **new** factories.

## Naming conventions

- One factory file per domain: `features/<domain>/api/<domain>-query-keys.ts`
- Export `*QueryKeys` object with:
  - `all` — domain root for auth clear / broad domain invalidate
  - resource groups (`notices`, `faqs`, …)
  - `list(params)` / `detail(id)` separation
- Use `as const` on key tuples.
- Prefer stable serialized filter keys (`searchParamsKey` or `normalizeXParams`) over raw unstable objects.

### Good (CMS posts)

```ts
export const postsQueryKeys = {
  all: ['cms', 'posts'] as const,
  notices: {
    all: () => [...postsQueryKeys.all, 'notices'] as const,
    list: (searchParamsKey: string) =>
      [...postsQueryKeys.notices.all(), 'list', searchParamsKey] as const,
    detail: (id: string) =>
      [...postsQueryKeys.notices.all(), 'detail', id] as const,
  },
}
```

### Good (Platform — when adopting)

```ts
export const programQueryKeys = {
  all: ['platform', 'programs'] as const,
  lists: () => [...programQueryKeys.all, 'list'] as const,
  list: (scope: { userId?: string }, params: NormalizedProgramListParams) =>
    [...programQueryKeys.lists(), scope, params] as const,
  details: () => [...programQueryKeys.all, 'detail'] as const,
  detail: (programId: string, scope?: { userId?: string }) =>
    [...programQueryKeys.details(), programId, scope ?? {}] as const,
}
```

### Avoid

```ts
// Missing app root (legacy CMS — migrate when touching)
['general-programs', 'list', ...]
['form-templates', ...]

// Unstable / non-serializable
['cms', 'posts', filtersObjectMutatedInPlace]
['cms', 'posts', () => id]

// Inline literals in pages
useQuery({ queryKey: ['notices', page] })
```

## Filter normalization

Before placing filters in keys:

1. Trim strings; treat `''` as absent if the API does.
2. Drop `undefined`; keep explicit `null` only if the API distinguishes it.
3. Sort arrays of ids/tags for stable order.
4. Normalize dates to a single format (ISO date or ms).
5. Apply default sort/pageSize in the normalizer so `undefined` vs default do not split caches incorrectly — **or** always pass explicit defaults from the caller; pick one per domain and stick to it.

## Pagination keys

Include **page**, **pageSize**, **sort**, **filters**, and **scope** in the list key.

```ts
list: (params: { page: number; pageSize: number; sort: string; q: string }) =>
  [...keys.lists(), normalizeListParams(params)] as const
```

Use `placeholderData: keepPreviousData` only when the key already isolates the filter set (so previous **page** can show while the next page loads, not previous **filter** disguised as current).

## Infinite query keys

- Base key = filters + scope (no page index in the root key).
- Validate `initialPageParam` and `getNextPageParam`.
- Reset / remove the infinite query when filters or scope change.
- Consider `maxPages` for large payloads.
- Do not concatenate pages into Zustand.

CMS example: migrate `['users', 'list', …]` infinite hooks to `memberQueryKeys` under `['cms', 'members', …]`.

## Auth / org / tenant scope

| Situation | Key requirement |
| --- | --- |
| Response identical for all authenticated admins | app + domain enough |
| Response depends on user | include `userId` (or equivalent) or clear all user caches on switch |
| CMS dashboard mock vs JWT | `dashboardQueryKeys.scope('remote' \| 'mock')` — required |
| Org/tenant switch (future) | include `organizationId` / tenant id; remove previous scope on switch |

## Targeted invalidation examples

```ts
// Domain (max breadth inside one domain — OK)
queryClient.invalidateQueries({ queryKey: postsQueryKeys.all })

// Resource
queryClient.invalidateQueries({ queryKey: postsQueryKeys.notices.all() })

// Single detail
queryClient.invalidateQueries({
  queryKey: postsQueryKeys.notices.detail(id),
})

// Auth boundary (CMS) — prefer dedicated clear helpers that cover ALL domains
clearPostsQueryCache()
// or removeQueries({ queryKey: ['cms'] }) when entire CMS cache is session-bound

// Platform logout
queryClient.removeQueries({ queryKey: ['platform'] })
```

**Forbidden:** `queryClient.invalidateQueries()` with no filter.

## Shared entry (CMS)

`apps/cms/src/shared/api/query-keys.ts` — `cmsQueryKeys.auth.*` for session/me.
Feature domains keep their own `*-query-keys.ts` files; do not dump all domains into the shared file.

## Migration debt (CMS)

| Current root | Target root |
| --- | --- |
| `['form-templates']` | `['cms', 'form-templates']` |
| `['general-programs']` | `['cms', 'general-programs']` |
| `['general-program-applications']` | `['cms', 'general-program-applications']` |
| `['general-program-progress']` | `['cms', 'general-program-progress']` |
| `['users', …]` | `memberQueryKeys` / `['cms', 'members', …]` |

Migrate when the domain is already being changed; do not big-bang rename without invalidation/clear updates.
