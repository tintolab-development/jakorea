# BE 전달 프롬프트 — 교육받은 교사 진행 현황·참여 기관 변경이 서버에 남지 않는다

**작성일:** 2026-09-22  
**문서 성격:** 이 파일만 보고 수정·검수. 변명·우회 금지.  
**우선순위:** P0. 화면에서 저장·포기·삭제·교재 상태 변경을 해도 새로고침하면 사라지거나, 저장 자체가 거절된다.  
**대상:** `programType=TRAINED_TEACHER`  
**비범위:** GENERAL / 1사1교 / UJAT / Gemini 의 참여자·신청 PATCH 계약을 바꾸지 말 것. 아래 “이미 있는 API”를 다른 유형에 맞춰 재설계하지 말 것.

FE 목록·공통정보·기관 신청 승인/반려·교육일지 조회·실적 요약은 이미 원격 API를 본다.  
이 문서는 **그 다음 화면에서 서버 반영이 없는 변경**만 다룬다.

시드 프로그램 `186001`–`186008` 은 덮어쓰지 말 것. 검수는 그 밖 교육받은 교사 프로그램으로 한다.

---

## 한줄

1. 승인된 기관 신청의 신청 정보 수정은 `PATCH` 로 저장되고, 같은 프로그램의 기관 신청 GET 과 진행 현황 목록에 그대로 나온다.
2. 활동 포기는 중단일 일정 id 와 함께 서버에 남고, GET 에 포기 상태가 보인다. 교육받은 교사 행 id 는 기관 신청 id 다. 일반 프로그램 `participantId` 로 가정하지 말 것.
3. 진행 현황 “학교 삭제”는 서버에서 목록이 빠지거나, 삭제가 불가하면 그 사실을 에러로 돌려준다. 메모리에서만 지워진 것처럼 200 을 주지 말 것.
4. 교재 **배송 상태**(준비/배송중/완료)를 상품이 요구하면 원장과 변경 API 를 만든다. 원장이 없으면 응답에 상태를 지어내지 말 것. 교재 **이름**과 배송 상태는 다른 필드다.
5. 학생교육 완료 등록·취소 API 는 OpenAPI 에 있다. 새로 만들지 말고, 아래 계약대로 동작하는지만 확인하고 깨져 있으면 고친다.

---

## 이미 붙어 있는 API — 다시 만들지 말 것

| 화면 | 메서드 | 경로 |
|---|---|---|
| 목록·생성·수정·삭제 | GET/POST/PATCH/DELETE | `/api/admin/programs` (`programType=TRAINED_TEACHER`) |
| 공통 정보 | GET/PATCH | `/api/admin/programs/{programId}/trained-teacher/detail` |
| 기관 신청 목록 | GET | `/api/admin/programs/{programId}/trained-teacher/organization-applications` |
| 기관 신청 승인·반려 | POST | `…/organization-applications/{applicationId}/approve` · `…/reject` |
| 진행 현황 참여 기관 | 위 GET 을 `status=APPROVED` 로 재사용 | 별도 participants 목록이 아님 |
| 실적 요약 | GET | `…/trained-teacher/performance-summary` |
| 교육일지 목록 | GET | `…/trained-teacher/education-journals?organizationApplicationId=` |
| 교육일지 단건·일괄 | GET · POST | `…/education-journals/{journalId}/download` · `…/education-journals/bulk-download` |
| 학생교육 완료 목록 | GET | `…/trained-teacher/education-completions` |
| 학생교육 완료 등록·취소 | POST | `…/education-completions` · `…/education-completions/{completionId}/cancel` |
| 담당자 | GET/POST/PATCH/DELETE | `…/managers` |
| 설문·게시글 | 일반 프로그램 surveys/posts | 원격 게이트가 켜져 있을 때. 교육받은 교사 전용 mock 설문은 없다 |

등록 **임시저장**은 브라우저 로컬 초안이다. 최종 등록은 `POST /api/admin/programs` 다. 임시저장용 서버 API 를 새로 만들지 말 것.

설문 대상이 “교사만”으로 안 보이는 문제는 id 접두사 `trained-teachers-prog-` / `trained-teachers-local-` 만 보는 **FE 분기**다. 서버 설문 계약을 바꾸지 말 것.

---

## 1. 참여 기관 신청 정보 저장

### 지금 FE

진행 현황 → 참여 기관 상세 → 신청 정보 편집 → 저장.

