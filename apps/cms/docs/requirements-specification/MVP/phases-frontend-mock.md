# MVP Phase 총괄 체크리스트 (Frontend + Mock)

> 본 문서는 `requirements.md`를 기준으로 모든 Phase를 정리한 체크리스트입니다.
> Cursor AI와 Claude Code 협업 시 진행 상황 추적에 사용합니다.

---

## 진행 상황 요약

| MVP | 진행률 | 상태 | 업데이트 |
|-----|-------|------|---------|
| v0.1 Foundation | 100% | ✅ 완료 | 2025-01-20 |
| v0.2 Front Core | 50% | ⚠️ 부분 완료 | 2026-01-22 |
| v0.3 Admin Ops | 50% | ⚠️ 부분 완료 | 2026-01-22 |
| v0.4 Settlement | 50% | ⚠️ 부분 완료 | 2026-01-22 |
| v0.5 Security | 0% | ❌ 미구현 | - |

**전체 진행률**: 약 30%

---

## MVP v0.1 - Foundation (인증/역할/기본 구조)

**상태**: ✅ 완료 (100%)

### Phase 0.1.1 - 역할/권한 체계 재정의
- [x] `src/types/user.ts` 수정
  - [x] UserRole: `INDIVIDUAL` | `SCHOOL` | `INSTRUCTOR` | `ADMIN`
  - [x] AdminLevel: `MASTER` | `ADMIN` | `GENERAL`
  - [x] ProgramRole: `OWNER` | `PARTNER` | `ASSISTANT`
- [x] `src/shared/config/permissions.ts` 생성
  - [x] ADMIN_PERMISSIONS 정의
  - [x] PROGRAM_ROLE_PERMISSIONS 정의
- [x] `usePermissions()` Hook (부분)
- [x] `useProgramRole(programId)` Hook (부분)

### Phase 0.1.2 - 회원가입 흐름 (FR-B01, FR-B02)
- [x] `/auth/register` 페이지
  - [x] Step 1: 역할 선택 (개인/학교/강사)
  - [x] Step 2: 약관 동의 (필수/선택)
  - [x] Step 3: 정보 입력 (역할별 분기)
- [x] `useRegister()` Hook
- [x] `useConsent()` Hook

### Phase 0.1.3 - 로그인 흐름
- [x] 로그인 페이지 개선 (역할 자동 판별)
- [x] 역할별 리다이렉트
- [x] `useAuth()` Hook 개선
- [x] `useLogin()` Hook

### Phase 0.1.4 - 상태값/기본 모델 정의
- [x] `src/shared/constants/status.ts`
  - [x] APPLICATION_STATUS (8단계)
  - [x] SCHOOL_APPLICATION_STATUS
  - [x] INTERVIEW_STATUS
- [x] `src/types/program.ts` 업데이트
- [x] `src/types/application.ts` 업데이트
- [x] `useStatusLabel(status)` Hook
- [x] `useStatusTimeline(applicationId)` Hook (부분)

### Phase 0.1.5 - 네비게이션/라우팅 구조
- [x] 개인(INDIVIDUAL) 라우트 (`/my/*`) (부분)
- [x] 학교(SCHOOL) 라우트 (`/school/*`) (부분)
- [x] 강사(INSTRUCTOR) 라우트 (`/instructor/*`) (부분)
- [x] 관리자(ADMIN) 라우트 (`/admin/*`)
- [x] `src/shared/config/menu-config.ts` 업데이트 (부분)
- [x] `useMenuByRole()` Hook (부분)
- [ ] `useRouteGuard()` Hook (미완성)

### Mock 데이터
- [x] `src/data/mock/users.ts` 업데이트
- [x] `src/data/mock/consents.ts` 생성
- [x] `src/data/mock/permissions.ts` 생성

---

## MVP v0.2 - Front Core (프론트 사용자 핵심 흐름)

