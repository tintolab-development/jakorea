import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MailSendStatusText } from './send-status-text'

const render = (status: string) => renderToStaticMarkup(createElement(MailSendStatusText, { status }))

describe('mail send failure color only', () => {
  it('adds the design red token without changing the failure label', () => {
    expect(render('발송 실패')).toBe('<span style="color:var(--Status-red-main, #c32f4a)">발송 실패</span>')
  })
  it.each(['발송 요청', '예약', '대기', '발송중', '발송 성공', '취소', '확인불가', '수신 실패', 'SEND_FAILED', 'FAILED', 'FAILURE', ''])
    ('preserves %s verbatim without a status color', status => {
      expect(render(status)).toBe(status)
    })
  it('uses the same color-only renderer for the list and both detail branches', () => {
    const source = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
    expect(source('./page.tsx')).toContain('render: (status: string) => <MailSendStatusText status={status} />')
    expect(source('./detail-modal.tsx').match(/<MailSendStatusText status=\{row.sendStatus\} \/>/g)).toHaveLength(2)
  })
})
