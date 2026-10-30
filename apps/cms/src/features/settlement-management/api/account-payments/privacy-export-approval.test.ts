import { describe, expect, it } from 'vitest'
import {
  assertCanApproveRawExport,
  assertOwnApprovedRawExport,
} from './privacy-export-approval'

const approved = {
  approvalId: 9,
  approvalReference: 'ref-9',
  exportDomain: 'SETTLEMENT_BULK_TRANSFER',
  requesterAdminId: 11,
  approverAdminId: 22,
  status: 'APPROVED',
}

describe('raw export approval guards', () => {
  it('요청자 본인만 다른 마스터가 승인한 reference를 쓴다', () => {
    expect(assertOwnApprovedRawExport(approved, 11, 'SETTLEMENT_BULK_TRANSFER')).toBe('ref-9')
    expect(() => assertOwnApprovedRawExport(approved, 22, 'SETTLEMENT_BULK_TRANSFER')).toThrow(
      /본인이 요청한/
    )
    expect(() =>
      assertOwnApprovedRawExport({ ...approved, approverAdminId: 11 }, 11, 'SETTLEMENT_BULK_TRANSFER')
    ).toThrow(/다른 마스터/)
    expect(() =>
      assertOwnApprovedRawExport({ ...approved, status: 'REQUESTED' }, 11, 'SETTLEMENT_BULK_TRANSFER')
    ).toThrow(/완료되지/)
    expect(() =>
      assertOwnApprovedRawExport(approved, 11, 'SETTLEMENT_TAX_REPORT')
    ).toThrow(/요청한 양식/)
  })

  it('요청자는 자기 승인을 하지 못한다', () => {
    expect(() => assertCanApproveRawExport(approved, 11)).toThrow(/본인 요청/)
    expect(() => assertCanApproveRawExport(approved, 22)).not.toThrow()
  })
})