import type {
  AdminPermissionCategoryDef,
  AdminPermissionFlags,
  AdminPermissionFlagsByRole,
  AdminPermissionRoleTab,
} from '@/types/admin-permission-settings-ui'
import { ADMIN_PERMISSION_ROLE_TABS } from '@/types/admin-permission-settings-ui'

/** 스크린샷 기준 5개 카테고리 및 세부 항목 */
export const ADMIN_PERMISSION_CATEGORIES: AdminPermissionCategoryDef[] = [
  {
    id: 'crud',
    title: '등록·수정·삭제 권한',
    items: [
      { id: 'crud_program_open', label: '프로그램 개설' },
      { id: 'crud_program_delete', label: '프로그램 삭제' },
      { id: 'crud_program_edit', label: '프로그램 정보 수정' },
      { id: 'crud_member_register', label: '회원 등록' },
      { id: 'crud_member_delete', label: '회원 삭제' },
      { id: 'crud_member_edit', label: '회원 정보 수정' },
      { id: 'crud_notice_faq_create', label: '공지사항 및 FAQ 등록' },
      { id: 'crud_notice_faq_delete', label: '공지사항 및 FAQ 삭제' },
      { id: 'crud_notice_faq_edit', label: '공지사항 및 FAQ 수정' },
      { id: 'crud_inquiry_reply', label: '문의사항 답변' },
      { id: 'crud_sponsor_create', label: '후원사 등록' },
      { id: 'crud_sponsor_delete', label: '후원사 삭제' },
      { id: 'crud_sponsor_edit', label: '후원사 수정' },
      { id: 'crud_template_create', label: '템플릿 등록' },
      { id: 'crud_template_delete', label: '템플릿 삭제' },
      { id: 'crud_template_edit', label: '템플릿 수정' },
      { id: 'crud_textbook_program_create', label: '교재 및 세부 프로그램명 등록' },
      { id: 'crud_textbook_program_delete', label: '교재 및 세부 프로그램명 삭제' },
      { id: 'crud_textbook_program_edit', label: '교재 및 세부 프로그램명 수정' },
    ],
  },
  {
    id: 'pii',
    title: '개인정보 열람',
    items: [
      { id: 'pii_rrn', label: '주민등록번호 확인' },
      { id: 'pii_gender_dob', label: '성별 및 생년월일 확인' },
      { id: 'pii_account', label: '계좌정보 확인' },
      { id: 'pii_address', label: '주소지 확인' },
      { id: 'pii_contact_email', label: '연락처 및 이메일 확인' },
      { id: 'pii_school_info', label: '학력사항 확인' },
      { id: 'pii_social', label: '연동 소셜계정 확인' },
      { id: 'pii_consent', label: '정보 동의 항목 확인' },
      { id: 'pii_consent_document', label: '정보 동의 항목 동의서 확인' },
    ],
  },
  {
    id: 'file_view',
    title: '파일 열람',
    items: [
      { id: 'fv_instructor_resume', label: '강사이력서' },
      { id: 'fv_program_participation', label: '프로그램 참여 내역' },
      { id: 'fv_settlement', label: '정산 내역' },
      { id: 'fv_student_assignment', label: '학생 과제' },
      { id: 'fv_survey', label: '만족도조사 및 설문조사' },
      { id: 'fv_edu_plan_report', label: '교육계획서 및 활동보고서' },
      { id: 'fv_lecture_report', label: '강의 보고서' },
      { id: 'fv_survey_result', label: '만족도조사 결과' },
      { id: 'fv_result_report', label: '결과보고서' },
      { id: 'fv_settlement_doc', label: '정산 신청서' },
      { id: 'fv_payment_doc', label: '지급조서(산출 내역서)' },
      { id: 'fv_edu_activity_cert', label: '교육진행자 활동인증서' },
      { id: 'fv_certificate', label: '수료증 & 참가 인증서' },
      { id: 'fv_stats', label: '실적 및 통계' },
      { id: 'fv_download_history', label: '파일 다운로드 이력' },
      { id: 'fv_personal_info_history', label: '개인정보 조회 이력' },
      { id: 'fv_bug_issue_history', label: '버그/이슈 이력' },
      { id: 'fv_mail_history', label: '메일 발송 이력' },
    ],
  },
  {
    id: 'file_download',
    title: '파일 다운로드',
    items: [
      { id: 'fd_instructor_resume', label: '강사이력서' },
      { id: 'fd_program_enrollment', label: '프로그램 수강 및 강의 내역' },
      { id: 'fd_settlement', label: '정산 내역' },
      { id: 'fd_student_assignment', label: '학생 과제' },
      { id: 'fd_survey', label: '만족도조사 및 설문조사' },
      { id: 'fd_edu_plan_report', label: '교육계획서 및 활동보고서' },
      { id: 'fd_lecture_report', label: '강의 보고서' },
      { id: 'fd_survey_result', label: '만족도조사 결과' },
      { id: 'fd_result_report', label: '결과보고서' },
      { id: 'fd_settlement_doc', label: '정산보고서' },
      { id: 'fd_payment_doc', label: '지급조서(산출 내역서)' },
      { id: 'fd_edu_activity_cert', label: '교육진행자 활동인증서' },
      { id: 'fd_certificate', label: '수료증 & 참가 인증서' },
      { id: 'fd_stats', label: '실적 및 통계' },
      { id: 'fd_all_lists', label: '모든 리스트 내역' },
    ],
  },
  {
    id: 'misc',
    title: '기타',
    items: [
      { id: 'misc_dispatch_case', label: '발송 케이스 관리' },
      { id: 'misc_notification', label: '알림톡/메일 발송' },
      { id: 'misc_member_approval', label: '회원 신청 승인 / 반려' },
      { id: 'misc_settlement_approval', label: '정산 신청 승인 / 반려' },
      { id: 'misc_instructor_permission_approval', label: '강사 권한 신청 승인 / 반려' },
      { id: 'misc_admin_permission_approval', label: '관리자 권한 신청 승인 / 반려' },
    ],
  },
]

