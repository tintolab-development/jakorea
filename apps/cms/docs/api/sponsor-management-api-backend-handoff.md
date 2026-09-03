# 후원사 관리 — API 수정 요청 (백엔드 핸드오프)

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-09-03 (단독 전달용 통합) |
| 범위 | CMS LNB **데이터 관리 > 후원사** 목록·신규 등록·상세(기본정보·연도별 후원금·프로그램 이력·담당자)·로고 |
| OpenAPI | `apps/cms/openapi/data-management.openapi.json` (v9) · 파일 공용 API는 `backend.openapi.json` |
| **전달 단위** | **본 문서만으로 후원사 BE 작업·검수 가능.** 교재/세부 프로그램은 범위 밖. |
| 동봉(선택) | 시드 샘플 [`sponsors-seed.payload.json`](./sponsors-seed.payload.json) — 담당자 확장 필드 채움 참고 |

FE는 목록·등록·상세를 이미 호출합니다. **신규 엔드포인트보다 기존 계약 수정·값 채움**이 대부분입니다.  
후원사 전용 로고 업로드 API는 **만들지 않아도 됩니다.** 공용 files API + `logoFileId` 연결이면 됩니다.

> 과거 갭 인덱스: `data-management-api-backend-gaps.md` / FE 연동 메모: `data-management-api-integration.md` — **후원사 요청의 본 문서가 SSOT.** 서버는 그 파일을 열 필요 없음.

---

## 0. 이미 있는 API (변경·값 채움 대상)

| Method | Path | 비고 |
|--------|------|------|
| GET/POST | `/api/admin/sponsors` | 목록·등록 |
| GET/PATCH/DELETE | `/api/admin/sponsors/{sponsorId}` | 상세·수정·단건 삭제 |
| POST | `/api/admin/sponsors/bulk-delete` | 목록 일괄 삭제 |
| POST | `/api/admin/sponsors/{sponsorId}/end` | 후원 종료 → `ended` |
| GET/POST | `/api/admin/sponsors/{sponsorId}/contacts` | 담당자 목록·등록 |
| PATCH/DELETE | `/api/admin/sponsors/contacts/{contactId}` | 담당자 수정·삭제 |
| POST | `/api/admin/sponsors/contacts/bulk-delete` | 담당자 일괄 삭제 |
| GET | `/api/admin/sponsors/{sponsorId}/program-histories` | 프로그램 진행 이력 |
| GET/POST | `/api/admin/sponsors/{sponsorId}/yearly-businesses` | 연도별 후원금 |
| PATCH/DELETE | `/api/admin/sponsors/yearly-businesses/{yearlyBusinessId}` | 연도별 수정·삭제 |

**아직 없음 (신규):** `DELETE …/program-histories/{historyId}` (S-7), 선택 bulk-delete, `GET …/sponsors/export` (S-9).

---

## 1. 우선순위

| ID | 우선 | 작업 | 현재 상태 |
|----|------|------|-----------|
| **S-1** | **P0** | `sponsorshipStatus` 4종 허용 (목록 필터·POST·PATCH·`POST …/end`) | FE 전송 중. OpenAPI는 자유 문자열. `discussing`/`dormant` 거절되면 저장·필터 깨짐 |
| **S-2** | **P0** | `SponsorRequest`에 `homepageUrl` 추가·영속 | 응답에만 있음. FE는 POST/PATCH에 extra로 보냄 |
| **S-3** | **P0** | 목록 `totalDonationAmount` / `totalBeneficiaryCount` **값 채움** | OpenAPI 필드는 있음. 비우면 화면이 `0원` / `0명` |
| **S-4** | **P1** | `SponsorRequest`에 `logoFileId` + 공용 파일 업로드 owner 합의 | 응답에만 `logoFileId`. 업로드·파일명·다운로드 없음 |
| **S-5** | **P1** | `SponsorsParams`에 `sponsorshipStartDateFrom` / `To` | FE 전송 + 클라 보조 필터. BE 수용 시 클라 필터 제거 |
| **S-6** | **P1** | 목록 **Page** (`page`/`size`/`total`) | 지금 전체 배열. 교재·세부 프로그램과 불일치 |
| **S-7** | **P0** | `DELETE …/program-histories/{historyId}` (+ 선택 bulk) | FE 버튼 있음, remote에서 비활성. **§7.1** |
| **S-8** | **P2** | 이력 `participantType` 쿼리 | FE 전송 + 클라 보조 매칭. **§7.2** |
| **S-9** | **P2** | `GET /api/admin/sponsors/export` | 지금은 클라 테이블 dump. **§7.3** |
| **S-10** | **P1** | 담당자 목록 확장 필드 **영속·응답 채움** | 스키마는 있음. 비우면 내선·주소·비고·등록일시가 `-` |
| **S-11** | **P0** | `officePhone` 검증 완화 — 숫자만 **또는** 하이픈 포함 번호 | 지금 `mobilePhone`과 동일 validator. `1234`·`010-2222-2222`가 400일 수 있음 |
| **S-12** | **P1** | `BulkIdsRequest.ids` 타입 정리 | OpenAPI `number[]`. UUID면 bulk-delete 깨짐. **§7.4** |

