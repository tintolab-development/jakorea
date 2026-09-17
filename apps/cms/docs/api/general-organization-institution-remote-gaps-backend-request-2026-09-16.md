# 일반 프로그램 기관 · 참여 기관 — remote 보완 · 백엔드 요청 (SSOT)

**작성일:** 2026-09-16  
**최종 갱신:** 2026-09-17  
**OpenAPI 재검토:** 2026-09-16 (v9 · live = local)  
**우선순위:** P1  
**대상:** 일반 프로그램 **기관 신청/참여 상세**(합반·교재·학생 명단·강사 배정) · **봉사자 신청 심사**(1차 서류 · 합격자 · 2차 면접)

**SSOT:** 일반 프로그램(기관·봉사자) FE 수정·미연동 갭은 **본 문서에만** 누적합니다.  
(이전 분리 문서 — 참여 기관 상세 / 학생 명단 / 강사 배정 — 는 본 문서로 통합·폐기)

**시드(별도):** `general-program-remote-db-full-graph-seed-backend-request-2026-09-16.md`

## FE 원칙

- **연동 가능한 API는 remote 호출** — 성공 시 목록 invalidate·재조회.
- **API가 없거나 remote 비활성** → **mock/로컬 patch 금지**. `program-api-unavailable` 모달로 1회 안내.
- 계약 부재 액션도 동일 — 로컬 상태 변경 없음.

---

## 0. 현황 요약 (2026-09-17)

| 영역 | 기능 | 현재 API | FE | 서버 보완 |
|------|------|----------|-----|-----------|
| 기관 신청 | 목록·승인/반려·일괄·승인/반려 취소 | ✅ | ✅ | — |
| 기관 신청 | 알림 재발송 | — | unavailable | **보류** (BE 요청 제외) |
| 기관 신청/참여 | 상세 GET / 필드 PATCH | — | unavailable (합반 제외) | GET/PATCH 필요 |
| 합반 | merge-groups CRUD | ✅ | ✅ | `leadTeacherMemberId` create 누락 |
| 참여 기관 목록 | participants ORGANIZATION enrich | 부분 | adapter 빈값 다수 | 학년·교재·지역·`organizationApplicationId` |
| 참여 기관 | 교재 배송 현황 변경 | — | unavailable | 상태 변경 API |
| 참여 기관 상세 | 코멘트 | ✅ | ✅ `organizationApplicationId` | — |
| 참여 기관 상세 | 개인정보 상세보기 | 회원 unmask | ✅ 담당 교사 | 신청 시점 원문 필요 시 전용 unmask |
| 참여 기관 상세 | 활동 포기 | give-up | ✅ participantId·reason | `stopScheduleId` 보완 |
| 참여 기관 상세 | 교육 진행 일정 변경 | 이력 API만 | unavailable | 일정 변경 API |
| 학생 명단 | GET/PUT roster | ✅ | ✅ | `sourceFileObjectId` optional 등 |
| 학생 명단 | 강의 출석 조회·정정 | ✅ schedules attendances / bulk-upsert | ✅ `participantId` | roster `participantId`·출석 요약 보완 |
| 참여 기관 상세 | **출석 관리** 탭 | ✅ roster + schedule attendances / bulk-upsert | ✅ (progress+applications remote) | `resolvedScheduleId`·roster `participantId` 필수 · 기관 전용 조회 API는 선택 |
| 강사 배정 | list/create/cancel/representative | ✅ | ✅ (progress remote) | waiting 전용 API 없음 |
| **참여 강사 목록** | participants INSTRUCTOR enrich | 부분 | ✅ adapter·assignments 조인 | 주소·PII·정산·경력·등급·배정 기관명·`sourceApplicationId` |
| **참여 강사 목록** | 강사 등록·삭제 | — | ❌ unavailable | participant C/D API |
| **참여 강사 목록** | 정산 현황 변경 | — | ❌ unavailable | settlement status API |
| **참여 강사 목록** | 필터·엑셀 | — | 클라 only | 서버 필터·export (P2) |
| **참여 강사 상세** | 신청 정보 조회·코멘트·PII·활동 포기 | 부분 | ✅ (§G-8) | 강의비 PATCH·이력서 enrich·`stopScheduleId` |
| **참여 강사 상세** | 교육 배정 현황 탭 | list/create/cancel/representative | ✅ (§G-8) | waiting 전용 API · list `instructorMemberId` 필터 · 일반→보조 demote |
| **참여 강사 상세** | **정산 현황** 탭 | settlements list/detail/download | ✅ (§G-9) | `educationGrade` · render-data payload · program+member 복합 필터 |
| **게시글** | list/CRUD/comments/reactions/attachments | ✅ | ✅ | 작성자 displayName · 기관(school) scope |
| **게시글** | reads GET · unread-reminders POST | ✅ (부분) | ✅ | displayName · `memberIds` · school filter |
| **강의보고서 관리** | list + download ZIP | ✅ | ✅ | list `instructorMemberId` query · download 응답 스키마 |
| **참여 봉사자 목록** | participants VOLUNTEER | 부분 | ✅ adapter enrich · mock 제거 | `id1365`·배정기관·PII enrich · 등록 C/D |
| **참여 봉사자 목록** | 활동확인서 발급 | ✅ serial allocate | ✅ 목록 미리보기 모달 | — |
| **참여 봉사자 목록** | 봉사자·임직원 등록 | — | ❌ unavailable | POST participants/volunteers 등 |

---

## A. 기관 신청 · 합반 · 참여 목록

### A-1) FE 연동 현황

| 화면 | 기능 | API | 연동 |
|------|------|-----|------|
| 기관 신청 목록 | 목록 | `GET …/programs/{programId}/organization-applications` | ✅ |
| 기관 신청 목록/상세 | 승인·반려 | `POST …/organization-applications/{id}/approve\|reject` | ✅ |
| 기관 신청 목록 | 일괄 승인·반려 (≥2) | `POST …/organization-applications/bulk-approve\|bulk-reject` | ✅ |
| 기관 신청 상세 | 승인 취소 · 반려 취소 | `POST …/cancel-approval\|cancel-rejection` | ✅ |
| 기관 신청 상세 | 알림 재발송 | — | ⏸ 보류 |
| 기관 신청 상세 | 상세 GET / 필드 PATCH | — | ❌ unavailable (합반 제외) |
| 기관 신청/참여 상세 | 합반 | `GET/POST/DELETE …/organization-merge-groups` | ✅ |
| 합반 | 담당 교사 `leadTeacherMemberId` create/update | — (응답에만 필드) | ❌ unavailable |
| 참여 기관 | participants ORGANIZATION enrich ㅇ| `materialAssignmentStatus` 포함 | ⚠️ 학년·교재·지역 부족 |
| 참여 기관 | 교재 배송 현황 변경 | — | ❌ unavailable |

### A-2) LNB 보완 요약

**참여자 신청 목록 > 기관 신청 상세**

- 상세 GET 부재 — 합반 외 필드 수정 API 없음 → FE unavailable
- 목록에 **학년(`educationGrade`)**·지역·합반 파트너 enrich 없음 → partner lookup 50건 한정
- 합반 저장 후 파트너 학년 교재명 동기화 계약 없음
- **`CreateMergeRequest`에 `leadTeacherMemberId` 누락**
- 기관 신청 전용 unmask 부재
- 알림 재발송 — **보류**

