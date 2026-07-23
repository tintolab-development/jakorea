# 회원 상세 — 미존재 API 백엔드 핸드오프

CMS **회원 상세 풀페이지**(`SCR_MEMBER`, `user-detail-fullpage-modal`) 연동을 위해 필요하나,  
**OpenAPI v9** (`openapi/backend.openapi.json`)에 **엔드포인트가 없는** API 목록입니다.

- 작성 기준일: 2026-06-26
- 프론트 remote 조건: `VITE_REAL_API_MODULES`에 `members` 포함
- 연동 명세: [members-api-integration-2026-07-23.md](./members-api-integration-2026-07-23.md)
- 기타 갭( DTO 필드·목록 필터 등): [members-api-backend-gaps-2026-07-23.md](./members-api-backend-gaps-2026-07-23.md)

---

## 범위·제외 기준

**포함**

- 회원 상세에서 UI가 동작하려면 **신규 HTTP path**가 필요한 항목
- `members` remote ON 이후에도 mock·「준비 중」으로 남아 있는 mutation·조회

**제외**

- 기존 GET/PATCH 응답·요청 **DTO 필드만 부족**한 항목 → 문서 말미 「DTO 확장」 참고
- OpenAPI에 **다른 도메인 path로 이미 존재**해 프론트 매핑만 필요한 항목 → 「기존 API 재사용」 참고
- settlement 모듈 미활성 시 mock 정산 ( `GET /api/settlements` 는 존재)

---

## 우선순위 요약

| 우선순위 | 건수 | 항목 |
|----------|------|------|
| **P0** | 2 | 관리자 권한 신청 워크플로, 소속 교사 재직 현황 변경 |
| **P1** | 5 | 코멘트 수정·삭제, 프로그램 역할 할당, 이력·담당 프로그램 삭제, 알림 재발송 |
| **P2** | 3 | 신청 건 출석·보고·과제 요약, 과제 제출·강의보고 이력 조회 (회원 상세 진입점) |

---

## P0 — 신규 API 필요

### 1. 관리자 권한 신청 (개인→관리자, 관리자 권한 variant)

| | |
|---|---|
| **화면** | `/admin/permission-requests` 관리자 탭, 회원 상세 `mode=permission` |
| **UI 요구** | 신청 목록, 승인, 반려, (선택) 알림 재발송 |
| **현재 OpenAPI** | `GET/POST /api/admin/instructor-role-requests/*` 만 존재. **관리자 권한 신청 전용 API 없음** |
| **프론트 임시 대응** | mock 목록 + 안내 배너 |

**제안 API**

| Method | Path (제안) | 용도 |
|--------|-------------|------|
| GET | `/api/admin/admin-permission-requests` | 신청 목록 (페이지·필터) |
| GET | `/api/admin/admin-permission-requests/{requestId}` | 신청 상세 (선택) |
| POST | `/api/admin/admin-permission-requests/{requestId}/approve` | 승인 |
| POST | `/api/admin/admin-permission-requests/{requestId}/reject` | 반려 |

**제안 응답 필드 (목록 item 최소)**

- `requestId`, `memberId`, `uuid`, `name`, `email`, `requestedRole` / `adminPermissionVariant`
- `status` (`PENDING` / `APPROVED` / `REJECTED`)
- `submittedAt`, `reviewedAt`, `rejectReason`

---

### 2. 소속 교사 재직 현황 변경

| | |
|---|---|
| **화면** | 학교(SCHOOL) 회원 상세 > 기본정보 > 소속 교사 목록 > 재직 현황 드롭다운 |
| **현재 OpenAPI** | `GET /api/admin/users/{memberId}/affiliated-teachers` 만 존재 |
| **프론트 임시 대응** | 로컬 state만 변경, 서버 저장 없음 + 안내 배너 |

**제안 API**

| Method | Path (제안) | 용도 |
|--------|-------------|------|
| PATCH | `/api/admin/users/{memberId}/affiliated-teachers/{teacherMemberId}/employment-status` | 재직 현황 변경 |

**제안 요청 body**

```json
{
  "employmentStatus": "ACTIVE | ON_LEAVE | TRANSFERRED | RESIGNED"
}
```

`SchoolAffiliatedTeacherRow.employmentStatus`·`teacherEmploymentStatusEditable` 스키마와 enum 정합 필요.

---

## P1 — 신규 API 필요

### 3. 관리자 코멘트 수정·삭제

