# 요구사항 명세 기반 구현 진행 상황

> **기준 문서**: `requirements.md`  
> **최종 업데이트**: 2026-01-22  
> **목적**: requirements-specification 기반으로 구현된 기능과 미구현 기능을 체계적으로 추적

---

## 📊 전체 진행률 요약

| 카테고리 | 완료 | 부분 완료 | 미구현 | 진행률 |
|---------|------|----------|--------|--------|
| **역할 및 권한** | 1 | 0 | 0 | 100% |
| **가입/로그인 (B)** | 2 | 0 | 0 | 100% |
| **프로그램 (C)** | 1 | 3 | 0 | 60% |
| **학교 (D)** | 1 | 0 | 0 | 100% |
| **강사 (E)** | 1 | 2 | 0 | 60% |
| **관리자 운영 (F)** | 1 | 3 | 0 | 55% |
| **정산/지급 (G)** | 0 | 2 | 0 | 50% |
| **템플릿 (H)** | 0 | 1 | 0 | 50% |
| **보안/컴플라이언스 (NFR)** | 0 | 0 | 15+ | 0% |
| **전체** | 7 | 11 | 15+ | **약 40%** |

---

## 1. 역할 및 권한 (§2)

### ✅ 완료: 역할 체계 정의 (Phase 0.1.1)

**요구사항**: §2.1 프론트 사용자 역할, §2.2 관리자 권한 정의

**구현 상태**: ✅ **완료** (2025-01-20)

- ✅ 프론트 사용자 역할: `INDIVIDUAL` / `SCHOOL` / `INSTRUCTOR` / `ADMIN`
- ✅ 관리자 권한 레벨: `MASTER` / `ADMIN` / `GENERAL`
- ✅ 프로그램 역할: `OWNER(담당자)` / `PARTNER(파트너)` / `ASSISTANT(보조)`
- ✅ User 인터페이스 업데이트 (`adminLevel`, `programRoles`, `schoolInfo`, `instructorInfo`)
- ✅ 권한 정책 파일 생성 (`permissions.ts`)
- ✅ Mock 데이터 업데이트

**파일 위치**:
- `src/types/user.ts`
- `src/shared/config/permissions.ts`
- `src/data/mock/users.ts`

---

## 2. 가입/로그인 (B)

### ✅ FR-B01 (P1) 가입 유형 선택

**요구사항**: 회원가입 시 **개인 / 학교 / 강사** 선택

**구현 상태**: ✅ **완료** (2025-01-20)

- ✅ 회원가입 페이지 생성 (`/register`)
- ✅ Step 1: 역할 선택 UI (개인/학교/강사)
- ✅ 역할별 정보 입력 폼 분기
- ✅ `useRegister` Hook 구현
- ✅ 회원가입 API 서비스 구현 (`register-service.ts`)

**파일 위치**:
- `src/pages/auth/register-page.tsx`
- `src/features/auth/hooks/use-register.ts`
- `src/entities/user/api/register-service.ts`

---

### ✅ FR-B02 (P1) 약관 및 개인정보 처리 관련 동의

**요구사항**: 약관/개인정보/마케팅 동의 항목

**구현 상태**: ✅ **완료** (2025-01-20)

- ✅ Step 2: 약관 동의 UI (필수/선택)
- ✅ `useConsent` Hook 구현
- ✅ 동의 내역 타입 정의 및 Mock 데이터 생성 (`consents.ts`)
- ✅ 동의 기록 저장 기능

**파일 위치**:
- `src/pages/auth/register-page.tsx`
- `src/features/auth/hooks/use-consent.ts`
- `src/types/consent.ts`
- `src/data/mock/consents.ts`

---

## 3. 프로그램 (C)

### ⚠️ FR-C01 (P1) "신청 참여" 페이지

**요구사항**: 프로그램 리스트 + 상세 진입 + 신청 CTA 제공