저장 함수는 변경이 있어도 `PATCH` 를 호출하지 않는다.  
`notifyProgramApiUnavailable('general-participating-institution-detail-patch', …)` 만 띄우고 `false` 를 반환한다.  
세션 `savedBasicPatches` 에도 신청 정보 필드는 안 들어간다.

신청 목록(승인 전) 쪽 일반 프로그램은 이미 아래를 쓴다.

```http
PATCH /api/admin/organization-applications/{applicationId}
```

바디는 OpenAPI `OrganizationApplicationUpdateRequest` (없는 필드는 유지):

```json
{
  "requestedGrade": "elementary",
  "organizationAddressDetail": "본관 3층",
  "requestedClassCount": 2,
  "requestedStudentCount": 40,
  "requestedEducationFormat": "OFFLINE",
  "teacherMemberId": 1001,
  "teacherPhone": "02-000-0000",
  "teacherEmail": "teacher@school.kr",
  "textbookId": 55
}
```

교육받은 교사 진행 화면은 이 PATCH 를 아직 호출하지 않는다.  
호출하려면 **TRAINED_TEACHER 의 승인된 기관 신청 id** 로 같은 PATCH 가 성공해야 한다.

### 화면이 고치는 값과 현재 PATCH 바디

| 화면 필드 | 현재 PATCH 필드 | 요구 |
|---|---|---|
| 학년 `educationGrade` | `requestedGrade` | 저장 후 GET 에 반영 |
| 학급 수 | `requestedClassCount` | 저장 후 `classCount` 또는 `requestedClassCount` 로 조회 |
| 학생 수 | `requestedStudentCount` | 저장 후 `studentCount` 또는 `requestedStudentCount` 로 조회 |
| 교육 형태 | `requestedEducationFormat` | 허용 값 목록을 고정해서 문서화 |
| 담당 교사 | `teacherMemberId` 만 있음 | 이름 문자열만 바꾸고 member id 가 없으면 400 과 이유를 돌려준다. 조용히 무시하지 말 것 |
| 전화 | `teacherPhone` | 마스킹 전 값이 관리자 조회에 필요하면 기존 PII 정책대로 |
| 이메일 | `teacherEmail` | 동일 |
| 교재 | `textbookId` | 이름만 보내지 않는다. id 가 없으면 400 |
| 휴대전화 `teacherMobile` | **없음** | 화면 값이 상품에 필요하면 필드를 추가. 아니면 400 으로 “미지원”을 명시 |
| 신청 사유 `applicationReason` | **없음** | 동일 |
| 기타 요청 `otherRequests` | **없음**. 목록의 `desiredEducationScheduleMemo` 와 혼동 금지 | 메모를 사유 칸에 넣지 말 것 |
| 컴퓨터·대기실·식사·주차 | **없음** | 교육받은 교사 신청 양식에 없으면 받지 말 것. 있으면 필드 추가 |

`desiredEducationScheduleMemo` 는 희망 일정 메모다. 기타 요청 사항으로 재사용하지 말 것.  
희망 일정 본문은 `preferredScheduleBlocks` 가 SSOT 다. 이 PATCH 가 blocks 를 지우면 실패다.

### 실패

- **실측 2026-09-28:** TRAINED_TEACHER 승인 신청 `1691187` 에
  `PATCH /api/admin/organization-applications/{id}` 를 보내면
  `ORGANIZATION_APPLICATION_EDIT_PROGRAM_TYPE_UNSUPPORTED`
  (`현재 프로그램 유형에서는 기관 신청을 수정할 수 없습니다.`) 로 거절된다.
  FE 는 이미 이 공통 PATCH 를 호출한다. **유형 가드를 열어** TRAINED_TEACHER 도
  GENERAL 과 동일하게 수정되게 할 것. 새 전용 경로를 FE 에 강제하지 말 것.
- TRAINED_TEACHER 신청 id 에 PATCH 가 404 / 403 / “일반 프로그램만 가능”
- 승인된 신청은 수정 불가라며 거절하면서, 거절 코드·메시지 없이 200 과 무변경
- `textbookId` 를 저장했는데 GET `textbookName` 이 비거나 이전 이름
- PATCH 가 `preferredScheduleBlocks` · `educationJournalCount` · `educationCompletionCount` 를 지움
- 없는 필드를 보내면 500. 무시하거나 400 + 필드명을 돌려준다
- `requestedEducationFormat` 은 `ONLINE` | `OFFLINE` | `HYBRID` 만 받는다. 한글(`온라인`)은 400.

### 성공

