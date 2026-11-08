/** 서버 계약: 유휴 30분 · 절대 12시간 · 경고 5분 전. FE가 만료를 발명하지 않고 표시·리드타임에만 쓴다. */
export const SESSION_IDLE_MAX_MS = 30 * 60 * 1000
export const SESSION_ABSOLUTE_MAX_MS = 12 * 60 * 60 * 1000
export const SESSION_WARNING_LEAD_MS = 5 * 60 * 1000
/** FE Activity 네트워크 throttle (BE 60초 기록 억제와 별개) */
export const SESSION_ACTIVITY_NETWORK_THROTTLE_MS = 45 * 1000
/** 한 제스처에서 touchstart+pointerdown 중복 제거 */
export const SESSION_GESTURE_DEDUPE_MS = 400
/** 같은 만료 시각 경고를 닫은 뒤 재노출 간격 */
export const SESSION_REEXPOSE_INTERVAL_MS = 60 * 1000

/**
 * CMS·Admin 세션 경고 카피 — CMS Figma 16011:86296 (유휴 16011:86297 / 절대 16011:86520).
 * 시안 문구 그대로 「5분」 고정 (라이브 카운트다운 미표시).
 */
export const SESSION_POLICY_DISPLAY = {
  idleTitle: '로그인 종료 예정 안내',
  idleBody:
    '장시간 이용하지 않아 5분 후 자동으로 로그아웃됩니다.\n계속 이용하시려면 [로그인 연장]을 눌러 주세요.',
  idleLogoutLabel: '로그아웃',
  idleExtendLabel: '로그인 연장',
  idleExtendError: '세션을 연장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  absoluteTitle: '로그인 종료 예정 안내',
  absoluteBody:
    '5분 후 로그인 유지 시간이 종료되어 자동으로 로그아웃됩니다.\n계속 이용하시려면 로그아웃된 후 다시 로그인해 주세요.',
  absoluteConfirmLabel: '확인',
} as const

/**
 * Platform(사용자) 세션 경고 카피 — 플랫폼 Figma 유휴 13772:86968 / 절대 13775:86982 (해요체).
 * 시안 문구 그대로 「5분」 고정.
 */
export const PLATFORM_SESSION_POLICY_DISPLAY = {
  idleTitle: '로그인이 곧 종료돼요.',
  idleBody:
    '장시간 이용하지 않아 5분 후 자동으로 로그아웃돼요.\n계속 이용하시려면 [로그인 연장]을 눌러 주세요.',
  idleLogoutLabel: '로그아웃',
  idleExtendLabel: '로그인 연장',
  idleExtendError: '로그인을 연장하지 못했어요. 잠시 후 다시 시도해 주세요.',
  absoluteTitle: '로그인이 곧 종료돼요.',
  absoluteBody:
    '5분 후 로그인 유지 시간이 종료되어 자동으로 로그아웃돼요.\n계속 이용하시려면 로그아웃된 후 다시 로그인해 주세요.',
  absoluteConfirmLabel: '확인',
} as const
