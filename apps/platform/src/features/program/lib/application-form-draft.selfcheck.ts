/**
 * application-form-draft — Portal form → WritingFormDraft / answers
 */
import assert from 'node:assert/strict'
import { resolveHorizontalTableCellPlainText } from '@jakorea/form-schema/writing-form'
import {
  buildApplicationAnswersFromDraft,
  coerceApplicationFormDocument,
  resolvePortalApplicationFormRuntimeContext,
  collectRuntimeConditionalQuestions,
  collectRuntimeHiddenAnswerKeys,
  mergeApplicationBindingRuntimeParagraphs,
  omitRuntimeHiddenAnswers,
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

const nestedRuntimeBinding = {
  programId: 186089,
  formBindingId: 187323,
  form: {
    paragraphs: [{ id: 'program-volunteer-application-seed-interview-schedule', kind: 'single_item' }],
    runtimeContext: {
      audienceApplication: {
        dynamicQuestions: {
          'program-volunteer-application-seed-interview-schedule': { optionCount: 8 },
        },
      },
    },
  },
}
const nestedRuntimeEnvelope = coerceApplicationFormDocument(nestedRuntimeBinding)
assert.ok(nestedRuntimeEnvelope)
const runtimeFromDoc = nestedRuntimeEnvelope!.runtimeContext as {
  audienceApplication?: { dynamicQuestions?: Record<string, { optionCount?: number }> }
}
assert.equal(
  runtimeFromDoc.audienceApplication?.dynamicQuestions?.[
    'program-volunteer-application-seed-interview-schedule'
  ]?.optionCount,
  8,
)
const resolvedRuntime = resolvePortalApplicationFormRuntimeContext(nestedRuntimeBinding) as {
  audienceApplication?: { dynamicQuestions?: Record<string, { optionCount?: number }> }
}
assert.equal(
  resolvedRuntime.audienceApplication?.dynamicQuestions?.[
    'program-volunteer-application-seed-interview-schedule'
  ]?.optionCount,
  8,
)

const draft = writingFormDraftFromApplicationForm(formDoc, {
  'program-application-trained-teachers-seed-personal-info': { bottomConsent: 'agree' },
})
assert.ok(draft)
const personal = draft!.paragraphs[0]
assert.ok(personal && 'bottomConsent' in personal)
assert.equal(personal.bottomConsent, 'agree')

const answers = buildApplicationAnswersFromDraft(draft!)
const personalAnswer = answers['program-application-trained-teachers-seed-personal-info'] as {
  bottomConsent?: string
  fieldDataRows?: unknown
}
assert.equal(personalAnswer.bottomConsent, 'agree')
assert.ok(Array.isArray(personalAnswer.fieldDataRows))

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
const dynamicInterviewId = 'program-participant-application-seed-interview-schedule'
const preparedWithInterview = prepareIndividualApplicationDraft(
  {
    ...visibleDraft!,
    paragraphs: [
      visibleDraft!.paragraphs[0]!,
      {
        id: dynamicInterviewId,
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
      ...visibleDraft!.paragraphs.slice(1),
    ],
  },
  { keepParagraphIds: new Set([dynamicInterviewId]) },
)
assert.deepEqual(
  preparedWithInterview.paragraphs.map(paragraph => paragraph.id),
  [visibleId, dynamicInterviewId, hiddenScheduleId, explanationId, hiddenTeamId],
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

const crimeKey = 'program-instructor-application-seed-crime-record'
const experienceKey = 'program-volunteer-application-seed-ja-experience'
const previousJaKey = 'program-volunteer-application-seed-previous-ja-program'
const audienceForm = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  runtimeContext: {
    audienceApplication: {
      version: 1,
      flavor: 'instructor',
      hiddenQuestionKeys: [crimeKey],
      dynamicQuestions: {},
      conditionalQuestions: {
        [previousJaKey]: {
          dependsOnQuestionKey: experienceKey,
          visibleValues: ['PROGRAM-VOLUNTEER-APPLICATION-JA-EXPERIENCE-YES', 'YES'],
          hiddenValues: ['PROGRAM-VOLUNTEER-APPLICATION-JA-EXPERIENCE-NO', 'NO'],
        },
      },
    },
  },
  paragraphs: runtimeForm.paragraphs.slice(0, 1),
}
const audienceHidden = collectRuntimeHiddenAnswerKeys(audienceForm)
const audienceConditionals = collectRuntimeConditionalQuestions(audienceForm)
assert.equal(audienceHidden.has(crimeKey), true)
assert.deepEqual(
  Object.keys(
    omitRuntimeHiddenAnswers(
      {
        [crimeKey]: '',
        [experienceKey]: ['program-volunteer-application-ja-experience-no'],
        [previousJaKey]: [],
        other: 'x',
      },
      audienceHidden,
      audienceConditionals,
    ),
  ),
  [experienceKey, 'other'],
)
assert.deepEqual(
  Object.keys(
    omitRuntimeHiddenAnswers(
      {
        [experienceKey]: ['program-volunteer-application-ja-experience-yes'],
        [previousJaKey]: 'answer',
      },
      audienceHidden,
      audienceConditionals,
    ),
  ),
  [experienceKey, previousJaKey],
)

const ujatBasicKey = 'ujat-program-application-volunteer-seed-basic-info'
const ujatPreviousTermKey = 'ujat-program-application-volunteer-seed-previous-term'
const ujatConditionals = collectRuntimeConditionalQuestions({
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  runtimeContext: {
    audienceApplication: {
      conditionalQuestions: {
        [ujatPreviousTermKey]: {
          dependsOnQuestionKey: ujatBasicKey,
          dependsOnField: 'applicationType',
          operator: 'in',
          visibleValues: ['UJAT-GRADUATE'],
          hiddenValues: ['NEW'],
        },
      },
    },
  },
  paragraphs: runtimeForm.paragraphs.slice(0, 1),
})
assert.equal(
  omitRuntimeHiddenAnswers(
    {
      [ujatBasicKey]: { applicationType: 'new' },
      [ujatPreviousTermKey]: { activityTerm: '3' },
    },
    new Set(),
    ujatConditionals,
  )[ujatPreviousTermKey],
  undefined,
)
assert.equal(
  typeof omitRuntimeHiddenAnswers(
    {
      [ujatBasicKey]: { applicationType: 'ujat-graduate' },
      [ujatPreviousTermKey]: { activityTerm: '3' },
    },
    new Set(),
    ujatConditionals,
  )[ujatPreviousTermKey],
  'object',
)

/** 단일 선택은 `selectedPreviewSingleId` 하나를 제출하고, 저장값을 다시 라디오로 복원한다 */
const singleChoiceForm = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [
    {
      id: experienceKey,
      kind: 'single_item',
      variant: 'multiple_choice',
      paragraphTitle: 'JA 봉사 프로그램 진행 경험 여부',
      answerRequired: true,
      allowMultiple: false,
      items: [
        { id: 'program-volunteer-application-ja-experience-yes', label: '있음' },
        { id: 'program-volunteer-application-ja-experience-no', label: '없음' },
      ],
      selectedPreviewSingleId: 'program-volunteer-application-ja-experience-no',
      selectedPreviewMultipleIds: [],
    },
  ],
}
const singleChoiceDraft = writingFormDraftFromApplicationForm(singleChoiceForm)
assert.ok(singleChoiceDraft)
assert.equal(buildApplicationAnswersFromDraft(singleChoiceDraft)[experienceKey] ?? null, null)
const restoredSingle = writingFormDraftFromApplicationForm(singleChoiceForm, {
  [experienceKey]: 'program-volunteer-application-ja-experience-yes',
})
assert.equal(
  buildApplicationAnswersFromDraft(restoredSingle!)[experienceKey],
  'program-volunteer-application-ja-experience-yes',
)

const volunteerInterviewKey = 'program-volunteer-application-seed-interview-schedule'
const volunteerInterviewForm = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [
    {
      id: volunteerInterviewKey,
      kind: 'single_item',
      variant: 'horizontal_table',
      requiredMark: true,
      paragraphTitle: '면접 진행 가능 일정',
      tableFlavor: 'text',
      columnHeaders: ['면접 진행 가능일', ''],
      dataRows: [['', '']],
      fieldDataRows: [],
      showBottomConsent: false,
      answerRequired: true,
    },
  ],
}
const volunteerInterviewDraft = writingFormDraftFromApplicationForm(volunteerInterviewForm)
assert.ok(volunteerInterviewDraft)
assert.equal(volunteerInterviewKey in buildApplicationAnswersFromDraft(volunteerInterviewDraft!), false)

