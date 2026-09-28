# Cursor prompt — Platform 공개 프로그램 목록·홈 카드·상세 (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 전부 탐색하지 말고, **이 문서에 적힌 계약·값만** 사용하라.  
질문이 필요하면 스키마가 값을 거부할 때(enum·NOT NULL·권한)만 하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/portal-platform-programs-backend-cursor-prompt-2026-09-20.md`

관련 FE 계약: `apps/platform/docs/api/public-program.md`

---

## Goal

Platform 사용자 홈 프로그램 캐러셀과 `/programs` 목록·상세가 **Homepage Admin(`:8081`)이 아니라** CMS Portal API만 쓴다.

이미 있는 공개 API:

| Method | Path | 화면 |
|--------|------|------|
| GET | `/api/portal/programs` | 홈 카드 8건 + `/programs` 목록 |
| GET | `/api/portal/programs/{programId}` | `/programs/{id}` 상세 |
| GET | `/api/portal/public/files/{fileObjectId}/content` | 썸네일 |
| GET | `/api/portal/public/files/{fileObjectId}/download` | 첨부 다운로드 |

완료 조건:

1. 목록 응답 스키마가 **런타임 필드**와 OpenAPI가 같다. (지금 OpenAPI `ProgramSummary`는 실제 목록 행과 다르다.)
2. 홈 캐러셀용 **고정 8건** 규칙이 서버에 있다. (`sort=LATEST&size=8` 임시 사용을 대체)
3. 목록 필터 enum이 Platform UI와 1:1이다. 특히 모집 예정.
4. 목록 행에 썸네일 `thumbnailFileObjectId`가 있으면 내려온다.
5. 로그인 없이 `PUBLIC_PORTAL`. 시드는 local/dev만.

---

## Out of scope / 금지

- Homepage Admin(`JAHOMEADMINBACK`, `:8081`) `GET /api/public/main` `education.programs` 를 Platform 홈 카드 SSOT로 유지하지 마라. 홈 **제목 카피**만 8081에 남긴다.
- 신청 제출(`POST /api/portal/programs/{id}/applications`)·신청 폼 바인딩을 이 작업에서 바꾸지 마라.
- 마이페이지 강의/봉사/교육현황 상세.
- TRUNCATE. prod Flyway에 운영 카피를 넣지 마라.
- Platform FE 수정 (프론트 작업 아님).

---

## 화면 / 호출 주체

| 화면 | Platform path | 호출 |
|------|---------------|------|
| 홈 캐러셀 | `/` | `GET /api/portal/programs?page=0&size=8&sort=LATEST` (임시). 아래 홈 규칙이 생기면 그걸로 교체. |
| 목록 | `/programs` | `GET /api/portal/programs` + 필터 쿼리 |
| 상세 | `/programs/{programId}` | `GET /api/portal/programs/{programId}` |

인증 없음. `skipAuth`.

---

## 1. 목록 쿼리 (이미 있음 — enum·의미를 고정)

값은 모두 optional. 빈 값/미전달 = 전체. `page` 0-base.

| query | Platform UI | 보낼 값 | 비고 |
|-------|-------------|---------|------|
| `keyword` | 검색 | 제목 contains | |
| `portalTab` | 상단 탭 | `YOUTH_YOUNG` / `ORGANIZATION` / `INSTRUCTOR` | 전체 탭은 생략 |
| `recruitmentStatus` | 모집현황 | **`UPCOMING` / `OPEN` / `CLOSED`** | `SCHEDULED` 는 400이다. `UPCOMING`을 모집 예정으로 유지하거나 `SCHEDULED` 별칭을 허용하라. `RECRUITING`은 `OPEN`과 동일 취급. |
| `recruitmentTarget` | 모집대상 | `elementary` / `middle` / `high` / `university` / `adult` | 대소문자 무시 |
| `educationTarget` | 교육대상 | 동일 enum | 고등학생(`high`)이 0건이면 데이터 또는 매핑 버그 |
| `educationMethod` | 교육형태 | `ONLINE` / `OFFLINE` / `HYBRID` / `PARTICIPANT_CHOICE` | |
| `operatingFrom` `operatingTo` | 운영기간 | `YYYY-MM-DD` | `businessStartDate`~`businessEndDate` **겹침** |
| `sort` | 정렬 | `LATEST` / `NAME` / `CLOSING_SOON` | `TITLE`은 `NAME` 별칭. `DEADLINE`은 `CLOSING_SOON` 별칭. |
| `page` `size` | 페이지 | 기본 page=0 size=20. 목록 UI는 size=10 | `totalElements`는 필터된 **전체** 건수 |

`periodStatus` 쿼리는 지금 무시된다. 모집현황 필터는 `recruitmentStatus`만 써라.

---

## 2. 목록 행 계약 (OpenAPI를 런타임에 맞춰라)

로컬 `GET /api/portal/programs?page=0&size=2` 실제 행:

```json
{
  "programId": 186012,
  "programUuid": "8b6397e7-53d6-42f9-be95-b969f3ce52a2",
  "programCode": "GENERAL_INDIVIDUAL-2026-09-17-000004",
  "programType": "GENERAL_INDIVIDUAL",
  "portalCategories": ["YOUTH_YOUNG"],
  "title": "대표 프로그램명 (국문)2222223333",
  "summary": "121212",
  "operationMethod": "ONLINE",
  "businessYear": 2026,
  "businessStartDate": "2026-09-17",
  "businessEndDate": "2026-09-18",
  "periodStatus": "COMPLETED",
  "recruitmentStatus": "CLOSED",
  "recruitmentStartAt": "2026-09-16T15:00:00Z",
  "recruitmentEndAt": "2026-09-17T15:00:00Z",
  "applicationTargetMode": "INDIVIDUAL",
  "availableApplicationTypes": ["INDIVIDUAL"],
  "canApply": false,
  "thumbnailFileObjectId": null,
  "educationTarget": "university"
}
```

페이지: `{ items, page, size, totalElements, totalPages }`.

OpenAPI `ProgramSummary`(posterFileObjectId, sponsorName, educationStartAt …)는 **이 목록이 아니다.** 스키마를 위 필드에 맞춰라.

`recruitmentStatus` 표시 규칙 (FE도 동일):

| 값 | 배지 |
|----|------|
| `OPEN` 또는 `RECRUITING` | 모집 중 |
| `UPCOMING` | 모집 예정 |
| `CLOSED` | 모집 완료 |

`periodStatus=SCHEDULED` 이고 `recruitmentStatus=OPEN` 이면 **모집 중**이다. 기간 축과 모집 축을 섞지 마라.

---

## 3. 홈 캐러셀 8건 (신규 비즈니스 규칙)

Platform 홈은 **최대 8장**이다. 지금은 `LATEST` 8건이라 완료·테스트 프로그램이 먼저 나온다.

서버에서 아래 중 **하나**를 구현하라. 둘 다 하지 말고 하나를 골라 OpenAPI에 적어라.

### 옵션 A (권장) — 기존 목록 + 플래그

`GET /api/portal/programs?featuredOnHome=true&size=8`

- CMS 프로그램에 `featuredOnHome`(또는 홈 노출 순서 `homeDisplayOrder`)을 둔다.
- true인 행만, `homeDisplayOrder` 오름차순. 8건 초과면 앞 8.
- 0건이면 빈 배열. mock/랜덤 채우기 금지.
- 모집 완료만 있는 홈은 허용한다. 운영이 플래그를 끈다.

### 옵션 B — 전용 path

`GET /api/portal/programs/home`

응답은 목록 행과 **같은 스키마** 배열(또는 `{ items }` ). size 고정 8.

어느 쪽이든 **Homepage `education.programs` 프록시를 홈 SSOT로 쓰지 마라.**

---

## 4. 상세

`GET /api/portal/programs/{programId}` 는 이미 200이다. 유지.

- 없는 id → **404**. 빈 객체 200 금지.
- `thumbnailFileObjectId` / `attachments[].fileObjectId` 가 있으면 public file URL로 열 수 있어야 한다.
- `recruitments[]` · `curricula[]` · `schedules[]` · `sponsorNames` · 문의 `contactPhone`/`contactEmail` 유지.

---

## 5. 썸네일

목록·상세 모두 `thumbnailFileObjectId`를 내려라.  
파일이 없으면 `null`. placeholder 파일명으로 채우지 마라.  
Platform은 `/api/portal/public/files/{id}/content` 를 `<img src>` 로 쓴다. 공개 읽기 가능해야 한다.

---

## Done when

- [ ] OpenAPI 목록 아이템 = 런타임 JSON
- [ ] `recruitmentStatus=UPCOMING|OPEN|CLOSED` 가 400 없이 필터된다. (`SCHEDULED` 별칭이면 문서에 적는다)
- [ ] `sort=LATEST|NAME|CLOSING_SOON` 유지
- [ ] 홈 8건 규칙(옵션 A 또는 B)이 구현되고 빈 목록을 mock으로 채우지 않는다
- [ ] 상세 404
- [ ] public file content 가 로그인 없이 200
- [ ] 작업 후 아래 템플릿으로 회신

```
Changed:
- …

Verify:
- GET /api/portal/programs?page=0&size=8
- GET /api/portal/programs?recruitmentStatus=UPCOMING
- GET /api/portal/programs/{id}  (있는 id / 없는 id)

Not done:
- …
```

**Last updated:** 2026-09-20
