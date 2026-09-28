import { describe, expect, it } from 'vitest'
import { resolveInstructorSettlementUiStatusFromListLabel } from './instructor-settlement-status'

describe('resolveInstructorSettlementUiStatusFromListLabel', () => {
  it('canonical 8종 라벨을 status로 매핑한다', () => {
    expect(resolveInstructorSettlementUiStatusFromListLabel('지급 정정 요청')).toBe(
      'payment_correction_requested'
    )
    expect(resolveInstructorSettlementUiStatusFromListLabel('해당 없음')).toBe('none')
  })

  it('회원 목록 API alias 라벨을 매핑한다', () => {
    expect(resolveInstructorSettlementUiStatusFromListLabel('계좌 지급 대기 중')).toBe(
      'awaiting_confirmation'
    )
    expect(resolveInstructorSettlementUiStatusFromListLabel('재신청 검토 중')).toBe(
      'payment_statement_reapplication'
    )
  })

  it('BE 전용 라벨(정산 전)은 null — 화면에서 원문 표시', () => {
    expect(resolveInstructorSettlementUiStatusFromListLabel('정산 전')).toBeNull()
  })
})
