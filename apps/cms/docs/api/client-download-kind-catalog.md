# CMS 브라우저 생성 파일 downloadKind·containedPiiTypes 목록 (초안)

`POST /api/admin/logs/file-access/client` body 확장(`downloadKind`, `containedPiiTypes`)에 쓸 값을 정리한 문서다.
백엔드 공유용이며, 2026-11-09 기준 CMS 코드(`apps/cms/src`)를 전수 조사한 결과다.

## 원칙

- 대상: 브라우저에서 파일을 만들어 `downloadBlob`으로 저장하는 엑셀(client 로그가 남는 경로)만 포함한다.
  서버 export(실적 데이터, 로그 이력 3종 등)는 서버가 기록하므로 제외한다.
- `downloadKind`: `{대상}_EXPORT` 형식. 같은 종류의 데이터는 프로그램 유형(일반/UJAT/제미나이)이 달라도 같은 코드를 쓴다.
- `containedPiiTypes`: **엑셀 컬럼 내용** 기준으로 판단한다. 같은 kind라도 화면에 따라 값이 다를 수 있으므로 호출할 때마다 정한다.
  - `NAME`: 실제 사람 이름(회원, 강사, 학생, 참여자, 봉사자, 담당자·교사, 작성자·등록자)이다. 기관·학교·프로그램 이름은 해당하지 않는다.
- "그 외 개인정보"는 현재 enum에 없어서 보낼 수 없는 항목이다. 참고용으로 적어 둔다.

## 목록

### 프로그램 (일반·UJAT·제미나이 공통)

