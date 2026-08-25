# 회원 상세 — 프로젝트 참여 이력 UI·API 정합성 — 백엔드 전달

**작성일:** 2026-08-25  
**문서 유형:** **백엔드 수정 요청** (FE 1차 연동 후 UI·API 정합성 재검토 결과)  
**우선순위:** P0/P1 혼합 — §3 **서버 수정 요청 목록** SSOT  
**요청 대상:** Members API · (연계) Programs · Forms-surveys 파일 다운로드  

> **강사 회원 상세** (프로젝트 참여 이력 · 정산 현황) BE 보완은 **[통합 SSOT](./instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md)** 를 우선 참고하세요. 본 문서 REQ-001~016 = 통합 문서 PH-001~016과 동일합니다.
**관련 FE:** `member-program-lecture-history.tsx` · `enrich-member-applications-with-enrollment.ts` · `map-member-assignment-submissions.ts` · `lecture-attendance-modal.tsx` · `assignment-submission-modal.tsx`  
**관련 명세:** [lecture-attendance-modal-spec.md](../../design/lecture-attendance-modal-spec.md) · [cms-table-bulk-download-api-backend-handoff.md](../cms-table-bulk-download-api-backend-handoff.md) §5.1 #9  
**OpenAPI subset:** `apps/cms/openapi/members.openapi.json`

---

## 1. 요약 (재확인 결론)

**질문:** 수강 목록 보강, 행 클릭 → 프로그램 상세, **수강 이력** 출석·과제 모달에 필요한 데이터가 **모두** 서버로 조회 가능하고 UI와 **세부 항목까지** 일치하는가? (봉사 탭은 §2·§4.4 — 출석·과제 **열 없음**)

**답:** **아니오.**  
2026-08-25 FE 1차 remote 연동 이후 재검토한 **부분 일치(◐)·불일치(✗)** 항목은 **§3 서버 수정 요청 목록**에 BE 수정·신규 API로 정리했습니다. BE 회신·구현 완료 전까지 FE는 축소 UI(집계만·읽기 전용·placeholder)를 유지합니다.

| 영역 | 서버 조회 | UI 세부 일치 | BE 수정 요청 ID |
|------|-----------|--------------|-----------------|
| 목록(수강) — `app-*` 신청 건 | ◐ | ◐ | REQ-001, REQ-002, REQ-003, REQ-004 |
| 목록(수강) — `part-*` program-history 건 | ◐ | ✗ | REQ-005 (수강 scope) |
| 목록(봉사) — `ph-*` | ◐ | ◐ | REQ-005 (봉사 scope), REQ-001, REQ-002 |
| 행 클릭 → 프로그램 상세 | ✓ | ✓ | — (수정 불필요) |
| 출석 모달 (**수강 이력**) | ◐ | ✗ | REQ-007, REQ-008 |
| 과제 모달 (**수강 이력**) | ◐ | ✗ | REQ-009, REQ-010, REQ-011, REQ-012 |
| 봉사 탭 · 증명서 일괄 발급 | ◐ | ◐ | REQ-014 (ZIP 수령) |

범례: ✓ 일치 · ◐ 부분 일치 · ✗ 불일치

---

## 2. 화면 범위

- **경로:** CMS 회원 목록 → 일반(개인) 회원 상세 풀페이지 → LNB **프로젝트 참여 이력**
- **하위 탭:** 프로그램 수강 이력(`studentEnrollment`) · 봉사 프로그램 참여 이력(`volunteerProgram`)
- **테이블 컴포넌트:** `MemberProgramLectureHistory` (`mode=studentEnrollment` | `volunteerProgram`)
- **강사 겸직 enrollment 테이블:** `EnrollmentTableView` — 진행 현황 dropdown (REQ-013)

### 2.1 탭별 UI (2026-08-25 FE 확정)

