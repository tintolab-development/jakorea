/**
 * UJAT 봉사자 1차 서류 심사 — 필터·정렬 공통 상수
 */

export const UJAT_VOLUNTEER_PREFERRED_REGIONS = [
  '서울',
  '경기(남부)',
  '인천',
  '대전',
  '대구',
  '부산',
  '광주',
  '전북(전주)',
] as const

export type UjatVolunteerPreferredRegion = (typeof UJAT_VOLUNTEER_PREFERRED_REGIONS)[number]

/** 지역 정렬 우선순위 (기획 스펙) */
export const UJAT_VOLUNTEER_REGION_SORT_ORDER: Record<string, number> =
  Object.fromEntries(UJAT_VOLUNTEER_PREFERRED_REGIONS.map((r, i) => [r, i]))

export const UJAT_VOLUNTEER_GRADE_OPTIONS = [
  '1학년',
  '2학년',
  '3학년',
  '4학년',
  '휴학생',
  '졸업유예',
] as const

export type UjatVolunteerGrade = (typeof UJAT_VOLUNTEER_GRADE_OPTIONS)[number]

export type UjatVolunteerApplicationType = 'new' | 'ujat-graduate'

export const UJAT_VOLUNTEER_APPLICATION_TYPE_LABELS: Record<UjatVolunteerApplicationType, string> = {
  new: '신규 봉사자',
  'ujat-graduate': 'UJAT 수료자 봉사자',
}

export type UjatDocumentScreeningStatus = 'pass' | 'fail' | 'pending'

export const UJAT_DOCUMENT_SCREENING_STATUS_LABELS: Record<UjatDocumentScreeningStatus, string> = {
  pending: '신청 및 대기 중',
  fail: '서류 불합격',
  pass: '서류 합격',
}

/** 담당자 평가 (○ / △ / X / 미검토) */
export type UjatManagerEvaluation = 'pass' | 'neutral' | 'fail' | 'unreviewed'

export const UJAT_MANAGER_EVALUATION_ORDER: readonly UjatManagerEvaluation[] = [
  'pass',
  'neutral',
  'fail',
  'unreviewed',
] as const

export const UJAT_MANAGER_EVALUATION_LABELS: Record<UjatManagerEvaluation, string> = {
  pass: '○',
  neutral: '△',
  fail: 'X',
  unreviewed: '미검토',
}

export type UjatVolunteerRecruitHalf = 'h1' | 'h2'

/** 면접일 배정 현황 (1차 서류 합격자 목록) */
export type UjatInterviewAssignmentStatus = 'waiting' | 'assigned' | 'withdrawn'

export const UJAT_INTERVIEW_ASSIGNMENT_STATUS_LABELS: Record<UjatInterviewAssignmentStatus, string> = {
  waiting: '배정 대기',
  assigned: '배정 완료',
  withdrawn: '활동 포기',
}

/** 2차 면접 심사 현황 (2차 면접 대상자 목록) */
export type UjatSecondInterviewScreeningStatus =
  | 'waiting'
  | 'completed'
  | 'pass'
  | 'fail'
  | 'reserve1'
  | 'reserve2'
  | 'reserve3'
  | 'reserve4'

export const UJAT_SECOND_INTERVIEW_SCREENING_STATUS_ORDER: readonly UjatSecondInterviewScreeningStatus[] =
  ['waiting', 'completed', 'pass', 'fail', 'reserve1', 'reserve2', 'reserve3', 'reserve4'] as const

export const UJAT_SECOND_INTERVIEW_SCREENING_STATUS_LABELS: Record<
  UjatSecondInterviewScreeningStatus,
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

/** 2차 면접 일괄 합격 모달 — 합격 유형 선택 */
export type UjatInterview2BulkPassType =
  | 'pass'
  | 'reserve1'
  | 'reserve2'
  | 'reserve3'
  | 'reserve4'

export const UJAT_INTERVIEW2_BULK_PASS_TYPE_OPTIONS: readonly {
  value: UjatInterview2BulkPassType
  label: string
}[] = [
  { value: 'pass', label: '합격' },
  { value: 'reserve1', label: '예비합격 1' },
  { value: 'reserve2', label: '예비합격 2' },
  { value: 'reserve3', label: '예비합격 3' },
  { value: 'reserve4', label: '예비합격 4' },
] as const

/** 서술형 1~4번 컬럼 (신청서 문항과 동일 제목) */
export type UjatEssayColumnKey =
  | 'essayIntro'
  | 'essayEducationExperience'
  | 'essayNecessity'
  | 'essayJaExperience'

export const UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES: Record<UjatEssayColumnKey, string> = {
  essayIntro: '1. 자기소개 및 지원동기',
  essayEducationExperience: '2. 교육봉사, 강사 아르바이트 등 교육 진행 경험',
  essayNecessity:
    '3. 초등학생 대상 경제 교육의 필요성에 대해 본인의 생각을 자유롭게 작성',
  essayJaExperience:
    '4. 초·중·고 당시 학교에서 JA Korea 경제금융교육을 들은 경험 혹은 진행하는 프로그램에 지원하여 참여한 경험',
}

/** 서술형 컬럼 기본·최소 너비 (헤더 문구가 잘리지 않도록) */
export const UJAT_ESSAY_COLUMN_DEFAULT_WIDTHS: Record<UjatEssayColumnKey, number> = {
  essayIntro: 260,
  essayEducationExperience: 320,
  essayNecessity: 360,
  essayJaExperience: 480,
}

export const UJAT_ESSAY_COLUMN_MIN_WIDTHS: Record<UjatEssayColumnKey, number> = {
  essayIntro: 220,
  essayEducationExperience: 280,
  essayNecessity: 320,
  essayJaExperience: 400,
}

/** UJAT 수료자 봉사자 — 서술형 1~4번 미작성 표기 */
export const UJAT_GRADUATE_ESSAY_CELL_PLACEHOLDER = '-'

export function formatUjatVolunteerEssayCellValue(
  applicationType: UjatVolunteerApplicationType,
  value: string | undefined
): string {
  if (applicationType === 'ujat-graduate') {
    return UJAT_GRADUATE_ESSAY_CELL_PLACEHOLDER
  }
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}
