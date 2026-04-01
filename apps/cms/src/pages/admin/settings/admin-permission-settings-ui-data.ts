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
      { id: 'pii_social', label: '연동 소셜계정 확인' },
      { id: 'pii_consent', label: '정보 동의 항목 확인' },
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
      { id: 'fv_payment_doc', label: '지급조서' },
      { id: 'fv_certificate', label: '수료증' },
      { id: 'fv_stats', label: '실적 및 통계' },
      { id: 'fv_log', label: '로그' },
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
      { id: 'fd_payment_doc', label: '지급조서' },
      { id: 'fd_certificate', label: '수료증' },
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
      { id: 'misc_instructor_match', label: '강사 매칭' },
      { id: 'misc_program_post', label: '프로그램 게시글 관리' },
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

function flagsAll(value: boolean): AdminPermissionFlags {
  return Object.fromEntries(ALL_ITEM_IDS.map(id => [id, value])) as AdminPermissionFlags
}

/** 역할별 초기 체크 상태 (UI 미리보기용, 저장 없음) */
export function createInitialPermissionsByRole(): AdminPermissionFlagsByRole {
  const base: Partial<AdminPermissionFlagsByRole> = {}
  for (const role of ADMIN_PERMISSION_ROLE_TABS) {
    if (role === 'viewer') {
      base[role] = flagsAll(false)
    } else {
      base[role] = flagsAll(true)
    }
  }
  return base as AdminPermissionFlagsByRole
}

export function isValidRoleTab(value: string | null): value is AdminPermissionRoleTab {
  return ADMIN_PERMISSION_ROLE_TABS.includes(value as AdminPermissionRoleTab)
}