**구현 상태**: ⚠️ **부분 완료** (UI/Mock만 존재)

- ✅ 프로그램 목록 페이지 존재
- ✅ 프로그램 상세 Drawer 존재
- ✅ 신청 CTA 제공
- ❌ 실제 신청 프로세스 미구현 (Mock 데이터 기반)
- ❌ 로그인/회원가입 유도 동선 미명확

**파일 위치**:
- `src/pages/programs/program-list-page.tsx`
- `src/features/program/ui/program-detail-drawer.tsx`

---

### ⚠️ FR-C02 (P2) 프로그램 상세 정보 구성

**요구사항**: 프로그램 명/후원사/진행기간/신청접수 기간/세부내용/커리큘럼/교육일정/문의처

**구현 상태**: ✅ **완료** (2026-01-22)

- ✅ 프로그램 상세 정보 표시
- ✅ 프로그램 상세 화면 개선 완료 (2025-01-19)
- ✅ 포스터/키비주얼 이미지 노출 (2026-01-22)

**파일 위치**:
- `src/features/program/ui/program-detail-drawer.tsx`
- `src/types/domain.ts` - Program.posterImage 필드 추가 (2026-01-22)
- `src/data/mock/programs.ts` - Mock 프로그램에 posterImage 추가 (2026-01-22)
- `src/features/program/ui/program-list.tsx` - 목록에 포스터 썸네일 컬럼 (2026-01-22)
- `src/features/program/ui/program-basic-info-tab.tsx` - 상세 페이지 상단 포스터 표시 (2026-01-22)

---

### ✅ FR-C03 (P1) 신청서 작성: 템플릿 기반 + 커스터마이징

**요구사항**: 관리자가 업로드한 신청서 양식 작성 및 제출, 학교의 경우 참여학생 리스트(엑셀) 업로드

**구현 상태**: ✅ **완료** (2026-01-26, Task 2.4.1)

- ✅ 신청서 작성 폼 존재
- ✅ 역할별 신청서 폼 분기 (개인/학교/강사)
- ✅ 학교 신청서 폼 존재
- ✅ 템플릿 기반 동적 폼 생성 (`DynamicApplicationForm`, `validateDynamicFields`, 필드 타입: text/textarea/number/select/checkbox/date/file)
- ✅ 엑셀 업로드 기능 (ExcelJS 파싱, 샘플 양식 다운로드, 학생 리스트 검증)

**파일 위치**:
- `src/pages/programs/program-application-page.tsx`
- `src/features/application/ui/school-application-form.tsx`
- `src/features/application/ui/individual-application-form.tsx`
- `src/features/application/ui/dynamic-application-form.tsx` (신규)
- `src/features/application/ui/dynamic-form-fields.tsx` (file 타입 추가)
- `src/entities/application/api/file-upload-service.ts` (`createSampleStudentListBlob` 추가)
- `src/types/form-template.ts` (FormFieldType `file`, `fileAccept`/`fileMaxSize` 추가)

---

### ✅ FR-C04 (P1) 신청 결과/상태 안내

**요구사항**: 신청 완료 화면, 관리자 확정 결과 확인, 확정 후 안내 문자/이메일 발송

**구현 상태**: ✅ **완료** (2026-01-26, Task 2.4.2)

- ✅ 신청 완료 화면 구현
- ✅ 신청 결과 화면 개선 완료 (2025-01-19)
- ✅ 신청 상태별 화면 (승인 대기, 반려, 승인 완료)
- ✅ 알림 발송 버튼 UI 존재
- ✅ 실제 문자/이메일 발송 (Provider 인터페이스 + Mock, API 연동 준비)
- ✅ 카카오 알림 (Provider + Mock 연동)
- ✅ 수신자 resolve (User/School/Instructor), 발송 결과·에러 핸들링

