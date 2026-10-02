# Cursor prompt — 일반 프로그램 진행 현황 남은 admin API (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/general-program-progress-remaining-backend-request-2026-10-02.md`

이전 파일명 `general-participating-institution-progress-remaining-backend-request-2026-10-02.md` 를 이 파일로 합쳤다. **참여 기관 + 참여 강사 + 참여자 + 참여 봉사자** 잔여를 한 티켓에서 닫아라.

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-02 |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 갱신 | 2026-10-02 — 참여 봉사자 목록·상세 반영. 신청 unmask·GET hydrate·코멘트 대상은 FE. 남은 서버는 A–O. 클라 엑셀은 요청하지 않음 |
| 우선순위 | **P1** (A 교재 배송 · B ORGANIZATION 목록 채움 · D 초상권 원본 · F 강사 등록 · G 강사 신청 운영정보 PATCH · H 대표→일반 · I INSTRUCTOR 목록 채움 · J INDIVIDUAL 목록 채움 · M 봉사자 등록 · N VOLUNTEER 목록 채움 · O 기관형 봉사 배정) / **P2** (C 합반 담당 교사 PATCH · E roster 만족도조사 · K 참여자 만족도조사 · L 설문/만족도 보기 키) |
| 화면 | CMS 일반 프로그램 상세 → LNB **프로그램 진행 현황** → **참여 기관** 목록·상세, **참여 강사** 목록·상세, **참여자** 목록·상세, **참여 봉사자** 목록·상세 |
| 대상 | 일반 프로그램만. UJAT·1사1교·Gemini·교육받은 교사 전용 path 아님 |

이미 다른 문서로 전달한 것은 **이 파일에서 다시 만들지 마라.**

- 공통정보 동일 일자 일괄 일정 변경: `program-same-date-institution-schedule-change-backend-prompt-2026-09-29.md`
- 교육받은 교사 진행 현황 교재 배송: `trained-teacher-progress-institution-mutations-backend-prompt-2026-09-22.md`
- 기관 신청 화면 잔여: `general-organization-application-decision-notify-timing-backend-request-2026-10-02.md`
- 개인 신청 승인 취소: `general-individual-application-cancel-approval-backend-request-2026-10-02.md`
- 일반 과제 관리: `general-individual-progress-assignment-admin-api-backend-request-2026-10-02.md`
- UJAT 과제 관리: `ujat-education-progress-assignment-admin-api-backend-request-2026-10-02.md`
- 설문 관리 LNB: `general-program-survey-management-remaining-backend-request-2026-10-02.md`
- 1사1교 진행 현황 · 참여 기관 잔여(같은 공유 path, COMPANY_SCHOOL 허용): `company-school-program-progress-institution-remaining-backend-request-2026-10-02.md`
- 1사1교 진행 현황 · 참여 강사 잔여: `company-school-program-progress-instructor-remaining-backend-request-2026-10-02.md`
- 구 갭 누적(일부 시효 지남): `general-organization-institution-remote-gaps-backend-request-2026-09-16.md`

클라 엑셀 다운로드는 FE 로컬이다. **엑셀 export API를 만들지 마라.**

---

## 1. 한 줄 요약

진행 현황에서 FE가 이미 붙인 path는 그대로 두고, **호출할 mutation이 없거나 목록 필드가 비어 화면이 깨지는 것만** 열어라.

남은 서버 일:

1. 참여 기관 **교재 배송 현황** 변경 API 없음.
2. `GET …/participants?participantType=ORGANIZATION` 가 **sessions.scheduleId** 등을 비우면 일정 변경·포기·출석이 빈다.
3. 학생 명단 **초상권 원본 파일** 계약이 없다.
4. roster에 **만족도조사 완료**가 없다. 수료증이 참가인증서로만 떨어진다.
5. 참여 강사 **등록** mutation 없음.
6. 강사 신청 PATCH가 **코멘트만**이다. 강의료·사업소득 저장 path가 없다.
7. 대표 강사 **강등(일반 강사)** path 없음.
8. `GET …/participants?participantType=INSTRUCTOR` 가 `sourceApplicationId` / `memberId` / 연락처를 비우면 코멘트·unmask·배정이 실패한다.
9. `GET …/participants?participantType=INDIVIDUAL` 가 `sourceApplicationId` / `memberId` / `sessions[].scheduleId` / 참여자 `attendanceStatus` 를 비우면 신청 GET·PATCH·unmask·포기·출석 정정·목록 수료 판별이 실패한다. 발급 클릭 때 기존 attendances GET 보강은 FE가 한다.
10. INDIVIDUAL 목록에 **만족도조사 완료**가 없다. 만족도 조사가 켜진 프로그램은 수료여도 참가인증서만 나온다.
11. 참여자 상세 과제 탭 **설문조사 보기 / 만족도조사 보기** 에 쓸 `templateVersionId` + `formResponseId` 가 없다. FE는 키가 오면 기존 `GET …/surveys/{templateVersionId}/responses/{formResponseId}` 로 연다. 키가 없으면 보기 버튼을 만들지 않는다. 새 path를 만들지 말고 키만 채워라.
12. 참여 봉사자 **등록**(일반·임직원) mutation 없음.
13. `GET …/participants?participantType=VOLUNTEER` 가 `sourceApplicationId` / `memberId` / `sessions[].scheduleId` 를 비우면 신청 GET·unmask·코멘트·정산·포기가 실패한다.
14. **기관형** 프로그램 봉사 배정(기관 선택 배정·해제) mutation 없음. 개인형은 기존 education-scope.