**상태**: ⚠️ 부분 완료 (50%)

### Phase 0.2.1 - 프로그램 탐색/상세 (FR-C01, FR-C02)
- [x] `/programs` 프로그램 리스트 페이지
  - [x] 썸네일 카드 UI (부분)
  - [x] 필터/검색 (부분)
- [x] `/programs/:id` 프로그램 상세 페이지
  - [x] 상세 정보 (FR-C02 항목 전체) (부분)
  - [x] 신청하기 CTA (로그인 유도) (부분)
- [x] `useProgramList(filters)` Hook (부분)
- [x] `useProgramDetail(id)` Hook (부분)

### Phase 0.2.2 - 신청서 작성 (FR-C03)
- [x] `/programs/:id/apply` 신청서 페이지
  - [x] 역할별 폼 분기
  - [ ] 학교: 학생 명단 엑셀 업로드 (미구현)
  - [x] 강사: 서류 업로드 (UI만)
- [x] `useApplicationForm(programId)` Hook (부분)
- [ ] `useFileUpload(policy)` Hook (미구현)
- [ ] `useFormValidation(schema)` Hook (부분)

### Phase 0.2.3 - 신청 완료/결과 안내 (FR-C04)
- [x] `/programs/:id/apply/complete` 신청 완료 페이지
- [x] `/my/applications` 내 신청 내역 (개인)
- [x] `/school/applications` 학교 신청 내역
- [x] `/instructor/applications` 강사 신청 내역
- [x] 문자/이메일/카카오 알림 발송 (Mock) + 발송 이력 (2026-01-22)
- [x] `useMyApplications()` Hook (부분)
- [x] `useApplicationResult(id)` Hook (부분)

### Phase 0.2.4 - 진행상황 조회 (FR-D01)
- [ ] 상태 타임라인 컴포넌트 (미구현)
- [ ] 상태별 안내 문구 (미구현)
- [x] 학교 대시보드 (`/school`) (부분)
- [x] `useStatusTimeline(applicationId)` Hook (부분)
- [ ] `useStatusMessage(status)` Hook (미구현)

### Phase 0.2.5 - 강사 마이페이지 (FR-E01)
- [x] `/instructor` 대시보드 (부분)
- [x] `/instructor/profile` 내정보 관리
- [x] `/instructor/documents` 제출 서류 관리 (UI만)
- [x] `useInstructorProfile()` Hook (부분)
- [x] `useInstructorDocuments()` Hook (부분)

### Phase 0.2.6 - 강사 캘린더/일정 (FR-E02)
- [x] `/instructor/schedule` 교육 일정
  - [x] 캘린더/목록 전환
  - [x] 일정 상세 모달 (Mock)
- [x] `useInstructorSchedule()` Hook (부분)
- [x] `useScheduleViewMode()` Hook

### Phase 0.2.7 - 강의보고서 제출 (FR-E03)
- [x] `/instructor/reports` 강의보고서 목록
- [x] `/reports/new` 보고서 작성 (scheduleId/activityId 연동)
- [x] 상태값 (미제출/제출완료/승인)
- [x] 실제 제출 프로세스 + 보기 드로어 (2026-01-22)
- [x] `useLectureReportSubmit()` Hook (2026-01-22)

### Mock 데이터
- [ ] `src/data/mock/programs.ts` 업데이트
- [ ] `src/data/mock/applications.ts` 업데이트
- [ ] `src/data/mock/schedules.ts` 생성
- [ ] `src/data/mock/lecture-reports.ts` 생성
- [ ] `src/data/mock/notifications.ts` 생성

---

## MVP v0.3 - Admin Ops (관리자 운영 기능)

**상태**: ⚠️ 부분 완료 (50%)

