export const EMAIL_ID_MAX_LENGTH = 254
export const EMAIL_ID_LOCAL_PART_MAX_LENGTH = 64

export const EMAIL_ID_MESSAGES = {
  empty: '이메일을 입력해 주세요.',
  invalidFormat: '이메일 형식에 맞게 입력해 주세요.',
  duplicate: '이미 가입된 이메일이에요. 로그인하거나 다른 이메일을 입력해 주세요.',
  forbidden: '사용할 수 없는 이메일이에요. 다른 이메일을 입력해 주세요.',
  lengthExceeded: '이메일은 최대 254자까지 입력할 수 있어요.',
  whitespace: '이메일에는 공백을 사용할 수 없어요.',
} as const

/** local-part 단독 사용 제한 예약어 (완전 일치) */
export const EMAIL_ID_RESERVED_LOCAL_PARTS = [
  'admin',
  'administrator',
  'root',
  'system',
  'manager',
  'master',
  'owner',
  'operator',
  'support',
  'help',
  'cs',
  'customer',
  'service',
  'official',
  'notice',
  'noreply',
  'no-reply',
  'security',
  'privacy',
  'abuse',
  'webmaster',
  'postmaster',
] as const

/** 서비스·브랜드 사칭 가능 단어 (compact local-part 포함 여부 검사) */
export const EMAIL_ID_BRAND_TOKENS = ['jakorea', 'jajkorea'] as const

/**
 * 명백한 부적절 표현 (compact local-part 포함 여부 검사).
 * 운영 정책에 따라 목록을 확장한다.
 */
export const EMAIL_ID_INAPPROPRIATE_TOKENS = [
  'fuck',
  'shit',
  'bitch',
  'sex',
  'porn',
  'nazi',
] as const

export const EMAIL_ID_LOCAL_PART_PATTERN = /^[a-z0-9._+-]+$/
export const EMAIL_ID_DOMAIN_PATTERN = /^[a-z0-9.-]+$/
