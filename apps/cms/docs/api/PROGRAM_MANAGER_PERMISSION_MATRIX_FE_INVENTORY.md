# 프로그램 담당자 권한 설정 — FE 97항목 카탈로그 인벤토리

- **작성일:** 2026-10-22
- **목적:** JABACK가 프로그램 담당자 권한 매트릭스를 검증할 때 사용할 FE 정본
- **화면 코드는 이 문서로 변경하지 않음.** 읽기 전용 추출이다.

## BE 검증 시 사용할 파일

| 용도 | 경로 |
| --- | --- |
| **카탈로그 SSOT (소스)** | `apps/cms/src/pages/admin/settings/program-manager-permission-settings-ui-data.ts` |
| **화면 렌더** | `apps/cms/src/pages/admin/settings/program-manager-permissions-page.tsx` |
| **역할 코드 매핑 (표시만)** | `apps/cms/src/pages/admin/settings/program-manager-permission-api-contract.ts` |
| **행 단위 인벤토리 (이 추출)** | `apps/cms/docs/api/PROGRAM_MANAGER_PERMISSION_MATRIX_FE_INVENTORY.csv` |
| **설명 (이 문서)** | `apps/cms/docs/api/PROGRAM_MANAGER_PERMISSION_MATRIX_FE_INVENTORY.md` |

**사용하지 말 것 (다른 화면):**

| 파일 | 이유 |
| --- | --- |
| `apps/cms/src/pages/admin/settings/admin-permission-settings-ui-data.ts` | 관리자 권한 설정 카탈로그. **64항목**. 이번 화면과 무관 |
| `apps/cms/src/shared/config/permissions.ts` | 레거시 AdminLevel/ProgramRole 부울 정책. 97항목 매트릭스 아님 |
| `GET /api/admin/admin-accounts/program-role-options` | `code/label/capabilities[]`만. 항목 카탈로그 아님 |

화면 경로: `/admin/settings/program-manager-permissions`

## 64 vs 97

BE가 64개만 발견한 원인은 **관리자 권한 설정 카탈로그를 읽었기 때문**으로 확인된다.

| | A. 관리자 권한 설정 | B. 프로그램 담당자 권한 설정 |
| --- | --- | --- |
| 화면 | `/admin/settings/permissions` | `/admin/settings/program-manager-permissions` |
| 데이터 소스 | `admin-permission-settings-ui-data.ts` `ADMIN_PERMISSION_CATEGORIES` | `program-manager-permission-settings-ui-data.ts` `PROGRAM_MANAGER_PERMISSION_CATEGORIES` |
| 그룹 | 5 (`등록·수정·삭제 권한` / `개인정보 열람` / `화면 열람` / `파일 다운로드` / `기타`) | 5 (`등록·수정·삭제` / `개인정보 열람` / `화면 열람` / `파일 다운로드` / `설정·처리`) |
| 항목 수 | **64** (18+9+19+12+6) | **97** (17+11+26+22+21) |
| 탭 | 마스터 / PM / 파트너 / 뷰어 | Program Owner / Assistant / Viewer |
| CSS·카드 그리드 | 공유 (`permission-customization-page.css`) | 동일 재사용. **카탈로그는 별개** |

공통 레이아웃을 재사용해도 권한 항목 배열은 복사하지 않았다. 33개 미확인 = 97 − 64.

## 집계 (프로그램 담당자, 실제 렌더 체크박스)

중첩 그룹 없음. 카드 헤더 체크박스는 하위 항목에서 **파생**되며 카탈로그 행이 아니다. 헤더 5개는 97에 포함하지 않는다.

| 그룹 ID | 그룹 라벨 | 항목 | Owner CHECKED | Assistant CHECKED | Viewer CHECKED |
| --- | --- | ---: | ---: | ---: | ---: |
| `crud` | 등록·수정·삭제 | 17 | 17 | 17 | 0 |
| `pii` | 개인정보 열람 | 11 | 11 | 9 | 0 |
| `screen_view` | 화면 열람 | 26 | 26 | 26 | 26 |
| `file_download` | 파일 다운로드 | 22 | 22 | 22 | 0 |
| `settings_process` | 설정·처리 | 21 | 21 | 20 | 0 |
| **합계** | | **97** | **97** | **94** | **26** |

