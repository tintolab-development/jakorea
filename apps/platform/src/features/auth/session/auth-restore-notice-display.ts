import { PLATFORM_ALERT_COPY } from '@/shared/lib/platform-alert-copy'

/**
 * QA-0137: 새로고침·새 탭 시작 시 로그인 복원 실패 안내 문구 (`PLATFORM_SESSION_POLICY_DISPLAY`와 같은 형식).
 * packages/domain은 수정하지 않으므로 Platform 안에 둔다.
 * 세션 종료(session-ended·session-expired)는 시안 「자동 로그아웃된 경우」(14487-51034) 문구를 쓴다.
 */
export const PLATFORM_AUTH_RESTORE_NOTICE_DISPLAY = {
  sessionEndedTitle: PLATFORM_ALERT_COPY.autoLoggedOut.title,
  sessionEndedBody: PLATFORM_ALERT_COPY.autoLoggedOut.description,
  unavailableTitle: '로그인 정보를 확인하지 못했어요.',
  unavailableBody: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
  closeLabel: '닫기',
  signInLabel: '로그인',
  confirmLabel: '확인',
  retryLabel: '다시 시도',
} as const
