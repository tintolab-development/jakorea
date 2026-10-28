import { describe, expect, it } from 'vitest'
import { alimtalkSendStateAfterProgramChange } from './program-change'

describe('alimtalkSendStateAfterProgramChange', () => {
  it('R7-FE-12 프로그램 변경 시 템플릿·수신자를 초기화한다', () => {
    expect(alimtalkSendStateAfterProgramChange()).toEqual({
      templateId: undefined,
      recipients: [],
      selectedRecipientIds: [],
      recipientSearch: { typeValue: '', keyword: '', page: 0 },
    })
  })
})
