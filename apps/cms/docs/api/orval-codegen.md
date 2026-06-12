# Orval OpenAPI 코드 생성 (CMS)

Swagger 스펙에서 TypeScript API 클라이언트·스키마를 생성하는 절차입니다.

---

## 스크립트

| 명령 | 설명 |
|------|------|
| `pnpm --filter cms fetch:openapi` | `openapi/backend.openapi.json` 다운로드 (`VITE_API_SERVER` 또는 기본 ngrok) |
| `pnpm --filter cms filter:openapi:dashboard` | 대시보드 path만 subset → `openapi/dashboard.openapi.json` |
| `pnpm --filter cms generate:api` | filter + Orval codegen |
| `pnpm --filter cms generate:api:watch` | dashboard subset watch |

---

## 설정

- [`orval.config.ts`](../../orval.config.ts) — 1차: dashboard subset only
- [`scripts/filter-openapi-dashboard.mjs`](../../scripts/filter-openapi-dashboard.mjs) — `/api/admin/dashboard` prefix 필터 + bearerAuth 스키마 정리
- [`src/shared/api/orval-mutator.ts`](../../src/shared/api/orval-mutator.ts) — `axiosClient` 재사용

**출력:** [`src/shared/api/generated/dashboard/`](../../src/shared/api/generated/dashboard/)

---

## 사용 규칙

1. **UI에서 generated import 금지** — `features/*/api/dashboard-api-client.ts` 또는 service adapter만 사용
2. **mutator** — 인터셉터·Bearer·refresh 일관성 유지
3. **스펙 업데이트 PR** — `openapi/*.json` + `generated/` diff 포함
4. **확장** — 새 도메인은 filter 스크립트·orval project 추가 후 `REAL_API_MODULE_KEYS`에 키 등록

---

## PR 체크리스트

- [ ] `pnpm --filter cms generate:api` 실행 후 commit
- [ ] `pnpm --filter cms typecheck` 통과
- [ ] adapter/service mock·real 분기 (`isRealApiModuleEnabled`)
- [ ] `.env.example` / handoff 문서 env 예시 갱신
- [ ] queryKey 팩토리와 Swagger `프론트 조회 키` 정렬

---

## react-query vs axios client

- Orval **axios client**로 함수 생성 → feature 훅에서 `@tanstack/react-query` `useQuery`/`useMutation` 래핑
- generated react-query hooks는 RequestInit 타입 충돌을 피하기 위해 1차에서 axios client 선택

**Last updated:** 2026-06-12
