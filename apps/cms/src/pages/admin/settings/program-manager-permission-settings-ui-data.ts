import type {
  ProgramManagerPermissionCategoryDef,
  ProgramManagerPermissionFlags,
  ProgramManagerPermissionFlagsByRole,
  ProgramManagerPermissionRoleTab,
} from '@/types/program-manager-permission-settings-ui'
import { PROGRAM_MANAGER_PERMISSION_ROLE_TABS } from '@/types/program-manager-permission-settings-ui'

/** 시안 기준 5개 카테고리 및 세부 항목 (프로그램 담당자 권한) */
export const PROGRAM_MANAGER_PERMISSION_CATEGORIES: ProgramManagerPermissionCategoryDef[] = [
  {
    id: 'crud',
    title: '등록·수정·삭제',
    items: [
      { id: 'crud_program_edit', label: '프로그램 정보 수정' },
      { id: 'crud_participant_register', label: '참여자 등록·수정' },
      { id: 'crud_institution_register', label: '참여 기관 등록·수정' },
      { id: 'crud_institution_student_add', label: '기존 프로그램 학생 추가 등록' },
      { id: 'crud_instructor_add', label: '강사 추가 등록' },
      { id: 'crud_volunteer_add', label: '봉사자 추가 등록' },
      { id: 'crud_employee_volunteer', label: '임직원 자원봉사자 등록' },
      { id: 'crud_education_schedule', label: '교육 일정 수정' },
      { id: 'crud_school_info', label: '학교 정보 수정' },
      { id: 'crud_attendance_correct', label: '출결 정정' },
      { id: 'crud_team_info', label: '팀 정보 수정' },
      { id: 'crud_program_post', label: '프로그램 게시글 등록·수정·삭제' },
      { id: 'crud_admin_comment', label: '관리자 코멘트 등록' },
      { id: 'crud_edu_log_plan_feedback', label: '교육일지·교육계획서 피드백 등록' },
      { id: 'crud_survey', label: '설문조사 등록·수정·삭제' },
      { id: 'crud_satisfaction_survey', label: '만족도조사 등록·수정·삭제' },
      { id: 'crud_lecture_eval', label: '강의평가 등록' },
    ],
  },
  {
    id: 'pii',
    title: '개인정보 열람',
    items: [
      { id: 'pii_rrn', label: '주민등록번호 확인' },
      { id: 'pii_account', label: '계좌정보 확인' },
      { id: 'pii_gender', label: '성별 확인' },
      { id: 'pii_address', label: '주소지 확인' },
      { id: 'pii_contact', label: '연락처 확인' },
      { id: 'pii_email', label: '이메일 확인' },
      { id: 'pii_birth', label: '생년월일 확인' },
      { id: 'pii_education', label: '학력사항 확인' },
      { id: 'pii_social', label: '연동 소셜계정 확인' },
      { id: 'pii_consent_history', label: '약관 및 동의 내역 확인' },
      { id: 'pii_consent_document', label: '약관 및 동의서 확인' },
    ],
  },
  {
    id: 'screen_view',
    title: '화면 열람',
    items: [
      { id: 'sv_program_info', label: '프로그램 정보' },
      { id: 'sv_participant_application', label: '참여자 신청 목록·상세' },
      { id: 'sv_institution_application', label: '기관 신청 목록·상세' },
      { id: 'sv_instructor_application', label: '강사 신청 목록·상세' },
      { id: 'sv_instructor_resume', label: '강사 이력서' },
      { id: 'sv_volunteer_application', label: '봉사자 신청 목록·상세' },
      { id: 'sv_participant_status', label: '참여자 현황' },
      { id: 'sv_institution_status', label: '참여 기관 현황' },
      { id: 'sv_instructor_status', label: '참여 강사 현황' },
      { id: 'sv_volunteer_status', label: '참여 봉사자 현황' },
      { id: 'sv_attendance_manage', label: '출석 관리' },
      { id: 'sv_lecture_attendance', label: '강의 출석 내역' },
      { id: 'sv_student_list', label: '학생 명단' },
      { id: 'sv_education_assignment', label: '교육 배정 현황' },
      { id: 'sv_assignment_manage', label: '과제 관리' },
      { id: 'sv_lecture_report', label: '강의보고서' },
      { id: 'sv_education_plan', label: '교육계획서' },
      { id: 'sv_education_log', label: '교육일지' },
      { id: 'sv_survey', label: '설문조사 설문·결과' },
      { id: 'sv_satisfaction_survey', label: '만족도조사 설문·결과' },
      { id: 'sv_lecture_eval', label: '강의평가 설문·결과' },
      { id: 'sv_payment_doc_view', label: '지급조서 보기' },
      { id: 'sv_calculation_statement', label: '산출 내역서' },
      { id: 'sv_program_post', label: '프로그램 게시글' },
      { id: 'sv_manager_info', label: '담당자 정보' },
      { id: 'sv_ujat_progress', label: 'UJAT 교육 진행 요약' },
    ],
  },
  {
    id: 'file_download',
    title: '파일 다운로드',
    items: [
      { id: 'fd_participant_application', label: '참여자 신청 목록' },
      { id: 'fd_institution_application', label: '기관 신청 목록' },
      { id: 'fd_instructor_application', label: '강사 신청 목록' },
      { id: 'fd_volunteer_application', label: '봉사자 신청 목록' },
      { id: 'fd_participant_list', label: '참여자 목록' },
      { id: 'fd_institution_list', label: '참여 기관 목록' },
      { id: 'fd_instructor_list', label: '참여 강사 목록' },
      { id: 'fd_volunteer_list', label: '참여 봉사자 목록' },
      { id: 'fd_institution_student_list', label: '기존 프로그램 학생 명단' },
      { id: 'fd_assignment_bulk', label: '과제 일괄 다운로드' },
      { id: 'fd_lecture_report_bulk', label: '강의보고서 일괄 다운로드' },
      { id: 'fd_education_plan', label: '교육계획서 다운로드' },
      { id: 'fd_education_log', label: '교육일지 다운로드' },
      { id: 'fd_survey_result', label: '설문조사 결과' },
      { id: 'fd_satisfaction_result', label: '만족도조사 결과' },
      { id: 'fd_lecture_eval_result', label: '강의평가 결과' },
      { id: 'fd_payment_bulk', label: '지급조서 일괄 다운로드' },
      { id: 'fd_ujat_assignment', label: 'UJAT 배정표' },
      { id: 'fd_1365_volunteer_form', label: '1365 봉사자실적 등록 양식' },
      { id: 'fd_certificate_issue', label: '수료증·참가인증서 발급' },
      { id: 'fd_activity_certificate', label: '봉사·강사 활동인증서 발급' },
      { id: 'fd_manager_list', label: '담당자 목록 다운로드' },
    ],
  },
  {
    id: 'settings_process',
    title: '설정·처리',
    items: [
      { id: 'sp_participant_approval', label: '참여자 신청 승인·반려·취소' },
      { id: 'sp_institution_approval', label: '기관 신청 승인·반려·취소' },
      { id: 'sp_instructor_merge', label: '강사 합반 처리' },
      { id: 'sp_instructor_approval', label: '강사 신청 승인·반려·취소' },
      { id: 'sp_instructor_fee', label: '강사비 책정·승인' },
      { id: 'sp_document_screening', label: '서류 심사' },
      { id: 'sp_interview', label: '면접 처리' },
      { id: 'sp_education_assign', label: '교육 배정·배정 취소' },
      { id: 'sp_institution_assign', label: '기관 배정·배정 취소' },
      { id: 'sp_representative_instructor', label: '대표 강사 변경' },
      { id: 'sp_activity_withdraw', label: '활동 포기 처리' },
      { id: 'sp_ujat_institution_temp', label: 'UJAT 기관 임시 배정·배정 취소' },
      { id: 'sp_ujat_institution_schedule', label: 'UJAT 기관 일정 확인·수정' },
      { id: 'sp_ujat_partner_assign', label: 'UJAT 파트너 배정·배정 취소' },
      { id: 'sp_ujat_education_assign', label: 'UJAT 교육 배정·배정 취소' },
      { id: 'sp_program_manager', label: '프로그램 담당자 등록·삭제' },
      { id: 'sp_ujat_unavailable_dates', label: 'UJAT 참여 불가일 설정' },
      { id: 'sp_ujat_attendance_manager', label: 'UJAT 출결 담당자 설정' },
      { id: 'sp_survey_share', label: '설문조사 공유' },
      { id: 'sp_satisfaction_share', label: '만족도조사 공유' },
      { id: 'sp_notification_resend', label: '발송된 알림 재발송' },
    ],
  },
]

