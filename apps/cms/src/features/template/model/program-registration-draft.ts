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

export const PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(PROGRAM_REGISTRATION_IDS)
)

function createSeedParagraph(
  id: string,
  title: string,
  paragraphDescription: string = '설명 입력'
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

export function createProgramRegistrationDraft(): WritingFormDraft {
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      createSeedParagraph(PROGRAM_REGISTRATION_IDS.basicInfo, '기본 정보'),
      createSeedParagraph(PROGRAM_REGISTRATION_IDS.businessKpi, '사업 KPI 목표'),
      createSeedParagraph(PROGRAM_REGISTRATION_IDS.wageInfo, '임금 정보'),
      createSeedParagraph(PROGRAM_REGISTRATION_IDS.typeSettings, '프로그램 유형 설정'),
      createSeedParagraph(
        PROGRAM_REGISTRATION_IDS.educationCurriculum,
        '교육 진행 (커리큘럼)',
        '차시 별 정보를 입력해 주세요'
      ),
      createSeedParagraph(
        PROGRAM_REGISTRATION_IDS.educationScheduleSettings,
        '교육 진행 일정 설정',
        '교육이 실행되는 일정을 상세하게 정해주세요.'
      ),
    ],
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
