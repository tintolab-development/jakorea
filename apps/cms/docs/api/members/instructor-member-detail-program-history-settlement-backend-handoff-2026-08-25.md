# CMS 강사 회원 상세 — 프로젝트 참여 이력 · 정산 현황 API 보완 (백엔드 핸드오프)

**작성일:** 2026-08-25  
**문서 유형:** **백엔드 수정 요청 SSOT** (강사 상세 LNB 한 범위 통합)  
**우선순위:** P0/P1 혼합 — §4 **서버 수정 요청 목록** SSOT  
**요청 대상:** Members API · Settlements API · (연계) Forms-surveys 파일 다운로드  
**화면 경로:** CMS → 회원 관리 → **강사** 상세 풀페이지 (`instructor_only` · `instructor_dual`)  
**OpenAPI:** `apps/cms/openapi/members.openapi.json` · `apps/cms/openapi/backend.openapi.json` (settlements)

> **범위:** 본 문서는 **강사 회원 상세**(`instructor_only` · `instructor_dual`)의 「프로젝트 참여 이력」 하위 3탭 + 「정산 현황」 탭만 다룹니다.  
> **순수 교사**(`school_teacher`)·**개인** 회원은 [member-program-history … §2.0](./member-program-history-ui-api-parity-backend-handoff-2026-08-25.md) — 강의 탭·정산 LNB **없음**.  
> 정산 관리 LNB 3화면 전체·학교(organization) 상세 등 **타 화면** 갭은 [settlement-api-backend-gaps.md](../settlement-api-backend-gaps.md) (본 필수 묶음 **미포함**).

---

## 0. 백엔드 전달 필수 묶음 (본 문서 위치)

