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
- [`scripts/filter-openapi-*.mjs`](../../scripts/) — path prefix 필터 + bearerAuth 스키마 정리
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

---

## 사용 규칙

1. **UI에서 generated import 금지** — `features/*/api/*-api-client.ts` 또는 service adapter만 사용
2. **mutator** — 인터셉터·Bearer 일관성 유지 (`axiosInstance`)
3. **스펙 업데이트 PR** — `openapi/*.json` + `generated/` diff 포함
4. **확장** — 새 도메인은 filter 스크립트·orval project 추가

---

## PR 체크리스트

- [ ] `pnpm --filter admin fetch:openapi && pnpm --filter admin generate:api` 실행 후 commit
- [ ] `pnpm --filter admin typecheck` 통과
- [ ] adapter/service mock·real 분기 (해당 시)
- [ ] queryKey 팩토리와 Swagger 조회 키 정렬

---

## react-query vs axios client

- Orval **axios client**로 함수 생성 → feature 훅에서 `@tanstack/react-query` `useQuery`/`useMutation` 래핑
- generated react-query hooks는 RequestInit 타입 충돌을 피하기 위해 axios client 선택

**Last updated:** 2026-08-13