const sexOffenseInquiryKey = 'program-application-institution-seed-sex-offense-consent-inquiry'
const sexOffenseSubmissionKey = 'program-application-institution-seed-sex-offense-consent-submission'
const sexOffenseForm = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [
    {
      id: sexOffenseInquiryKey,
      kind: 'single_item',
      variant: 'horizontal_table',
      answerRequired: true,
      tableFlavor: 'text',
      columnHeaders: ['항목', '내용'],
      dataRows: [['', '']],
      fieldDataRows: [[{ kind: 'text', value: 'stale' }, { kind: 'subjective', value: '' }]],
      runtimeCondition: {
        dependsOnQuestionKey: sexOffenseSubmissionKey,
        operator: 'semantic_requested',
        conditionKind: 'SEX_OFFENSE_CONSENT_REQUESTED',
      },
    },
  ],
}
const sexOffenseInquiryDraft = writingFormDraftFromApplicationForm(sexOffenseForm)
assert.ok(sexOffenseInquiryDraft)
assert.equal(
  sexOffenseInquiryKey in buildApplicationAnswersFromDraft(sexOffenseInquiryDraft),
  false,
)
const paragraphSexOffenseConditionals = collectRuntimeConditionalQuestions(sexOffenseForm)
assert.equal(
  paragraphSexOffenseConditionals.some(item => item.questionKey === sexOffenseInquiryKey),
  true,
)