export const PROGRAM_MANAGER_PERMISSION_ROLE_LABELS: Record<
  ProgramManagerPermissionRoleTab,
  string
> = {
  owner: 'Program Owner',
  assistant: 'Program Assistant',
  viewer: 'Program Viewer',
}

const ALL_ITEM_IDS: string[] = PROGRAM_MANAGER_PERMISSION_CATEGORIES.flatMap(c =>
  c.items.map(i => i.id)
)

/** Program Assistant — 시안 미체크 항목 */
export const ASSISTANT_UNCHECKED_PERMISSION_IDS = [
  'pii_rrn',
  'pii_account',
  'sp_program_manager',
] as const

function flagsAll(value: boolean): ProgramManagerPermissionFlags {
  return Object.fromEntries(ALL_ITEM_IDS.map(id => [id, value])) as ProgramManagerPermissionFlags
}

/** 시안 Program Viewer: 화면 열람만 CHECKED. 파일 다운로드 포함 나머지 전부 UNCHECKED. */
function createViewerFlags(): ProgramManagerPermissionFlags {
  const flags = flagsAll(false)
  const screenView = PROGRAM_MANAGER_PERMISSION_CATEGORIES.find(c => c.id === 'screen_view')
  if (!screenView) return flags
  for (const item of screenView.items) {
    flags[item.id] = true
  }
  return flags
}

function createAssistantFlags(): ProgramManagerPermissionFlags {
  const flags = flagsAll(true)
  for (const id of ASSISTANT_UNCHECKED_PERMISSION_IDS) {
    flags[id] = false
  }
  return flags
}

/** 역할별 초기 체크 상태 (UI 미리보기용, 저장 없음) */
export function createInitialProgramManagerPermissionsByRole(): ProgramManagerPermissionFlagsByRole {
  return {
    owner: flagsAll(true),
    assistant: createAssistantFlags(),
    viewer: createViewerFlags(),
  }
}

export function isValidProgramManagerRoleTab(
  value: string | null
): value is ProgramManagerPermissionRoleTab {
  return PROGRAM_MANAGER_PERMISSION_ROLE_TABS.includes(value as ProgramManagerPermissionRoleTab)
}

export function countChecked(flags: ProgramManagerPermissionFlags): number {
  return ALL_ITEM_IDS.filter(id => flags[id]).length
}
