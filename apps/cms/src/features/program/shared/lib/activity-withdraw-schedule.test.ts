import { describe, expect, it } from 'vitest'
import {
  buildActivityWithdrawGeneratedReason,
  buildActivityWithdrawGuideDescription,
} from './activity-withdraw-schedule'

describe('buildActivityWithdrawGuideDescription', () => {
  it('uses 님의 for a person', () => {
    expect(buildActivityWithdrawGuideDescription('김제이', 'person')).toBe(
      '[**김제이**] 님의 프로그램 활동을 포기 처리하시겠습니까?\n포기 시 재참여가 불가하며, 선택한 교육 일정 이전의 활동까지만 실적에 반영됩니다.\n활동 포기 처리 후에는 되돌릴 수 없습니다.'
    )
  })

  it('uses 의 for an institution', () => {
    expect(buildActivityWithdrawGuideDescription('JA초등학교', 'institution')).toBe(
      '[**JA초등학교**]의 프로그램 활동을 포기 처리하시겠습니까?\n포기 시 재참여가 불가하며, 선택한 교육 일정 이전의 활동까지만 실적에 반영됩니다.\n활동 포기 처리 후에는 되돌릴 수 없습니다.'
    )
  })
})

describe('buildActivityWithdrawGeneratedReason', () => {
  it('includes the selected schedule label', () => {
    expect(buildActivityWithdrawGeneratedReason('1회차 | 26. 04. 01')).toBe(
      '활동 포기 (1회차 | 26. 04. 01)'
    )
  })
})
