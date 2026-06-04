/**
 * 일반 프로그램(기관) 봉사자 신청·심사 UI 상수
 */

export const GENERAL_VOLUNTEER_APPLICATION_LIST_TITLE = '봉사자 신청 현황'

export type GeneralVolunteerApplicationType = 'new' | 'ujat-graduate'

export const GENERAL_VOLUNTEER_APPLICATION_TYPE_LABELS: Record<
  GeneralVolunteerApplicationType,
  string
> = {
  new: '신규 봉사자',
  'ujat-graduate': 'UJAT 수료자 봉사자',
}

export type GeneralDocumentScreeningStatus = 'pass' | 'fail' | 'pending'

export const GENERAL_DOCUMENT_SCREENING_STATUS_LABELS: Record<
  GeneralDocumentScreeningStatus,
  string
> = {
  pending: '신청 및 대기 중',
  fail: '서류 불합격',
  pass: '서류 합격',
}

export type GeneralManagerEvaluation = 'pass' | 'neutral' | 'fail' | 'unreviewed'

export const GENERAL_MANAGER_EVALUATION_ORDER: readonly GeneralManagerEvaluation[] = [
  'pass',
  'neutral',
  'fail',
  'unreviewed',
] as const

export const GENERAL_MANAGER_EVALUATION_LABELS: Record<GeneralManagerEvaluation, string> = {
  pass: '○',
  neutral: '△',
  fail: 'X',
  unreviewed: '미검토',
}

export type GeneralInterviewAssignmentStatus = 'waiting' | 'assigned' | 'withdrawn'

export const GENERAL_INTERVIEW_ASSIGNMENT_STATUS_LABELS: Record<
  GeneralInterviewAssignmentStatus,
  string
> = {
  waiting: '배정 대기',
  assigned: '배정 완료',
  withdrawn: '활동 포기',
}

export type GeneralSecondInterviewScreeningStatus =
  | 'waiting'
  | 'completed'
  | 'pass'
  | 'fail'
  | 'reserve1'
  | 'reserve2'
  | 'reserve3'
  | 'reserve4'

export const GENERAL_SECOND_INTERVIEW_SCREENING_STATUS_ORDER: readonly GeneralSecondInterviewScreeningStatus[] =
  ['waiting', 'completed', 'pass', 'fail', 'reserve1', 'reserve2', 'reserve3', 'reserve4'] as const

export const GENERAL_SECOND_INTERVIEW_SCREENING_STATUS_LABELS: Record<
  GeneralSecondInterviewScreeningStatus,
  string
> = {
  waiting: '면접 진행 대기',
  completed: '면접 진행 완료',
  pass: '면접 합격',
  fail: '면접 불합격',
  reserve1: '예비 1',
  reserve2: '예비 2',
  reserve3: '예비 3',
  reserve4: '예비 4',
}

export type GeneralEssayColumnKey =
  | 'essayIntro'
  | 'essayEducationExperience'
  | 'essayNecessity'
  | 'essayJaExperience'

export const GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES: Record<GeneralEssayColumnKey, string> = {
  essayIntro: '1. 자기소개 및 지원동기',
  essayEducationExperience: '2. 교육봉사, 강사 아르바이트 등 교육 진행 경험',
  essayNecessity:
    '3. 초등학생 대상 경제 교육의 필요성에 대해 본인의 생각을 자유롭게 작성',
  essayJaExperience:
    '4. 초·중·고 당시 학교에서 JA Korea 경제금융교육을 들은 경험 혹은 진행하는 프로그램에 지원하여 참여한 경험',
}

export const GENERAL_ESSAY_COLUMN_DEFAULT_WIDTHS: Record<GeneralEssayColumnKey, number> = {
  essayIntro: 260,
  essayEducationExperience: 320,
  essayNecessity: 360,
  essayJaExperience: 480,
}

export const GENERAL_ESSAY_COLUMN_MIN_WIDTHS: Record<GeneralEssayColumnKey, number> = {
  essayIntro: 220,
  essayEducationExperience: 280,
  essayNecessity: 320,
  essayJaExperience: 400,
}

/** 면접 심사 결과 — 미배정·미진행 */
export const GENERAL_INTERVIEW_SCREENING_BEFORE_LABEL = '심사 전'

export const GENERAL_UJAT_COMPLETION_LABEL = '이수완료'
export const GENERAL_UJAT_NOT_COMPLETED_LABEL = '-'

export function formatGeneralVolunteerApplicantDisplayName(
  name: string,
  loginId: string | undefined
): string {
  const id = loginId?.trim()
  return id ? `${name}(${id})` : name
}

export function formatGeneralUjatCompletionLabel(
  applicationType: GeneralVolunteerApplicationType
): string {
  return applicationType === 'ujat-graduate'
    ? GENERAL_UJAT_COMPLETION_LABEL
    : GENERAL_UJAT_NOT_COMPLETED_LABEL
}

export function formatGeneralVolunteerApplicationType(
  type: GeneralVolunteerApplicationType
): string {
  return GENERAL_VOLUNTEER_APPLICATION_TYPE_LABELS[type]
}

export function formatGeneralVolunteerEssayCellValue(
  applicationType: GeneralVolunteerApplicationType,
  value: string | undefined
): string {
  if (applicationType === 'ujat-graduate') return '-'
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}