**파일 위치**:
- `src/pages/programs/program-application-complete-page.tsx`
- `src/features/application/ui/notification-button.tsx`
- `src/entities/application/api/application-notification-service.ts`
- `src/entities/application/api/notification-providers.ts` (신규)

---

## 4. 학교 (D)

### ✅ FR-D01 (P2) 진행상황 조회 화면

**요구사항**: 상태값 기반 타임라인(신청 완료/확정/매칭/교재 발송/교육 진행/만족도 조사 등)

**구현 상태**: ✅ **완료** (2026-01-22)

- ✅ 진행상황 조회 페이지 존재
- ✅ 상태값 정의 완료 (Phase 0.1.4)
- ✅ 타임라인 UI 구현 (2026-01-22)
- ✅ 상태별 안내 문구 완성 (2026-01-22)
- ✅ 8단계 상태 타임라인 표시 (2026-01-22)
- ✅ 현재 상태 하이라이트 (2026-01-22)
- ✅ Mock 상태 이력 시드 (2026-01-22)

**파일 위치**:
- `src/pages/applications/application-progress-page.tsx` - 타임라인 UI 및 상태별 안내 문구
- `src/types/domain.ts` - Application.progressStatus 필드 추가 (2026-01-22)
- `src/types/application-progress.ts` - APPLICATION_PROGRESS_ORDER 상수 추가 (2026-01-22)
- `src/data/mock/applications.ts` - 승인된 신청에 progressStatus 부여 (2026-01-22)
- `src/entities/application-progress/api/status-change-service.ts` - Mock 상태 이력 시드 (2026-01-22)
- `src/features/auth/hooks/use-status-timeline.ts` - 타임라인 데이터 조회 Hook

---

## 5. 강사 (E)

### ⚠️ FR-E01 (P1) 강사 마이페이지 메뉴

**요구사항**: 내정보 관리, 제출 서류 관리, 교육일정 확인, 강의보고서 제출, 강사비/교통비 산출내역 확인

**구현 상태**: ⚠️ **부분 완료** (UI/Mock만 존재)

- ✅ 강사 마이페이지 존재
- ✅ 내정보 관리 페이지
- ✅ 제출 서류 관리 페이지
- ✅ 교육일정 확인 페이지
- ✅ 강의보고서 제출 페이지
- ✅ 강사비/교통비 산출내역 확인 기능 (2026-01-22)
- ❌ 실제 제출 프로세스 미구현

**파일 위치**:
- `src/pages/instructors/instructor-mypage-page.tsx`
- `src/pages/instructors/instructor-documents-page.tsx`
- `src/pages/instructors/instructor-reports-page.tsx`
- `src/pages/instructors/instructor-schedule-page.tsx`
- `src/types/settlement-result.ts` - SettlementCalculationResult 타입 정의 (2026-01-22)
- `src/types/domain.ts` - Settlement.calculationResult 필드 추가 (2026-01-22)
- `src/data/mock/settlements.ts` - Mock 정산에 calculationResult 저장 (2026-01-22)
- `src/pages/settlements/my-settlement-detail-page.tsx` - 산출내역 표시 (2026-01-22)

---

### ✅ FR-E02 (P1) 캘린더 UX

**요구사항**: "목록/캘린더" 보기 전환, 캘린더에 본인 강의 일정 노출

**구현 상태**: ✅ **완료** (2026-01-22)

- ✅ 캘린더 뷰 컴포넌트 존재
- ✅ 일정 목록 뷰 존재
- ✅ 뷰 전환 기능 존재
- ✅ 강사별 필터링 완성 (2026-01-22)
- ✅ 실제 일정 데이터 연동 (Mock, 2026-01-22)
- ✅ 일정 상세 정보 표시 (학교명/지역/학년/대기실/급식 정보, 2026-01-22)