| 탭 | 테이블 열 | 툴바 (좌→우) |
|----|-----------|--------------|
| **수강** `studentEnrollment` | No. · 프로그램명 · 진행년도 · 프로그램 진행 현황 · **강의 출석 내역** · **과제 제출 내역** · 담당자 | 이력 삭제 · 수료증/참여인증서 발급 · 엑셀 |
| **봉사** `volunteerProgram` | No. · 프로그램명 · 진행년도 · 프로그램 진행 현황 · 담당자 (**출석·과제 열 없음**) | 이력 삭제 · 활동인증서 발급 · 수료증/참여인증서 발급 · 엑셀 |

- 봉사 탭 증명서: `POST .../certificates/issues/bulk` — 활동 `certificateType=ACTIVITY`, 수료·참여 `COMPLETION` (발급 API는 연동됨, **ZIP 수령**은 REQ-014).
- 출석·과제 **모달** 진입 UI는 **수강 이력만** 해당. 봉사 탭에서는 해당 API 요구 없음(§4.4).

---

## 3. 서버 수정 요청 목록 (SSOT)

> FE 재검토(2026-08-25)에서 **◐ 부분 일치·✗ 불일치**로 분류된 항목만 포함.  
> BE는 아래 ID 단위로 회신·OpenAPI 반영·스모크 완료 후 FE가 §12 후속 연동.

