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
  getGeneralSatisfactionEmptyCopy,
  getGeneralSatisfactionAudienceTabs,
  isGeneralIndividualParticipantSelection,
  isGeneralIndividualProgram,
  programHasGeneralSatisfactionSurvey,
} from './survey-audience'
import { getGeneralSurveyMenuItems } from './detail-meta'
import { getGeneralSurveyEditFieldsForAudience } from '@/features/program/general/model/common-info-edit-schema'
import { buildGeneralSurveyMockState } from '@/features/program/general/ui/detail-modal/survey-management/survey-mock'

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

  it('개인 프로그램은 참여자 단일 만족도 탭을 제공한다', () => {
    const p = program({
      category: 'individual',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
      generalSurveyMenuKeys: ['survey', 'satisfaction'],
    })

    expect(isGeneralIndividualProgram(p)).toBe(true)
    expect(getDefaultGeneralSatisfactionAudience(p)).toBe('individual')
    expect(getGeneralSatisfactionAudienceTabs(p).map(tab => tab.key)).toEqual(['individual'])
    expect(getEnabledGeneralSatisfactionAudienceTabs(p).map(tab => tab.key)).toEqual(['individual'])
  })

  it('개인 프로그램(봉사자 포함)은 상·하반기 봉사자 만족도 탭을 제공한다', () => {
    const p = program({
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual', 'volunteer'],
      generalSurveyMenuKeys: ['survey', 'satisfaction'],
    })

    expect(getEnabledGeneralSatisfactionAudienceTabs(p).map(tab => tab.key)).toEqual([
      'volunteer_h1',
      'volunteer_h2',
    ])
    expect(getDefaultGeneralSatisfactionAudience(p)).toBe('volunteer_h1')
  })

  it('개인 프로그램(봉사자만)은 상·하반기 봉사자 만족도 탭을 제공한다', () => {
    const p = program({
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual', 'volunteer'],
      generalSurveyMenuKeys: ['survey', 'satisfaction'],
    })

    expect(getEnabledGeneralSatisfactionAudienceTabs(p).map(tab => tab.key)).toEqual([
      'volunteer_h1',
      'volunteer_h2',
    ])
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
      generalSurveyMenuKeys: ['survey', 'satisfaction'],
    })

    expect(getEnabledGeneralSatisfactionAudienceTabs(org).map(tab => tab.key)).toEqual([
      'teacher',
      'student',
    ])
    expect(programHasGeneralSatisfactionSurvey(org)).toBe(true)
    expect(getDefaultGeneralSatisfactionAudience(org)).toBe('teacher')
  })

  it('만족도조사 LNB는 satisfaction 항목 하나로 묶는다', () => {
    const org = program({
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
      generalSurveyMenuKeys: ['survey', 'satisfaction'],
    })

    expect(getGeneralSurveyMenuItems(org).map(item => item.key)).toEqual(['survey', 'satisfaction'])
  })

  it('봉사자 포함 프로그램은 학생 만족도 대신 상·하반기 봉사자 탭을 제공한다', () => {
    const volunteerProgram = program({
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
      generalSurveyMenuKeys: ['survey', 'satisfaction'],
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
      generalSurveyMenuKeys: ['survey', 'satisfaction'],
    })

    expect(getEnabledGeneralSatisfactionAudienceTabs(org).map(tab => tab.key)).toEqual([
      'teacher',
      'student',
    ])
  })

  it('1사1교 프로그램은 교사용 만족도조사만 제공한다', () => {
    const companySchool = program({
      id: 'company-school-local-test',
      mainTitle: '1사1교 대표 케이스',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
      generalSurveyMenuKeys: ['survey', 'satisfaction'],
    })

    expect(getEnabledGeneralSatisfactionAudienceTabs(companySchool).map(tab => tab.key)).toEqual([
      'teacher',
    ])
    expect(getDefaultGeneralSatisfactionAudience(companySchool)).toBe('teacher')
    expect(getGeneralSatisfactionEmptyCopy('teacher', companySchool)).toMatchObject({
      title: '아직 등록된 만족도조사가 없습니다.',
      description: '만족도조사 등록 버튼을 눌러 설문 내용을 추가해 주세요.',
      secondaryDescription: '만족도조사 등록 시 해당 프로그램의 모든 학교에 동일하게 노출됩니다.',
      registerButton: '만족도조사 등록',
    })
    expect(buildGeneralSurveyMockState(companySchool).satisfactionSurveysByAudience).toEqual({})
  })

  it('교육받은 교사 프로그램은 1사1교와 동일한 교사용 만족도조사만 제공한다', () => {
    const trainedTeachers = program({
      id: 'trained-teachers-prog-001',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
      generalSurveyMenuKeys: ['survey', 'satisfaction'],
    })

    expect(getEnabledGeneralSatisfactionAudienceTabs(trainedTeachers).map(tab => tab.key)).toEqual([
      'teacher',
    ])
    expect(getDefaultGeneralSatisfactionAudience(trainedTeachers)).toBe('teacher')
    expect(getGeneralSatisfactionEmptyCopy('teacher', trainedTeachers)).toMatchObject({
      title: '아직 등록된 만족도조사가 없습니다.',
      description: '만족도조사 등록 버튼을 눌러 설문 내용을 추가해 주세요.',
      secondaryDescription: '만족도조사 등록 시 해당 프로그램의 모든 학교에 동일하게 노출됩니다.',
      registerButton: '만족도조사 등록',
    })
    expect(buildGeneralSurveyMockState(trainedTeachers).satisfactionSurveysByAudience).toEqual({})
  })

  it('설문 수정 항목은 공통 3종을 제공한다', () => {
    const fields = getGeneralSurveyEditFieldsForAudience(false)
    expect(fields.map(field => field.id)).toEqual(['survey', 'satisfaction', 'lecture_evaluation'])
    expect(fields.map(field => field.label)).toEqual(['설문조사', '만족도조사', '강의평가'])

    const individualFields = getGeneralSurveyEditFieldsForAudience(true)
    expect(individualFields.map(field => field.id)).toEqual([
      'survey',
      'satisfaction',
      'lecture_evaluation',
    ])
  })
})
