/** QA-0137 새로고침 세션 복원 실패 안내 문구 — CMS `SESSION_ENDED_NOTICE`(시안 「자동 로그아웃 안내」)와 같은 문구 */

export const BOOTSTRAP_SESSION_ENDED_NOTICE = {
  title: '자동 로그아웃 안내',
  content: '보안을 위해 로그인 세션이 종료되었습니다.\n계속 이용하시려면 다시 로그인해 주세요.',
  confirmLabel: '확인',
} as const

export const BOOTSTRAP_SESSION_UNREACHABLE_NOTICE = {
  title: '로그인 정보를 확인하지 못했어요.',
  content: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
  cancelLabel: '닫기',
  retryLabel: '다시 시도',
} as const
