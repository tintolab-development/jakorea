import { describe, expect, it } from 'vitest'
import {
  applyMailPreviewHtml,
  applyMailPreviewTokens,
  formatMailPreviewAttachment,
  formatMailPreviewDateTime,
  formatMailPreviewPerson,
  formatMailPreviewRecipient,
} from './preview'

describe('applyMailPreviewTokens', () => {
  it('replaces design sample variables in the subject', () => {
    expect(applyMailPreviewTokens('[JA Korea] #{프로그램명} 안내')).toBe('[JA Korea] JA KOREA 안내')
  })
})

describe('applyMailPreviewHtml', () => {
  it('unwraps mint spans and substitutes #{회원명}', () => {
    const html =
      '<p>안녕하세요, <strong><span style="color: #01A1AF; font-size: 15px">#{회원명}</span></strong>님</p>'
    expect(applyMailPreviewHtml(html)).toBe('<p>안녕하세요, <strong>이가원</strong>님</p>')
  })

  it('substitutes data-mail-variable chips', () => {
    const html = '<p>안녕 <span class="mail-template-variable" data-mail-variable="회원명">#{회원명}</span></p>'
    expect(applyMailPreviewHtml(html)).toBe('<p>안녕 이가원</p>')
  })
})

describe('formatMailPreviewDateTime', () => {
  it('matches the design date pattern', () => {
    expect(formatMailPreviewDateTime('2026-09-15T09:15:00+09:00')).toBe('2026. 9. 15 (화) 09:15')
  })
})

describe('formatMailPreviewPerson', () => {
  it('renders name and email like the design', () => {
    expect(formatMailPreviewPerson('홍길동', 'gildong@jakorea.org')).toBe(
      '홍길동 <gildong@jakorea.org>'
    )
  })

  it('falls back to email when the sender name is empty', () => {
    expect(formatMailPreviewPerson('', 'gildong@jakorea.org')).toBe('gildong@jakorea.org')
  })
})

describe('formatMailPreviewRecipient', () => {
  it('includes the sample extra recipient count', () => {
    expect(formatMailPreviewRecipient()).toBe('홍길동 <gildong@jakorea.org> 외 914명')
  })

  it('omits the extra count when there is a single recipient', () => {
    expect(
      formatMailPreviewRecipient({
        name: '홍길동',
        email: 'rkdtk@naver.com',
        extraCount: 0,
      })
    ).toBe('홍길동 <rkdtk@naver.com>')
  })
})

describe('formatMailPreviewAttachment', () => {
  it('appends KB when size is known', () => {
    expect(
      formatMailPreviewAttachment({
        name: '안내.pdf',
        sizeBytes: 62 * 1024,
      })
    ).toBe('안내.pdf (62KB)')
  })
})
