# 데이터 관리 API 연동 명세

LNB 「데이터 관리」 3화면(후원사·교재·세부 프로그램)과 OpenAPI `data-management` subset 매핑입니다.

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)  
**백엔드 갭 요청**: [data-management-api-backend-gaps.md](./data-management-api-backend-gaps.md)

**Last updated:** 2026-08-24  
**OpenAPI:** `apps/cms/openapi/data-management.openapi.json` (v9)

---

## 모듈 키

| env | 코드 |
|-----|------|
| `VITE_REAL_API_MODULES=...,detailedPrograms` | `isRealApiModuleEnabled('detailedPrograms')` |
| `VITE_REAL_API_MODULES=...,textbooks` | `isRealApiModuleEnabled('textbooks')` |
| `VITE_REAL_API_MODULES=...,sponsors` | `isRealApiModuleEnabled('sponsors')` |

실 API 호출 추가 조건: MFA 완료 후 유효 JWT (`hasRemoteAdminJwt()`).  
LNB 3화면은 **mock fallback 없음**.

---

## 코드 위치

| 역할 | 경로 |
|------|------|
| Orval 생성 | `src/shared/api/generated/data-management/` |
| OpenAPI subset | `openapi/data-management.openapi.json` (`scripts/filter-openapi-data-management.mjs`) |
| 공통 query keys | `features/data-management/api/data-management-query-keys.ts` |
| 캐시 clear | `features/data-management/api/clear-data-management-query-cache.ts` |
| bulk-delete 헬퍼 | `features/data-management/api/bulk-delete.ts` (max 100 청크) |
| 세부 프로그램 | `features/detailed-program/api/` |
| 교재 | `features/textbook/api/` |
| 후원사 | `features/sponsor/api/` |

---

## TanStack Query 캐시

- Key prefix: `['cms', 'data-management', …]`
- `logout` / `completeAdminAuth` → `clearDataManagementQueryCache()`
- `data/mock/*-management-*` 목록 mock은 프로그램 등록 폼 등 **LNB 밖**에서만 참조

---

## 세부 프로그램 (`/detailed-program`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/admin/detailed-programs` | 목록 (`page`/`size`, FE는 size=500) |
| POST | `/api/admin/detailed-programs` | 항목 추가 |
| PATCH | `/api/admin/detailed-programs/{id}` | 정보 수정(일괄 저장) |
| DELETE | `/api/admin/detailed-programs/{id}` | 단건 삭제 (409: 참조 중) |
| POST | `/api/admin/detailed-programs/bulk-delete` | 목록 일괄 삭제 |

### 필터

| URL | API query | 비고 |
|-----|-----------|------|
| `dp_use=active\|inactive` | `useYn` | 서버 |
| `dp_name` | `keyword` | 서버. 클라 이중 필터 없음 |

`nameEn` / `businessArea`는 API에 있으나 Notion 목록 UI에는 없음 — **요청·화면 추가하지 않음**.

### DTO ↔ UI

| API | UI |
|-----|-----|
| `nameKo` | `name` |
| `useYn` | `active` |
| `createdByName` (없으면 `createdByAdminId`) | `createdBy` |

---

## 교재 (`/textbook`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/admin/textbooks` | 목록 (`page`/`size`) |
| POST | `/api/admin/textbooks` | 등록 |
| GET | `/api/admin/textbooks/{id}` | 상세 모달 |
| PATCH | `/api/admin/textbooks/{id}` | 수정 |
| DELETE | `/api/admin/textbooks/{id}` | 단건 삭제 |
| POST | `/api/admin/textbooks/bulk-delete` | 목록 일괄 삭제 |
| GET | `/api/admin/textbooks/matches` | 프로그램 폼 카탈로그 (LNB 밖) |

### 필터

| UI 필터 | API query | 비고 |
|---------|-----------|------|
| `businessArea` | `businessArea` | 서버 |
| `educationTarget` | `educationTarget` | 서버 |
| `useStatus` | `useStatus` | 서버 |
| `grade` | `grade` | 서버. 클라 이중 필터 없음 |
| `textbookName` | `textbookName` | 서버. 클라 이중 필터 없음 |

### 키트 (`material-kits`)

교재 「키트 수량 관리」는 **전역 키트** (`MaterialKitResponse.textbookId == null`)만 사용합니다. Notion도 화면 전역 키트입니다.

