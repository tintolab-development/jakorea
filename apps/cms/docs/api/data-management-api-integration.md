# 데이터 관리 API 연동 명세

LNB 「데이터 관리」 3화면(후원사·교재·세부 프로그램)과 OpenAPI `data-management` subset 매핑입니다.

공통 가이드: [backend-handoff.md](./backend-handoff.md) · [api-routes-and-client.md](./api-routes-and-client.md)  
**백엔드 갭 요청**: [data-management-api-backend-gaps.md](./data-management-api-backend-gaps.md)  
**더미 시드 요청**: [data-management-dummy-seed-backend-request.md](./data-management-dummy-seed-backend-request.md)

**Last updated:** 2026-08-26  
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
- 목록 훅(`useSponsorListQuery` / `useTextbookListQuery` / `useDetailedProgramListQuery`): `placeholderData: keepPreviousData` — 필터 조회 시 이전 행 유지
- 페이지 Spin: **최초 로드만** (`isDataManagementListLoading` = `isPending`). refetch 중에는 테이블 유지 + Ant Table `loading`

---

## API 전환 phase (갭 해소)

이미 CRUD 배선됨. “전환” = 갭 해소 + FE 계약 정렬 + 모듈 안정화.

| Phase | 내용 | 산출물 |
|-------|------|--------|
| **B-0 (FE)** | 목록 placeholderData · 최초로드 Spin · 후원사 columns/prefetch · 교재 kit 지연 · 세부 filter pass-through | 본 PR |
| **B-1 (BE P1)** | 후원사 목록 Page 응답(`page`/`size`/`total`); FE 페이지네이션 | gaps A P1 + FE |
| **B-2 (BE P1)** | 목록 누적 후원금·수혜자 컬럼 계약 | gaps + adapter |
| **B-3** | 교재·세부 `total` 신뢰 + FE size를 정책값(50/100)으로 축소 | filter-params + UI |
| **B-4** | 키트–교재 연결·export·이력 삭제 등 gaps 잔여 | [gaps](./data-management-api-backend-gaps.md) 순 |
| **B-5** | 프로그램 폼이 mock `dp-*` / mock sponsor 대신 **admin matches/options API** | 폼 카탈로그 전환(별 PR) |

시드·중복 방지: [data-management-dummy-seed-backend-request.md](./data-management-dummy-seed-backend-request.md)

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
| `dp_use=active\|inactive` | `useYn` | 라디오. 기본·미지정=`active` (전체 없음) |
| `dp_name` | `keyword` | 서버. 클라 이중 필터 없음 (`filterFn` pass-through) |

목록 컬럼 순서: No → 사용 여부 → 세부 프로그램명 → 등록자 → 등록일시. 버튼 라벨 **신규 등록**.

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

| UI 필터 | URL | API query | 비고 |
|---------|-----|-----------|------|
| 사용 여부 (라디오) | `tb_use=USED\|UNUSED` | `useStatus` | 기본·미지정=`USED` (전체 없음) |
| 교재명 | — (조회 시 applied) | `textbookName` | 서버 |
| 사업 분야 | — | `businessArea` | 서버 |
| 교육 대상 | — | `educationTarget` | 서버 |
| 대상 학년 | — | `grade` | 서버 |

목록 컬럼 순서: No → 사용 여부 → 교재명 → 사업 분야 → 교육 대상 → 대상 학년 → 등록자 → 등록일시.

### 사업 분야 관리

| Method | Path | UI |
|--------|------|-----|
| GET | `/api/admin/textbook-business-areas` | 팝업 목록 (`page`/`size`) |
| POST | `/api/admin/textbook-business-areas` | 인라인 등록 |
| PATCH | `/api/admin/textbook-business-areas/{id}` | 명칭 수정(서버 cascade) |
| DELETE | `/api/admin/textbook-business-areas/{id}` | 삭제 (`deletable`/`textbookCount`·409) |

- 「사업 분야 설정」: **FE 확인 팝업만** (배치 저장 API 없음). 등록·수정·삭제는 즉시 API.
- 필터/등록/상세 셀렉트: 동일 목록 API SSOT. 원격 비활성 시에만 시드 4종 fallback.
- 셸: 600×max 880 · padding 26/30/34 · section gap 30

### 키트 (`material-kits`)

교재 「키트 수량 관리」는 **전역 키트** (`MaterialKitResponse.textbookId == null`)만 사용합니다. Notion도 화면 전역 키트입니다.  
키트 수량 GET/calculate는 **모달 open 시에만** `enabled` (페이지 마운트 시 최대 6회 호출 방지).

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

| URL | API query | 비고 |
|-----|-----------|------|
| `sp_kind` | `organizationKind` | 라디오 기업/재단만. 기본·미지정=`corporate` (전체 없음) |
| `sp_name` | `keyword` | 서버 |
| `sp_mgr` | `managerName` | 서버 |
| `sp_st` | `sponsorshipStatus` | 서버 |
| `sp_from` / `sp_to` | `sponsorshipStartDateFrom` / `sponsorshipStartDateTo` | **OpenAPI 없음** — FE 전송 + **일시적 클라 보조 필터**. 갭 P1 |