---

## 2. FE가 이미 붙인 것 — 시그니처를 깨지 마라

이 티켓에서 아래 계약을 바꾸지 마라. 새 도메인·새 리소스를 만들지 마라.

### 2.1 참여 기관

| 화면 액션 | path | 비고 |
|-----------|------|------|
| 참여 기관 목록 | `GET /api/admin/programs/{programId}/participants?participantType=ORGANIZATION` | FE는 `sessions`, `grade`, `regionSido/Sigungu`, `classCount`, `studentCount`, `teacherName`, `phone/contact/email`, `textbookId/Name`, `materialAssignmentStatus`, `organizationApplicationId` 를 목록·캘린더·상세 초안에 쓴다 |
| 신청 정보 보강 | `GET /api/admin/organization-applications/{id}` | 상세 필드 병합. **application `availableActions` 로 participant 액션을 덮어쓰지 않는다** |
| 정보 수정 | `PATCH /api/admin/organization-applications/{id}` | 기존 Update |
| 개인정보 원문 | `POST /api/admin/organization-applications/{id}/privacy/unmask` | `AdminPrivacyUnmaskRequest`. 기관 신청 상세와 동일 |
| 코멘트 | admin comment by target `ORGANIZATION_APPLICATION` | 기존 |
| 활동 포기 | `POST /api/admin/programs/{programId}/participants/{participantId}/give-up` | `reason` + optional `stopScheduleId` |
| 교육 진행 일정 변경 | `PATCH /api/admin/programs/{programId}/participants/{participantId}/schedules` | `changes[{scheduleId, educationDate}]`, `reason` |
| 합반 저장 | `POST/DELETE /api/admin/programs/{programId}/organization-merge-groups` | `leadTeacherMemberId`. recreate |
| 학생 명단 | roster GET/PUT | FE는 `portraitConsentStatus === CONSENTED` + `portraitConsentUpdatedAt` 으로 「초상권 동의 확인」 버튼을 연다 |
| 학생 초상권 상태 | `GET/PUT …/student-roster/{rosterId}/portrait-consent` | 상태 SSOT. **파일 바이너리는 이 path에 없다** |
| 수료증/참여인증서 | `POST /api/admin/certificates/issues/serial` + `POST …/issues/{issueId}/download-logs` | 클라 PDF. **이 티켓에서 새 발급 path를 만들지 마라** |
| 강사 배정 | instructor-assignments list/create/cancel/representative | 기존 |
| 출석 | schedules + attendances | 기존 |
| 게시글 | posts | 기존 |

### 2.2 참여 강사

| 화면 액션 | path | 비고 |
|-----------|------|------|
| 참여 강사 목록 | `GET …/participants?participantType=INSTRUCTOR` + instructor-assignments 조인 | `sourceApplicationId` → `instructorApplicationId`, `memberId` |
| 신청 정보 보강 | `GET /api/admin/instructor-applications/{id}` + form hydrate | |
| 개인정보 원문 | `POST /api/admin/instructor-applications/{id}/privacy/unmask` | 신청 ID 없으면 회원 강사 unmask fallback |
| 코멘트 | `PATCH /api/admin/instructor-applications/{id}` | **지금 body는 `managerComment`만** |
| 활동 포기 | `POST …/participants/{participantId}/give-up` | 기관과 동일 path |
| 활동인증서 | serial + download-logs + 클라 PDF | 새 발급 path 만들지 마라 |
| 선택 배정 | `create` instructor-assignment | `instructorMemberId` + `organizationApplicationId` + `scheduleId`/`requestedScheduleId` |
| 배정 취소 | `cancel` instructor-assignment | |
| 대표 강사 지정 | `putRepresentative` | **강등(일반)은 없음** |
| 강의보고서 목록/보기/일괄 | lecture-reports GET + file download | |
| 정산 목록·지급조서 | settlements `programId` + `instructorMemberId` | 상태 변경 버튼은 현재 화면에 없음 |

### 2.3 참여자 (개인)

목록: `ParticipatingParticipantsSection`. 상세 탭: **신청 정보 / 출석 관리 / 과제 관리**.

