/**
 * 다운로드 보호 정책 상수
 * Phase 0.5.3: 다운로드 보호 UX (NFR-DATA-01, NFR-DATA-02)
 */

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
   * 전화번호 마스킹: 010-****-1234
   */
  phone: (value: string): string => {
    if (!value) return value
    return value.replace(/(\d{3})-?(\d{4})-?(\d{4})/, '$1-****-$3')
  },

  /**
   * 이메일 마스킹: t***@example.com
   */
  email: (value: string): string => {
    if (!value) return value
    const [local, domain] = value.split('@')
    if (!local || !domain) return value
    return `${local[0]}***@${domain}`
  },

  /**
   * 계좌번호 마스킹: ****-****-****-1234
   */
  accountNumber: (value: string): string => {
    if (!value) return value
    if (value.length <= 4) return '*'.repeat(value.length)
    return '*'.repeat(value.length - 4) + value.slice(-4)
  },

  /**
   * 이름 마스킹: 홍*동
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
