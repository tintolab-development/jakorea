/**
 * 다운로드 보호 정책 상수
 * Phase 0.5.3: 다운로드 보호 UX (NFR-DATA-01, NFR-DATA-02)
 */

/** 한국어 2글자 복성(예금주명 `accountHolderName` 마스킹 시 성 길이) */
const COMPOUND_SURNAMES_TWO = new Set([
  '남궁',
  '황보',
  '사공',
  '제갈',
  '선우',
  '독고',
  '동방',
  '서문',
])

/**
 * 다운로드 제한 정책
 */
export const DOWNLOAD_LIMITS = {
  maxRowsPerDownload: 1000,     // 최대 행수 제한
  dailyQuota: 5000,             // 일일 쿼터
  rateLimitPerMinute: 3,        // 분당 다운로드 횟수
  rateLimitWindowMs: 60 * 1000, // 레이트 리밋 윈도우 (1분)
} as const

/**
 * 마스킹 정책 함수
 */
export const MASKING_POLICY = {
  /**
   * 전화번호 마스킹: 가운데 국 번호·일련번호 구간을 `*` 처리
   * - 휴대폰 010-****-1234
   * - 유선 02-****-5678, 02-***-4567, 지역 031-***-4567 등
   */
  phone: (value: string): string => {
    if (!value) return value
    const v = value.trim()

    const hyphenRules: Array<[RegExp, string]> = [
      [/^(\d{3})-(\d{4})-(\d{4})$/, '$1-****-$3'],
      [/^(\d{2})-(\d{4})-(\d{4})$/, '$1-****-$3'],
      [/^(\d{2})-(\d{3})-(\d{4})$/, '$1-***-$3'],
      [/^(\d{3})-(\d{3})-(\d{4})$/, '$1-***-$3'],
    ]
    for (const [re, repl] of hyphenRules) {
      if (re.test(v)) return v.replace(re, repl)
    }

    const looseMobile = v.replace(/^(\d{3})-?(\d{4})-?(\d{4})$/, '$1-****-$3')
    if (looseMobile !== v) return looseMobile

    return v.replace(/(\d{3})-?(\d{4})-?(\d{4})/, '$1-****-$3')
  },

  /**
   * 이메일 마스킹: 로컬파트 앞 3글자 노출 + 나머지 `*`
   * - 0915123@naver.com -> 091***@naver.com
   */
  email: (value: string): string => {
    if (!value) return value
    const [local, domain] = value.split('@')
    if (!local || !domain) return value
    if (local.length <= 3) return `${local}***@${domain}`
    return `${local.slice(0, 3)}***@${domain}`
  },

  /**
   * 계좌번호 마스킹: 숫자만 전부 `*` (하이픈·공백 등 비숫자 구분자는 유지)
   * 은행명은 호출부에서 별도 필드로 두고 마스킹하지 않음.
   */
  accountNumber: (value: string): string => {
    if (!value) return value
    return value.replace(/\d/g, '*')
  },

  /**
   * 예금주명 마스킹: 성씨만 노출, 나머지 `*`
   * 단일 성(1글자) 기본, 복성은 아래 집합이면 앞 2글자를 성으로 간주.
   */
  accountHolderName: (value: string): string => {
    if (!value) return value
    const trimmed = value.trim()
    if (trimmed.length === 0) return value
    let surnameLen = 1
    if (trimmed.length >= 2 && COMPOUND_SURNAMES_TWO.has(trimmed.slice(0, 2))) {
      surnameLen = 2
    }
    if (trimmed.length <= surnameLen) return trimmed
    return trimmed.slice(0, surnameLen) + '*'.repeat(trimmed.length - surnameLen)
  },

  /**
   * 이름 마스킹: 홍*동 (목록·일반 표시용)
   */
  name: (value: string): string => {
    if (!value) return value
    if (value.length <= 2) return value[0] + '*'
    return value[0] + '*'.repeat(value.length - 2) + value.slice(-1)
  },

  /**
   * 주민등록번호 마스킹: 123456-1******
   */
  residentNumber: (value: string): string => {
    if (!value) return value
    return value.replace(/(\d{6})-?(\d{1})(\d{6})/, '$1-$2******')
  },

  /**
   * 주소 마스킹: 서울시 강남구 ***
   */
  address: (value: string): string => {
    if (!value) return value
    const parts = value.split(' ')
    if (parts.length <= 2) return value
    return parts.slice(0, 2).join(' ') + ' ***'
  },
} as const

/**
 * 마스킹 정책 타입
 */
export type MaskingPolicy = keyof typeof MASKING_POLICY