**이번 UI 정렬에서 서버가 이미 있는 필드로 처리 가능한 것** (스펙 추가 불필요, **영속·값만 확인**):

- 등록/상세: `name`/`nameDisplayKo`, `nameEn`/`nameDisplayEn`, `organizationKind`, `businessNumber`, `sponsorshipStartDate`, `executives`, `address`, `securityMemo`(비고)
- 목록: `programCount`, `sponsorshipStartDate`, `managers[0].name`(주 담당자)

---

## 2. 후원 상태 4종 (S-1)

화면 라벨은 고정입니다. **API 값은 아래 영문 코드만** 사용합니다.

| API 값 | 화면 | 비고 |
|--------|------|------|
| `active` | 후원 중 | 기본값. 예전 라벨 「진행 중」 폐기 |
| `ended` | 후원 종료 | `POST /api/admin/sponsors/{sponsorId}/end`와 동일 상태 |
| `discussing` | 후원 논의중 | **신규. 거절하지 말 것** |
| `dormant` | 후원 휴면 | **신규. 거절하지 말 것** |

요청:

1. OpenAPI `sponsorshipStatus`를 위 4값 enum으로 고정.
2. `GET /api/admin/sponsors?sponsorshipStatus=` 필터가 4값 모두 동작.
3. POST/PATCH가 4값 모두 저장. 알 수 없는 값은 **400**.
4. `status` 쿼리와 `sponsorshipStatus`가 스펙에 둘 다 있음. **FE는 `sponsorshipStatus`만 보냄.** `status`는 무시하거나 deprecated.
5. `POST …/end`는 `ended`로 바꾸고, 나머지 3값은 PATCH로만 변경.

---

## 3. 등록·상세 쓰기 계약 (S-2, S-4)

### 3.1 현재

`SponsorRequest` (OpenAPI):

```
name, nameEn, nameDisplayKo, nameDisplayEn, businessNumber, executives,
address, description, contactInfo, managers, securityMemo,
organizationKind, sponsorshipStatus, sponsorshipStartDate
```

`SponsorResponse` / `SponsorDetailResponse`에만 있고 **Request에 없는 필드**:

| 필드 | 화면 | FE |
|------|------|-----|
| `homepageUrl` | 홈페이지 | POST/PATCH extra로 전송. 서버가 버리면 재조회 시 빈 칸 |
| `logoFileId` | 로고 | **전송 안 함.** Request에 없음 |
| `securityMemo` | 비고 | Request에 있음. **영속 확인** |

사업자번호·대표이사·주소는 `description`에 넣지 않습니다. 각자 필드로 보냅니다.

### 3.2 `SponsorRequest`에 추가

```json
{
  "homepageUrl": "https://www.samsung.com",
  "logoFileId": "101"
}
```

| 필드 | 필수 | 규칙 |
|------|------|------|
| `homepageUrl` | 선택 | URL 문자열. 빈 문자열은 삭제(null)로 저장 |
| `logoFileId` | 선택 | 공용 파일 업로드 confirm 후 받은 `fileObjectId`. 빈 값/null은 로고 해제 |

