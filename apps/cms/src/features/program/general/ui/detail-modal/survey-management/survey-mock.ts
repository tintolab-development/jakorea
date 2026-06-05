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
  responseCount: number,
  participantTotal: number
): RegisteredSurvey {
  return {
    id,
    title,
    templateId,
    status: responseCount > 0 ? 'finished' : 'before_start',
    responseCount,
    participantTotal,
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
  const defaultAudience = getDefaultGeneralSatisfactionAudience(program)

  const registeredSurvey = buildSurvey(
    `${prefix}-survey-main`,
    individual ? '개인 참여자 설문조사 01' : '기관 참여 설문조사 01',
    'survey-student',
    responseCount,
    participantTotal
  )

  const satisfactionSurvey = buildSurvey(
    `${prefix}-satisfaction-${defaultAudience}`,
    individual ? '참여자 만족도조사' : '교사 만족도조사',
    defaultAudience === 'teacher' ? 'survey-teacher' : 'survey-student',
    responseCount,
    participantTotal
  )

  return {
    registeredSurveys: [registeredSurvey],
    activeRegisteredSurveyId: registeredSurvey.id,
    satisfactionSurveysByAudience: {
      [defaultAudience]: satisfactionSurvey,
      ...(individual
        ? {}
        : {
            student: buildSurvey(
              `${prefix}-satisfaction-student`,
              '학생 만족도조사',
              'survey-student',
              0,
              participantTotal
            ),
          }),
    },
    lectureEvalSurvey: buildSurvey(
      `${prefix}-lecture-eval`,
      '강의평가',
      'survey-admin',
      0,
      Math.max(1, participantTotal)
    ),
    responses,
  }
}