### Phase 0.3.1 - 회원 조회/관리 (FR-F00)
- [x] `/admin/users/participants` 참여자 조회
- [x] `/admin/users/instructors` 강사 조회
- [ ] 권한별 다운로드 버튼 (미구현)
- [ ] 다운로드 이력 기록 (미구현)
- [x] `useParticipantList(filters)` Hook (부분)
- [x] `useInstructorList(filters)` Hook (부분)
- [ ] `useDownloadPermission(programId)` Hook (미구현)

### Phase 0.3.2 - 교육 신청 승인/반려 (FR-F01, FR-F01-1)
- [x] `/admin/applications` 신청 내역 리스트
- [x] `/admin/applications/:id` 신청 상세
  - [x] 승인/반려 버튼 (UI만)
  - [x] 알림 발송 버튼 (발송완료 시 색상 변경)
  - [ ] 신청서 수정 기능 (미구현)
- [x] `useApplicationList(filters)` Hook (부분)
- [ ] `useApplicationReview()` Hook (미구현)
- [ ] `useSendNotification()` Hook (미구현)

### Phase 0.3.3 - 강의 신청 관리 (FR-F02)
- [x] `/admin/instructor-applications` 강사 신청 리스트
- [x] 승인/마감 액션 (UI만)
- [x] 추가 배정 (관리자 직접 입력) (UI만)
- [x] `useInstructorApplications(programId)` Hook (부분)
- [ ] `useInstructorReview()` Hook (미구현)
- [x] `useManualAssignment()` Hook (부분)

### Phase 0.3.4 - 매칭 관리 (FR-F03)
- [x] `/admin/matchings` 매칭 현황
  - [x] 캘린더/목록 전환
  - [x] 매칭 등록/수정 (UI만)
  - [ ] 엑셀 다운로드 (미구현)
- [x] `useMatchingList(filters)` Hook (부분)
- [x] `useMatchingCalendar(month)` Hook (부분)
- [ ] `useExportMatchings()` Hook (미구현)

### Phase 0.3.5 - 관리자 홈 대시보드
- [ ] `/admin` 대시보드
  - [ ] 알림 위젯
  - [ ] 프로그램 진행 현황 위젯
  - [ ] 대기 작업 카드
- [ ] `useAdminDashboard()` Hook
- [ ] `useProgramProgress()` Hook
- [ ] `useAdminNotifications()` Hook

### Phase 0.3.6 - 상태 운영 관리
- [ ] 상태 변경 드롭다운
- [ ] 상태 전이 규칙 적용
- [ ] 변경 이력 기록
- [ ] `useStatusChange()` Hook
- [ ] `useStatusHistory(applicationId)` Hook

### Mock 데이터
- [ ] `src/data/mock/admin-notifications.ts` 생성
- [ ] `src/data/mock/matchings.ts` 업데이트
- [ ] `src/data/mock/status-logs.ts` 생성
- [ ] `src/data/mock/download-logs.ts` 생성

---

## MVP v0.4 - Settlement & Report (정산/지급/실적)

**상태**: ⚠️ 부분 완료 (50%)

### Phase 0.4.1 - 강사 정산 신청 (FR-G01)
- [x] `/instructor/settlement` 강사비 신청 목록
- [x] `/instructor/settlement/new` 정산 신청 폼
  - [x] 교통비 입력 + 증빙 업로드 (UI만)
  - [x] 숙박비 선택
- [x] `/instructor/settlement/:id` 산출내역 확인
- [x] 자동 산출 로직 (§별첨2 산식)
  - [x] 강사료 테이블 (1~6차시)
  - [x] 장거리 가산 (100km+)
  - [x] 교통비 (60km 초과 시)
  - [x] 숙박비 (80,000원)
  - [x] 원천징수 (3.3%/8.8%)
- [x] `useSettlementRequest()` Hook (부분)
- [x] `useSettlementCalculation(params)` Hook
- [x] `useMySettlements()` Hook (부분)

