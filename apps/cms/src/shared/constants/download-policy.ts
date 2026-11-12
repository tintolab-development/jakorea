/**
 * 다운로드 보호 정책 상수
 * Phase 0.5.3: 다운로드 보호 UX (NFR-DATA-01, NFR-DATA-02)
 */

import { isMaskedHomeAddressLine, maskHomeAddressLine } from '@jakorea/ui/privacy'

/** 한국어 2글자 복성. 예금주 4글자 이상에서만 성을 2글자로 본다(기획 2026-11-12 Q4). */
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

/** 판단할 수 없는 전화번호를 원문 대신 표시하는 고정 마스킹 */
const PHONE_UNDISCLOSED = '****'

/**
 * 마스킹 정책 함수
 */
export const MASKING_POLICY = {
  /**
   * 전화번호 마스킹: 가운데 국번 구간을 `*` 처리하고 `지역-가운데-끝4자리`로 맞춘다.
   * - 휴대폰 010-****-5678 (하이픈·공백 없이 와도 같은 형식)
   * - 유선 02-****-5678, 02-***-4567, 지역 031-***-4567
   * 이미 `*`가 있으면 다시 가리지 않는다. 판단할 수 없는 형식(국외 번호, 자릿수 오류 등)은
   * 원문 대신 `****`를 돌려준다. Golden Vector PHONE 케이스와 같다.
   */
  phone: (value: string): string => {
    if (!value) return value
    const v = value.trim()
    if (!v) return value
    if (v.includes('*')) return v
    if (v === '-' || v === '—') return v
    if (!/^[\d\s-]+$/.test(v)) return PHONE_UNDISCLOSED
    const digits = v.replace(/\D/g, '')
    const areaLength = digits.startsWith('02') ? 2 : 3
    const middleLength = digits.length - areaLength - 4
    if (!digits.startsWith('0') || middleLength < 3 || middleLength > 4) return PHONE_UNDISCLOSED
    return `${digits.slice(0, areaLength)}-${'*'.repeat(middleLength)}-${digits.slice(-4)}`
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
   * 예금주: 성과 끝 글자를 빼고 가운데 글자 수만큼 `*` (고정 `**` 아님, 기획 2026-11-12 Q4).
   * - 김민이→김*이, 김민→김*, 김민철수→김**수, 남궁민수→남궁*수, 남궁민철수→남궁**수
   * - 4글자 이상이고 앞 두 글자가 복성(남궁·황보·제갈·선우·독고·사공·서문·동방)이면 성 2글자, 그 외 1글자.
   * 이미 `*`면 다시 가리지 않는다.
   */
  accountHolderName: (value: string): string => {
    if (!value) return value
    const trimmed = value.trim()
    if (!trimmed || trimmed.includes('*')) return value
    const surnameLen =
      trimmed.length >= 4 && COMPOUND_SURNAMES_TWO.has(trimmed.slice(0, 2)) ? 2 : 1
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
   * 자택 주소: 지번은 동·읍·면·리까지, 도로명은 도로명까지 보이고 나머지는 ` *****`.
   * BE와 같은 알고리즘(`maskHomeAddressLine`)을 쓴다. 판단할 수 없으면 `비공개`.
   * 이미 마스킹된 값(`*` 포함·`비공개`)은 다시 가리지 않는다.
   */
  address: (value: string): string => {
    if (!value) return value
    const trimmed = value.trim()
    if (!trimmed) return value
    if (isMaskedHomeAddressLine(trimmed)) return trimmed
    return maskHomeAddressLine(trimmed)
  },
} as const

/**
 * 마스킹 정책 타입
 */
export type MaskingPolicy = keyof typeof MASKING_POLICY
