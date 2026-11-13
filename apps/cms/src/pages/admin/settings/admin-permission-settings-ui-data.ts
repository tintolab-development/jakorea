import type {
  AdminPermissionCatalogItem,
  AdminPermissionCategoryDef,
  AdminPermissionFlags,
  AdminPermissionSettingsDisplayFlagsByRole,
  AdminPermissionSettingsDisplayRole,
} from '@/types/admin-permission-settings-ui'

/**
 * 관리자 권한 설정 화면의 정적 카탈로그.
 * 표시용이며 권한 매트릭스 API·저장과 연결하지 않는다.
 * 항목 순서와 소속 카테고리는 이 배열이 정본이다.
 */
export const ADMIN_PERMISSION_CATEGORIES: AdminPermissionCategoryDef[] = [
  {
    id: 'crud',
    title: '등록·수정·삭제',
    items: [
      { id: 'crud_program_register_delete', label: '프로그램 등록·삭제' },
      { id: 'crud_member_register_edit_delete', label: '회원 등록·수정·삭제' },
      { id: 'crud_school_register_edit_delete', label: '학교 등록·수정·삭제' },
      { id: 'crud_admin_register_edit_delete', label: '관리자 등록·수정·삭제' },
      { id: 'crud_admin_comment', label: '관리자 코멘트 등록' },
      { id: 'crud_notice_register_edit_delete', label: '공지사항 등록·수정·삭제' },
      { id: 'crud_faq_register_edit_delete', label: 'FAQ 등록·수정·삭제' },
      { id: 'crud_notice_faq_category', label: '공지사항·FAQ 카테고리 관리' },
      { id: 'crud_inquiry_reply_delete', label: '문의내역 답변·삭제' },
      { id: 'crud_inquiry_category', label: '문의 카테고리 관리' },
      { id: 'crud_sponsor_register_edit_delete', label: '후원사 등록·수정·삭제' },
      { id: 'crud_sponsor_manager', label: '후원사 담당자 등록·삭제·변경' },
      { id: 'crud_sponsor_yearly_amount', label: '후원사 연도별 후원금 입력' },
      { id: 'crud_textbook_register_edit_delete', label: '교재 등록·수정·삭제' },
      { id: 'crud_textbook_kit_quantity', label: '교재 키트 수량 수정' },
      { id: 'crud_textbook_business_field', label: '교재 사업 분야 관리' },
      { id: 'crud_detailed_program_register_edit_delete', label: '세부 프로그램 등록·수정·삭제' },
      { id: 'crud_template_register_edit', label: '템플릿 등록·수정' },
      { id: 'crud_alimtalk_template_register_delete', label: '알림톡 템플릿 등록·수정·삭제' },
      { id: 'crud_mail_template_register_edit_delete', label: '메일 템플릿 등록·수정·삭제' },
      { id: 'crud_sms_template_register_edit_delete', label: '문자 템플릿 등록·수정·삭제' },
      { id: 'crud_notification_template_category', label: '알림 메시지 템플릿 카테고리 관리' },
      { id: 'crud_ujat_region_register_delete', label: 'UJAT 교육 지역 등록·삭제' },
      { id: 'crud_gemini_approved_training_register_delete', label: 'Gemini 승인 연수 등록·삭제' },
      { id: 'crud_gemini_training_report', label: 'Gemini 연수 보고서 등록' },
      { id: 'crud_gemini_performance_delete', label: 'Gemini 실적 삭제' },
    ],
  },
  {
    id: 'pii',
    title: '개인정보 열람',
    items: [
      { id: 'pii_rrn', label: '주민등록번호 확인' },
      { id: 'pii_account', label: '계좌정보 확인' },
      { id: 'pii_gender', label: '성별 확인' },
      { id: 'pii_birth', label: '생년월일 확인' },
      { id: 'pii_address', label: '주소지 확인' },
      { id: 'pii_contact', label: '연락처 확인' },
      { id: 'pii_email', label: '이메일 확인' },
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
      { id: 'sv_dashboard', label: '대시보드' },
      { id: 'sv_member_list_detail', label: '회원 목록·상세' },
      { id: 'sv_instructor_permission_approval', label: '강사 권한 승인' },
      { id: 'sv_admin_permission_approval', label: '관리자 권한 승인' },
      { id: 'sv_admin_permission_settings', label: '관리자 권한 설정' },
      { id: 'sv_program_manager_permission_settings', label: '프로그램 담당자 권한 설정' },
      { id: 'sv_program_list_detail', label: '프로그램 목록·상세' },
      { id: 'sv_ujat_program', label: 'UJAT 프로그램 관리' },
      { id: 'sv_payment_statement', label: '지급조서 확인' },
      { id: 'sv_account_payment', label: '계좌 지급 확인' },
      { id: 'sv_bulk_transfer_preview', label: '대량이체 양식 미리보기' },
      { id: 'sv_tax_report_preview', label: '세금신고 양식 미리보기' },
      { id: 'sv_settlement_item_settings', label: '정산 항목 설정' },
      { id: 'sv_template_management', label: '템플릿 관리' },
      { id: 'sv_notice_management', label: '공지사항 관리' },
      { id: 'sv_faq_management', label: 'FAQ 관리' },
      { id: 'sv_inquiry_management', label: '문의내역 관리' },
      { id: 'sv_sponsor_management', label: '후원사 관리' },
      { id: 'sv_textbook_management', label: '교재 관리' },
      { id: 'sv_detailed_program_management', label: '세부 프로그램 관리' },
      { id: 'sv_message_template_management', label: '알림톡·메일·문자 템플릿 관리' },
      { id: 'sv_message_send_history', label: '알림톡·메일·문자 발송 내역 조회' },
      { id: 'sv_performance', label: '실적 관리' },
      { id: 'sv_gemini_performance', label: 'Gemini 실적 관리' },
      { id: 'sv_member_login_history', label: 'CMS 로그인 이력' },
      { id: 'sv_file_download_history', label: '파일 다운로드 이력' },
      { id: 'sv_pii_access_history', label: '개인정보 조회 이력' },
      { id: 'sv_bug_issue_history', label: '버그/이슈 이력' },
    ],
  },
  {
    id: 'file_download',
    title: '파일 다운로드',
    items: [
      { id: 'fd_program_list', label: '프로그램 목록' },
      { id: 'fd_gemini_visiting_training_list', label: 'Gemini 찾아가는 연수 목록' },
      { id: 'fd_gemini_performance_list', label: 'Gemini 실적 목록' },
      { id: 'fd_member_list', label: '회원 목록' },
      { id: 'fd_certificate_issue', label: '수료증·참가인증서 발급' },
      { id: 'fd_activity_certificate_issue', label: '봉사·강사 활동인증서 발급' },
      { id: 'fd_instructor_permission_request_list', label: '강사 권한 신청 목록' },
      { id: 'fd_admin_list', label: '관리자 목록' },
      { id: 'fd_admin_permission_request_list', label: '관리자 권한 신청 목록' },
      { id: 'fd_payment_statement_list', label: '지급조서 확인 목록' },
      { id: 'fd_account_payment_list', label: '계좌 지급 확인 목록' },
      { id: 'fd_payment_statement_issue', label: '지급조서 발급' },
      { id: 'fd_bulk_transfer_issue', label: '대량이체 양식 발급' },
      { id: 'fd_tax_report_issue', label: '세금신고 양식 발급' },
      { id: 'fd_template_document', label: '템플릿 문서' },
      { id: 'fd_notice_list', label: '공지사항 목록' },
      { id: 'fd_faq_list', label: 'FAQ 목록' },
      { id: 'fd_inquiry_list', label: '문의내역 목록' },
      { id: 'fd_sponsor_list', label: '후원사 목록' },
      { id: 'fd_textbook_list', label: '교재 목록' },
      { id: 'fd_detailed_program_list', label: '세부 프로그램 목록' },
      { id: 'fd_performance_data', label: '실적 데이터' },
      { id: 'fd_security_log', label: '보안 로그' },
    ],
  },
  {
    id: 'settings',
    title: '설정·처리',
    items: [
      { id: 'st_member_withdraw', label: '회원 탈퇴 처리' },
      { id: 'st_admin_withdraw', label: '관리자 탈퇴 처리' },
      { id: 'st_instructor_permission_request_process', label: '강사 권한 신청 승인·반려·취소' },
      { id: 'st_admin_permission_request_process', label: '관리자 권한 신청 승인·반려·취소' },
      { id: 'st_instructor_grade', label: '강사 등급 평가' },
      { id: 'st_instructor_permission_end', label: '강사 권한 종료' },
      { id: 'st_payment_statement_process', label: '지급조서 확인·반려·정정' },
      { id: 'st_account_payment', label: '계좌 지급 확인' },
      { id: 'st_settlement_item_settings', label: '정산 항목 설정' },
      { id: 'st_message_send', label: '알림톡·메일·문자 발송' },
      { id: 'st_notification_resend', label: '발송된 알림 재발송' },
      { id: 'st_gnb_notification', label: 'GNB 알림 수신' },
      { id: 'st_admin_default_role_settings', label: '관리자 기본 역할 권한 설정' },
      { id: 'st_program_role_settings', label: '프로그램 역할 권한 설정' },
    ],
  },
]

