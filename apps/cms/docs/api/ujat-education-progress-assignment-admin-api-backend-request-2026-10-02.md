# Cursor prompt — UJAT 교육 진행 · 과제 관리 admin API (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/ujat-education-progress-assignment-admin-api-backend-request-2026-10-02.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-02 |
| 상태 | BE 반영 · FE 연동 (`ujat/assignment-submissions` 목록) |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P1** |
| 화면 | CMS UJAT 프로그램 상세 → LNB 교육 진행 → 상/하반기 **과제 관리** (`edu_h1_assignments` / `edu_h2_assignments`) |
| 범위 | UJAT `program-execution` only |

일반 개인 진행 현황 과제 관리와 **path·스키마를 공유하지 마라.**  
일반 요청은 별도 문서다.

- [general-individual-progress-assignment-admin-api-backend-request-2026-10-02.md](./general-individual-progress-assignment-admin-api-backend-request-2026-10-02.md)

관련(이 티켓에서 지역 배정·출석 계약을 바꾸지 마라):

- [ujat-education-progress-p2-openapi-half-backend-request-2026-09-17.md](./ujat-education-progress-p2-openapi-half-backend-request-2026-09-17.md) — §D 범위 밖 「과제(homework) 탭 API 신설」
- [ujat-detail-remaining-api-gaps-backend-request-2026-09-17.md](./ujat-detail-remaining-api-gaps-backend-request-2026-09-17.md) — 과제 탭 P1 제외
- 기존 UJAT `partner-assignments` / `direct-assignment` / `organization-schedule-assignments` — **배정** API. 과제 제출이 아니다.

---

## 1. 한 줄 요약

UJAT 과제 관리 탭은 교육일·지역·학급에 배정된 **봉사자**의 **교육 계획서 + 교육일지** 제출 현황이다.

지금 OpenAPI에 homework/과제 제출 목록 API가 없다.  
`partner-assignments` 로 이 화면을 채우지 마라.

---

## 2. 지금

CMS FE:

- 훅: `useUjatEducationProgressAssignments` — `useNotifyProgramApiUnavailableOnce(true, …)` 고정
- 데이터: `getUjatEducationProgressAssignmentSessions` local
- 지역 탭 + 상/하반기 URL (`edu_h1_assignments` / `edu_h2_assignments`)

있는 UJAT `*assignment*` API는 전부 **배정**이다.

```http
GET  /api/admin/program-execution/programs/{programId}/schedules/{scheduleId}/ujat/partner-assignments
POST /api/admin/program-execution/programs/{programId}/ujat/partner-assignments:auto
POST /api/admin/program-execution/programs/{programId}/ujat/education-slots/{educationSlotId}/direct-assignment
GET  /api/admin/programs/{programId}/ujat/organization-schedule-assignments
```

회원 1인:

```http
GET /api/admin/users/{memberId}/applications/{applicationId}/assignment-submissions
```

봉사자 1인 스코프다. 반기·지역·교육일 전체 목록에 쓰지 마라.

---

## 3. 화면이 필요한 것

### 3.1 그룹

교육 진행일마다 한 블록. 지역 탭(`educationRegionCode`) + 반기(`semesterType`)로 가른다.

| UI | 의미 |
|----|------|
| 교육 진행일 라벨 | `isoDate` → `YYYY.MM.DD` |
| `교육 계획서 제출 기간 : …` | 그 날 계획서 기간 |
| `교육일지 제출 기간 : …` | 그 날 일지 기간 |
| 총 N건 | 아래 노출 행 수 |

### 3.2 행 (봉사자)

| UI 열 | 필요 필드 |
|-------|-----------|
| 봉사자명 | `memberName` |
| 배정 기관 | 그 교육일 배정 학교/기관 |
| 배정 학급 | 학급 라벨 |
| 제출 현황 | 계획서+일지 합성 (아래) |
| 교육 계획서 | 「교육 계획서 보기」 — 미제출이면 disabled. `formResponseId` 필요 |
| 교육일지 | 「교육일지 보기」 — 동일 |
| 비고 | 계획서/일지별 기한 미준수 · 수정 제출 · 피드백 전달 |

계획서·일지 각각 (`plan` / `log`):

| 값 | 의미 |
|----|------|
| `NOT_SUBMITTED` | 미제출. 보기 버튼 비활성 |
| `SUBMITTED` | 제출 |
| `DEADLINE_MISSED` | 기한 지나 제출 |
| `REVISED` | 수정 제출 |

행 제출 현황은 FE가 두 상태를 합성한다. 서버가 내려도 되고, `plan`/`log` 만 줘도 된다. 합성 규칙(FE SSOT):

| plan | log | 행 라벨 |
|------|-----|---------|
| 미제출 | 미제출 | 미제출 |
| 미제출 | 그 외 | 교육계획서 미제출 |
| 그 외 | 미제출 | 교육일지 미제출 |
| 기한 미준수 | 기한 미준수 | 기한 미준수 |
| 기한 미준수 | 그 외(제출) | 교육계획서 기한 미준수 |
| 그 외(제출) | 기한 미준수 | 교육일지 기한 미준수 |
| 둘 다 제출/수정 | | 제출 완료 |

비고 예:

- `교육 계획서 기한 미준수 (26.10.20)`
- `교육일지 수정 제출 (26.10.21)`
- `피드백 전달 완료 (26.10.22)`

