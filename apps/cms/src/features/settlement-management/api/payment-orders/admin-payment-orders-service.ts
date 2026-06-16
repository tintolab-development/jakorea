import {
  mapSettlementsToInstructorRows,
  mapSettlementsToProgramRows,
} from '@/features/settlement-management/api/payment-orders/map-settlement-list-rows'
import {
  fetchAllPaymentStatementsRemote,
  fetchAllSettlementsRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'

export interface PaymentOrdersListData {
  programRows: PaymentOrderAdminProgramRow[]
  instructorRows: PaymentOrderAdminInstructorRow[]
}

export async function getPaymentOrdersListRemote(): Promise<PaymentOrdersListData> {
  const items = (await fetchAllSettlementsRemote()) ?? []
  return {
    programRows: mapSettlementsToProgramRows(items),
    instructorRows: mapSettlementsToInstructorRows(items),
  }
}

export async function getPaymentOrdersDetailContextRemote() {
  const [items, statements] = await Promise.all([
    fetchAllSettlementsRemote(),
    fetchAllPaymentStatementsRemote(),
  ])
  return { items, statements }
}
