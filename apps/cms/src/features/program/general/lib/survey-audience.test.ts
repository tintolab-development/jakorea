import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  getGeneralParticipantApplicationsLnbLabel,
  hasGeneralInstructorApplications,
} from './detail-meta'
import {
  getDefaultGeneralSatisfactionAudience,
  getGeneralSatisfactionAudienceTabs,
  isGeneralIndividualProgram,
} from './survey-audience'

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

describe('general survey audience', () => {
  it('기관 프로그램은 교사/학생 만족도 탭을 제공한다', () => {
    const p = program({
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    })

    expect(isGeneralIndividualProgram(p)).toBe(false)
    expect(getDefaultGeneralSatisfactionAudience(p)).toBe('teacher')
    expect(getGeneralSatisfactionAudienceTabs(p).map(tab => tab.key)).toEqual(['teacher', 'student'])
  })

  it('개인 프로그램은 단일 참여자 만족도로 구성한다', () => {
    const p = program({
      category: 'individual',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    })

    expect(isGeneralIndividualProgram(p)).toBe(true)
    expect(getDefaultGeneralSatisfactionAudience(p)).toBe('individual')
    expect(getGeneralSatisfactionAudienceTabs(p).map(tab => tab.key)).toEqual(['individual'])
  })

  it('대분류가 없으면 참여자 유형만으로 개인 프로그램을 추론한다', () => {
    const p = program({
      category: 'individual',
      generalParticipantTypes: ['individual', 'teacher_instructor'],
    })

    expect(isGeneralIndividualProgram(p)).toBe(true)
  })

  it('신청 목록 LNB 라벨을 참여자 유형 대분류에 맞게 표시한다', () => {
    expect(
      getGeneralParticipantApplicationsLnbLabel(
        program({
          generalProgramAudience: 'organization',
          generalParticipantTypes: ['school_institution'],
        })
      )
    ).toBe('기관 신청 목록')
    expect(
      getGeneralParticipantApplicationsLnbLabel(
        program({
          generalProgramAudience: 'individual',
          generalParticipantTypes: ['individual'],
        })
      )
    ).toBe('참여자 신청 목록')
  })

  it('강사 신청 목록 LNB는 teacher_instructor 포함 시에만 노출한다', () => {
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
    expect(
      hasGeneralInstructorApplications(program({ generalParticipantTypes: ['individual'] }))
    ).toBe(false)
  })
})