등록 필수(FE): 국문 후원사명, 영문 후원사명, 후원 시작일. 그 외는 선택.

### 3.3 응답 보강 (로고 표시)

지금 `logoFileId`만 오면 FE는 파일명을 id로 찍습니다. 아래 중 하나:

- **권장**: `logoFileId` + `logoFileName` (원본 파일명)
- 또는 상세에서 `GET /api/admin/files/{fileObjectId}`로 파일명 조회 가능하게

화면은 로고를 **여러 개** 보여 주지만 API는 **1개**입니다. 다건이 필요하면 `logoFileIds: string[]`로 확장. 당장은 **1개로 합의**해도 됩니다.  
일괄 다운로드는 로고 1개면 `GET /api/admin/files/{fileObjectId}/download`로 충분합니다.

---

## 4. 로고 — 공용 파일 API 연결 (S-4)

후원사 전용 `POST /sponsors/{id}/logo`는 **불필요**합니다.

이미 있는 공용 흐름 (성범죄 동의서와 동일):

1. `POST /api/admin/files/upload-requests`
2. presigned `uploadUrl`에 `PUT`
3. `POST /api/admin/files/{fileObjectId}/confirm`
4. 후원사 POST/PATCH에 `logoFileId` = confirm된 id

`FileUploadPrepareRequest` 필수: `ownerDomain`, `ownerType`, `ownerId`.

| 필드 | 제안 값 | 이유 |
|------|---------|------|
| `ownerDomain` | `SPONSOR` | 동의서는 `MEMBER` |
| `ownerType` | `LOGO` | 동의서는 `CONSENT` |
| `ownerId` | 후원사 id | **신규 등록 시 id가 없음** |
| `privacyLevel` | `PUBLIC` 또는 `INTERNAL` | 로고는 민감파일 아님. `SENSITIVE` 금지 |

**신규 등록 순서 (권장):**

1. 로고 없이 `POST /api/admin/sponsors` → `id` 수신
2. files prepare (`ownerId` = 방금 만든 id) → PUT → confirm
3. `PATCH /api/admin/sponsors/{id}` `{ "logoFileId": "<fileObjectId>" }`

등록 팝업에서 파일을 고른 뒤 한 번에 끝내야 하면, create 응답 후 FE가 2–3을 이어서 호출합니다. **create 전에 upload하려면 `ownerId`가 없어서 공용 API를 탈 수 없습니다.**

스테이징 files 모듈은 OpenAPI상 `PROVIDER_PENDING`입니다. 로고 실연동은 `files` 모듈 활성과 같은 조건입니다.

---

## 5. 목록 집계 (S-3)

OpenAPI `SponsorResponse`에 이미 있습니다.

| 필드 | 화면 | 표시 |
|------|------|------|
| `programCount` | 프로그램 진행 수 | `N건` |
| `totalDonationAmount` | 누적 후원금 | `N원` |
| `totalBeneficiaryCount` | 누적 수혜자 | `N명` |

**합산 규칙 (제안, 스펙에 명시):**

- `totalDonationAmount` = 해당 후원사 `yearly-businesses`의 `donationAmount` 합
- `totalBeneficiaryCount` = 해당 후원사가 진행한 **모든 프로그램 참여자 수 합** (`program-histories.participantCount`의 실제 인원). 연도별 `beneficiaryCount` 합이 아님
- 프로그램이 없으면 `0`

상세 연도별 후원금 카드의 누적 수혜자도 동일 규칙이다. 목록 숫자와 상세 카드가 같아야 한다.

목록 GET이 이 값을 **항상 채워야** 합니다. 상세의 연도별 패널 합과 목록 숫자가 같아야 합니다.

주 담당자: 목록은 `managers[0].name`을 씁니다. **주 담당자(`contactType=lead` / `primary=true`)를 0번에** 두거나, 담당자가 없으면 빈 배열.

---

## 6. 목록 조회 쿼리 (S-5, S-6)

### 6.1 FE가 보내는 필터