| 화면 액션 | path | 비고 |
|-----------|------|------|
| 참여자 목록 | `GET …/participants?participantType=INDIVIDUAL` | `id=participantId`, `individualApplicationId=sourceApplicationId`, `memberId`. `homeAddressSummary` 있으면 자택 주소지로 쓴다. `regionSido/Sigungu` 는 폴백 |
| 신청 정보 보강 | `GET /api/admin/individual-applications/{id}` + form hydrate | |
| 정보 수정 | `PATCH /api/admin/individual-applications/{id}` | 교재·팀 |
| 개인정보 원문 | `POST /api/admin/individual-applications/{id}/privacy/unmask` | 신청 ID 없으면 회원 `INDIVIDUAL` unmask fallback |
| 코멘트 | 같은 PATCH `managerComment` | |
| 활동 포기 | `POST …/participants/{participantId}/give-up` | `reason` + optional `stopScheduleId` |
| 수료증/참여인증서 | serial + download-logs + 클라 PDF | 새 발급 path 만들지 마라. 목록 `attendanceStatus`가 `PRESENT`/`LATE`/`ABSENT`/`EXCUSED`이면 그걸로 종류를 판별. `COMPLETED`는 출석이 아님. 목록 출석이 비면 발급 클릭 때 기존 attendances GET으로 그 참여자만 보강. 만족도는 `satisfactionSurveyCompleted === true`일 때만 수료 |
| 출석 목록 | dashboard program-schedules + `…/schedules/{scheduleId}/attendances` | |
| 출결 정정 | `PUT /api/admin/program-schedules/{scheduleId}/attendances` | `scheduleId` 없으면 FE는 미연동 안내 |
| 결석 증빙 다운로드 | admin file `fileObjectId` | |
| 과제 팀 조회·변경·역할 | submission-team GET/PUT + 팀 생성 | |
| 과제 제출 파일 보기·일괄 다운로드 | `GET …/programs/{programId}/assignment-submissions` + `downloadAdminFile` | LNB 과제 관리와 **같은** 목록. 참여자 1인 행만 조인. **이 티켓에서 assignment-submissions 를 다시 만들지 마라** |
| 설문조사 보기 / 만족도조사 보기 | 기존 `GET …/surveys/{templateVersionId}/responses/{formResponseId}` | 키는 participants 또는 assignment-submissions **additive**. 키가 있을 때만 행·버튼을 연다. 새 view path 금지 |

### 2.4 참여 봉사자

목록: `ParticipatingVolunteersSection`. 상세 탭: **신청 정보 / 봉사 배정 현황 / 정산 현황**.

| 화면 액션 | path | 비고 |
|-----------|------|------|
| 참여 봉사자 목록 | `GET …/participants?participantType=VOLUNTEER` | `id=participantId`, `volunteerApplicationId=sourceApplicationId`, `memberId`. `external1365Id`/`id1365`, `assignedOrganizationNames`, `contact`/`email` |
| 신청 정보 보강 | `GET /api/admin/volunteer-applications/{id}` + form hydrate | |
| 개인정보 원문 | `POST /api/admin/volunteer-applications/{id}/privacy/unmask` | 신청 ID 없으면 회원 unmask fallback |
| 코멘트 | admin comment by target `VOLUNTEER_APPLICATION` | **targetId 는 신청 ID (`sourceApplicationId`). participantId 아님** |
| 활동 포기 | `POST …/participants/{participantId}/give-up` | 기관·강사·참여자와 동일 path |
| 활동확인서 | serial + download-logs + 클라 PDF | 새 발급 path 만들지 마라 |
| 봉사 배정 (개인 프로그램) | education-scope GET/PUT | `scheduleIds`. **이 티켓에서 education-scope 를 다시 만들지 마라** |
| 정산 목록·지급조서 | settlements `programId` + `memberId` | 상태 변경 버튼은 현재 화면에 없음 |

쓰지 마라.

- `GET/PUT /api/admin/programs/{programId}/materials` — 프로그램 교재 배정. 기관별 배송이 아니다.
- `…/trained-teacher/…/textbook-delivery` — 교육받은 교사 전용.
- 1사1교 / UJAT / Gemini path.
- `organization-applications/{id}/give-up` — 활동 포기는 **participantId**.
- 진행 현황에 **승인 취소** 신설. SSOT는 **활동 포기**.
- `volunteer-applications/{id}/give-up` — 활동 포기는 **participantId**.
- 엑셀 export admin API.
- 프로그램 LNB 과제 관리 path를 이 티켓에서 재설계. 그건 `general-individual-progress-assignment-admin-api-backend-request-2026-10-02.md`.
- 설문 관리 LNB path를 이 티켓에서 재설계. 그건 `general-program-survey-management-remaining-backend-request-2026-10-02.md`.

---

## 3. 지금

### 3.1 교재 배송 현황 (참여 기관)

화면: 참여 기관 목록 열 **교재 배송 현황**, 상세 신청 정보 배지.

| FE key | 라벨 |
|--------|------|
| `preparing` | 교재 배송 전 |
| `shipping` | 교재 배송 중 |
| `delivered` | 교재 배송 완료 |
| `not_applicable` | 해당 없음 (교재 미사용) |

목록 GET `materialAssignmentStatus` 매핑: `PREPARING`/`BEFORE_SHIPPING` → 배송 전, `SHIPPING`/`IN_TRANSIT` → 배송 중, `DELIVERED`/`DELIVERY_COMPLETED` → 배송 완료, 그 외 → 해당 없음.

드롭다운 변경 시 FE는 **호출하지 않는다.** `program-api-unavailable` 만 띄운다.

없는 것: `PATCH …` 기관별 교재 배송 현황.

### 3.2 ORGANIZATION participant 목록 채움

서버가 비우면 화면이 비어 보인다. 특히 `sessions[].scheduleId` — 캘린더, 상세 일정, give-up `stopScheduleId`, 일정 변경 `ChangeItem.scheduleId`.

`scheduleId` 가 null 이면 FE는 일정 변경을 보내지 않는다. give-up 은 `stopScheduleId` 없이라도 보낸다.

### 3.3 학생 명단 · 초상권 동의 확인

이미 있는 것: roster `portraitConsentStatus` / `portraitConsentSourceArtifactId` / `portraitConsentUpdatedAt`, `GET/PUT …/portrait-consent`.

없는 것: 제출 원본 파일 계약. `sourceArtifactId` = admin `fileObjectId` 인지 OpenAPI에 없다.