**프로그램 진행 현황 > 참여 기관**

- participants(ORGANIZATION) **학년·반·인원·교재·지역** 부족
- `materialAssignmentStatus` 조회만 — 배송 상태 변경 API 부재
- 합반 멤버(비 lead) 취소·변경 — DELETE는 lead 그룹 기준
- 교재 선택 저장 — textbook PATCH와 merge 연동 계약 없음

### A-3) 이미 구현·FE 연동한 API

| Method | Path | FE 용도 |
|--------|------|---------|
| GET | `/api/admin/programs/{programId}/organization-applications` | 기관 신청 목록 |
| POST | `/api/admin/organization-applications/{applicationId}/approve` | 단건 승인 |
| POST | `/api/admin/organization-applications/{applicationId}/reject` | 단건 반려 |
| POST | `/api/admin/organization-applications/bulk-approve` | 일괄 승인 |
| POST | `/api/admin/organization-applications/bulk-reject` | 일괄 반려 |
| POST | `/api/admin/organization-applications/{applicationId}/cancel-approval` | 승인 취소 |
| POST | `/api/admin/organization-applications/{applicationId}/cancel-rejection` | 반려 취소 |
| GET/POST/DELETE | `/api/admin/programs/{programId}/organization-merge-groups[/{mergeGroupId}]` | 합반 |

**CreateMergeRequest:** `leadApplicationId`, `members[{ organizationApplicationId, grade }]`, `changeReason?`  
**MergeGroupResponse:** `leadTeacherMemberId` (read-only)

### A-4) participants(ORGANIZATION) 목록 enrich — P1

| 필드 | 용도 |
|------|------|
| `educationGrade` (또는 `grade`) | 합반 partner · POST `members[].grade` |
| `region`, `classCount`, `studentCount` | 목록·상세 |
| `textbookId`, `textbookName`, `textbookStatus` | 신청 정보 |
| `organizationApplicationId` | merge · 강사 배정 · 학생 명단 · 코멘트 |
| `participantId`, `teacherMemberId` | 활동 포기 · 개인정보 |
| `mergeGroupId`, `combinedClassYn` (optional) | 목록 배지 |
| `sessions[]` + schedule id | 일정 변경 · 강사 배정 create |

### A-5) organization-applications 목록 enrich — P1

- `educationGrade` / `grade`, `region`, (optional) `mergeGroupId`, `combinedClassPartnerGrades[]`

### A-6) 합반 저장 후 동기화 · 멤버 해제 — P2

- merge POST 후 member 교재·합반 snapshot propagate
- DELETE idempotency / member withdraw API
- 신청 단계 merge 허용 → `availableActions` 또는 phase flag
- (권장) `CreateMergeRequest.leadTeacherMemberId`
- (필요) 교재 배송 상태 변경 — `BEFORE_SHIPPING` / `SHIPPING` / `DELIVERED`

### A-7) 기관 FE 검증

- [ ] remote — 승인/반려·일괄·취소 후 목록 일치
- [ ] remote 비활성 — unavailable · mock 없음
- [ ] 동일 기관 2학년+ partner · merge-groups
- [ ] 합반 외 필드·담당 교사 → unavailable
- [ ] 알림 재발송 보류
- [ ] participants `organizationApplicationId` 항상 존재

---

## B. 참여 기관 상세 — 신청 정보

### B-1) 상세 조회 API

`GET /api/admin/organization-applications/{applicationId}`

필수 응답:

- `applicationId`, `participantId`, `programId`
- `organizationId`, `organizationName`
- `teacherMemberId`, `teacherName`
- 마스킹된 `teacherPhone`, `teacherMobile`, `teacherEmail`
- `region`, `addressDetail`
- `educationGrade`, `educationFormat`, `classCount`, `studentCount`
- `applicationReason`, `otherRequests`
- `computerInRoom`, `waitingRoomAvailable`, `waitingRoomLocation`
- `mealProvided`, `mealNotice`, `parkingInfo`
- `textbookId`, `textbookName`, `textbookGrade`, `textbookKits`, `textbookQuantity`
- 합반 신청 상태·파트너 신청 ID
- `availableActions`
- `sessions[]` (일정·schedule id — §A-4·§D와 동일)

### B-2) 정보 수정 API

`PATCH /api/admin/organization-applications/{applicationId}`

수정 대상: 주소 상세, 교육 형태, 담당 교사, 신청 사유·기타 요청, 교육장·대기실·식사·주차, 교재 선택·수량.

요구사항: 부분 수정 · 권한·담당 범위 · 감사로그 · 성공 시 갱신 상세 · 충돌 409.

합반은 기존 merge-groups와 책임 분리.

### B-3) 개인정보 원문 (선택)

기관 신청 시점 원문이 회원 최신과 다를 수 있으면:

`POST /api/admin/organization-applications/{applicationId}/privacy/unmask`  
body `{ "reason" }` → `teacherName` / phone / mobile / email, `privacyStatus: "UNMASKED"`

- `PRIVACY_RAW_READ` · 사유 필수 · 감사로그 실패 시 차단  
정책이 회원 최신 unmask라면 신규 API 없이 공식 계약만 명시.

### B-4) 교육 진행 일정 변경

화면 회차 변경은 **정보 수정 PATCH와 분리**. 모달 확정 시 일정 API 즉시 호출.

권장: `PATCH /api/admin/programs/{programId}/participants/{participantId}/schedules`

```json
{
  "changes": [
    { "scheduleId": 12345, "educationDate": "2026-05-01" },
    { "scheduleId": 12346, "educationDate": "2026-05-08" }
  ],
  "reason": "관리자 일정 변경"
}
```

요구사항: 트랜잭션 전체 성공/실패 · 프로그램 기간 내 · 완료 일정 차단 · 강사·봉사자 충돌 · 성공 후 sessions 재조회 · 409.

단건만 제공 시 부분 성공·롤백 계약 별도 정의.

### B-5) 활동 포기 보완

현재: `POST …/participants/{participantId}/give-up` + `reason` — FE 연동됨.

화면은 “선택한 교육 일정부터 포기” → 요청:

```json
{ "reason": "활동 포기", "stopScheduleId": 12345 }
```

`stopScheduleId` = `sessions[].resolvedScheduleId`. 선택 일정 이후 취소·배정 해제 서버 확정 · 이전 완료 유지 · 409 · 감사로그.

전체 즉시 포기 정책이면 화면 일정 선택 제거 가능하도록 명시.

### B-6) 상세 수락 기준

- 상세 새로고침 후에도 신청 정보 유지
- 정보 수정 후 재조회 일치
- 코멘트 target = `ORGANIZATION_APPLICATION` + `organizationApplicationId`
- 개인정보 원문 = 권한·사유·감사로그 통과 시에만
- 일정 변경·활동 포기 후 재조회 서버 일치

---

## C. 학생 명단

**관련 FE:** `school-detail-student-list-section.tsx`, `student-roster-api-client.ts`, `use-organization-student-roster-remote.ts`