export const ADMIN_PERMISSION_SETTINGS_ROLE_LABELS: Record<
  AdminPermissionSettingsDisplayRole,
  string
> = {
  master: 'Master',
  'accounting-manager': 'Accounting Manager',
  'program-manager': 'Program Manager',
  'program-viewer': 'Program Viewer',
}

const ALL_ITEM_IDS: string[] = ADMIN_PERMISSION_CATEGORIES.flatMap(category =>
  category.items.map(item => item.id)
)

/** Accounting Manager — 전체 체크에서 제외하는 15개 */
export const ACCOUNTING_MANAGER_UNCHECKED_PERMISSION_IDS = [
  'crud_admin_register_edit_delete',
  'sv_admin_permission_approval',
  'sv_admin_permission_settings',
  'sv_program_manager_permission_settings',
  'sv_member_login_history',
  'sv_file_download_history',
  'sv_pii_access_history',
  'sv_bug_issue_history',
  'fd_admin_list',
  'fd_admin_permission_request_list',
  'fd_security_log',
  'st_admin_withdraw',
  'st_admin_permission_request_process',
  'st_admin_default_role_settings',
  'st_program_role_settings',
] as const

/** Program Manager — 전체 체크에서 제외하는 24개 */
export const PROGRAM_MANAGER_UNCHECKED_PERMISSION_IDS = [
  'crud_admin_register_edit_delete',
  'pii_rrn',
  'pii_account',
  'sv_admin_permission_approval',
  'sv_admin_permission_settings',
  'sv_program_manager_permission_settings',
  'sv_account_payment',
  'sv_bulk_transfer_preview',
  'sv_tax_report_preview',
  'sv_member_login_history',
  'sv_file_download_history',
  'sv_pii_access_history',
  'sv_bug_issue_history',
  'fd_admin_list',
  'fd_admin_permission_request_list',
  'fd_account_payment_list',
  'fd_bulk_transfer_issue',
  'fd_tax_report_issue',
  'fd_security_log',
  'st_admin_withdraw',
  'st_admin_permission_request_process',
  'st_account_payment',
  'st_admin_default_role_settings',
  'st_program_role_settings',
] as const