| ID | 우선 | 구분 | 화면/기능 | 현재 (갭) | **서버 수정 요청** | 완료 기준 (AC) |
|----|------|------|-----------|-----------|-------------------|----------------|
| **REQ-001** | P1 | ◐ | 수강 목록 · 진행년도 | `listMemberApplications` / `listMemberProgramHistory`에 프로그램 시작 연도 없음 → FE mock `programService` 의존, remote `-` | 목록 item에 `programStartDate`(ISO) 또는 `progressYear`(int) 추가. Programs API 재조회 없이 목록만으로 `YYYY년` 표시 가능해야 함 | 동일 memberId 목록 조회만으로 모든 행에 진행년도 표시 |
| **REQ-002** | P1 | ◐ | 수강 목록 · 진행 현황 배지 | `applicationStatus` / `finalResultStatus` / `participantStatus` → FE 단방향 매핑. CMS `ProgramEnrollmentDisplayStatus` 전체 enum과 BE 값 SSOT 미정 | OpenAPI·handoff에 **CMS 배지 ↔ BE status enum 매핑表** 확정·문서화. 누락 상태값 있으면 BE 필드 추가 | FE mock과 동일 배지가 staging 데이터에서 재현됨 |
| **REQ-003** | P0 | ◐ | 수강 목록 · `app-*` 출석/과제/담당자 | `enrollment-summary`는 **신청 건만** N+1. 목록 API 자체에 필드 없음 | **택1:** (A) `listMemberApplications` item에 `lectureAttendance`, `hasAssignmentSubmission`, `managerName` 포함 (enrollment-summary와 동일 SSOT) · (B) 목록 pagination 내 bulk summary endpoint | `app-*` 행: 목록 1회(또는 bulk 1회)로 출석 링크·과제 버튼·담당자 표시. N+1 제거 가능 |
| **REQ-004** | P2 | ◐ | 수강 목록 · 연도 필터 | 테이블 필터 `year`가 program mock 연도 사용 | REQ-001 필드 기준 server-side filter (`year` query) 또는 FE client filter 가능 수준 문서화 | 필터 선택 시 API 결과와 UI 건수 일치 |
| **REQ-005** | **P0** | ✗ / ◐ | 수강 `part-*` · 봉사 `ph-*` 목록 | `enrollment-summary` path가 `applicationId` 전제 → **participant 행 enrich 불가**. 수강 `part-*`: 출석·과제·담당자 placeholder. 봉사 `ph-*`: **담당자 `-`만** 갭(출석·과제 열 UI 제거됨) | **택1:** (A) `GET .../program-history/{participantId}/enrollment-summary` · (B) `listMemberProgramHistory` item 필드 확장 — **수강 `part-*`:** `lectureAttendance`, `hasAssignmentSubmission`, `managerName`, `linkedApplicationId?` · **봉사 `ph-*`:** 최소 `managerName` (+ 공통 REQ-001/002) · (C) 회원 참여 이력 **단일 SSOT 목록 API** | **수강 `part-*`:** `app-*`와 동일 출석·과제·담당자 UI. **봉사 `ph-*`:** 담당자 non-empty (해당 fixture) |
| **REQ-006** | P0 → **Deferred** | ✗ | ~~봉사 · 과제 모달 진입~~ | 2026-08-25 UI: **봉사 탭 과제 열 제거** → 「내역 보기」 진입점 없음 | **현 UI 기준 BE 작업 불필요.** 수강 `part-*` 과제 모달은 REQ-005 `linkedApplicationId` 또는 participant assignment path로 **별도 협의** | — (봉사 탭 AC 해당 없음) |
| **REQ-007** | **P0** | ✗ | 출석 모달 · 회차별 그리드 | `enrollment-summary.lectureAttendance`는 **집계 문자열만**. [명세](../../design/lecture-attendance-modal-spec.md) `sessions[]` 없음 | **신규** `GET .../applications/{applicationId}/lecture-attendance` (및 participant variant) — `attendedCount`, `heldCount`, `sessions[{roundNumber, status}]`. status: `ATTENDED` \| `ABSENT` \| `LATE` \| `NOT_HELD` | 모달 회차 테이블이 mock과 동일 구조. FE 축소 모드 해제 |
| **REQ-008** | P1 | ✗ | 출석 모달 · **수강 `part-*`** | REQ-007이 applicationId만 지원 | REQ-007을 `participantId` path/query로 확장 (REQ-005와 동일 participant 식별) | **수강 이력** program-history 행에서 출석 모달 동일 UX (**봉사 탭 해당 없음**) |
| **REQ-009** | **P0** | ✗ | 과제 모달 · 테이블 열 | `MemberAssignmentSubmissionResponse`에 UI 열 대응 필드 부족. `responseStatus` 단일 필드로 강의진행·제출현황 **이중 매핑**(부정확). `submittedAt`을 교육일자 열에 오매핑 | 스키마 **확장** — `roundNumber`, `teamRole`, `teamName`, `educationSessionLabel`(또는 date+round), `assignmentPeriodStart/End`, **`lectureProgress`**, **`submissionStatus`** 분리, `contextType` | 과제 모달 7개 열 mock과 1:1. `responseStatus` 단독 사용 금지 |
| **REQ-010** | **P0** | ✗ | 과제 모달 · 「과제 보기」 | `fileCount`만 있고 `submissionFileIds` 없음. forms-surveys download API 연결 불가 | `submissionFileIds: number[]` (또는 `{fileId,fileName}[]`) 응답 추가 | `fileCount>0` → `GET /api/admin/form-submission-files/{id}/download` 연동 가능 |
| **REQ-011** | P0 | ✗ | 과제 모달 · 일괄 다운로드 | UI 「과제 일괄 다운로드」 stub | [bulk-download handoff](../cms-table-bulk-download-api-backend-handoff.md) §5.1 #7 — `POST .../assignment-submissions/bulk-download` ZIP/job | 선택 회원·신청 기준 ZIP 1회 다운로드 |
| **REQ-012** | P2 | ✗ | 과제 모달 · 역할 변경 | mock만 `PATCH team-role` | (선택) `PATCH .../assignment-submissions/{submissionId}/team-role` | 드롭다운 변경 persist |
| **REQ-013** | P1 | ✗ | enrollment 테이블 · 진행 현황 변경 | Dropdown 변경 mock only, **PATCH 없음** | `PATCH .../applications/{applicationId}/enrollment-status` (또는 동등) — CMS display status ↔ BE status 전이 규칙 | 변경 후 목록/상세 재조회 시 배지 반영 |
| **REQ-014** | P0 | ✗ | 수료증/활동인증서 · 다운로드 | `POST .../certificates/issues/bulk` **발급만** | [bulk-download handoff](../cms-table-bulk-download-api-backend-handoff.md) §5.1 #9 — 발급 후 ZIP | 일괄 발급 UI → 파일 수령 |
| **REQ-015** | P1 | ✗ | 강사 이력 · 강의보고서 | `GET .../lecture-reports` 존재, bulk download·FE 미연동 | member-scoped lecture-reports 응답 스키마 확정 + bulk-download | 강의보고서 모달·일괄 다운로드 |
| **REQ-016** | P2 | ✗ | 출석 · 정정/저장 | mock 「출석 정정」 | `PATCH` 또는 program-progress `ScheduleAttendanceBulkUpsert`와 역할·path SSOT | CMS 회원 상세에서 정정 저장 (프로그램 진행현황 API 재사용 가능 여부 BE 판단) |

