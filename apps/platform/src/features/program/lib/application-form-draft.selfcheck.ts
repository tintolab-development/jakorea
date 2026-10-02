/**
 * application-form-draft — Portal form → WritingFormDraft / answers
 */
import assert from 'node:assert/strict'
import { resolveHorizontalTableCellPlainText } from '@jakorea/form-schema/writing-form'
import {
  buildApplicationAnswersFromDraft,
  coerceApplicationFormDocument,
  prepareIndividualApplicationDraft,
  writingFormDraftFromApplicationForm,
} from './application-form-draft.ts'

const formDoc = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [
    {
      id: 'program-application-trained-teachers-seed-personal-info',
      kind: 'single_item',
      variant: 'horizontal_table',
      requiredMark: true,
      paragraphTitle: '개인정보 수집·이용',
      showBottomConsent: true,
      bottomConsent: 'disagree',
      answerRequired: true,
      tableFlavor: 'field',
      columnHeaders: ['a', 'b', 'c'],
      dataRows: [['', '', '']],
      columnFields: [{ kind: 'text' }, { kind: 'text' }, { kind: 'text' }],
      fieldDataRows: [[{ kind: 'text', value: 'x' }, { kind: 'text', value: 'y' }, { kind: 'text', value: 'z' }]],
    },
  ],
}

assert.ok(coerceApplicationFormDocument(formDoc))
assert.ok(
  coerceApplicationFormDocument({
    schemaJson: JSON.stringify(formDoc),
  }),
)
assert.equal(coerceApplicationFormDocument({ schemaJson: '{}' }), null)
assert.ok(
  coerceApplicationFormDocument({
    schemaJson: formDoc,
  }),
)
assert.ok(
  coerceApplicationFormDocument({
    form: { schemaJson: JSON.stringify(formDoc) },
  }),
)
const fromEmptyOuter = coerceApplicationFormDocument({
  paragraphs: [],
  schemaJson: JSON.stringify(formDoc),
})
assert.ok(fromEmptyOuter && Array.isArray(fromEmptyOuter.paragraphs))
assert.equal(fromEmptyOuter.paragraphs.length, 1)
const wrappedExplanation = {
  paragraphs: formDoc.paragraphs,
  schemaJson: JSON.stringify({
    ...formDoc,
    paragraphs: [
      ...formDoc.paragraphs,
      {
        id: 'program-participant-application-custom-explanation',
        kind: 'single_item',
        variant: 'agreement_explanation_text',
        paragraphTitle: '이 내용이 꼭 있어야함',
        bodyText: '이것으로 일정형 테스트',
      },
    ],
  }),
}
const fromWrapped = coerceApplicationFormDocument(wrappedExplanation)
assert.ok(fromWrapped && Array.isArray(fromWrapped.paragraphs))
assert.equal(fromWrapped.paragraphs.length, 2)

const seedThirdParty = {
  id: 'program-instructor-application-seed-third-party',
  kind: 'single_item',
  variant: 'horizontal_table',
  tableFlavor: 'field',
  columnHeaders: ['제공받는 곳', '수집 항목'],
  dataRows: [['', '']],
  fieldDataRows: [
    [
      { kind: 'text', value: '' },
      { kind: 'text', value: '이름' },
    ],
  ],
}
const customThirdParty = {
  ...seedThirdParty,
  fieldDataRows: [
    [
      { kind: 'text', value: '배정된 교육 대상 학교' },
      { kind: 'text', value: '이름' },
    ],
  ],
}
const catalogSeedDoc = {
  schemaVersion: 1,
  paragraphs: [seedThirdParty],
}
const publishedCustomDoc = {
  schemaVersion: 1,
  paragraphs: [customThirdParty],
}
const sameCountPrefersPublishedCells = coerceApplicationFormDocument({
  paragraphs: catalogSeedDoc.paragraphs,
  schemaJson: JSON.stringify(publishedCustomDoc),
})
assert.ok(sameCountPrefersPublishedCells)
const publishedParagraphs = sameCountPrefersPublishedCells!.paragraphs
assert.ok(Array.isArray(publishedParagraphs))
const publishedRecipient = publishedParagraphs[0] as {
  fieldDataRows?: { kind: string; value?: string }[][]
}
assert.equal(publishedRecipient.fieldDataRows?.[0]?.[0]?.value, '배정된 교육 대상 학교')

