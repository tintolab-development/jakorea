import assert from 'node:assert/strict'
import { applyAgreementNoticeSubjectMemberName } from '../../dist/consent/apply-agreement-notice-subject-member-name.js'
import {
  formatMemberConsentIncompleteRequiredAlertMessage,
  hasMemberConsentIncompleteRequiredFields,
  listMemberConsentIncompleteRequiredFields,
} from '../../dist/consent/member-consent-validation.js'
import { normalizeMemberConsentWriteDraft } from '../../dist/consent/normalize-member-consent-write-draft.js'
import type { WritingFormDraft } from '../../dist/writing-form/index.js'

const SUBJECT_PARAGRAPH_ID = 'agreement-notice-subject'
const NAME_FIELD_ID = 'agreement-notice-subj-name'
const BIRTH_FIELD_ID = 'agreement-notice-subj-birth'
const PHONE_FIELD_ID = 'agreement-notice-subj-phone'

function createNoticeWriteDraft(values: { name?: string; birth?: string; phone?: string } = {}): WritingFormDraft {
  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      {
        id: SUBJECT_PARAGRAPH_ID,
        kind: 'single_item',
        variant: 'short_essay',
        requiredMark: true,
        paragraphTitle: '대상자 본인',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        answerRequired: true,
        showItemTitle: true,
        itemInputRows: 1,
        items: [
          {
            id: NAME_FIELD_ID,
            label: '성명',
            placeholder: '성명',
            bodyText: values.name ?? '',
          },
          {
            id: BIRTH_FIELD_ID,
            label: '생년월일',
            placeholder: '생년월일',
            bodyText: values.birth ?? '',
          },
          {
            id: PHONE_FIELD_ID,
            label: '전화번호',
            placeholder: '전화번호',
            bodyText: values.phone ?? '',
          },
        ],
        bodyPlaceholder: '답변을 입력해 주세요',
        bodyText: '',
      },
    ],
  }
}

function readSubjectItem(draft: WritingFormDraft, itemId: string) {
  const paragraph = draft.paragraphs.find(item => item.id === SUBJECT_PARAGRAPH_ID)
  if (
    paragraph == null ||
    paragraph.kind !== 'single_item' ||
    paragraph.variant !== 'short_essay'
  ) {
    throw new Error('subject paragraph missing')
  }
  return paragraph.items?.find(item => item.id === itemId)
}

const emptyWriteDraft = normalizeMemberConsentWriteDraft(
  createNoticeWriteDraft({ name: '미리보기', birth: '미리보기', phone: '미리보기' }),
  'agreement-notice'
)

assert.equal(readSubjectItem(emptyWriteDraft, NAME_FIELD_ID)?.bodyText, '')
assert.equal(readSubjectItem(emptyWriteDraft, BIRTH_FIELD_ID)?.bodyText, '')
assert.equal(readSubjectItem(emptyWriteDraft, PHONE_FIELD_ID)?.bodyText, '')

const emptyFields = listMemberConsentIncompleteRequiredFields(emptyWriteDraft, {
  templateId: 'agreement-notice',
})
assert.deepEqual(
  emptyFields.filter(field => field.paragraphId === SUBJECT_PARAGRAPH_ID).map(field => field.fieldId),
  [NAME_FIELD_ID, BIRTH_FIELD_ID, PHONE_FIELD_ID]
)

const lockedNameOnly = applyAgreementNoticeSubjectMemberName(emptyWriteDraft, '홍길동')
assert.equal(readSubjectItem(lockedNameOnly, NAME_FIELD_ID)?.bodyText, '홍길동')
assert.equal(applyAgreementNoticeSubjectMemberName(lockedNameOnly, '홍길동'), lockedNameOnly)

const lockedNameFields = listMemberConsentIncompleteRequiredFields(lockedNameOnly, {
  templateId: 'agreement-notice',
})
assert.equal(lockedNameFields.some(field => field.fieldId === NAME_FIELD_ID), false)
assert.deepEqual(
  lockedNameFields.filter(field => field.paragraphId === SUBJECT_PARAGRAPH_ID).map(field => field.fieldId),
  [BIRTH_FIELD_ID, PHONE_FIELD_ID]
)

const displayFilledButNameEmpty = createNoticeWriteDraft({
  name: '',
  birth: '1990.01.01',
  phone: '010-1234-5678',
})
assert.equal(
  hasMemberConsentIncompleteRequiredFields(displayFilledButNameEmpty, {
    templateId: 'agreement-notice',
  }),
  true
)
assert.deepEqual(
  listMemberConsentIncompleteRequiredFields(displayFilledButNameEmpty, {
    templateId: 'agreement-notice',
  })
    .filter(field => field.paragraphId === SUBJECT_PARAGRAPH_ID)
    .map(field => field.fieldId),
  [NAME_FIELD_ID]
)
assert.equal(
  formatMemberConsentIncompleteRequiredAlertMessage(
    listMemberConsentIncompleteRequiredFields(displayFilledButNameEmpty, {
      templateId: 'agreement-notice',
    }).filter(field => field.paragraphId === SUBJECT_PARAGRAPH_ID)
  ),
  '성명 항목을 작성해 주세요.'
)

const complete = applyAgreementNoticeSubjectMemberName(displayFilledButNameEmpty, '홍길동')
assert.equal(
  hasMemberConsentIncompleteRequiredFields(complete, { templateId: 'agreement-notice' }),
  false
)

const afterServerReplace = applyAgreementNoticeSubjectMemberName(
  createNoticeWriteDraft({
    name: '',
    birth: '1990.01.01',
    phone: '010-1234-5678',
  }),
  '홍길동'
)
assert.equal(readSubjectItem(afterServerReplace, NAME_FIELD_ID)?.bodyText, '홍길동')
assert.equal(
  hasMemberConsentIncompleteRequiredFields(afterServerReplace, { templateId: 'agreement-notice' }),
  false
)

console.log('apply-agreement-notice-subject-member-name.test.ts ok')
