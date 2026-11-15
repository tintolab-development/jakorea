import { PLATFORM_ALERT_COPY } from '@/shared/lib/platform-alert-copy'

/**
 * QA-0137: 새로고침·새 탭 시작 시 로그인 복원 실패 안내 문구 (`PLATFORM_SESSION_POLICY_DISPLAY`와 같은 형식).
 * packages/domain은 수정하지 않으므로 Platform 안에 둔다.
 * 세션 종료(session-ended·session-expired)는 시안 「자동 로그아웃된 경우」(14487-51034) 문구를 쓴다.
 * 확인 불가(unavailable: 네트워크·5xx·timeout)는 시안 「네트워크 오류 안내」(14491-2874) 문구를 쓴다.
 */
export const PLATFORM_AUTH_RESTORE_NOTICE_DISPLAY = {
  sessionEndedTitle: PLATFORM_ALERT_COPY.autoLoggedOut.title,
  sessionEndedBody: PLATFORM_ALERT_COPY.autoLoggedOut.description,
  unavailableTitle: PLATFORM_ALERT_COPY.networkError.title,
  unavailableBody: PLATFORM_ALERT_COPY.networkError.description,
  closeLabel: '닫기',
  signInLabel: '로그인',
  confirmLabel: '확인',
  retryLabel: '다시 시도',
} as const
