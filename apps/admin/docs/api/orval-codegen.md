# Orval OpenAPI 코드 생성 (Homepage Admin)

Swagger 스펙에서 TypeScript API 클라이언트·스키마를 생성하는 절차입니다.

---

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm --filter admin fetch:openapi` | Homepage Admin `openapi/backend.openapi.json` 다운로드 (`VITE_HOMEPAGE_API_SERVER` → `VITE_API_SERVER` → `http://localhost:8081`) |
| `pnpm --filter admin filter:openapi:*` | 도메인 subset (`main`, `ja-korea`, `impact-story`, …) |
| `pnpm --filter admin generate:api` | 위 filter 전체 + Orval codegen |

> 런타임 로그인(`VITE_API_SERVER`)은 **CMS 백엔드**를 가리킨다. OpenAPI 스냅샷은 Homepage Admin API이므로 `VITE_HOMEPAGE_API_SERVER`를 분리한다.

Swagger UI: `{VITE_HOMEPAGE_API_SERVER}/swagger-ui/index.html`

---

## 설정

- [`orval.config.ts`](../../orval.config.ts) — LNB·공유 도메인별 project
- [`scripts/filter-openapi-*.mjs`](../../scripts/) — path prefix 필터 + bearerAuth 스키마 정리. notifications subset는 unused `components.schemas` 를 prune한다.
- [`src/shared/api/orval-mutator.ts`](../../src/shared/api/orval-mutator.ts) — `axiosInstance` 재사용

**출력:** [`src/shared/api/generated/`](../../src/shared/api/generated/)

| Orval project | OpenAPI subset | path prefix |
| --- | --- | --- |
| `main` | `main.openapi.json` | `/api/admin/main`, `/api/public/main` |
| `jaKorea` | `ja-korea.openapi.json` | `/api/admin/ja-korea`, `/api/public/ja-korea` |
| `impactStory` | `impact-story.openapi.json` | `/api/admin/impact-story`, `/api/public/impact-story` |
| `education` | `education.openapi.json` | `/api/admin/education`, `/api/public/education` |
| `sponsorship` | `sponsorship.openapi.json` | `/api/admin/sponsorship`, `/api/public/sponsorship` |
| `participation` | `participation.openapi.json` | `/api/admin/participation`, `/api/public/participation` |
| `site` | `site.openapi.json` | `/api/admin/site`, `/api/public/site` |
| `statistics` | `statistics.openapi.json` | `/api/admin/statistics`, `/api/public/analytics` |
| `logs` | `logs.openapi.json` | `/api/admin/logs` |
| `assets` | `assets.openapi.json` | `/api/admin/assets` |
| `me` | `me.openapi.json` | `/api/admin/me` |
| `notifications` | `notifications.openapi.json` | `/api/admin/notifications/inbox` (GNB 시스템 Inbox. Outbox `/public-applications` 제외. unused schema prune) |

---

## 사용 규칙

1. **UI에서 generated import 금지** — `features/*/api/*-api-client.ts` 또는 service adapter만 사용
2. **mutator** — 인터셉터·Bearer 일관성 유지 (`axiosInstance`)
3. **스펙 업데이트 PR** — `openapi/*.json` + `generated/` diff 포함
4. **확장** — 새 도메인은 filter 스크립트·orval project 추가

---

## sponsorship · 재능기부 (talent) OpenAPI

| 상태 (2026-09-25) | 내용 |
|-------------------|------|
| Admin 스냅샷 | `openapi/sponsorship.openapi.json` 에 talent · talent-applications path 포함 (재 fetch 후) |
| 백엔드 | `TalentApplication*` / `TalentSponsorship*` `@Schema` 로 corporate와 이름 분리 |
| 상세 절차 | [`sponsorship-talent-openapi-update-2026-09-25.md`](./sponsorship-talent-openapi-update-2026-09-25.md) |
| FE 연동 | [`sponsorship-talent-admin-frontend-cursor-prompt-2026-09-25.md`](./sponsorship-talent-admin-frontend-cursor-prompt-2026-09-25.md) |
| Platform 시드 | [`sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md`](./sponsorship-talent-platform-seed-backend-cursor-prompt-2026-09-25.md) |

**필수 검증:** regenerate 후 corporate `StatusUpdateRequest`에 `version`이 남아 있어야 한다.  
talent status body는 `TalentApplicationStatusUpdateRequest` (`status`만, version 없음).

```bash
pnpm --filter admin fetch:openapi && pnpm --filter admin generate:api
# sponsorship.openapi.json 에 /talent, /talent-applications 존재 확인
# schemas.StatusUpdateRequest.properties.version 존재 확인
pnpm --filter admin typecheck
```

---

## PR 체크리스트

- [ ] `pnpm --filter admin fetch:openapi && pnpm --filter admin generate:api` 실행 후 commit
- [ ] `pnpm --filter admin typecheck` 통과
- [ ] adapter/service mock·real 분기 (해당 시)
- [ ] queryKey 팩토리와 Swagger 조회 키 정렬
- [ ] (talent 포함 시) corporate `StatusUpdateRequest.version` 유지 · `TalentApplication*` / `TalentSponsorship*` schema 존재

---

## react-query vs axios client

- Orval **axios client**로 함수 생성 → feature 훅에서 `@tanstack/react-query` `useQuery`/`useMutation` 래핑
- generated react-query hooks는 RequestInit 타입 충돌을 피하기 위해 axios client 선택

**Last updated:** 2026-09-25