역할별 UNCHECKED:

| 역할 | CHECKED | UNCHECKED | UNCHECKED 항목 |
| --- | ---: | ---: | --- |
| Owner (`PM`) | 97 | 0 | 없음 |
| Assistant (`PARTNER`) | 94 | 3 | `pii_rrn` 주민등록번호 확인, `pii_account` 계좌정보 확인, `sp_program_manager` 프로그램 담당자 등록·삭제 |
| Viewer (`VIEWER`) | 26 | 71 | `screen_view` 26개만 CHECKED. crud 17 + pii 11 + file_download 22 + settings_process 21 = 71 UNCHECKED |

- 항목 체크박스: **97개 전부 `disabled`** (Owner/Assistant/Viewer 동일). 페이지 `CmsCheckbox disabled` (L54–57)
- 헤더 체크박스도 `disabled` (파생, 카탈로그 행 아님)
- `itemId` 중복: **0**. unique 97 / 97
- 누락 체크 상태: 없음. Owner 전부 true, Assistant는 상수 3개만 false, Viewer는 `screen_view`만 true

단위 테스트 고정값: `program-manager-permission-settings-ui-data.test.ts` (17+11+26+22+21=97, Owner 97, Assistant 94, Viewer 26).

## 전체 97행

`ownerDisabled` / `assistantDisabled` / `viewerDisabled`는 모두 `true`. CSV와 동일 순서.