FE는 `CONSENTED` + timestamp 이면 버튼을 연다. 원본이 없으면 클라 PDF. `CONSENTED` 인데 artifact id 가 비면 서버 버그다.

### 3.4 학생 명단 · 수료 판별(만족도조사)

수료: 전 회차 결석 없음 + 마지막 회차 참여 + **만족도 조사가 있으면 제출 완료**. 그 외 참가인증서.

roster에 `satisfactionSurveyCompleted` 없음. 만족도 조사가 켜진 프로그램은 수료여도 참가인증서만 나온다.

### 3.5 참여 강사 등록

목록 **강사 등록** → 회원 선택 → 동의 확인. 확인 후 FE는 **호출하지 않는다.** `program-api-unavailable`.

`GET …/participants` 는 조회만 있다. 강사 회원을 이 프로그램 진행 참여자로 넣는 mutation 이 없다.

### 3.6 참여 강사 신청 정보 저장

상세 **정보 수정** 저장은 미연동. OpenAPI `PATCH …/instructor-applications/{id}` summary 가 「관리자 코멘트 수정」이고 body `Update` 는 `managerComment` 만이다.

화면 편집 필드: 강의료 기준·금액, 강의료 등급, 사업소득자 여부. 이걸 넣을 path가 없다.

### 3.7 대표 강사 → 일반 강사

`putRepresentative` 로 대표 지정만 된다. 대표를 일반으로 내리는 path 가 없다. FE는 미연동 안내.

### 3.8 INSTRUCTOR participant 목록 채움

FE가 버리는 필드가 없다. 서버가 비우면:

- `sourceApplicationId` 없음 → 코멘트 PATCH · 신청 GET · **신청 unmask** 실패
- `memberId` 없음 → 배정 create · 정산 조회 · 회원 unmask fallback 실패
- `sessions[].scheduleId` 없음 → 활동 포기 회차
- contact / email / homeAddress / jaEvaluationGrade / lectureExperienceYears / settlementStatus 없음 → 목록 열이 빔

### 3.9 INDIVIDUAL participant 목록 채움

FE가 버리는 필드가 없다. 서버가 비우면:

- `sourceApplicationId` 없음 → 신청 GET · PATCH · **신청 unmask** · 코멘트 실패
- `memberId` 없음 → 회원 unmask fallback 실패
- `sessions[].scheduleId` 없음 → 활동 포기 `stopScheduleId` · 출석 정정
- `memberName` / `grade` / `organizationName` / `homeAddressSummary`(또는 `regionSido`+`regionSigungu`) 없음 → 목록 열이 빔
- `sessions[].attendanceStatus` 가 일정 진행값(`COMPLETED`)만 있고 **참여자 1인 출석**(`PRESENT`/`LATE`/`ABSENT`/`EXCUSED`)이 아니면 목록만으로는 수료 출석을 못 채운다. FE는 `COMPLETED`를 출석으로 **매핑하지 않는다**. 발급 클릭 때는 기존 attendances GET으로 보강한다. 그래도 목록에 참여자 출석을 채워라. 발급마다 회차별 attendances 를 왕복하지 않게 하라

### 3.10 참여자 목록 · 수료 판별(만족도조사)

수료 규칙은 기관 학생 명단(E)과 같다. 전 회차 결석 없음 + 마지막 회차 참여 + **만족도 조사가 있으면 제출 완료**.

`ParticipantListItemResponse` 에 `satisfactionSurveyCompleted` 가 없다. FE는 값이 `true`일 때만 수료로 본다. 없으면 `false`. 만족도 조사가 켜진 프로그램은 출석을 채워도 참가인증서만 나온다.

### 3.11 참여자 상세 과제 탭 · 설문/만족도 보기

과제 **파일**은 기존 `assignment-submissions` 로 붙였다. 설문/만족도 **보기**는 키가 있을 때만 연다.

- assignment-submissions 행은 파일/`submissionStatus` 만 있다. `templateVersionId` / `formResponseId` / view URL 이 없다.
- 참여자 과제 탭은 교육 회차 행만 그린다. 설문 행을 서버 없이 만들지 않는다.
- FE는 `surveyResponse` / `satisfactionResponse` (`templateVersionId` + `formResponseId`) 가 오면 보기 행을 붙이고 기존 `GET …/surveys/{templateVersionId}/responses/{formResponseId}` 를 연다. 키를 훑으려고 surveys/responses 목록을 N+1 하지 않는다.
- 설문 관리 LNB 의 responses GET 은 이미 있다. 이 티켓에서 새 view path 를 만들지 마라.

### 3.12 참여 봉사자 등록

목록 **봉사자 등록** · **임직원 자원봉사자 등록**. 확인 후 FE는 **호출하지 않는다.** `program-api-unavailable`.

`GET …/participants` 는 조회만 있다. 봉사자(또는 임직원 자원봉사자) 회원을 이 프로그램 진행 참여자로 넣는 mutation 이 없다.

### 3.13 VOLUNTEER participant 목록 채움

FE가 버리는 필드가 없다. `sourceApplicationId` 는 `volunteerApplicationId` 로 쓴다. 서버가 비우면:

- `sourceApplicationId` 없음 → 신청 GET · **신청 unmask** · 코멘트 실패
- `memberId` 없음 → 정산 조회 · 회원 unmask fallback 실패
- `sessions[].scheduleId` 없음 → 활동 포기 `stopScheduleId` · 개인형 education-scope 조인
- `memberName` / `organizationName` / `contact` / `email` / `external1365Id` / `assignedOrganizationNames` 없음 → 목록 열이 빔
- `giveUpAt` / `participantStatus` 없음 → 활동 포기 행