**파일 위치**:
- `src/pages/instructors/instructor-schedule-page.tsx` - 교육 일정 페이지
- `src/entities/schedule/api/instructor-schedule-service.ts` - 강사 일정 조회 서비스
- `src/data/mock/schedules.ts` - Mock 일정 데이터 (instructor-1 전용 일정 추가, 2026-01-22)

---

### ⚠️ FR-E03 (P1) 강의보고서 제출

**요구사항**: 강의별 제출 항목 생성, 제출 상태값(미제출/제출완료/승인)

**구현 상태**: ⚠️ **부분 완료** (UI/Mock만 존재)

- ✅ 강의보고서 제출 페이지 존재
- ✅ 보고서 작성 화면 개선 완료 (2025-01-19)
- ❌ 실제 제출 프로세스 미구현
- ❌ 제출 상태 관리 미완성

**파일 위치**:
- `src/pages/instructors/instructor-reports-page.tsx`

---

## 6. 관리자 운영 (F)

### ✅ FR-F00 (P1) 회원 조회

**요구사항**: 참여자 조회/다운로드(프로그램별), 강사 조회/다운로드(필라별), 권한별 다운로드 범위 설정, 조회/다운로드 이력 기록

**구현 상태**: ✅ **완료** (2026-01-22)

- ✅ 참여자 목록 페이지 존재
- ✅ 강사 목록 페이지 존재
- ✅ 다운로드 로그 타입 정의 존재
- ✅ 실제 다운로드 기능 구현 (ExcelJS, 2026-01-22)
- ✅ 권한별 다운로드 범위 제한 구현 (2026-01-22)
- ✅ 다운로드 이력 기록 구현 (2026-01-22)

**파일 위치**:
- `src/pages/users/participant-list-page.tsx`
- `src/pages/users/instructor-list-page.tsx`
- `src/types/download-log.ts`
- `src/data/mock/download-logs.ts`
- `src/features/participant/ui/participant-list.tsx` - Excel 다운로드 (2026-01-22)
- `src/features/instructor-list/ui/instructor-list.tsx` - Excel 다운로드 (2026-01-22)
- `src/shared/utils/download-permission.ts` - 권한 체크 (2026-01-22)
- `src/entities/download-log/api/download-log-service.ts` - 이력 기록 (2026-01-22)

---

### ✅ FR-F01 (P1) 교육 신청 내역 (학교)

**요구사항**: 학교 신청 승인/반려, 선정/미선정 안내 발송, 신청서 오기재 사항 수정

**구현 상태**: ✅ **완료** (2026-01-26, Task 3.2.1)

- ✅ 신청 목록 페이지 존재
- ✅ 신청 승인/반려 UI 존재
- ✅ 알림 발송 버튼 UI 존재
- ✅ 실제 승인/반려 로직 (Mock, 2026-01-22)
- ✅ 문자/이메일/카카오 발송 (Mock → 실제 API 연동 준비, Task 2.4.2)
- ✅ 신청서 수정 기능 (역할별 폼 수정 모드, 수정 가능 상태 체크, 수정 이력 기록, 2026-01-26)

**파일 위치**:
- `src/pages/applications/application-list-page.tsx`
- `src/features/application/ui/notification-button.tsx`
- `src/features/application/ui/application-detail-drawer.tsx` (역할별 폼 수정 모달 추가, 2026-01-26)
- `src/features/application/ui/school-application-form.tsx` (수정 모드 지원, 2026-01-26)
- `src/entities/application/api/application-service.ts` - updateStatus, update (수정 이력 기록)
- `src/entities/application-progress/api/status-change-service.ts` - appendReceivedLog (2026-01-22)
- `src/entities/application/api/application-notification-service.ts` - sendApplicationNotification (2026-01-22)
- `src/shared/constants/application-notification.ts` - getReviewMessage (2026-01-22)

---

### ✅ FR-F01-1 (P1) 교육 신청 내역 (개인)

**요구사항**: 교육 신청 결과 안내, 신청서 오기재 사항 수정