/** Program Viewer — 전체 미체크에서 선택하는 16개 */
export const PROGRAM_VIEWER_CHECKED_PERMISSION_IDS = [
  'sv_dashboard',
  'sv_member_list_detail',
  'sv_program_list_detail',
  'sv_ujat_program',
  'sv_payment_statement',
  'sv_notice_management',
  'sv_faq_management',
  'sv_inquiry_management',
  'sv_sponsor_management',
  'sv_textbook_management',
  'sv_detailed_program_management',
  'sv_message_template_management',
  'sv_message_send_history',
  'sv_performance',
  'sv_gemini_performance',
  'st_gnb_notification',
] as const

const LEGACY_ROLE_QUERY_ALIASES: Record<string, AdminPermissionSettingsDisplayRole> = {
  master: 'master',
  'accounting-manager': 'accounting-manager',
  accounting_manager: 'accounting-manager',
  'program-manager': 'program-manager',
  program_manager: 'program-manager',
  pm: 'program-manager',
  'program-viewer': 'program-viewer',
  program_viewer: 'program-viewer',
  viewer: 'program-viewer',
}

function flagsAll(value: boolean): AdminPermissionFlags {
  return Object.fromEntries(ALL_ITEM_IDS.map(id => [id, value])) as AdminPermissionFlags
}