### 3.14 기관형 프로그램 · 봉사 배정

개인 프로그램(`generalProgramAudience=individual`) 은 기존 `GET/PUT …/participants/{participantId}/education-scope` (`scheduleIds`).

기관 프로그램 상세 탭 **봉사 배정 현황** 은 기관(학교) 단위 선택 배정·해제다. FE는 **로컬만** 바꾼다. 호출할 mutation 이 없다.

education-scope 로 기관 배정을 흉내 내지 마라. 화면은 기관이지 회차가 아니다.

---

## 4. 만들어라

### A. 교재 배송 현황 변경 — P1

기관(또는 ORGANIZATION participant) 단위 배송 상태를 바꾸고, 다음 목록 GET 에 그대로 나오게 하라.

권장(기존 일반 path 아래, TT path 복제 금지):

```http
PATCH /api/admin/programs/{programId}/participants/{participantId}/textbook-delivery
```

또는 organization-application 이 배송 원장이면:

```http
PATCH /api/admin/organization-applications/{applicationId}/textbook-delivery
```

둘 중 **하나만**. 새 도메인을 만들지 마라. OpenAPI + codegen 스키마를 열어라.

요청:

```json
{ "textbookDeliveryStatus": "DELIVERED" }
```

허용 값: `PREPARING` | `SHIPPING` | `DELIVERED` | `NOT_APPLICABLE`.

규칙:

- 교재가 없는데 `PREPARING` / `SHIPPING` / `DELIVERED` 이면 **400**.
- 교재 미사용은 `NOT_APPLICABLE` 또는 필드 생략. `PREPARING` 으로 꾸미지 마라.
- 성공 후 ORGANIZATION participants GET 의 해당 행이 같은 값이어야 한다.
- 조회 필드명은 다음 중 **하나**로 고정하라.
  - 기존 `materialAssignmentStatus` 를 배송 enum 으로 **실제로** 채운다, 또는
  - `textbookDeliveryStatus` 를 추가하고 의미를 분리한다.
- `textbookName` 에 배송 문장을 넣지 마라.
- `PUT …/materials` 로 기관 배송을 흉내 내지 마라.

실패: 400 / 404 / 409 / `PROGRAM_WRITE`.

상품이 배송 상태를 안 쓰면 회신에 “일반 기관 진행 현황은 교재명만 제공, 배송 상태 없음”이라고 적어라. FE는 그때 드롭다운을 뺀다. **200 가짜 성공은 하지 마라.**

### B. ORGANIZATION participants 목록 채움 — P1

`GET …/participants?participantType=ORGANIZATION` 각 행에 데이터가 있으면 채워라.

| 필드 | 화면 |
|------|------|
| `organizationApplicationId` (또는 `sourceApplicationId`) | 상세 GET · unmask · 코멘트 · 합반 · 강사 배정 |
| `sessions[]` | 일정 표시 |
| `sessions[].scheduleId` | give-up `stopScheduleId`, `PATCH …/schedules` |
| `sessions[].sessionNo`, `startAt`, `endAt`, `scheduleName` | 회차 라벨 |
| `grade` | 교육 학년 |
| `regionSido`, `regionSigungu` | 지역 |
| `classCount`, `studentCount` | 학급 수 · 총 학생 수 |
| `teacherMemberId`, `teacherName`, `phone`/`contact`, `email` | 담당 교사 (PII 마스킹 유지) |
| `textbookId`, `textbookName` | 교재명 |
| `materialAssignmentStatus` 또는 `textbookDeliveryStatus` | 교재 배송 배지 |
| `availableActions` | `GIVE_UP` 등 |
| `participantStatus`, `giveUpAt` | 활동 포기 행 |

일정 미확정만 빈 `sessions`. 확정된 교육일이 있는데 `scheduleId` 를 빼지 마라. FE가 기관마다 상세를 N+1 하지 않는다.

### C. 합반 담당 교사만 바꾸는 PATCH — P2

FE는 지금 merge-groups 를 create + `leadTeacherMemberId` 로 다시 만든다.

EFFECTIVE 합반을 취소하지 않고 담당 교사만 바꿔야 하면 기존 merge-groups 에 PATCH 를 열어라. 새 리소스 금지. A·B·D·F·G·I·J·M·N·O 가 먼저다.

### D. 초상권 동의 원본 파일 — P1

새 도메인을 만들지 마라. 아래 중 **하나**만 열어라.

1. OpenAPI에 `portraitConsentSourceArtifactId` / `sourceArtifactId` = admin `fileObjectId` 라고 적고, `CONSENTED` 행은 항상 숫자를 채워라. FE는 기존 `POST /api/admin/files/{fileObjectId}/download-requests`(또는 `sensitive-downloads`) 로 받는다.
2. 그게 아니면 기존 portrait-consent GET 에 관리자 다운로드를 붙여라. 목록 GET 의 artifact id 로 받게 하라. roster N+1 금지.

규칙:

- `CONSENTED` 이면 artifact/file id 필수.
- `NOT_RECORDED` / `REFUSED` / `WITHDRAWN` 은 파일 없음이 정상.
- `PUT …/portrait-consent` 시그니처를 이 티켓에서 바꾸지 마라.

### E. roster 만족도조사 완료 — P2

