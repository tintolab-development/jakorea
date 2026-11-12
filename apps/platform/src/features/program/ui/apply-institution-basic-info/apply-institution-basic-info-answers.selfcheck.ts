import assert from 'node:assert/strict'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import { resolveApplicationAnswerKey } from '../../lib/application-answer-key.ts'
import {
  PORTAL_EDUCATION_PLACE_OPTIONS,
  basicInfoAnswerFromValues,
  basicInfoValuesFromDraftAnswer,
  emptyInstitutionBasicInfo,
  normalizePortalEducationFormat,
} from './apply-institution-basic-info-answers.ts'

const base = {
  ...emptyInstitutionBasicInfo(),
  schoolName: '진월초등학교',
  regionLabel: '광주광역시 남구',
  applicationGrade: '3',
  addressDetail: '교무실',
  classCount: '2',
  studentCount: '40',
  educationPlace: 'inside',
  educationPlaceDetail: '교실',
}

assert.equal(emptyInstitutionBasicInfo().educationFormat, '')
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

// 교육받은 교사·1사1교 — 교육 장소 행이 보이면 희망 교육 형태가 숨겨져도 화면 값을 보낸다
const placeShownAnswer = basicInfoAnswerFromValues(
  { ...base, educationFormat: '', educationPlace: 'outside', educationPlaceDetail: '강당' },
  {
    includePreferredEducationFields: false,
    includeEducationPlaceFields: true,
    existingAnswer: { educationPlace: 'inside', educationPlaceDetail: '교실' },
  },
)
assert.equal('educationFormat' in (placeShownAnswer ?? {}), false)
assert.equal(placeShownAnswer?.educationPlace, 'outside')
assert.equal(placeShownAnswer?.educationPlaceDetail, '강당')

// 교육 장소 행이 없는 일반 기관 — 희망 교육 형태 숨김이면 장소를 보내지 않는다(기존 동작)
const placeHiddenAnswer = basicInfoAnswerFromValues(
  { ...base, educationFormat: '' },
  { includePreferredEducationFields: false, includeEducationPlaceFields: false },
)
assert.equal('educationPlace' in (placeHiddenAnswer ?? {}), false)
assert.equal('educationPlaceDetail' in (placeHiddenAnswer ?? {}), false)

// 교육받은 교사 — BE는 answers["program-application-trained-teachers-seed-basic-info"].educationPlace(Detail)만 읽는다.
// 제출부(page.tsx)는 overrides[resolveApplicationAnswerKey(basicParagraph)] = basicAnswer 로 문단 객체 안에 넣는다.
assert.deepEqual(
  PORTAL_EDUCATION_PLACE_OPTIONS.map(option => option.value),
  ['inside', 'outside', 'custom'],
)
const ttBasicKey = resolveApplicationAnswerKey({
  id: PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo,
})
assert.equal(ttBasicKey, 'program-application-trained-teachers-seed-basic-info')
const ttAnswers: Record<string, unknown> = {
  [ttBasicKey]: basicInfoAnswerFromValues(
    { ...base, educationFormat: '', educationPlace: 'custom', educationPlaceDetail: '시청 회의실' },
    { includePreferredEducationFields: false, includeEducationPlaceFields: true },
  ),
}
const ttBasicAnswer = ttAnswers['program-application-trained-teachers-seed-basic-info'] as
  | Record<string, unknown>
  | undefined
assert.equal(ttBasicAnswer?.educationPlace, 'custom')
assert.equal(ttBasicAnswer?.educationPlaceDetail, '시청 회의실')
assert.equal('educationPlace' in ttAnswers, false)

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

console.log('apply-institution-basic-info-answers.selfcheck: ok')