const institutionSidecarForm = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [
    {
      id: 'program-application-institution-seed-personal-info',
      kind: 'single_item',
      variant: 'horizontal_table',
      answerRequired: true,
      showBottomConsent: true,
      bottomConsent: 'agree',
      tableFlavor: 'field',
      columnHeaders: ['수집 항목', '수집·이용 목적', '보유기간'],
      dataRows: [['', '', '']],
      fieldDataRows: [[{ kind: 'text', value: '이름, 학교명' }]],
    },
    {
      id: 'program-application-institution-seed-basic-info',
      kind: 'single_item',
      variant: 'horizontal_table',
      answerRequired: true,
      tableFlavor: 'text',
      columnHeaders: ['항목', '내용'],
      dataRows: [['', '']],
      fieldDataRows: [],
    },
    {
      id: 'program-application-institution-seed-guidance',
      kind: 'single_item',
      variant: 'horizontal_table',
      answerRequired: true,
      tableFlavor: 'field',
      columnHeaders: ['항목', '내용'],
      dataRows: [['', '']],
      fieldDataRows: [],
    },
    {
      id: 'program-application-institution-seed-sex-offense-consent-submission',
      kind: 'single_item',
      variant: 'horizontal_table',
      answerRequired: true,
      tableFlavor: 'text',
      columnHeaders: ['항목', '내용'],
      dataRows: [['', '']],
      fieldDataRows: [],
    },
    {
      id: 'program-application-institution-seed-schedule',
      kind: 'single_item',
      variant: 'multiple_choice',
      answerRequired: true,
      allowMultiple: true,
      items: [
        { id: 'institution-schedule-slot-1', label: 'seed 1' },
        { id: 'institution-schedule-slot-2', label: 'seed 2' },
      ],
      selectedPreviewMultipleIds: ['institution-schedule-slot-1', 'institution-schedule-slot-2'],
    },
  ],
}
const institutionSidecarDraft = writingFormDraftFromApplicationForm(institutionSidecarForm)
assert.ok(institutionSidecarDraft)
const institutionSidecarAnswers = buildApplicationAnswersFromDraft(institutionSidecarDraft, {
  overrides: {
    'program-application-institution-seed-basic-info': { dataRows: [['', '']] },
    'program-application-institution-seed-sex-offense-consent-submission': {
      submissionRequest: 'request',
    },
  },
  omitParagraphIds: new Set(['program-application-institution-seed-guidance']),
})
assert.equal(
  typeof institutionSidecarAnswers['program-application-institution-seed-personal-info'],
  'object',
)
assert.equal(
  Array.isArray(institutionSidecarAnswers['program-application-institution-seed-personal-info']),
  false,
)
assert.equal(
  typeof institutionSidecarAnswers['program-application-institution-seed-basic-info'],
  'object',
)
assert.equal(
  Array.isArray(institutionSidecarAnswers['program-application-institution-seed-basic-info']),
  false,
)
assert.equal(
  'program-application-institution-seed-guidance' in institutionSidecarAnswers,
  false,
)
assert.deepEqual(
  institutionSidecarAnswers['program-application-institution-seed-schedule'] ?? [],
  [],
)
const emptySidecarDraft = writingFormDraftFromApplicationForm(institutionSidecarForm)
assert.ok(emptySidecarDraft)
const emptySidecarAnswers = buildApplicationAnswersFromDraft(emptySidecarDraft)
assert.equal('program-application-institution-seed-basic-info' in emptySidecarAnswers, false)
assert.equal('program-application-institution-seed-guidance' in emptySidecarAnswers, false)
assert.equal(
  'program-application-institution-seed-sex-offense-consent-submission' in emptySidecarAnswers,
  false,
)

const volunteerPersonalKey = 'program-volunteer-application-seed-personal-info'
const volunteerBindingForm = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [
    {
      id: volunteerPersonalKey,
      kind: 'single_item',
      variant: 'horizontal_table',
      showBottomConsent: true,
      bottomConsent: 'agree',
      tableFlavor: 'field',
      columnHeaders: ['a', 'b', 'c'],
      dataRows: [['', '', '']],
      fieldDataRows: [],
    },
  ],
}
const volunteerClearedDraft = writingFormDraftFromApplicationForm(volunteerBindingForm)
assert.ok(volunteerClearedDraft)
const volunteerPersonalBeforeMerge = volunteerClearedDraft!.paragraphs.find(
  paragraph => paragraph.id === volunteerPersonalKey,
)
assert.ok(volunteerPersonalBeforeMerge && 'bottomConsent' in volunteerPersonalBeforeMerge)
assert.equal(volunteerPersonalBeforeMerge.bottomConsent, undefined)

const volunteerAfterBindingMerge = mergeApplicationBindingRuntimeParagraphs(
  volunteerClearedDraft!,
  volunteerBindingForm,
)
const volunteerPersonalAfterMerge = volunteerAfterBindingMerge.paragraphs.find(
  paragraph => paragraph.id === volunteerPersonalKey,
)
assert.ok(volunteerPersonalAfterMerge && 'bottomConsent' in volunteerPersonalAfterMerge)
assert.equal(volunteerPersonalAfterMerge.bottomConsent, undefined)

console.log('application-form-draft.selfcheck: ok')
