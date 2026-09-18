/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { render } from '@testing-library/react'
import {
  PRIVACY_ADDRESS_BLUR_TOKEN,
  displayServerPiiAsIs,
  isPrivacyAddressBlurToken,
  PrivacyHomeAddressDisplay,
} from './program-pii-display'

describe('program-pii-display', () => {
  it('detects ***** blur token', () => {
    expect(isPrivacyAddressBlurToken(PRIVACY_ADDRESS_BLUR_TOKEN)).toBe(true)
    expect(isPrivacyAddressBlurToken(' ******* ')).toBe(false)
    expect(isPrivacyAddressBlurToken(null)).toBe(false)
  })

  it('displays server PII as-is without remasking', () => {
    expect(displayServerPiiAsIs('010-****-5678')).toBe('010-****-5678')
    expect(displayServerPiiAsIs('0915***@naver.com')).toBe('0915***@naver.com')
    expect(displayServerPiiAsIs('**대학교')).toBe('**대학교')
    expect(displayServerPiiAsIs('')).toBe('-')
    expect(displayServerPiiAsIs(null)).toBe('-')
  })

  it('blurs ***** in single-line home address', () => {
    const { container } = render(
      createElement(PrivacyHomeAddressDisplay, {
        address: '강서구 화곡동 *****',
        revealed: false,
      })
    )
    expect(container.textContent).toBe('강서구 화곡동 *****')
    expect(container.querySelector('.program-pii-address-blur')?.textContent).toBe('*****')
  })

  it('blurs split homeAddressDetail token', () => {
    const { container } = render(
      createElement(PrivacyHomeAddressDisplay, {
        address: '강서구 화곡동',
        addressDetail: '*****',
        revealed: false,
      })
    )
    expect(container.querySelector('.program-pii-address-blur')?.textContent).toBe('*****')
    expect(container.textContent).toContain('강서구 화곡동')
  })

  it('does not blur when revealed', () => {
    const { container } = render(
      createElement(PrivacyHomeAddressDisplay, {
        address: '강서구 화곡동 *****',
        revealed: true,
      })
    )
    expect(container.querySelector('.program-pii-address-blur')).toBeNull()
    expect(container.textContent).toBe('강서구 화곡동 *****')
  })

  it('treats null detail as no detail line', () => {
    const { container } = render(
      createElement(PrivacyHomeAddressDisplay, {
        address: '강서구 화곡동',
        addressDetail: null,
        revealed: false,
      })
    )
    expect(container.textContent).toBe('강서구 화곡동')
    expect(container.querySelector('.program-pii-address-blur')).toBeNull()
  })
})
