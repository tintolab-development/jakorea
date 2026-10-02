# Cursor prompt — 1사1교 진행 현황 · 참여 기관 남은 admin API (JABACK)

아래 지시를 **CMS 백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 고치지 마라. Homepage Admin(`JAHOMEADMINBACK`)도 고치지 마라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/company-school-program-progress-institution-remaining-backend-request-2026-10-02.md`

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-10-02 |
| 대상 | CMS 백엔드 `JABACK` (`localhost:8080`) |
| 우선순위 | **P1** (A 교재 배송 · B ORGANIZATION 목록 채움 · C 초상권 원본 · E 강사 등록 · F 대표→일반 · G COMPANY_SCHOOL 허용) / **P2** (D roster 만족도조사) |
| 화면 | CMS **1사1교** 프로그램 상세 → LNB **프로그램 진행 현황** → **참여 기관** 목록·상세 (신청 정보 / 학생 명단 / 강사 배정 현황 / 출석 관리 / 게시글) |
| 대상 프로그램 | `programType=COMPANY_SCHOOL` 만. 일반·UJAT·Gemini·교육받은 교사 전용 path 아님 |

**전용 path를 만들지 마라.** 1사1교 참여 기관은 이미 공유

`GET /api/admin/programs/{programId}/participants?participantType=ORGANIZATION`  
`PATCH /api/admin/organization-applications/{id}`  
`POST …/participants/{participantId}/give-up`  
instructor-assignments · roster · attendances · posts

를 쓴다. `company-school-participants` 같은 새 리소스를 열지 마라.

교재 배송·목록 채움·초상권·강사 등록·대표 강등 계약은 일반 진행 현황 문서와 **같은 티켓에서 한 번만** 열어라. 이 문서는 1사1교 화면에 다시 적는다. 구현은 아래를 따른다.

- `apps/cms/docs/api/general-program-progress-remaining-backend-request-2026-10-02.md` **§A · §B · §D · §E · §F · §H**

이미 다른 문서로 전달한 것은 **이 파일에서 다시 만들지 마라.**

- 1사1교 기관·강사 **신청** 잔여: `company-school-application-remaining-backend-request-2026-10-02.md`
- 교육받은 교사 교재 배송: `trained-teacher-progress-institution-mutations-backend-prompt-2026-09-22.md` — **복제하지 마라**
- 공통정보 동일 일자 일괄 일정 변경: `program-same-date-institution-schedule-change-backend-prompt-2026-09-29.md`

클라 엑셀 다운로드는 FE 로컬이다. **엑셀 export API를 만들지 마라.**  
합반은 일반 기관만이다. **COMPANY_SCHOOL 에 organization-merge-groups 를 열지 마라.**  
진행 현황에 **승인 취소** 를 신설하지 마라. SSOT는 **활동 포기**.

---

## 1. 한 줄 요약

1사1교 참여 기관의 목록·포기·일정 변경·배정·게시글은 공유 path 로 이미 열려 있다.  
남은 서버 일은 **(A) 교재 배송 현황 변경**, **(B) ORGANIZATION 목록 `sessions.scheduleId` 등 채움**, **(C) 초상권 원본 파일**, **(D) roster 만족도조사 완료**, **(E) 강사 등록 mutation**, **(F) 대표 강사 강등**, **(G) COMPANY_SCHOOL 을 403 하지 말 것** 이다.

---

## 2. FE가 이미 붙인 것 — 시그니처를 깨지 마라

1사1교 진행 현황 LNB **참여 기관** 상세 탭은 일반과 같다. `학생 명단 제출`이 불필요면 학생 명단·출석 탭을 숨긴다. 합반 UI는 숨긴다.

이 티켓에서 아래 계약을 바꾸지 마라. 새 도메인·새 리소스를 만들지 마라.

| 화면 액션 | path | 비고 |
|-----------|------|------|
| 참여 기관 목록 | `GET /api/admin/programs/{programId}/participants?participantType=ORGANIZATION` | FE는 `sessions`, `grade`, `regionSido/Sigungu`, `classCount`, `studentCount`, `teacherName`, `phone/contact/email`, `textbookId/Name`, `materialAssignmentStatus`, `organizationApplicationId` 를 목록·캘린더·상세 초안에 쓴다 |
| 신청 정보 보강 | `GET /api/admin/organization-applications/{id}` | 상세 필드 병합. **application `availableActions` 로 participant 액션을 덮어쓰지 않는다** |
| 정보 수정 | `PATCH /api/admin/organization-applications/{id}` | 기존 Update. 1사1교 applications opt-in 으로도 호출 |
| 개인정보 원문 | `POST /api/admin/organization-applications/{id}/privacy/unmask` | `AdminPrivacyUnmaskRequest` |
| 코멘트 | admin comment by target `ORGANIZATION_APPLICATION` | |
| 활동 포기 | `POST /api/admin/programs/{programId}/participants/{participantId}/give-up` | `reason` + optional `stopScheduleId` |
| 교육 진행 일정 변경 | `PATCH /api/admin/programs/{programId}/participants/{participantId}/schedules` | `changes[{scheduleId, educationDate}]`, `reason`. `scheduleId` 없으면 FE는 보내지 않음 |
| 학생 명단 | roster GET/PUT | FE는 `portraitConsentStatus === CONSENTED` + `portraitConsentUpdatedAt` 으로 「초상권 동의 확인」을 연다 |
| 학생 초상권 상태 | `GET/PUT …/student-roster/{rosterId}/portrait-consent` | 상태 SSOT. **파일 바이너리는 이 path에 없다** |
| 수료증/참여인증서 | `POST /api/admin/certificates/issues/serial` + `POST …/issues/{issueId}/download-logs` | 클라 PDF. **새 발급 path를 만들지 마라** |
| 학생 강의 출석 | participant attendances GET/PUT | |
| 강사 배정 보드 | instructor-assignments list + calendar + 승인된 instructor-applications | 1사1교 opt-in |
| 강사 배정 | `create` instructor-assignment | `instructorMemberId` + `organizationApplicationId` + `scheduleId`/`requestedScheduleId` |
| 배정 취소 | `cancel` instructor-assignment | |
| 대표 강사 지정 | `putRepresentative` | **강등(일반)은 없음** |
| 출석 관리 | schedules + attendances | `sessions[].scheduleId` 필요 |
| 게시글 | posts | 1사1교 programs 읽기 opt-in |

쓰지 마라.

- `GET/PUT /api/admin/programs/{programId}/materials` — 프로그램 교재 배정. 기관별 배송이 아니다.
- `…/trained-teacher/…/textbook-delivery` — 교육받은 교사 전용. 1사1교에 복제하지 마라.
- 1사1교 전용 participants path.
- `organization-applications/{id}/give-up` — 활동 포기는 **participantId**.
- 진행 현황 **승인 취소** 신설.
- 엑셀 export admin API.

---

## 3. 화면이 버리는 값 / 호출하지 않는 것

| 액션 | 지금 |
|------|------|
| 목록·상세 **교재 배송 현황** 드롭다운 | FE는 PATCH를 **호출하지 않는다.** `program-api-unavailable` |
| 일정 변경 | `sessions[].scheduleId` 가 없으면 보내지 않음 |
| 초상권 동의 확인 | 상태만 보고 클라 PDF. 원본 파일 GET 없음 |
| 강사 배정 탭 **강사 등록** | mutation 없어 호출하지 않음 |
| 대표 → 일반 강사 | path 없어 미연동 안내 |
| 필터·엑셀·캘린더 토글 | 화면만 |

---

## A. 교재 배송 현황 변경 — P1

일반 문서 **§A** 와 같은 계약이다. 1사1교용 path를 따로 만들지 마라.

화면: 참여 기관 목록 열 **교재 배송 현황**, 상세 신청 정보 배지.

| FE key | 라벨 |
|--------|------|
| `preparing` | 교재 배송 전 |
| `shipping` | 교재 배송 중 |
| `delivered` | 교재 배송 완료 |
| `not_applicable` | 해당 없음 (교재 미사용) |

목록 GET `materialAssignmentStatus` 매핑: `PREPARING`/`BEFORE_SHIPPING` → 배송 전, `SHIPPING`/`IN_TRANSIT` → 배송 중, `DELIVERED`/`DELIVERY_COMPLETED` → 배송 완료, 그 외 → 해당 없음.

권장:

```http
PATCH /api/admin/programs/{programId}/participants/{participantId}/textbook-delivery
```

또는 organization-application 이 배송 원장이면:

```http
PATCH /api/admin/organization-applications/{applicationId}/textbook-delivery
```

한 쪽을 고르고 OpenAPI에 밝혀라. TT path를 복제하지 마라.

규칙:

1. COMPANY_SCHOOL participant / application 에서 200.
2. 다음 목록 GET `materialAssignmentStatus` 가 바뀐 값이어야 한다.
3. 권한은 현재 participant WRITE 와 같다.

---

## B. ORGANIZATION participant 목록 채움 — P1

일반 문서 **§B** 와 같다. COMPANY_SCHOOL 프로그램의 목록이 아래를 비우면 일정 변경·포기 회차·출석이 빈다.

특히 **`sessions[].scheduleId`**. 캘린더, 상세 일정, give-up `stopScheduleId`, 일정 변경 `ChangeItem.scheduleId`.

`scheduleId` 가 null 이면 FE는 일정 변경을 보내지 않는다. give-up 은 `stopScheduleId` 없이라도 보낸다.

같이 채워라: `organizationApplicationId`, `grade`, `regionSido`/`regionSigungu`, `classCount`, `studentCount`, `teacherName`, 연락처, `textbookId`/`textbookName`, `materialAssignmentStatus`.

---

## C. 학생 명단 · 초상권 원본 — P1

일반 문서 **§D** 와 같다.

이미 있는 것: roster `portraitConsentStatus` / `portraitConsentSourceArtifactId` / `portraitConsentUpdatedAt`, `GET/PUT …/portrait-consent`.

없는 것: 제출 원본 파일 계약. `sourceArtifactId` = admin `fileObjectId` 인지 OpenAPI에 밝혀라. 바이너리 GET(또는 기존 admin file download)을 열어라.

FE는 `CONSENTED` + timestamp 이면 버튼을 연다. 원본이 없으면 클라 PDF. `CONSENTED` 인데 artifact id 가 비면 서버 버그다.

---

## D. roster 만족도조사 완료 — P2

일반 문서 **§E** 와 같다.

수료: 전 회차 결석 없음 + 마지막 회차 참여 + **만족도 조사가 있으면 제출 완료**. 그 외 참가인증서.

roster에 `satisfactionSurveyCompleted` 를 내려라. 없으면 FE는 `false`. 만족도 조사가 켜진 1사1교 프로그램은 수료여도 참가인증서만 나온다.

---

## E. 강사 등록 mutation — P1

일반 문서 **§F** 와 같다. 1사1교 참여 기관 상세 **강사 배정 현황** 에서 미승인 강사를 넣는 UI가 있다. 확인 후 FE는 **호출하지 않는다.**

`GET …/participants` 는 조회만 있다. 강사 회원을 이 프로그램 진행 참여자로 넣는 mutation 을 열어라. 신청 `approve` 로 대체하지 마라. 1사1교 전용 path를 만들지 마라.

---

## F. 대표 강사 → 일반 강사 — P1

일반 문서 **§H** 와 같다.

`putRepresentative` 로 대표 지정만 된다. 대표를 일반으로 내리는 path 가 없다. FE는 미연동 안내.

기존 representative path 를 확장하거나 형제 path 를 열어라. 새 도메인을 만들지 마라. COMPANY_SCHOOL 에서 403 나지 마라.

---

## G. COMPANY_SCHOOL 허용 — P1

위 공유 path는 `programType=GENERAL` 만이 아니라 **`COMPANY_SCHOOL` 에서도 200** 이어야 한다.

다음이 COMPANY_SCHOOL 이면 **403 / 404 / “일반 프로그램만”** 으로 거절하지 마라.

| path |
|------|
| `GET …/participants?participantType=ORGANIZATION` |
| `POST …/participants/{id}/give-up` |
| `PATCH …/participants/{id}/schedules` |
| `GET/PATCH …/organization-applications/{id}` |
| `POST …/organization-applications/{id}/privacy/unmask` |
| roster GET/PUT · portrait-consent |
| instructor-assignments list/create/cancel/representative |
| schedules + attendances |
| posts |

규칙:

1. 담당 프로그램 범위·권한은 지금과 같다. 유형만 막지 마라.
2. `availableActions` 에 `GIVE_UP` 을 빼지 마라. CMS는 이걸로 활동 포기 버튼을 켠다.
3. 합반(`organization-merge-groups`) 은 COMPANY_SCHOOL 에 **열지 마라.**

---

## 4. 요청하지 않는 것

- 진행 현황 승인 취소
- 1사1교 합반
- 목록 소재지/학년 서버 필터 신규 쿼리
- 캘린더 전용 API
- 엑셀 export API
- 강사 신청 PATCH 강의료 (신청 화면 잔여 문서 D)
- 참여 강사 LNB: `company-school-program-progress-instructor-remaining-backend-request-2026-10-02.md`
- 참여자 LNB (이 파일 범위 밖)

---

## 5. 완료 조건

1. COMPANY_SCHOOL 참여 기관 교재 배송 PATCH 가 있고, 다음 목록 GET 에 반영된다.
2. ORGANIZATION 목록 `sessions[].scheduleId` 와 상세에 쓰는 식별자가 채워진다.
3. 초상권 원본 파일 계약이 OpenAPI에 있고, `CONSENTED` 행에서 artifact id 가 비지 않는다.
4. (P2) roster `satisfactionSurveyCompleted` 가 내려간다.
5. 강사 등록 mutation 이 있고 COMPANY_SCHOOL 에서 200.
6. 대표 → 일반 강등 path 가 있고 COMPANY_SCHOOL 에서 200.
7. §2 표 path 전부 COMPANY_SCHOOL 에서 403 나지 않는다.
8. 1사1교 전용 path는 없다. TT 교재 path를 복제하지 않는다.

---

## 6. 검증

COMPANY_SCHOOL 프로그램 하나와 승인된 기관 신청·참여자 몇 건으로:

1. 목록 GET → 200. `organizationApplicationId`, `sessions[].scheduleId` 가 있다.
2. 상세 GET organization-application + PATCH + unmask + 코멘트 → 200.
3. give-up · schedules PATCH → 200. `scheduleId` 없는 건 400이 아니라 FE가 안 보낸다. 서버는 id 있는 건만 바꿔라.
4. 교재 배송 PATCH → 목록 배지가 바뀐다. TT path를 쓰지 않는다.
5. roster GET/PUT · 출석 PUT → 200.
6. 강사 배정 create/cancel/대표 지정 → 200. 강등 path 가 있으면 그것도 200.
7. 같은 프로그램이 COMPANY_SCHOOL 인데 participants GET 이 403 이면 **실패**.
