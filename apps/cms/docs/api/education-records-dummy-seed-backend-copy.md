# [FE → BE] CMS 실적 관리 mock 30건 DB 시드 요청

안녕하세요. CMS LNB **실적 관리** 화면을 FE mock과 같게 검증하려면, 아래 30건을 local/staging DB에 넣어 주세요.

프론트 레포에는 실적 bulk create API가 없어서, **BE local 시더 / Flyway / 내부 insert**로 적재해 주셔야 합니다.

---

## 1. 대상

- 화면: CMS LNB `실적 관리`
- path: `/education-records` (`?tab=data`, `?tab=summary`)
- 목록 API: `GET /api/admin/performance-records`
- 응답 DTO: `PerformanceRecordFrontendResponse[]` (배열 또는 `{ content: [...] }`)
- 합계 API: `GET /api/admin/performance/summary` (없으면 FE가 목록으로 피벗)
- FE 모듈 플래그: `performanceRecords`
- 시드 라벨: `education-records-fe-mock-30-v1`
- 건수: **30건**
- 연도: **2026** (`educationMonth` = `2026-01` ~ `2026-12`)

FE SSOT: `apps/cms/src/data/mock/programs.ts` → `educationRecords`

첨부/파일:
- 전체 CASE + FE DTO + DB row: `apps/cms/docs/api/education-records-seed.payload.json`
- insert용 배열만: `apps/cms/docs/api/education-records-seed.db-rows.json`
- 설명: `apps/cms/docs/api/education-records-dummy-seed-backend-request.md`

---

## 2. 하지 말아 주세요

1. Gemini 실적(`/programs/gemini/performance`, `GET …/training-reports`)과 **섞지 마세요.**
2. `POST /api/admin/performance-records/rebuild`만으로 채우지 마세요.  
   rebuild는 프로그램에서 재집계하므로 아래 엑셀 mock 수치(참가자·봉사·교사 수)를 보장하지 않습니다.
3. OpenAPI에 bulk create POST가 없습니다. **시더로 insert** 해 주세요.

---

## 3. Insert 규칙

- 테이블/엔티티는 BE 구현에 맞춤 (OpenAPI `PerformanceRecordResponse` 필드 기준)
- `id`: 로컬 안정값 `90001` ~ `90030` (운영 PK는 BE가 매핑해도 됨)
- `programId`: 로컬 안정값 `1` ~ `30` (프로그램 FK가 없으면 실적 단독 insert로 목록 조회만 되면 됨)
- `performanceStatus`: `CONFIRMED`
- `revisionNo`: `1`
- `latestRevisionYn`: `true`
- 라벨은 **엑셀 원문 유지** (초/중/고, 오프라인, 학교 안, Yes/No). `elementary` / `offline` 으로 바꾸지 마세요.
- `educationHours`는 **string** (예: `"3"`)
- 빈 값:
  - `해당없음` → 필드 omit (null/해당없음 문자열 넣지 않음)
  - 시군구가 `전국` 또는 `온라인` → omit
  - 학교명이 `전국` 또는 `해당없음` → omit
  - 세부 프로그램명이 `해당없음`이면 대표 프로그램명(국문) 사용

목록 API가 FE에 줄 때는 아래 매핑으로 `PerformanceRecordFrontendResponse`를 채워 주세요.

| DB / 내부 (`dbRow`) | 목록 API (`listItem`) |
|---|---|
| `id` (number) | `id` (string) |
| `programId` (number) | `programId` (string) |
| `performanceStatus` | `status` |
| `sponsorNamesEn` | `sponsorNameEn` |
| `programNameEn` | `titleEn` |
| `sponsorNamesKo` | `sponsorNameKo` |
| `mainProgramNameKo` | `mainTitle` |
| `detailedProgramNameKo` | `title` |
| `textbookNameKo` | `textbookName` |
| `sigungu` | `district` |
| `targetType` | `targetLevel` |
| `organizationType` | `institutionType` |
| `ipsType` | `ips` |
| `programChannelFormat` | `programChannel` |
| `maleCount` | `maleParticipants` |
| `femaleCount` | `femaleParticipants` |
| `totalParticipantCount` | `totalParticipants` |
| `generalVolunteerCount` | `generalVolunteers` |
| `employeeVolunteerCount` | `staffVolunteers` |
| `reparticipationVolunteerCount` | `returningVolunteers` |
| `generalTeacherCount` | `generalTeachers` |
| `trainedTeacherCount` | `educatedTeachers` |
| `instructorCount` | `instructors` |
| `latestRevisionYn` | `latestRevision` |

---

## 4. CASE 목록 (확인용)