export const ADMIN_PERMISSION_ROLE_LABELS: Record<AdminPermissionRoleTab, string> = {
  master: '마스터',
  pm: 'PM',
  partner: '파트너',
  viewer: '뷰어',
}

const ALL_ITEM_IDS: string[] = ADMIN_PERMISSION_CATEGORIES.flatMap(c => c.items.map(i => i.id))
export const PM_UNCHECKED_PERMISSION_IDS = [
  'fv_download_history',
  'fv_personal_info_history',
  'fv_bug_issue_history',
  'misc_admin_permission_approval',
] as const
export const PARTNER_UNCHECKED_PERMISSION_IDS = [
  'pii_rrn',
  'pii_account',
  'fv_download_history',
  'fv_personal_info_history',
  'fv_bug_issue_history',
] as const
export const VIEWER_FILE_VIEW_UNCHECKED_PERMISSION_IDS = [
  'fv_download_history',
  'fv_personal_info_history',
  'fv_bug_issue_history',
] as const

function flagsAll(value: boolean): AdminPermissionFlags {
  return Object.fromEntries(ALL_ITEM_IDS.map(id => [id, value])) as AdminPermissionFlags
}

function createViewerFlags(): AdminPermissionFlags {
  const viewerFlags = flagsAll(false)
  const fileViewCategory = ADMIN_PERMISSION_CATEGORIES.find(category => category.id === 'file_view')
  if (!fileViewCategory) return viewerFlags

  const uncheckedSet = new Set<string>(VIEWER_FILE_VIEW_UNCHECKED_PERMISSION_IDS)
  for (const item of fileViewCategory.items) {
    viewerFlags[item.id] = !uncheckedSet.has(item.id)
  }
  return viewerFlags
}

/** 역할별 초기 체크 상태 (UI 미리보기용, 저장 없음) */
export function createInitialPermissionsByRole(): AdminPermissionFlagsByRole {
  const base: Partial<AdminPermissionFlagsByRole> = {}
  for (const role of ADMIN_PERMISSION_ROLE_TABS) {
    if (role === 'viewer') {
      base[role] = createViewerFlags()
    } else if (role === 'pm') {
      const pmFlags = flagsAll(true)
      for (const id of PM_UNCHECKED_PERMISSION_IDS) {
        pmFlags[id] = false
      }
      base[role] = pmFlags
    } else if (role === 'partner') {
      const partnerFlags = flagsAll(true)
      for (const id of PARTNER_UNCHECKED_PERMISSION_IDS) {
        partnerFlags[id] = false
      }
      base[role] = partnerFlags
    } else {
      base[role] = flagsAll(true)
    }
  }
  return base as AdminPermissionFlagsByRole
}

export function isValidRoleTab(value: string | null): value is AdminPermissionRoleTab {
  return ADMIN_PERMISSION_ROLE_TABS.includes(value as AdminPermissionRoleTab)
}