### C-1) FE 연동

| 액션 | OpenAPI | FE |
|------|---------|-----|
| 목록 조회 | ✅ GET student-roster | ✅ (`organizationApplicationId`) |
| 필터 | ❌ 서버 쿼리 없음 | 클라 필터 |
| 정보 수정·학생 등록 | ✅ PUT | ✅ (계약 이슈로 실패 가능) |
| Excel template/import | ✅ | ❌ 클라 엑셀만 |
| 초상권 동의 확인 | ⚠️ 기관 단위만 | ❌ 클라 PDF (행 단위 계약 없음) |
| 수료증/참여인증서 | ✅ issues/serial/eligibility | ⚠️ serial(+클라 PDF)만 |
| 강의 출석 내역 조회·정정 | ✅ schedules + schedule attendances / bulk-upsert | ✅ `participantId` 기준 (progress remote) |
| **출석 관리 탭** (회차별 전체 학생) | ✅ roster GET + schedule attendances GET / bulk-upsert | ✅ (§F) |
| PII 원문 | masked*만 | PUT에 마스킹 재전송 금지 |
| 비고 notes | ❌ | UI만 |

### C-2) 서버 수정

**C-2-1. 수동 PUT — `sourceFileObjectId` optional (P0)**  
CMS 테이블 편집은 파일 없이 PUT. 엑셀 import만 file id 필수. revision·감사로그 유지.  
FE는 GET의 id 재사용, 없으면 `0` 전송 → optional 반영 전 실패 가능.

**C-2-2. PUT row 정합**

| FE | 현재 | 요청 |
|----|------|------|
| `gradeClass` | `grade`+`className` | 매핑: `grade`=교육학년, `className`=학급 라벨 |
| `notes` | 없음 | `notes?: string` (max 200) |
| `rosterId` | 응답만 | request optional 권장 |
| 성별 미기재 | optional | null/omit · enum `male`/`female` |
| phone/email | request 원문 / response masked | 편집 unmask 또는 수정 시만 원문. 마스킹 재PUT 금지 |

**C-2-3. GET 필터 (P2)** — `studentName`, `gender`, `className`

**C-2-4. 학생 단위 초상권 (P1)** — roster에 consent 상태/artifact 또는 `GET …/student-roster/{rosterId}/portrait-consent` (+ bulk)

**C-2-5. 수료증 (P1)** — `POST …/certificates/issues` subject=`rosterId`/`participantId`/`memberId`, eligibility 사전 조회

**C-2-6. 강의 출석 · 출석 관리 (P1 보완)** — FE는 현재 다음을 연동:
- **학생 명단 > 강의 출석 내역**: `participantId` + program schedules attendances 조회/정정
- **참여 기관 상세 > 출석 관리**: roster GET × 기관 `sessions[].resolvedScheduleId`별 schedule attendances GET, 저장은 `attendances:bulk-upsert` (§F)

남아 있는 갭:
- roster에 `attendanceSummary` (`n/m`) 포함
- roster에 `memberId` / 개인 `applicationId` 없으면 회원용 `GET …/lecture-attendance` 경로 사용 불가
- `participantId` null인 학생은 조회·정정 불가 → roster 응답 **필수화**
- `sessions[].resolvedScheduleId` null이면 해당 회차 저장 불가 → participants/상세 enrich **필수**
- 회차 셀 2차 상세 모달용 `absenceReason` 등
- (선택) 기관 단위 `GET …/organization-applications/{id}/attendances?scheduleId=` — 현재 FE는 schedule 단위 GET을 클라 조인

**C-2-7. Excel template/import (P2)** — CMS 툴바 공식 경로·invalidate 기준 문서화

### C-3) FE가 이미 하는 일

- GET roster 바인딩 · PUT 전체 rows · 마스킹 phone/email 미전송 · 클라 필터
- 강의 출석: schedules 목록 + schedule attendances 조회, bulk-upsert 정정 (`student-lecture-attendance-api.ts`)
- 출석 관리 탭: roster + schedule attendances 조인 · bulk-upsert 저장 · 클라 필터/엑셀 (`school-detail-attendance-api.ts`)

### C-4) BE 체크리스트

- [ ] 수동 PUT `sourceFileObjectId` 없이 200
- [ ] import는 file id 필수
- [ ] gender·notes·출석 요약·초상권·수료증 subject 정책
- [ ] roster `participantId` 항상 제공 (출석 연동 전제)
- [ ] 기관 sessions `resolvedScheduleId` 항상 제공 (출석 관리 탭 전제)

---

## D. 강사 배정 현황

**관련 FE:** `school-detail-fullpage-view.tsx`, `instructor-assignment-board-service.ts`, `instructor-assignments-api-client.ts`

### D-1) FE 연동 (progress remote ON)

| 액션 | API | FE |
|------|-----|-----|
| 배정 목록 | GET `…/program-execution/instructor-assignments` | ✅ board |
| 배정 생성 | POST `…/programs/{programId}/instructor-assignments` | ✅ |
| 배정 취소 | POST `…/instructor-assignments/{id}/cancel` | ✅ |
| 대표 강사 | PUT `…/representative-instructor` | ✅ |
| 점유일 캘린더 | GET assignment-calendar | ✅ (404 시 list+schedules 폴백) |
| 승인 강사 신청 | instructor-applications list | ✅ waiting 합성용 |
| schedules | admin program schedules | ✅ |
| **배정 대기 전용 API** | ❌ | ⚠️ 기관 상세·강사 상세 모두 합성 |

remote OFF / `organizationApplicationId` 없음 → 빈 목록 · mutation unavailable · mock 없음.

### D-2) 서버 보완

**D-2-1. 배정 대기 전용 API (P1)**  
현재 FE 합성: 승인 강사 신청 × 기관 `sessions[]` × 배정된 member 제외 × (선택) calendar 충돌.

요청 택1:

| 안 | 예시 |
|----|------|
| A | `GET …/organization-applications/{organizationApplicationId}/waiting-instructor-assignments` |
| B | instructor-assignments list `status=WAITING` + preferred schedule expand |

행 최소: `instructorMemberId`, `instructorName`, `instructorApplicationId`, hope 일정 또는 `requestedScheduleId`+`resolvedScheduleId`, `scheduleUnresolved`, (선택) distance·충돌.

**D-2-2. `organizationApplicationId` 필수 (P0)** — participant에 항상. 없으면 FE 빈 목록·create 차단.

**D-2-3. sessions schedule id (P0)** — `requestedScheduleId`, `resolvedScheduleId`, `scheduleUnresolved`. 없으면 waiting 비고·create 실패.

**D-2-4. create body**

```json
{
  "instructorMemberId": 123,
  "scheduleId": 456,
  "requestedScheduleId": 789,
  "organizationApplicationId": 1011,
  "instructorApplicationId": 1213,
  "scheduleLead": true
}
```

`scheduleId` 또는 `requestedScheduleId` 중 하나 필수 · 1일1교 충돌 구조화 에러 코드.

**D-2-5. 목록 enrich (P2)** — `lectureDate`, `instructorName`, `homeAddress`, `distanceKm`, `longDistance`, `organizationName`, `scheduleLead` · codegen 반영.

