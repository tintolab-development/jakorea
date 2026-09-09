import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { renderNotificationVariableText } from './render-notification-variable-text'

describe('renderNotificationVariableText', () => {
  it('wraps #{...} tokens in notification-variable-token spans', () => {
    const html = renderToStaticMarkup(
      createElement(Fragment, null, renderNotificationVariableText('안녕 #{회원명}님 #{프로그램명}'))
    )
    expect(html).toContain('class="notification-variable-token"')
    expect(html).toContain('#{회원명}')
    expect(html).toContain('#{프로그램명}')
    expect(html).toContain('안녕 ')
  })

  it('returns plain text when no tokens', () => {
    expect(renderNotificationVariableText('일반 문구')).toBe('일반 문구')
  })
})
