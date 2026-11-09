import { describe, expect, it } from 'vitest'
import {
  formatRecruitmentHeadcount,
  mapListParticipantRecruitment,
} from './format-recruitment-headcount'

describe('formatRecruitmentHeadcount', () => {
  it('승인 건수와 정원을 함께 표시한다', () => {
    expect(formatRecruitmentHeadcount(10, 30)).toBe('10 / 30')
  })

  it('승인이 없으면 0으로 표시한다', () => {
    expect(formatRecruitmentHeadcount(undefined, 30)).toBe('0 / 30')
    expect(formatRecruitmentHeadcount(null, 30)).toBe('0 / 30')
  })

  it('정원이 없으면 분모를 - 로 표시한다', () => {
    expect(formatRecruitmentHeadcount(4, null)).toBe('4 / -')
    expect(formatRecruitmentHeadcount(4, undefined)).toBe('4 / -')
    expect(formatRecruitmentHeadcount(undefined, null)).toBe('0 / -')
  })

  it('정원 0은 미설정과 같이 분모를 - 로 표시한다', () => {
    expect(formatRecruitmentHeadcount(0, 0)).toBe('0 / -')
    expect(formatRecruitmentHeadcount(3, 0)).toBe('3 / -')
  })
})

describe('mapListParticipantRecruitment', () => {
  it('participantCapacity가 없으면 participantRecruitmentCount를 분모로 쓴다', () => {
    expect(
      mapListParticipantRecruitment({
        participantApprovedCount: 10,
        participantRecruitmentCount: 30,
      })
    ).toEqual({
      participantApprovedCount: 10,
      participantCapacity: 30,
    })
  })

  it('participantCapacity를 별칭보다 우선한다', () => {
    expect(
      mapListParticipantRecruitment({
        participantApprovedCount: 2,
        participantCapacity: 8,
        participantRecruitmentCount: 99,
      }).participantCapacity
    ).toBe(8)
  })

  it('학생·학교·강사·봉사 필드는 읽지 않는다', () => {
    expect(
      mapListParticipantRecruitment({
        participatingStudentCount: 240,
        participatingSchoolCount: 12,
        volunteerRecruitmentCount: 40,
        instructorRecruitmentCount: 7,
        applicantCount: 15,
      } as Parameters<typeof mapListParticipantRecruitment>[0])
    ).toEqual({
      participantApprovedCount: undefined,
      participantCapacity: undefined,
    })
  })
})
