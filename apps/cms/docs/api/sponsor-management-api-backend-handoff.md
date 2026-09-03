# 후원사 관리 — API 수정 요청 (백엔드 핸드오프)

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-09-03 |
| 범위 | CMS LNB **데이터 관리 > 후원사** 목록·신규 등록·상세 기본정보·로고 |
| OpenAPI | `apps/cms/openapi/data-management.openapi.json` (v9) · 파일 공용 API는 `backend.openapi.json` |
| 관련 | [data-management-api-backend-gaps.md](./data-management-api-backend-gaps.md) (2026-08-26, **후원사 항목은 본 문서가 SSOT**) · [data-management-api-integration.md](./data-management-api-integration.md) |

FE는 목록·등록·상세를 이미 호출합니다. **신규 엔드포인트보다 기존 계약 수정·값 채움**이 대부분입니다.  
후원사 전용 로고 업로드 API는 **만들지 않아도 됩니다.** 공용 files API + `logoFileId` 연결이면 됩니다.

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
| **S-7** | **P1** | `DELETE …/program-histories/{historyId}` (+ 선택 bulk) | FE 버튼 있음, remote에서 비활성. 상세는 [gaps P0](./data-management-api-backend-gaps.md) |
| **S-8** | **P2** | 이력 `participantType` 쿼리 | FE 전송 + 클라 보조 매칭 |
| **S-9** | **P2** | `GET /api/admin/sponsors/export` | 지금은 클라 테이블 dump |

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

## 7. 상세 부가 (기존 갭, 그대로)

| ID | 내용 |
|----|------|
| **S-7** | `DELETE /api/admin/sponsors/{sponsorId}/program-histories/{historyId}` — 이력 행 삭제. 실적(연도별 후원금)은 유지. path `id` 타입을 목록 `id`와 동일하게 |
| **S-8** | `GET …/program-histories?participantType=school\|individual\|volunteer` |
| **S-9** | `GET /api/admin/sponsors/export` — 목록과 동일 필터, 감사로그 fail-closed |

연도별 후원금 CRUD는 이미 있습니다. 자동 생성 여부는 [gaps §C.2](./data-management-api-backend-gaps.md) 확인 항목.

`BulkIdsRequest.ids`가 `number[]`인데 후원사 id가 UUID면 일괄 삭제가 깨집니다. **string[] 이거나 숫자 id로 고정.**

---

## 8. FE가 이미 보내는 POST/PATCH 예시

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

## 9. 요청하지 않는 것

- 후원사 전용 멀티파트 로고 업로드 API
- 소재지 시군구 분리 필드 (FE는 주소검색 + 상세주소 한 줄 `address`)
- 목록 「주 담당자 연락처」 컬럼 (FE 제거 완료)
- `description`에 사업자번호/대표/주소를 합쳐 넣는 방식 (폐기)

---

## 10. 인수 체크

- [ ] `discussing` / `dormant` POST·PATCH·목록 필터 200
- [ ] 등록/상세에서 `homepageUrl` 저장 후 GET에 동일 값
- [ ] `securityMemo` 저장 후 GET에 동일 값
- [ ] 목록 `totalDonationAmount` / `totalBeneficiaryCount`가 연도별 합과 같음
- [ ] `sponsorshipStartDateFrom`/`To`가 서버에서 걸러짐
- [ ] 파일 prepare `ownerDomain=SPONSOR` `ownerType=LOGO` 200 → confirm → PATCH `logoFileId` → 상세에 파일명
- [ ] 신규 등록: create → upload → PATCH 로고 연결
- [ ] 알 수 없는 `sponsorshipStatus`는 400
- [ ] OpenAPI 반영 후 CMS `data-management` Orval 재생성