| CASE | FE programId | 월 | 사업분야 | 후원사(국문) | 세부 프로그램명 | 학교/기관 | 시군구 | 인원 |
|---|---|---|---|---|---|---|---|---|
| CASE-01 | prog-001 | 12 | 기업가정신 | JA Korea 고유목적사업 | 1사1교 경제금융교육 | 발곡고등학교 | 경기 의정부시 | 27 |
| CASE-02 | prog-002 | 7 | 경제금융 | BNP 파리바 카디프생명 | 신용케어 아카데미 | 씨앗지역아동센터 | 인천 계양구 | 12 |
| CASE-03 | prog-003 | 2 | 경제금융 | BNP PARIBAS CIB | BNP PARIBAS CIB와 JA Korea가 함께하는 어린이 경제교육 프로그램 | 새날지역아동센터 | 서울 광진구 | 22 |
| CASE-04 | prog-004 | 3 | 기업가정신 | 뉴욕멜론은행 | 오리엔테이션 | — | — | 132 |
| CASE-05 | prog-005 | 1 | 기업가정신 | 뉴욕멜론은행, 한국투자공사, 월트디즈니컴퍼니코리아, SAP Korea | 국내대회 | — | — | 57 |
| CASE-06 | prog-006 | 4 | 경제금융 | 한국 씨티은행 | 1사1교 경제금융교육 | 중원중학교 | 충북 충주시 | 21 |
| CASE-07 | prog-007 | 6 | 경제금융 | 한국 씨티은행 | 1사1교 경제금융교육 | 대구영선초등학교 | 대구 남구 | 44 |
| CASE-08 | prog-008 | 9 | 경제금융 | 한국 씨티은행 | 1사1교 경제금융교육 | 윤슬초등학교 | 경기 하남시 | 280 |
| CASE-09 | prog-009 | 5 | 진로취업 | 한국씨티은행 | 특별한 JOB담 | 서울여자상업고등학교 | 서울 관악구 | 16 |
| CASE-10 | prog-010 | 2 | 기업가정신 | EY한영 | 기타 프로그램 | — | — | 48 |
| CASE-11 | prog-011 | 5 | 기업가정신 | 페덱스 | 국제무역창업대회 | — | — | 84 |
| CASE-12 | prog-012 | 5 | 기업가정신 | 페덱스 | 국제무역창업대회 | — | 서울 마포구 | 20 |
| CASE-13 | prog-013 | 8 | 기업가정신 | 한국경제인협회 | 기발한CEO교실 | 서울탑산초등학교 | 서울 강서구 | 55 |
| CASE-14 | prog-014 | 9 | 기업가정신 | 한국경제인협회 | 기발한CEO교실 | 서울미래초등학교 | 서울 구로구 | 70 |
| CASE-15 | prog-015 | 1 | 디지털리터러시 | 구글 | Gemini Academy 교원연수(1월) | — | — | 85 |
| CASE-16 | prog-016 | 2 | 디지털리터러시 | 구글 포 에듀케이션 | 제미나이 아카데미 | — | — | 397 |
| CASE-17 | prog-017 | 3 | 기업가정신 | HSBC은행 | (184명)오리엔테이션 | — | — | 184 |
| CASE-18 | prog-018 | 4 | 기업가정신 | HSBC | 국내대회 본선 | — | — | 16 |
| CASE-19 | prog-019 | 6 | 경제금융 | 현대캐피탈 | 1사1교 경제금융교육 | 월계초등학교 | 울산 남구 | 13 |
| CASE-20 | prog-020 | 6 | 경제금융 | 현대캐피탈 | 1사1교 경제금융교육 | 인천아라중학교 | 인천 서구 | 17 |
| CASE-21 | prog-021 | 6 | 경제금융 | 현대캐피탈 | 1사1교 경제금융교육 | 동춘천초등학교 | 강원 춘천시 | 20 |
| CASE-22 | prog-022 | 6 | 경제금융 | 현대캐피탈 | 1사1교 경제금융교육 | 동구로초등학교 | 서울 구로구 | 22 |
| CASE-23 | prog-023 | 6 | 경제금융 | 현대캐피탈 | 1사1교 경제금융교육 | 세일고등학교 | 인천 부평구 | 11 |
| CASE-24 | prog-024 | 6 | 경제금융 | 현대캐피탈 | 1사1교 경제금융교육 | 숭미초등학교 | 서울 도봉구 | 21 |
| CASE-25 | prog-025 | 6 | 진로취업 | 한화투자증권 | 특성화고 취업 멘토링 | 경일관광경영고등학교 | 경기 안산시 | 21 |
| CASE-26 | prog-026 | 11 | 진로취업 | 한화투자증권 | 특성화고 금융투자 특강 | 경기경영고등학교 | 경기 부천시 | 7 |
| CASE-27 | prog-027 | 7 | 경제금융 | 제이에이코리아 | 1사1교 경제금융교육 | 인천봉수초등학교 | 인천 서구 | 30 |
| CASE-28 | prog-028 | 7 | 경제금융 | 교보생명 | 1사1교 경제금융교육 | 안양동초등학교 | 경기 안양시 | 54 |
| CASE-29 | prog-029 | 7 | 경제금융 | KB금융공익재단 | 1사1교 경제금융교육 | 서울미래초등학교 | 서울 구로구 | 70 |
| CASE-30 | prog-030 | 12 | 진로취업 | 델타항공 | Job shadow | — | 인천 동구 | 13 |

