import { describe, expect, it } from 'vitest'
import { countAccountPaymentRecipients } from './account-payments-list'
import { buildAccountPaymentConfirmationPayloadForSelection } from '@/features/settlement/ui/account-payment-confirmation-modal'
import { buildAccountPaymentCompleteSuccessContext } from '@/features/settlement/ui/account-payment-complete-success-modal'
import type { AccountPaymentRow } from './account-payments-list'

const row = (id: string, memberId: number | undefined, name: string): AccountPaymentRow =>
  ({ id, instructorMemberId: memberId, instructorName: name, programName: 'P', amount: 1000 }) as AccountPaymentRow

describe('계좌 지급 일괄 — 인원은 사람 수', () => {
  it('같은 회원의 여러 행은 1명', () => {
    expect(countAccountPaymentRecipients([row('1', 7, '김'), row('2', 7, '김'), row('3', 8, '이')])).toBe(2)
  })

  it('회원 id가 없으면 이름으로 묶는다', () => {
    expect(countAccountPaymentRecipients([row('1', undefined, '박'), row('2', undefined, '박')])).toBe(1)
  })

  it('확인 팝업 요약·「외 N명」이 사람 수 기준', () => {
    const payload = buildAccountPaymentConfirmationPayloadForSelection([
      row('1', 7, '김'),
      row('2', 7, '김'),
      row('3', 8, '이'),
    ])
    expect(payload).toMatchObject({ kind: 'bulk', recipientLabel: '총 2명', otherRecipientCount: 1 })
  })

  it('완료 팝업도 사람 수 기준(같은 사람 2행이면 외 0명)', () => {
    expect(buildAccountPaymentCompleteSuccessContext([row('1', 7, '김'), row('2', 7, '김')])).toMatchObject({
      kind: 'bulk',
      otherRecipientCount: 0,
    })
  })
})