| | |
|---|---|
| **화면** | 회원 상세 > 관리자 코멘트 (`screenCode: SCR_MEMBER`) |
| **현재 OpenAPI** | `GET/POST /api/admin/users/{memberId}/comments` |
| **갭** | 등록(POST)만 가능. 수정·삭제 path 없음 |

**제안 API**

| Method | Path (제안) | 용도 |
|--------|-------------|------|
| PATCH | `/api/admin/users/{memberId}/comments/{commentId}` | 코멘트 수정 |
| DELETE | `/api/admin/users/{memberId}/comments/{commentId}` | 코멘트 삭제 |

---

### 4. 관리자 회원 프로그램 역할(PM 등) 할당

| | |
|---|---|
| **화면** | 관리자(ADMIN) 회원 상세 > 프로그램 담당 이력 (`user.programRoles` 기반 필터) |
| **현재 OpenAPI** | `GET /api/admin/users/{memberId}/admin-programs` (조회만). member 단위 programRoles mutation 없음 |
| **프론트 임시 대응** | mock `programRoles` |

**제안 API (택1)**

**A. 회원 단위**

| Method | Path (제안) | 용도 |
|--------|-------------|------|
| GET | `/api/admin/users/{memberId}/program-roles` | 프로그램별 역할 목록 |
| PUT | `/api/admin/users/{memberId}/program-roles` | 역할 일괄 저장 |

**B. 프로그램 단위**

| Method | Path (제안) | 용도 |
|--------|-------------|------|
| PUT | `/api/admin/programs/{programId}/admin-assignments/{adminMemberId}` | 담당자·역할 할당/변경 |
| DELETE | `/api/admin/programs/{programId}/admin-assignments/{adminMemberId}` | 담당 해제 |

---

### 5. 프로그램 신청·참여 이력 삭제

| | |
|---|---|
| **화면** | 회원 상세 > 프로그램 이력 탭 > 선택 행 삭제 |
| **현재 OpenAPI** | `GET .../applications`, `GET .../program-history` 만 존재 |
| **프론트 임시 대응** | 로컬 state 삭제 또는 no-op |

**제안 API**

| Method | Path (제안) | 용도 |
|--------|-------------|------|
| DELETE | `/api/admin/users/{memberId}/applications/{applicationId}` | 신청 이력 삭제 또는 취소 처리 |
| DELETE | `/api/admin/users/{memberId}/program-history/{participantId}` | 참여·봉사 이력 삭제 |

비즈니스 규칙(진행 중 삭제 불가 등)은 409 + 메시지로 명시 요청.

---

### 6. 관리자 담당 프로그램 이력 삭제

| | |
|---|---|
| **화면** | 관리자 회원 상세 > 프로그램 담당 이력 > 삭제 |
| **현재 OpenAPI** | `GET /api/admin/users/{memberId}/admin-programs` 만 존재 |
| **프론트 임시 대응** | 로컬 state 삭제 |

**제안 API**

| Method | Path (제안) | 용도 |
|--------|-------------|------|
| DELETE | `/api/admin/users/{memberId}/admin-programs/{programId}` | 담당 프로그램 해제 |

또는 #4-B `admin-assignments` DELETE 와 통합 가능.

---

### 7. 권한 승인 알림 재발송

| | |
|---|---|
| **화면** | 회원 상세(permission 모드) > 승인 완료·반려 후 「알림 재발송」 |
| **현재 OpenAPI** | resend / notify 관련 path 없음 |
| **프론트 임시 대응** | `준비중 입니다.` alert |

**제안 API**

