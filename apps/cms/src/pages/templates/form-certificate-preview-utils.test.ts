import { describe, expect, it } from 'vitest'
import {
  CERTIFICATE_TITLE_BOX_HEIGHT_PX,
  resolveCertificateTitleLayout,
} from './form-certificate-preview-utils'

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