1. `PATCH /api/admin/organization-applications/{applicationId}` 가 200.
2. `GET /api/admin/programs/{programId}/trained-teacher/organization-applications?status=APPROVED` 의 그 행에 학년·학급·학생·교재명·교사·전화·이메일이 바뀐 값이다.
3. `GET /api/admin/programs/{programId}/trained-teacher/performance-summary` 의 학생 수·학급 수가 합계에 반영된다. 다른 기관 행은 그대로다.

---

## 2. 활동 포기

### 지금 FE

교육받은 교사 참여 기관 상세의 활동 포기는  
`POST /api/admin/programs/{programId}/participants/{participantId}/give-up` 를 **호출하지 않는다.**

로컬 패치만 만든다.

```json
{
  "activityWithdrawn": true,
  "activityWithdrawStopSessionKey": "{round}-{date}-{index}",
  "activityWithdrawStopScheduleLabel": "교육 일정 | 2026. 01. 09(금) 09:20 ~ 11:20 | 1차시"
}
```

이 객체는 React state `savedBasicPatches` 에만 있다. 새로고침하면 사라진다.

일반 프로그램은 다음을 쓴다. `organization-applications/{id}/give-up` 는 **의도적으로 없다.**

```http
POST /api/admin/programs/{programId}/participants/{participantId}/give-up
Content-Type: application/json

{
  "reason": "활동 포기",
  "stopScheduleId": 88001
}
```

`participantId` 가 필수다.  
교육받은 교사 목록 행의 `id` 는 `TrainedTeacherOrganizationApplicationResponse.applicationId` 다. participant id 가 응답에 없다.  
FE 가 applicationId 를 participantId 자리에 넣으면 틀린 리소스를 포기시키거나 404 가 난다.

### BE가 정할 것

둘 중 하나만 고른다. 둘 다 애매하게 두지 말 것.

**A. 기존 participant give-up 재사용**

`GET …/trained-teacher/organization-applications` 각 행에 숫자를 추가한다.

- `participantId` (ORGANIZATION participant)
- 포기 가능한 일정: `schedules[]` 에 `programScheduleId`, 표시용 날짜·시간·차시

활동 포기 요청은 기존 give-up 이다.

```json
{
  "reason": "기관 사정으로 중단",
  "stopScheduleId": 88001
}
```

`stopScheduleId` 는 그 기관에 배정된 `programScheduleId` 여야 한다. FE 표시용 문자열 키 `{round}-{date}-{index}` 를 서버 id 로 쓰지 말 것.

**B. 기관 신청 전용**

새 경로를 OpenAPI 에 넣는다. 일반 participant give-up 과 섞지 말 것.

```http
POST /api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/give-up
```

바디는 A 와 같다. `reason` 필수, `stopScheduleId` 필수.

### 실패

- applicationId 를 participantId 로 해석해 다른 참여자를 포기
- `stopScheduleId` 없이 전체 일정을 조용히 포기
- 다른 프로그램의 schedule id 를 200 으로 수용
- 이미 포기한 기관을 다시 200 으로 성공 처리하고 중단일만 덮어씀. 이미 포기면 409
- GET 에 포기 여부가 없음

### 성공

1. give-up 이 200 또는 204.
2. 같은 기관 GET 에 포기 상태가 있다. 필드명은 하나로 고정한다. 예: `activityWithdrawn: true`, `giveUpAt`, `stopScheduleId`, `stopScheduleLabel`.
3. `progressLabel` 이 포기 상태를 반영한다.
4. 실적 요약의 기관·학생·학급 집계 규칙을 문서화한다. 포기 기관을 뺄지 유지할지 한 가지로 고정하고, GET summary 가 그 규칙을 따른다.
5. 교육일지·학생교육 완료 건수는 지우지 않는다. 이력이다.

---

## 3. 진행 현황 학교 삭제

### 지금 FE

`학교 삭제` 는 `setSchoolList` 로 화면 배열에서만 뺀다.  
DELETE/POST 가 없다. 새로고침하면 `status=APPROVED` 목록이 다시 채워진다.

### BE가 정할 것

상품이 “승인된 기관을 진행 목록에서 제거”라면 API 가 필요하다.  
활동 포기(섹션 2)와 삭제는 다른 동작이다. 포기를 삭제로 대체하지 말 것.

제안:

```http
POST /api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/remove-from-progress
```

또는 상태 전이 `APPROVED → CANCELLED` 를 쓰는 기존 경로가 있으면 그 경로와 에러 코드를 이 문서 답변에 적는다.  
새 이름을 만들기 전에 기존 취소 API 가 TRAINED_TEACHER 승인 건에 적용되는지를 먼저 확인한다.