### 3.1 BE 회신 요청 형식

각 REQ에 대해 아래 중 하나로 회신:

- **Accepted** — 구현 일정·OpenAPI PR 링크
- **Alternative** — 대체 API path/필드 (REQ ID 유지, AC 재협의)
- **Deferred** — 사유·대체 UX (FE 축소 모드 유지)
- **Rejected** — 사유 (기획 변경 필요 시 PM 협의)

### 3.2 OpenAPI 반영 체크

- [ ] `members.openapi.json` 스키마·example 갱신
- [ ] `MemberProgramHistoryResponse` / `MemberApplicationHistoryResponse` / `MemberEnrollmentSummaryResponse` / `MemberAssignmentSubmissionResponse` diff 첨부
- [ ] status enum ↔ CMS 배지 매핑表 (REQ-002) 동시 PR

---

## 4. UI 필드 ↔ API 매핑 (수강 이력 테이블) — 상세 · REQ 교차 참조

> **BE 수정 필요 항목은 §3 REQ ID를 따릅니다.**

### 4.1 공통 열

| UI 열 | UI 기대 | 현재 API | FE 처리 | 정합 | **BE 수정 요청** |
|-------|---------|----------|---------|------|------------------|
| No. | 행 번호 | — | 클라이언트 | ✓ | — |
| 프로그램명 | 프로그램 제목 | `listMemberApplications.programName` · `listMemberProgramHistory.programName` | `customFields.programName` | ✓ | — |
| 진행년도 | `YYYY년` (프로그램 시작 연도) | **목록 응답에 없음** | `programService` mock 폴백 → remote `-` | ✗ | **REQ-001**, REQ-004 |
| 프로그램 진행 현황 | `ProgramEnrollmentDisplayStatus` 배지 | status 필드들 | FE 매핑 | ◐ | **REQ-002** |
| 담당자 | `"이름 매니저"` | `enrollment-summary.managerName` | **`app-*`만** N+1 | ◐ | **REQ-003**, **REQ-005** |

### 4.2 수강 이력 전용 열

| UI 열 | UI 기대 | 현재 API | FE 처리 | 정합 | **BE 수정 요청** |
|-------|---------|----------|---------|------|------------------|
| 강의 출석 내역 | `"출석수 / 총회차"` 링크 | `enrollment-summary.lectureAttendance` | **`app-*`만** enrich | ◐ | **REQ-003**, **REQ-005** |
| 과제 제출 내역 | `hasAssignmentSubmission` 시 「내역 보기」 | `enrollment-summary.hasAssignmentSubmission` | **`app-*`만** enrich | ◐ | **REQ-003**, **REQ-005** (수강 `part-*`) |

### 4.3 `part-*` (program-history 기반 수강 행) — **BE 수정 필수 (REQ-005)**

`mergeMemberApplicationsWithProgramHistory`로 `applications` + `program-history`(비봉사)가 합쳐집니다.  
행 ID: `part-{participantId}`.

| 문제 | 설명 | **BE 수정 요청** |
|------|------|------------------|
| enrollment-summary 미호출 | path가 `applicationId` 전제 | **REQ-005** |
| UI 거짓 표시 | 출석 `0/0`, 과제 disabled, 담당자 `-` | REQ-005 AC |

§3 REQ-005 택1 옵션 — BE 택1 확정 후 OpenAPI PR:

1. `GET .../program-history/{participantId}/enrollment-summary`  
2. `listMemberProgramHistory` item 필드 확장  
3. 회원 참여 이력 단일 SSOT 목록 API  

