/**
 * 기관 성범죄 동의서 미제출 — inquiry 키 omit · runtimeCondition
 * 실행: pnpm --filter platform test
 */
import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import {
  buildApplicationAnswersFromDraft,
  collectRuntimeConditionalQuestions,
  omitRuntimeHiddenAnswers,
  writingFormDraftFromApplicationForm,
} from '../../lib/application-form-draft.ts'
import {
  applySexOffenseInquiryMethodChange,
  applyUjatSexOffenseWriteChoice,
  emptyInstitutionSexOffense,
  findIncompleteSexOffenseMessage,
  findIncompleteUjatSexOffenseWriteMessage,
  normalizeUjatSexOffenseWriteValues,
  omitSexOffenseInquiryAnswersIfNotRequested,
  resolveUjatSexOffenseWriteChoice,
  sexOffenseInquiryAnswerFromValues,
  sexOffenseSubmissionAnswerFromValues,
  sexOffenseValuesFromDraftAnswers,
  shouldShowSexOffenseInquiry,
} from './apply-institution-sex-offense-answers.ts'
import { formatSexOffenseTeacherGuidanceValue } from '@jakorea/form-schema/program-application'

const SUBMISSION = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest
const INQUIRY = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod
const ECONOMY_SUBMISSION = PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentSubmissionRequest
const ECONOMY_INQUIRY = PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod
const GUIDANCE = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance
const SCHEDULE = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice

const inquiryForm = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [
    {
      id: SUBMISSION,
      kind: 'single_item',
      variant: 'horizontal_table',
      requiredMark: true,
      paragraphTitle: '성범죄 경력 조회 동의서 제출 요청',
      answerRequired: true,
      tableFlavor: 'text',
      columnHeaders: ['항목', '내용'],
      dataRows: [['', '']],
      fieldDataRows: [],
      showBottomConsent: false,
    },
    {
      id: INQUIRY,
      kind: 'single_item',
      variant: 'horizontal_table',
      requiredMark: true,
      paragraphTitle: '성범죄 경력 조회 동의서 조회 방식',
      answerRequired: true,
      tableFlavor: 'text',
      columnHeaders: ['항목', '내용'],
      dataRows: [['', '']],
      fieldDataRows: [],
      showBottomConsent: false,
      runtimeCondition: {
        dependsOnQuestionKey: SUBMISSION,
        operator: 'semantic_requested',
        conditionKind: 'SEX_OFFENSE_CONSENT_REQUESTED',
      },
    },
    {
      id: GUIDANCE,
      kind: 'single_item',
      variant: 'horizontal_table',
      requiredMark: false,
      paragraphTitle: '안내 사항',
      answerRequired: false,
      hidden: true,
      runtimeHidden: true,
      tableFlavor: 'field',
      columnHeaders: ['항목', '내용'],
      dataRows: [['', '']],
      fieldDataRows: [],
    },
    {
      id: SCHEDULE,
      kind: 'single_item',
      variant: 'multiple_choice',
      requiredMark: true,
      paragraphTitle: '진행 희망 교육 일정',
      answerRequired: true,
      allowMultiple: true,
      items: [
        { id: 'line:0', label: '26년 10월 30일(금) 13:30 ~ 15:30' },
        { id: 'line:1', label: '26년 10월 30일(금) 9:30 ~ 11:30' },
      ],
      selectedPreviewMultipleIds: ['line:0'],
    },
  ],
}

function buildSubmitAnswers(input: {
  submissionRequest: 'request' | 'no_submit'
  includeInquiry?: boolean
  leftoverInquiry?: unknown
}) {
  const draft = writingFormDraftFromApplicationForm(inquiryForm)
  assert.ok(draft)
  const sexOffense = {
    ...emptyInstitutionSexOffense(),
    submissionRequest: input.submissionRequest,
    ...(input.includeInquiry
      ? {
          inquiryMethod: 'criminal_record_site' as const,
          siteSubmission: 'online' as const,
          institutionId: 'id1',
          verificationNumber: 'v1',
        }
      : { inquiryMethod: 'ja_system' as const }),
  }
  const overrides: Record<string, unknown> = {
    [SUBMISSION]: sexOffenseSubmissionAnswerFromValues(sexOffense),
  }
  const omit = new Set<string>()
  if (shouldShowSexOffenseInquiry(sexOffense) && input.includeInquiry) {
    overrides[INQUIRY] = sexOffenseInquiryAnswerFromValues(sexOffense)
  } else {
    omit.add(INQUIRY)
  }
  const raw = buildApplicationAnswersFromDraft(draft, {
    overrides,
    omitParagraphIds: omit.size > 0 ? omit : undefined,
  })
  if (input.leftoverInquiry !== undefined) raw[INQUIRY] = input.leftoverInquiry
  const conditionals = collectRuntimeConditionalQuestions(inquiryForm)
  return omitSexOffenseInquiryAnswersIfNotRequested(
    omitRuntimeHiddenAnswers(raw, new Set([GUIDANCE]), conditionals),
  )
}