const portalEnvelope = coerceApplicationFormDocument({
  programId: 186025,
  formBindingId: 11,
  templateVersionId: 88,
  form: {
    templateCode: 'application-instructor',
    questions: [],
    sections: [],
    paragraphs: catalogSeedDoc.paragraphs,
    schemaJson: publishedCustomDoc,
  },
  draftAnswers: {},
})
assert.ok(portalEnvelope)
const envelopeParagraphs = portalEnvelope!.paragraphs
assert.ok(Array.isArray(envelopeParagraphs))
const envelopeRecipient = envelopeParagraphs[0] as {
  fieldDataRows?: { kind: string; value?: string }[][]
}
assert.equal(envelopeRecipient.fieldDataRows?.[0]?.[0]?.value, '배정된 교육 대상 학교')

const draft = writingFormDraftFromApplicationForm(formDoc, {
  'program-application-trained-teachers-seed-personal-info': { bottomConsent: 'agree' },
})
assert.ok(draft)
const personal = draft!.paragraphs[0]
assert.ok(personal && 'bottomConsent' in personal)
assert.equal(personal.bottomConsent, 'agree')

const answers = buildApplicationAnswersFromDraft(draft!)
assert.deepEqual(answers['program-application-trained-teachers-seed-personal-info'], {
  bottomConsent: 'agree',
})

const withOverride = buildApplicationAnswersFromDraft(draft!, {
  overrides: {
    'program-application-trained-teachers-seed-preferred-schedule': [
      { preferenceRank: 1, date: '2026-10-15' },
    ],
  },
})
assert.deepEqual(
  withOverride['program-application-trained-teachers-seed-preferred-schedule'],
  [{ preferenceRank: 1, date: '2026-10-15' }],
)

const hiddenScheduleId = 'program-participant-application-seed-schedule'
const hiddenTeamId = 'program-participant-application-seed-team-info'
const explanationId = 'program-participant-application-custom-explanation'
const visibleId = 'program-participant-application-seed-personal-info'
const runtimeForm = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  runtimeContext: {
    hiddenQuestionKeys: [hiddenScheduleId, explanationId],
    audienceApplication: { hiddenQuestionKeys: [hiddenTeamId] },
  },
  paragraphs: [
    {
      id: visibleId,
      kind: 'single_item',
      variant: 'horizontal_table',
      requiredMark: true,
      paragraphTitle: '개인정보 수집·이용',
      showBottomConsent: true,
      bottomConsent: 'agree',
      answerRequired: true,
      tableFlavor: 'field',
      columnHeaders: ['a', 'b', 'c'],
      dataRows: [['', '', '']],
      columnFields: [{ kind: 'text' }, { kind: 'text' }, { kind: 'text' }],
      fieldDataRows: [[{ kind: 'text', value: 'x' }]],
    },
    {
      id: hiddenScheduleId,
      kind: 'single_item',
      variant: 'multiple_choice',
      paragraphTitle: '진행 희망 교육 일정',
      answerRequired: true,
      allowMultiple: true,
      items: [],
      selectedPreviewMultipleIds: [],
      hidden: true,
      runtimeHidden: true,
    },
    {
      id: explanationId,
      kind: 'single_item',
      variant: 'agreement_explanation_text',
      paragraphTitle: '이 내용이 꼭 있어야함',
      bodyText: '이것으로 일정형 테스트',
      hidden: true,
      runtimeHidden: true,
    },
    {
      id: hiddenTeamId,
      kind: 'single_item',
      variant: 'horizontal_table',
      paragraphTitle: '팀 정보',
      answerRequired: true,
      tableFlavor: 'text',
      columnHeaders: ['항목', '내용'],
      dataRows: [['', '']],
      columnFields: [],
      fieldDataRows: [],
      showBottomConsent: false,
      runtimeHidden: true,
    },
  ],
}

const visibleDraft = writingFormDraftFromApplicationForm(runtimeForm)
assert.ok(visibleDraft)
assert.deepEqual(
  visibleDraft!.paragraphs.map(paragraph => paragraph.id),
  [visibleId, hiddenScheduleId, explanationId, hiddenTeamId],
)
const visibleAnswers = buildApplicationAnswersFromDraft(visibleDraft!)
assert.deepEqual(Object.keys(visibleAnswers), [visibleId])
assert.equal(hiddenScheduleId in visibleAnswers, false)
assert.equal(hiddenTeamId in visibleAnswers, false)
assert.equal(explanationId in visibleAnswers, false)

