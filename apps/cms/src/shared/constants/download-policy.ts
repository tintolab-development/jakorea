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
    if (value.includes('*')) return value
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
   * 이메일 마스킹: 로컬파트 마지막 3글자만 `*`
   * - 0915123@naver.com -> 0915***@naver.com
   * 이미 `*`가 있으면 재마스킹하지 않는다. 로컬 3자 이하는 전부 `*`.
   */
  email: (value: string): string => {
    if (!value) return value
    const at = value.lastIndexOf('@')
    if (at <= 0 || at === value.length - 1) return '***'
    const local = value.slice(0, at)
    const domain = value.slice(at + 1)
    if (local.includes('*') || domain.includes('*')) return value
    if (local.length <= 3) return `${'*'.repeat(local.length)}@${domain}`
    return `${local.slice(0, local.length - 3)}***@${domain}`
  },

  /**
   * 계좌번호 마스킹: 숫자만 전부 `*` (하이픈·공백 등 비숫자 구분자는 유지)
   * 은행명은 호출부에서 별도 필드로 두고 마스킹하지 않음.
   */
  accountNumber: (value: string): string => {
    if (!value) return value
    if (value.includes('*')) return value
    return value.replace(/\d/g, '*')
  },

  /**
   * 예금주: 성 + 마지막 글자. 중간만 `*`.
   * 성 다음이 한 글자면 그 글자를 마스킹 (`김이` → `김*`).
   * 복성 2글자. 이미 `*`면 재마스킹하지 않음.
   */
  accountHolderName: (value: string): string => {
    if (!value) return value
    const trimmed = value.trim()
    if (!trimmed || trimmed.includes('*')) return value
    let surnameLen = 1
    if (trimmed.length >= 2 && COMPOUND_SURNAMES_TWO.has(trimmed.slice(0, 2))) {
      surnameLen = 2
    }
    if (trimmed.length <= surnameLen) return '*'.repeat(trimmed.length)
    if (trimmed.length === surnameLen + 1) {
      return trimmed.slice(0, surnameLen) + '*'
    }
    const middleLen = trimmed.length - surnameLen - 1
    return trimmed.slice(0, surnameLen) + '*'.repeat(middleLen) + trimmed.slice(-1)
  },

  /**
   * 이름 마스킹: 홍*동 (목록·일반 표시용)
   */
  name: (value: string): string => {
    if (!value) return value
    if (value.includes('*')) return value
    if (value.length <= 2) return value[0] + '*'
    return value[0] + '*'.repeat(value.length - 2) + value.slice(-1)
  },

  /**
   * 주민등록번호 마스킹: 123456-1******
   * 형식이 아니면 원문을 남기지 않는다.
   */
  residentNumber: (value: string): string => {
    if (!value) return value
    if (value.includes('*')) return value
    const matched = value.match(/^(\d{6})-?(\d)(\d{6})$/)
    if (!matched) return '******-*******'
    return `${matched[1]}-${matched[2]}******`
  },

  /**
   * 주소: 지번은 동·읍·면·리까지, 도로명은 도로명까지. 이후는 블러.
   * 구분할 수 없으면 원문을 남기지 않는다.
   */
  address: (value: string): string => {
    if (!value) return value
    const trimmed = value.trim()
    if (!trimmed || trimmed.includes('*')) return value
    const tokens = trimmed.split(/\s+/).filter(Boolean)
    const roadIdx = tokens.findIndex(token => /(로|길|대로)$/.test(token))
    if (roadIdx >= 0) {
      return `${tokens.slice(0, roadIdx + 1).join(' ')} ***`
    }
    const lotIdx = tokens.findIndex(token => /(동|읍|면|리)$/.test(token))
    if (lotIdx >= 0) {
      return `${tokens.slice(0, lotIdx + 1).join(' ')} ***`
    }
    return '***'
  },
} as const

/**
 * 마스킹 정책 타입
 */
export type MaskingPolicy = keyof typeof MASKING_POLICY
