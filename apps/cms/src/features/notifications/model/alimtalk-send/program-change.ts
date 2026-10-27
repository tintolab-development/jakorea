import type { AlimtalkSendRecipientSearchParams } from './types'

/** 프로그램 변경 시 이전 템플릿·수신자 문맥을 버린다. */
export function alimtalkSendStateAfterProgramChange(): {
  templateId: undefined
  recipients: []
  selectedRecipientIds: []
  recipientSearch: AlimtalkSendRecipientSearchParams
} {
  return {
    templateId: undefined,
    recipients: [],
    selectedRecipientIds: [],
    recipientSearch: { typeValue: '', keyword: '', page: 0 },
  }
}
