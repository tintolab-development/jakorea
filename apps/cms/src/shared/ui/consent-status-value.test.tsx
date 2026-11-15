// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ConsentStatusText, ConsentStatusValue } from './consent-status-value'

const DIVIDER = '.detail-info-form-inputs-separator'

describe('ConsentStatusValue — 시안 16299:623421 동의 칸', () => {
  afterEach(cleanup)

  it('미동의만 있으면 상태 문구만 두고 구분선을 두지 않는다', () => {
    const { container } = render(<ConsentStatusValue status="미동의" />)
    expect(container.textContent).toBe('미동의')
    expect(container.querySelector(DIVIDER)).toBeNull()
  })

  it('동의 일시가 있으면 상태 · 구분선 · 일시 순서로 둔다', () => {
    const { container } = render(
      <ConsentStatusValue status="동의" datetime="2026.01.15 09:15:42" />
    )
    const root = container.querySelector('.consent-status-value')
    const classes = Array.from(root?.children ?? []).map(el => el.className)
    expect(classes).toEqual([
      'consent-status-value__status',
      'detail-info-form-inputs-separator',
      'consent-status-value__datetime',
    ])
  })

  it('일시가 「-」이면 일시와 구분선을 두지 않는다', () => {
    const { container } = render(<ConsentStatusValue status="동의" datetime="-" />)
    expect(container.querySelector('.consent-status-value__datetime')).toBeNull()
    expect(container.querySelector(DIVIDER)).toBeNull()
  })

  it('버튼이 있으면 상태 뒤 구분선 하나, 그 뒤 버튼과 일시를 둔다', () => {
    const { container } = render(
      <ConsentStatusValue
        status="동의"
        action={<button type="button">동의 철회하기</button>}
        datetime="2026.01.15 09:15:42"
      />
    )
    const root = container.querySelector('.consent-status-value')
    const tags = Array.from(root?.children ?? []).map(el => el.tagName)
    expect(tags).toEqual(['SPAN', 'SPAN', 'BUTTON', 'SPAN'])
    expect(container.querySelectorAll(DIVIDER)).toHaveLength(1)
  })

  it('「동의 | 일시」 문자열은 문자 구분자 대신 공통 구분선으로 나눈다', () => {
    const { container } = render(<ConsentStatusText value="동의 | 2026.01.15 09:15:42" />)
    expect(container.textContent).not.toContain('|')
    expect(container.querySelector(DIVIDER)).not.toBeNull()
  })
})