assert.equal(shouldShowSexOffenseInquiry({ ...emptyInstitutionSexOffense(), submissionRequest: 'no_submit' }), false)
assert.equal(shouldShowSexOffenseInquiry(emptyInstitutionSexOffense()), false)

const noSubmitAnswers = buildSubmitAnswers({ submissionRequest: 'no_submit' })
assert.equal(INQUIRY in noSubmitAnswers, false)
assert.deepEqual(noSubmitAnswers[SUBMISSION], { submissionRequest: 'no_submit' })
assert.equal(GUIDANCE in noSubmitAnswers, false)
assert.deepEqual(noSubmitAnswers[SCHEDULE] ?? [], [])

const leftoverStripped = omitSexOffenseInquiryAnswersIfNotRequested({
  [SUBMISSION]: { submissionRequest: 'no_submit' },
  [INQUIRY]: {},
  keep: 'x',
})
assert.equal(INQUIRY in leftoverStripped, false)
assert.equal(leftoverStripped.keep, 'x')

const leftoverNull = omitSexOffenseInquiryAnswersIfNotRequested({
  [SUBMISSION]: { submissionRequest: 'no_submit' },
  [INQUIRY]: null,
})
assert.equal(INQUIRY in leftoverNull, false)

const requestIncomplete = findIncompleteSexOffenseMessage(emptyInstitutionSexOffense())
assert.ok(requestIncomplete)

const requestJaSystem = {
  ...emptyInstitutionSexOffense(),
  submissionRequest: 'request' as const,
  inquiryMethod: 'ja_system' as const,
}
assert.equal(findIncompleteSexOffenseMessage(requestJaSystem), null)
assert.deepEqual(sexOffenseInquiryAnswerFromValues(requestJaSystem), {
  inquiryMethod: 'ja_system',
})

const requestComplete = {
  ...emptyInstitutionSexOffense(),
  submissionRequest: 'request' as const,
  inquiryMethod: 'criminal_record_site' as const,
  siteSubmission: 'online' as const,
  institutionId: 'id1',
  verificationNumber: 'v1',
}
assert.equal(findIncompleteSexOffenseMessage(requestComplete), null)
assert.equal(shouldShowSexOffenseInquiry(requestComplete), true)

const requestDirect = {
  ...requestComplete,
  siteSubmission: 'direct' as const,
}
assert.equal(findIncompleteSexOffenseMessage(requestDirect), null)
assert.deepEqual(sexOffenseInquiryAnswerFromValues(requestDirect), {
  inquiryMethod: 'criminal_record_site',
  siteSubmission: 'direct',
  institutionId: 'id1',
  verificationNumber: 'v1',
})

const switchedToJa = applySexOffenseInquiryMethodChange(requestComplete, 'ja_system')
assert.equal(switchedToJa.inquiryMethod, 'ja_system')
assert.equal(switchedToJa.siteSubmission, '')
assert.equal(switchedToJa.institutionId, '')
assert.deepEqual(sexOffenseInquiryAnswerFromValues(switchedToJa), {
  inquiryMethod: 'ja_system',
})
const backToSite = applySexOffenseInquiryMethodChange(switchedToJa, 'criminal_record_site')
assert.equal(backToSite.siteSubmission, 'direct')
assert.equal(backToSite.institutionId, '')
assert.equal(
  formatSexOffenseTeacherGuidanceValue(requestJaSystem),
  '기관이 JA 시스템 내에서 동의서 확인 후 직접 조회',
)
assert.equal(
  formatSexOffenseTeacherGuidanceValue(requestDirect),
  '직접 제출 | ID : id1 | 검증번호 : v1',
)
assert.equal(
  formatSexOffenseTeacherGuidanceValue(requestComplete),
  '온라인 제출 | ID : id1 | 검증번호 : v1',
)

const requestAnswers = buildSubmitAnswers({
  submissionRequest: 'request',
  includeInquiry: true,
})
assert.equal(INQUIRY in requestAnswers, true)
assert.deepEqual(requestAnswers[INQUIRY], {
  inquiryMethod: 'criminal_record_site',
  siteSubmission: 'online',
  institutionId: 'id1',
  verificationNumber: 'v1',
})