바디 예:

```json
{ "reason": "오등록" }
```

### 실패

- 200 인데 GET APPROVED 목록에 그대로 있음
- 교육일지·완료 증빙이 있는 기관을 사유 없이 물리 삭제
- 다른 기관 행까지 삭제

### 성공

1. 호출 후 `GET …/organization-applications?status=APPROVED` 에 그 `applicationId` 가 없다.
2. 승인 대기 목록 의미도 유지된다. 진행에서 뺐다고 `PENDING` 으로 되돌리지 말 것. 취소 상태를 따로 둔다.
3. 실적 요약 건수가 그 기관을 제외한 값으로 바뀐다.
4. 증빙이 있어 삭제가 불가하면 409 와 이유를 돌려준다. FE 는 그 메시지를 보여 준다.

삭제가 상품에 없으면 “지원하지 않음”이라고 회신한다. FE 는 버튼을 제거한다. 200 가짜 성공은 하지 말 것.

---

## 4. 교재 배송 현황

### 지금 FE

진행 목록 매핑이 배송 상태를 서버 값으로 읽지 않는다.

```ts
textbookStatus: 'not_applicable'
```

주석: 배송 원장이 없어서 교재명·수량만 표시하고, 배송 전/중/완료를 응답에 만들지 않는다.

상태 드롭다운을 바꾸면 temp-mock 프로그램이 아니면  
`notifyProgramApiUnavailable('general-participating-institution-textbook-delivery-status', …)` 만 뜬다.  
교육받은 교사는 이 경로다. 로컬 목록도 안 바뀐다.

`textbookName` 은 목록 GET 에 이미 있다. 배송 상태와 교재명을 한 필드로 쓰지 말 것.

### 상품이 배송 상태를 요구할 때

기관 신청 GET 행에 예를 추가한다.

```json
{
  "applicationId": 501,
  "textbookId": 55,
  "textbookName": "경제금융 교재",
  "textbookDeliveryStatus": "PREPARING"
}
```

허용 값: `PREPARING` | `SHIPPING` | `DELIVERED` | `NOT_APPLICABLE`.  
교재가 없으면 `NOT_APPLICABLE` 또는 필드 생략. `PREPARING` 으로 꾸미지 말 것.

변경:

```http
PATCH /api/admin/programs/{programId}/trained-teacher/organization-applications/{applicationId}/textbook-delivery
```

```json
{ "textbookDeliveryStatus": "DELIVERED" }
```

교재가 없는데 `DELIVERED` 이면 400.

### 상품이 배송 상태를 요구하지 않을 때

원장과 PATCH 를 만들지 말 것.  
회신에 “교육받은 교사는 교재명만 제공, 배송 상태 없음”이라고 적는다. FE 는 드롭다운을 뺀다.

### 실패

- 배송 상태를 `textbookName` 에 문장으로 넣음
- 교재가 없는 행에 `PREPARING` 을 기본값으로 채움
- PATCH 없이 GET 만 바꿔 둠

---

## 5. 학생교육 완료 등록·취소 — 신규 API 아님, 계약 확인

OpenAPI 와 FE 클라이언트는 있다. 화면은 **목록 GET 건수**만 진행 현황 스트립에 넣는다.  
등록·취소 버튼은 없다. 버튼을 위한 새 리소스를 만들지 말 것.

### 등록

```http
POST /api/admin/programs/{programId}/trained-teacher/education-completions
```

```json
{
  "organizationApplicationId": 501,
  "programScheduleId": 88001
}
```

`EducationCompletionAdminCreateRequest`. 두 필드 모두 1 이상.

### 취소

```http
POST /api/admin/programs/{programId}/trained-teacher/education-completions/{completionId}/cancel
```

```json
{ "reason": "오등록" }
```

`reason` 은 빈 문자열이면 400.

### 목록

```http
GET /api/admin/programs/{programId}/trained-teacher/education-completions
GET /api/admin/programs/{programId}/trained-teacher/education-completions?organizationApplicationId=501
```

`EducationCompletionResponse` 에 `completionId`, `completionStatus`, `cancelledAt`, `organizationApplicationId`, `programScheduleId` 가 있다.

### 확인해서 고칠 것