`GET` 학생 명단 각 행에 채워라.

```json
{ "satisfactionSurveyCompleted": true }
```

프로그램에 만족도 조사가 없으면 생략 또는 `false`. 있으면 실제 제출과 같아야 한다. PUT 으로 쓰지 마라. 조회 전용.

### F. 참여 강사 등록 — P1

이미 있는 강사 회원을 이 프로그램 **INSTRUCTOR participant** 로 넣는 admin mutation 을 열어라.

권장(기존 participants 아래, 새 도메인 금지):

```http
POST /api/admin/programs/{programId}/participants
```

요청 예:

```json
{ "participantType": "INSTRUCTOR", "memberId": 190022 }
```

규칙:

- 이미 같은 프로그램 INSTRUCTOR 이면 **409** + 현재 participantId.
- 강사 회원이 아니면 **400**.
- 성공 후 `GET …/participants?participantType=INSTRUCTOR` 에 그 행이 있어야 한다.
- `memberId`, `sourceApplicationId`(신청이 있으면), `participantId` 를 돌려라.
- 승인 플로우(`POST …/instructor-applications/{id}/approve`)를 이 버튼에 재사용하지 마라. 신청 목록 승인과 다르다.
- 동의서 작성은 FE 모달이다. 이 mutation 에 동의서 PDF를 요구하지 마라.

OpenAPI + codegen. 권한 `PROGRAM_WRITE` 또는 `APPLICATION_WRITE`.

### G. 강사 신청 운영정보 PATCH — P1

`PATCH /api/admin/instructor-applications/{id}` 를 코멘트만이 아니라 **진행 현황 신청 정보 편집 필드**까지 받아라. 새 path 금지. 기존 Update 스키마를 확장하라.

지금 화면이 저장하려는 값:

| 화면 | 권장 필드 |
|------|-----------|
| 강의료 기준·금액 | `lectureFeeBasisType`, `lectureFeeMeasure`, `lectureFeeAmount` (또는 기존 fee snapshot 필드명) |
| 강의료 등급 | `instructorFeeGrade` / `instructorFeeGradeLabel` |
| 사업소득자 여부 | `businessIncomeEarnerStatus` |
| 관리자 코멘트 | 기존 `managerComment` **유지** |

규칙:

- 누락 필드는 유지 (partial).
- 코멘트만 보내던 기존 호출을 깨지 마라.
- 성공 후 GET 상세에 같은 값이 나와야 한다.
- 연락처·계좌 원문을 PATCH 로 받지 마라. 그건 unmask GET.

회신에 확정 필드명을 적어라.

### H. 대표 강사 강등 — P1

배정된 기관의 역할을 **일반 강사**로 내리는 mutation 을 열어라.

권장: 기존 representative 리소스에 `scheduleLead: false` 또는 `role: ASSISTANT`. 새 리소스 금지.

규칙:

- 해당 기관(또는 schedule)에 대표가 이 강사일 때만 강등.
- 성공 후 assignments GET 에서 그 행이 일반이다.
- 다른 강사를 자동 대표로 올리지 마라. FE가 다시 `putRepresentative` 한다.
- `putRepresentative` 시그니처를 깨지 마라.

### I. INSTRUCTOR participants 목록 채움 — P1

`GET …/participants?participantType=INSTRUCTOR` 각 행에 데이터가 있으면 채워라.

| 필드 | 화면 |
|------|------|
| `participantId` | give-up path |
| `memberId` | 배정 create, 정산, 회원 unmask fallback |
| `sourceApplicationId` | 신청 GET · PATCH · **신청 unmask** · 코멘트 |
| `memberName` | 강사명 |
| `sessions[]` / `sessions[].scheduleId` | 활동 포기 회차 |
| `contact` / `phone`, `email` | 목록 연락처·이메일 (마스킹 정책 유지) |
| `homeAddress` 또는 `homeAddressSummary` | 자택 주소지 |
| `jaEvaluationGrade` 또는 `jaGrade` | JA 평가 등급 |
| `lectureExperienceYears` | JA 강의 경력 |
| `settlementStatus` | 목록 정산 현황 표시 |
| `giveUpAt` / `participantStatus` | 활동 포기 |

FE가 강사마다 신청 상세를 N+1 해서 목록을 채우지 않는다.

### J. INDIVIDUAL participants 목록 채움 — P1

`GET …/participants?participantType=INDIVIDUAL` 각 행에 데이터가 있으면 채워라.

| 필드 | 화면 |
|------|------|
| `participantId` | 목록 rowKey · give-up · 출석 · 과제 조인 |
| `sourceApplicationId` | 신청 GET · PATCH · **신청 unmask** · 코멘트 |
| `memberId` | 회원 unmask fallback |
| `memberName` | 참여자명 |
| `organizationId` / `organizationName` | 소속 |
| `grade` | 교육 학년 |
| `homeAddressSummary` (또는 `regionSido`+`regionSigungu`) | 자택 주소지 |
| `contact` / `phone`, `email` | 상세 초안 연락처 (마스킹 정책 유지) |
| `sessions[]` / `sessions[].scheduleId` | 캘린더 · 포기 회차 · 출석 정정 |
| `sessions[].sessionNo`, `startAt`, `endAt`, `scheduleName` | 회차 라벨 |
| `joinedAt` | 수료증 발급 기한(신청일+3년) |
| `giveUpAt` / `participantStatus` | 활동 포기 |
| `availableActions` | `GIVE_UP` 등 |

