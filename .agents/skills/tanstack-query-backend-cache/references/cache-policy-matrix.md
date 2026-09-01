# Cache Policy Matrix (JaKorea)

Project-specific matrix for TanStack Query backend response caching.
**CMS** values reflect the current codebase audit. **Platform** rows are adoption targets (RQ not installed yet).

Global CMS defaults today (`apps/cms/src/shared/lib/query-client.ts`):

| Option | Current | Target baseline |
| --- | ---: | ---: |
| staleTime | 60_000 | 30_000 (domain overrides still apply) |
| gcTime | library default (~5m) | 10 * 60_000 |
| refetchOnWindowFocus | library default (true) | **false** |
| refetchOnReconnect | library default | true |
| query retry | 1 (all errors) | status-aware; no 4xx retry |
| mutation retry | library default | false |

Many CMS hooks override with `staleTime: 30_000` or `60_000` and `retry: false`.

## CMS

| Domain | Query | Response Scope | Freshness | Class | staleTime | gcTime | Focus | Reconnect | Persist | Mutation Strategy |
| --- | --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- |
| Auth | session / me (planned `cmsQueryKeys.auth`) | user | high | F/B | 5m | 30m | false | true | no | clear on logout/MFA; unused factory today |
| Dashboard | home, widgets, schedules, KPI | admin + remote\|mock | medium–high | E/F | 60s | 10–15m | false | true | no | invalidate `dashboardQueryKeys.all`; clear on auth boundary |
| Dashboard | notification count / shortcut badges | user | high | E/F | 30s | 10m | false | true | no | invalidate count keys; clear on logout |
| Dashboard | preferences / shortcuts | user | medium | B/F | 60s | 30m | false | true | no | invalidate all dashboard after save |
| Notifications | alimtalk template list | admin | medium | C | 30s–1m | 15m | false | true | no | invalidate list; **add logout clear** |
| Posts | notice/FAQ/inquiry list | admin | medium | C | 30s | 15m | false | true | no | invalidate resource `all` / list; seed detail on write if body returned |
| Posts | notice/FAQ/inquiry detail | admin | medium | D | 1–3m | 15–30m | false | true | no | `setQueryData` detail + invalidate lists |
| Posts | categories | admin | low | A/B | 15–30m | 1h | false | true | no | invalidate categories on category mutation |
| Members | member list / infinite | admin | medium | C/F | 30s | 15m | false | true | no | invalidate lists; migrate off legacy `['users']` |
| Members | member detail | admin | medium | D/F | 1–3m | 30m | false | true | no | set detail + invalidate lists |
| Data mgmt | sponsors / textbooks / kits | admin | medium | C/D | 30–60s | 15–30m | false | true | no | domain invalidate; clear on logout (already) |
| Settlement | configs / account payments | admin | medium–high | C/E | 30–60s | 10–15m | false | true | no | invalidate section lists after config write |
| Logs | access / download / bug history | admin | medium | C | 30s | 10m | false | true | no | usually read-only; invalidate on export if listed |
| Performance | education record list | admin | medium | C | 30s | 15m | false | true | no | invalidate list after record mutations |
| Form templates | template list/detail/sections | admin | medium | C/D | 30s | 15–30m | false | true | no | invalidate factory; **prefix `['cms','form-templates']`; logout clear** |
| General programs | list / detail | admin | medium–high | C/D | 30s–1m | 15–30m | false | true | no | invalidate list+detail; **prefix `['cms','general-programs']`; logout clear** |
| General programs | applications / progress | admin | high | C/E/F | 0–30s | 10m | false | true | no | targeted invalidate; logout clear |
| Sponsor lookup | ensureQueryData helpers | admin | medium | C/D | 30–60s | 15m | false | true | no | reuse keys with list/detail factories |

## Platform (adoption targets)

When Platform adds TanStack Query, start from this matrix and refine per endpoint.

| Domain | Query | Response Scope | Freshness | Class | staleTime | gcTime | Focus | Reconnect | Persist | Mutation Strategy |
| --- | --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- |
| Auth | me / session | user | high | F/B | 5m | 30m | false | true | no | `removeQueries({ queryKey: ['platform'] })` or scoped clear on logout |
| Profile | my profile | user | medium | B/F | 5–15m | 30–60m | false | true | no | setQueryData on profile update |
| Programs | public/my program list | public or user | medium | C/F | 30s–2m | 15m | false | true | no | invalidate lists; scope userId when “my” |
| Programs | program detail | public or user | medium | D/F | 1–5m | 15–30m | false | true | no | set detail + invalidate related lists |
| Applications | my applications | user | high | C/F | 30s | 10–15m | false | true | no | invalidate list+detail after submit/cancel |
| Notices | public notice list/detail | public | low–medium | C/D | list 1–3m; detail 5m | 30m | false | true | no | admin writes are CMS-side; Platform read invalidate rare |
| Files | presigned upload/download URL | user | one-shot | G | 0 | minimal | n/a | n/a | no | mutation or direct fetch; never long-cache |

## Notes

- **Persistence:** none in either app today — keep allowlist-only if ever added.
- **Polling:** do not add `refetchInterval` without a stop condition (unmount, terminal status, or tab hidden).
- **Zustand overlap (CMS):** sponsor/program/user/notification stores may still hold API-shaped data — prefer RQ as source of truth when migrating; do not double-write without reason.