### 4.4 봉사 이력 탭 — **BE 수정 (REQ-005 봉사 scope, REQ-001/002)**

> **2026-08-25 UI:** 강의 출석 내역·과제 제출 내역 **열 제거**. REQ-006(봉사 과제 모달)·REQ-008(봉사 출석)은 **현 UI 비대상**.

| UI 열 | UI 기대 | 현재 API | FE (remote) | 정합 | **BE 수정 요청** |
|-------|---------|----------|-------------|------|------------------|
| (§4.1 공통 열) | No. · 프로그램명 · 진행년도 · 진행 현황 | program-history + mock 폴백 | FE 매핑 | ◐ | **REQ-001**, **REQ-002** |
| 담당자 | 매니저명 | program-history에 없음 | `-` | ✗ | **REQ-005** (봉사 `ph-*` — `managerName`만) |

**봉사 탭 툴바 (BE 연동 참고):**

| 버튼 | API | 비고 |
|------|-----|------|
| 이력 삭제 | `DELETE .../program-history/{participantId}` | 연동됨 |
| 활동인증서 발급 | `POST .../certificates/issues/bulk` (`ACTIVITY`) | 발급 연동 · ZIP **REQ-014** |
| 수료증/참여인증서 발급 | 동일 bulk (`COMPLETION`) | 발급 연동 · ZIP **REQ-014** |
| 엑셀 | 클라이언트 export | API 불필요 |

---

## 5. 행 클릭 → 프로그램 상세 — **수정 불필요**

| UI 동작 | 필요 데이터 | API | 정합 |
|---------|-------------|-----|------|
| 행 클릭 시 CMS 프로그램 관리 상세(info 탭) 이동 | `programId` | `listMemberApplications.programId` · `listMemberProgramHistory.programId` | ✓ |

FE: `getProgramAdminDetailInfoTabUrl(record.programId)` — **추가 API 불필요.**

---

## 6. 출석 모달 — **BE 수정 필수 (REQ-007, REQ-008, REQ-016)**

### 6.1 UI가 요구하는 데이터 (명세 SSOT)

| UI 영역 | 필드 | 형식 / 비고 |
|---------|------|-------------|
| 상단 | 학생명 | 회원 상세 `displayUser.name` (Members API 아님) |
| 상단 | 참석률 | `{출석}/{진행}` + "(강의 진행 회차 기준)" — mock은 `%`도 계산 |
| 본문 | 회차별 테이블 | `sessions[]`: `{ roundNumber, status: attended \| absent \| late \| not_held }` |
| 푸터 (mock) | 출석 정정 · 저장 | 회차별 PATCH |

### 6.2 현재 API (◐ — 집계만, **REQ-007** 미충족)

| API | 응답 | 사용처 |
|-----|------|--------|
| `GET .../applications/{applicationId}/enrollment-summary` | `lectureAttendance?: string` (집계 문자열만) | 목록 링크 + remote 모달 **집계만** |

**Members OpenAPI에 회원·신청 단위 `sessions[]` 조회 API 없음.**

### 6.3 FE interim (REQ-007 완료 전)

- `lectureAttendance` 집계만 파싱 · 회차 그리드·정정 숨김
- 배너: 출석 모달 집계값만 표시

### 6.4 서버 수정 요청 상세 — **REQ-007**

**신규 (제안):**

```
GET /api/admin/users/{memberId}/applications/{applicationId}/lecture-attendance
```

**응답 예시:**

```json
{
  "studentName": "김학생",
  "attendedCount": 2,
  "heldCount": 4,
  "sessions": [
    { "roundNumber": 1, "status": "attended" },
    { "roundNumber": 2, "status": "absent" },
    { "roundNumber": 3, "status": "not_held" },
    { "roundNumber": 4, "status": "late" }
  ]
}
```

- `status` enum: `ATTENDED` | `ABSENT` | `LATE` | `NOT_HELD` (FE 매핑表 제공)
- participant path: **REQ-008**
- 정정 PATCH: **REQ-016**