**구현 상태**: ✅ **완료** (2026-01-26, Task 3.2.1)

- ✅ 개인 신청 폼 존재
- ✅ 신청 결과 화면 존재
- ✅ 신청서 수정 기능 (역할별 폼 수정 모드, 수정 가능 상태 체크, 수정 이력 기록)

**파일 위치**:
- `src/features/application/ui/individual-application-form.tsx` (수정 모드 지원, 2026-01-26)
- `src/features/application/ui/application-detail-drawer.tsx` (역할별 폼 수정 모달, 2026-01-26)

---

### ✅ FR-F02 (P1) 강의 신청 내역

**요구사항**: 강사 신청 승인/마감, 학교별 강사 매칭, 모집 기간 종료 후 추가 배정

**구현 상태**: ✅ **완료** (2026-01-26, Task 3.3.1)

- ✅ 강의 신청 목록 페이지 존재
- ✅ 승인/마감 UI 존재
- ✅ 매칭 기능 UI 존재
- ✅ 수동 배정 모달 존재
- ✅ 실제 승인/마감 로직 (Mock, application-service 사용, 2026-01-22)
- ✅ 자동 매칭 알고리즘 (지역·전문분야·일정 기반, `matching-algorithm.ts`)
- ✅ 수동 배정 검증 및 중복 배정 방지

**파일 위치**:
- `src/pages/instructor-applications/instructor-application-list-page.tsx`
- `src/features/instructor-application/ui/manual-assignment-modal.tsx` (배정 전 검증 연동, 2026-01-26)
- `src/entities/instructor-application/api/instructor-application-service.ts` - reviewInstructorApplication, validateManualAssignment, createManualAssignment
- `src/entities/matching/lib/matching-algorithm.ts` (신규, 2026-01-26)
- `src/features/matching/ui/matching-form.tsx` (자동 매칭 제안 UI 연동, 2026-01-26)
- `src/features/instructor-application/hooks/use-instructor-application-review.ts` - 승인/반려/마감 훅 (2026-01-22)

---

### ✅ FR-F03 (P1) 강의 매칭 현황

**요구사항**: 일자별 학교 교육 일자에 신청된 강의신청 내역 확인, 캘린더/목록보기 2가지 형태, 엑셀 다운로드

**구현 상태**: ✅ **완료** (2026-01-26, Task 3.3.2)

- ✅ 매칭 목록 페이지 존재
- ✅ 캘린더 뷰 존재
- ✅ 목록 뷰 존재
- ✅ 뷰 전환 기능 존재
- ✅ 엑셀 다운로드 기능 (2026-01-22)
- ✅ 실제 매칭 데이터 연동 (matching-status-service 기반 조회)
- ✅ 캘린더/목록 뷰 데이터 동기화 (보기 월 공유, filters 기반 일원화)
- ✅ 날짜 클릭 시 해당 일자 매칭 상세 모달

**파일 위치**:
- `src/pages/matchings/matching-list-page.tsx` (statusViewMonth, 날짜 클릭 모달, 새로고침, 2026-01-26)
- `src/features/matching/ui/matching-calendar-view.tsx` (calendarData/value/onPanelChange props, 2026-01-26)
- `src/features/matching/ui/matching-status-list.tsx`
- `src/features/matching/hooks/use-matching-status.ts` (filters, calendarData, 2026-01-26)
- `src/entities/matching/api/matching-status-service.ts`

---

## 7. 정산/지급 (G)

### ✅ FR-G01 (P1) 교통비/강사료 자동 산출

**요구사항**: 산출 로직은 정책표 기반(지역/정액/실비 등), 강사비 지급 시 사업소득자 여부 확인(3.3% / 8.8%)

**구현 상태**: ✅ **완료** (2026-01-26, Task 4.1.1)

