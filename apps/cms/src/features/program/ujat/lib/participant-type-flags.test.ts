import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  generalParticipantTypesFromUjatFlags,
  resolveUjatParticipantTypeFlags,
  ujatParticipantFlagsFromOverlaySave,
  ujatParticipantTypeLabels,
} from './participant-type-flags'

function program(partial: Partial<Program> = {}): Program {
  return {
    id: '186030',
    sponsorId: '1',
    title: 'UJAT',
    type: 'offline',
    format: 'course',
    category: 'volunteer',
    rounds: [],
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'pending',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...partial,
  }
}

describe('resolveUjatParticipantTypeFlags', () => {
  it('overlay에 기관·봉사가 있으면 그 값을 쓴다', () => {
    const flags = resolveUjatParticipantTypeFlags(
      program({
        ujatRegistrationOverlay: {
          'ujat.basicInfo.participant.organization': true,
          'ujat.basicInfo.participant.volunteer': true,
        },
      })
    )
    expect(ujatParticipantTypeLabels(flags)).toBe('학교/기관, 봉사자')
  })

  it('세션 leftover false여도 모집 row로 기관·봉사를 복원한다', () => {
    const flags = resolveUjatParticipantTypeFlags(
      program({
        ujatRegistrationOverlay: {
          'ujat.basicInfo.participant.organization': false,
          'ujat.basicInfo.participant.volunteer': false,
        },
        programRecruitments: [
          { recruitmentType: 'PARTICIPANT', targetType: 'ORGANIZATION' },
          { recruitmentType: 'VOLUNTEER', targetType: 'COLLEGE_STUDENT' },
        ],
      }),
      {
        'ujat.basicInfo.participant.organization': false,
        'ujat.basicInfo.participant.volunteer': false,
      }
    )
    expect(ujatParticipantTypeLabels(flags)).toBe('학교/기관, 봉사자')
  })

  it('유형·overlay가 없으면 조회는 빈 값이다', () => {
    expect(ujatParticipantTypeLabels(resolveUjatParticipantTypeFlags(program()))).toBe('-')
  })

  it('신규 등록 폼만 학교/기관·봉사자 기본값을 쓴다', () => {
    expect(
      ujatParticipantTypeLabels(resolveUjatParticipantTypeFlags(program(), undefined, { fillDefaults: true }))
    ).toBe('학교/기관, 봉사자')
  })

  it('overlay 저장 체크는 GET types와 달라도 types에 반영한다', () => {
    const flags = ujatParticipantFlagsFromOverlaySave({
      'ujat.basicInfo.participant.organization': true,
      'ujat.basicInfo.participant.volunteer': false,
    })
    expect(flags).not.toBeNull()
    expect(generalParticipantTypesFromUjatFlags(flags!)).toEqual(['school_institution'])
  })
})
