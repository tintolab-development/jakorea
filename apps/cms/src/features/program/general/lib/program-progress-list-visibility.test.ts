import { describe, expect, it } from 'vitest'
import {
  filterProgramProgressParticipantItems,
  isHiddenFromProgramProgressList,
} from '@/features/program/general/lib/program-progress-list-visibility'

describe('program-progress-list-visibility', () => {
  it('applicationStatus REJECTED·AUTO_REJECTED는 진행 현황 목록에서 숨긴다', () => {
    expect(isHiddenFromProgramProgressList({ applicationStatus: 'REJECTED' })).toBe(true)
    expect(isHiddenFromProgramProgressList({ applicationStatus: 'auto_rejected' })).toBe(true)
    expect(isHiddenFromProgramProgressList({ applicationStatus: 'APPROVED' })).toBe(false)
    expect(isHiddenFromProgramProgressList({ participantStatus: 'APPROVED' })).toBe(false)
  })

  it('승인 취소로 REJECTED가 된 행만 목록에서 제거한다', () => {
    const visible = filterProgramProgressParticipantItems([
      { participantId: 1, applicationStatus: 'APPROVED', memberName: '승인' },
      { participantId: 2, applicationStatus: 'REJECTED', memberName: '승인취소' },
      { participantId: 3, participantStatus: 'GIVE_UP', memberName: '활동포기' },
    ])

    expect(visible.map(item => item.participantId)).toEqual([1, 3])
  })
})
