/**
 * @vitest-environment jsdom
 *
 * 알림 메일 버튼 href — BE 회신 방식 A-2(경로 상대값 + 수신자 유형별 도메인 변수).
 */
import { afterEach, describe, expect, it } from 'vitest'
import { Editor, createRichTextExtensions } from '@jakorea/rich-text'
import { isPlainTextMailBody } from '@/features/notifications/model/shared/mail-body-display-html'
import {
  MAIL_CMS_ADMIN_DOMAIN_VARIABLE_LABEL,
  MAIL_HOMEPAGE_DOMAIN_VARIABLE_LABEL,
  MAIL_NOTIFICATION_LINK_PATH_VARIABLE_LABEL,
  mailDetailButton,
  mailNotificationLinkHref,
  wrapMailLayoutHtml,
} from './layout-html'
import { applyMailPreviewBody } from './preview'
import { MailVariable } from './variable-node'

const MEMBER_HREF = 'https://#{홈페이지 도메인}#{알림 링크 경로}'
const ADMIN_HREF = 'https://#{CMS 어드민 도메인}#{알림 링크 경로}'

let editor: Editor | null = null

afterEach(() => {
  editor?.destroy()
  editor = null
})

describe('mailNotificationLinkHref', () => {
  it('회원은 홈페이지 도메인, 관리자는 CMS 어드민 도메인을 경로 앞에 붙인다', () => {
    expect(mailNotificationLinkHref('MEMBER')).toBe(MEMBER_HREF)
    expect(mailNotificationLinkHref('ADMIN')).toBe(ADMIN_HREF)
    expect(MAIL_HOMEPAGE_DOMAIN_VARIABLE_LABEL).toBe('홈페이지 도메인')
    expect(MAIL_CMS_ADMIN_DOMAIN_VARIABLE_LABEL).toBe('CMS 어드민 도메인')
    expect(MAIL_NOTIFICATION_LINK_PATH_VARIABLE_LABEL).toBe('알림 링크 경로')
  })

  it('회원 링크에 관리자 도메인, 관리자 링크에 홈페이지 도메인을 섞지 않는다', () => {
    expect(mailNotificationLinkHref('MEMBER')).not.toContain('어드민 도메인')
    expect(mailNotificationLinkHref('ADMIN')).not.toContain(MAIL_HOMEPAGE_DOMAIN_VARIABLE_LABEL)
  })

  it('수신자 유형 미확인(null)은 도메인 없이 경로 변수만 둔다 — 상담·인재채용·재능기부 프리셋 유지', () => {
    expect(mailNotificationLinkHref(null)).toBe('#{알림 링크 경로}')
  })
})

describe('mailDetailButton', () => {
  it('수신자 유형에 맞는 href로 버튼을 만든다', () => {
    expect(mailDetailButton('문의 내용 확인하기', '알림 링크 경로', 'ADMIN')).toContain(
      `<a href="${ADMIN_HREF}"`
    )
    expect(mailDetailButton('수료 내역 보기', '알림 링크 경로', 'MEMBER')).toContain(
      `<a href="${MEMBER_HREF}"`
    )
  })

  it('버튼이 든 본문은 블록 태그가 있어 평문으로 판정되지 않는다', () => {
    const button = mailDetailButton('문의 내용 확인하기', '알림 링크 경로', 'ADMIN')
    expect(isPlainTextMailBody(button)).toBe(false)
    expect(isPlainTextMailBody(wrapMailLayoutHtml('test-v1', button))).toBe(false)
  })

  it('미리보기에서 href 토큰이 깨지지 않는다', () => {
    const preview = applyMailPreviewBody(
      mailDetailButton('수료 내역 보기', '알림 링크 경로', 'MEMBER')
    )
    expect(preview).toContain(`href="${MEMBER_HREF}"`)
    expect(preview).toContain('>수료 내역 보기</a>')
  })

  it('메일 에디터에서 열고 다시 저장해도 href가 그대로 남는다', () => {
    editor = new Editor({
      element: document.createElement('div'),
      extensions: createRichTextExtensions({ extraExtensions: [MailVariable] }),
      content: mailDetailButton('문의 내용 확인하기', '알림 링크 경로', 'ADMIN'),
      editable: true,
    })
    const saved = editor.getHTML()
    expect(saved).toContain(`href="${ADMIN_HREF}"`)
    expect(saved).toContain('문의 내용 확인하기')
    expect(isPlainTextMailBody(saved)).toBe(false)
  })
})
