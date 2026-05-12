---
priority: medium
always_include: false
category: data
---

# API spec summary (mock era)

실 백엔드 연동·경로·`apiClient` 규칙은 [api-routes-and-client.md](./api-routes-and-client.md) 및 [api-routes-and-client.md (docs)](../../../docs/api/api-routes-and-client.md) 를 참고한다.

> Full contracts live in [api-spec-mock-detailed.md](../../../docs/api/api-spec-mock-detailed.md) and [api-spec-mock-extended.md](../../../docs/api/api-spec-mock-extended.md).

## Global

- **Base path:** `/api`  
- **Format:** `application/json`; dates as ISO strings  
- **Errors:** `400` validation, `404` missing, `500` server  

Shared domain types: see `apps/cms/src/types/domain.ts`.

## Entity index (mock services)

| Domain | Base | Service file |
|--------|------|----------------|
| Sponsor | `/api/sponsors` | `entities/sponsor/api/sponsor-service.ts` — deletion policy: [sponsor-delete-policy.md](../process/sponsor-delete-policy.md) |
| School | `/api/schools` | `entities/school/api/school-service.ts` |
| Instructor | `/api/instructors` | `entities/instructor/api/instructor-service.ts` |
| Program | `/api/programs` | `entities/program/api/program-service.ts` |
| Application | `/api/applications` | `entities/application/api/application-service.ts` |
| Schedule | `/api/schedules` | `entities/schedule/api/schedule-service.ts` |
| Matching | `/api/matchings` | `entities/matching/api/matching-service.ts` |
| Settlement | `/api/settlements` | `entities/settlement/api/settlement-service.ts` |
| Application path | `/api/application-paths` | + `data/mock/application-paths.ts` |
| Report | `/api/reports` | `entities/report/api/report-service.ts` |

**Misc endpoints:** todos, mypage summary, activities — see detailed doc.

## Related

- [mock-data.md](./mock-data.md)  

**Last updated:** 2026-04-21