목록 컬럼 순서: No → 구분 → 후원사명 → 프로그램 진행 수 → 후원 상태 → 주 담당자 → 후원 시작일.  
(주 담당자 연락처·누적 후원금·수혜자는 Notion 취소/노란 — FE 미표시 또는 BE 갭.)

목록 일괄 삭제: 안내 확인 모달만 (문구 입력 없음). 상세 단건 삭제는 typed confirm 유지.

`SponsorsParams`에 `status`도 있음. FE는 `sponsorshipStatus`만 보냅니다.

### 상세 LNB

| `sponsorLnb` | 패널 |
|--------------|------|
| `sponsor-detail` | 기본정보 + 연도별 후원금 |
| `sponsor-programs` | 프로그램 진행 이력 |
| `sponsor-contacts` | 후원사 담당자 정보 (필터·CRUD) |

담당자 필드: 부서·직함·유형·담당자명·내선·연락처·이메일·회사 주소·비고·등록일시 (`department`, `position`, `officePhone`, `phone`/`mobilePhone`, `email`, `companyAddress`, `memo`).

### 프로그램 진행 이력 필터

| UI | API query | 비고 |
|----|-----------|------|
| 프로그램명 | `programName` | 서버 |
| 진행년도 | `year` | 서버 |
| 프로그램 진행 현황 | `lifecycleStatus` | 서버 |
| 참여자 유형 | `participantType` | **OpenAPI 없음** — FE 전송 + 클라 보조 매칭. 갭 P2 |
| 교육 대상 | `educationTarget` | 서버 |
| 후원사 담당자명 | `managerName` | 서버 |

### 성능 노트 (FE)

- 후원 상태 드롭다운 open은 **셀 로컬 state** (columns deps에서 제외)
- 행 hover detail prefetch는 **150ms debounce**
- 등록 성공 시 목록 캐시 `applyCreatedToArrayLists` prepend (전량 invalidate 회피)

### 상세 LNB

| `sponsorLnb` | 패널 |
|--------------|------|
| `sponsor-detail` | 기본정보 + 연도별 후원금 |
| `sponsor-programs` | 프로그램 진행 이력 |
| `sponsor-contacts` | 후원사 담당자 정보 (필터·CRUD) |

담당자 필드: 부서·직함·유형·담당자명·내선·연락처·이메일·회사 주소·비고·등록일시 (`department`, `position`, `officePhone`, `phone`/`mobilePhone`, `email`, `companyAddress`, `memo`).

### 프로그램 진행 이력 필터

| UI | API query | 비고 |
|----|-----------|------|
| 프로그램명 | `programName` | 서버 |
| 진행년도 | `year` | 서버 |
| 프로그램 진행 현황 | `lifecycleStatus` | 서버 |
| 참여자 유형 | `participantType` | **OpenAPI 없음** — FE 전송 + 클라 보조 매칭. 갭 P2 |
| 교육 대상 | `educationTarget` | 서버 |
| 후원사 담당자명 | `managerName` | 서버 |

### 성능 노트 (FE)

- 후원 상태 드롭다운 open은 **셀 로컬 state** (columns deps에서 제외)
- 행 hover detail prefetch는 **150ms debounce**
- 등록 성공 시 목록 캐시 `applyCreatedToArrayLists` prepend (전량 invalidate 회피)

### 연도별 후원금 (상세 패널)

- DTO: `businessYear`, `donationAmount`, `beneficiaryCount`, `memo`
- UI: 누적 후원금·누적 수혜자 + 테이블(No, 후원년도, 후원금, 총 수혜자 수, 비고)
- 후원 시작연도~올해 빈 연도를 표시. 「후원정보 수정」 저장 시 기존 id는 PATCH, 없으면 POST
- 목록 API를 우선하고, 실패 시 상세 embed `yearlyBusinesses`를 사용

### 프로그램 진행 이력

- 조회: `GET …/program-histories` (`keyword`, `year`, `lifecycleStatus`, `educationTarget`, `managerName`, `page`, `size`)
- 컬럼: 참여자 모집 인원 제거. 담당자 라벨 **후원사 담당자명**. 행 클릭 → 프로그램 관리 상세.
- 삭제: **API 없음** — 삭제 버튼 항상 비활성. 갭 문서 P0. SSOT: [data-management-api-backend-gaps.md](./data-management-api-backend-gaps.md)
- 총 수혜자 컬럼: API 없음 — 갭(노란) · FE 미표시

### 프로그램 폼·링크 연동 (LNB 밖)

- 프로그램 등록/기본정보 폼 후원사·담당자 셀렉트: `useSponsorOptionsQuery` / `useSponsorContactsQuery`
- 프로그램 상세 → 후원사 링크: `resolveSponsorManagementRowById`
- API 비활성 시 빈 옵션 + 안내 (mock 대체 없음)
- B-5: 폼이 mock `sponsors.ts` / `dp-*` 대신 options·matches API만 쓰도록 전환(별 PR)

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
