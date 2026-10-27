import { describe, expect, it } from 'vitest'
import { alimtalkSendStateAfterProgramChange } from './program-change'
import {
  ALIMTALK_SEND_EMPTY_SENDER_TITLE,
  ALIMTALK_SEND_EMPTY_TEMPLATE_TITLE,
  alimtalkSendTemplateContentEmptyTitle,
} from './content-empty'

describe('alimtalkSendTemplateContentEmptyTitle', () => {
  it('발신 프로필·템플릿 미선택이면 발신 프로필 안내', () => {
    expect(
      alimtalkSendTemplateContentEmptyTitle({
        senderSelected: false,
        templateSelected: false,
      })
    ).toBe(ALIMTALK_SEND_EMPTY_SENDER_TITLE)
  })

  it('발신 프로필만 선택되면 템플릿 안내', () => {
    expect(
      alimtalkSendTemplateContentEmptyTitle({
        senderSelected: true,
        templateSelected: false,
      })
    ).toBe(ALIMTALK_SEND_EMPTY_TEMPLATE_TITLE)
  })

  it('템플릿이 선택되면 빈 상태 문구가 없다', () => {
    expect(
      alimtalkSendTemplateContentEmptyTitle({
        senderSelected: true,
        templateSelected: true,
      })
    ).toBeNull()
    expect(
      alimtalkSendTemplateContentEmptyTitle({
        senderSelected: false,
        templateSelected: true,
      })
    ).toBeNull()
  })

  it('프로그램 변경 후 템플릿이 비면 발신 프로필이 있을 때 템플릿 안내', () => {
    const reset = alimtalkSendStateAfterProgramChange()
    expect(reset.templateId).toBeUndefined()
    expect(
      alimtalkSendTemplateContentEmptyTitle({
        senderSelected: true,
        templateSelected: Boolean(reset.templateId),
      })
    ).toBe(ALIMTALK_SEND_EMPTY_TEMPLATE_TITLE)
  })
})
