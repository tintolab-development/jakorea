import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NotificationSendStatusText } from './send-status-text'

const render = (status: string) =>
  renderToStaticMarkup(createElement(NotificationSendStatusText, { status }))

describe('notification send status Text (Figma 14804:19688, 메일·알림톡·문자 공통)', () => {
  it.each([
    ['발송 실패', 'color:var(--Status-red-main, #c32f4a)'],
    ['발송 대기', 'color:var(--Status-green-main, #1e8c29)'],
    ['발송 중', 'color:var(--Status-blue-main, #017eaf)'],
    ['발송 성공', 'color:var(--Netural-black, #3d3d3d)'],
    ['발송 취소', 'color:var(--Netural-black, #3d3d3d);opacity:0.5'],
    ['예약 취소', 'color:var(--Netural-black, #3d3d3d);opacity:0.5'],
  ])('colors %s without changing the label', (status, style) => {
    expect(render(status)).toBe(`<span style="${style}">${status}</span>`)
  })

  it.each(['발송 요청', '예약', '확인불가', '수신 실패', 'SEND_FAILED', ''])(
    'preserves %s verbatim without a status color',
    status => {
      expect(render(status)).toBe(status)
    }
  )

  it.each(['mail', 'alimtalk', 'sms'])('%s 목록·상세가 같은 렌더러를 쓴다', channel => {
    const source = (file: string) =>
      readFileSync(new URL(`../${channel}-send-history/${file}`, import.meta.url), 'utf8')
    expect(source('page.tsx')).toContain(
      'render: (status: string) => <NotificationSendStatusText status={status} />'
    )
    expect(
      source('detail-modal.tsx').match(/<NotificationSendStatusText status=\{row.sendStatus\} \/>/g)
    ).toHaveLength(2)
  })
})