| downloadKind | 라벨 | 화면 (주요 파일) | PII | 그 외 개인정보 |
|---|---|---|---|---|
| PROGRAM_LIST_EXPORT | 프로그램 목록 | 일반 프로그램 목록(`general/ui/program-list.tsx`), UJAT 전체 프로그램(`pages/programs/UJAT/page.tsx`) | - | - |
| PROGRAM_MANAGER_LIST_EXPORT | 프로그램 담당자 목록 | `general/.../managers/program-managers-tab.tsx` | NAME | 전화번호, 이메일 |
| PROGRAM_INSTITUTION_APPLICATION_EXPORT | 기관 신청 목록 | 신청자 목록 기관 메뉴(`shared/.../applicant-list.tsx`), UJAT 기관 신청(`ujat/.../application-institution/list/list.tsx`), 제미나이 기관 신청(`gemini/ui/detail/institution-application-tab.tsx`) | NAME (교사·강사명) | - |
| PROGRAM_INSTITUTION_SCHEDULE_CONFIRM_EXPORT | 기관 일정 확인 목록 | `ujat/.../schedule-confirm/list.tsx` | NAME (교사명) | - |
| PROGRAM_INSTRUCTOR_APPLICATION_EXPORT | 강사 신청 목록 | 신청자 목록 강사 메뉴, 제미나이 교육 신청 강사(`gemini/ui/approved/detail-instructor-application-tab.tsx`) | NAME | 주소, 전화번호, 이메일 |
| PROGRAM_INDIVIDUAL_APPLICATION_EXPORT | 개인 신청 목록 | 신청자 목록 개인 메뉴 | NAME | 소속, 학년, 주소 |
| PROGRAM_VOLUNTEER_APPLICATION_EXPORT | 봉사자 신청(서류 심사) 목록 | 일반·UJAT `doc-screening` | NAME | 전화번호, 이메일, 주소·학년(화면별), 자기소개서 |
| PROGRAM_SCREENING_DOC_PASSED_EXPORT | 1차 서류 합격자 목록 | 일반·UJAT `doc-passed` | NAME | 전화번호, 이메일 |
| PROGRAM_SCREENING_INTERVIEW_EXPORT | 2차 면접 대상자 목록 | 일반·UJAT `interview2` | NAME | 전화번호, 면접 점수 |
| PROGRAM_PARTICIPATING_INSTITUTION_LIST_EXPORT | 참여 기관 목록 | `general/.../participating-institutions-section.tsx`, `ujat/.../progress/institutions/section.tsx` | NAME (교사·강사명) | - |
| PROGRAM_PARTICIPATING_INSTRUCTOR_LIST_EXPORT | 참여 강사 목록 | `general/.../participating-instructors-section.tsx` | NAME | 주소, 전화번호, 이메일 |
| PROGRAM_PARTICIPANT_LIST_EXPORT | 참여자 목록 | `general/.../participating-participants-section.tsx` | NAME | 주소, 소속, 학년 |
| PROGRAM_VOLUNTEER_LIST_EXPORT | 참여 봉사자 목록 | `general/.../participating-volunteers-section.tsx`, `ujat/.../progress/volunteers/section.tsx` | NAME | 전화번호, 이메일, 1365 ID·학년(화면별) |
| PROGRAM_STUDENT_LIST_EXPORT | 참여 학생 목록 | `general/.../school-detail-student-list-section.tsx` | NAME | 성별, 생년월일, 학급, 전화번호, 이메일 |
| PROGRAM_ATTENDANCE_EXPORT | 출석 관리 | 학교 출석(`school-detail-attendance-section.tsx`), 회차별 출석(`participating-individual-progress-attendance-session-panel.tsx`), 참여자별 출석(`participating-individual-participant-attendance-section.tsx`), UJAT 출석(`ujat/.../progress/attendance/*`) | NAME (참여자별 출석은 컬럼에 이름이 없음 → 아래 정책 1) | 성별, 생년월일, 소속·학년, 전화번호, 이메일 |
| PROGRAM_ASSIGNMENT_EXPORT | 과제 관리 | 회차별 과제(`participating-individual-progress-assignment-session-panel.tsx`), 참여자별 과제(`participating-individual-participant-assignment-section.tsx`), UJAT 과제(`ujat/.../progress/assignments/session-group-panel.tsx`) | NAME (참여자별은 정책 1) | 성별, 생년월일, 소속·학년 |
| PROGRAM_PERSON_ASSIGNMENT_EXPORT | 개인별 배정 현황 | 강사·봉사자 상세의 배정된/배정 대기 목록(`participating-instructor-fullpage-view.tsx`, `participating-individual-instructor-assignment-section.tsx`, `participating-volunteer-assignment-section.tsx`, `participating-individual-volunteer-assignment-section.tsx`), UJAT 봉사자 배정·진행(`ujat/.../volunteers/detail/assignment-progress-tab.tsx`) | UJAT 배정·진행만 NAME(파트너명), 나머지 - | 자택과의 거리 |
| PROGRAM_SCHOOL_INSTRUCTOR_ASSIGNMENT_EXPORT | 학교별 강사 배정 목록 | `general/.../school-detail-fullpage-view.tsx` (배정된/배정 대기 강사) | NAME | 주소 |
| PROGRAM_INSTITUTION_ASSIGNMENT_EXPORT | 기관별 교육 배정·진행 현황 | `ujat/.../institutions/detail/assignment-tab.tsx` (detail-view 버튼 포함) | NAME (봉사자) | - |
| PROGRAM_REGION_ASSIGNMENT_EXPORT | 지역 배정표 | `ujat/.../progress/region/export-region-assignment-excel.ts` | NAME | - |
| PROGRAM_SCHEDULE_SHEET_EXPORT | 임시 교육 일정표 | `ujat/.../schedule-assign/export-schedule-sheet-excel.ts` | - | - |
| PROGRAM_PROGRESS_SUMMARY_EXPORT | 교육 진행 요약 | `ujat/.../progress-summary/export-summary-excel.ts` | - (집계) | - |
| PROGRAM_LECTURE_REPORT_EXPORT | 강의보고서 제출 현황 | `participating-instructor-lecture-reports-section.tsx`, `participating-individual-instructor-lecture-reports-section.tsx` | - (개인용은 파일명에 강사명 → 정책 1) | - |
| PROGRAM_SETTLEMENT_EXPORT | 프로그램 정산 내역 | 강사·참여자·봉사자 상세 정산 탭 4곳 (`participating-*-settlement-section.tsx`) | - (2곳은 파일명에 이름 → 정책 1) | 정산 금액 |
| PROGRAM_SURVEY_RESULT_EXPORT | 설문 결과 | `shared/lib/survey-management/export-survey-results-excel.ts` | NAME (주관식 응답자) | 자유 응답 |
| PROGRAM_EDUCATION_JOURNAL_EXPORT | 교육일지 목록 | `trained-teachers/.../education-journal-section.tsx` | - | - |
| VOLUNTEER_1365_HOURS_EXPORT | 1365 봉사시간 등록 양식 | `ujat/.../volunteers/volunteer-1365-excel.ts` | NAME | 생년월일(마스킹 없음), 1365 ID |
| GEMINI_APPROVED_TRAINING_LIST_EXPORT | 제미나이 승인 연수 목록 | `gemini/ui/approved/list.tsx` | NAME (강사, 기관 담당자) | - |
| GEMINI_TRAINING_PERFORMANCE_EXPORT | 제미나이 연수 실적 목록 | `gemini/ui/performance/list.tsx` | NAME (강사, 보조강사) | - |
| GEMINI_RECRUITMENT_LIST_EXPORT | 제미나이 모집 공고 목록 | `gemini/ui/recruitment/list.tsx` | - | - |