- ✅ 정산 목록 페이지 존재
- ✅ 정산 상세 Drawer 존재
- ✅ 정산 산출 로직 파일 존재 (`settlement-calculation.ts`)
- ✅ 정산 규칙 상수 정의 (`settlement-rules.ts`)
- ✅ 강사비 기준표 정의 (별첨2 산식 반영)
- ✅ 교통비 계산 로직 (60km 초과 시)
- ✅ 숙박비 계산 로직 (일괄 80,000원)
- ✅ 사업소득자 여부 확인 필드 존재
- ✅ 일사일교 사업 특수성 반영 (rule.isSpecialProgram, 설정 UI, 2026-01-26)
- ✅ 거리 계산 로직 (Haversine Mock, 지도 API 연동 준비, `distance-calculation.ts`, 2026-01-26)
- ✅ 통행료 증빙 검토 프로세스 (검토 완료/반려, `tollReceiptReview`, 2026-01-26)
- ✅ 실제 산출 결과 검증 (validateSettlementResult, 2026-01-22)
- ✅ 프로젝트별 커스터마이징 구현 (정산 규칙 서비스, 프로그램별 규칙 적용, 2026-01-22)
- ✅ 관리자 검토/승인 프로세스 (정산 검토 목록, 증빙자료 확인, 승인/반려, 2026-01-22)
- ✅ 금액 조정 기능 (교통비, 숙박비, 2026-01-22)

**파일 위치**:
- `src/pages/settlements/monthly-settlement-page.tsx`
- `src/entities/settlement/lib/settlement-calculation.ts` - validateSettlementResult, calculateSettlementWithProgramRule, isSpecialProgram (2026-01-26)
- `src/entities/settlement/lib/distance-calculation.ts` (신규, 2026-01-26)
- `src/entities/settlement/api/settlement-calculation-rule-service.ts` - isSpecialProgram (2026-01-26)
- `src/pages/admin/admin-settlement-review-page.tsx` - 정산 검토 목록 페이지 (2026-01-22)
- `src/features/settlement/ui/settlement-detail-review-drawer.tsx` - 금액 조정, 통행료 증빙 검토 (2026-01-26)
- `src/pages/settlements/settlement-calculation-settings-page.tsx` - 일사일교 사업 적용 스위치 (2026-01-26)
- `src/shared/constants/settlement-rules.ts`

---

### ✅ FR-G03 (P1) 지급조서/이체리스트 출력

**요구사항**: 프로그램별 + 월별 지급조서 인쇄/다운로드, 지급조서 항목 이체 리스트 엑셀 다운로드, 암호화 설정

**구현 상태**: ✅ **완료** (2026-01-26, 이체 리스트 포맷 완성)

- ✅ 정산 문서 생성 기능 존재
- ✅ Excel 다운로드 기능 존재
- ✅ PDF 다운로드 기능 추가 (2025-01-22)
- ✅ 월별 정산 일괄 다운로드 기능
- ✅ 지급조서 템플릿 존재
- ✅ 권한별 다운로드 제한 구현 (OWNER만, 2026-01-22)
- ✅ 이체 리스트 엑셀 포맷 완성 (은행 업로드용 / 일반(상세), 2026-01-26)
- ⚠️ 암호화 설정 (Mock, ExcelJS 기본 미지원, 외부 라이브러리 필요, 2026-01-22)

**파일 위치**:
- `src/shared/utils/settlement-document.ts` - generateTransferList format: standard | bank, bankName (2026-01-26)
- `src/features/settlement/hooks/use-transfer-list-export.ts` - format 선택, bankName (2026-01-26)
- `src/features/settlement/hooks/use-payment-statements.ts` - transferRows에 bankName (2026-01-26)
- `src/pages/settlements/payment-statement-list-page.tsx` - 포맷 선택 UI (2026-01-26)
- `src/features/settlement/ui/settlement-detail-drawer.tsx`
- `src/shared/utils/download-permission.ts` - canDownloadPaymentStatement (2026-01-22)