> ZIP·산출내역·일괄삭제는 **별도 전달 항목이 아닙니다.** [members/README.md §필수 묶음](./README.md#회원-상세-이력정산--백엔드-전달-필수-묶음) 7개 문서를 **한 zip**으로 전달합니다.

| # | 문서 | 본 문서와의 관계 |
|---|------|------------------|
| 1 | [member-program-history-ui-api-parity-…](./member-program-history-ui-api-parity-backend-handoff-2026-08-25.md) | 전 회원 공통 REQ (PH-001~016 = REQ 동일) |
| 2 | **본 문서** | 강사·겸직 — PH-001~016 · **SET-001~009** |
| 3 | [school-organization-program-enrollment-history-…](./school-organization-program-enrollment-history-backend-handoff-2026-08-25.md) | 학교 수강 이력 |
| 4 | [admin-member-managed-program-history-…](./admin-member-managed-program-history-backend-handoff-2026-08-25.md) | 관리자 담당 이력 |
| 5 | [cms-table-bulk-download-api-backend-handoff.md](../cms-table-bulk-download-api-backend-handoff.md) | **포함** — PH-011(#7) · PH-014(#9) · PH-015(#8) · SET-006(#6) |
| 6 | [settlement-payment-order-detail-ui-fields-backend-handoff.md](../settlement-payment-order-detail-ui-fields-backend-handoff.md) | **포함** — **SET-005** 산출 내역서 [§4](../settlement-payment-order-detail-ui-fields-backend-handoff.md#4-산출-내역서-모달-목록-상세-보기) |
| 7 | [cms-table-bulk-delete-api-backend-handoff.md](../cms-table-bulk-delete-api-backend-handoff.md) | **포함** — 회원 이력 bulk-delete §5.1 **#14** |

**본 문서에 포함된 연계 요청 (§4):**

| ID | 연계 문서 | § |
|----|-----------|---|
| PH-011 | bulk-download | §5.1 **#7** |
| PH-014 | bulk-download | §5.1 **#9** |
| PH-015 | bulk-download + 본문 §4.1 | §5.1 **#8** + 단건 download |
| SET-005 | settlement-payment-order-detail-ui-fields | **§4** |
| SET-006 | bulk-download | §5.1 **#6** (ZIP). PDF 원문 PII는 SET-009 |
| SET-009 | settlement-payment-order-detail-ui-fields | **§1.2** unmask |

---

## 1. 요약

2026-08-25 FE remote 1차 연동 이후, 강사 상세 **프로젝트 참여 이력**(수강 · 강의 · 봉사)과 **정산 현황**에서 UI가 요구하는 데이터·동작과 API 간 **부분 일치(◐)·불일치(✗)** 항목을 아래 ID 단위로 정리했습니다.

| 영역 | 서버 조회 | UI 세부 일치 | BE 수정 ID |
|------|-----------|--------------|------------|
| 수강 이력 (`enrollment`) | ◐ | ◐ | PH-001 ~ PH-014 (§4.1) |
| 강의 이력 (`lecture`) | ◐ | ✗ | PH-001, PH-002, PH-005, **PH-015** |
| 봉사 이력 (`volunteer`) | ◐ | ◐ | PH-001, PH-002, PH-005, PH-014 |
| 정산 현황 (`payment`) | ◐ | ✗ | SET-001 ~ SET-009 (§4.2) |
| **팝업·모달** (§5) | ◐ | ✗ | PH-007~011, PH-015, SET-005~008 |

범례: ✓ 일치 · ◐ 부분 일치 · ✗ 불일치

**FE 정책 (BE 미완료 시):** 축소 UI(집계만 · placeholder `-` · 단건 fallback · 404 graceful) 유지.

**2026-08-25 재검토:** §5 — 강의보고서·과제·출석·**산출 내역서** 팝업 UI 열·필드 vs API 요청 vs **현재 FE wiring** 대조.  
**2026-08-25 FE 후속:** §5.6·§9 — 출석 집계 폴백 · 강의보고서 보기 onClick · 과제 단건 download wiring · remote 강의보고서 버튼 가드 · 정산 열 라벨·엑셀 반영.  
**2026-08-25 UI shell 정렬:** 과제·강의보고서 모달 `FilterTableLayout` · 7·5열 width SSOT · h40 액션 버튼 · 푸터 치수 (§5.2·§5.3).

---

## 2. 화면 범위

### 2.1 LNB 구조 (강사 상세)

| LNB | child key | UI 컴포넌트 | 비고 |
|-----|-----------|-------------|------|
| 프로젝트 참여 이력 | `enrollment` | `MemberProgramLectureHistory` `mode=studentEnrollment` | 출석·과제·수료증 툴바 |
| 프로젝트 참여 이력 | `lecture` | `MemberProgramLectureHistory` `mode=instructorLecture` | **강의보고서** 열 · 수료증 툴바 |
| 프로젝트 참여 이력 | `volunteer` | `MemberProgramLectureHistory` `mode=volunteerProgram` | 출석·과제 열 **없음** |
| 정산 현황 | — | `InstructorPaymentTab` | 목록·캘린더 · 산출 내역 모달 |

- `instructor_only`: 수강 · 강의 · 봉사 + 정산 현황  
- `instructor_dual`: 동일 + (기본 정보는 강사·교사 겸직 레이아웃)

### 2.2 탭별 테이블 · 툴바

| 탭 | 테이블 열 | 툴바 (좌→우) |
|----|-----------|--------------|
| **수강** | No. · 프로그램명 · 진행년도 · 진행 현황 · **강의 출석** · **과제 제출** · 담당자 | 이력 삭제 · 수료증/참여인증서 · 엑셀 |
| **강의** | No. · 프로그램명 · 진행년도 · 진행 현황 · **강의보고서 제출** · 담당자 | 이력 삭제 · 수료증/참여인증서 · 엑셀 |
| **봉사** | No. · 프로그램명 · 진행년도 · 진행 현황 · 담당자 | 이력 삭제 · 활동인증서 · 수료증/참여 · 엑셀 |
| **정산** | No. · 프로그램명 · **참여 기관명** · **교육 진행 일자** · 정산 현황 · **정산 신청 금액** · 산출 내역 | **엑셀 다운로드** · **지급조서 발급** (선택) · 필터 · 목록/캘린더 |

---

## 3. 이미 연동된 API (참고)

### 3.1 프로젝트 참여 이력 (Members)

| Method | Path | FE 용도 |
|--------|------|---------|
| GET | `/api/admin/users/{memberId}/applications` | 수강·강의 이력 목록 (`app-*`) |
| GET | `/api/admin/users/{memberId}/program-history` | program-history·봉사 (`part-*` / `ph-*`) |
| GET | `.../applications/{applicationId}/enrollment-summary` | `app-*` 출석·과제·담당자 enrich |
| GET | `.../applications/{applicationId}/assignment-submissions` | 과제 모달 (부분) |
| GET | `.../applications/{applicationId}/lecture-reports` | 강의보고서 모달 (부분) |
| DELETE | `.../applications/{applicationId}` · `.../program-history/{participantId}` | 이력 삭제 |
| POST | `/api/admin/certificates/issues/bulk` | 증명서 일괄 **발급** |

### 3.2 정산 현황 (Settlements)

| Method | Path | FE 용도 |
|--------|------|---------|
| GET | `/api/admin/settlements?instructorMemberId=` | 강사 scoped 정산 라인 목록 |
| GET | `/api/admin/settlements/{settlementId}` | 산출 내역 모달 상세 |
| GET | `/api/admin/settlements/statements` | **임시** statementId join (전량 fetch) |
| PATCH | `/api/admin/settlements/statements/{statementId}/confirm` | 지급조서 확인 (단건) |
| GET | `/api/admin/settlements/{settlementId}/payment-statement/download` | 지급조서 단건 다운로드 |

**FE wiring:** `instructor-member-settlements-remote.ts` · `instructor-payment-tab.tsx` · `instructor-invoice-modal.tsx` · `settlement-api-client.ts`

---

## 4. 서버 수정 요청 목록 (SSOT)

> ID **`PH-*`** = 프로젝트 참여 이력 (기존 [member-program-history … REQ-001~016](./member-program-history-ui-api-parity-backend-handoff-2026-08-25.md)와 1:1 대응)  
> ID **`SET-*`** = 강사 상세 정산 현황 전용

### 4.1 프로젝트 참여 이력 (`PH-*`)

| ID | 우선 | 탭 | 화면/기능 | 현재 (갭) | **서버 수정 요청** | AC |
|----|------|-----|-----------|-----------|-------------------|-----|
| **PH-001** | P1 | 공통 | 목록 · 진행년도 | 목록 API에 시작 연도 없음 → remote `-` | item에 `programStartDate` 또는 `progressYear` | 목록 1회로 `YYYY년` |
| **PH-002** | P1 | 공통 | 목록 · 진행 현황 배지 | FE 단방향 status 매핑 | CMS `ProgramEnrollmentDisplayStatus` ↔ BE enum **매핑表** | staging 배지 100% 일치 |
| **PH-003** | P0 | 수강 | `app-*` 출석/과제/담당자 | enrollment-summary **N+1** | (A) 목록 item inline 필드 · (B) pagination bulk summary | N+1 제거 |
| **PH-004** | P2 | 수강 | 연도 필터 | mock 연도 의존 | PH-001 기준 server `year` filter 또는 client filter 문서화 | 필터·건수 일치 |
| **PH-005** | **P0** | 수강·강의·봉사 | `part-*` / `ph-*` | summary path가 `applicationId` 전제 | (A) `GET .../program-history/{participantId}/enrollment-summary` · (B) 목록 필드 확장 · (C) 단일 SSOT 목록 | **수강·강의 `part-*`:** 출석·과제·담당자(해당 열) · **봉사 `ph-*`:** `managerName` |
| **PH-006** | Deferred | — | 봉사 과제 모달 | UI에서 과제 열 제거 | **BE 작업 불필요** | — |
| **PH-007** | **P0** | 수강 | 출석 모달 · 회차 그리드 | summary는 집계 문자열만 | **신규** `GET .../applications/{applicationId}/lecture-attendance` + `sessions[]` | [출석 모달 명세](../../design/lecture-attendance-modal-spec.md) |
| **PH-008** | P1 | 수강 | 출석 · `part-*` | PH-007 applicationId only | participant path/query 확장 (PH-005와 동일 식별) | program-history 행 출석 UX |
| **PH-009** | **P0** | 수강 | 과제 모달 · 7열 | `responseStatus` 이중 매핑 · 필드 부족 | 스키마 확장 — `roundNumber`, `teamRole`, `teamName`, `educationSessionLabel`, `assignmentPeriod*`, **`lectureProgress`**, **`submissionStatus`** 분리 | **7열 UI SSOT** 1:1 (§5.2) — `No.`~`교육 진행 현황`. `lectureProgress`/`submissionStatus`는 별도 열 아님 |
| **PH-010** | **P0** | 수강 | 과제 「과제 보기」 | `fileCount`만 | `submissionFileIds[]` (+ fileName) | forms-surveys download 연동 |
| **PH-011** | P0 | 수강 | 과제 일괄 다운로드 | UI stub / FE path 연결됨 | `POST .../assignment-submissions/bulk-download` ZIP | [bulk-download §5.1 #7](../cms-table-bulk-download-api-backend-handoff.md) |
| **PH-012** | P2 | 수강 | 과제 · 역할 변경 | mock only | (선택) `PATCH .../team-role` | persist |
| **PH-013** | P1 | 수강 | 진행 현황 dropdown | PATCH 없음 | `PATCH .../enrollment-status` | 재조회 반영 |
| **PH-014** | P0 | 수강·강의·봉사 | 증명서 일괄 | bulk **발급**만 | `POST .../certificates/issues/bulk-download` ZIP | [bulk-download §5.1 #9](../cms-table-bulk-download-api-backend-handoff.md) |
| **PH-015** | **P0** | **강의** | 강의보고서 모달 · 일괄 | GET 존재, **스키마·단건/bulk download 미정** | ① `MemberLectureReportResponse` 확장 (§5.3) · ② `reportFileIds[]` + 단건 download · ③ `POST .../lecture-reports/bulk-download` | 모달 **5열** + 보기 download + bulk ZIP |
| **PH-016** | P2 | 수강 | 출석 정정 | mock only | PATCH 또는 program-progress SSOT 재사용 | CMS 정정 저장 |

#### PH-015 상세 (강의 이력 전용)

**현재 OpenAPI `MemberLectureReportResponse`:** `reportId`, `programScheduleId`, `reportStatus`, `submittedAt` 등 — UI **5열**·파일 보기 **불충분**.

**UI 기대 (강의보고서 제출 내역 모달 — FE SSOT · 5열):**

| UI 열 | width | API 필드 (요청) | FE interim (`map-member-lecture-reports.ts`) |
|-------|-------|-----------------|---------------------------------------------|
| **교육 진행 일정** | 300 | `educationDateLabel` 또는 date+`roundNumber` | `submittedAt` + `programScheduleId` — **오매핑** |
| **강의보고서** 제출 기간 | 300 | `submissionPeriodStart`/`End` 또는 label | `submittedAt` 단일 — **오매핑** |
| 강의 진행 여부 | 120 | `lectureProgress` enum | `reportStatus` 추론 |
| 제출 현황 | 120 | `submissionStatus` enum | `reportStatus` 추론 |
| **강의보고서** (보기) | 300 | `reportFileIds[]` 또는 download URL | `canViewReport` + **onClick** h40 |

**Shell:** `FilterTableLayout` (`강의보고서 제출 목록` · `총 N건`) · 푸터 `닫기` **120px** · `강의보고서 일괄 다운로드` **200px** · h40 · `진행 예정` 행 opacity 0.5.

**제안 bulk-download:**

```
POST /api/admin/users/{memberId}/applications/{applicationId}/lecture-reports/bulk-download
Body: { "reportIds": number[] }
→ { "downloadEndpoint": "..." }  // ZIP
```

**제안 단건 download (PH-015 AC — 「강의보고서 보기」):**

```
GET /api/admin/users/{memberId}/applications/{applicationId}/lecture-reports/{reportId}/download
→ { "downloadEndpoint": "..." }  // PDF 등
```

**대안 (과제와 동일):** `MemberLectureReportResponse.reportFileIds[]` → `GET /api/admin/form-submission-files/{id}/download`  
FE 우선순위: `reportFileIds[0]` → forms-surveys download · 없으면 위 members path.

**FE (연결 완료, BE 미구현 시 404):** `member-program-history-api-client.ts` · `lecture-report-submission-history-modal.tsx` · `map-member-lecture-reports.ts`

#### PH-007 출석 API (수강 이력 — 요약)

```
GET /api/admin/users/{memberId}/applications/{applicationId}/lecture-attendance
→ { attendedCount, heldCount, sessions[{ roundNumber, status }] }
```

`status`: `ATTENDED` | `ABSENT` | `LATE` | `NOT_HELD`

---

### 4.2 정산 현황 (`SET-*`)

| ID | 우선 | 화면/기능 | 현재 (갭) | **서버 수정 요청** | AC |
|----|------|-----------|-----------|-------------------|-----|
| **SET-001** | **P0** | 목록 · **참여 기관명** | `institutionName` 없음 → FE `-` | `SettlementListItemResponse.institutionName` | 필터·열 non-empty |
| **SET-002** | P1 | 목록 · 강의 진행 일자 | `lectureDate` 단일 ISO만 | `sessionOrdinal`(1-based) 또는 `lectureDateSessions` 라벨 | UI 「N차시」·복수 회차 표기 |
| **SET-003** | P1 | 산출 내역 · confirm/reject | 목록에 `statementId` 없음 → `GET /statements` **전량 fetch** join | 목록 item에 `statementId` embed | N+1·전량 fetch 제거 |
| **SET-004** | P1 | 필터 | 프로그램명·기관명·정산 현황 **클라이언트** filter | query: `search`, `institutionName`, `statementStatus`/`paymentStatus`, `fromDate`/`toDate` | 서버 필터·건수 일치 |
| **SET-005** | **P0** | 산출 내역 모달 | `GET /settlements/{id}` flat items · `calculationDetail` 없음 | DTO 확장 — `items[].type` enum(7종), `calculationDetail`, `period`, `withholdingTaxAmount`, `lectureFeeStandardTitle` 등 | [UI 필드 SSOT §4](../settlement-payment-order-detail-ui-fields-backend-handoff.md#4-산출-내역서-모달-목록-상세-보기) |
| **SET-006** | **P0** | **지급조서 발급** (선택) | bulk ZIP **미구현** → 단건 PDF 순차 fallback | `POST /api/admin/settlements/payment-statements/bulk-download` `{ settlementIds[] }` | [bulk-download §5.1 #6](../cms-table-bulk-download-api-backend-handoff.md). **PDF 본문 PII는 SET-009 원문** |
| **SET-007** | P0 | 산출 내역 · **신청 반려** | reject endpoint 없음 (FE path 연결됨) | `PATCH /api/admin/settlements/statements/{statementId}/reject` `{ reason }` | 반려 후 status 반영 |
| **SET-008** | P1 | 지급조서 확인 | confirm body에 **이체 예정일** — BE 수용 여부 ◐ | `PATCH .../confirm` body: `lectureFeePaymentScheduledDate` (또는 `scheduledPaymentDate`) SSOT | 확인 모달 저장·재조회 |
| **SET-009** | **P0** | **지급조서 원문 PII · 산출 내역서 unmask** | 발급 양식 **공란**(목 샘플 제거) · unmask API 없음 | `POST /api/admin/settlements/{settlementId}/privacy/unmask` `{ reason }` → 전 PII 원문 (`nameEn` 포함) | [UI SSOT §1.2](../settlement-payment-order-detail-ui-fields-backend-handoff.md#12--p0-서버-요청--지급조서-발급원문--산출-내역서-unmask-api) |

#### SET-005 · SET-006 · SET-009 FE 동작 (2026-08-26)

- 목록: `map-settlement-to-instructor-member-row.ts` — `institutionName: '-'`, invoice placeholder
- 모달: `fetchSettlementDetailRemote` + `mapSettlementDetailToInstructorInvoice` — line item type 한글 매핑만, 상세 「준비 중」 구간 존재
- 발급: 산출 내역서 값을 양식에 바인딩하되 **목 샘플·`-` placeholder 없음** (공란). **원문은 SET-009 unmask + §4.5 embed 대기**

#### 정산 UI 8종 ↔ API status (SET 공통 · P2)

| CMS `InstructorSettlementUiStatus` | BE `statementStatus` / `paymentStatus` |
|-----------------------------------|----------------------------------------|
| `awaiting_confirmation` | `REQUESTED` |
| `payment_statement_verified` | `CONFIRMED` (+ payment 분기) |
| `account_paid` | `PAID` |
| `application_rejected` | `REJECTED` |
| … | 전체 enum·전이 **매핑表** 요청 |

---

## 5. 팝업·모달 UI ↔ API ↔ FE 구현 재검토 (2026-08-25)

> **대상:** 회원·강사 상세 「프로젝트 참여 이력」에서 여는 모달 + 강사 상세 「정산 현황」**산출 내역서** 모달.  
> **FE 공유 컴포넌트:** `lecture-attendance-modal.tsx` · `assignment-submission-modal.tsx` · `lecture-report-submission-history-modal.tsx` · `instructor-invoice-modal.tsx`  
> **회원 상세 wiring:** `user-detail-fullpage-modals-stack.tsx`

### 5.1 출석 모달 (`LectureAttendanceModal`) — PH-007, PH-008, PH-016

**트리거:** 수강 이력 · 「강의 출석 내역」 링크  
**명세:** [lecture-attendance-modal-spec.md](../../design/lecture-attendance-modal-spec.md)

| UI 영역 | UI 필드 | API (`GET .../lecture-attendance`) | OpenAPI | FE remote | 정합 |
|---------|---------|-----------------------------------|---------|-----------|------|
| 상단 | 학생명 | `studentName` (optional — FE fallback: 회원명) | ✗ path | ✅ 호출 | ◐ |
| 상단 | 참석률 | `attendedCount` / `heldCount` | ✗ path | ✅ `map-member-lecture-attendance.ts` | ◐ |
| 본문 | 회차별 `sessions[]` | `sessions[{roundNumber, status}]` | ✗ path | ✅ 매핑 | ✗ BE 미구현 시 **빈 그리드** |
| 푸터 | 출석 정정 · 저장 | PATCH (PH-016) | ✗ | mock만 (`remoteDetail` 시 숨김) | ✗ |

**FE 구현 상태 (2026-08-25):**

- Members remote 시 `fetchApplicationLectureAttendanceRemote` + `remoteDetail` 전달 — **경로 연결 완료**.
- API **404/미구현** 또는 `sessions[]` 빈 배열 시 `enrollment-summary.lectureAttendance` 집계 문자열 **`attendanceSummaryOnly` 폴백** (`user-detail-fullpage-modals-stack.tsx`) — 회차 그리드·정정은 숨김, 출석률만 표시.
- `status` enum: UI `attended|absent|late|not_held` ↔ BE `ATTENDED|ABSENT|LATE|NOT_HELD` (매핑表 PH-007 AC).

**문서 정정:** 구 [member-program-history §6.2] 「OpenAPI에 API 없음」→ **FE는 path 호출 중**, BE·OpenAPI 반영 **대기**.

---

### 5.2 과제·설문 모달 (`AssignmentSubmissionModal`) — PH-009 ~ PH-012

**트리거:** 수강 이력 · 「내역 보기」  
**FE SSOT:** `assignment-submission-history-table.tsx` — 회원 상세·프로그램 참여자 상세 **동일 7열**  
**FE:** `fetchApplicationAssignmentSubmissionsRemote` → `mapMemberAssignmentSubmissionsToDetail`

**Shell:** `ContentModal` + `FilterTableLayout` (`과제 및 설문 제출 목록`) · 푸터 `닫기` 120px · `과제 일괄 다운로드` 160px · h40.

| UI 열 | width | UI/mock SSOT | API 필드 (PH-009) | FE remote 매핑 | 정합 |
|-------|-------|--------------|-------------------|----------------|------|
| No. | 64 | `roundNumber` | `roundNumber` | index 가정 | ✗ |
| 역할 | 140 | `teamRole` tag100 | `teamRole` | `'individual'` 고정 | ✗ |
| 팀명 | 140 | `teamName` | `teamName` | `'-'` 고정 | ✗ |
| **교육 진행 일정** | 300 | `educationDateLabel` | `educationSessionLabel` | **`submittedAt`만** | ✗ |
| 과제 제출 기간 | 300 | `assignmentPeriodLabel` | `assignmentPeriodStart/End` | `'-'` | ✗ |
| **제출 파일** | 300 | `submissionStatus` + 버튼 | `submissionFileIds[]` (PH-010) | `fileCount>0` only | ◐ |
| **교육 진행 현황** | 120 | `lectureProgress` | `lectureProgress` (분리) | `responseStatus` 추론 | ✗ |
| 푸터 · 일괄 다운로드 | — | ZIP | `POST .../bulk-download` (PH-011) | ✅ 호출 | ✗ BE 미구현 |

> `lectureProgress`·`submissionStatus` API 필드는 UI **별도 열이 아님** — 「교육 진행 현황」열·「제출 파일」셀에 각각 표현.

**FE 구현 상태:**

- Remote **7열 FilterTableLayout UI** — `assignment-submission-history-table.tsx` SSOT.
- 데이터는 **축소 매핑** (`map-member-assignment-submissions.ts`는 BE 확장 필드 우선·없으면 interim).
- 「과제 보기」→ `AssignmentPreviewModal` — remote 시 `submissionFileIds[0]` 있으면 **forms-surveys download** · `AssignmentSubmissionCellActionButton` h40 width 100%.
- 역할 dropdown: remote 시 **읽기 전용 배지** (PH-012 persist 전).
- 일괄 다운로드: remote 시 활성, BE 404 시 alert.

**문서·UI 일치:** PH-009~011 요청 항목은 **UI 7열 shell + bulk와 일치**. 누락 없음.

---

### 5.3 강의보고서 모달 (`LectureReportSubmissionHistoryModal`) — PH-015

**트리거:** 강의 이력 · 「내역 보기」 (`mode=instructorLecture`)  
**FE:** `fetchMemberLectureReportsRemote` → `mapMemberLectureReportsToTableRows`

**Shell:** `ContentModal` + `FilterTableLayout` (`강의보고서 제출 목록` · `총 N건`) · 푸터 `닫기` 120px · `강의보고서 일괄 다운로드` 200px · h40 · `진행 예정` 행 opacity 0.5.

| UI 열 | width | API 필드 (요청) | FE remote | 정합 |
|-------|-------|-----------------|-----------|------|
| **교육 진행 일정** | 300 | `educationDateLabel` 또는 date+`roundNumber` | `submittedAt \| programScheduleId회차` | ✗ |
| **강의보고서** 제출 기간 | 300 | `submissionPeriodStart/End` | `submittedAt` (동일 값) | ✗ |
| 강의 진행 여부 | 120 | `lectureProgress` | `reportStatus` 추론 | ◐ |
| 제출 현황 | 120 | `submissionStatus` | `reportStatus` 추론 | ◐ |
| **강의보고서** · 보기 | 300 | `reportFileIds[]` / download URL | `canViewReport` + **onClick** h40 (`AssignmentSubmissionCellActionButton`) | ◐ BE 필드·path |
| 푸터 · 일괄 다운로드 | — | `POST .../lecture-reports/bulk-download` | ✅ 호출 | ✗ BE 미구현 |

**FE 구현 상태 — 2026-08-25 후속 반영:**

1. **「강의보고서 보기」** — `handleViewReport` onClick 연결 (`lecture-report-submission-history-modal.tsx`). BE `reportFileIds` 또는 단건 download path 미구현 시 alert.
2. 목록 행 **「내역 보기」** — remote 시 `hasLectureReportSubmission === true` 일 때만 enabled (`member-program-lecture-history.tsx`). mock은 기존 `?? true` 유지.

**문서 정정:** PH-015 열 제목 — 「교육 진행 **일정**」·「**강의보고서** 제출 기간」(구 「교육 진행 일자 및 교육 차시」 폐기).

---

### 5.4 산출 내역서 모달 (`InstructorInvoiceModal`) — SET-005 ~ SET-008

**트리거:** 강사 상세 정산 · 「상세 보기」  
**FE:** `fetchSettlementDetailRemote` → `mapSettlementDetailToInstructorInvoice`  
**참고 SSOT:** [settlement-payment-order-detail-ui-fields §4](../settlement-payment-order-detail-ui-fields-backend-handoff.md#4-산출-내역서-모달-목록-상세-보기) (정산 LNB 공통)

강사 회원 상세 모달은 정산 LNB `entryKind=program` **프로그램 맥락** 기본 정보 + **단일 블록** 산출 테이블 (강사 embed 기본정보 블록 **없음**).

#### 5.4.1 기본 정보 블록

| UI 라벨 | API 필드 | FE remote 현재 | SET | 정합 |
|---------|----------|----------------|-----|------|
| 프로그램명 | `programNameKo` | 목록 `programName` | — | ✓ |
| 사업 운영 기간 | `period` / `businessPeriodStart/End` | `settlement.period` 또는 `lectureDate` | SET-005 | ◐ |
| 프로그램 진행 회차 | `sessionCompleted/Total` 또는 display | **`'-'` 고정** | SET-005 | ✗ |
| 지급조서 처리 현황 | `statementStatus` (+ 반려 `correctionReason`) | 목록 status 매핑 · **사유 없음** | SET-005 | ◐ |
| 이체 예정일 | `expectedTransferDate` | 목록 `expectedTransferDate` | SET-008 | ◐ |
| 강의비 책정 기준 | `lectureFeeStandardTitle` (+ amount) | `taxIncomeType` 또는 `'-'` | SET-005 | ✗ |
| 사업소득자 여부 | `businessIncomeEarnerLabel` | **`'해당 없음'` 고정** | SET-005 | ✗ |

#### 5.4.2 산출 내역 테이블

| UI 컬럼 | API 필드 | FE remote | SET | 정합 |
|---------|----------|-----------|-----|------|
| 참여 기관명 | `institutionName` | **`'-'`** | SET-001, SET-005 | ✗ |
| 강의 진행 일자 | `lectureDate` (포맷) | 목록 `lectureDate` 1건 | SET-002, SET-005 | ◐ |
| ~~강의 구간(차시)~~ | `lectureSessionDisplay` | **UI 열 없음** (LNB 산출 모달과 상이) | — | 범위外 |
| 산정 항목 | `items[].type` | type→한글 매핑 | SET-005 | ◐ |
| 항목 설명 | `items[].description` | ✅ | SET-005 | ✓ |
| 정산 금액 | `items[].amount` | ✅ | SET-005 | ✓ |
| 산정 기준 상세 | `items[].calculationDetail` | **항상 `'-'`** (상세 모달 미연동) | SET-005 | ✗ |
| 원천징수 | `withholdingTaxAmount` / rate | 목록·items 추론 | SET-005 | ◐ |
| 합계 | `totalAmount` | ✅ | SET-005 | ✓ |

#### 5.4.3 모달 액션

| UI | API | FE | SET |
|----|-----|-----|-----|
| 확인 처리 + 이체 예정일 | `PATCH .../confirm` + date body | ✅ `useConfirmPaymentStatementMutation` | SET-008 |
| 신청 반려 | `PATCH .../reject` | ✅ `rejectPaymentStatementRemote` | SET-007 |
| 지급조서 발급 (푸터) | 단건 download / bulk ZIP · **본문 원문 PII** | ✅ 단건 · bulk fallback · **공란**(목 없음) · SET-009 대기 | SET-006 · **SET-009** |
| `statementId` | 목록 embed 또는 resolve | `GET /statements` join | SET-003 |

**문서·UI 일치:** SET-005 요청은 [UI 필드 SSOT §4.1·§4.3·§4.4](../settlement-payment-order-detail-ui-fields-backend-handoff.md)와 **일치**.  
강사 상세 모달에 **없는** LNB 전용 UI(강사 embed 기본정보 · 강의 구간 열)는 BE 요청 **제외** — 혼동 방지.

---

### 5.5 기타 팝업 (프로젝트 참여 이력)

| 팝업 | BE ID | UI | FE | 비고 |
|------|-------|-----|-----|------|
| 증명서 일괄 발급 사유 | PH-014 | `certificate-bulk-issue-reason-modal` | bulk **발급** API ✅ · ZIP **PH-014** | 다운로드 stub |
| 수강 진행 현황 변경 | PH-013 | `enrollment-table-view` dropdown | remote read-only (`progressStatusReadOnly`) | PATCH 없음 |

---

### 5.6 재검토 결론 — 문서·UI 정합성

| 구분 | 결과 |
|------|------|
| **BE 요청 범위** | 출석·과제·강의보고서·산출 내역서 팝업 **필수 데이터 항목은 §4·§5에 포함됨** — PH-009/010/015/SET-005가 SSOT |
| **문서 보완** | PH-015: 열 제목·**단건 download path**·`reportFileIds` 대안 (§4.1·§5.3) |
| **문서 보완** | PH-007: FE path 연결 + **집계 폴백 interim** (§5.1) |
| **UI vs FE** | Remote 연결 후 **매핑 축소**로 mock 대비 열 값 불일치 — BE 스키마 완료 전 정상 |
| **FE 후속 (완료)** | 출석 API 404/빈 sessions → `attendanceSummaryOnly` 폴백 |
| **FE 후속 (완료)** | 강의보고서 「보기」onClick · remote `hasLectureReportSubmission` 가드 |
| **FE 후속 (완료)** | 과제 preview download wiring (`submissionFileIds`) · remote 역할 read-only |
| **FE 후속 (완료)** | 과제·강의보고서 모달 `FilterTableLayout` shell · 7·5열 width · h40 액션 버튼 · 푸터 치수 (§5.2·§5.3) |
| **FE 후속 (BE 대기)** | SET-005 산출 상세·원천징수·기관명 · PH-009 전 필드 1:1 매핑 |

---

## 6. 구현 우선순위

### P0 — UI 거짓·핵심 동작 차단

| ID | 요약 |
|----|------|
| PH-003, PH-005 | 수강·강의 `part-*` / 봉사 담당자 · `app-*` N+1 |
| PH-007, PH-009, PH-010, PH-011 | 수강 출석·과제 모달 |
| **PH-015** | **강의 강의보고서** 모달·bulk |
| PH-014 | 증명서 ZIP |
| SET-001, SET-005, SET-006, SET-007, **SET-009** | 정산 목록·산출·발급 ZIP·반려 · **발급 원문 PII / unmask** |

### P1

PH-001, PH-002, PH-008, PH-013 · SET-002, SET-003, SET-004, SET-008

### P2

PH-004, PH-012, PH-016 · status 매핑表 · 캘린더 slot time

---

## 7. BE 회신 · OpenAPI 체크

각 ID에 **Accepted / Alternative / Deferred / Rejected** 회신.

- [ ] `members.openapi.json` — PH-007~011, PH-015 path·schema
- [ ] settlements OpenAPI — SET-001~008
- [ ] status enum ↔ CMS 배지 매핑表 (PH-002, SET status)
- [ ] staging fixture — 강사 memberId 1명 기준 E2E (§7)

---

## 8. BE 스모크 검증 (AC)

**프로젝트 참여 이력**

- [ ] **PH-003/005:** 강사 상세 수강·강의 탭 — `app-*`·`part-*` 출석/과제/담당자(·강의보고서 버튼) non-empty
- [ ] **PH-015:** 강의 탭 → 강의보고서 모달 **5열** + h40 보기 + bulk ZIP
- [ ] **PH-007/008:** 수강 출석 모달 `sessions[]` = UI 회차 수
- [ ] **PH-014:** 증명서 bulk 발급 → ZIP 수령

**정산 현황**

- [ ] **SET-001:** `institutionName` 필터·열 동작
- [ ] **SET-003:** confirm/reject에 statementId 1회 조회로 충분
- [ ] **SET-005:** 산출 내역 모달 line·원천징수·합계 = UI
- [ ] **SET-006/007/009:** 지급조서 ZIP · 반려 후 status · **발급 PDF 원문 PII / unmask**

---

## 9. FE 후속 (ID 완료 후)

| ID | FE 파일 | 상태 (2026-08-25) |
|----|---------|-------------------|
| PH-003, 005 | `enrich-member-applications-with-enrollment.ts`, `member-program-lecture-history.tsx` | BE 대기 |
| PH-007 (interim) | `user-detail-fullpage-modals-stack.tsx` — 404/빈 sessions 시 enrollment-summary 집계 폴백 | **✅ 적용** |
| PH-007~011 | `lecture-attendance-modal.tsx`, `assignment-submission-modal.tsx`, **`assignment-submission-history-table.tsx`**, `map-member-assignment-submissions.ts` | FilterTableLayout 7열 **✅** · path·bulk **✅** · 스키마·download **BE 대기** · preview download **✅** |
| PH-015 | `lecture-report-submission-history-modal.tsx`, `map-member-lecture-reports.ts`, `member-program-history-api-client.ts` | FilterTableLayout 5열 **✅** · onClick·mapper **✅** · BE `reportFileIds`/download path **대기** |
| PH-014 | `certificates-api-client.ts`, `member-program-lecture-history.tsx` | bulk ZIP **BE 대기** |
| SET-* | `map-settlement-to-instructor-member-row.ts`, `instructor-payment-tab.tsx`, `instructor-invoice-modal.tsx` | 열 라벨·엑셀 **✅** · SET-005 필드 **BE 대기** |

---

## 10. 환경 · 모듈

```env
# apps/cms/.env.local
VITE_REAL_API_MODULES=...,members,settlementConfigs,paymentOrders,accountPayments
```

- Members: `isRealApiModuleEnabled('members')`
- Settlements: `paymentOrders` (및 관련 settlement 모듈) — `member-remote-capabilities.ts` · `real-api-modules.ts` 참고

---

## 11. 백엔드 전달 필수 묶음 · 참고 문서

### 11.1 필수 묶음 (본 zip 구성)

§0과 동일 — [members/README.md §필수 묶음](./README.md#회원-상세-이력정산--백엔드-전달-필수-묶음). **#5~#7(bulk-download · 산출내역 UI · bulk-delete)은 본 패키지에 반드시 포함**됩니다.

### 11.2 참고 (필수 묶음 밖)

| 문서 | 용도 |
|------|------|
| [settlement-api-backend-gaps.md](../settlement-api-backend-gaps.md) | **정산 관리 LNB** 3화면 전체 (회원 상세 정산만이면 SET-* + §11.1 #6으로 충분) |
| [lecture-attendance-modal-spec.md](../../design/lecture-attendance-modal-spec.md) | 출석 모달 UI SSOT (PH-007) |

---

**Last updated:** 2026-08-26 (SET-009 지급조서 원문 · 산출 내역서 unmask)
