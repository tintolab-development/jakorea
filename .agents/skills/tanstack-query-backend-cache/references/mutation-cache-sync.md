# Mutation Cache Sync (JaKorea)

Patterns for keeping TanStack Query caches correct after writes.
Use with [query-key-guidelines.md](query-key-guidelines.md) and [cache-policy-matrix.md](cache-policy-matrix.md).

## Principles

1. Mutation response is the source of truth when it returns the full updated resource.
2. Prefer `setQueryData` for that detail; then **targeted** invalidate for derived lists/counts/dashboards.
3. If filters/sort may exclude the updated row, invalidate lists instead of patching them blindly.
4. Never `invalidateQueries()` without a `queryKey` / predicate.
5. Mutations: `retry: false` unless explicitly idempotent.
6. Optimistic updates only with `cancelQueries` + snapshot + rollback on error.

## Create

```ts
onSuccess: (created, variables) => {
  if (created?.id) {
    queryClient.setQueryData(
      postsQueryKeys.notices.detail(created.id),
      created,
    )
  }
  // Filters/sort unknown → invalidate lists (safe default)
  void queryClient.invalidateQueries({
    queryKey: postsQueryKeys.notices.all(),
  })
  // Related counts / dashboard badges if any
  void queryClient.invalidateQueries({
    queryKey: dashboardQueryKeys.shortcutBadges(scope),
  })
}
```

- Insert into a cached list only when sort/filter membership is known to be correct.
- Seed detail when the API returns the complete resource.

## Update

```ts
onSuccess: (updated, variables) => {
  queryClient.setQueryData(
    postsQueryKeys.notices.detail(updated.id),
    updated,
  )
  void queryClient.invalidateQueries({
    queryKey: postsQueryKeys.notices.all(),
  })
}
```

Optional list patch with `setQueriesData` only when list item shape matches and filters still include the row.

## Delete

```ts
onSuccess: (_void, { id }) => {
  queryClient.removeQueries({
    queryKey: postsQueryKeys.notices.detail(id),
  })
  void queryClient.invalidateQueries({
    queryKey: postsQueryKeys.notices.all(),
  })
  // Handle empty last page via list refetch (invalidate), not manual page math unless tested
}
```

## Status change / approval

Synchronize in this order when applicable:

1. Detail cache (`setQueryData` or invalidate)
2. Relevant list queries (invalidate resource `all` or status-filtered lists)
3. Counters / badge queries
4. Dashboard / queue widgets
5. Dependent permission menus if the API says access changed

CMS dashboard after preference save: invalidate `dashboardQueryKeys.all` (existing pattern).

## Bulk action

- Invalidate the affected resource `all` (or predicate by ids) once after the batch succeeds.
- Avoid N× detail `setQueryData` unless the API returns each updated entity and UI needs instant row patches.
- Cancel overlapping list queries before applying optimistic bulk patches.

## File upload

- Metadata resource: treat as update/create of the parent entity.
- **Presigned URL / temporary upload URL:** class G — do not cache in RQ as a normal query; use mutation or one-shot fetch with `staleTime: 0` and minimal `gcTime`.

## Import

- Kick off with mutation; poll/refetch **job status** (class E) only with stop on terminal state.
- On completion: invalidate the imported domain lists (and counts), not the entire app cache.

## Export

- Command-like: mutation or direct download request (class G).
- If an export **history list** exists (CMS logs): invalidate that list query after success — do not cache the file blob in RQ.

## Reordering

- Optimistic reorder of the active list key is acceptable with rollback.
- On settle: invalidate the list key (and any alternate sort caches).

## Optimistic updates (template)

```ts
onMutate: async (variables) => {
  const key = postsQueryKeys.notices.detail(variables.id)
  await queryClient.cancelQueries({ queryKey: key })
  const previous = queryClient.getQueryData(key)
  queryClient.setQueryData(key, (old) =>
    old ? { ...old, ...variables.patch } : old,
  )
  return { previous, key }
},
onError: (_err, _vars, ctx) => {
  if (ctx?.previous !== undefined) {
    queryClient.setQueryData(ctx.key, ctx.previous)
  }
},
onSettled: (_data, _err, variables) => {
  void queryClient.invalidateQueries({
    queryKey: postsQueryKeys.notices.detail(variables.id),
  })
},
```

## Auth boundary sync (not a mutation, but required)

### CMS (`auth-store`)

On `logout`, `completeAdminAuth`, `applySocialAuthTokens`:

1. `cancelQueries` (recommended before remove)
2. Call **all** domain `clear*QueryCache` helpers — today: dashboard, logs, data-management, posts, settlement, members, performance
3. **Also clear when present:** notifications, form-templates, general-programs / applications / progress, legacy `['users']`
4. Alternatively, if the entire CMS RQ cache is session-bound: `queryClient.removeQueries({ queryKey: ['cms'] })` plus legacy roots until migrated

Do not leave previous-admin dashboard/post data visible after MFA or logout.

### Platform (when RQ exists)

On logout / account switch:

```ts
await queryClient.cancelQueries()
queryClient.removeQueries({ queryKey: ['platform'] })
```

Retain only true public static reference queries if they use a separate non-user key namespace and are explicitly documented as safe.

## Org / tenant switch (future)

1. Cancel previous-scope requests  
2. Remove previous-scope queries  
3. Update active scope state  
4. Prefetch new-scope critical queries  
5. Do not render previous-scope data during the transition  

## CMS current gap checklist

When touching mutations or auth, close these if still open:

- [ ] `setQueryData` used where mutation returns full entity (today almost unused in prod)
- [ ] Logout coverage for notifications + form-templates + general-programs*
- [ ] No dual invalidation of `['users']` and `memberQueryKeys` after members migrate
- [ ] Domain `all` invalidate remains the widest allowed scope — never empty filter
