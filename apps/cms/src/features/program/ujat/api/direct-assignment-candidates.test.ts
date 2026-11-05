import { describe, expect, it } from 'vitest'
import {
  normalizeUjatDirectAssignmentCandidatesResponse,
  readUjatDirectAssignmentOccupancy,
} from './education-execution-api'
import { mapRegionDirectAssignCandidateOptions } from '@/features/program/ujat/ui/detail-modal/progress/region/region-assignment-options'

describe('normalizeUjatDirectAssignmentCandidatesResponse', () => {
  it('success.data 래퍼와 items 별칭을 candidates로 맞춘다', () => {
    expect(
      normalizeUjatDirectAssignmentCandidatesResponse({
        success: true,
        data: {
          items: [{ participantId: 11, volunteerName: '김대기' }],
          existingPrimaryParticipantId: null,
          assignedVolunteerCount: 0,
        },
      })
    ).toMatchObject({
      candidates: [{ participantId: 11, volunteerName: '김대기' }],
      existingPrimaryParticipantId: null,
      assignedVolunteerCount: 0,
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
        assignedVolunteerCount: 0,
      },
    })
    expect(mapRegionDirectAssignCandidateOptions(response)).toEqual([
      { value: '9', label: '최미배정' },
    ])
  })

  it('2인 가득 슬롯은 200 본문의 assignedVolunteerCount로 구분하고 후보 없음과 섞지 않는다', () => {
    const full = normalizeUjatDirectAssignmentCandidatesResponse({
      success: true,
      data: {
        programId: 186495,
        educationSlotId: 183672,
        reallocationRequired: false,
        candidates: [],
        existingPrimaryParticipantId: null,
        assignedVolunteerCount: 2,
      },
    })
    expect(full.assignedVolunteerCount).toBe(2)
    expect(readUjatDirectAssignmentOccupancy(full)).toBe('full')
    expect(full.existingPrimaryParticipantId).toBeNull()

    const empty = normalizeUjatDirectAssignmentCandidatesResponse({
      data: {
        candidates: [],
        existingPrimaryParticipantId: null,
        assignedVolunteerCount: 0,
        reallocationRequired: true,
      },
    })
    expect(readUjatDirectAssignmentOccupancy(empty)).toBe('empty')

    const primary = normalizeUjatDirectAssignmentCandidatesResponse({
      data: {
        candidates: [{ participantId: 33 }],
        existingPrimaryParticipantId: 10,
        assignedVolunteerCount: 1,
      },
    })
    expect(readUjatDirectAssignmentOccupancy(primary)).toBe('primary')
    expect(primary.existingPrimaryParticipantId).toBe(10)

    expect(
      readUjatDirectAssignmentOccupancy(
        normalizeUjatDirectAssignmentCandidatesResponse({
          data: { candidates: [] },
        })
      )
    ).toBe('unknown')
  })
})
