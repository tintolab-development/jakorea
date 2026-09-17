/**
 * TODO(temp-mock): 열여라 참깨 — 설문 관리 LNB별 사전 등록 시드 (검증 후 삭제)
 */

import {
  isGeneralProgramTempMockProgramId,
  TEMP_MOCK_ORG_PROGRAM_ID,
} from '@/features/program/general/api/temp-mock-capabilities'
import type { GeneralSatisfactionAudienceKey } from '@/features/program/general/lib/survey-audience'
import { getEnabledGeneralSatisfactionAudienceTabs } from '@/features/program/general/lib/survey-audience'
import {
  buildLectureEvalSubmittedPollResponse,
  LECTURE_EVAL_TEMPLATE_ID,
  type LectureEvalTabKey,
} from '@/features/program/shared/lib/survey-management/lecture-eval-survey'
import type {
  RegisteredSurvey,
  SurveyPollRawResponse,
} from '@/features/program/shared/lib/survey-management/survey-management-types'
import { DEFAULT_SURVEY_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'
import type { Program } from '@/types/domain'

export type TempMockOrgSurveyState = {
  registeredSurveys: RegisteredSurvey[]
  activeRegisteredSurveyId: string | null
  satisfactionSurveysByAudience: Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey>>
  lectureEvalSurvey: RegisteredSurvey | null
  lectureEvalSubmitted: boolean
  lectureEvalResponses: SurveyPollRawResponse[]
  initialLectureEvalTab: LectureEvalTabKey
  responses: SurveyPollRawResponse[]
}

export const TEMP_MOCK_ORG_SURVEY_POLL_ID = 'temp-mock-org-survey-poll-1'
export const TEMP_MOCK_ORG_SURVEY_LECTURE_ID = 'temp-mock-org-survey-lecture-eval'

const TEMP_MOCK_SURVEY_POLL_TEMPLATE_ID = 'survey-default'

const SATISFACTION_TEMPLATE_BY_AUDIENCE: Record<GeneralSatisfactionAudienceKey, string> = {
  teacher: 'survey-teacher',
  student: 'survey-student',
  individual: 'survey-student',
  volunteer_h1: 'survey-student',
  volunteer_h2: 'survey-student',
}

const SATISFACTION_TITLE_BY_AUDIENCE: Record<GeneralSatisfactionAudienceKey, string> = {
  teacher: '교사 만족도조사',
  student: '학생 만족도조사',
  individual: '참여자 만족도조사',
  volunteer_h1: '상반기 봉사자 만족도조사',
  volunteer_h2: '하반기 봉사자 만족도조사',
}

function satisfactionSurveyId(audience: GeneralSatisfactionAudienceKey): string {
  return `temp-mock-org-survey-satisfaction-${audience}`
}

function buildRegisteredSurvey(input: {
  id: string
  title: string
  templateId: string
  status: RegisteredSurvey['status']
  responseCount: number
  participantTotal: number
}): RegisteredSurvey {
  return {
    id: input.id,
    title: input.title,
    templateId: input.templateId,
    status: input.status,
    responseCount: input.responseCount,
    participantTotal: input.participantTotal,
  }
}

function buildSampleSurveyAnswers(index: number): Record<string, string> {
  const scaleChoice = ['scale-type-item-4', 'scale-type-item-5', 'scale-type-item-3'][index % 3]!
  return {
    [DEFAULT_SURVEY_PARAGRAPH_IDS.score2]: scaleChoice,
    [DEFAULT_SURVEY_PARAGRAPH_IDS.score3]: scaleChoice,
    [DEFAULT_SURVEY_PARAGRAPH_IDS.score4]: scaleChoice,
    [DEFAULT_SURVEY_PARAGRAPH_IDS.score5]: scaleChoice,
    [DEFAULT_SURVEY_PARAGRAPH_IDS.score6]: scaleChoice,
    [DEFAULT_SURVEY_PARAGRAPH_IDS.score7]: scaleChoice,
    [DEFAULT_SURVEY_PARAGRAPH_IDS.subjective]: '프로그램 운영이 체계적이었습니다.',
    [DEFAULT_SURVEY_PARAGRAPH_IDS.subjective2]: '학생 참여도가 높았습니다.',
  }
}

function buildTempMockSurveyResponses(count: number): SurveyPollRawResponse[] {
  const names = [
    '김담당',
    '이교사',
    '박교사',
    '최교사',
    '정교사',
    '한교사',
    '조교사',
    '윤교사',
    '강봉사',
    '임봉사',
    '서봉사',
    '오봉사',
  ]
  return Array.from({ length: count }, (_, index) => ({
    respondentId: `${TEMP_MOCK_ORG_PROGRAM_ID}-survey-respondent-${index + 1}`,
    respondentName: names[index % names.length] ?? `응답자 ${index + 1}`,
    addressRegion: ['서울', '경기', '인천'][index % 3] ?? '서울',
    answers: buildSampleSurveyAnswers(index),
  }))
}

/** 기관+봉사자 프로그램 — 만족도 대상별 응답·참여 규모 */
function satisfactionCounts(audience: GeneralSatisfactionAudienceKey): {
  responseCount: number
  participantTotal: number
} {
  switch (audience) {
    case 'teacher':
      return { responseCount: 6, participantTotal: 8 }
    case 'volunteer_h1':
      return { responseCount: 4, participantTotal: 4 }
    case 'volunteer_h2':
      return { responseCount: 3, participantTotal: 4 }
    case 'student':
      return { responseCount: 10, participantTotal: 216 }
    case 'individual':
      return { responseCount: 5, participantTotal: 12 }
    default:
      return { responseCount: 4, participantTotal: 8 }
  }
}

export function buildTempMockOrgSurveyState(program: Program): TempMockOrgSurveyState | null {
  if (!isGeneralProgramTempMockProgramId(program.id)) return null

  const pollSurvey = buildRegisteredSurvey({
    id: TEMP_MOCK_ORG_SURVEY_POLL_ID,
    title: '열여라 참깨 프로그램 설문조사',
    templateId: TEMP_MOCK_SURVEY_POLL_TEMPLATE_ID,
    status: 'in_progress',
    responseCount: 12,
    participantTotal: 216,
  })

  const satisfactionSurveysByAudience: Partial<
    Record<GeneralSatisfactionAudienceKey, RegisteredSurvey>
  > = {}
  for (const tab of getEnabledGeneralSatisfactionAudienceTabs(program)) {
    const audience = tab.key
    const counts = satisfactionCounts(audience)
    satisfactionSurveysByAudience[audience] = buildRegisteredSurvey({
      id: satisfactionSurveyId(audience),
      title: SATISFACTION_TITLE_BY_AUDIENCE[audience],
      templateId: SATISFACTION_TEMPLATE_BY_AUDIENCE[audience],
      status: 'in_progress',
      responseCount: counts.responseCount,
      participantTotal: counts.participantTotal,
    })
  }

  const lectureEvalResponses = [buildLectureEvalSubmittedPollResponse()]
  const lectureEvalSurvey = buildRegisteredSurvey({
    id: TEMP_MOCK_ORG_SURVEY_LECTURE_ID,
    title: '강의평가 (관리자용)',
    templateId: LECTURE_EVAL_TEMPLATE_ID,
    status: 'finished',
    responseCount: lectureEvalResponses.length,
    participantTotal: 1,
  })

  return {
    registeredSurveys: [pollSurvey],
    activeRegisteredSurveyId: pollSurvey.id,
    satisfactionSurveysByAudience,
    lectureEvalSurvey,
    lectureEvalSubmitted: true,
    lectureEvalResponses,
    initialLectureEvalTab: 'results',
    responses: buildTempMockSurveyResponses(12),
  }
}
