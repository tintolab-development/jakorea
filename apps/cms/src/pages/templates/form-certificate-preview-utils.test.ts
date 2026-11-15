import { describe, expect, it } from 'vitest'
import {
  CERTIFICATE_TITLE_BOX_HEIGHT_PX,
  formatCertificateDateText,
  formatCertificateIssueDate,
  resolveCertificateTitleLayout,
} from './form-certificate-preview-utils'

/** 시안 5767:47203 — 생년월일·기간·발급일 모두 `YYYY.MM.DD` */
describe('formatCertificateDateText', () => {
  it('normalizes ISO, Korean and dotted dates to YYYY.MM.DD', () => {
    expect(formatCertificateDateText('2009-09-15')).toBe('2009.09.15')
    expect(formatCertificateDateText('2009년 9월 3일')).toBe('2009.09.03')
    expect(formatCertificateDateText('2009.9.3')).toBe('2009.09.03')
    expect(formatCertificateDateText('2009/09/15')).toBe('2009.09.15')
  })

  it('keeps the period separator and surrounding text', () => {
    expect(formatCertificateDateText('2026년 10월 31일 ~ 2026년 12월 1일')).toBe('2026.10.31 ~ 2026.12.01')
    expect(formatCertificateDateText('2026.06.05 ~ 2026.12.29')).toBe('2026.06.05 ~ 2026.12.29')
  })

  it('leaves non-date text and invalid dates unchanged', () => {
    expect(formatCertificateDateText('-')).toBe('-')
    expect(formatCertificateDateText('')).toBe('')
    expect(formatCertificateDateText(null)).toBe('')
    expect(formatCertificateDateText('2026-13-40')).toBe('2026-13-40')
  })
})

describe('formatCertificateIssueDate', () => {
  it('formats the Asia/Seoul calendar day as YYYY.MM.DD', () => {
    expect(formatCertificateIssueDate(new Date('2026-04-29T15:30:00Z'))).toBe('2026.04.30')
  })
})

describe('resolveCertificateTitleLayout', () => {
  it('keeps the 100px single-line title for short names', () => {
    expect(resolveCertificateTitleLayout('수료증')).toEqual({
      fontSize: 100,
      letterSpacing: 16,
      wrap: false,
      lineHeight: CERTIFICATE_TITLE_BOX_HEIGHT_PX,
    })
    expect(resolveCertificateTitleLayout('봉사 활동인증서').fontSize).toBe(100)
  })

  it('shrinks the font size as the title grows, without wrapping', () => {
    const layout = resolveCertificateTitleLayout('프로그램 참가 확인 인증서')
    expect(layout.wrap).toBe(false)
    expect(layout.fontSize).toBeLessThan(100)
    expect(layout.fontSize).toBeGreaterThanOrEqual(56)
  })

  it('wraps into two lines that fit the title box for long titles', () => {
    const layout = resolveCertificateTitleLayout('가나다라마바사아자차카타파하가나다라마바')
    expect(layout.wrap).toBe(true)
    expect(layout.fontSize).toBeLessThanOrEqual(56)
    expect(layout.lineHeight * 2).toBeLessThanOrEqual(CERTIFICATE_TITLE_BOX_HEIGHT_PX)
  })

  it('returns the same layout for the same text (preview and PDF share it)', () => {
    const title = '청소년 경제교육 봉사 활동인증서'
    expect(resolveCertificateTitleLayout(title)).toEqual(resolveCertificateTitleLayout(title))
  })
})