### D-3) 수락 기준

- progress remote ON 시 목록·생성·취소·대표 동작
- org app id·session schedule id 있으면 waiting 합성에서 create 성공
- remote OFF/id 누락 시 mock 없이 빈 목록·저장 불가
- 1사1교 기본 게이트 불변

---

## F. 참여 기관 상세 — 출석 관리

**관련 FE:** `school-detail-attendance-section.tsx`, `use-school-detail-attendance.ts`, `school-detail-attendance-api.ts`

### F-1) FE 연동 (applications + progress remote ON + `organizationApplicationId`)

| 액션 | API | FE |
|------|-----|-----|
| 학생 목록 | `GET …/organization-applications/{id}/student-roster` | ✅ |
| 회차 메타 | 참여 기관 `sessions[]` (row) | ✅ |
| 회차별 출결 조회 | `GET …/program-execution/programs/{programId}/schedules/{scheduleId}/attendances` | ✅ (`resolvedScheduleId`별) |
| 출결 저장 | `POST …/program-execution/programs/{programId}/attendances:bulk-upsert` | ✅ |
| 필터 | ❌ 서버 쿼리 없음 | 클라 필터 |
| 엑셀 | — | ✅ 클라 export |

remote OFF / orgAppId 없음 / schedule 미매핑 → 빈 목록·저장 disabled · `program-api-unavailable` · **mock 없음**.

### F-2) 서버 보완

**F-2-1. `sessions[].resolvedScheduleId` (P0)** — participants/기관 상세 enrich. null이면 해당 회차 출석 GET·저장 불가.

**F-2-2. roster `participantId` (P0)** — null 행은 bulk-upsert 제외 → 저장 누락. 항상 제공.

**F-2-3. (선택·P2) 기관 스코프 출석 API**  
현재 FE는 schedule 단위 attendances를 전량 GET 후 roster `participantId`로 클라 필터. 기관 전용이면:

`GET /api/admin/organization-applications/{organizationApplicationId}/attendances?scheduleId=`

**F-2-4. (선택) PUT schedule attendances vs bulk-upsert**  
FE는 기관 학생만 갱신하므로 **bulk-upsert** 사용 (동일 schedule의 타 기관·개인 참여자 덮어쓰기 방지). PUT full-replace 계약이면 문서화 필요.

### F-3) 수락 기준

- remote ON + orgAppId + scheduleId → 회차 패널에 roster 학생·출결 표시 · 저장 후 재조회 일치
- `participantId`/`resolvedScheduleId` 누락 시 해당 행·회차 저장 불가 (mock으로 채우지 않음)
- 엑셀은 클라 only

---

## E. 봉사자 신청 심사

### E-1) LNB 요약

**1차 서류 심사** — 페이지네이션·서버 필터 부족 · 목록 enrich(담당자 A/B·에세이·연락처) 부족  
**1차 서류 상세** — 상세 GET 부재 · 승인/반려 취소·담당자 평가 API 부재 → unavailable · unmask 표시 enrich 필요 · `document-result` `notifyTiming` 미지원  
**1차 서류 합격자** — `interviewAvailability`·`assignedInterview*`·`interviewAssignmentId` enrich · 서버 필터  
**합격자 상세** — 상세 GET 부재 · give-up reason **FE 연동됨**  
**2차 면접** — 동일 enrich · 면접 평가에 `interviewAssignmentId` 필수 · `final-result` notifyTiming·A/B 점수 분리 부재

### E-2) FE 연동

| 화면 | 기능 | API | 연동 |
|------|------|-----|------|
| 1차 서류 | 목록 | GET volunteer-applications | ✅ (50건+FE 필터) |
| 1차 서류 | 선택 승인/반려 | document-result / bulk | ✅ |
| 1차 상세 | 승인·반려 취소 · A/B 평가 | — | ❌ unavailable |
| 1차 상세 | 개인정보 | member unmask | ⚠️ |
| 1차 합격자 | 목록·면접 배정 | list + interview-slots + assignments | ✅ |
| 1차 합격자 상세 | 활동 포기 | give-up + reason | ✅ |
| 2차 면접 | 합격/불합격·재배정 | final-result · assignments | ✅ |
| 2차 상세 | 면접 평가 | evaluations | ⚠️ assignmentId 필수 |

### E-3) 신규·보완 API

- `GET /api/admin/volunteer-applications/{applicationId}` — 에세이·면접일·평가·assignmentId·availableActions
- 목록 enrich·`page`/`size`/`documentStatus` 서버 필터
- 승인/반려 취소 · 담당자 서류평가 PUT/PATCH
- `interviewAssignmentId` 필수 · (권장) A/B 점수 · notifyTiming

### E-4) 봉사자 FE 검증

- [ ] remote 로드 · mock 없음
- [ ] 비활성 → unavailable 1회
- [ ] 서류 승인/반려 후 목록 일치
- [ ] 취소 클릭 → unavailable
- [ ] give-up reason · 면접 배정 invalidate · assignmentId 있을 때 평가 저장

---

## G. 프로그램 진행 현황 — 참여 강사 목록 (교육 참여 강사 목록)

**관련 FE:** `participating-instructors-section.tsx`, `use-progress-instructor-list.ts`, `general-applications-adapters.ts` (`mapParticipantToParticipatingInstructorRow`), `participating-instructor-assigned-institutions.ts`

**시드 스펙:** `general-program-remote-db-full-graph-seed-backend-request-2026-09-16.md` §7.3 · §7.4

### G-1) FE 연동 (applications + progress remote ON)

| 액션 | OpenAPI / 계약 | FE (2026-09-17) |
|------|----------------|-----------------|
| 목록 조회 (무한 스크롤) | `GET …/programs/{programId}/participants?participantType=INSTRUCTOR&page=&size=` | ✅ |
| 배정 기관명 | `GET …/program-execution/instructor-assignments` (+ participants enrich 권장) | ✅ assignments 조인 · mock 합성 **금지** |
| 필터 조회 (6종) | ❌ 서버 쿼리 없음 | ✅ URL + **클라 필터** |
| 행 클릭 → 강사 상세 | — (URL `instructorId`) | ✅ (상세 탭은 §7.4·programs-detail-lnb-crud-api-gaps) |
| 체크박스 선택 | — | ✅ 로컬 |
| 엑셀 다운로드 | ❌ 서버 export 없음 | ✅ **클라 Excel** (필터 결과) |
| 활동인증서 발급 | `POST …/certificates/issues/serial` + template | ✅ (PDF 다운로드 시) |
| 캘린더 ↔ 리스트 | — | ✅ URL `instructorView` |
| 캘린더 이벤트 | participants sessions + assignments | ✅ 학교 `sessions[]` × 배정 기관명 조인 (sessions enrich 전제) |
| **강사 등록** | ❌ | ❌ **unavailable** (로컬 patch 제거) |
| **강사 삭제** | ❌ bulk delete | ❌ **unavailable** (본 화면 버튼 없음 · 구 progress-tab은 unavailable) |

remote OFF / JWT·`programProgress` 미활성 → **빈 목록** + `program-api-unavailable` 1회 · **임시 mock 병합 금지**.

