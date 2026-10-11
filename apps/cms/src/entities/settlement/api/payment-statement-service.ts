import type { PaymentStatement } from '@/types/domain'
import { createEmptyCrudService } from '@/shared/utils/create-service'

const basePaymentStatementService = createEmptyCrudService<PaymentStatement>({
  prefix: 'payment-statement',
  nameField: 'id',
})

export const paymentStatementService = {
  ...basePaymentStatementService,
  getBySettlementId: async (_settlementId: string): Promise<PaymentStatement | null> => null,
  confirmByInstructor: async (_id: string): Promise<PaymentStatement> => {
    throw new Error('지급조서 확인 API가 연동되지 않았습니다.')
  },
}