const prepared = prepareIndividualApplicationDraft({
  ...visibleDraft!,
  paragraphs: [
    ...visibleDraft!.paragraphs,
    {
      id: 'program-participant-application-seed-interview-schedule',
      kind: 'single_item',
      variant: 'horizontal_table',
      paragraphTitle: '면접 진행 가능 일정',
      paragraphDescription: '',
      requiredMark: true,
      participatesInTitleNumbering: true,
      tableFlavor: 'text',
      columnHeaders: ['면접 진행 가능일', ''],
      dataRows: [['', '']],
      columnFields: [],
      fieldDataRows: [],
      bottomText: '',
      showBottomText: false,
      showBottomConsent: false,
      bottomConsent: 'agree',
      answerRequired: true,
    },
  ],
})
assert.equal(
  prepared.paragraphs.some(paragraph => paragraph.paragraphTitle === '면접 진행 가능 일정'),
  false
)
const preparedTeam = prepared.paragraphs.find(paragraph => paragraph.id === hiddenTeamId)
assert.ok(preparedTeam)
assert.equal(preparedTeam.requiredMark, true)
assert.equal(
  'runtimeHidden' in preparedTeam ? (preparedTeam as { runtimeHidden?: boolean }).runtimeHidden : false,
  false
)

const lostFlavorForm = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [
    {
      id: 'program-instructor-application-seed-third-party',
      kind: 'single_item',
      variant: 'horizontal_table',
      requiredMark: true,
      paragraphTitle: '개인정보 제3자 정보 제공·이용 동의',
      tableFlavor: 'text',
      columnHeaders: ['제공받는 곳', '수집 항목', '수집·이용 목적', '제공받는 자의 보유기간'],
      dataRows: [['', '', '', '']],
      columnFields: [{ kind: 'text' }, { kind: 'text' }, { kind: 'text' }, { kind: 'text' }],
      fieldDataRows: [
        [
          { kind: 'text', value: '배정된 교육 대상 학교' },
          { kind: 'text', value: '이름' },
          { kind: 'text', value: '안내' },
          { kind: 'text', value: '3년' },
        ],
      ],
      showBottomConsent: true,
      bottomConsent: 'agree',
    },
  ],
}
const lostFlavorDraft = writingFormDraftFromApplicationForm(lostFlavorForm)
assert.ok(lostFlavorDraft)
const lostFlavorTable = lostFlavorDraft!.paragraphs[0]
assert.ok(lostFlavorTable && lostFlavorTable.variant === 'horizontal_table')
assert.equal(
  resolveHorizontalTableCellPlainText(lostFlavorTable, 0, 0),
  '배정된 교육 대상 학교'
)

const verticalForm = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [
    {
      id: 'program-application-custom-vertical',
      kind: 'single_item',
      variant: 'vertical_table',
      requiredMark: true,
      paragraphTitle: '커스텀 세로표',
      verticalTableFlavor: 'text',
      rows: [
        {
          stageCount: 1,
          headers: ['항목'],
          cells: [''],
          stageKinds: ['subjective'],
        },
      ],
      bottomText: '',
      showBottomText: false,
      showBottomConsent: false,
      answerRequired: true,
    },
  ],
}
const verticalDraft = writingFormDraftFromApplicationForm(verticalForm, {
  'program-application-custom-vertical': {
    rows: [
      {
        stageCount: 1,
        headers: ['항목'],
        cells: ['작성한 답'],
        stageKinds: ['subjective'],
      },
    ],
  },
})
assert.ok(verticalDraft)
const verticalParagraph = verticalDraft!.paragraphs[0]
assert.ok(verticalParagraph && verticalParagraph.variant === 'vertical_table')
assert.equal(
  verticalParagraph.variant === 'vertical_table' ? verticalParagraph.rows[0]?.cells[0] : '',
  '작성한 답',
)
const verticalAnswers = buildApplicationAnswersFromDraft(verticalDraft!)
assert.ok(verticalAnswers['program-application-custom-vertical'])
assert.equal(
  (verticalAnswers['program-application-custom-vertical'] as { rows?: { cells?: string[] }[] })
    .rows?.[0]?.cells?.[0],
  '작성한 답',
)

const richerVertical = coerceApplicationFormDocument({
  paragraphs: [
    {
      id: 'program-application-custom-vertical',
      kind: 'single_item',
      variant: 'vertical_table',
      verticalTableFlavor: 'text',
      rows: [
        {
          stageCount: 1,
          headers: ['항목'],
          cells: [''],
          stageKinds: ['subjective'],
        },
      ],
    },
  ],
  schemaJson: {
    paragraphs: [
      {
        id: 'program-application-custom-vertical',
        kind: 'single_item',
        variant: 'vertical_table',
        verticalTableFlavor: 'text',
        rows: [
          {
            stageCount: 1,
            headers: ['항목'],
            cells: ['중첩 문서 답'],
            stageKinds: ['subjective'],
          },
        ],
      },
    ],
  },
})
assert.ok(richerVertical)
const richerParagraphs = richerVertical.paragraphs
assert.ok(Array.isArray(richerParagraphs))
const richerParagraph = richerParagraphs[0] as { rows?: { cells?: string[] }[] }
assert.equal(richerParagraph.rows?.[0]?.cells?.[0], '중첩 문서 답')

console.log('application-form-draft.selfcheck: ok')