| Method | Path (제안) | 용도 |
|--------|-------------|------|
| POST | `/api/admin/instructor-role-requests/{requestId}/resend-notification` | 강사 권한 신청 알림 재발송 |
| POST | `/api/admin/admin-permission-requests/{requestId}/resend-notification` | 관리자 권한 신청 알림 재발송 (#1 연동) |

---

## P2 — 신규 API 필요 (보조 모달·테이블 enrichment)

회원 상세 프로그램 이력 테이블·모달이 기대하는 데이터.  
프로그램 진행현황(`SCR_PROGRESS`) API로 대체할 경우 **매핑표** 제공으로 신규 path 생략 가능.

### 8. 신청 건별 출석·강의보고·과제·담당자 요약

| | |
|---|---|
| **화면** | 프로그램 이력 탭 컬럼: `lectureAttendance`, `hasLectureReportSubmission`, `hasAssignmentSubmission`, `managerName` |
| **현재 OpenAPI** | `MemberApplicationHistoryResponse` / `MemberProgramHistoryResponse`에 UI 전용 필드 없음 |
| **프론트 임시 대응** | remote 시 `-` / 비활성, mock 모드만 값 표시 |

**제안 (택1)**

| 방식 | 내용 |
|------|------|
| **A. DTO 확장** | `GET .../applications`, `GET .../program-history` 응답 item에 필드 추가 |
| **B. 신규 path** | `GET /api/admin/users/{memberId}/applications/{applicationId}/enrollment-summary` |

**제안 필드**

- `lectureAttendance` (예: `"3/4"`)
- `hasLectureReportSubmission`, `hasAssignmentSubmission` (boolean)
- `managerName`

---

### 9. 과제 제출 내역 조회 (회원 상세 모달)

| | |
|---|---|
| **화면** | 프로그램 이력 > 과제 제출 모달 |
| **현재 OpenAPI** | 회원·신청 건 기준 과제 제출 목록 path 없음 (`form-submission-files` 다운로드만 존재) |

**제안 API**

| Method | Path (제안) | 용도 |
|--------|-------------|------|
| GET | `/api/admin/users/{memberId}/applications/{applicationId}/assignment-submissions` | 과제 제출 이력·파일 메타 |

---

### 10. 강의보고 제출 이력 조회 (회원 상세 모달)

| | |
|---|---|
| **화면** | 강사 강의 이력 > 강의보고 제출 이력 모달 |
| **현재 OpenAPI** | 프로그램 단위 `GET /api/admin/programs/{programId}/lecture-reports` 등은 있으나, **회원 상세 행(applicationId)에서 바로 호출할 path 없음** |

**제안 API**

| Method | Path (제안) | 용도 |
|--------|-------------|------|
| GET | `/api/admin/users/{memberId}/applications/{applicationId}/lecture-reports` | 해당 신청·배정 건 강의보고 이력 |

---

## 기존 OpenAPI 재사용 가능 (신규 path 불필요)

프론트에서 `listMemberApplications` 응답의 `applicationId`·`applicationType`으로 아래 API를 호출하는 **매핑표**만 있으면 신규 path 없이 연동 가능합니다.

| 회원 상세 기능 | 기존 OpenAPI |
|----------------|--------------|
| 강사 권한 박탈 | `POST /api/admin/instructors/{instructorId}/revoke` |
| 수료증·활동인증서 일괄 발급 | `POST /api/admin/certificates/issues` |
| 신청 진행상태 변경 (유형별) | `POST /api/admin/applications/individuals\|instructors\|organizations\|volunteers/{applicationId}/*` |
| 강의 출석 | `PUT /api/admin/program-schedules/{scheduleId}/attendances`, `POST .../program-execution/programs/{programId}/attendances:bulk-upsert` 등 |
| 강사 정산 목록 | `GET /api/settlements?instructorMemberId=` |
| 정산 invoice 상세 | `GET /api/admin/settlements/{settlementId}` |
| 회원 탈퇴·삭제 | `POST /api/admin/users/{memberId}/delete` |
| 동의서 문서 열기 | `GET /api/public/terms-documents/{termsType}/current` |
| 개인정보 마스킹 해제 | `POST /api/admin/users/{memberId}/privacy/unmask` |

**요청**: `applicationType` → 위 applications 하위 path 매핑표를 OpenAPI description 또는 별도 문서로 명시해 주세요.

---

## DTO 확장만 필요 (신규 path 아님)

| 항목 | 기존 API | 필요 사항 |
|------|----------|-----------|
| 학교 기관 정보 | `GET/PATCH /api/admin/users/{memberId}` | `MemberDetailResponse`에 `schoolInfo` (기관명·주소·직책) nested |
| 강사 이력서·계좌 | `GET .../instructor-profile`, `PATCH .../{memberId}` | 계좌·학력 상세·자격증·수상 배열 |
| 정산 list 기관명 | `GET /api/settlements` | `SettlementListItemResponse.institutionName` 등 |
| consentType / external provider | `GET .../consent-records`, `GET .../external-identifiers` | enum·provider 값 문서화 |

---

## 프론트 코드 참고

| 역할 | 경로 |
|------|------|
| 회원 상세 모달 | `pages/users/user-detail-fullpage-modal.tsx` |
| mock 배너·미연동 구간 | `features/user/detail/ui/member-detail-mock-data-banner.tsx`, `user-programs-section.tsx`, `user-detail-fullpage-basic-tab-content.tsx` |
| 진행상태 mock mutation | `features/user/detail/lib/use-user-detail-controller.ts` (`handleProgressStatusChange`) |
| OpenAPI subset | `openapi/members.openapi.json` |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-26 | 회원 상세 미존재 API 목록 초안 (OpenAPI v9 기준) |