| 쿼리 | 값 | OpenAPI `SponsorsParams` |
|------|-----|--------------------------|
| `organizationKind` | `corporate` \| `foundation` | 있음 |
| `keyword` | 후원사명 | 있음 |
| `managerName` | 주 담당자명 | 있음 |
| `sponsorshipStatus` | 4종 중 하나. 전체면 생략 | 있음 (값 4종 미고정) |
| `sponsorshipStartDateFrom` | `YYYY-MM-DD` | **없음 → 추가** |
| `sponsorshipStartDateTo` | `YYYY-MM-DD` | **없음 → 추가** |

기간 필터는 **후원 시작일** 기준입니다. BE가 수용하기 전까지 FE가 응답을 한 번 더 거릅니다.

### 6.2 페이지네이션

지금은 배열 전체. 교재·세부 프로그램처럼:

```
GET /api/admin/sponsors?page=0&size=50
→ { content, page, size, total }
```

`SponsorsParams`에 `page`/`size` 추가.

---

## 7. 프로그램 이력 · export · bulk id (S-7 ~ S-12)

### 7.1 이력 삭제 (S-7) — **신규 API**

```
DELETE /api/admin/sponsors/{sponsorId}/program-histories/{historyId}
```

| 항목 | 계약 |
|------|------|
| Auth | 관리자 JWT |
| 성공 | `200` (또는 `204`) |
| 효과 | **해당 이력 행만** 목록에서 제거 |
| 유지 | 연도별 후원금(`yearly-businesses`)·목록 누적 후원금 **삭제·재계산 강제하지 않음**. Notion: 「실적 값은 삭제되지 않음」= 연도별 후원금 실적 유지 |
| id 타입 | path `historyId` = 목록 GET 행의 `id`와 **동일 타입·동일 값** |

선택:

```
POST /api/admin/sponsors/{sponsorId}/program-histories/bulk-delete
body: { "ids": [ ... ] }   // 목록 id와 동일 타입
```

FE는 API 오기 전까지 삭제 버튼을 remote에서 비활성한다.

### 7.2 이력 `participantType` 필터 (S-8)

```
GET /api/admin/sponsors/{sponsorId}/program-histories?participantType=school|individual|volunteer
```

OpenAPI `ProgramHistoriesParams`에 추가. FE는 이미 전송 + 클라 보조 매칭. 서버 수용 시 클라 필터 제거.

이력 행에 총 수혜자(참여자 수)를 보여 준다. 목록 DTO에 `participantCount`(또는 동등)가 비면 `-`/`0`. **채울 것.**

### 7.3 엑셀 export (S-9)

```
GET /api/admin/sponsors/export
```

목록과 **동일 필터 쿼리**. 응답: xlsx 또는 download URL. **감사로그 fail-closed** (실패 시 파일 미제공).  
지금은 FE가 테이블 dump.

### 7.4 bulk-delete `ids` 타입 (S-12)

`POST /api/admin/sponsors/bulk-delete` · `…/contacts/bulk-delete` body `BulkIdsRequest.ids`가 OpenAPI상 `number[]`.  
후원사/담당자 id가 UUID 문자열이면 깨진다.

- **`string[]`로 바꾸거나**, 숫자 id로 **고정**하고 OpenAPI·시드에 명시.
- FE는 파싱 가능한 숫자는 number로 보내고, 아니면 런타임 캐스팅한다.

### 7.5 연도별 후원금 — 확인만 (신규 API 없음)

CRUD는 이미 있음. FE 동작:

- 상세에서 후원 시작연도~올해 빈 연도를 UI에 보여 줌
- 저장 시 id 없으면 `POST …/yearly-businesses`, 있으면 `PATCH`

**서버에 확인할 것:** 후원 시작일부터 매년 행을 **자동 INSERT**하는지, 아니면 FE POST만인지.  
자동 생성이면 FE empty-row POST와 중복되지 않게 문서로 적어 주세요.

목록 기본 정렬·건수 상한도 스펙에 한 줄 적어 주세요 (예: 등록일 desc, 상한 없음/Page).

---