1. 승인된 TRAINED_TEACHER 기관 신청 + 그 기관 일정 id 로 POST 가 201/200.
2. 다른 프로그램의 `programScheduleId` 는 400 또는 404.
3. 취소 후 목록에서 `cancelledAt` 이 있고, 활성 건수에서 빠진다. 행 자체를 지우지 말 것. FE 활성 건수는 취소되지 않은 행만 센다.
4. `GET …/organization-applications` 의 `educationCompletionCount` 가 활성 건수와 같다.
5. `GET …/performance-summary` 를 완료 건수에 쓰는지, 기관 행의 `educationCompletionCount` 가 SSOT 인지 한 가지로 답한다. 둘의 숫자가 다르면 어느 쪽이 맞는지 적는다.
6. 교육일지 POST 와 완료 POST 는 별개다. 일지를 썼다고 완료 행이 생기거나, 완료를 취소했다고 일지가 지워지면 실패다.

---

## 6. 교육일지 일괄 다운로드 — 신규 API 아님, 계약 확인

FE 원격 경로는 이미 호출한다.

```http
POST /api/admin/programs/{programId}/trained-teacher/education-journals/bulk-download
```

```json
{
  "organizationApplicationId": 501,
  "journalIds": [1, 2, 3]
}
```

성공 시 `downloadEndpoint` 가 있고, 그 경로를 Bearer 로 GET 하면 zip blob 이다.  
`downloadEndpoint` 가 없으면 FE 는 단건 download 를 순서대로 호출한다.

화면의 `(mock)` 문구는 원격이 꺼져 있고 로컬 시드 행이 있을 때만 탄다.  
교육받은 교사 시드는 빈 배열이라 운영 경로가 아니다. mock zip API 를 만들지 말 것.

확인할 것:

- `journalIds` 가 그 `organizationApplicationId` 소속일 것. 다른 기관 id 가 섞이면 400.
- 빈 `journalIds` 와 생략의 의미를 문서화. FE 는 숫자로 파싱된 id 가 없으면 필드를 생략할 수 있다.
- 상대 경로 `downloadEndpoint` 가 인증 없이 열리면 실패다.

---

## 검수 순서

프로그램은 시드 `186001`–`186008` 이 아닌 TRAINED_TEACHER 하나.  
기관 신청이 승인된 상태. 일정 `programScheduleId` 가 하나 이상. 교재 id 가 하나.

1. 신청 정보 PATCH 후 기관 GET 과 실적 요약이 섹션 1 성공과 같다. `preferredScheduleBlocks` 는 PATCH 전과 같다.
2. 활동 포기 후 새로고침해도 포기 상태와 `stopScheduleId` 가 남는다. 다른 기관은 포기되지 않는다. 교육일지 목록 건수는 그대로다.
3. 학교 삭제(또는 취소) 후 APPROVED 목록에서 빠진다. 증빙이 있으면 409.
4. 배송 상태를 도입했으면 PATCH 후 GET `textbookDeliveryStatus` 가 요청값이다. 도입하지 않았으면 회신에 명시하고, 응답에 가짜 `PREPARING` 이 없다.
5. 완료 POST 한 건 → 목록 활성 1, 기관 행 `educationCompletionCount` 1. 취소 후 활성 0, 취소 행은 `cancelledAt` 과 함께 목록에 남는다. 교육일지 건수는 변하지 않는다.
6. 일괄 다운로드가 그 기관 일지만 담은 zip 을 준다.

## 회신에 적을 것

- 섹션 2 를 A(participantId 추가)로 할지 B(기관 신청 give-up)로 할지
- 섹션 3 삭제를 제공할지, 어떤 경로인지, 불가일 때의 409 본문
- 섹션 4 배송 상태를 제공할지
- 섹션 5 에서 summary 와 `educationCompletionCount` 중 집계 SSOT
- 섹션 1 PATCH 가 TRAINED_TEACHER 승인 건에 이미 되는지, 안 되면 막힌 이유

---

## FE 수용 (2026-09-28)

BE 핸드오프: [trained-teacher-progress-institution-mutations-frontend-handoff-2026-09-28.md](./trained-teacher-progress-institution-mutations-frontend-handoff-2026-09-28.md)

- 활동 포기 **B** 경로 연동: `POST …/trained-teacher/organization-applications/{id}/give-up` + `{ stopScheduleId, reason }`
- 학교 삭제(진행 현황 제외): `POST …/remove-from-progress` + `{ reason }` · 409 `TRAINED_TEACHER_PROGRESS_EVIDENCE_EXISTS` 안내
- 신청 정보 수정: 공통 `PATCH /organization-applications/{id}` (TRAINED_TEACHER 허용 — CMS 재기동 후 재검증)
- OpenAPI: give-up / remove-from-progress 경로 + requestBody 스키마 반영, dashboard codegen 재생성
