export const INSTRUCTOR_PERMISSION_REVOKE_TITLE = '강사 권한 종료 안내'

export const INSTRUCTOR_PERMISSION_REVOKE_REASON_LABEL = '권한 종료 사유'

export const INSTRUCTOR_PERMISSION_REVOKE_REASON_PLACEHOLDER =
  '권한 종료 사유를 입력해 주세요'

export const INSTRUCTOR_PERMISSION_REVOKE_CONFIRM_LABEL = '권한 종료'

export const INSTRUCTOR_PERMISSION_REVOKE_HEADER_LABEL = '강사 권한 종료'

const BODY_LINES = [
  '종료 시 입력하신 사유가 회원에게 권한 종료 사유로 안내되며, 알림이 발송됩니다.',
  '해당 회원은 일반 회원(개인 또는 교사)으로 변경됩니다.',
] as const

export function buildInstructorPermissionRevokeMessage(displayName: string): string {
  const name = displayName.trim() || '회원'
  const lead = `**[${name}]** 님의 강사 권한을 종료하시겠습니까?`
  return [lead, ...BODY_LINES].join('\n')
}