## 8. 담당자 목록 확장 (S-10)

신규 엔드포인트는 필요 없습니다. 화면이 담당자 테이블을 시안 전체 컬럼으로 넓혔습니다. **이미 있는 GET/POST/PATCH가 아래를 저장하고 다시 줘야** 합니다.

| 화면 | Request | Response | 비고 |
|------|---------|----------|------|
| 담당자 유형 | `contactType` + `primary` | 동일 | `lead` / `assistant`. `primary=true`는 주 담당자 |
| 부서 | `department` | 동일 | |
| 직함 | `position` | 동일 | |
| 담당자명 | `name` | 동일 | 필수 |
| 내선번호 | `officePhone` | 동일 | **선택.** 아래 **S-11** — 사내 내선 숫자만 / 전체 전화번호 **모두 허용**. 빈 값은 **키 생략**. 한글 등 비숫자 텍스트만 400 |
| 연락처 | `mobilePhone` | `phone` 또는 `mobilePhone` | FE는 `mobilePhone`으로 보내고 `phone ?? mobilePhone`으로 읽음 |
| 이메일 | `email` | 동일 | |
| 회사 주소 | `companyAddress` | 동일 | |
| 비고 | `memo` | 동일 | 빈 문자열 허용 |
| 등록일시 | — (서버 생성) | `registeredAt` 또는 `createdAt` | 비우면 `-`. **항상 채울 것** |

요청:

1. POST/PATCH가 `officePhone` / `companyAddress` / `memo` / `department` / `position` / `email`을 버리지 않을 것.
2. GET `/api/admin/sponsors/{id}/contacts`와 상세 embed `contacts[]`가 위 필드를 **항상 채울 것**.
3. `GET …/contacts` 쿼리 `department` / `position` / `name` — OpenAPI에 없음. FE가 보내고 클라에서도 한 번 더 거름. **수용하면 OpenAPI에 추가.**
4. 인라인 수정은 행마다 기존 `PATCH /api/admin/sponsors/contacts/{contactId}`를 호출합니다. **일괄 PATCH는 만들지 않아도 됩니다.**
5. 시드 `detailSamples[].contacts`에 위 필드를 채울 것. 시안: [`sponsors-seed.payload.json`](./sponsors-seed.payload.json)

### 8.1 내선번호 `officePhone` 검증 (S-11)

화면 라벨은 **내선번호**입니다. 사내 교환 내선(`1234`)과 회사 대표번호(`02-1234-5678`)를 같이 넣습니다.  
**`mobilePhone`(연락처) 검증은 바꾸지 마세요.** `officePhone`만 한국 전화번호 validator에서 분리합니다.

지금 스테이징은 `officePhone=내선번호`뿐 아니라 **`1234`도 400**입니다.

```
code: VALIDATION_FAILED
field: officePhone
message: 전화번호 형식이 올바르지 않습니다. 010/070은 4-4자리, 02 및 지역번호는 3~4-4자리 형식으로 입력해 주세요.
```

요청 — 값이 있으면 아래를 **모두 200·영속**. 빈 값/키 생략은 그대로 허용. **하이픈 유무를 가리지 말 것.**

| 값 | 의미 | 결과 |
|----|------|------|
| `1234` | 사내 내선 (숫자만) | **200** |
| `12` / `12345678` | 짧은·긴 내선 (숫자 2~8자리) | **200** |
| `1234-5678` | 하이픈 있는 내선 | **200** |
| `010-2222-2222` | 하이픈 있는 휴대폰 형식 | **200** |
| `02-1234-5678` | 서울 일반전화 | **200** |
| `0212345678` | 하이픈 없는 일반전화 | **200** |
| `031-123-4567` | 지역번호 | **200** |
| `010-9999-8888` | 휴대폰 형식 | **200** |
| (키 생략 / `""`) | 미입력 | **200** |
| `내선번호` | 한글 라벨 | **400** |

규칙 제안:

