import {
  buildInstructorDetailFromSettlements,
  buildProgramDetailFromSettlements,
} from '@/features/settlement-management/api/payment-orders/map-settlement-detail'
import type { PaymentOrdersDetailContextData } from '@/features/settlement-management/hooks/use-payment-orders-detail-query'
import {
  getMockPaymentOrderInstructorDetail,
  getMockPaymentOrderProgramDetail,
  type PaymentOrderAdminInstructorDetail,
  type PaymentOrderAdminInstructorDetailProgramRow,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProgramDetail,
  type PaymentOrderAdminProgramDetailInstructorRow,
  type PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'

export type PaymentOrderDetailLineRow =
  | PaymentOrderAdminProgramDetailInstructorRow
  | PaymentOrderAdminInstructorDetailProgramRow

export function resolvePaymentOrderProgramDetailForLines(
  paymentOrdersRemote: boolean,
  programRow: PaymentOrderAdminProgramRow,
  contextData: PaymentOrdersDetailContextData | undefined
): PaymentOrderAdminProgramDetail | null {
  if (paymentOrdersRemote) {
    if (!contextData) return null
    return buildProgramDetailFromSettlements(
      programRow,
      contextData.items ?? [],
      contextData.statements ?? []
    )
  }
  return getMockPaymentOrderProgramDetail(programRow)
}

export function resolvePaymentOrderInstructorDetailForLines(
  paymentOrdersRemote: boolean,
  instructorRow: PaymentOrderAdminInstructorRow,
  contextData: PaymentOrdersDetailContextData | undefined
): PaymentOrderAdminInstructorDetail | null {
  if (paymentOrdersRemote) {
    if (!contextData) return null
    return buildInstructorDetailFromSettlements(
      instructorRow,
      contextData.items ?? [],
      contextData.statements ?? []
    )
  }
  return getMockPaymentOrderInstructorDetail(instructorRow)
}

export function resolvePaymentOrderProgramDetailLineRows(
  paymentOrdersRemote: boolean,
  programRow: PaymentOrderAdminProgramRow,
  contextData: PaymentOrdersDetailContextData | undefined
): PaymentOrderAdminProgramDetailInstructorRow[] {
  const detail = resolvePaymentOrderProgramDetailForLines(
    paymentOrdersRemote,
    programRow,
    contextData
  )
  return detail?.instructorRows.map(r => ({ ...r })) ?? []
}

export function resolvePaymentOrderInstructorDetailLineRows(
  paymentOrdersRemote: boolean,
  instructorRow: PaymentOrderAdminInstructorRow,
  contextData: PaymentOrdersDetailContextData | undefined
): PaymentOrderAdminInstructorDetailProgramRow[] {
  const detail = resolvePaymentOrderInstructorDetailForLines(
    paymentOrdersRemote,
    instructorRow,
    contextData
  )
  return detail?.programRows.map(r => ({ ...r })) ?? []
}
