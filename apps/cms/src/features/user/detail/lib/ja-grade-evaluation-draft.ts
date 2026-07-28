import {
  normalizeWritingFormDraft,
  type ScaleTypeItem,
  type ScaleTypeParagraph,
  type ShortEssayParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  JA_GRADE_PARAGRAPH_IDS,
  JA_GRADE_SCALE_QUESTION_IDS,
} from '@/features/user/detail/lib/ja-grade-evaluation-constants'
import type { JaGradeEvaluationRecord } from '@/features/user/detail/lib/ja-grade-evaluation-store'

function createJaGradeScaleItems(): ScaleTypeItem[] {
  return [1, 2, 3, 4, 5].map(score => ({
    id: `ja-scale-${score}`,
    label: String(score),
  }))
}

function createScaleQuestion(
  id: string,
  paragraphTitle: string,
  selectedPreviewItemId: string | null = null
): ScaleTypeParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'scale_type',
    requiredMark: true,
    paragraphTitle,
    paragraphDescription:
      '평가 항목 당 점수는 1점 당 X5점으로 환산되어 25점 만점으로 부여됩니다.',
    participatesInTitleNumbering: true,
    answerRequired: true,
    items: createJaGradeScaleItems(),
    selectedPreviewItemId,
  }
}

const JA_GRADE_INTRO_DESCRIPTION = [
  '관리자의 평가 항목은 총 4개 문항으로, 각 항목 당 25점씩 총 100점 만점으로 평가됩니다.',
  '평가등급은 행정 평가까지 반영된 최종 점수에 따라 A등급(85~100점), B등급(60~84점), C등급(50~59점), D등급(50점 이하) 4가지 등급으로 분류됩니다.',
].join('\n')

export function createJaGradeEvaluationDraft(): WritingFormDraft {
  const q5: ShortEssayParagraph = {
    id: JA_GRADE_PARAGRAPH_IDS.q5,
    kind: 'single_item',
    variant: 'short_essay',
    requiredMark: false,
    paragraphTitle: '행정 능력 평가',
    paragraphDescription:
      '해당 항목은 별도의 평가 없이 강사의 이력에 따라 자동으로 계산되어 감점 반영됩니다.',
    participatesInTitleNumbering: true,
    answerRequired: false,
    showItemTitle: false,
    items: [
      {
        id: 'ja-grade-q5-comment',
        label: 'Title 01',
        placeholder: '답변을 입력해 주세요',
        bodyText: '',
      },
    ],
    bodyPlaceholder: '답변을 입력해 주세요',
    bodyText: '',
  }

  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'q123' },
    paragraphs: [
      {
        id: JA_GRADE_PARAGRAPH_IDS.intro,
        kind: 'description',
        variant: 'survey_title_with_period',
        requiredMark: true,
        paragraphTitle: 'JA 등급 평가지',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        surveyTitle: 'JA 등급 평가지',
        surveyDescription: JA_GRADE_INTRO_DESCRIPTION,
        periodMode: 'immediate',
        startPeriodMode: 'immediate',
        endPeriodMode: 'immediate',
        startAt: null,
        endAt: null,
        endPeriodPresetLabel: null,
        showWritingPeriodOnForm: false,
      },
      createScaleQuestion(JA_GRADE_PARAGRAPH_IDS.q1, '교육 내용의 전문성'),
      createScaleQuestion(JA_GRADE_PARAGRAPH_IDS.q2, '전달력 및 수업 몰입도'),
      createScaleQuestion(JA_GRADE_PARAGRAPH_IDS.q3, '참여 유도 및 상호작용'),
      createScaleQuestion(JA_GRADE_PARAGRAPH_IDS.q4, '콘텐츠 활용 및 수업 설계'),
      q5,
      {
        id: JA_GRADE_PARAGRAPH_IDS.closing,
        kind: 'description',
        variant: 'closing',
        requiredMark: false,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        body: '평가에 참여해 주셔서 감사합니다.',
      },
    ],
  })
}

function applyStoredSelection(
  paragraph: WritingFormParagraph,
  selectedPreviewItemId: string | null | undefined
): WritingFormParagraph {
  if (
    selectedPreviewItemId == null ||
    paragraph.kind !== 'single_item' ||
    paragraph.variant !== 'scale_type'
  ) {
    return paragraph
  }
  return {
    ...paragraph,
    selectedPreviewItemId,
  }
}

function applyStoredComment(
  paragraph: WritingFormParagraph,
  comment: string | undefined
): WritingFormParagraph {
  if (
    comment == null ||
    comment === '' ||
    paragraph.id !== JA_GRADE_PARAGRAPH_IDS.q5 ||
    paragraph.kind !== 'single_item' ||
    paragraph.variant !== 'short_essay'
  ) {
    return paragraph
  }

  const items =
    paragraph.items?.map((item, index) =>
      index === 0 ? { ...item, bodyText: comment } : item
    ) ?? paragraph.items

  return {
    ...paragraph,
    bodyText: comment,
    items,
  }
}

export function applyJaGradeEvaluationRecordToDraft(
  draft: WritingFormDraft,
  record: JaGradeEvaluationRecord | null | undefined
): WritingFormDraft {
  if (record == null) return draft

  const selections = [
    record.q1ItemId,
    record.q2ItemId,
    record.q3ItemId,
    record.q4ItemId,
  ]

  return normalizeWritingFormDraft({
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      const qIndex = JA_GRADE_SCALE_QUESTION_IDS.indexOf(
        paragraph.id as (typeof JA_GRADE_SCALE_QUESTION_IDS)[number]
      )
      if (qIndex >= 0) {
        return applyStoredSelection(paragraph, selections[qIndex])
      }
      return applyStoredComment(paragraph, record.comment)
    }),
  })
}

export function buildJaGradeEvaluationDraft(
  record: JaGradeEvaluationRecord | null | undefined
): WritingFormDraft {
  return applyJaGradeEvaluationRecordToDraft(createJaGradeEvaluationDraft(), record)
}