---

## 8. 템플릿 관리 (H)

### ⚠️ FR-H01 (P1) 템플릿 복사/저장

**요구사항**: "양식 복사하기/템플릿 복사하기, 저장하기" 기능, 템플릿 기반으로 신청서/만족도 설문 생성/운영

**구현 상태**: ⚠️ **부분 완료** (UI/Mock만 존재)

- ✅ 템플릿 목록 페이지 존재
- ✅ 템플릿 관리 UI 존재
- ❌ 템플릿 복사 기능 미구현
- ❌ 템플릿 저장 기능 미구현
- ❌ 템플릿 기반 동적 폼 생성 미구현

**파일 위치**:
- `src/pages/templates/template-list-page.tsx`

---

## 9. 비기능 요구사항 (NFR) - 보안/컴플라이언스

### ❌ NFR-SEC-AUT-01 (P1) MFA(2FA) 적용

**요구사항**: 백오피스 로그인 시 항상 MFA 필수(SMS OTP 기본)

**구현 상태**: ❌ **미구현**

- ❌ MFA 인증 시스템 미구현
- ❌ OTP 발송 기능 미구현
- ❌ OTP 검증 로직 미구현
- ❌ OTP 이벤트 로그 미구현

---

### ❌ NFR-SEC-AUT-02 (P1) 비인가 접근 통제 및 세션 보호

**요구사항**: 로그인 시도 레이트리밋/쿨다운/잠금, 세션/쿠키 보안 속성 적용

**구현 상태**: ❌ **미구현**

- ❌ 레이트리밋 미구현
- ❌ 계정 잠금 기능 미구현
- ❌ 세션 보안 속성 미구현

---

### ❌ NFR-SEC-AUT-03 (P1) 비밀번호 정책

**요구사항**: 최소 길이/복잡도/재사용 제한 적용

**구현 상태**: ❌ **미구현**

---

### ❌ NFR-SEC-ACC-01 (P1) 최소권한 원칙

**요구사항**: RBAC+ACL, 프로그램 단위 접근 제어

**구현 상태**: ⚠️ **부분 완료** (타입 정의만 존재)

- ✅ 권한 타입 정의 완료
- ✅ 권한 정책 파일 존재
- ❌ 실제 권한 검증 로직 미구현
- ❌ 프로그램 ACL 적용 미구현

---

### ❌ NFR-SEC-ACC-02 (P1) 서버 사이드 권한 검증 필수

**요구사항**: 모든 민감 기능은 서버(API)에서 권한 검증 강제

**구현 상태**: ❌ **미구현** (Mock 단계이므로 서버 없음)

---

### ❌ NFR-SEC-ENC-01~03 (P1) 암호화

**요구사항**: 전송구간 암호화(TLS), 저장구간 암호화/마스킹, 키 관리

**구현 상태**: ❌ **미구현**

---

### ❌ NFR-SEC-LOG-01~02 (P1) 로그 보관/무결성

**요구사항**: 접속기록 보관(1년 이상), 위변조 방지

**구현 상태**: ⚠️ **부분 완료** (타입 정의만 존재)

- ✅ 다운로드 로그 타입 정의 존재
- ❌ 실제 로그 수집 시스템 미구현
- ❌ 로그 무결성 보장 미구현

---

### ❌ NFR-DATA-01 (P1) 다운로드 마스킹

**요구사항**: 엑셀/CSV/PDF 다운로드 시 개인정보 필드 기본 마스킹

**구현 상태**: ❌ **미구현**

---

### ❌ NFR-DATA-02 (P1) 대량 다운로드 통제

**요구사항**: 최대 행수 제한, 분할 다운로드, 시간당/일일 쿼터

**구현 상태**: ❌ **미구현**

---

### ❌ NFR-PRIV-01~04 (P1) 개인정보 처리 통제

