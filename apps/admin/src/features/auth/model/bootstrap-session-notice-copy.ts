/** QA-0137 새로고침 세션 복원 실패 안내 문구 (사용자 확정 문구) */

export const BOOTSTRAP_SESSION_ENDED_NOTICE = {
  title: '로그인이 종료되었어요.',
  content: '로그인 유지 시간이 지났거나 로그아웃되어 다시 로그인이 필요해요.',
  confirmLabel: '확인',
} as const

export const BOOTSTRAP_SESSION_UNREACHABLE_NOTICE = {
  title: '로그인 정보를 확인하지 못했어요.',
  content: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
  cancelLabel: '닫기',
  retryLabel: '다시 시도',
} as const
