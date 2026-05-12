import {
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type TitleWithPeriodParagraph,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

export const PROGRAM_REGISTRATION_IDS = {
  basicInfo: 'program-registration-seed-basic-info',
  businessKpi: 'program-registration-seed-business-kpi',
  wageInfo: 'program-registration-seed-wage-info',
  typeSettings: 'program-registration-seed-type-settings',
  educationCurriculum: 'program-registration-seed-education-curriculum',
  educationScheduleSettings: 'program-registration-seed-education-schedule-settings',
} as const

/** 일반 프로그램 등록 폼 — 시드 단락 전부(프로그램 유형 설정 포함) */
export const PROGRAM_REGISTRATION_GENERAL_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(PROGRAM_REGISTRATION_IDS)
)

/** 1사 1교 프로그램 등록 폼 — 프로그램 유형 설정 단락 제외 */
export const PROGRAM_REGISTRATION_ECONOMY_SEED_PARAGRAPH_IDS = new Set<string>([
  PROGRAM_REGISTRATION_IDS.basicInfo,
  PROGRAM_REGISTRATION_IDS.businessKpi,
  PROGRAM_REGISTRATION_IDS.wageInfo,
  PROGRAM_REGISTRATION_IDS.educationCurriculum,
  PROGRAM_REGISTRATION_IDS.educationScheduleSettings,
])

/** @deprecated `getProgramRegistrationSeedParagraphIds` 사용 권장 */
export const PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS = PROGRAM_REGISTRATION_GENERAL_SEED_PARAGRAPH_IDS

export type ProgramRegistrationFormVariant = 'general' | 'economy'

export function getProgramRegistrationSeedParagraphIds(
  variant: ProgramRegistrationFormVariant
): ReadonlySet<string> {
  return variant === 'economy'
    ? PROGRAM_REGISTRATION_ECONOMY_SEED_PARAGRAPH_IDS
    : PROGRAM_REGISTRATION_GENERAL_SEED_PARAGRAPH_IDS
}

function createSeedParagraph(
  id: string,
  title: string,
  /** 비워 두면 카드 선택 시 설명란 높이 점프가 줄어듦(지급조서 사전 동의 시드와 동일 패턴) */
  paragraphDescription: string = ''
): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: title,
    paragraphDescription,
    participatesInTitleNumbering: true,
    tableFlavor: 'text',
    columnHeaders: ['항목', '내용'],
    dataRows: [['', '']],
    columnFields: [],
    fieldDataRows: [],
    bottomText: '',
    showBottomText: false,
    showBottomConsent: false,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

export function createProgramRegistrationDraft(
  variant: ProgramRegistrationFormVariant = 'general'
): WritingFormDraft {
  const paragraphs: HorizontalTableParagraph[] = [
    createSeedParagraph(PROGRAM_REGISTRATION_IDS.basicInfo, '기본 정보'),
    createSeedParagraph(PROGRAM_REGISTRATION_IDS.businessKpi, '사업 KPI 목표'),
    createSeedParagraph(PROGRAM_REGISTRATION_IDS.wageInfo, '임금 정보'),
  ]
  if (variant === 'general') {
    paragraphs.push(
      createSeedParagraph(PROGRAM_REGISTRATION_IDS.typeSettings, '프로그램 유형 설정')
    )
  }
  paragraphs.push(
    createSeedParagraph(
      PROGRAM_REGISTRATION_IDS.educationCurriculum,
      variant === 'economy' ? '교육 커리큘럼' : '교육 진행 (커리큘럼)'
    ),
    createSeedParagraph(
      PROGRAM_REGISTRATION_IDS.educationScheduleSettings,
      '교육 진행 일정 설정'
    )
  )
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs,
  })
}

export function createProgramRegistrationUserTitleParagraph(id: string): TitleWithPeriodParagraph {
  return {
    id,
    kind: 'description',
    variant: 'survey_title_with_period',
    requiredMark: true,
    paragraphTitle: '',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    surveyTitle: '',
    surveyDescription: '',
    periodMode: 'immediate',
    startAt: null,
    endAt: null,
    showWritingPeriodOnForm: false,
  }
}