### Phase 0.4.2 - 관리자 정산 검토
- [ ] `/admin/settlements` 정산 검토 목록
- [ ] `/admin/settlements/:id` 정산 상세 검토
  - [ ] 증빙자료 확인
  - [ ] 승인/반려 버튼
- [ ] `useSettlementReviewList(filters)` Hook
- [ ] `useSettlementReview()` Hook

### Phase 0.4.3 - 지급조서/이체리스트 (FR-G03)
- [x] `/settlements/payment-statements` 지급조서 목록
- [x] 이체리스트 엑셀 다운로드
- [ ] 암호 설정 모달 (미구현)
- [ ] OWNER 권한만 다운로드 (미구현)
- [x] `usePaymentStatements(filters)` Hook
- [x] `useTransferListExport()` Hook

### Phase 0.4.4 - 실적/통계
- [x] `/performance` 실적 통계
- [x] 익명/집계 데이터 표시
- [x] `usePerformanceStats(programId)` Hook

### Mock 데이터
- [ ] `src/data/mock/settlements.ts` 업데이트
- [x] `src/data/mock/payment-statements.ts` 생성
- [x] `src/data/mock/performance-stats.ts` 생성

---

## MVP v0.5 - Security & Compliance (보안/개인정보)

**상태**: ❌ 미구현 (0%)

### Phase 0.5.1 - MFA/OTP UX (NFR-SEC-AUT-01)
- [ ] `/auth/mfa` OTP 입력 화면 (미구현)
  - [ ] 카운트다운 타이머 (미구현)
  - [ ] 재전송 쿨다운 (미구현)
  - [ ] 5회 실패 잠금 (미구현)
- [ ] `useMfa()` Hook (미구현)
- [ ] `useOtpVerification()` Hook (미구현)
- [ ] `useOtpCountdown()` Hook (미구현)

### Phase 0.5.2 - 권한 요청 UX (NFR-SEC-ACC-01)
- [ ] 권한 요청 버튼/모달 (미구현)
- [ ] `/admin/permission-requests` 권한 요청 목록 (마스터) (미구현)
- [ ] 임시 권한 부여 (미구현)
- [ ] `usePermissionRequest()` Hook (미구현)
- [ ] `usePermissionRequests()` Hook (미구현)
- [ ] `useTemporaryPermissions()` Hook (미구현)

### Phase 0.5.3 - 다운로드 보호 UX (NFR-DATA-01, NFR-DATA-02)
- [ ] 다운로드 옵션 모달 (마스킹/원본)
- [ ] 원본 다운로드 시 사유 입력
- [ ] 대량 다운로드 제한 표시
- [ ] `useDownloadOptions()` Hook
- [ ] `useDownloadQuota()` Hook
- [ ] `useMasking(policy)` Hook

### Phase 0.5.4 - 감사 로그 UI (NFR-SEC-LOG-01)
- [ ] `/admin/logs/audit` 감사 로그 조회
  - [ ] 이벤트 유형 필터
  - [ ] 사용자/기간 필터
- [ ] `useAuditLogs(filters)` Hook
- [ ] `useLogEvent()` Hook

### Phase 0.5.5 - 세션/접근 통제 UX (NFR-SEC-AUT-02)
- [ ] 로그인 실패 잠금 UI
- [ ] 세션 만료 경고 모달
- [ ] `useSessionTimeout()` Hook
- [ ] `useLoginAttempts()` Hook

### Mock 데이터
- [ ] `src/data/mock/mfa.ts` 생성
- [ ] `src/data/mock/permission-requests.ts` 생성
- [ ] `src/data/mock/audit-logs.ts` 생성

---

## 범례

- [ ] 미완료
- [x] 완료
- ⏳ 진행중

---

## 업데이트 이력

| 날짜 | 내용 |
|-----|------|
| 2026-01-19 | 초기 문서 작성 (requirements.md 기준 정렬) |
| 2026-01-22 | progress.md 기반으로 진행 상황 업데이트 (MVP → PHASE → TASK 단위) |
