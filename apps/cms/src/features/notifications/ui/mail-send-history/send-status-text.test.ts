import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MailSendStatusText } from './send-status-text'

const render = (status: string) => renderToStaticMarkup(createElement(MailSendStatusText, { status }))

describe('mail send status Text (Figma 14804:19688)', () => {
  it.each([
    ['발송 실패', 'color:var(--Status-red-main, #c32f4a)'],
    ['발송 대기', 'color:var(--Status-green-main, #1e8c29)'],
    ['발송 중', 'color:var(--Status-blue-main, #017eaf)'],
    ['발송 완료', 'color:var(--Netural-black, #3d3d3d)'],
    ['발송 취소', 'color:var(--Netural-black, #3d3d3d);opacity:0.5'],
  ])('colors %s without changing the label', (status, style) => {
    expect(render(status)).toBe(`<span style="${style}">${status}</span>`)
  })
  it.each(['발송 요청', '예약', '확인불가', '수신 실패', 'SEND_FAILED', 'FAILED', 'FAILURE', ''])
    ('preserves %s verbatim without a status color', status => {
      expect(render(status)).toBe(status)
    })
  it('uses the same renderer for the list and both detail branches', () => {
    const source = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
    expect(source('./page.tsx')).toContain('render: (status: string) => <MailSendStatusText status={status} />')
    expect(source('./detail-modal.tsx').match(/<MailSendStatusText status=\{row.sendStatus\} \/>/g)).toHaveLength(2)
  })
})
