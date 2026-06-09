import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  getGeneralParticipantInterviewEnabled,
  getGeneralProgressMenuItems,
  hasGeneralInstructorApplications,
} from './detail-meta'

function program(overrides: Partial<Program>): Program {
  return {
    id: 'program-1',
    sponsorId: 'sponsor-1',
    title: '테스트 프로그램',
    mainTitle: '테스트 프로그램',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '',
    endDate: '',
    applicationStartDate: '',
    applicationEndDate: '',
    status: 'active',
    businessArea: '경제금융',
    targetLevel: 'elementary',
    rounds: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('general detail meta', () => {
  it('기관-only 프로그램은 teacher_instructor 없이 강사 신청 LNB를 숨긴다', () => {
    expect(
      hasGeneralInstructorApplications(
        program({ generalParticipantTypes: ['school_institution'] })
      )
    ).toBe(false)
    expect(
      hasGeneralInstructorApplications(
        program({
          generalParticipantTypes: ['school_institution', 'teacher_instructor'],
        })
      )
    ).toBe(true)
  })

  it('개인 프로그램 진행 현황 첫 항목 라벨을 참여자로 표시한다', () => {
    const items = getGeneralProgressMenuItems(
      program({
        category: 'individual',
        generalProgramAudience: 'individual',
        generalParticipantTypes: ['individual'],
      })
    )
    expect(items.map(item => item.tab)).toEqual(['progress_participants'])
    expect(items[0]?.label).toBe('참여자')
  })

  it('기관 프로그램 진행 현황 첫 항목 라벨을 참여 기관으로 표시한다', () => {
    const items = getGeneralProgressMenuItems(
      program({
        generalProgramAudience: 'organization',
        generalParticipantTypes: ['school_institution'],
      })
    )
    expect(items[0]?.label).toBe('참여 기관')
  })

  it('참여자 유형에 따라 진행 현황 메뉴를 필터한다', () => {
    const items = getGeneralProgressMenuItems(
      program({
        generalProgramAudience: 'organization',
        generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
      })
    )
    expect(items.map(item => item.tab)).toEqual([
      'progress_participants',
      'progress_instructors',
      'progress_volunteers',
    ])
  })

  it('개인 참여자 면접 설정을 program 필드 우선으로 해석한다', () => {
    expect(
      getGeneralParticipantInterviewEnabled(
        program({
          category: 'individual',
          generalProgramAudience: 'individual',
          generalParticipantTypes: ['individual'],
          generalParticipantInterviewEnabled: true,
        })
      )
    ).toBe(true)
    expect(
      getGeneralParticipantInterviewEnabled(
        program({
          category: 'individual',
          generalProgramAudience: 'individual',
          generalParticipantTypes: ['individual'],
          generalCommonInfo: {
            participantRecruitmentInfo: { interviewEnabled: true },
          },
        })
      )
    ).toBe(true)
    expect(
      getGeneralParticipantInterviewEnabled(
        program({
          generalProgramAudience: 'organization',
          generalParticipantTypes: ['school_institution'],
          generalParticipantInterviewEnabled: true,
        })
      )
    ).toBe(false)
  })
})