일정 미확정만 빈 `sessions`. 확정된 교육일이 있는데 `scheduleId` 를 빼지 마라. FE가 참여자마다 신청 상세를 N+1 해서 목록을 채우지 않는다.

수료 판별용 출석: `sessions[].attendanceStatus` 를 **그 참여자 출석**으로 채워라. 허용 값: `PRESENT` | `LATE` | `ABSENT` | `EXCUSED`. 일정 진행 `COMPLETED` 와 같은 칸에 넣지 마라. 진행 여부는 `assignmentStatus` 또는 별도 필드를 써라.

FE는 이미 다음을 한다.

- 목록 값이 `PRESENT`/`LATE`/`ABSENT`/`EXCUSED`이면 수료/참가인증서에 바로 쓴다. `EXCUSED`는 수료 규칙상 결석이 아니다.
- 목록 출석이 비면 발급 클릭 때 `GET …/program-execution/programs/{programId}/schedules/{scheduleId}/attendances` 로 보강한다.
- 목록을 채우려고 참여자마다 신청 상세·attendances 를 N+1 하지 않는다.

서버가 할 일: 확정 일정의 `scheduleId` + 참여자 출석 enum 을 **목록에** 넣는 것. 새 출석 path 를 만들지 마라.

### K. INDIVIDUAL 만족도조사 완료 — P2

`GET …/participants?participantType=INDIVIDUAL` 각 행에 채워라. roster E 와 같은 의미.

```json
{ "satisfactionSurveyCompleted": true }
```

규칙:

- 프로그램에 만족도 조사가 없으면 생략 또는 `false`.
- 있으면 실제 제출과 같아야 한다.
- PUT 으로 쓰지 마라. 조회 전용.
- OpenAPI `ParticipantListItemResponse` 에 필드를 열어라. FE는 `true`일 때만 수료로 본다.

### L. 참여자 상세 과제 탭 · 설문/만족도 보기 키 — P2

새 path 금지. 기존 surveys/responses GET 을 열 수 있게 **키만** 채워라.

권장(기존 응답 중 **하나만**):

1. INDIVIDUAL participants GET 행에:

```json
{
  "surveyResponse": { "templateVersionId": 12, "formResponseId": 3401 },
  "satisfactionResponse": { "templateVersionId": 15, "formResponseId": 3402 }
}
```

2. 또는 기존 `GET …/programs/{programId}/assignment-submissions` 참여자 행에 같은 키를 **additive** 로 넣어라. 파일/`submissionStatus` 시그니처는 유지.

규칙:

- 미제출이면 객체를 생략하거나 id 를 비워라. 가짜 URL 을 만들지 마라.
- FE는 이미 `GET /api/admin/programs/{programId}/surveys/{templateVersionId}/responses/{formResponseId}` 를 쓴다. 키가 없으면 보기 행을 만들지 않는다.
- 설문 관리 문서의 surveys/form-bindings/responses 시그니처를 이 티켓에서 바꾸지 마라.
- assignment-submissions 를 설문 원장으로 바꾸지 마라. 키만 얹거나 participants 에 넣어라.

### M. 참여 봉사자 등록 — P1

이미 있는 봉사자(또는 임직원 자원봉사자) 회원을 이 프로그램 **VOLUNTEER participant** 로 넣는 admin mutation 을 열어라.

권장(기존 participants 아래, 새 도메인 금지. F 강사 등록과 같은 path):

```http
POST /api/admin/programs/{programId}/participants
```

요청 예:

```json
{ "participantType": "VOLUNTEER", "memberId": 190033, "volunteerKind": "GENERAL" }
```

`volunteerKind`: `GENERAL` | `EMPLOYEE`. 목록 버튼이 두 개다. 필드명이 다르면 회신에 적어라.

규칙:

- 이미 같은 프로그램 VOLUNTEER 이면 **409** + 현재 participantId.
- 봉사/임직원 회원이 아니면 **400**.
- 성공 후 `GET …/participants?participantType=VOLUNTEER` 에 그 행이 있어야 한다.
- `memberId`, `sourceApplicationId`(신청이 있으면), `participantId` 를 돌려라.
- 승인 플로우(`POST …/volunteer-applications/{id}/approve`)를 이 버튼에 재사용하지 마라. 신청 목록 승인과 다르다.
- 동의서 작성은 FE 모달이다. 이 mutation 에 동의서 PDF를 요구하지 마라.

OpenAPI + codegen. 권한 `PROGRAM_WRITE` 또는 `APPLICATION_WRITE`. F 와 path 를 공유해도 된다. body 로 type 을 갈라라.

### N. VOLUNTEER participants 목록 채움 — P1

`GET …/participants?participantType=VOLUNTEER` 각 행에 데이터가 있으면 채워라.

| 필드 | 화면 |
|------|------|
| `participantId` | 목록 rowKey · give-up · education-scope |
| `sourceApplicationId` | 신청 GET · **신청 unmask** · 코멘트 |
| `memberId` | 정산, 회원 unmask fallback |
| `memberName` | 봉사자명 |
| `organizationId` / `organizationName` | 소속 |
| `sessions[]` / `sessions[].scheduleId` | 활동 포기 회차 · 개인형 배정 |
| `sessions[].sessionNo`, `startAt`, `endAt`, `scheduleName` | 회차 라벨 |
| `contact` / `phone`, `email` | 목록 연락처·이메일 (마스킹 정책 유지) |
| `external1365Id` (또는 `id1365`) | 1365 ID |
| `assignedOrganizationNames` | 배정 기관 열 |
| `giveUpAt` / `participantStatus` | 활동 포기 |
| `availableActions` | `GIVE_UP` 등 |

