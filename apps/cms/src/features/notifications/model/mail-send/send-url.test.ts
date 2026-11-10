import { describe, expect, it } from 'vitest'
import {
  clearMailSendTemplateIdSearchParams,
  openMailSendWithTemplateSearchParams,
  readMailSendTemplateIdFromSearchParams,
} from './send-url'

describe('mail send url — 템플릿 사용 프리셋', () => {
  it('발송 모달을 열고 템플릿 id를 지정한다 (기존 파라미터 유지)', () => {
    const next = openMailSendWithTemplateSearchParams(new URLSearchParams('mail_category=1'), '400')
    expect(next.get('modal')).toBe('send')
    expect(next.get('send_tpl')).toBe('400')
    expect(next.get('mail_category')).toBe('1')
  })

  it('템플릿 id를 읽고 지운다', () => {
    const params = new URLSearchParams('modal=send&send_tpl=%20400%20')
    expect(readMailSendTemplateIdFromSearchParams(params)).toBe('400')
    expect(readMailSendTemplateIdFromSearchParams(new URLSearchParams('modal=send'))).toBeNull()
    const cleared = clearMailSendTemplateIdSearchParams(params)
    expect(cleared.has('send_tpl')).toBe(false)
    expect(cleared.get('modal')).toBe('send')
  })
})
