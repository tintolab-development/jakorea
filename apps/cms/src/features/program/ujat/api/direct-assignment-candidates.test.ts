import { describe, expect, it } from 'vitest'
import { normalizeUjatDirectAssignmentCandidatesResponse } from './education-execution-api'
import { mapRegionDirectAssignCandidateOptions } from '@/features/program/ujat/ui/detail-modal/progress/region/region-assignment-options'

describe('normalizeUjatDirectAssignmentCandidatesResponse', () => {
  it('success.data 래퍼와 items 별칭을 candidates로 맞춘다', () => {
    expect(
      normalizeUjatDirectAssignmentCandidatesResponse({
        success: true,
        data: {
          items: [{ participantId: 11, volunteerName: '김대기' }],
          existingPrimaryParticipantId: null,
        },
      })
    ).toMatchObject({
      candidates: [{ participantId: 11, volunteerName: '김대기' }],
      existingPrimaryParticipantId: null,
    })
  })

  it('배열 본문과 snake_case 식별자를 정규화한다', () => {
    expect(
      normalizeUjatDirectAssignmentCandidatesResponse([
        { participant_id: '22', volunteer_name: '이대기', memberName: '무시' },
      ])
    ).toMatchObject({
      candidates: [{ participantId: 22, volunteerName: '이대기' }],
    })
  })

  it('정규화 결과가 봉사자 옵션으로 매핑된다', () => {
    const response = normalizeUjatDirectAssignmentCandidatesResponse({
      data: {
        candidates: [{ participant_id: 9, volunteer_name: '최미배정' }],
      },
    })
    expect(mapRegionDirectAssignCandidateOptions(response)).toEqual([
      { value: '9', label: '최미배정' },
    ])
  })
})
