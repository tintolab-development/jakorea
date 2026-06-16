# 데이터 관리 API 연동 명세

LNB 「데이터 관리」 3화면(후원사·교재·세부 프로그램)과 Swagger `SCR_MASTER` 태그 API 매핑입니다.

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)

---

## 모듈 키

| env | 코드 |
|-----|------|
| `VITE_REAL_API_MODULES=...,detailedPrograms` | `isRealApiModuleEnabled('detailedPrograms')` |
| `VITE_REAL_API_MODULES=...,textbooks` | `isRealApiModuleEnabled('textbooks')` |
| `VITE_REAL_API_MODULES=...,sponsors` | `isRealApiModuleEnabled('sponsors')` |

실 API 호출 추가 조건: MFA 완료 후 유효 JWT (`hasRemoteAdminJwt()`).

---

## 코드 위치

| 역할 | 경로 |
|------|------|
| Orval 생성 | `src/shared/api/generated/data-management/` |
| OpenAPI subset | `openapi/data-management.openapi.json` (`scripts/filter-openapi-data-management.mjs`) |
| 공통 query keys | `features/data-management/api/data-management-query-keys.ts` |
| 캐시 clear | `features/data-management/api/clear-data-management-query-cache.ts` |
| API 경로 상수 | `shared/config/api/{detailed-programs,textbooks,sponsors}.ts` |
| 세부 프로그램 | `features/detailed-program/api/` |
| 교재 | `features/textbook/api/admin-textbooks-service.ts` |
| 후원사 | `features/sponsor/api/admin-sponsors-service.ts` |

---

## TanStack Query 캐시

- Key prefix: `['cms', 'data-management', …]`
- `logout` / `completeAdminAuth` → `clearDataManagementQueryCache()`
- 데이터 관리 3화면은 **mock fallback 없음** — `VITE_REAL_API_MODULES`에 해당 키가 있어야 동작 (logs와 동일)
- `data/mock/*-management-*` 목록 mock은 프로그램 등록 폼 등 **LNB 밖**에서만 참조

---

## 세부 프로그램 (`/detailed-program`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/admin/detailed-programs` | 목록 |
| POST | `/api/admin/detailed-programs` | 항목 추가 |
| PATCH | `/api/admin/detailed-programs/{id}` | 정보 수정(일괄 저장) |
| DELETE | `/api/admin/detailed-programs/{id}` | 삭제 (409: 참조 중) |

### 필터

| URL | API query | 비고 |
|-----|-----------|------|
| `dp_use=active\|inactive` | `useYn` | 서버 |
| `dp_name` | — | **서버 keyword 없음** — 클라이언트 보조 |

### DTO ↔ UI

| API | UI |
|-----|-----|
| `nameKo` | `name` |
| `useYn` | `active` |
| `createdByAdminId` | `createdBy` (ID 문자열) |
| `inUse` (mock) | DELETE 409로 대체 |

---

## 교재 (`/textbook`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/cms/textbooks` | 목록 |
| POST | `/api/cms/textbooks` | 등록 |
| GET | `/api/cms/textbooks/{id}` | 상세 모달 |
| PATCH | `/api/cms/textbooks/{id}` | 수정 |
| DELETE | `/api/cms/textbooks/{id}` | 삭제 |

### 필터

| UI 필터 | API query | 비고 |
|---------|-----------|------|
| `businessArea` | `businessArea` | 서버 |
| `educationTarget` | `educationTarget` | 서버 |
| `useStatus` | `useStatus` | 서버 |
| `grade` | — | 클라이언트 |
| `textbookName` | — | 클라이언트 |

---

## 후원사 (`/sponsor`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/sponsors` | 목록 |
| POST | `/api/sponsors` | 등록 |
| GET | `/api/sponsors/{id}` | 상세 (contacts, programHistories embed) |
| PATCH | `/api/sponsors/{id}` | 기본정보 수정 |
| DELETE | `/api/sponsors/{id}` | 삭제 |
| POST | `/api/sponsors/{id}/end` | 후원 종료 |
| GET/POST | `/api/sponsors/{id}/contacts` | 담당자 |
| PATCH/DELETE | `/api/sponsors/contacts/{contactId}` | 담당자 |
| GET/POST | `/api/sponsors/{id}/yearly-businesses` | 연도별 사업 (서비스만, UI 미연동) |
| PATCH/DELETE | `/api/sponsors/yearly-businesses/{id}` | 연도별 사업 |

### 목록 필터

| URL | API query |
|-----|-----------|
| `sp_kind` | `organizationKind` |
| `sp_name` | `keyword` |
| `sp_mgr` | `managerName` |
| `sp_st` | `sponsorshipStatus` |

### 프로그램 진행 이력

- 조회: 상세 `programHistories` embed (별도 list API 없음)
- 삭제: **API 없음** — 삭제 버튼 항상 비활성

---

## Phase 2b — material-kits (문서만, UI 미연동)

OpenAPI subset에 포함. 교재 「키트 수량 관리」 UI는 textbook-kit 매핑 확정 후 별도 Phase.

| Method | Path |
|--------|------|
| GET | `/api/admin/material-kits` |
| POST | `/api/admin/material-kits` |
| GET | `/api/admin/material-kits/{kitId}` |
| PATCH | `/api/admin/material-kits/{kitId}` |
| GET | `/api/admin/material-kits/{kitId}/versions` |
| POST | `/api/admin/material-kits/{kitId}/versions` |
| GET | `/api/admin/material-kits/{kitId}/versions/current/calculate` |
| GET | `/api/admin/material-kits/{kitId}/calculate` |
| POST | `/api/admin/material-kits/versions/{versionId}/target-counts` |

### 갭

- kit `DELETE` API 없음
- textbookId ↔ kit 직접 연결 필드 OpenAPI 미명시
- UI 플로우·매핑 미확정 → 연동 보류

---

## API 미존재 / 스펙 갭 (요약)

| # | 항목 | 상태 |
|---|------|------|
| 1 | 후원사 프로그램 이력 삭제 | API 없음 → remote UI 비활성 |
| 2 | 후원사 프로그램 이력 목록 API | 상세 embed만 |
| 3 | 세부 프로그램 이름 서버 필터 | `businessArea`, `useYn`만 |
| 4 | 세부 프로그램 `inUse` | mock only → DELETE 409 |
| 5 | 세부 프로그램 `nameEn`, `businessArea` UI | API 있음 / UI 없음 |
| 6 | 교재 grade·교재명 서버 필터 | 클라이언트 보조 |
| 7 | 교재 키트 수량 | API 있음 / UI 보류 |
| 8 | material-kits DELETE | API 없음 |

**Last updated:** 2026-06-12
