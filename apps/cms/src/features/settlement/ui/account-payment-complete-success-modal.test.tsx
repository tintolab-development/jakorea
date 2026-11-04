/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/use-session-admin-role-code', () => ({
  useSessionAdminRoleCode: () => 'MASTER',
}))

import { AccountPaymentCompleteSuccessModal } from './account-payment-complete-success-modal'

describe('AccountPaymentCompleteSuccessModal', () => {
  afterEach(() => {
    cleanup()
  })

  it('일괄 완료 안내와 대량이체 발급 버튼을 보여 준다', () => {
    render(
      <AccountPaymentCompleteSuccessModal
        open
        onCancel={() => undefined}
        onIssueBulkTransfer={() => undefined}
        context={{
          kind: 'bulk',
          recipientName: '김제이',
          otherRecipientCount: 15,
          completedRows: [],
        }}
      />
    )

    expect(screen.getByText('계좌 지급 일괄 확인 완료')).toBeTruthy()
    expect(screen.getByText('[김제이] 님 외 15명')).toBeTruthy()
    expect(screen.getByText(/의 계좌 지급 처리가 완료되었습니다/)).toBeTruthy()
    expect(screen.queryByText(/강의비/)).toBeNull()
    expect(screen.getByText('닫기')).toBeTruthy()
    expect(screen.getByText('대량이체 양식 발급')).toBeTruthy()
  })
})
