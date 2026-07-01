import {
  GENERAL_INDIVIDUAL_SURVEY_RESPONSE_COUNT,
  GENERAL_INDIVIDUAL_SURVEY_RESPONSES_MOCK,
  GENERAL_ORGANIZATION_SURVEY_RESPONSE_COUNT,
  GENERAL_ORGANIZATION_SURVEY_RESPONSES_MOCK,
} from '@/data/mock/general-survey-poll-responses-mock'
import type { Program } from '@/types/domain'
import type {
  RegisteredSurvey,
  SurveyPollRawResponse,
} from '@/features/program/shared/lib/survey-management/survey-management-types'
import {
  getEnabledGeneralSatisfactionAudienceTabs,
  isCompanySchoolProgram,
  isGeneralIndividualProgram,
  type GeneralSatisfactionAudienceKey,
} from '@/features/program/general/lib/survey-audience'

export type GeneralSurveyMockState = {
  registeredSurveys: RegisteredSurvey[]
  activeRegisteredSurveyId: string | null
  satisfactionSurveysByAudience: Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey>>
  lectureEvalSurvey: RegisteredSurvey | null
  responses: SurveyPollRawResponse[]
}

function buildSurvey(
  id: string,
  title: string,
  templateId: string,
  status: RegisteredSurvey['status'],
  responseCount: number,
  participantTotal: number
): RegisteredSurvey {
  return {
    id,
    title,
    templateId,
    status,
    responseCount,
    participantTotal,
  }
}

function buildSatisfactionSurveysByAudience(
  program: Program,
  prefix: string,
  participantTotal: number
): Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey>> {
  if (isCompanySchoolProgram(program)) {
    return {}
  }

  const enabledTabs = getEnabledGeneralSatisfactionAudienceTabs(program)
  const result: Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey>> = {}

  if (enabledTabs.length === 0) {
    return result
  }

  for (const tab of enabledTabs) {
    const audience = tab.key
    if (audience === 'teacher') {
      result.teacher = buildSurvey(
        `${prefix}-satisfaction-teacher`,
        '교사 만족도조사',
        'survey-teacher',
        'before_start',
        0,
        participantTotal
      )
      continue
    }
    if (audience === 'individual') {
      result.individual = buildSurvey(
        `${prefix}-satisfaction-individual`,
        '참여자 만족도조사',
        'survey-student',
        'before_start',
        0,
        participantTotal
      )
      continue
    }
    if (audience === 'student') {
      result.student = buildSurvey(
        `${prefix}-satisfaction-student`,
        '학생 만족도조사',
        'survey-student',
        'before_start',
        0,
        participantTotal
      )
      continue
    }
    if (audience === 'volunteer_h1') {
      result.volunteer_h1 = buildSurvey(
        `${prefix}-satisfaction-volunteer-h1`,
        '상반기 봉사자 만족도조사',
        'survey-student',
        'in_progress',
        8,
        participantTotal
      )
      continue
    }
    if (audience === 'volunteer_h2') {
      result.volunteer_h2 = buildSurvey(
        `${prefix}-satisfaction-volunteer-h2`,
        '하반기 봉사자 만족도조사',
        'survey-student',
        'before_start',
        0,
        participantTotal
      )
    }
  }

  return result
}

export function buildGeneralSurveyMockState(program: Program): GeneralSurveyMockState {
  const individual = isGeneralIndividualProgram(program)
  const responses = individual
    ? GENERAL_INDIVIDUAL_SURVEY_RESPONSES_MOCK
    : GENERAL_ORGANIZATION_SURVEY_RESPONSES_MOCK
  const responseCount = individual
    ? GENERAL_INDIVIDUAL_SURVEY_RESPONSE_COUNT
    : GENERAL_ORGANIZATION_SURVEY_RESPONSE_COUNT
  const participantTotal = individual ? 12 : 36
  const prefix = individual ? 'general-individual' : 'general-organization'

  const registeredSurveyBeforeStart = buildSurvey(
    `${prefix}-survey-before-start`,
    individual ? '개인 참여자 설문조사 (진행 전)' : '기관 참여 설문조사 (진행 전)',
    'survey-student',
    'before_start',
    0,
    participantTotal
  )

  const registeredSurvey = buildSurvey(
    `${prefix}-survey-main`,
    individual ? '개인 참여자 설문조사 01' : '기관 참여 설문조사 01',
    'survey-student',
    responseCount >= participantTotal ? 'finished' : 'in_progress',
    responseCount,
    participantTotal
  )

  return {
    registeredSurveys: [registeredSurveyBeforeStart, registeredSurvey],
    activeRegisteredSurveyId: registeredSurveyBeforeStart.id,
    satisfactionSurveysByAudience: buildSatisfactionSurveysByAudience(
      program,
      prefix,
      participantTotal
    ),
    lectureEvalSurvey: buildSurvey(
      `${prefix}-lecture-eval`,
      '강의평가',
      'survey-admin',
      'before_start',
      0,
      Math.max(1, participantTotal)
    ),
    responses,
  }
}