function assertKnownIds(ids: readonly string[], label: string) {
  const known = new Set(ALL_ITEM_IDS)
  const unknown = ids.filter(id => !known.has(id))
  if (unknown.length > 0) {
    throw new Error(`${label}: unknown permission ids ${unknown.join(', ')}`)
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${label}: duplicate permission ids`)
  }
}

function flagsExcept(uncheckedIds: readonly string[], label: string): AdminPermissionFlags {
  assertKnownIds(uncheckedIds, label)
  const flags = flagsAll(true)
  for (const id of uncheckedIds) {
    flags[id] = false
  }
  return flags
}

function flagsOnly(checkedIds: readonly string[], label: string): AdminPermissionFlags {
  assertKnownIds(checkedIds, label)
  const flags = flagsAll(false)
  for (const id of checkedIds) {
    flags[id] = true
  }
  return flags
}

/** 카테고리·표시 순서가 포함된 평면 카탈로그 */
export function listAdminPermissionCatalogItems(): AdminPermissionCatalogItem[] {
  return ADMIN_PERMISSION_CATEGORIES.flatMap(category =>
    category.items.map((item, index) => ({
      id: item.id,
      label: item.label,
      categoryId: category.id,
      order: index + 1,
    }))
  )
}

export function deriveCategoryCheckboxState(values: readonly boolean[]): {
  checked: boolean
  indeterminate: boolean
} {
  const allChecked = values.length > 0 && values.every(Boolean)
  const noneChecked = values.every(value => !value)
  return {
    checked: allChecked,
    indeterminate: !allChecked && !noneChecked,
  }
}

export function countChecked(flags: AdminPermissionFlags): number {
  return ALL_ITEM_IDS.filter(id => flags[id]).length
}

/** 역할별 초기 체크 상태 (화면 표시 전용, 저장 없음) */
export function createInitialPermissionsByRole(): AdminPermissionSettingsDisplayFlagsByRole {
  return {
    master: flagsAll(true),
    'accounting-manager': flagsExcept(
      ACCOUNTING_MANAGER_UNCHECKED_PERMISSION_IDS,
      'Accounting Manager'
    ),
    'program-manager': flagsExcept(PROGRAM_MANAGER_UNCHECKED_PERMISSION_IDS, 'Program Manager'),
    'program-viewer': flagsOnly(PROGRAM_VIEWER_CHECKED_PERMISSION_IDS, 'Program Viewer'),
  }
}

export function resolveAdminPermissionSettingsRole(
  value: string | null
): AdminPermissionSettingsDisplayRole | null {
  if (!value) return null
  return LEGACY_ROLE_QUERY_ALIASES[value] ?? null
}
