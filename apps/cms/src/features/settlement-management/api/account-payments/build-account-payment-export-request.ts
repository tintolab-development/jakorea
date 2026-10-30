import type { SettlementExportRequest } from '@/shared/api/generated/settlement/schemas'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'

/** 대량이체는 지급 대기 건만, 세금신고는 지급 완료 건만 서버가 허용한다. */
export const ACCOUNT_PAYMENT_EXPORT_STATUS_WAITING_PAYMENT = 'WAITING_PAYMENT' as const
export const ACCOUNT_PAYMENT_EXPORT_STATUS_PAID = 'PAID' as const

const EXPORT_REASON = '계좌 지급 확인 — 양식 발급'
const EXPORT_BUSINESS_PURPOSE = '정산 관리 대량이체·세금신고 양식'

export type BuildAccountPaymentExportRequestInput = {
  fromDate?: string
  toDate?: string
  kind: 'bulk-transfer' | 'tax-report'
  selection:
    | { kind: 'selected'; rows: ReadonlyArray<Pick<AccountPaymentRow, 'settlementId' | 'accountPaymentId'>> }
    | { kind: 'all' }
}

function isValidId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function resolveSelectedIds(
  rows: ReadonlyArray<Pick<AccountPaymentRow, 'settlementId' | 'accountPaymentId'>>
) {
  const settlementIds = new Set<number>()
  const accountPaymentIds = new Set<number>()

  for (const row of rows) {
    if (row.settlementId != null) {
      if (isValidId(row.settlementId)) settlementIds.add(row.settlementId)
      continue
    }
    if (isValidId(row.accountPaymentId)) accountPaymentIds.add(row.accountPaymentId)
  }

  return {
    settlementIds: [...settlementIds],
    accountPaymentIds: [...accountPaymentIds],
  }
}

/**
 * 대량이체·세금신고 export body.
 * 선택 모드에서는 선택한 원장 ID만 전송하고, 전체 모드에서만 두 ID 배열을 비운다.
 */
export function buildAccountPaymentExportRequest(
  input: BuildAccountPaymentExportRequestInput
): SettlementExportRequest {
  const label =
    input.kind === 'bulk-transfer' ? '대량이체 양식 발급' : '세금신고 양식 발급'
  const selectedIds =
    input.selection.kind === 'selected' ? resolveSelectedIds(input.selection.rows) : undefined
  return {
    status:
      input.kind === 'bulk-transfer'
        ? ACCOUNT_PAYMENT_EXPORT_STATUS_WAITING_PAYMENT
        : ACCOUNT_PAYMENT_EXPORT_STATUS_PAID,
    reason: `${EXPORT_REASON} (${label})`,
    businessPurpose: EXPORT_BUSINESS_PURPOSE,
    rawPrivacyIncluded: false,
    settlementIds: selectedIds?.settlementIds ?? [],
    ...(input.kind === 'bulk-transfer'
      ? { accountPaymentIds: selectedIds?.accountPaymentIds ?? [] }
      : {}),
    ...(input.fromDate || input.toDate
      ? {
          ...(input.fromDate ? { fromDate: input.fromDate } : {}),
          ...(input.toDate ? { toDate: input.toDate } : {}),
          dateRangeValid: true,
        }
      : {}),
  }
}

export const RAW_PRIVACY_EXPORT_POLICY = 'RAW_PRIVACY_APPROVAL_REQUIRED'

/**
 * 회계 관리자 무필터 전체 원본 export.
 * searchSnapshotHash가 없는 승인은 서버가 정한 전체 범위만 허용한다.
 * status·fromDate·toDate·programId·instructorMemberId·선택 ID를 넣지 않는다.
 * 대량이체/세금신고의 지급 대기·지급 완료 제한은 export 종류가 서버에서 적용한다.
 * 선택·화면 필터 원본은 서버 hash/rowCount 없이 만들지 않는다.
 */
export function buildRawAccountPaymentExportRequest(input: {
  kind: 'bulk-transfer' | 'tax-report'
  approvalReference: string
}): SettlementExportRequest {
  const approvalReference = input.approvalReference.trim()
  if (!approvalReference) throw new Error('승인 reference가 없습니다.')
  const label = input.kind === 'bulk-transfer' ? '대량이체 양식 발급' : '세금신고 양식 발급'
  return {
    reason: `${EXPORT_REASON} (${label})`,
    businessPurpose: EXPORT_BUSINESS_PURPOSE,
    exportPolicy: RAW_PRIVACY_EXPORT_POLICY,
    rawPrivacyIncluded: true,
    approvalReference,
    settlementIds: [],
    accountPaymentIds: [],
  }
}

export function isUnfilteredFullRawExportBody(body: SettlementExportRequest): boolean {
  return (
    body.rawPrivacyIncluded === true &&
    body.exportPolicy === RAW_PRIVACY_EXPORT_POLICY &&
    Boolean(body.approvalReference?.trim()) &&
    (body.settlementIds?.length ?? 0) === 0 &&
    (body.accountPaymentIds?.length ?? 0) === 0 &&
    body.programId == null &&
    body.instructorMemberId == null &&
    body.fromDate == null &&
    body.toDate == null &&
    (body.status == null || String(body.status).trim() === '')
  )
}

/** 서버가 조회 범위 hash와 rowCount를 바인딩하기 전에는 선택 원본을 만들지 않는다. */
export function assertSelectedRawExportDisabled(input: {
  searchSnapshotHash?: string | null
  rowCount?: number | null
}): void {
  const hash = input.searchSnapshotHash?.trim() ?? ''
  if (!hash || input.rowCount == null || input.rowCount <= 0) {
    throw new Error(
      '선택·필터 원본 발급은 서버 searchSnapshotHash와 rowCount가 필요합니다.'
    )
  }
}