### 회원·강사

| downloadKind | 라벨 | 화면 | PII | 그 외 개인정보 |
|---|---|---|---|---|
| MEMBER_LIST_EXPORT | 회원 목록 | `pages/users/user-list-page.tsx` (선택한 행만) | NAME | 이메일, 전화번호 |
| MEMBER_PERMISSION_REQUEST_EXPORT | 권한 신청 목록 | `user/permission-management/members-permission-list.tsx` | NAME | 전화번호, 이메일 |
| MEMBER_PROGRAM_HISTORY_EXPORT | 회원 프로그램 이력 | `member-program-lecture-history.tsx`, `user-programs/enrollment-table-view.tsx`, `admin-managed-program-history.tsx` | NAME (담당자 컬럼). 담당 이력은 - | - |
| INSTRUCTOR_LIST_EXPORT | 강사 목록 | `instructor-list/ui/instructor-list.tsx`, `pages/instructors/instructor-list-page.tsx` | NAME | 이메일, 전화번호 |
| INSTRUCTOR_SETTLEMENT_EXPORT | 강사 정산 현황 | `user/detail/ui/instructor-payment-tab.tsx` | - (파일명에 강사명 → 정책 1) | 정산 금액 |

### 정산

| downloadKind | 라벨 | 화면 | PII | 그 외 개인정보 |
|---|---|---|---|---|
| ACCOUNT_PAYMENT_LIST_EXPORT | 계좌 지급 목록 | `pages/settlement-management/account-payments-page.tsx` | NAME | - (계좌번호 컬럼 없음) |
| PAYMENT_ORDER_LIST_EXPORT | 정산 목록 | `pages/settlement-management/payment-orders-page.tsx` | 신청자별: NAME / 프로그램별: - | - |
| PAYMENT_ORDER_DETAIL_EXPORT | 정산 상세 목록 | `settlement/ui/payment-record/payment-order-detail-filter-table.tsx` | 신청자명 모드: NAME / 프로그램명 모드: - | - |
| SETTLEMENT_EXPORT (서버와 같은 코드) | 정산 양식(대량이체/세금신고) | `pages/settlement-management/bulk-transfer-excel.ts`, `tax-filing-excel.ts` (서버 정산 API를 안 쓰는 모드에서만 실행) | 대량이체: NAME, ACCOUNT_NUMBER / 세금신고: NAME, RESIDENT_REGISTRATION_NUMBER(마스킹 값) | 전화번호(대량이체) |

### 데이터 관리·게시판·로그·양식