### G-2) participants(INSTRUCTOR) 목록 enrich — P0

`GET …/participants?participantType=INSTRUCTOR` 응답 `items[]` 최소 필드:

| 필드 | UI 용도 | 비고 |
|------|---------|------|
| `participantId`, `memberId`, `memberName` | rowKey · 강사명 | ✅ codegen |
| `regionSido`, `regionSigungu` | 자택 주소지(구까지) · 주소 필터 | codegen 있음 · **summary enrich 권장** |
| `homeAddressSummary` | 목록 자택 주소지(구까지) | additive · 마스킹 정책 SSOT |
| `homeAddress` | (선택) 상세 unmask 전 단일 문자열 | `*****` blur 토큰 |
| `contact` / `phone`, `email` | 연락처·이메일 열 | **서버 마스킹** · FE 재마스킹 금지 |
| `jaEvaluationGrade` (또는 `jaGrade`) | JA 평가 등급 | |
| `lectureExperienceYears` | JA 강의 경력(년) | number |
| `settlementStatus` | 정산 현황 8종 | FE snake_case UI key — [instructor-settlement-status.mdc] |
| `assignedOrganizationNames[]` | 배정 기관명 열 | 없으면 FE가 instructor-assignments list 조인 |
| `lectureReportSubmitted` | 캘린더 카드 「강의보고서」 태그 | boolean |
| `giveUpAt`, `participantStatus` | 활동 포기 · 상세 가드 | |
| `sourceApplicationId` → FE `instructorApplicationId` | 코멘트 PATCH·신청 상세 GET | **P0** — 없으면 코멘트·상세 hydrate 불가 |
| `sessions[]` (`scheduleId`, `scheduleName`, `startAt`) | 활동 포기 중단일 선택지 | §G-8 · B-5와 동일 |

**정산 8종 UI key (FE SSOT):**  
`payment_statement_reapplication` · `awaiting_confirmation` · `partial_confirmation` · `payment_statement_verified` · `account_paid` · `none` · `application_rejected` · `payment_correction_requested`

**자택 주소지 표시:** 목록은 **시/도·시/군/구까지** (`homeAddressSummary` 또는 `regionSido`+`regionSigungu`). 상세 주소·blur는 개인정보 정책에 따름.

### G-3) instructor-assignments list enrich (배정 기관명) — P0

목록 「배정 기관명」은 **취소되지 않은** 배정의 `organizationName` 집합(가나다순 · 중복 제거)이다.

| 필드 | 용도 |
|------|------|
| `instructorMemberId` | participants `memberId` 조인 키 |
| `organizationName` | 기관명 표시 |
| `assignmentStatus` | `CANCELLED` 제외 |
| (권장) `organizationApplicationId` | 기관 상세·배정 탭 연동 |

participants enrich에 `assignedOrganizationNames[]`가 있으면 FE는 assignments 재조회 없이도 표시 가능(권장 SSOT).

### G-4) 신규 API — P1

#### G-4-1. 참여 강사 등록 (관리자)

화면 「강사 등록」: 기존 **강사 회원**을 프로그램 참여자(INSTRUCTOR)로 추가.

```http
POST /api/admin/programs/{programId}/participants/instructors
Content-Type: application/json

{
  "memberId": 190005,
  "consentConfirmed": true
}
```

요구: MEMBER_WRITE + PROGRAM_WRITE · 감사로그 · 중복 등록 409 · 성공 시 `participantId` 반환 · 목록 재조회 일치.

(대안) instructor-applications 승인 파이프라인만 허용한다면, 화면 버튼 제거 또는 「신청 승인 후 자동 편입」 정책을 API·카피로 명시.

#### G-4-2. 참여 강사 삭제/제외 (일괄)

```http
POST /api/admin/programs/{programId}/participants/instructors/bulk-remove
{ "participantIds": [123, 456], "reason": "관리자 제외" }
```

cms-table-bulk-delete-api-backend-handoff.md #21. 진행 중 프로그램·정산 존재 시 409.

### G-5) 목록 필터 · export — P2

| 필터 (FE URL key) | 서버 쿼리 (권장) |
|-------------------|------------------|
| `instructorName` | `keyword` 또는 `memberName` |
| `homeSido`, `homeSigungu` | `regionSido`, `regionSigungu` |
| `experienceYears` | `lectureExperienceYears` (범위 또는 enum) |
| `evaluationGrade` | `jaEvaluationGrade` |
| `settlementStatus` | `settlementStatus` |

엑셀: `GET …/participants/export?participantType=INSTRUCTOR&…` 또는 bulk-download handoff — 현재 FE는 **클라 Excel** only.

### G-6) FE가 이미 하는 일 (2026-09-17)

- remote ON: participants infinite query + instructor-assignments board 조인 → `assignedOrganizationNames` · primary `schoolName`
- adapter: codegen + additive enrich (`homeAddressSummary`, PII, settlement, grade, 경력, `educationSchedules`)
- remote OFF: 빈 목록 · mock/temp-progress-instructor **미사용**
- 등록·삭제·정산 변경: `notifyProgramApiUnavailable` · 로컬 `setInstructorList` patch **없음**
- 활동인증서: serial allocate (기존 §certificate-serial)
- 참여 강사 상세(§G-8): 신청 enrich · 배정 create/cancel · give-up · PII unmask — mock patch **없음**

### G-7) BE · QA 체크리스트

- [ ] `168006` (또는 기관형 seed): `participants?INSTRUCTOR` ≥1 · enrich 필드 샘플 1행 이상
- [ ] 배정 2기관 강사 → 목록 「{첫 기관} 외 1개」
- [ ] 정산 8종 중 ≥2 상태가 목록에 반영
- [ ] 마스킹 contact/email · homeAddressSummary 구까지
- [ ] remote OFF → 빈 목록 + unavailable (임시 강사 mock 없음)
- [ ] 강사 등록 확인 → unavailable (POST 구현 전)
- [ ] 활동인증서 다운로드 → serial API 200

### G-8) 참여 강사 상세 — 신청 정보 · 교육 배정 현황

**관련 FE:** `participating-instructor-fullpage-view.tsx`, `use-participating-instructor-application-detail-enrichment.ts`, `use-participating-instructor-institution-assignment.ts`, `build-participating-instructor-assignment-rows.ts`

#### G-8-1) 신청 정보 탭 — FE 연동 (applications + progress remote ON)

| 액션 | OpenAPI / 계약 | FE (2026-09-17) |
|------|----------------|-----------------|
| 신청 정보 조회 | `GET /api/admin/instructor-applications/{applicationId}` + form_response | ✅ `sourceApplicationId` → enrich |
| 정보 수정 (강의비·등급·사업소득) | PATCH body **`managerComment`만** (codegen `Update`) | ❌ unavailable — 저장 시 안내 |
| 코멘트 작성 | `PATCH …/instructor-applications/{id}` (`managerComment`) | ✅ `instructorApplicationId` |
| 개인정보 상세보기 | member unmask (`INSTRUCTOR`) | ✅ `memberId` |
| 활동인증서 발급 | certificate serial allocate | ✅ |
| 활동 포기 | `POST …/participants/{participantId}/give-up` | ✅ + `stopScheduleId` optional |
| 활동 포기 중단일 선택 | participants `sessions[]` enrich | ✅ FE 매핑 · BE `stopScheduleId` 수용 |
| 학력/경력/자격 | 상세 GET + form_response | ⚠️ enrich · BE resume 필드 보완 |