---

## 7. 과제 모달 — **BE 수정 필수 (REQ-009 ~ REQ-012)**

### 7.1 UI 테이블 열 (mock SSOT)

| UI 열 | mock 필드 | 기대 예시 |
|-------|-----------|-----------|
| 역할 | `teamRole` | 팀장 / 팀원 / 개인 (드롭다운 변경 가능) |
| 팀명 | `teamName` | `1조` 또는 `-` |
| 교육 진행 일자 및 교육 차시 | `educationDateLabel` | `2026. 01. 05 (월) \| 1차시` |
| 과제 제출 기간 | `assignmentPeriodLabel` | `26. 01. 01 (수) ~ 26. 01. 07 (화)` |
| 강의 진행 여부 | `lectureProgress` | `completed` / `scheduled` |
| 제출 현황 | `submissionStatus` | `submitted` / `not_submitted` / `scheduled` / `none` |
| 제출 파일 | `canViewAssignment` | true 시 「과제 보기」→ 미리보기 모달 |

푸터 「과제 일괄 다운로드」→ **REQ-011**

### 7.2 현재 API (✗ — **REQ-009** 미충족)

```
GET /api/admin/users/{memberId}/applications/{applicationId}/assignment-submissions
→ MemberAssignmentSubmissionResponse[]
```

| 필드 | OpenAPI | UI 대응 | 정합 | **BE 수정 요청** |
|------|---------|---------|------|------------------|
| `submissionId` | ✓ | row id | ✓ | — |
| `programId` | ✓ | (간접) | ✓ | — |
| `contextType` | ✓ | 미사용 | ◐ | REQ-009 |
| `responseStatus` | ✓ | 이중 매핑(부정확) | ✗ | **REQ-009** (분리 필드) |
| `submittedAt` | ✓ | 교육일자 열 오매핑 | ✗ | **REQ-009** |
| `fileCount` | ✓ | `canViewAssignment` | ◐ | **REQ-010** |
| `teamRole` / `teamName` | ✗ | mock만 | ✗ | **REQ-009** |
| `roundNumber` / session label | ✗ | index 가정 | ✗ | **REQ-009** |
| `assignmentPeriodStart/End` | ✗ | `-` 고정 | ✗ | **REQ-009** |
| `lectureProgress` | ✗ | 추론 | ✗ | **REQ-009** |
| `submissionFileIds[]` | ✗ | 미연동 | ✗ | **REQ-010** |

**과제 파일 다운로드:** forms-surveys `GET /api/admin/form-submission-files/{submissionFileId}/download` 는 존재하나, **assignment-submissions 응답에 file id 없음** → FE 연결 불가.

### 7.3 서버 수정 요청 상세 — **REQ-009** (스키마 확장)

```json
{
  "submissionId": 9001,
  "roundNumber": 1,
  "teamRole": "LEADER",
  "teamName": "1조",
  "educationDateLabel": "2026. 01. 05 (월) | 1차시",
  "assignmentPeriodStart": "2026-01-01",
  "assignmentPeriodEnd": "2026-01-07",
  "lectureProgress": "COMPLETED",
  "submissionStatus": "SUBMITTED",
  "submissionFileIds": [12001, 12002],
  "contextType": "HOMEWORK"
}
```

- UI 라벨: BE 문자열 vs ISO 날짜 — SSOT 확정 (REQ-002와 동일 방식)
- enum 매핑表 첨부

**REQ-010:** `submissionFileIds` → forms-surveys download  
**REQ-011:** bulk-download ZIP  
**REQ-012:** team-role PATCH (P2)

---

## 8. 기타 — **BE 수정 요청 (REQ-013 ~ REQ-015)**

| 기능 | UI | API | **BE 수정 요청** |
|------|-----|-----|------------------|
| 모집 신청 현황 변경 | enrollment dropdown | PATCH 없음 | **REQ-013** |
| 수료증/활동인증서 다운로드 | 수강: 수료·참여 / 봉사: **활동 + 수료·참여** 일괄 발급 UI | `POST .../issues/bulk` 발급만 | **REQ-014** (발급 후 ZIP) |
| 강의보고서 (강사 이력) | 모달·bulk | GET만·bulk 없음 | **REQ-015** |