활동 포기(`isDropout`) 봉사자: **그 교육일에 진행 이력이 있을 때만** 행에 넣는다. 이력이 없으면 숨긴다.

필터:

- `semesterType` = `FIRST_HALF` \| `SECOND_HALF` (allocation-matrix 와 동일)
- `educationRegionCode` (지역 탭)
- `isoDate` (교육 진행일, 선택)
- 봉사자명 · 배정 기관 · 제출 현황은 서버 필터 또는 전량 + FE 필터

---

## 4. 해야 할 일

### 4.1 목록 API (필수)

UJAT execution 아래 **새 path**.  
일반 `GET /api/admin/programs/{programId}/assignment-submissions` 를 재사용하지 마라.

요청 예:

```http
GET /api/admin/program-execution/programs/{programId}/ujat/assignment-submissions?semesterType=FIRST_HALF&educationRegionCode=SEOUL&isoDate=
Authorization: Bearer <관리자>
```

- `semesterType` 필수. 없으면 400. 상·하반기 데이터를 섞지 마라. allocation-matrix 와 같은 enum.
- `educationRegionCode` 필수(또는 지역 탭과 동일 코드). 다른 지역 봉사자를 넣지 마라.
- `isoDate` 생략: 그 반기·지역 교육일 전부
- 권한: 지역 배정/출석 목록과 동일. OpenAPI에 명시하라.

응답 예:

```json
{
  "semesterType": "FIRST_HALF",
  "educationRegionCode": "SEOUL",
  "items": [
    {
      "scheduleId": 701,
      "isoDate": "2026-10-17",
      "planSubmissionPeriodStart": "2026-10-10T00:00:00+09:00",
      "planSubmissionPeriodEnd": "2026-10-16T23:59:59+09:00",
      "logSubmissionPeriodStart": "2026-10-17T00:00:00+09:00",
      "logSubmissionPeriodEnd": "2026-10-24T23:59:59+09:00",
      "volunteers": [
        {
          "participantId": 3001,
          "memberId": 4001,
          "memberName": "김봉사",
          "organizationApplicationId": 5001,
          "institutionName": "○○초등학교",
          "assignedClass": "3학년 2반",
          "educationSlotId": 8001,
          "isDropout": false,
          "hasProgressHistory": true,
          "plan": {
            "status": "SUBMITTED",
            "submittedAt": "2026-10-15T11:00:00+09:00",
            "feedbackDeliveredAt": "2026-10-16T09:00:00+09:00",
            "formResponseId": 91001
          },
          "log": {
            "status": "NOT_SUBMITTED",
            "submittedAt": null,
            "feedbackDeliveredAt": null,
            "formResponseId": null
          }
        }
      ]
    }
  ]
}
```

규칙:

1. `programId` 가 UJAT가 아니면 404 또는 빈 `items`. 일반 개인 과제 행을 넣지 마라.
2. 행은 **그 교육일에 배정된 봉사자**다. 미배정 봉사자를 넣지 마라.
3. `plan` 과 `log` 는 서로 다른 제출이다. 한 `assignmentStatus` 로 합치지 마라.
4. 「보기」는 `formResponseId`(또는 동등한 문서 id)가 있어야 한다. 미제출은 `null`.
5. `partner-assignments` 응답에 homework 필드를 끼워 넣지 마라. 배정 API는 그대로 둔다.
6. `openapi/backend.openapi.json` 에 path + schema 를 올려라.

### 4.2 문서 보기 (목록에 id 만 있어도 1차)

기존 폼 응답/피드백 API가 있으면 `formResponseId` 로 연결하라.  
이 티켓에서 뷰어 POST를 새로 만들지 않아도 된다. 목록에 id가 없으면 보기 버튼이 영구 disabled 다.

### 4.3 쓰지 말 것

- 일반 `GET /api/admin/programs/{programId}/assignment-submissions`
- 회원 `…/users/{memberId}/applications/{applicationId}/assignment-submissions` N+1
- allocation-matrix 셀에 계획서/일지를 숨겨 넣기
- 출석 `attendances` 와 과제 상태 합치기

---

## 5. 하지 말 것

- 일반 개인 과제와 동일 path / 동일 DTO
- `partner-assignments` · `direct-assignment` · `unavailability` · `attendance-manager` 시그니처 변경
- `semesterType` 없이 h1/h2 를 한 덩어리로 주기
- 1사1교·Gemini·일반 기관에 UJAT 과제 path를 열기

---

## 6. Done when

1. UJAT 프로그램에서  
   `GET …/ujat/assignment-submissions?semesterType=FIRST_HALF&educationRegionCode=`  
   가 그 반기·지역 교육일 그룹과 배정 봉사자 `plan`/`log` 를 반환한다.
2. `SECOND_HALF` 호출 결과가 상반기와 섞이지 않는다. allocation-matrix 와 같은 반기 코드다.
3. 다른 지역 봉사자가 없다.
4. 활동 포기자 중 그 날 진행 이력 없는 행이 없다.
5. 일반 개인 `…/programs/{id}/assignment-submissions` 를 호출해도 UJAT 계획서/일지가 나오지 않는다. 반대도 같다.
6. OpenAPI에 새 UJAT path와 response 스키마가 있다.
7. 기존 배정·출석 API는 그대로다.

**Last updated:** 2026-10-02