일정 미확정만 빈 `sessions`. 확정된 교육일이 있는데 `scheduleId` 를 빼지 마라. FE가 봉사자마다 신청 상세를 N+1 해서 목록을 채우지 않는다.

### O. 기관형 봉사 배정 — P1

기관 프로그램에서 봉사자를 **기관(organization / organizationApplication)** 에 붙이거나 떼는 mutation 을 열어라. 새 도메인 금지. 기존 participants 아래.

권장:

```http
PUT /api/admin/programs/{programId}/participants/{participantId}/assigned-organizations
```

요청 예:

```json
{
  "organizationApplicationIds": [8801, 8802],
  "expectedRevision": 0,
  "reason": "봉사 배정"
}
```

또는 organizationApplication 이 아니라 organizationId 가 원장이면 회신에 필드명을 적어라.

규칙:

- 개인 프로그램 education-scope (`scheduleIds`) 를 이 화면의 기관 배정에 쓰지 마라.
- 성공 후 VOLUNTEER participants GET 의 `assignedOrganizationNames`(또는 배정 기관 목록)가 같아야 한다.
- 이미 배정된 기관을 다시 넣으면 **409** 또는 idempotent 유지. 회신에 적어라.
- 배정 해제는 같은 PUT 에서 빠진 id, 또는 DELETE. 하나만.
- UJAT partner-assignments 를 재사용하지 마라.
- instructor-assignments 를 봉사 배정에 쓰지 마라.

---

## 5. 하지 마라

- 일반/UJAT/1사1교/Gemini/TT path 를 섞지 마라.
- 일정 변경을 공통정보 일괄 API 로 대체하지 마라.
- give-up 을 application path 로 옮기지 마라.
- 진행 현황에 승인 취소를 신설하지 마라.
- 목록 enrich 를 위해 FE N+1 을 만들지 마라.
- application `availableActions` (`CANCEL_APPROVAL` 등)으로 participant `GIVE_UP` 을 지우지 마라.
- 초상권용 새 consent 도메인을 만들지 마라.
- 수료증/활동인증서를 `POST /api/admin/certificates/issues` 원본 PDF 보관으로 바꾸지 마라. SSOT는 serial + 클라 PDF.
- 엑셀 export API를 만들지 마라.
- 강사·봉사자 등록을 신청 **승인** API로 흉내 내지 마라.
- 기관형 봉사 배정을 개인형 education-scope 로 흉내 내지 마라.
- assignment-submissions 목록 API 를 이 티켓에서 다시 설계하지 마라.
- 설문 관리 LNB path 를 이 티켓에서 신설하지 마라.
- `sessions[].attendanceStatus` 에 일정 `COMPLETED` 를 넣어 출석처럼 보이게 하지 마라.

---

## 6. 완료 기준

1. OpenAPI에 A의 PATCH(또는 “배송 상태 없음” 회신)가 있다.
2. ORGANIZATION 확정 일정 행에 `sessions[].scheduleId` 가 숫자다.
3. 배송 PATCH 성공 후 같은 프로그램 participants GET 배송 필드가 요청값이다.
4. `CONSENTED` roster 행에 artifact/file id 와 admin file 다운로드 계약이 있다.
5. 만족도 조사가 있는 프로그램 roster 에 `satisfactionSurveyCompleted` 가 실제 제출과 같다.
6. F 등록 성공 후 INSTRUCTOR participants GET 에 그 `memberId` 행이 있다.
7. G PATCH 로 강의료/사업소득을 넣으면 GET 상세에 같다. 코멘트만 PATCH 도 그대로다.
8. H 강등 후 assignments GET 에서 해당 행이 일반이다. `putRepresentative` 는 그대로다.
9. INSTRUCTOR 목록 행에 `memberId` + `sourceApplicationId`(신청 있으면) 가 있다.
10. INDIVIDUAL 확정 일정 행에 `sourceApplicationId`(신청 있으면) + `sessions[].scheduleId` 가 숫자다.
11. 만족도 조사가 있는 프로그램 INDIVIDUAL 행에 `satisfactionSurveyCompleted` 가 실제 제출과 같다.
12. 제출된 설문/만족도가 있으면 participants 또는 assignment-submissions 행에 `templateVersionId` + `formResponseId` 가 있다.
13. 기존 give-up / schedules PATCH / org·instructor·individual·volunteer unmask / org GET·PATCH / individual GET·PATCH / instructor comment PATCH / volunteer comment by application id / merge-groups / portrait-consent PUT / certificate serial / assignment create·cancel·representative / assignment-submissions GET / submission-team / attendances PUT / education-scope GET/PUT 시그니처가 그대로다.
14. M 등록 성공 후 VOLUNTEER participants GET 에 그 `memberId` 행이 있다.
15. VOLUNTEER 목록 행에 `memberId` + `sourceApplicationId`(신청 있으면) 가 있다.
16. 기관형 O 배정 성공 후 같은 봉사자 행의 배정 기관 목록이 요청값이다. 개인형 education-scope 는 그대로다.

회신에는 연 정확한 path·스키마·샘플 요청/응답을 적어라.
