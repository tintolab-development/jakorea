/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/use-session-admin-role-code', () => ({
  useSessionAdminRoleCode: () => 'MASTER',
}))

import {
  AccountPaymentConfirmationModal,
  formatAccountPaymentBulkProgramDisplay,
  withAccountPaymentPlainAccount,
} from './account-payment-confirmation-modal'

describe('formatAccountPaymentBulkProgramDisplay', () => {
  it('프로그램이 하나면 이름만 보여 준다', () => {
    expect(
      formatAccountPaymentBulkProgramDisplay([
        '2026년 JA Korea 초등 경제교육',
        '2026년 JA Korea 초등 경제교육',
      ])
    ).toBe('2026년 JA Korea 초등 경제교육')
  })

  it('프로그램이 여러 개면 첫 이름과 나머지 개수를 보여 준다', () => {
    expect(
      formatAccountPaymentBulkProgramDisplay([
        '초등 경제교육',
        '중등 경제교육',
        '초등 경제교육',
        '고등 경제교육',
      ])
    ).toBe('초등 경제교육 외 2개')
  })
})

describe('AccountPaymentConfirmationModal bulk', () => {
  afterEach(() => {
    cleanup()
  })

  it('Figma 일괄 확인 안내 카피와 요약을 보여 준다', () => {
    render(
      <AccountPaymentConfirmationModal
        open
        onCancel={() => undefined}
        onConfirm={() => undefined}
        data={{
          kind: 'bulk',
          programDisplay: '2026년 JA Korea 초등 경제교육 외 2개',
          recipientLabel: '총 16명',
          settlementAmount: 2915000,
          recipientName: '김제이',
          otherRecipientCount: 15,
        }}
      />
    )

    expect(screen.getByText('계좌 지급 일괄 확인 안내')).toBeTruthy()
    expect(screen.getByText('[김제이] 님 외 15명')).toBeTruthy()
    expect(screen.getByText(/의 계좌 지급을 완료 처리하시겠습니까/)).toBeTruthy()
    expect(screen.getByText('[계좌 지급 완료]')).toBeTruthy()
    expect(screen.getByText('2026년 JA Korea 초등 경제교육 외 2개')).toBeTruthy()
    expect(screen.getByText('2,915,000원')).toBeTruthy()
    expect(screen.getByText('총 16명')).toBeTruthy()
  })
})

describe('withAccountPaymentPlainAccount — 목록 단건 팝업 원문 계좌(CMS-11)', () => {
  const detail = {
    plainAccountForPaymentConfirm: { bankAndNumber: '가상은행 000-000-000000', holder: '가나다' },
  }

  it('단건은 계좌·예금주만 상세 원문으로 바꾸고 금액·프로그램은 유지한다', () => {
    expect(
      withAccountPaymentPlainAccount(
        {
          kind: 'single',
          programDisplay: '가상 프로그램',
          settlementAmount: 1000,
          accountBankAndNumber: '가상은행 ***-***-******',
          accountHolder: '가*다',
          recipientName: '가나다',
        },
        detail
      )
    ).toEqual({
      kind: 'single',
      programDisplay: '가상 프로그램',
      settlementAmount: 1000,
      accountBankAndNumber: '가상은행 000-000-000000',
      accountHolder: '가나다',
      recipientName: '가나다',
    })
  })

  it('다건·빈 값은 그대로 둔다', () => {
    const bulk = {
      kind: 'bulk' as const,
      programDisplay: '가상 프로그램',
      recipientLabel: '총 2명',
      settlementAmount: 2000,
      recipientName: '가나다',
      otherRecipientCount: 1,
    }
    expect(withAccountPaymentPlainAccount(bulk, detail)).toBe(bulk)
    expect(withAccountPaymentPlainAccount(null, detail)).toBeNull()
  })
})
