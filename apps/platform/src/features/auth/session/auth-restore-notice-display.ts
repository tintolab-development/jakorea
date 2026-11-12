/**
 * QA-0137: 새로고침·새 탭 시작 시 로그인 복원 실패 안내 문구 (`PLATFORM_SESSION_POLICY_DISPLAY`와 같은 형식).
 * packages/domain은 수정하지 않으므로 Platform 안에 둔다.
 */
export const PLATFORM_AUTH_RESTORE_NOTICE_DISPLAY = {
  sessionEndedTitle: '로그인이 종료되었어요.',
  sessionEndedBody: '로그인 유지 시간이 지났거나 로그아웃되어 다시 로그인이 필요해요.',
  unavailableTitle: '로그인 정보를 확인하지 못했어요.',
  unavailableBody: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
  closeLabel: '닫기',
  signInLabel: '로그인',
  confirmLabel: '확인',
  retryLabel: '다시 시도',
} as const