remote OFF / `instructorApplicationId` 없음 → unavailable · **mock/local patch 금지**.

#### G-8-2) 교육 배정 현황 탭 — FE 연동 (progress remote ON)

기관형·개인형 공통: `use-participating-instructor-institution-assignment.ts` + assignment board.

| 액션 | API | FE |
|------|-----|-----|
| 배정된 목록 | `GET …/instructor-assignments` (program-wide → `instructorMemberId` 클라 조인) | ✅ 기관형·개인형 |
| 배정 대기 목록 | `schoolRows` × 미배정 슬롯 합성 (§D-2-1 전용 API 없음) | ✅ |
| 선택 배정 · 추가 배정 | `POST …/programs/{programId}/instructor-assignments` | ✅ |
| 배정 취소 | `POST …/instructor-assignments/{id}/cancel` | ✅ (`assignmentIds[]`) |
| 대표 강사 지정 | `PUT …/representative-instructor` | ✅ (`newRole === 'lead'`) |
| 일반 강사로 변경(demote) | — | ❌ unavailable (전용 demote API 없음) |
| 엑셀 | — | ✅ 클라 export |

remote OFF / `memberId` 없음 → 빈 목록 + unavailable · **mock 금지**.

#### G-8-3) 서버 보완

| 항목 | 우선순위 | 요청 |
|------|----------|------|
| `sourceApplicationId` on participants(INSTRUCTOR) | P0 | 코멘트·상세 GET PK |
| `sessions[]` on participants(INSTRUCTOR) | P0 | 활동 포기 중단일 · give-up `stopScheduleId` |
| PATCH feePolicy + businessIncome | P1 | 「정보 수정」 저장 |
| GET resume/education/career enrich | P1 | 이력서 탭 |
| **배정 대기 전용 API** | P1 | §D-2-1 — 강사 상세도 동일 갭 (현재 schoolRows 합성) |
| **list `instructorMemberId` 쿼리** | P2 | 강사 상세는 program-wide list 후 클라 필터 (size 200 한도) |
| **대표→일반 demote API** | P2 | 현재는 다른 강사 lead 지정으로만 간접 반영 · 단독 demote 불가 |
| settlement status change | P1 | 목록·상세 정산 드롭다운 |
| POST participants/instructors (등록) | P1 | §G-4 |
| bulk-remove (삭제) | P1 | §G-4 |

give-up body (§B-5와 통일):

```json
{ "reason": "활동 포기", "stopScheduleId": 12345 }
```

feePolicy PATCH (승인 `Approval.feePolicy`와 동일 구조 권장):

```json
{
  "feePolicy": {
    "basisType": "PROGRAM",
    "measure": "SESSION",
    "amount": 150000,
    "instructorFeeGrade": "3급 강사비"
  }
}
```

#### G-8-4) QA

- [ ] 신청 정보: enrich · 코멘트 · unmask · give-up(+stopScheduleId)
- [ ] 정보 수정 저장: fee PATCH 전 unavailable
- [ ] 배정 탭: create/cancel/representative(lead) 후 board 재조회 · mock 없음
- [ ] 일반 강사 demote · 정산·등록·삭제: unavailable (API 전)
- [ ] 개인형 교육 배정 탭도 동일 remote 경로

### G-9) 참여 강사 상세 — 정산 현황

**관련 FE:** `participating-instructor-settlement-section.tsx`, `participating-individual-instructor-settlement-section.tsx`, `use-participating-instructor-settlement-list.ts`, `map-settlement-to-participating-instructor-settlement-row.ts`, `participating-instructor-payment-statement-view-container.tsx`

**Remote 게이트:** `isMemberInstructorSettlementsRemoteEnabled()` — members + (`paymentOrders` **or** `accountPayments` in `VITE_REAL_API_MODULES`). program progress remote와 **별도**.

#### G-9-1) FE 연동 (settlement remote ON + `memberId`)

| 액션 | OpenAPI / 계약 | FE (2026-09-17) |
|------|----------------|-----------------|
| 요약 — 지급조서 처리현황 | participants enrich `settlementStatus` | ✅ `instructor.settlementStatus` |
| 요약 — 프로그램 진행 회차 | settlements `sessionCompleted`/`sessionTotal` | ✅ 목록 집계 |
| 요약 — 강의비·사업소득 | instructor-applications / participants enrich | ✅ 신청 정보와 동일 소스 |
| 정산 내역 테이블 | `GET /api/admin/settlements?programId=&instructorMemberId=` | ✅ |
| 지급조서 보기 | `GET …/settlements/{id}` + 미리보기 렌더 | ✅ settlement detail → 양식 preview |
| 지급조서 파일 다운로드 | `POST …/settlements/{id}/payment-statement/download` | ✅ (모달·일괄) |
| 지급조서 일괄 다운로드 | `POST …/payment-statements/bulk-download` | ✅ (fallback: 건별 download) |
| 엑셀 | — | ✅ 클라 Excel (조회 결과) |

remote OFF / `memberId` 없음 → **빈 목록** + `program-api-unavailable` 1회 · **mock 5행·FE PDF 합성 금지**.

#### G-9-2) FE가 이미 하는 일

- `fetchAllSettlementsRemote({ programId, instructorMemberId })` — 회원 상세 `instructor-payment-tab`과 동일 API·status mapper 재사용
- 지급조서 미리보기: settlement detail `items[]` → 지급조서 양식 preview (원천징수 8.8% **FE 가정 제거**)
- 지급조서 다운로드: 서버 PDF URL (`downloadPaymentStatementRemote` / bulk-download)
- 기관형·개인형 동일 hook · 컬럼만 분기

#### G-9-3) 서버 보완

| 항목 | 우선순위 | 요청 |
|------|----------|------|
| `programId` + `instructorMemberId` **동시 필터** | P0 | 해당 프로그램·강사 정산만 반환 (다른 프로그램 혼입 방지) |
| `institutionName`, `lectureDate`, `sessionOrdinal`, `programSessionProgressDisplay` | P0 | 테이블 「기관명」「교육 진행 일정」 |
| `educationGrade` (교육 학년) | P1 | 기관형 테이블 열 — 없으면 FE `-` |
| `sessionCompleted` / `sessionTotal` on list item | P1 | 요약 「프로그램 진행 회차」 SSOT |
| `GET …/payment-statement/render-data` `payload` | P2 | frozen snapshot 직접 렌더(현재 FE는 detail GET 기반 preview) |
| settlement status change (목록 드롭다운) | P1 | §G-4 · 목록 정산 변경 unavailable 유지 |

#### G-9-4) QA

- [ ] settlement remote ON: seed programId+memberId 정산 ≥1행
- [ ] 지급조서 보기: detail 로드 후 preview · 서버 PDF 다운로드 200
- [ ] 일괄 다운로드: bulk-download 또는 건별 fallback
- [ ] remote OFF: 빈 목록 · mock 행 없음
- [ ] `memberId` 없는 participant: unavailable

