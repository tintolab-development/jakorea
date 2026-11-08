export const INSTRUCTOR_PERMISSION_REVOKE_TITLE = '강사 권한 종료 처리 안내'

export const INSTRUCTOR_PERMISSION_REVOKE_REASON_LABEL = '권한 종료 사유'

export const INSTRUCTOR_PERMISSION_REVOKE_REASON_PLACEHOLDER =
  '권한 종료 사유를 입력해 주세요'

export const INSTRUCTOR_PERMISSION_REVOKE_CONFIRM_LABEL = '권한 종료'

export const INSTRUCTOR_PERMISSION_REVOKE_HEADER_LABEL = '강사 권한 종료'

/** 권한 종료 완료 안내 (시안) */
export const INSTRUCTOR_PERMISSION_REVOKE_COMPLETE_TITLE = '강사 권한 종료 완료'

export function buildInstructorPermissionRevokeCompleteMessage(displayName: string): string {
  const name = displayName.trim() || '회원'
  return `**[${name}]** 님의 강사 권한이 종료되었습니다.`
}

/** 진행 중 프로그램으로 권한 종료가 차단된 경우 — 승인 취소 불가 안내와 문구를 구분한다. */
export const INSTRUCTOR_PERMISSION_REVOKE_BLOCKED_ALERT = {
  title: '강사 권한 종료 불가 안내',
  content: [
    '해당 회원은 현재 진행 중인 프로그램이 있습니다.',
    '진행 중인 프로그램이 있는 경우, 강사 권한 종료가 불가합니다.',
  ].join('\n'),
  confirmLabel: '확인',
} as const

const BODY_LINES = [
  '종료 시 입력하신 사유가 회원에게 권한 종료 사유로 안내되며, 알림이 발송됩니다.',
  '해당 회원은 일반 회원(개인 또는 교사)으로 변경됩니다.',
] as const

export function buildInstructorPermissionRevokeMessage(displayName: string): string {
  const name = displayName.trim() || '회원'
  const lead = `**[${name}]** 님의 강사 권한을 종료하시겠습니까?`
  return [lead, ...BODY_LINES].join('\n')
}