| groupId | groupLabel | itemId | itemLabel | Owner | Assistant | Viewer | disabled | source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `crud` | 등록·수정·삭제 | `crud_program_edit` | 프로그램 정보 수정 | CHECKED | CHECKED | UNCHECKED | true | L15 |
| `crud` | 등록·수정·삭제 | `crud_participant_register` | 참여자 등록·수정 | CHECKED | CHECKED | UNCHECKED | true | L16 |
| `crud` | 등록·수정·삭제 | `crud_institution_register` | 참여 기관 등록·수정 | CHECKED | CHECKED | UNCHECKED | true | L17 |
| `crud` | 등록·수정·삭제 | `crud_institution_student_add` | 기존 프로그램 학생 추가 등록 | CHECKED | CHECKED | UNCHECKED | true | L18 |
| `crud` | 등록·수정·삭제 | `crud_instructor_add` | 강사 추가 등록 | CHECKED | CHECKED | UNCHECKED | true | L19 |
| `crud` | 등록·수정·삭제 | `crud_volunteer_add` | 봉사자 추가 등록 | CHECKED | CHECKED | UNCHECKED | true | L20 |
| `crud` | 등록·수정·삭제 | `crud_employee_volunteer` | 임직원 자원봉사자 등록 | CHECKED | CHECKED | UNCHECKED | true | L21 |
| `crud` | 등록·수정·삭제 | `crud_education_schedule` | 교육 일정 수정 | CHECKED | CHECKED | UNCHECKED | true | L22 |
| `crud` | 등록·수정·삭제 | `crud_school_info` | 학교 정보 수정 | CHECKED | CHECKED | UNCHECKED | true | L23 |
| `crud` | 등록·수정·삭제 | `crud_attendance_correct` | 출결 정정 | CHECKED | CHECKED | UNCHECKED | true | L24 |
| `crud` | 등록·수정·삭제 | `crud_team_info` | 팀 정보 수정 | CHECKED | CHECKED | UNCHECKED | true | L25 |
| `crud` | 등록·수정·삭제 | `crud_program_post` | 프로그램 게시글 등록·수정·삭제 | CHECKED | CHECKED | UNCHECKED | true | L26 |
| `crud` | 등록·수정·삭제 | `crud_admin_comment` | 관리자 코멘트 등록 | CHECKED | CHECKED | UNCHECKED | true | L27 |
| `crud` | 등록·수정·삭제 | `crud_edu_log_plan_feedback` | 교육일지·교육계획서 피드백 등록 | CHECKED | CHECKED | UNCHECKED | true | L28 |
| `crud` | 등록·수정·삭제 | `crud_survey` | 설문조사 등록·수정·삭제 | CHECKED | CHECKED | UNCHECKED | true | L29 |
| `crud` | 등록·수정·삭제 | `crud_satisfaction_survey` | 만족도조사 등록·수정·삭제 | CHECKED | CHECKED | UNCHECKED | true | L30 |
| `crud` | 등록·수정·삭제 | `crud_lecture_eval` | 강의평가 등록 | CHECKED | CHECKED | UNCHECKED | true | L31 |
| `pii` | 개인정보 열람 | `pii_rrn` | 주민등록번호 확인 | CHECKED | UNCHECKED | UNCHECKED | true | L38 |
| `pii` | 개인정보 열람 | `pii_account` | 계좌정보 확인 | CHECKED | UNCHECKED | UNCHECKED | true | L39 |
| `pii` | 개인정보 열람 | `pii_gender` | 성별 확인 | CHECKED | CHECKED | UNCHECKED | true | L40 |
| `pii` | 개인정보 열람 | `pii_address` | 주소지 확인 | CHECKED | CHECKED | UNCHECKED | true | L41 |
| `pii` | 개인정보 열람 | `pii_contact` | 연락처 확인 | CHECKED | CHECKED | UNCHECKED | true | L42 |
| `pii` | 개인정보 열람 | `pii_email` | 이메일 확인 | CHECKED | CHECKED | UNCHECKED | true | L43 |
| `pii` | 개인정보 열람 | `pii_birth` | 생년월일 확인 | CHECKED | CHECKED | UNCHECKED | true | L44 |
| `pii` | 개인정보 열람 | `pii_education` | 학력사항 확인 | CHECKED | CHECKED | UNCHECKED | true | L45 |
| `pii` | 개인정보 열람 | `pii_social` | 연동 소셜계정 확인 | CHECKED | CHECKED | UNCHECKED | true | L46 |
| `pii` | 개인정보 열람 | `pii_consent_history` | 약관 및 동의 내역 확인 | CHECKED | CHECKED | UNCHECKED | true | L47 |
| `pii` | 개인정보 열람 | `pii_consent_document` | 약관 및 동의서 확인 | CHECKED | CHECKED | UNCHECKED | true | L48 |
| `screen_view` | 화면 열람 | `sv_program_info` | 프로그램 정보 | CHECKED | CHECKED | CHECKED | true | L55 |
| `screen_view` | 화면 열람 | `sv_participant_application` | 참여자 신청 목록·상세 | CHECKED | CHECKED | CHECKED | true | L56 |
| `screen_view` | 화면 열람 | `sv_institution_application` | 기관 신청 목록·상세 | CHECKED | CHECKED | CHECKED | true | L57 |
| `screen_view` | 화면 열람 | `sv_instructor_application` | 강사 신청 목록·상세 | CHECKED | CHECKED | CHECKED | true | L58 |
| `screen_view` | 화면 열람 | `sv_instructor_resume` | 강사 이력서 | CHECKED | CHECKED | CHECKED | true | L59 |
| `screen_view` | 화면 열람 | `sv_volunteer_application` | 봉사자 신청 목록·상세 | CHECKED | CHECKED | CHECKED | true | L60 |
| `screen_view` | 화면 열람 | `sv_participant_status` | 참여자 현황 | CHECKED | CHECKED | CHECKED | true | L61 |
| `screen_view` | 화면 열람 | `sv_institution_status` | 참여 기관 현황 | CHECKED | CHECKED | CHECKED | true | L62 |
| `screen_view` | 화면 열람 | `sv_instructor_status` | 참여 강사 현황 | CHECKED | CHECKED | CHECKED | true | L63 |
| `screen_view` | 화면 열람 | `sv_volunteer_status` | 참여 봉사자 현황 | CHECKED | CHECKED | CHECKED | true | L64 |
| `screen_view` | 화면 열람 | `sv_attendance_manage` | 출석 관리 | CHECKED | CHECKED | CHECKED | true | L65 |
| `screen_view` | 화면 열람 | `sv_lecture_attendance` | 강의 출석 내역 | CHECKED | CHECKED | CHECKED | true | L66 |
| `screen_view` | 화면 열람 | `sv_student_list` | 학생 명단 | CHECKED | CHECKED | CHECKED | true | L67 |
| `screen_view` | 화면 열람 | `sv_education_assignment` | 교육 배정 현황 | CHECKED | CHECKED | CHECKED | true | L68 |
| `screen_view` | 화면 열람 | `sv_assignment_manage` | 과제 관리 | CHECKED | CHECKED | CHECKED | true | L69 |
| `screen_view` | 화면 열람 | `sv_lecture_report` | 강의보고서 | CHECKED | CHECKED | CHECKED | true | L70 |
| `screen_view` | 화면 열람 | `sv_education_plan` | 교육계획서 | CHECKED | CHECKED | CHECKED | true | L71 |
| `screen_view` | 화면 열람 | `sv_education_log` | 교육일지 | CHECKED | CHECKED | CHECKED | true | L72 |
| `screen_view` | 화면 열람 | `sv_survey` | 설문조사 설문·결과 | CHECKED | CHECKED | CHECKED | true | L73 |
| `screen_view` | 화면 열람 | `sv_satisfaction_survey` | 만족도조사 설문·결과 | CHECKED | CHECKED | CHECKED | true | L74 |
| `screen_view` | 화면 열람 | `sv_lecture_eval` | 강의평가 설문·결과 | CHECKED | CHECKED | CHECKED | true | L75 |
| `screen_view` | 화면 열람 | `sv_payment_doc_view` | 지급조서 보기 | CHECKED | CHECKED | CHECKED | true | L76 |
| `screen_view` | 화면 열람 | `sv_calculation_statement` | 산출 내역서 | CHECKED | CHECKED | CHECKED | true | L77 |
| `screen_view` | 화면 열람 | `sv_program_post` | 프로그램 게시글 | CHECKED | CHECKED | CHECKED | true | L78 |
| `screen_view` | 화면 열람 | `sv_manager_info` | 담당자 정보 | CHECKED | CHECKED | CHECKED | true | L79 |
| `screen_view` | 화면 열람 | `sv_ujat_progress` | UJAT 교육 진행 요약 | CHECKED | CHECKED | CHECKED | true | L80 |
| `file_download` | 파일 다운로드 | `fd_participant_application` | 참여자 신청 목록 | CHECKED | CHECKED | UNCHECKED | true | L87 |
| `file_download` | 파일 다운로드 | `fd_institution_application` | 기관 신청 목록 | CHECKED | CHECKED | UNCHECKED | true | L88 |
| `file_download` | 파일 다운로드 | `fd_instructor_application` | 강사 신청 목록 | CHECKED | CHECKED | UNCHECKED | true | L89 |
| `file_download` | 파일 다운로드 | `fd_volunteer_application` | 봉사자 신청 목록 | CHECKED | CHECKED | UNCHECKED | true | L90 |
| `file_download` | 파일 다운로드 | `fd_participant_list` | 참여자 목록 | CHECKED | CHECKED | UNCHECKED | true | L91 |
| `file_download` | 파일 다운로드 | `fd_institution_list` | 참여 기관 목록 | CHECKED | CHECKED | UNCHECKED | true | L92 |
| `file_download` | 파일 다운로드 | `fd_instructor_list` | 참여 강사 목록 | CHECKED | CHECKED | UNCHECKED | true | L93 |
| `file_download` | 파일 다운로드 | `fd_volunteer_list` | 참여 봉사자 목록 | CHECKED | CHECKED | UNCHECKED | true | L94 |
| `file_download` | 파일 다운로드 | `fd_institution_student_list` | 기존 프로그램 학생 명단 | CHECKED | CHECKED | UNCHECKED | true | L95 |
| `file_download` | 파일 다운로드 | `fd_assignment_bulk` | 과제 일괄 다운로드 | CHECKED | CHECKED | UNCHECKED | true | L96 |
| `file_download` | 파일 다운로드 | `fd_lecture_report_bulk` | 강의보고서 일괄 다운로드 | CHECKED | CHECKED | UNCHECKED | true | L97 |
| `file_download` | 파일 다운로드 | `fd_education_plan` | 교육계획서 다운로드 | CHECKED | CHECKED | UNCHECKED | true | L98 |
| `file_download` | 파일 다운로드 | `fd_education_log` | 교육일지 다운로드 | CHECKED | CHECKED | UNCHECKED | true | L99 |
| `file_download` | 파일 다운로드 | `fd_survey_result` | 설문조사 결과 | CHECKED | CHECKED | UNCHECKED | true | L100 |
| `file_download` | 파일 다운로드 | `fd_satisfaction_result` | 만족도조사 결과 | CHECKED | CHECKED | UNCHECKED | true | L101 |
| `file_download` | 파일 다운로드 | `fd_lecture_eval_result` | 강의평가 결과 | CHECKED | CHECKED | UNCHECKED | true | L102 |
| `file_download` | 파일 다운로드 | `fd_payment_bulk` | 지급조서 일괄 다운로드 | CHECKED | CHECKED | UNCHECKED | true | L103 |
| `file_download` | 파일 다운로드 | `fd_ujat_assignment` | UJAT 배정표 | CHECKED | CHECKED | UNCHECKED | true | L104 |
| `file_download` | 파일 다운로드 | `fd_1365_volunteer_form` | 1365 봉사자실적 등록 양식 | CHECKED | CHECKED | UNCHECKED | true | L105 |
| `file_download` | 파일 다운로드 | `fd_certificate_issue` | 수료증·참여인증서 발급 | CHECKED | CHECKED | UNCHECKED | true | L106 |
| `file_download` | 파일 다운로드 | `fd_activity_certificate` | 봉사·강사 활동인증서 발급 | CHECKED | CHECKED | UNCHECKED | true | L107 |
| `file_download` | 파일 다운로드 | `fd_manager_list` | 담당자 목록 다운로드 | CHECKED | CHECKED | UNCHECKED | true | L108 |
| `settings_process` | 설정·처리 | `sp_participant_approval` | 참여자 신청 승인·반려·취소 | CHECKED | CHECKED | UNCHECKED | true | L115 |
| `settings_process` | 설정·처리 | `sp_institution_approval` | 기관 신청 승인·반려·취소 | CHECKED | CHECKED | UNCHECKED | true | L116 |
| `settings_process` | 설정·처리 | `sp_instructor_merge` | 강사 합반 처리 | CHECKED | CHECKED | UNCHECKED | true | L117 |
| `settings_process` | 설정·처리 | `sp_instructor_approval` | 강사 신청 승인·반려·취소 | CHECKED | CHECKED | UNCHECKED | true | L118 |
| `settings_process` | 설정·처리 | `sp_instructor_fee` | 강사비 책정·승인 | CHECKED | CHECKED | UNCHECKED | true | L119 |
| `settings_process` | 설정·처리 | `sp_document_screening` | 서류 심사 | CHECKED | CHECKED | UNCHECKED | true | L120 |
| `settings_process` | 설정·처리 | `sp_interview` | 면접 처리 | CHECKED | CHECKED | UNCHECKED | true | L121 |
| `settings_process` | 설정·처리 | `sp_education_assign` | 교육 배정·배정 취소 | CHECKED | CHECKED | UNCHECKED | true | L122 |
| `settings_process` | 설정·처리 | `sp_institution_assign` | 기관 배정·배정 취소 | CHECKED | CHECKED | UNCHECKED | true | L123 |
| `settings_process` | 설정·처리 | `sp_representative_instructor` | 대표 강사 변경 | CHECKED | CHECKED | UNCHECKED | true | L124 |
| `settings_process` | 설정·처리 | `sp_activity_withdraw` | 활동 포기 처리 | CHECKED | CHECKED | UNCHECKED | true | L125 |
| `settings_process` | 설정·처리 | `sp_ujat_institution_temp` | UJAT 기관 임시 배정·배정 취소 | CHECKED | CHECKED | UNCHECKED | true | L126 |
| `settings_process` | 설정·처리 | `sp_ujat_institution_schedule` | UJAT 기관 일정 확인·수정 | CHECKED | CHECKED | UNCHECKED | true | L127 |
| `settings_process` | 설정·처리 | `sp_ujat_partner_assign` | UJAT 파트너 배정·배정 취소 | CHECKED | CHECKED | UNCHECKED | true | L128 |
| `settings_process` | 설정·처리 | `sp_ujat_education_assign` | UJAT 교육 배정·배정 취소 | CHECKED | CHECKED | UNCHECKED | true | L129 |
| `settings_process` | 설정·처리 | `sp_program_manager` | 프로그램 담당자 등록·삭제 | CHECKED | UNCHECKED | UNCHECKED | true | L130 |
| `settings_process` | 설정·처리 | `sp_ujat_unavailable_dates` | UJAT 참여 불가일 설정 | CHECKED | CHECKED | UNCHECKED | true | L131 |
| `settings_process` | 설정·처리 | `sp_ujat_attendance_manager` | UJAT 출결 담당자 설정 | CHECKED | CHECKED | UNCHECKED | true | L132 |
| `settings_process` | 설정·처리 | `sp_survey_share` | 설문조사 공유 | CHECKED | CHECKED | UNCHECKED | true | L133 |
| `settings_process` | 설정·처리 | `sp_satisfaction_share` | 만족도조사 공유 | CHECKED | CHECKED | UNCHECKED | true | L134 |
| `settings_process` | 설정·처리 | `sp_notification_resend` | 발송된 알림 재발송 | CHECKED | CHECKED | UNCHECKED | true | L135 |