const switchedOff = omitSexOffenseInquiryAnswersIfNotRequested({
  [SUBMISSION]: { submissionRequest: 'no_submit' },
  [INQUIRY]: sexOffenseInquiryAnswerFromValues(requestComplete),
})
assert.equal(INQUIRY in switchedOff, false)

const restoredNoSubmit = sexOffenseValuesFromDraftAnswers(
  { submissionRequest: 'no_submit' },
  { institutionId: 'stale', verificationNumber: 'stale', siteSubmission: 'online' },
)
assert.ok(restoredNoSubmit)
assert.equal(restoredNoSubmit.submissionRequest, 'no_submit')
assert.equal(shouldShowSexOffenseInquiry(restoredNoSubmit), false)
assert.equal(restoredNoSubmit.institutionId, '')

const restoredJaSystem = sexOffenseValuesFromDraftAnswers(
  { submissionRequest: 'request' },
  {
    inquiryMethod: 'ja_system',
    institutionId: 'stale',
    verificationNumber: 'stale',
    siteSubmission: 'online',
  },
)
assert.ok(restoredJaSystem)
assert.equal(restoredJaSystem.inquiryMethod, 'ja_system')
assert.equal(restoredJaSystem.siteSubmission, '')
assert.equal(restoredJaSystem.institutionId, '')
assert.equal(restoredJaSystem.verificationNumber, '')

const economyStripped = omitSexOffenseInquiryAnswersIfNotRequested({
  [ECONOMY_SUBMISSION]: { submissionRequest: 'no_submit' },
  [ECONOMY_INQUIRY]: {},
})
assert.equal(ECONOMY_INQUIRY in economyStripped, false)

const paragraphConditionals = collectRuntimeConditionalQuestions(inquiryForm)
assert.equal(paragraphConditionals.some(item => item.questionKey === INQUIRY), true)
const hiddenInquiry = omitRuntimeHiddenAnswers(
  {
    [SUBMISSION]: { submissionRequest: 'no_submit' },
    [INQUIRY]: { inquiryMethod: 'criminal_record_site' },
  },
  new Set(),
  paragraphConditionals,
)
assert.equal(INQUIRY in hiddenInquiry, false)

assert.equal(resolveUjatSexOffenseWriteChoice(emptyInstitutionSexOffense()), '')
assert.ok(findIncompleteUjatSexOffenseWriteMessage(emptyInstitutionSexOffense()))

const ujatDirect = applyUjatSexOffenseWriteChoice(emptyInstitutionSexOffense(), 'direct')
assert.equal(resolveUjatSexOffenseWriteChoice(ujatDirect), 'direct')
assert.equal(ujatDirect.inquiryMethod, 'ja_system')
assert.equal(ujatDirect.siteSubmission, '')
assert.equal(findIncompleteUjatSexOffenseWriteMessage(ujatDirect), null)
assert.deepEqual(sexOffenseInquiryAnswerFromValues(ujatDirect), { inquiryMethod: 'ja_system' })
assert.equal(
  formatSexOffenseTeacherGuidanceValue(ujatDirect),
  '기관이 JA 시스템 내에서 동의서 확인 후 직접 조회',
)

const ujatOnlineIncomplete = applyUjatSexOffenseWriteChoice(emptyInstitutionSexOffense(), 'online')
assert.equal(resolveUjatSexOffenseWriteChoice(ujatOnlineIncomplete), 'online')
assert.ok(findIncompleteUjatSexOffenseWriteMessage(ujatOnlineIncomplete))
const ujatOnline = {
  ...ujatOnlineIncomplete,
  institutionId: 'org-a',
  verificationNumber: 'v-1',
}
assert.equal(findIncompleteUjatSexOffenseWriteMessage(ujatOnline), null)
assert.deepEqual(sexOffenseInquiryAnswerFromValues(ujatOnline), {
  inquiryMethod: 'criminal_record_site',
  siteSubmission: 'online',
  institutionId: 'org-a',
  verificationNumber: 'v-1',
})
assert.equal(
  formatSexOffenseTeacherGuidanceValue(ujatOnline),
  '온라인 제출 | ID : org-a | 검증번호 : v-1',
)

const legacySiteDirect = normalizeUjatSexOffenseWriteValues({
  ...emptyInstitutionSexOffense(),
  submissionRequest: 'request',
  inquiryMethod: 'criminal_record_site',
  siteSubmission: 'direct',
  institutionId: 'legacy',
  verificationNumber: 'legacy-v',
})
assert.equal(legacySiteDirect.inquiryMethod, 'ja_system')
assert.equal(legacySiteDirect.siteSubmission, '')
assert.equal(legacySiteDirect.institutionId, '')

console.log('apply-institution-sex-offense.selfcheck: ok')