1. 숫자만 2~11자리 → 그대로 저장. **하이픈·포맷 강제하지 말 것.**
2. 숫자 + 하이픈 (`010-2222-2222`, `02-1234-5678`, `1234-5678` 등) → 하이픈을 유지한 채 저장. **완성된 한국 전화번호인지 검사하지 말 것.** (`mobilePhone` validator를 `officePhone`에 쓰지 말 것.)
3. 한글·영문·공백 등 숫자/하이픈이 아닌 문자가 있으면 400.
4. `mobilePhone`은 기존처럼 한국 전화번호만.

---

## 9. FE가 이미 보내는 POST/PATCH 예시

신규 등록 (`POST /api/admin/sponsors`):

```json
{
  "name": "삼성전자",
  "nameDisplayKo": "삼성전자",
  "nameEn": "Samsung Electronics",
  "nameDisplayEn": "Samsung Electronics",
  "organizationKind": "corporate",
  "businessNumber": "124-81-00998",
  "sponsorshipStartDate": "2024-03-01",
  "sponsorshipStatus": "active",
  "executives": "이재용",
  "address": "경기도 수원시 영통구 삼성로 129",
  "securityMemo": "내부 메모",
  "homepageUrl": "https://www.samsung.com"
}
```

로고 `File`은 **아직 body에 넣지 않습니다.** S-4 합의 후 `logoFileId`만 추가합니다.

---

## 10. 요청하지 않는 것

- 후원사 전용 멀티파트 로고 업로드 API
- 소재지 시군구 분리 필드 (FE는 주소검색 + 상세주소 한 줄 `address`)
- 목록 「주 담당자 연락처」 컬럼 (FE 제거 완료)
- 이력 「참여자 모집 인원」 컬럼 (FE 제거 완료)
- `description`에 사업자번호/대표/주소를 합쳐 넣는 방식 (폐기)
- 교재·세부 프로그램 API (본 문서 범위 밖)

---

## 11. 인수 체크

### 등록·상태·목록

- [ ] `discussing` / `dormant` POST·PATCH·목록 필터 200
- [ ] 알 수 없는 `sponsorshipStatus`는 400
- [ ] 등록/상세에서 `homepageUrl` 저장 후 GET에 동일 값
- [ ] `securityMemo` 저장 후 GET에 동일 값
- [ ] 목록 `totalDonationAmount` / `totalBeneficiaryCount`가 §5 합산 규칙과 같음
- [ ] `sponsorshipStartDateFrom`/`To`가 서버에서 걸러짐
- [ ] 목록 Page (`page`/`size`/`total`) 또는 상한·정렬 문서화

### 로고

- [ ] 파일 prepare `ownerDomain=SPONSOR` `ownerType=LOGO` 200 → confirm → PATCH `logoFileId` → 상세에 파일명
- [ ] 신규 등록: create → upload → PATCH 로고 연결

### 담당자 (S-10, S-11)

- [ ] 담당자 POST/PATCH 후 GET에 `officePhone`·`companyAddress`·`memo`·`registeredAt`이 동일
- [ ] `officePhone=02-1234-5678` 이 400이 아님
- [ ] `officePhone=1234` / `010-2222-2222` / `1234-5678` POST/PATCH 200 후 GET에 입력값 유지 (하이픈 유지)
- [ ] `officePhone` 생략(빈 내선) POST 200. `officePhone=내선번호` 는 400
- [ ] `GET …/contacts?department=` / `position=` / `name=` 가 서버에서 걸러지거나, 미지원이면 전체 목록 200(클라 보조 필터)

### 이력·bulk·OpenAPI

- [ ] `DELETE …/program-histories/{historyId}` 200 후 목록에서 행 제거, yearly-businesses 유지
- [ ] (선택) program-histories bulk-delete
- [ ] `participantType` 쿼리 동작 또는 OpenAPI에 미지원 명시
- [ ] 이력 행 `participantCount`(총 수혜자) 채움
- [ ] bulk-delete `ids` 타입이 UUID/숫자와 일치
- [ ] OpenAPI 반영 후 CMS `data-management` Orval 재생성
- [ ] (권장) 시드 contacts에 officePhone·companyAddress·memo·registeredAt 채움 — `sponsors-seed.payload.json` 참고