---

## H. 프로그램 게시글 (참여 기관 상세 · 게시글 탭)

**화면:** 참여 기관/수강 프로그램 상세 → 게시글 탭 (카드·메타·⋮·상세·읽음 현황)

### H-1) FE 연동 현황 (2026-09-17)

| 기능 | API | FE | 비고 |
|------|-----|-----|------|
| 목록 | `GET …/posts` | ✅ | adapter: author actor·count·visibility |
| 상세 | `GET …/posts/{postId}` | ✅ | |
| 등록/수정/삭제 | POST / PUT / DELETE | ✅ | 본인 글만 ⋮ (actorId 매칭) |
| 댓글 | GET / POST comments | ✅ | |
| 반응 | GET / PUT / DELETE reaction | ✅ | summary + **items → 반응 사용자 목록** |
| 첨부 | GET / PUT attachments | ✅ | 목록 카드 attachmentCount |
| 읽음 현황 | `GET …/posts/{postId}/reads` | ✅ | readers + unreadMembers |
| 미읽음 알림 | `POST …/unread-reminders` | ✅ | `message` + additive `memberIds` |

remote OFF: 목록/상세는 빈·mock 분리 정책 유지. 읽음 팝업은 remote OFF 시 디자인시스템용 mock 경로만.

### H-2) BE 갭 · 요청

#### H-2-1. 작성자·반응자·읽음 대상 **displayName** enrich

현재 DTO는 actorType/actorId · memberId만 제공. FE는 `{역할} #{id}` 폴백.

요청 필드 (additive):

| 위치 | 필드 | 설명 |
|------|------|------|
| list/detail/comment | `createdByDisplayName` | 작성자 표시명 |
| reaction items | `actorDisplayName` | 반응자 표시명 |
| reads.readers | `readerDisplayName` | 읽은 사람 표시명 |
| reads.unreadMembers | `memberDisplayName` | 미읽음 대상 표시명 |

#### H-2-2. 미읽음 알림 대상 선택 (`memberIds`)

OpenAPI `UnreadReminderRequest`는 `message`만 정의.

```http
POST /api/admin/programs/{programId}/posts/{postId}/unread-reminders
Content-Type: application/json

{
  "message": "게시글을 확인해 주세요.",
  "memberIds": [101, 102]
}
```

- `memberIds` 있으면 **선택 대상만** 발송
- 없으면 기존(전체 미읽음) 정책 유지 가능
- FE는 이미 additive `memberIds`를 전송 중 → 스펙 반영·서버 적용 필요

#### H-2-3. 기관(학교) 스코프 게시글

참여 기관 상세 탭은 `schoolId` / organization participant 기준으로 게시글을 걸러야 함.

| 요청 | 설명 |
|------|------|
| list query `organizationParticipantId` 또는 `schoolId` | 해당 기관 스코프 글만 |
| create body 동일 스코프 필드 | 기관 공지 vs 프로그램 전체 구분 |
| reads GET query 동일 | 읽음/미읽음도 기관 참여자만 |
| DTO `organizationParticipantId` / `schoolId` | 카드·필터용 |

현재 FE는 프로그램 단위 posts만 조회. 기관 탭의 `tabSchoolId`는 reads remote에서 **미적용**(서버 필터 없음).

#### H-2-4. 기타 (P2)

| 항목 | 설명 |
|------|------|
| `postType` / 공지 플래그 | UI 배지·정렬 |
| 목록 pagination | cursor/page (대량 시) |
| 첨부 originalFileName 누락 시 | list에 attachmentCount 직접 제공 |

### H-3) FE가 이미 하는 일

- posts CRUD · comments · reactions · attachments remote
- reads GET → 읽음/안읽음 팝업
- unread-reminders POST (`message` + `memberIds`)
- reaction `items` → 상세 반응 사용자 목록
- 본인 작성 글만 목록/상세 ⋮ (수정·삭제)
- author/reader displayName 폴백: 역할 + `#actorId`

### H-4) BE · QA 체크리스트

- [ ] `GET …/posts/{id}/reads` — readers·unreadMembers 샘플 ≥1
- [ ] displayName enrich 후 UI에 실명 표시
- [ ] `POST …/unread-reminders` + `memberIds` — 선택 인원만 알림
- [ ] `GET …/posts?schoolId=` (또는 participant) — 기관 탭 목록 일치
- [ ] reaction items에 actorDisplayName
- [ ] 타 사용자 글 ⋮ 미노출 · 본인 글 수정/삭제 200

---

## I. 참여 강사 상세 — 강의보고서 관리

**화면:** 일반 프로그램 상세 → 프로그램 진행 현황 → 참여 강사 → 참여 강사 상세 → **강의보고서 관리**

**관련 FE:** `participating-instructor-lecture-reports-section.tsx`, `participating-individual-instructor-lecture-reports-section.tsx`, `use-program-lecture-reports.ts`, `lecture-reports-adapters.ts`, `program-progress-api-client.ts`

### I-1) FE 연동 현황 (2026-09-17)

| UI | API | FE | 비고 |
|----|-----|-----|------|
| 목록 조회 (기관·개인) | `GET /api/admin/programs/{programId}/lecture-reports` | ✅ | 무한스크롤 · adapter enrich |
| 강사 스코프 | query `instructorMemberId` (additive) + FE 필터 | 🔶 | OpenAPI list **params 없음** → FE best-effort |
| 강의보고서 보기 | `GET /api/admin/files/{fileObjectId}/download` (+ content blob 폴백) | ✅ | list `fileObjectIds[]` 사용 · mock 미리보기 제거 |
| 일괄 다운로드 | `GET …/lecture-reports/download?instructorMemberId=` | ✅ | `downloadUrl`/`downloadEndpoint`/`fileObjectId` 수용 |
| 엑셀 다운로드 | — | 클라 only | 테이블 행 export (P2 서버화 가능) |
| 관리자 예외 처리 | `POST …/program-execution/lecture-reports/{reportId}/admin-exception` | ❌ | **이 화면 UI 없음** — 연동 대상 아님 |

remote OFF / progress 모듈 OFF → 빈 목록 · 보기/일괄은 `notifyProgramApiUnavailable` · **mock PDF/시드 행 금지**.

### I-2) BE 갭 · 요청

#### I-2-1. 목록 강사 필터 (P0)

```http
GET /api/admin/programs/{programId}/lecture-reports?page=0&size=20&instructorMemberId=190005
```

- 참여 강사 상세는 **해당 강사 행만** 필요
- OpenAPI에 `instructorMemberId` query 추가 · 서버 필터 적용
- 응답 각 행에 `instructorMemberId` 항상 포함 (FE 교차검증)

현재 FE: query를 additive로 전송 + 응답에 필드가 있을 때만 클라이언트 필터. 필드 없으면 프로그램 전체가 노출될 수 있음.

#### I-2-2. download 응답 스키마 명시 (P0)

```http
GET /api/admin/programs/{programId}/lecture-reports/download?instructorMemberId=190005
```

OpenAPI `200`에 스키마 없음. FE는 회원 일괄과 동일하게 가정:

