# 학교(organization) 상세 — 프로젝트 수강 이력 전용 API — 백엔드 전달

**작성일:** 2026-08-25  
**문서 유형:** **백엔드 신규 API 요청** (FE remote-only 연동 전제)  
**우선순위:** P0  
**요청 대상:** Members API · Organizations  
**관련 FE:** `school-participation-view.tsx` · `member-program-lecture-history.tsx` (`mode=schoolProgramParticipation`) · `useSchoolOrganizationProgramEnrollmentHistoryQuery`  
**OpenAPI subset:** `apps/cms/openapi/members.openapi.json`

---

## 0. 백엔드 전달 필수 묶음 (본 문서 위치)

> [members/README.md §필수 묶음](./README.md#회원-상세-이력정산--백엔드-전달-필수-묶음) 7개 문서를 **한 zip**으로 전달합니다.

| # | 문서 | 본 문서와의 관계 |
|---|------|------------------|
| 1~2 | member-program-history · instructor 통합 | (타 회원 유형) |
| 3 | **본 문서** | 학교 — `GET/POST .../program-enrollment-history` · **§3.2 bulk-delete** |
| 4 | admin-member-managed-program-history | 관리자 담당 이력 |
| 5~6 | bulk-download · settlement UI fields | (강사 ZIP·산출내역 — 학교 상세 **미해당**) |
| 7 | [cms-table-bulk-delete-api-backend-handoff.md](../cms-table-bulk-delete-api-backend-handoff.md) | **포함** — 소속 교사 일괄 탈퇴 **#16** (정책 확정 후 · 본 문서 §3.2와 별도) |

**학교 이력 삭제:** §3.2 `bulk-delete`가 SSOT. 개인/강사 이력 단건 DELETE는 [member-program-history §9](./member-program-history-ui-api-parity-backend-handoff-2026-08-25.md) 참고.

---

## 1. 요약

**질문:** CMS **학교 상세** LNB 「프로젝트 수강 이력」을 mock·회원(member) API 조합 없이 **remote 단일 API**로 조회·삭제할 수 있는가?

**답:** **아니오 (2026-08-25 기준).**  
학교 상세 주체는 `organization-{organizationId}`이며 **`memberId`가 없을 수 있음**. 기존 `listMemberApplications` · `listMemberProgramHistory` · `enrollment-summary` N+1 enrich는 **학교 organization scope에 부적합**합니다.

**FE 방향 (확정):**

- mock(`applicationService`, `programService`) **사용 금지**
- FE에서 여러 API를 조합하지 않고 **아래 전용 API 1회**로 목록·필터·삭제 처리
- BE 미구현 시 FE는 **빈 목록** (mock 폴백 없음)

---

## 2. 화면 범위

| 항목 | 값 |
|------|-----|
| 경로 | CMS 회원(학교) 목록 → **학교 상세** 풀페이지 → LNB **프로젝트 수강 이력** (1뎁스, 하위 탭 없음) |
| 주체 ID | `organizationId` (URL·User `id`: `organization-{n}`) |
| 테이블 mode | `schoolProgramParticipation` |
| 툴바 | 이력 삭제 · 엑셀 (**수료증 일괄 발급 UI 비노출** — 학교 정책) |

### 2.1 테이블 열 (UI 1:1)

| UI 열 | 설명 |
|-------|------|
| No. | 클라이언트 행 번호 |
| 프로그램명 | 프로그램 제목 |
| 진행년도 | `YYYY년` (프로그램 시작 연도) |
| 프로그램 진행 현황 | CMS `ProgramEnrollmentDisplayStatus` 배지 |
| 사업 분야 | 예: `디지털 리터러시`, `경제·금융` |
| 교육 학년 | 예: `3학년` (학교 신청 시 기록된 학년) |
| 담당자 | `"이름 매니저"` 형식 |

**미포함:** 강의 출석 · 과제 · 수료증 발급 (학교 상세 정책)

### 2.2 필터 (server-side 권장)

| query | UI 필터 |
|-------|---------|
| `title` | 프로그램명 (부분 일치) |
| `year` | 진행년도 (4자리 int) |
| `enrollmentStatus` | CMS `ProgramEnrollmentDisplayStatus` enum 값 |
| `managerName` | 담당자명 (부분 일치) |
| `page`, `size` | 페이지네이션 (FE 1차: `size=200` 고정 호출 가능) |

---

## 3. 신규 API

### 3.1 목록 조회

```
GET /api/admin/organizations/schools/{organizationId}/program-enrollment-history
```

**Path**

| 이름 | 타입 | 설명 |
|------|------|------|
| `organizationId` | `long` | 학교 organization PK |

**Query (optional)**

| 이름 | 타입 | 설명 |
|------|------|------|
| `page` | int | 0-based |
| `size` | int | 페이지 크기 |
| `title` | string | 프로그램명 |
| `year` | int | 진행년도 |
| `enrollmentStatus` | string | CMS 배지 enum (§4.2) |
| `managerName` | string | 담당자명 |

**Response:** `PageResponse<SchoolOrganizationProgramEnrollmentHistoryItemResponse>`

```json
{
  "items": [
    {
      "historyRowId": 1001,
      "organizationApplicationId": 880,
      "programId": 42,
      "programName": "2025 JA 경제교육",
      "progressYear": 2025,
      "enrollmentDisplayStatus": "EDUCATION_IN_PROGRESS",
      "businessArea": "경제·금융",
      "educationGrade": "3학년",
      "managerName": "홍길동 매니저",
      "deletable": true,
      "submittedAt": "2025-03-01T09:00:00+09:00"
    }
  ],
  "page": 0,
  "size": 200,
  "totalElements": 1,
  "totalPages": 1
}
```

**Item 필드**

| 필드 | 타입 | 필수 | UI |
|------|------|------|-----|
| `historyRowId` | long | ✓ | 행 ID · 삭제 path (FE: `org-enroll-{historyRowId}`) |
| `organizationApplicationId` | long | ◐ | 학교 신청 건 PK (감사·상세 연계용) |
| `programId` | long | ✓ | 행 클릭 → 프로그램 상세 |
| `programName` | string | ✓ | 프로그램명 열 |
| `progressYear` | int | ✓ | 진행년도 열 |
| `enrollmentDisplayStatus` | string | ✓ | 진행 현황 배지 (§4.2 CMS enum) |
| `businessArea` | string | ◐ | 사업 분야 (없으면 `-`) |
| `educationGrade` | string | ◐ | 교육 학년 (없으면 `-`) |
| `managerName` | string | ◐ | 담당자 |
| `deletable` | boolean | ◐ | FE 삭제 버튼 활성화 힌트 (진행 중 건은 `false`) |
| `submittedAt` | ISO-8601 | ◐ | 정렬·감사 |

> **Programs API 재조회 금지:** 목록 item만으로 테이블 전 열을 렌더해야 함 (`programService` mock 제거 목적).

### 3.2 이력 일괄 삭제

```
POST /api/admin/organizations/schools/{organizationId}/program-enrollment-history/bulk-delete
```

**Body**

```json
{
  "historyRowIds": [1001, 1002]
}
```

**Response:** `BulkActionResponse` (기존 members bulk 패턴 재사용)

| 필드 | 설명 |
|------|------|
| `successCount` | 삭제 성공 건수 |
| `failureCount` | 실패 건수 (선택) |

**비즈니스 규칙 (FE와 동일):**

- `enrollmentDisplayStatus`가 **진행 중**(`EDUCATION_IN_PROGRESS` 등 §4.3)인 건 삭제 불가 → `409` 또는 item별 failure
- 삭제 성공 후 목록 재조회 시 해당 row 미포함

---

## 4. CMS enum · 매핑

### 4.1 FE 행 ID

| FE `Application.id` | BE 식별 |
|---------------------|---------|
| `org-enroll-{historyRowId}` | `historyRowId` |

### 4.2 `enrollmentDisplayStatus` (CMS SSOT)

OpenAPI·handoff에 **아래 enum 문자열을 그대로** 반환해 주세요. FE는 추가 매핑 없이 배지에 사용합니다.

`ProgramEnrollmentDisplayStatus` (CMS `@/shared/constants/status`):

- `RECRUITING_STUDENTS`
- `RECRUITING_INSTRUCTORS`
- `RECRUITING_VOLUNTEERS`
- `PARTICIPANT_INSTRUCTOR_RECRUITING`
- `EDUCATION_SCHEDULED`
- `EDUCATION_IN_PROGRESS`
- `MATCHING_COMPLETED`
- `EDUCATION_BEFORE_TEXTBOOK`
- `EDUCATION_AFTER_TEXTBOOK`
- `PROGRAM_ENDED`
- `REJECTED`
- `WAITING`

> 개인 회원 이력 handoff [REQ-002](./member-program-history-ui-api-parity-backend-handoff-2026-08-25.md)와 **동일 매핑表**를 organization scope에도 적용.

### 4.3 삭제 차단 상태

FE `isProgramHistoryDeleteBlockedByDisplayStatus`와 동일 — **진행 중·모집 중** 상태는 삭제 모달에서 차단. BE도 `deletable=false` 또는 bulk-delete 거부로 이중 방어.

---

## 5. 기존 API와의 관계

| API | 학교 상세에서 |
|-----|----------------|
| `GET .../members/{memberId}/applications` | **사용 안 함** |
| `GET .../members/{memberId}/program-history` | **사용 안 함** |
| `GET .../applications/{applicationId}/enrollment-summary` | **사용 안 함** (N+1) |
| `GET .../organizations/schools/{organizationId}/teachers` | 소속 교사 탭 전용 (별도) |

---

## 6. FE 연동 (참고)

| 파일 | 역할 |
|------|------|
| `fetchSchoolOrganizationProgramEnrollmentHistoryRemote` | 목록 GET |
| `bulkDeleteSchoolOrganizationProgramEnrollmentHistoryRemote` | bulk-delete POST |
| `mapSchoolOrganizationProgramEnrollmentHistoryItems` | → `Application[]` (`customFields`에 UI 전용 필드) |
| `useSchoolOrganizationProgramEnrollmentHistoryQuery` | TanStack Query |
| `use-user-detail-controller.ts` | `role=SCHOOL` → member applications 쿼리 **disabled**, organization hook만 사용 |

---

## 7. 완료 기준 (AC)

- [ ] OpenAPI `members.openapi.json`에 path·schema·example 추가
- [ ] staging `organizationId` fixture로 목록 1회 GET → 테이블 7열 mock 없이 표시
- [ ] 필터 query 반영 시 건수·행 일치
- [ ] 진행 중 건 bulk-delete 거부 · 종료 건 삭제 후 목록 반영
- [ ] FE `VITE_REAL_API_MODULES`에 `members` 활성화 시 mock 호출 0건 (Network 탭)

---

## 8. BE 회신 요청

- **Accepted** — OpenAPI PR · 예상 일정
- **Alternative** — path/필드명 변경안 (FE mapper 동시 수정)
- **Deferred** — 사유 (FE 빈 목록 유지)

**Last updated:** 2026-08-25 (§0 필수 묶음 추가)