---

## 9. 이미 연동된 API (수정 불필요 · 참고)

| Method | Path | FE 용도 |
|--------|------|---------|
| GET | `/api/admin/users/{memberId}/applications` | 수강/신청 이력 목록 |
| GET | `/api/admin/users/{memberId}/program-history` | program-history·봉사 이력 |
| GET | `.../applications/{applicationId}/enrollment-summary` | `app-*` 출석·과제·담당자 enrich |
| GET | `.../applications/{applicationId}/assignment-submissions` | 과제 모달 (부분) |
| DELETE | `.../applications/{applicationId}` | 이력 삭제 (신청) |
| DELETE | `.../program-history/{participantId}` | 이력 삭제 (참여) |
| POST | `/api/admin/certificates/issues/bulk` | 증명서 일괄 **발급** (participantId) |

---

## 10. 구현 우선순위 (§3 REQ 기준)

### P0 — UI 거짓·누락 데이터 제거 (즉시)

| REQ | 요약 |
|-----|------|
| REQ-003 | `app-*` 목록 enrich N+1 제거 또는 목록 필드 inline |
| REQ-005 | 수강 `part-*` 출석·과제·담당자 · 봉사 `ph-*` **담당자** |
| ~~REQ-006~~ | *(Deferred — 봉사 탭 과제 열 제거)* |
| REQ-007 | 출석 회차별 `sessions[]` (**수강 이력**) |
| REQ-009 | 과제 모달 스키마 확장 |
| REQ-010 | `submissionFileIds` |
| REQ-011 | 과제 ZIP bulk-download |
| REQ-014 | 증명서 ZIP bulk-download |

### P1 — 명세·운영 완성

| REQ | 요약 |
|-----|------|
| REQ-001 | 목록 `programStartDate` / `progressYear` |
| REQ-002 | status ↔ CMS 배지 매핑表 |
| REQ-008 | 출석 API participant variant (**수강 `part-*`**) |
| REQ-013 | enrollment status PATCH |
| REQ-015 | 강의보고서 bulk |

### P2

REQ-004, REQ-012, REQ-016

---

## 11. BE 스모크 검증 (REQ별 AC)

- [ ] **REQ-003/005:** `app-*`·`part-*` 목록 출석/과제/담당자 non-empty · `ph-*` **담당자** non-empty (해당 fixture)
- [ ] **REQ-001:** 목록만으로 진행년도 표시
- [ ] **REQ-002:** 배지 매핑表 staging 샘플 100% 일치
- [ ] **REQ-007/008:** 출석 모달 `sessions[]` = UI 회차 수
- [ ] **REQ-009/010:** 과제 모달 7열 + file download
- [ ] **REQ-011/014:** ZIP bulk-download E2E
- [ ] **REQ-013:** enrollment PATCH 후 재조회 반영

---

## 12. FE 후속 (REQ 완료 후)

| REQ | FE 파일 |
|-----|---------|
| REQ-003, 005 | `enrich-member-applications-with-enrollment.ts`, `member-program-lecture-history.tsx` |
| REQ-001, 004 | `member-program-lecture-history.tsx` (진행년도·필터) |
| REQ-002 | `map-member-application-history.ts`, `map-member-program-history.ts` |
| REQ-007, 008, 016 | `lecture-attendance-modal.tsx` |
| REQ-009, 010, 011, 012 | `map-member-assignment-submissions.ts`, `assignment-submission-modal.tsx`, `assignment-preview-modal.tsx` |
| REQ-013 | `enrollment-table-view.tsx`, `use-user-detail-controller.ts` |
| REQ-014 | `member-program-lecture-history.tsx`, certificates client |
| REQ-015 | `lecture-report-submission-history-modal.tsx` |

---

**Last updated:** 2026-08-25 (봉사 탭 UI — 출석·과제 열 제거, 툴바·REQ-005/006/008 scope 반영)
