import assert from 'node:assert/strict'
import {
  basicInfoAnswerFromValues,
  basicInfoValuesFromDraftAnswer,
  emptyTrainedTeachersBasicInfo,
  normalizePortalEducationFormat,
} from './apply-trained-teachers-basic-info-answers.ts'

const base = {
  ...emptyTrainedTeachersBasicInfo(),
  schoolName: '진월초등학교',
  regionLabel: '광주광역시 남구',
  applicationGrade: '3',
  addressDetail: '교무실',
  classCount: '2',
  studentCount: '40',
  educationPlace: 'inside',
  educationPlaceDetail: '교실',
}

assert.equal(emptyTrainedTeachersBasicInfo().educationFormat, '')
assert.equal(normalizePortalEducationFormat('online'), 'online')
assert.equal(normalizePortalEducationFormat(' ONLINE '), 'online')
assert.equal(normalizePortalEducationFormat('ONLINE'), 'online')
assert.equal(normalizePortalEducationFormat('invalid'), '')
assert.equal(normalizePortalEducationFormat(null), '')

const onlineAnswer = basicInfoAnswerFromValues(
  { ...base, educationFormat: 'online' },
  { includePreferredEducationFields: true },
)
assert.equal(onlineAnswer?.educationFormat, 'online')
assert.equal(onlineAnswer?.educationPlace, 'inside')
assert.equal(onlineAnswer?.educationPlaceDetail, '교실')

const unselectedAnswer = basicInfoAnswerFromValues(
  { ...base, educationFormat: '' },
  { includePreferredEducationFields: true },
)
assert.equal('educationFormat' in (unselectedAnswer ?? {}), false)

const hiddenAnswer = basicInfoAnswerFromValues(
  { ...base, educationFormat: '' },
  {
    includePreferredEducationFields: false,
    existingAnswer: {
      educationFormat: 'hybrid',
      educationPlace: 'outside',
      educationPlaceDetail: '강당',
    },
  },
)
assert.equal(hiddenAnswer?.educationFormat, 'hybrid')
assert.equal(hiddenAnswer?.educationPlace, 'outside')
assert.equal(hiddenAnswer?.educationPlaceDetail, '강당')

const draftValues = basicInfoValuesFromDraftAnswer({
  ...base,
  educationFormat: undefined,
})
assert.equal(draftValues?.educationFormat, '')

const uppercaseDraftValues = basicInfoValuesFromDraftAnswer({
  ...base,
  educationFormat: 'OFFLINE',
})
assert.equal(uppercaseDraftValues?.educationFormat, 'offline')

console.log('apply-trained-teachers-basic-info-answers.selfcheck: ok')