## 시안 대조 (현재 FE, 체크 상태 변경 없음)

첨부 시안 `Program_Viewer-*.png` 기준:

| 항목 | 시안 | 현재 FE |
| --- | --- | --- |
| Viewer 화면 열람 26 | 전부 CHECKED | CHECKED |
| Viewer 파일 다운로드 22 | 전부 UNCHECKED | UNCHECKED (시안 재확인 후 반영됨) |
| Viewer crud / pii / settings | 전부 UNCHECKED | UNCHECKED |
| Assistant 주민번호·계좌·담당자 등록·삭제 | UNCHECKED | UNCHECKED |
| Owner 전 항목 | CHECKED | CHECKED |

현재 카탈로그 체크 상태는 시안과 같다. 이번 추출에서 FE 체크를 바꾸지 않았다.

## 정책 충돌 검토 (FE 변경 없음)

아래는 **관리자 권한 설정(A)** 또는 전역 정책 키워드가 프로그램 담당자 카탈로그(B)에 **없는지 / 다르게 있는지** 정리이다.

| 검토 키워드 | 프로그램 담당자 카탈로그 (B, 97) | 비고 |
| --- | --- | --- |
| 메일 발송 이력 | **없음** | A에만 `fv_mail_history`. B에 해당 행 없음 |
| 강사 권한 신청 승인 | **없음** | A에만 `misc_instructor_permission_approval` (회원 강사 권한). B의 `sp_instructor_approval`은 **프로그램 강사 신청** 승인·반려·취소 |
| Viewer 파일 다운로드 | 22항목 전부 UNCHECKED | 시안과 동일. 다운로드 capability를 Viewer에 켜면 FE와 불일치 |
| PARTNER(Assistant) 다운로드 | 파일 다운로드 22 **전부 CHECKED** | Assistant 미체크 3개는 PII 2 + 담당자 등록·삭제뿐 |
| PARTNER(Assistant) 삭제 | `등록·수정·삭제` 17 **전부 CHECKED** | 게시글 등록·수정·삭제 포함. 삭제 금지 정책이 있으면 FE 시안과 충돌 |
| CMS 공통 Master 전용 | 이 화면 **Master 탭 없음** | A의 로그 이력 4종, 관리자 권한 신청 승인, 회원 삭제, 프로그램 개설/삭제 등은 B에 없음 |

`permissions.ts`의 `ADMIN_PERMISSIONS` / `PROGRAM_ROLE_PERMISSIONS`는 부울 플래그이며 97항목과 1:1이 아니다.

## BE 수정 필요 여부

**필요.** 이유:

1. 검증 기준을 **이 97행 CSV**로 통일해야 한다. 64항목 관리자 카탈로그로 대조하면 33개가 계속 미확인으로 남는다.
2. `GET program-role-options.capabilities`는 조항목 문자열 배열이라 97항목을 표현하지 못한다. 매트릭스 저장/조회 API가 없으면 화면 체크는 계속 FE 시안 Mock이다.
3. Viewer 다운로드 전부 OFF, Assistant 다운로드·crud 삭제 계열 ON이 서버 가드와 다르면 **서버 정책을 맞추거나**, 시안을 바꿀지는 별도 결정. **이번 FE 체크는 유지.**

개별 체크박스 Mutation은 시안이 읽기 전용이라 지금은 불필요하다.
