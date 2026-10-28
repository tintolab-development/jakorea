import type { InstructorApprovalCancelModalCase } from '@/features/user/api/lib/approval-notification-case'

export const INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_TITLE = '강사 권한 승인 취소 안내'

export const INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_REASON_PLACEHOLDER =
  '취소 사유를 입력해 주세요'

export const INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_UNKNOWN_CASE_ALERT = {
  title: '승인 알림 상태 확인',
  content: '승인 알림 발송 상태를 확인할 수 없어 승인 취소를 진행할 수 없습니다.',
} as const

const CASE_1_BODY_LINES = [
  '취소 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.',
  '발송 예정인 승인 알림이 있는 경우, 자동으로 취소되며 해당 건만 발송됩니다.',
] as const

const CASE_2_BODY_LINES = [
  '취소 시 입력하신 사유는 취소 사유로 기록되며, 승인 취소 알림은 현재 발송 보류 중입니다.',
  '해당 회원의 강사 권한이 회수되며, 기존 개인 또는 교사 역할은 유지됩니다.',
] as const

export function buildInstructorPermissionCancelApprovalMessage(
  modalCase: InstructorApprovalCancelModalCase,
  displayName: string
): string {
  const name = displayName.trim() || '회원'
  const lead = `**[${name}]** 님의 강사 권한 승인을 취소하시겠습니까?`
  const rest = modalCase === 'CASE_1' ? CASE_1_BODY_LINES : CASE_2_BODY_LINES
  return [lead, ...rest].join('\n')
}
