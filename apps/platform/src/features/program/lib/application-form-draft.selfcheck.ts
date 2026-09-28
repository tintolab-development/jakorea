/**
 * application-form-draft — Portal form → WritingFormDraft / answers
 */
import assert from 'node:assert/strict'
import {
  buildApplicationAnswersFromDraft,
  coerceApplicationFormDocument,
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

console.log('application-form-draft.selfcheck: ok')
