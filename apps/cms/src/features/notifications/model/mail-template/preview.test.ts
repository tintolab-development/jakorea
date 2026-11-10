import { describe, expect, it } from 'vitest'
import {
  applyMailPreviewHtml,
  applyMailPreviewTokens,
  formatMailPreviewAttachment,
  formatMailPreviewDateTime,
  formatMailPreviewPerson,
  formatMailPreviewRecipient,
  splitMailSenderNameEmail,
} from './preview'

describe('applyMailPreviewTokens', () => {
  it('keeps variables in the subject as tokens', () => {
    expect(applyMailPreviewTokens('[JA Korea] #{프로그램명} 안내')).toBe(
      '[JA Korea] #{프로그램명} 안내'
    )
  })
})

describe('applyMailPreviewHtml', () => {
  it('unwraps mint spans and keeps the 회원명 variable token', () => {
    const html =
      '<p>안녕하세요, <strong><span style="color: #01A1AF; font-size: 15px">#{회원명}</span></strong>님</p>'
    expect(applyMailPreviewHtml(html)).toBe('<p>안녕하세요, <strong>#{회원명}</strong>님</p>')
  })

  it('keeps data-mail-variable chips as variable tokens', () => {
    const html =
      '<p>안녕 <span class="mail-template-variable" data-mail-variable="회원명">#{회원명}</span></p>'
    expect(applyMailPreviewHtml(html)).toBe('<p>안녕 #{회원명}</p>')
  })
})

describe('formatMailPreviewDateTime', () => {
  it('matches YYYY.MM.DD(요일) HH:mm', () => {
    expect(formatMailPreviewDateTime('2026-09-15T09:15:00+09:00')).toBe('2026.09.15(화) 09:15')
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

describe('splitMailSenderNameEmail', () => {
  it('이름과 이메일이 모두 있으면 둘 다 돌려준다', () => {
    expect(splitMailSenderNameEmail(' JA코리아 ', ' jakorea@jakorea.org ')).toEqual({
      name: 'JA코리아',
      email: 'jakorea@jakorea.org',
    })
  })

  it('이름이 없거나 이메일과 같으면 이름을 생략한다', () => {
    expect(splitMailSenderNameEmail('', 'a@b.org')).toEqual({ name: '', email: 'a@b.org' })
    expect(splitMailSenderNameEmail('A@B.org', 'a@b.org')).toEqual({ name: '', email: 'a@b.org' })
    expect(splitMailSenderNameEmail(undefined, undefined)).toEqual({ name: '', email: '' })
  })

  it('표시명 끝의 <메일> 은 떼어낸다', () => {
    expect(
      splitMailSenderNameEmail('jakorea@jakorea.org <jakorea@jakorea.org>', 'jakorea@jakorea.org')
    ).toEqual({ name: '', email: 'jakorea@jakorea.org' })
    expect(splitMailSenderNameEmail('김제이 <kim@ja.org>', 'kim@ja.org')).toEqual({
      name: '김제이',
      email: 'kim@ja.org',
    })
  })
})
