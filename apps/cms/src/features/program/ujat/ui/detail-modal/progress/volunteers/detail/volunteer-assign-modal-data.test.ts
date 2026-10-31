import { describe, expect, it } from 'vitest'
import { partnerOptionsFromRecommendation } from './volunteer-assign-modal-data'

describe('partnerOptionsFromRecommendation', () => {
  it('추천 후보를 배정일 적은 순으로 파트너 옵션에 넣는다', () => {
    expect(
      partnerOptionsFromRecommendation([
        {
          participantId: 8,
          volunteerName: '박봉사',
          assignmentDayCount: 3,
          hasPartnerHistoryWithVolunteer: false,
        },
        {
          participantId: 9,
          volunteerName: '최봉사',
          totalAssignedDays: 1,
          hasPartnerHistoryWithVolunteer: true,
        },
        { participantId: 10, volunteerName: ' ' },
      ]).map(option => option.value)
    ).toEqual(['9', '8'])
  })
})
