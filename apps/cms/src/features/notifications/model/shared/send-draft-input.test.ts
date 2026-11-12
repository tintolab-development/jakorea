import { describe, expect, it } from 'vitest'
import {
  hasNotificationSendBodyContent,
  hasNotificationSendDraftInput,
  type NotificationSendDraftInputState,
} from './send-draft-input'

const EMPTY: NotificationSendDraftInputState = {
  programSelected: false,
  templateSelected: false,
  sendTimingSelected: false,
  recipientCount: 0,
  subject: '',
  bodyHtml: '<p></p>',
  attachmentCount: 0,
  extraValues: [],
}

describe('hasNotificationSendBodyContent', () => {
  it('빈 문단·공백만 있으면 입력이 없다', () => {
    expect(hasNotificationSendBodyContent('<p></p>')).toBe(false)
    expect(hasNotificationSendBodyContent('<p>&nbsp; </p>')).toBe(false)
    expect(hasNotificationSendBodyContent(undefined)).toBe(false)
  })

  it('글자나 이미지가 있으면 입력이 있다', () => {
    expect(hasNotificationSendBodyContent('<p>안녕하세요</p>')).toBe(true)
    expect(hasNotificationSendBodyContent('<p><img src="a.png"></p>')).toBe(true)
  })
})

describe('hasNotificationSendDraftInput', () => {
  it('처음 연 상태면 확인 없이 닫는다', () => {
    expect(hasNotificationSendDraftInput(EMPTY)).toBe(false)
    expect(
      hasNotificationSendDraftInput({
        programSelected: false,
        templateSelected: false,
        sendTimingSelected: false,
        recipientCount: 0,
      })
    ).toBe(false)
  })

  it.each<[string, Partial<NotificationSendDraftInputState>]>([
    ['프로그램 선택', { programSelected: true }],
    ['템플릿 선택', { templateSelected: true }],
    ['발송 시점 선택', { sendTimingSelected: true }],
    ['수신자 추가', { recipientCount: 1 }],
    ['제목 입력', { subject: '안내' }],
    ['본문 입력', { bodyHtml: '<p>본문</p>' }],
    ['첨부 추가', { attachmentCount: 1 }],
    ['문맥 변수 입력', { extraValues: ['', '2026-11-30'] }],
  ])('%s이 있으면 확인창을 띄운다', (_, patch) => {
    expect(hasNotificationSendDraftInput({ ...EMPTY, ...patch })).toBe(true)
  })

  it('공백만 입력한 제목·문맥 변수는 입력으로 보지 않는다', () => {
    expect(hasNotificationSendDraftInput({ ...EMPTY, subject: '   ', extraValues: [' '] })).toBe(
      false
    )
  })
})
