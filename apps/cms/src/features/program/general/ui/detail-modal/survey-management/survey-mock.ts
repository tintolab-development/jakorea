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
  getDefaultGeneralSatisfactionAudience,
  isGeneralIndividualProgram,
  programHasVolunteerParticipant,
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
  const individual = isGeneralIndividualProgram(program)
  const defaultAudience = getDefaultGeneralSatisfactionAudience(program)

  if (individual) {
    return {
      [defaultAudience]: buildSurvey(
        `${prefix}-satisfaction-${defaultAudience}`,
        '참여자 만족도조사',
        'survey-student',
        'before_start',
        0,
        participantTotal
      ),
    }
  }

  if (programHasVolunteerParticipant(program)) {
    return {
      teacher: buildSurvey(
        `${prefix}-satisfaction-teacher`,
        '교사 만족도조사',
        'survey-teacher',
        'before_start',
        0,
        participantTotal
      ),
      volunteer_h1: buildSurvey(
        `${prefix}-satisfaction-volunteer-h1`,
        '상반기 봉사자 만족도조사',
        'survey-student',
        'in_progress',
        8,
        participantTotal
      ),
      volunteer_h2: buildSurvey(
        `${prefix}-satisfaction-volunteer-h2`,
        '하반기 봉사자 만족도조사',
        'survey-student',
        'before_start',
        0,
        participantTotal
      ),
    }
  }

  return {
    teacher: buildSurvey(
      `${prefix}-satisfaction-teacher`,
      '교사 만족도조사',
      'survey-teacher',
      'before_start',
      0,
      participantTotal
    ),
  }
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
