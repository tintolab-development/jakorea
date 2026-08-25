# CMS 강사 회원 상세 — 프로젝트 참여 이력 · 정산 현황 API 보완 (백엔드 핸드오프)

**작성일:** 2026-08-25  
**문서 유형:** **백엔드 수정 요청 SSOT** (강사 상세 LNB 한 범위 통합)  
**우선순위:** P0/P1 혼합 — §4 **서버 수정 요청 목록** SSOT  
**요청 대상:** Members API · Settlements API · (연계) Forms-surveys 파일 다운로드  
**화면 경로:** CMS → 회원 관리 → **강사** 상세 풀페이지 (`instructor_only` · `instructor_dual`)  
**OpenAPI:** `apps/cms/openapi/members.openapi.json` · `apps/cms/openapi/backend.openapi.json` (settlements)

> **범위:** 본 문서는 **강사 회원 상세**의 「프로젝트 참여 이력」 하위 3탭 + 「정산 현황」 탭만 다룹니다.  
> 정산 관리 LNB 3화면 전체·일반(개인) 회원 상세 등 **타 화면** 갭은 하단 [관련 문서](#10-관련-문서-상세-분기)를 참고하세요.

---

## 1. 요약

2026-08-25 FE remote 1차 연동 이후, 강사 상세 **프로젝트 참여 이력**(수강 · 강의 · 봉사)과 **정산 현황**에서 UI가 요구하는 데이터·동작과 API 간 **부분 일치(◐)·불일치(✗)** 항목을 아래 ID 단위로 정리했습니다.

| 영역 | 서버 조회 | UI 세부 일치 | BE 수정 ID |
|------|-----------|--------------|------------|
| 수강 이력 (`enrollment`) | ◐ | ◐ | PH-001 ~ PH-014 (§4.1) |
| 강의 이력 (`lecture`) | ◐ | ✗ | PH-001, PH-002, PH-005, **PH-015** |
| 봉사 이력 (`volunteer`) | ◐ | ◐ | PH-001, PH-002, PH-005, PH-014 |
| 정산 현황 (`payment`) | ◐ | ✗ | SET-001 ~ SET-008 (§4.2) |

범례: ✓ 일치 · ◐ 부분 일치 · ✗ 불일치

**FE 정책 (BE 미완료 시):** 축소 UI(집계만 · placeholder `-` · 단건 fallback · 404 graceful) 유지.

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
| **정산** | No. · 프로그램명 · **참여 기관명** · 강의 진행 일자 · 정산 현황 · 정산 예정 금액 · 산출 내역 | **지급조서 발급** (선택) · 필터 · 목록/캘린더 |

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
| **PH-009** | **P0** | 수강 | 과제 모달 · 7열 | `responseStatus` 이중 매핑 · 필드 부족 | 스키마 확장 — `roundNumber`, `teamRole`, `teamName`, `educationSessionLabel`, `assignmentPeriod*`, **`lectureProgress`**, **`submissionStatus`** 분리 | mock 7열 1:1 |
| **PH-010** | **P0** | 수강 | 과제 「과제 보기」 | `fileCount`만 | `submissionFileIds[]` (+ fileName) | forms-surveys download 연동 |
| **PH-011** | P0 | 수강 | 과제 일괄 다운로드 | UI stub / FE path 연결됨 | `POST .../assignment-submissions/bulk-download` ZIP | [bulk-download §5.1 #7](../cms-table-bulk-download-api-backend-handoff.md) |
| **PH-012** | P2 | 수강 | 과제 · 역할 변경 | mock only | (선택) `PATCH .../team-role` | persist |
| **PH-013** | P1 | 수강 | 진행 현황 dropdown | PATCH 없음 | `PATCH .../enrollment-status` | 재조회 반영 |
| **PH-014** | P0 | 수강·강의·봉사 | 증명서 일괄 | bulk **발급**만 | `POST .../certificates/issues/bulk-download` ZIP | [bulk-download §5.1 #9](../cms-table-bulk-download-api-backend-handoff.md) |
| **PH-015** | **P0** | **강의** | 강의보고서 모달 · 일괄 | GET 존재, **스키마·다운로드·bulk 미정** | ① `MemberLectureReportResponse` 확장 — `educationDateLabel`, `submissionPeriodStart/End`, `lectureProgress`, `submissionStatus`, `reportFileIds[]` · ② `POST .../lecture-reports/bulk-download` | 모달 4열 + 「보기」+ 일괄 ZIP |
| **PH-016** | P2 | 수강 | 출석 정정 | mock only | PATCH 또는 program-progress SSOT 재사용 | CMS 정정 저장 |

#### PH-015 상세 (강의 이력 전용)

**현재 OpenAPI `MemberLectureReportResponse`:** `reportId`, `programScheduleId`, `reportStatus`, `submittedAt` 등 — UI 4열·파일 보기 **불충분**.

**UI 기대 (강의보고서 제출 내역 모달):**

| UI 열 | 기대 |
|-------|------|
| 교육 진행 일자 및 교육 차시 | `2026. 01. 05 (월) \| 1차시` |
| 제출 기간 | `26. 01. 01 (수) ~ 26. 01. 07 (화)` |
| 강의 진행 여부 | 진행 완료 / 진행 예정 |
| 제출 현황 | 제출 완료 / 미제출 / 진행 예정 |
| 보기 | `reportFileIds[]` → download |

**제안 bulk-download:**

```
POST /api/admin/users/{memberId}/applications/{applicationId}/lecture-reports/bulk-download
Body: { "reportIds": number[] }
→ { "downloadEndpoint": "..." }  // ZIP
```

**FE (연결 완료, BE 미구현 시 404):** `member-program-history-api-client.ts` · `lecture-report-submission-history-modal.tsx`

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
| **SET-006** | **P0** | **지급조서 발급** (선택) | bulk ZIP **미구현** → 단건 PDF 순차 fallback | `POST /api/admin/settlements/payment-statements/bulk-download` `{ settlementIds[] }` | [bulk-download §5.1 #6](../cms-table-bulk-download-api-backend-handoff.md) |
| **SET-007** | P0 | 산출 내역 · **신청 반려** | reject endpoint 없음 (FE path 연결됨) | `PATCH /api/admin/settlements/statements/{statementId}/reject` `{ reason }` | 반려 후 status 반영 |
| **SET-008** | P1 | 지급조서 확인 | confirm body에 **이체 예정일** — BE 수용 여부 ◐ | `PATCH .../confirm` body: `lectureFeePaymentScheduledDate` (또는 `scheduledPaymentDate`) SSOT | 확인 모달 저장·재조회 |

#### SET-005 · SET-006 FE 동작 (2026-08-25)

- 목록: `map-settlement-to-instructor-member-row.ts` — `institutionName: '-'`, invoice placeholder
- 모달: `fetchSettlementDetailRemote` + `mapSettlementDetailToInstructorInvoice` — line item type 한글 매핑만, 상세 「준비 중」 구간 존재
- 발급: `bulkDownloadPaymentStatementsRemote` 호출 → 실패 시 `downloadPaymentStatementRemote` **순차 fallback**

#### 정산 UI 8종 ↔ API status (SET 공통 · P2)

| CMS `InstructorSettlementUiStatus` | BE `statementStatus` / `paymentStatus` |
|-----------------------------------|----------------------------------------|
| `awaiting_confirmation` | `REQUESTED` |
| `payment_statement_verified` | `CONFIRMED` (+ payment 분기) |
| `account_paid` | `PAID` |
| `application_rejected` | `REJECTED` |
| … | 전체 enum·전이 **매핑表** 요청 |

---

## 5. 구현 우선순위

### P0 — UI 거짓·핵심 동작 차단

| ID | 요약 |
|----|------|
| PH-003, PH-005 | 수강·강의 `part-*` / 봉사 담당자 · `app-*` N+1 |
| PH-007, PH-009, PH-010, PH-011 | 수강 출석·과제 모달 |
| **PH-015** | **강의 강의보고서** 모달·bulk |
| PH-014 | 증명서 ZIP |
| SET-001, SET-005, SET-006, SET-007 | 정산 목록·산출·발급·반려 |

### P1

PH-001, PH-002, PH-008, PH-013 · SET-002, SET-003, SET-004, SET-008

### P2

PH-004, PH-012, PH-016 · status 매핑表 · 캘린더 slot time

---

## 6. BE 회신 · OpenAPI 체크

각 ID에 **Accepted / Alternative / Deferred / Rejected** 회신.

- [ ] `members.openapi.json` — PH-007~011, PH-015 path·schema
- [ ] settlements OpenAPI — SET-001~008
- [ ] status enum ↔ CMS 배지 매핑表 (PH-002, SET status)
- [ ] staging fixture — 강사 memberId 1명 기준 E2E (§7)

---

## 7. BE 스모크 검증 (AC)

**프로젝트 참여 이력**

- [ ] **PH-003/005:** 강사 상세 수강·강의 탭 — `app-*`·`part-*` 출석/과제/담당자(·강의보고서 버튼) non-empty
- [ ] **PH-015:** 강의 탭 → 강의보고서 모달 4열 + 파일 download + bulk ZIP
- [ ] **PH-007/008:** 수강 출석 모달 `sessions[]` = UI 회차 수
- [ ] **PH-014:** 증명서 bulk 발급 → ZIP 수령

**정산 현황**

- [ ] **SET-001:** `institutionName` 필터·열 동작
- [ ] **SET-003:** confirm/reject에 statementId 1회 조회로 충분
- [ ] **SET-005:** 산출 내역 모달 line·원천징수·합계 = UI
- [ ] **SET-006/007:** 지급조서 ZIP · 반려 후 status

---

## 8. FE 후속 (ID 완료 후)

| ID | FE 파일 |
|----|---------|
| PH-003, 005 | `enrich-member-applications-with-enrollment.ts`, `member-program-lecture-history.tsx` |
| PH-007~011 | `lecture-attendance-modal.tsx`, `assignment-submission-modal.tsx`, `map-member-assignment-submissions.ts` |
| PH-015 | `lecture-report-submission-history-modal.tsx`, `map-member-lecture-reports.ts` |
| PH-014 | `certificates-api-client.ts`, `member-program-lecture-history.tsx` |
| SET-* | `map-settlement-to-instructor-member-row.ts`, `instructor-payment-tab.tsx`, `instructor-invoice-modal.tsx` |

---

## 9. 환경 · 모듈

```env
# apps/cms/.env.local
VITE_REAL_API_MODULES=...,members,settlementConfigs,paymentOrders,accountPayments
```

- Members: `isRealApiModuleEnabled('members')`
- Settlements: `paymentOrders` (및 관련 settlement 모듈) — `member-remote-capabilities.ts` · `real-api-modules.ts` 참고

---

## 10. 관련 문서 (상세 분기)

| 문서 | 용도 |
|------|------|
| [member-program-history-ui-api-parity-backend-handoff-2026-08-25.md](./member-program-history-ui-api-parity-backend-handoff-2026-08-25.md) | **전체 회원** 프로젝트 참여 이력 PH-001~016 원본 (REQ ID) |
| [settlement-api-backend-gaps.md](../settlement-api-backend-gaps.md) | **정산 관리 LNB** 3화면 전체 갭 |
| [settlement-payment-order-detail-ui-fields-backend-handoff.md](../settlement-payment-order-detail-ui-fields-backend-handoff.md) | 지급 현황 상세 · 산출 내역서 UI 필드 SSOT |
| [cms-table-bulk-download-api-backend-handoff.md](../cms-table-bulk-download-api-backend-handoff.md) | bulk-download 공통 계약 (#6~#9) |
| [lecture-attendance-modal-spec.md](../../design/lecture-attendance-modal-spec.md) | 출석 모달 UI SSOT |

---

**Last updated:** 2026-08-25