| downloadKind | 라벨 | 화면 | PII | 그 외 개인정보 |
|---|---|---|---|---|
| SPONSOR_LIST_EXPORT | 후원사 목록 | `pages/data-management/sponsor-page.tsx` | NAME (주 담당자) | - |
| SPONSOR_CONTACT_LIST_EXPORT | 후원사 담당자 목록 | `sponsor/ui/panels/sponsor-contacts-panel.tsx` | NAME | 전화번호, 이메일 |
| SPONSOR_PROGRAM_HISTORY_EXPORT | 후원사 프로그램 이력 | `sponsor/ui/panels/sponsor-program-history-panel.tsx` | NAME (후원사 담당자) | - |
| SPONSOR_DONATION_EXPORT | 연도별 후원금 | `sponsor/ui/panels/yearly-business-panel.tsx` | - | - |
| DETAILED_PROGRAM_LIST_EXPORT | 세부 프로그램 목록 | `pages/data-management/detailed-program-page.tsx` | NAME (등록자) | - |
| TEXTBOOK_LIST_EXPORT | 교재 목록 | `pages/data-management/textbook-page.tsx` | NAME (등록자) | - |
| EDUCATION_REGION_LIST_EXPORT | 교육 지역 목록 | `pages/programs/UJAT/education-regions-page.tsx` | NAME (등록자·수정자) | - |
| NOTICE_LIST_EXPORT | 공지사항 목록 | `pages/posts/admin-notice-list-page.tsx` | NAME (작성자) | - |
| FAQ_LIST_EXPORT | FAQ 목록 | `pages/posts/admin-faq-page.tsx` | NAME (작성자) | - |
| INQUIRY_LIST_EXPORT | 문의 목록 | `pages/posts/admin-inquiry-page.tsx` | NAME (문의 회원, 담당자) | - |
| FILE_DOWNLOAD_LOG_EXPORT | 파일 다운로드 이력 | `pages/logs/file-download-history-page.tsx` (브라우저 생성) | NAME (사용자명) | IP |
| STUDENT_LIST_TEMPLATE_EXPORT | 참여학생명단 샘플 양식 | `entities/application/api/file-upload-service.ts` | - (더미 예시) | - |

### 제외 (서버 export 또는 미사용)

| 파일 | 사유 |
|---|---|
| `pages/education-records/education-record-list-page.tsx` | 서버 export (`PERFORMANCE_EXPORT`, 서버 기록) |
| `pages/logs/member-login-history-page.tsx`, `personal-info-access-history-page.tsx`, `bug-issue-history-page.tsx` | 서버 export (서버 기록) |
| `shared/utils/settlement-document.ts` | 지급조서·이체리스트 builder지만 호출하는 곳 없음 |
| `pages/design-system/ui/filters-tables-section.tsx` | 데모 (파일 생성 안 함) |

## 결정 필요

1. **파일명에만 이름이 있는 경우**: 강의보고서·정산·참여자별 출석/과제 등은 컬럼에 이름이 없지만 파일명이 `정산내역_{이름}` 형식이다.
   FE 제안: 파일 내용이 특정인의 데이터이므로 `NAME`을 넣는다.
2. **enum 밖 개인정보**: 전화번호, 이메일, 생년월일, 주소가 들어간 엑셀이 많다. 현재 enum으로는 표현할 수 없다.
   FE 제안: 백엔드가 `PHONE_NUMBER`, `EMAIL`, `BIRTH_DATE`, `ADDRESS` 추가를 검토한다.
3. **마스킹된 주민등록번호**(세금신고): 마스킹 값만 들어가도 `RESIDENT_REGISTRATION_NUMBER`로 기록할지 정해야 한다.
   FE 제안: 컬럼이 있으므로 기록한다.
4. **샘플 양식**(`STUDENT_LIST_TEMPLATE_EXPORT`): 실제 데이터가 없는 양식도 이력을 남길지 정해야 한다.
   FE 제안: 지금처럼 남긴다(PII 없음).

## 조사 중 발견한 문제 (별도 처리 필요)

- **대량이체 브라우저 엑셀에 암호가 걸리지 않는다**: `bulk-transfer-preview-modal.tsx`가 모달에서 입력받은 비밀번호를 `exportBulkTransferExcel(previewRows)`에 넘기지 않는다. 함수에도 비밀번호 인자가 없다.
  그래서 계좌번호 원문이 든 파일이 암호 없이 저장된다. 서버 정산 API를 쓰지 않는 모드(로컬/mock)에서만 실행되는 경로다.
  세금신고는 같은 경로에서 비밀번호를 넘긴다.
