import type {
  DateParagraph,
  FileAttachmentParagraph,
  MultipleChoiceItem,
  MultipleChoiceParagraph,
  ScaleTypeItem,
  ScaleTypeParagraph,
  SessionPlanShortEssayParagraph,
  ShortEssayParagraph,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  createDefaultIdTypeWithInputOptions,
  createDefaultMultipleChoiceItems,
  createDefaultScaleTypeItems,
  createHorizontalTableParagraph,
  createLectureReportProgramProgressParagraph,
  createVerticalTableParagraph,
  normalizeUjatJournalEducationInfoParagraph,
  UJAT_JOURNAL_EDUCATION_INFO_SAMPLE_INSTITUTION_NAME,
} from '@/features/template/model/writing-form-draft.schema'
import type { DetailSelectValue } from './paragraph-selectors'

export function createShortEssayDefault(id: string): ShortEssayParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'short_essay',
    requiredMark: true,
    paragraphTitle: '주관식형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    showItemTitle: false,
    items: [
      {
        id: 'short-essay-item-1',
        label: 'Title 01',
        placeholder: '답변을 입력해 주세요',
        bodyText: '',
      },
    ],
    bodyPlaceholder: '답변을 입력해 주세요',
    bodyText: '',
  }
}

export function createSessionPlanShortEssayDefault(id: string): SessionPlanShortEssayParagraph {
  const ph = '자유롭게 작성해 주세요'
  return {
    id,
    kind: 'single_item',
    variant: 'session_plan_short_essay',
    requiredMark: true,
    paragraphTitle: '차시 교육 계획',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    showItemTitle: true,
    items: [
      { id: `${id}-intro`, label: '도입', placeholder: ph, bodyText: '' },
      { id: `${id}-body`, label: '전개', placeholder: ph, bodyText: '' },
      { id: `${id}-outro`, label: '마무리', placeholder: ph, bodyText: '' },
    ],
    bodyPlaceholder: ph,
    bodyText: '',
  }
}

export function createMultipleChoiceDefault(id: string): MultipleChoiceParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle: '객관식형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    allowMultiple: false,
    items: createDefaultMultipleChoiceItems().map((it: MultipleChoiceItem) => ({ ...it })),
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

export function createDateDefault(id: string): DateParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'date',
    requiredMark: true,
    paragraphTitle: '날짜형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    periodEnabled: false,
  }
}

export function createTimeDefault(id: string): WritingFormParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'time',
    requiredMark: true,
    paragraphTitle: '시간형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
  }
}

export function createStarRateDefault(id: string): WritingFormParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'star_rate',
    requiredMark: true,
    paragraphTitle: '별점형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    selectedPreviewStars: null,
  }
}

export function createScaleTypeDefault(id: string): ScaleTypeParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'scale_type',
    requiredMark: true,
    paragraphTitle: '점수 선택형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    items: createDefaultScaleTypeItems().map((it: ScaleTypeItem) => ({ ...it })),
    selectedPreviewItemId: null,
  }
}

export function createUserInfoDefault(id: string): WritingFormParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'user_info',
    requiredMark: true,
    paragraphTitle: '사용자 정보형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    userFields: [
      { key: 'name', label: '이름' },
      { key: 'gender', label: '성별' },
      { key: 'birthDate', label: '생년월일' },
      { key: 'phone', label: '연락처' },
      { key: 'email', label: '이메일' },
      { key: 'addressRegion', label: '자택 주소지(지역)' },
      { key: 'addressDetail', label: '자택 주소지(상세)' },
      { key: 'affiliation', label: '소속' },
      { key: 'applicantType', label: '신청자 유형' },
      { key: 'programName', label: '프로그램명' },
      { key: 'period', label: '교육 진행 일정(진행 기간)' },
      { key: 'institutionName', label: '기관명' },
      { key: 'institutionRegion', label: '기관 소재지(시군구)' },
      { key: 'educationTarget', label: '교육 대상(담당 대상)' },
      { key: 'educationGrade', label: '교육 학년(담당 학년)' },
      { key: 'teamName', label: '팀 명' },
      { key: 'teamPartnerName', label: '팀원/파트너 명' },
    ],
    selectedUserFieldKeys: [],
  }
}

export function createFileAttachmentDefault(id: string): FileAttachmentParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'file_attachment',
    requiredMark: true,
    paragraphTitle: '파일 첨부형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
  }
}

export function createDescriptionTitleDefault(id: string): WritingFormParagraph {
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

export function createDescriptionTextDefault(id: string): WritingFormParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'agreement_explanation_text',
    requiredMark: true,
    paragraphTitle: '텍스트형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    bodyPlaceholder: '텍스트를 작성해 주세요',
    bodyText: '',
    answerRequired: true,
  }
}

export function createDescriptionClosingDefault(id: string): WritingFormParagraph {
  return {
    id,
    kind: 'description',
    variant: 'closing',
    requiredMark: false,
    paragraphTitle: '마무리글형',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    body: '',
  }
}

/** `convertParagraphByDetail` 등에서 상세 유형별 신규 단락 템플릿 생성 */
export function createParagraphByDetail(detail: DetailSelectValue, id: string): WritingFormParagraph {
  switch (detail) {
    case 'horizontal_table':
      return createHorizontalTableParagraph(id)
    case 'vertical_table':
      return createVerticalTableParagraph(id, 'text')
    case 'subjective':
      return createShortEssayDefault(id)
    case 'session_plan_short_essay':
      return createSessionPlanShortEssayDefault(id)
    case 'multiple_choice':
      return createMultipleChoiceDefault(id)
    case 'date_only':
      return createDateDefault(id)
    case 'time_only':
      return createTimeDefault(id)
    case 'star_rate':
      return createStarRateDefault(id)
    case 'scale_type':
      return createScaleTypeDefault(id)
    case 'user_info':
      return createUserInfoDefault(id)
    case 'file_attachment':
      return createFileAttachmentDefault(id)
    case 'ujat_journal_education_info':
      return normalizeUjatJournalEducationInfoParagraph({
        id,
        kind: 'single_item',
        variant: 'ujat_journal_education_info',
        requiredMark: true,
        paragraphTitle: '교육 정보',
        paragraphDescription: '설명 입력',
        participatesInTitleNumbering: true,
        answerRequired: true,
        schoolDisplayFallback: UJAT_JOURNAL_EDUCATION_INFO_SAMPLE_INSTITUTION_NAME,
        grade: '',
        classSection: '',
        prepDate: '',
        sessionDate: '',
      }) as WritingFormParagraph
    case 'lecture_report_program_progress':
      return createLectureReportProgramProgressParagraph(id)
    case 'title':
      return createDescriptionTitleDefault(id)
    case 'text':
      return createDescriptionTextDefault(id)
    case 'closing':
      return createDescriptionClosingDefault(id)
    case 'static_description_lines':
      return {
        id,
        kind: 'description',
        variant: 'static_description_lines',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        lines: [''],
      }
    case 'id_type_with_input': {
      const opts = createDefaultIdTypeWithInputOptions()
      return {
        id,
        kind: 'single_item',
        variant: 'id_type_with_input',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        options: opts,
        selectedOptionId: opts[0]?.id ?? null,
        inputPlaceholder: '주민등록번호를 입력해 주세요',
        inputValue: '',
        answerRequired: true,
      }
    }
  }
}
