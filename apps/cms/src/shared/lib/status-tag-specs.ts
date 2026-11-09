/**
 * 값 → 공통 StatusTag 스펙(라벨·색) 매핑 모음.
 * StatusDropdownCell `getTag`, 읽기 전용 `<StatusTag {...spec} />` 모두 여기 함수를 쓴다.
 * 색은 tone 프리셋 또는 accentColor로만 정한다 — 화면 CSS로 태그 색·크기를 지정하지 않는다.
 */

import type { StatusTagSpec, StatusTagTone } from '@/shared/components/status-tag'
import {
  SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL,
  SPONSOR_SPONSORSHIP_STATUS_LABEL,
  getEmploymentBadgeTone,
  getInstructorRoleBadgeTone,
  getManagerEvaluationBadgeTone,
  getProgramRoleBadgeTone,
  getSponsorSponsorshipStatusBadgeTone,
  getTextbookStatusBadgeTone,
  type ManagerEvaluationBadgeKey,
} from '@/shared/constants/editable-status-badge-tones'
import {
  getInstructorSettlementStatusPresentation,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'
import { PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR } from '@/shared/constants/payment-order-status-list-colors'
import { getProgramLifecycleLabel, getProgramProgressPhase } from '@/shared/constants/status'
import {
  getTypedProgramLifecycleDisplay,
  normalizeTypedProgramLifecycleStatus,
} from '@/shared/lib/program-typed-lifecycle'
import {
  ASSIGNMENT_TEAM_ROLE_LABELS,
  INSTRUCTOR_ROLE_LABELS,
  type AssignmentTeamRoleKey,
  type InstructorRoleKey,
} from '@/features/program/general/model/school-detail-types'
import {
  PARTICIPATING_INSTITUTION_TEXTBOOK_STATUS_LABELS,
  TEXTBOOK_STATUS_LABELS,
  type TextbookStatusKey,
} from '@/features/program/general/model/participating-schools'
import { PROGRAM_ROLE_LABELS } from '@/features/program/general/model/program-managers'
import { UJAT_MANAGER_EVALUATION_LABELS } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import {
  PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS,
  type PaymentOrderAdminLineProcessingStatus,
} from '@/features/settlement-management/model/payment-order-admin-list'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import {
  UJAT_VOLUNTEER_SCHEDULE_ROLE_LABEL,
  type UjatVolunteerScheduleRole,
} from '@/features/program/ujat/ui/detail-modal/progress/volunteers/detail/assignment-types'
import type { ProgramLifecycleStatus, SponsorSponsorshipStatus } from '@/types/domain'
import type { ProgramRole, SchoolTeacherEmploymentStatus } from '@/types/user'

/* ----- 교재·결재 ----- */

export function getTextbookStatusTag(status: TextbookStatusKey): StatusTagSpec {
  return { label: TEXTBOOK_STATUS_LABELS[status], tone: getTextbookStatusBadgeTone(status) }
}

/** 참여 기관 교재 배송 현황 — 라벨만 기관용 (해당 없음은 태그 대신 '-') */
export function getParticipatingInstitutionTextbookStatusTag(
  status: Exclude<TextbookStatusKey, 'not_applicable'>
): StatusTagSpec {
  return {
    label: PARTICIPATING_INSTITUTION_TEXTBOOK_STATUS_LABELS[status],
    tone: getTextbookStatusBadgeTone(status),
  }
}

export type ApprovalStatusKey = 'pending' | 'rejected' | 'approved' | 'cancelled'

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatusKey, string> = {
  pending: '승인 대기',
  rejected: '신청 반려',
  approved: '승인 완료',
  cancelled: '신청 취소',
}

/** Program application Text — Tag와 표현 종류를 구분하고 현행 문구·색을 보존한다. */
const APPROVAL_STATUS_TEXT_ACCENT: Record<ApprovalStatusKey, string> = {
  pending: 'var(--Status-green-main, #1e8c29)',
  rejected: 'var(--Status-red-main, #c32f4a)',
  approved: 'var(--Netural-black, #3d3d3d)',
  cancelled: '#e65100',
}

export function getApprovalStatusTextPresentation(status: ApprovalStatusKey) {
  return { label: APPROVAL_STATUS_LABELS[status], accentColor: APPROVAL_STATUS_TEXT_ACCENT[status] }
}

/** 기관·개인·강사 신청의 동일 필터. 순서/값/허용 상태는 현행 그대로. */
export function getApprovalStatusFilterOptions() {
  return [
    { label: '전체', value: 'all' },
    ...(['pending', 'rejected', 'approved'] as const).map(value => ({
      label: APPROVAL_STATUS_LABELS[value], value,
    })),
  ]
}

const APPROVAL_STATUS_TONE: Record<ApprovalStatusKey, StatusTagTone> = {
  pending: 'green',
  rejected: 'red',
  approved: 'gray',
  cancelled: 'orange',
}

export function getApprovalStatusTag(status: ApprovalStatusKey): StatusTagSpec {
  return { label: APPROVAL_STATUS_LABELS[status], tone: APPROVAL_STATUS_TONE[status] }
}

/* ----- 정산 ----- */

/** 지급조서 처리 현황(라인) — 목록 글자색을 accent로 사용 */
export function getPaymentOrderLineStatusTag(
  status: PaymentOrderAdminLineProcessingStatus
): StatusTagSpec {
  return {
    label: PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS[status],
    accentColor: PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR[status],
  }
}

/** 강사 정산 현황 8종 */
/**
 * 정산 현황 Tag — Figma Status / Tag / 정산 현황(14804:19759): 64×24 테두리 태그 + Short 라벨.
 * 정산만 공통 값 태그 크기의 예외(사용자 확정 2026-11-09).
 */
export function getInstructorSettlementStatusTag(status: InstructorSettlementUiStatus): StatusTagSpec {
  const presentation = getInstructorSettlementStatusPresentation(status, 'tag')
  return { label: presentation.label, accentColor: presentation.color, shape: 'outline' }
}

/* ----- 역할·권한 ----- */

export function getInstructorRoleTag(role: InstructorRoleKey): StatusTagSpec {
  return { label: INSTRUCTOR_ROLE_LABELS[role], tone: getInstructorRoleBadgeTone(role) }
}

/** 팀장 blue · 팀원/개인 gray */
export function getAssignmentTeamRoleTag(role: AssignmentTeamRoleKey): StatusTagSpec {
  return { label: ASSIGNMENT_TEAM_ROLE_LABELS[role], tone: role === 'leader' ? 'blue' : 'gray' }
}

export function getProgramRoleTag(role: ProgramRole): StatusTagSpec {
  return { label: PROGRAM_ROLE_LABELS[role], tone: getProgramRoleBadgeTone(role) }
}

const ADMIN_PERMISSION_TONE: Record<AdminPermissionTagVariant, StatusTagTone> = {
  manager: 'blue',
  accounting: 'purple',
  partner: 'green',
  viewer: 'gray',
}

export function getAdminPermissionTag(variant: AdminPermissionTagVariant): StatusTagSpec {
  return { label: ADMIN_PERMISSION_TAG_LABEL[variant], tone: ADMIN_PERMISSION_TONE[variant] }
}

/** UJAT 봉사자 회차 역할 — 출결 담당 blue · 해당 없음 gray */
export function getUjatVolunteerScheduleRoleTag(role: UjatVolunteerScheduleRole): StatusTagSpec {
  return {
    label: UJAT_VOLUNTEER_SCHEDULE_ROLE_LABEL[role],
    tone: role === 'attendance_manager' ? 'blue' : 'gray',
  }
}

export type SponsorContactType = 'lead' | 'assistant'

export function getSponsorContactTypeTag(type: SponsorContactType): StatusTagSpec {
  return type === 'lead' ? { label: '주 담당자', tone: 'blue' } : { label: '담당자', tone: 'gray' }
}

/* ----- 상태 ----- */

/** 재직 현황 */
export function getEmploymentStatusTag(status: SchoolTeacherEmploymentStatus): StatusTagSpec {
  return { label: SCHOOL_TEACHER_EMPLOYMENT_BADGE_LABEL[status], tone: getEmploymentBadgeTone(status) }
}

export function getSponsorSponsorshipStatusTag(status: SponsorSponsorshipStatus): StatusTagSpec {
  return {
    label: SPONSOR_SPONSORSHIP_STATUS_LABEL[status],
    tone: getSponsorSponsorshipStatusBadgeTone(status),
  }
}

/** 담당자 서류 평가 (일반·UJAT 공통 키) */
export function getManagerEvaluationTag(evaluation: ManagerEvaluationBadgeKey): StatusTagSpec {
  return {
    label: UJAT_MANAGER_EVALUATION_LABELS[evaluation],
    tone: getManagerEvaluationBadgeTone(evaluation),
  }
}

/** 프로그램 진행 현황 — 4탭 목록 페이지는 3단계 라벨(예정 green·진행 blue·완료 gray) */
export function getProgramLifecycleStatusTag(
  status: ProgramLifecycleStatus,
  options: { overviewListPage: boolean }
): StatusTagSpec {
  if (options.overviewListPage) {
    const typed = normalizeTypedProgramLifecycleStatus(status)
    const phase =
      typed === 'in_progress'
        ? 'inProgress'
        : typed === 'completed'
          ? 'completed'
          : typed === 'scheduled' || typed === 'recruiting_students'
            ? 'scheduled'
            : getProgramProgressPhase(status)
    const tone: StatusTagTone =
      phase === 'inProgress' ? 'blue' : phase === 'completed' ? 'gray' : 'green'
    return { label: getTypedProgramLifecycleDisplay(status).label, tone }
  }
  const phase = getProgramProgressPhase(status)
  const tone: StatusTagTone =
    phase === 'inProgress' ? 'blue' : phase === 'completed' ? 'gray' : 'pink'
  return { label: getProgramLifecycleLabel(status), tone }
}

/** `/programs/...` 4탭 목록 경로 여부 (ProgramLifecycleStatusBadge 와 동일 규칙) */
export function isProgramOverviewListPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/'
  return (
    p === '/programs/economy-education' ||
    p === '/programs/company-school' ||
    p.startsWith('/programs/company-school/') ||
    p === '/programs/general' ||
    p.startsWith('/programs/general/') ||
    p === '/programs/trained-teachers' ||
    p.startsWith('/programs/trained-teachers/')
  )
}
