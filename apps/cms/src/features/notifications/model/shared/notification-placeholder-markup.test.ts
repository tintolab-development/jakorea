import { describe, expect, it } from 'vitest'
import {
  extractNotificationPlaceholderKeys,
  normalizeNotificationPlaceholderMarkup,
} from './notification-placeholder-markup'

describe('normalizeNotificationPlaceholderMarkup', () => {
  it('decodes HTML entity braces so BE #{키} regex can match', () => {
    expect(
      normalizeNotificationPlaceholderMarkup(
        '<p>#&#123;회원명&#125;#&#123;사용자 아이디(이메일)&#125;</p>'
      )
    ).toBe('<p>#{회원명}#{사용자 아이디(이메일)}</p>')
  })

  it('keeps already-literal tokens', () => {
    expect(normalizeNotificationPlaceholderMarkup('안녕 #{회원명}')).toBe('안녕 #{회원명}')
  })
})

describe('extractNotificationPlaceholderKeys', () => {
  it('extracts keys from entity-encoded markup', () => {
    expect(
      extractNotificationPlaceholderKeys(
        '<p>#&#123;회원명&#125;</p>',
        '제목 #&#x7b;사용자 아이디(이메일)&#x7d;'
      )
    ).toEqual(['회원명', '사용자 아이디(이메일)'])
  })
})
