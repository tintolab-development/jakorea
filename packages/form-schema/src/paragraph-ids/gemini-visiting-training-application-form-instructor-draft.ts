import {
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

/** Gemini 찾아가는 연수 강사 신청 폼 — 시드 단락 ID */
export const GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS = {
  availableSchedule: 'gemini-vt-instructor-seed-available-schedule',
  officialDocument: 'gemini-vt-instructor-seed-official-document',
} as const

export const GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS =
  new Set<string>(Object.values(GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS))

function createAvailableSchedulePlaceholderTable(): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id: GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '강의 진행 가능 일정',
    paragraphDescription: '강의 진행이 가능한 일정을 모두 선택해 주세요.',
    participatesInTitleNumbering: true,
    tableFlavor: 'text',
    columnHeaders: ['강의 진행 가능일', ''],
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

function createOfficialDocumentPlaceholderTable(): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id: GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.officialDocument,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '연수 공문',
    paragraphDescription:
      '공문이 필요할 경우, 공문 내에 반드시 포함되어야 하는 정보를 작성해주세요.',
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

export function createGeminiVisitingTrainingApplicationFormInstructorDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createAvailableSchedulePlaceholderTable(),
    createOfficialDocumentPlaceholderTable(),
  ]
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}