나머지 컬럼(교재, IPS, 학급수, 남/여, 봉사, 교사, 강사, 담당자)은 `education-records-seed.db-rows.json` 을 그대로 insert 하면 됩니다.

---

## 5. CASE-01 샘플 (insert 1건 형태)

```json
{
  "id": 90001,
  "programId": 1,
  "performanceStatus": "CONFIRMED",
  "educationMonth": "2026-12",
  "businessArea": "기업가정신",
  "sponsorNamesEn": "JA Korea",
  "programNameEn": "1 Company 1 School",
  "sponsorNamesKo": "JA Korea 고유목적사업",
  "mainProgramNameKo": "2026년 JA Korea 초등 경제교육",
  "detailedProgramNameKo": "1사1교 경제금융교육",
  "textbookNameKo": "Personal Finance",
  "textbookNameEn": "Personal Finance",
  "schoolOrOrganizationName": "발곡고등학교",
  "sigungu": "경기 의정부시",
  "targetType": "고",
  "ipOwned": "JA",
  "courseDeliveredBy": "JA",
  "partnerInvolvement": "No",
  "organizationType": "학교 안",
  "ipsType": "Inspire",
  "programChannelFormat": "다운받을 자료 (Downloadable material)",
  "educationType": "오프라인",
  "educationHours": "3",
  "classCount": 1,
  "maleCount": 15,
  "femaleCount": 12,
  "totalParticipantCount": 27,
  "generalVolunteerCount": 0,
  "employeeVolunteerCount": 6,
  "reparticipationVolunteerCount": 2,
  "generalTeacherCount": 1,
  "trainedTeacherCount": 0,
  "instructorCount": 0,
  "managerName": "OO팀 이순신 책임",
  "createdAt": "2026-12-01T00:00:00Z",
  "updatedAt": "2026-12-01T00:00:00Z",
  "confirmedAt": "2026-12-01T00:00:00Z",
  "revisionNo": 1,
  "latestRevisionYn": true
}
```

`GET /api/admin/performance-records` 의 이 건은 아래처럼 나와야 합니다.

```json
{
  "id": "90001",
  "programId": "1",
  "status": "CONFIRMED",
  "educationMonth": "2026-12",
  "businessArea": "기업가정신",
  "sponsorNameEn": "JA Korea",
  "titleEn": "1 Company 1 School",
  "sponsorNameKo": "JA Korea 고유목적사업",
  "mainTitle": "2026년 JA Korea 초등 경제교육",
  "title": "1사1교 경제금융교육",
  "textbookName": "Personal Finance",
  "textbookNameEn": "Personal Finance",
  "schoolOrOrganizationName": "발곡고등학교",
  "district": "경기 의정부시",
  "targetLevel": "고",
  "ipOwned": "JA",
  "courseDeliveredBy": "JA",
  "partnerInvolvement": "No",
  "institutionType": "학교 안",
  "ips": "Inspire",
  "programChannel": "다운받을 자료 (Downloadable material)",
  "educationType": "오프라인",
  "educationHours": "3",
  "classCount": 1,
  "maleParticipants": 15,
  "femaleParticipants": 12,
  "totalParticipants": 27,
  "generalVolunteers": 0,
  "staffVolunteers": 6,
  "returningVolunteers": 2,
  "generalTeachers": 1,
  "educatedTeachers": 0,
  "instructors": 0,
  "managerName": "OO팀 이순신 책임",
  "revisionNo": 1,
  "latestRevision": true
}
```

---

## 6. 검증 부탁

1. 관리자 JWT로 `GET /api/admin/performance-records?page=0&size=50` → **30건**
2. CASE-01: 12월, 발곡고등학교, 남 15 / 여 12 / 합 27
3. `educationMonth` 연도 2026
4. `GET /api/admin/performance/summary` 를 쓰면 위 30건과 모순 없게

문의 있으면 FE에 회신 주세요. 감사합니다.
