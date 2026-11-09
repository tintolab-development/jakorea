import { describe, expect, it } from 'vitest'
import { resolveInstructorSettlementUiStatusFromListLabel } from './instructor-settlement-status'

describe('resolveInstructorSettlementUiStatusFromListLabel', () => {
  it('canonical 8종 라벨을 status로 매핑한다', () => {
    expect(resolveInstructorSettlementUiStatusFromListLabel('지급 정정 요청')).toBe(
      'payment_correction_requested'
    )
    expect(resolveInstructorSettlementUiStatusFromListLabel('해당 없음')).toBe('none')
  })

  it('서버가 보내지 않는 별칭·구 표기는 해석하지 않는다(S07)', () => {
    expect(resolveInstructorSettlementUiStatusFromListLabel('계좌 지급 대기 중')).toBeNull()
    expect(resolveInstructorSettlementUiStatusFromListLabel('재신청 검토 중')).toBeNull()
    expect(resolveInstructorSettlementUiStatusFromListLabel('확인 진행중')).toBeNull()
  })

  it('BE 전용 라벨(정산 전)은 null — 화면에서 원문 표시', () => {
    expect(resolveInstructorSettlementUiStatusFromListLabel('정산 전')).toBeNull()
  })
})
