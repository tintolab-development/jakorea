import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  getGeneralParticipantApplicationsLnbLabel,
  getGeneralProgressMenuItems,
  hasGeneralInstructorApplications,
  hasGeneralParticipantApplications,
} from './detail-meta'
import {
  getDefaultGeneralSatisfactionAudience,
  getEnabledGeneralSatisfactionAudienceTabs,
  getGeneralSatisfactionAudienceTabs,
  isGeneralIndividualParticipantSelection,
  isGeneralIndividualProgram,
  programHasGeneralSatisfactionSurvey,
} from './survey-audience'
import { getGeneralSurveyMenuItems } from './detail-meta'
import { getGeneralSurveyEditFieldsForAudience } from '@/features/program/general/model/common-info-edit-schema'

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

  it('개인만 선택하면 KPI 학교·학급 대상이 아니다', () => {
    expect(isGeneralIndividualParticipantSelection(true, false)).toBe(true)
    expect(isGeneralIndividualParticipantSelection(false, true)).toBe(false)
    expect(isGeneralIndividualParticipantSelection(true, true)).toBe(false)
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

  it('참여자·기관 신청 목록 LNB는 해당 유형 포함 시에만 노출한다', () => {
    expect(
      hasGeneralParticipantApplications(
        program({ generalParticipantTypes: ['individual', 'teacher_instructor'] })
      )
    ).toBe(true)
    expect(
      hasGeneralParticipantApplications(
        program({ generalParticipantTypes: ['school_institution', 'volunteer'] })
      )
    ).toBe(true)
    expect(
      hasGeneralParticipantApplications(
        program({ generalParticipantTypes: ['teacher_instructor', 'volunteer'] })
      )
    ).toBe(false)
  })

  it('개인 프로그램 진행 현황 LNB에 참여자·출석·과제·게시글을 포함한다', () => {
    const items = getGeneralProgressMenuItems(
      program({
        generalProgramAudience: 'individual',
        generalParticipantTypes: ['individual', 'teacher_instructor', 'volunteer'],
      })
    )
    expect(items.map(item => item.label)).toEqual([
      '참여자',
      '참여 강사',
      '참여 봉사자',
      '출석 관리',
      '과제 관리',
      '게시글',
    ])
  })

  it('기관 프로그램 진행 현황 LNB는 참여 기관·강사·봉사자만 노출한다', () => {
    const items = getGeneralProgressMenuItems(
      program({
        generalProgramAudience: 'organization',
        generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
      })
    )
    expect(items.map(item => item.label)).toEqual(['참여 기관', '참여 강사', '참여 봉사자'])
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

  it('설문 진행 항목에 따라 만족도 대상 탭을 필터링한다', () => {
    const org = program({
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
      generalSurveyMenuKeys: ['survey', 'student_satisfaction'],
    })

    expect(getEnabledGeneralSatisfactionAudienceTabs(org).map(tab => tab.key)).toEqual(['student'])
    expect(programHasGeneralSatisfactionSurvey(org)).toBe(true)
    expect(getDefaultGeneralSatisfactionAudience(org)).toBe('student')
  })

  it('만족도조사 LNB는 학생·교사 항목을 하나로 묶는다', () => {
    const org = program({
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
      generalSurveyMenuKeys: ['survey', 'student_satisfaction', 'teacher_satisfaction'],
    })

    expect(getGeneralSurveyMenuItems(org).map(item => item.key)).toEqual(['survey', 'satisfaction'])
  })

  it('봉사자 포함 프로그램은 학생 만족도 대신 상·하반기 봉사자 탭을 제공한다', () => {
    const volunteerProgram = program({
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
      generalSurveyMenuKeys: ['survey', 'student_satisfaction', 'teacher_satisfaction'],
    })

    expect(getEnabledGeneralSatisfactionAudienceTabs(volunteerProgram).map(tab => tab.key)).toEqual([
      'teacher',
      'volunteer_h1',
      'volunteer_h2',
    ])
    expect(getDefaultGeneralSatisfactionAudience(volunteerProgram)).toBe('teacher')
  })

  it('봉사자 없는 기관 프로그램은 학생 만족도 탭을 유지한다', () => {
    const org = program({
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
      generalSurveyMenuKeys: ['survey', 'student_satisfaction', 'teacher_satisfaction'],
    })

    expect(getEnabledGeneralSatisfactionAudienceTabs(org).map(tab => tab.key)).toEqual([
      'teacher',
      'student',
    ])
  })

  it('개인 대상 설문 수정 항목은 교사 만족도를 제외한다', () => {
    const individualFields = getGeneralSurveyEditFieldsForAudience(true)
    expect(individualFields.map(field => field.id)).toEqual([
      'survey',
      'student_satisfaction',
      'lecture_evaluation',
    ])
    expect(
      individualFields.find(field => field.id === 'student_satisfaction')?.label
    ).toBe('만족도조사')

    const organizationFields = getGeneralSurveyEditFieldsForAudience(false)
    expect(organizationFields.map(field => field.id)).toEqual([
      'survey',
      'student_satisfaction',
      'teacher_satisfaction',
      'lecture_evaluation',
    ])
  })
})
