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
| 강사 배정 | list/create/cancel/representative | ✅ | ✅ (progress remote) | waiting 전용 API 없음 |

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
| 참여 기관 | participants ORGANIZATION enrich | `materialAssignmentStatus` 포함 | ⚠️ 학년·교재·지역 부족 |
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
| 강의 출석 내역 | ✅ attendances | ❌ 로컬 모달 |
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

**C-2-6. 강의 출석 (P1)** — row `attendanceSummary` + member/roster 기준 lecture-attendance 계약

**C-2-7. Excel template/import (P2)** — CMS 툴바 공식 경로·invalidate 기준 문서화

### C-3) FE가 이미 하는 일

- GET roster 바인딩 · PUT 전체 rows · 마스킹 phone/email 미전송 · 클라 필터

### C-4) BE 체크리스트

- [ ] 수동 PUT `sourceFileObjectId` 없이 200
- [ ] import는 file id 필수
- [ ] gender·notes·출석·초상권·수료증 subject 정책

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
| **배정 대기 전용 API** | ❌ | ⚠️ 승인 강사 × 기관 sessions 임시 합성 |

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

**Last updated:** 2026-09-17 (참여 기관 상세·학생 명단·강사 배정 문서 본 SSOT로 통합)