```json
{
  "downloadUrl": "https://…/….zip",
  "fileObjectId": 123,
  "status": "READY"
}
```

또는 `downloadEndpoint` (교육일지 bulk와 동일). **스키마 `$ref: FileDownloadJobResponse` 권장**.

요구:

- `instructorMemberId` 있으면 해당 강사 제출분 ZIP만
- 제출 0건 → 404/204 + 명확한 error code
- 감사로그 · LECTURE_REPORT_READ

#### I-2-3. 목록 라벨 enrich 품질 (P1)

DTO에 `dateRoundTimeLabel` · `grade` · `lectureProgressStatus` 가 있음. FE adapter는 사용 중.

시드/응답에서:

- `dateRoundTimeLabel` 실값 ( `일정 #n` 단독 금지 — seed SSOT §3.4)
- 제출 완료 행 `fileObjectIds` ≥1 (보기 연동)
- `lectureProgressStatus`: `UPCOMING` | `COMPLETED`

#### I-2-4. 단건 report download path (P2 · 선택)

`fileObjectIds` 없으면 보기 불가. 대안:

```http
GET /api/admin/programs/{programId}/lecture-reports/{reportId}/download
```

회원 상세 PH-015와 정렬. 있으면 FE 폴백으로 연결 가능.

#### I-2-5. 엑셀 export (P2)

서버 export 없으면 클라 Excel 유지. 필요 시 `GET …/lecture-reports/export?instructorMemberId=`.

### I-3) FE가 이미 하는 일

- list infinite query (기관·개인 공통 remote)
- additive `instructorMemberId` + FE 필터
- 보기 → `fileObjectIds` → files download API
- 일괄 → `…/lecture-reports/download?instructorMemberId=`
- adapter: `dateRoundTimeLabel`/`grade`/`lectureProgressStatus`/`fileObjectIds`
- mock issuance PDF 미리보기·클라이언트 순차 PDF **제거**

### I-4) BE · QA 체크리스트

- [ ] `GET …/lecture-reports?instructorMemberId=` → 해당 강사만
- [ ] 제출 완료 행 `fileObjectIds` ≥1 · 보기 200
- [ ] `GET …/download?instructorMemberId=` → ZIP (`downloadUrl` 스키마 문서화)
- [ ] `dateRoundTimeLabel`이 `일정 #n`만이 아님
- [ ] remote OFF → 빈 목록 · unavailable (mock 없음)
- [ ] 개인 참여 방식도 동일 list/download 동작

---

## J. 프로그램 진행 현황 — 참여 봉사자 목록

**관련 FE:** `participating-volunteers-section.tsx`, `use-progress-volunteer-list.ts`, `mapParticipantToParticipatingVolunteerRow`

**시드 스펙:** `general-program-remote-db-full-graph-seed-backend-request-2026-09-16.md` §7.5

### J-1) FE 연동 (progress remote ON)

| 액션 | OpenAPI / 계약 | FE (2026-09-17) |
|------|----------------|-----------------|
| 목록 조회 (무한 스크롤) | `GET …/programs/{programId}/participants?participantType=VOLUNTEER&page=&size=` | ✅ |
| 컬럼 매핑 | `sessions[]` · `organizationName` · additive enrich | ✅ adapter (`mapSessionProgressToParticipatingSchoolSessions`) |
| 필터 (성명·1365) | ❌ 서버 쿼리 없음 | ✅ 클라 필터 |
| 행 클릭 → 상세 | — (URL `volunteerId`) | ✅ 목록 row 기반 |
| 활동확인서 발급 | `POST …/certificates/issues/serial` + template | ✅ 목록 미리보기 모달 (강사 목록과 동일 패턴) |
| 캘린더 / 리스트 | — | ✅ URL + sessions 이벤트 |
| 엑셀 | ❌ 서버 export 없음 | ✅ 클라 Excel |
| **봉사자 등록** | ❌ | ❌ **unavailable** (로컬 append 제거) |
| **임직원 자원봉사자 등록** | ❌ | ❌ **unavailable** (로컬 인원 저장 제거) |

remote OFF → **빈 목록** + unavailable 1회 · **temp mock 봉사자 prepend 제거**.

### J-2) participants(VOLUNTEER) 목록 enrich — P0

`GET …/participants?participantType=VOLUNTEER` 응답 `items[]` 최소:

| 필드 | UI 용도 | 비고 |
|------|---------|------|
| `participantId`, `memberId`, `memberName` | rowKey · 성명 | ✅ codegen |
| `sessions[]` (`scheduleId`, `sessionNo`, `startAt`, `endAt`, status) | 봉사 진행 일정 · 캘린더 | ✅ codegen · FE 매핑됨 |
| `organizationName` | 소속/단일 기관 fallback | ✅ |
| `assignedOrganizationNames[]` 또는 `assignedInstitutionNames[]` | **배정 기관명** 열 | additive · 없으면 orgName fallback |
| `id1365` / `external1365Id` | 1365 ID 열 · 필터 | **P0 enrich** — 없으면 빈 문자열 |
| `contact` / `phone`, `email` | 연락처·이메일 | **서버 마스킹** · FE 재마스킹 금지 |
| `sourceApplicationId` | (권장) 신청 상세 deep link | |
| `giveUpAt`, `participantStatus` | 활동 포기 | ✅ |

### J-3) 신규 API — P1

#### J-3-1. 참여 봉사자 등록 (관리자)

화면 「봉사자 등록」: 기존 **개인 회원**을 프로그램 참여자(VOLUNTEER)로 추가.

```http
POST /api/admin/programs/{programId}/participants/volunteers
Content-Type: application/json

{
  "memberId": 190005
}
```

#### J-3-2. 임직원 자원봉사자 등록

기관×회차별 신규/재참여 인원 스냅샷 저장. 택1:

| 안 | 예시 |
|----|------|
| A | `PUT …/organization-applications/{id}/employee-volunteer-counts` |
| B | `POST …/programs/{programId}/employee-volunteer-registrations` |

행 최소: `organizationApplicationId`, `scheduleId`/`requestedScheduleId`, `newCount`, `returningCount`.

#### J-3-3. 삭제/제외 (일괄, 선택)

```http
POST /api/admin/programs/{programId}/participants/volunteers/bulk-remove
```

### J-4) FE가 이미 하는 일

- remote infinite query · sessions/기관명/PII additive 매핑
- 활동확인서: serial allocate + PDF (목록·상세)
- 등록·임직원: unavailable · **로컬 목록 patch 없음**
- temp-progress-volunteer mock **삭제**

### J-5) BE · QA 체크리스트

- [ ] VOLUNTEER participants ≥1 · `sessions[]` · `id1365` · 마스킹 contact/email 샘플
- [ ] `assignedOrganizationNames` 다건 → 목록 「기관 외 N개」 표기
- [ ] remote OFF → 빈 목록 + unavailable (임시 봉사자 mock 없음)
- [ ] 봉사자/임직원 등록 클릭 → unavailable (POST 구현 전)
- [ ] 활동확인서 1명 선택 → serial + PDF 다운로드

---

**Last updated:** 2026-09-17 (§J 참여 봉사자 목록 remote enrich · 등록 unavailable · mock 제거)