| Method | Path | UI |
|--------|------|-----|
| GET/POST | `/api/admin/material-kits` | 전역 키트 조회·생성 |
| GET/PATCH | `/api/admin/material-kits/{kitId}` | 수량 수정 |
| GET/POST | `/api/admin/material-kits/{kitId}/versions` | 버전 |
| GET | `…/calculate` | 수량 계산 |
| DELETE | `/api/admin/material-kits/{kitId}` | OpenAPI에 있음. 전역 키트 정책상 **UI에서 안 씀** |

교재별 키트가 필요하면 BE 확인 후 전환합니다. 갭 문서 B-4.

---

## 후원사 (`/sponsor`)

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/admin/sponsors` | 목록 (전체 배열, page/size 없음) |
| POST | `/api/admin/sponsors` | 등록 |
| GET | `/api/admin/sponsors/{id}` | 상세 (contacts·yearly embed) |
| PATCH | `/api/admin/sponsors/{id}` | 기본정보 수정 |
| DELETE | `/api/admin/sponsors/{id}` | 단건 삭제 |
| POST | `/api/admin/sponsors/bulk-delete` | 목록 일괄 삭제 |
| POST | `/api/admin/sponsors/{id}/end` | 후원 종료 |
| GET | `/api/admin/sponsors/{sponsorId}/program-histories` | 프로그램 진행 이력 (page·서버 필터) |
| GET/POST | `/api/admin/sponsors/{id}/contacts` | 담당자 |
| PATCH/DELETE | `/api/admin/sponsors/contacts/{contactId}` | 담당자 |
| POST | `/api/admin/sponsors/contacts/bulk-delete` | 담당자 일괄 삭제 |
| GET/POST | `/api/admin/sponsors/{id}/yearly-businesses` | 연도별 후원금 목록·생성 |
| PATCH/DELETE | `/api/admin/sponsors/yearly-businesses/{id}` | 연도별 후원금 수정·삭제 (FE는 PATCH) |

### 목록 필터

클라 재필터 없음. 서버 결과만 표시(정렬만 클라).

| URL | API query |
|-----|-----------|
| `sp_kind` | `organizationKind` |
| `sp_name` | `keyword` |
| `sp_mgr` | `managerName` |
| `sp_st` | `sponsorshipStatus` |

`SponsorsParams`에 `status`도 있음. FE는 `sponsorshipStatus`만 보냅니다. 갭 문서 B-2.

### 연도별 후원금 (상세 패널)

- DTO: `businessYear`, `donationAmount`, `beneficiaryCount`, `memo`
- UI: 누적 후원금·누적 수혜자 + 테이블(No, 후원년도, 후원금, 총 수혜자 수, 비고)
- 후원 시작연도~올해 빈 연도를 표시. 「후원정보 수정」 저장 시 기존 id는 PATCH, 없으면 POST
- 목록 API를 우선하고, 실패 시 상세 embed `yearlyBusinesses`를 사용

### 프로그램 진행 이력

- 조회: `GET …/program-histories` (`keyword`, `year`, `lifecycleStatus`, `educationTarget`, `managerName`, `page`, `size`)
- 삭제: **API 없음** — 삭제 버튼 항상 비활성. 갭 문서 P0. SSOT: [data-management-api-backend-gaps.md](./data-management-api-backend-gaps.md)

### 프로그램 폼·링크 연동 (LNB 밖)

- 프로그램 등록/기본정보 폼 후원사·담당자 셀렉트: `useSponsorOptionsQuery` / `useSponsorContactsQuery`
- 프로그램 상세 → 후원사 링크: `resolveSponsorManagementRowById`
- API 비활성 시 빈 옵션 + 안내 (mock 대체 없음)

---

## 엑셀

세 화면 모두 `excelExport` **클라 테이블 dump**. 전용 `…/export` API는 갭 문서 P2. 오기 전에는 클라 유지.

---

## API 미존재 / 스펙 갭

상세·우선순위·요청하지 않는 항목: **[data-management-api-backend-gaps.md](./data-management-api-backend-gaps.md)**

| # | 항목 | 상태 |
|---|------|------|
| 1 | 후원사 프로그램 이력 삭제 | API 없음 → UI 비활성 (P0) |
| 2 | 후원사 목록 Page 응답 | 전체 배열 (P1) |
| 3 | 목록 누적 후원금·수혜자 | DTO 없음 (P1) |
| 4 | homepage / 로고 | DTO 없음 (P2) |
| 5 | 서버 export | 클라 dump (P2) |
| 6 | 이력 필터 `participantType` | params 없음 (P2) |
| 7 | 세부 프로그램 `nameEn`, `businessArea` UI | API 있음 / **요청하지 않음** |
| 8 | 키트 DELETE | OpenAPI 있음 / 전역 키트라 UI에서 안 씀 |
