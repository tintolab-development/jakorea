import assert from 'node:assert/strict'
import {
  hasEducationFormatSystemField,
  isEducationFormatErrorField,
  readPreferredEducationFormChoice,
  shouldShowPreferredEducationForm,
} from './application-education-format-policy.ts'

const withEducationFormat = {
  paragraphs: [{ id: 'basic-info', systemFieldKeys: ['educationFormat'] }],
}
const withoutEducationFormat = {
  paragraphs: [{ id: 'basic-info', systemFieldKeys: [] }],
}

assert.equal(hasEducationFormatSystemField(withEducationFormat), true)
assert.equal(hasEducationFormatSystemField(withoutEducationFormat), false)
assert.equal(readPreferredEducationFormChoice({ showEducationFormChoice: true }), true)
assert.equal(readPreferredEducationFormChoice({ showEducationFormChoice: false }), false)
assert.equal(readPreferredEducationFormChoice({}), null)

assert.equal(
  shouldShowPreferredEducationForm({
    formDocument: withEducationFormat,
    runtimeContext: { showEducationFormChoice: true },
  }),
  true,
)
assert.equal(
  shouldShowPreferredEducationForm({
    formDocument: withEducationFormat,
    runtimeContext: { showEducationFormChoice: false },
    legacyEducationForm: 'participant_choice',
  }),
  false,
)
assert.equal(
  shouldShowPreferredEducationForm({
    formDocument: withEducationFormat,
    runtimeContext: {},
    legacyEducationForm: 'participant_choice',
  }),
  true,
)
assert.equal(
  shouldShowPreferredEducationForm({
    formDocument: withoutEducationFormat,
    runtimeContext: { showEducationFormChoice: true },
    legacyEducationForm: 'participant_choice',
  }),
  false,
)
assert.equal(isEducationFormatErrorField('educationFormat'), true)
assert.equal(isEducationFormatErrorField('answers.educationFormat'), true)
assert.equal(isEducationFormatErrorField('applicationReason'), false)

console.log('application-education-format-policy.selfcheck: ok')