**요구사항**: 최소수집/목적 제한, 파기 기능, 위탁/제3자 제공 반영, 처리방침/동의/권리행사

**구현 상태**: ⚠️ **부분 완료** (동의 기능만 존재)

- ✅ 동의 기록 기능 존재 (FR-B02)
- ❌ 파기 기능 미구현
- ❌ 권리행사 기능 미구현

---

## 10. 상태값 정의 (§3.3)

### ✅ 완료: 상태값 정의 (Phase 0.1.4)

**요구사항**: §3.3 8단계 상태값 정의

**구현 상태**: ✅ **완료** (2025-01-20)

- ✅ APPLICATION_STATUS 8단계 정의
  - 신청(접수) → 매칭 진행중 → 매칭 완료 → 교재 배송 준비중 → 교재 발송 완료 → 교육 실시 → 만족도 조사 제출 → 강의보고서 제출
- ✅ SCHOOL_APPLICATION_STATUS 정의
- ✅ INTERVIEW_STATUS 정의
- ✅ `useStatusLabel` Hook 구현

**파일 위치**:
- `src/shared/constants/application-status.ts`
- `src/shared/constants/interview-status.ts`
- `src/shared/hooks/use-status-label.ts`

---

## 11. 정산 산식 (별첨2)

### ✅ 정산 산식 구현 (FR-G01 연동)

**요구사항**: 별첨2 교통비 산출 산식

**구현 상태**: ✅ **완료** (2026-01-26)

- ✅ 강사비 지급기준표 정의 (1~6차시, 기본/장거리)
- ✅ 교통비 지급 기준 (60km 초과 시)
- ✅ 숙박비 (일괄 80,000원)
- ✅ 사업소득자 여부 확인 (3.3% / 8.8%)
- ✅ 일사일교 사업 특수성 반영 (rule.isSpecialProgram, 설정 UI)
- ✅ 거리 계산 로직 (Haversine Mock, 지도 API 연동 준비)
- ✅ 통행료 증빙 검토 프로세스 (검토 완료/반려)

**파일 위치**:
- `src/shared/constants/settlement-rules.ts`
- `src/entities/settlement/lib/settlement-calculation.ts`
- `src/entities/settlement/lib/distance-calculation.ts`

---

## 📋 다음 우선순위 작업

### 최우선 (P1, 미구현)

1. **FR-C03**: 템플릿 기반 동적 신청서 폼 생성
2. **FR-C04**: 실제 문자/이메일 발송 기능
3. **FR-F01**: 실제 승인/반려 로직 구현
4. **FR-G01**: 정산 산출 로직 완성 및 검증
5. **NFR-SEC-***: 보안 요구사항 구현 (MFA, 권한 검증, 암호화 등)

### 중간 우선순위 (P1, 부분 완료)

1. **FR-C01**: 신청 프로세스 실제 구현
2. **FR-E01~E03**: 강사 기능 실제 프로세스 구현
3. **FR-F00**: 다운로드 기능 및 권한 제어 구현
4. **FR-G03**: 암호화 및 권한별 다운로드 제한

### 낮은 우선순위 (P2)

1. **FR-A03**: 반응형/배율 이슈 개선
2. ~~**FR-C02**: 포스터/키비주얼 이미지 노출~~ ✅ (2026-01-22)
3. ~~**FR-D01**: 타임라인 UI 구현~~ ✅ (2026-01-22)

---

## 📝 참고사항

- **부분 완료**는 UI/Mock 데이터 기반으로 화면은 존재하나 실제 비즈니스 로직이 미구현된 상태를 의미합니다.
- **보안 요구사항(NFR)**은 대부분 미구현 상태이며, 실제 서버 연동 시 필수로 구현해야 합니다.
- **정산 기능**은 기본 UI와 산출 로직이 부분적으로 구현되어 있으나, 검증 및 완성도 향상이 필요합니다.

---

**마지막 업데이트**: 2026-01-22
