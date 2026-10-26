import assert from 'node:assert/strict'
import {
  EDUCATION_SCHEDULE_EMPTY_LABEL,
  resolveEducationScheduleCommonInfoLabel,
  resolveEducationScheduleRowLabel,
} from './common-info-label.ts'

const curriculumSingle = {
  educationStructure: 'CURRICULUM' as const,
  sessionRound: 'SINGLE' as const,
}

assert.equal(
  resolveEducationScheduleCommonInfoLabel({
    ...curriculumSingle,
    title: '공통 교육 예정 2',
    unitName: '필요와 욕구',
  }),
  '필요와 욕구',
)

assert.equal(
  resolveEducationScheduleCommonInfoLabel({
    ...curriculumSingle,
    title: '도입',
  }),
  '도입',
)

assert.equal(
  resolveEducationScheduleCommonInfoLabel({
    ...curriculumSingle,
    title: '공통 교육 예정 2',
    sessionLabel: '1차시',
  }),
  EDUCATION_SCHEDULE_EMPTY_LABEL,
)

const curriculumMulti = {
  educationStructure: 'CURRICULUM' as const,
  sessionRound: 'MULTI' as const,
}

assert.equal(
  resolveEducationScheduleCommonInfoLabel({
    ...curriculumMulti,
    title: '1',
    sessionLabel: '1회차',
  }),
  '1차시',
)

assert.equal(
  resolveEducationScheduleCommonInfoLabel({
    ...curriculumMulti,
    title: '공통 교육 예정 2',
    unitName: '3차시',
    sessionLabel: '1회차',
  }),
  '3차시',
)

assert.equal(
  resolveEducationScheduleCommonInfoLabel({
    ...curriculumMulti,
    title: '공통 교육 예정 2',
    sessionLabel: '1회차',
  }),
  EDUCATION_SCHEDULE_EMPTY_LABEL,
)

const scheduleType = {
  educationStructure: 'SCHEDULE' as const,
  sessionRound: 'MULTI' as const,
}

assert.equal(
  resolveEducationScheduleCommonInfoLabel({
    ...scheduleType,
    title: '공통 교육 예정 2',
    scheduleName: '개회식',
  }),
  '개회식',
)

assert.equal(
  resolveEducationScheduleCommonInfoLabel({
    educationStructure: 'SCHEDULE',
    sessionRound: 'SINGLE',
    title: '공통 교육 예정',
  }),
  EDUCATION_SCHEDULE_EMPTY_LABEL,
)

assert.equal(
  resolveEducationScheduleCommonInfoLabel({
    title: '공통 교육 예정 2',
  }),
  EDUCATION_SCHEDULE_EMPTY_LABEL,
)

assert.equal(
  resolveEducationScheduleCommonInfoLabel({
    unitName: '단원 A',
    title: '공통 교육 예정 1',
  }),
  '단원 A',
)

assert.equal(
  resolveEducationScheduleCommonInfoLabel({
    scheduleName: '폐회식',
    title: '공통 교육 예정 1',
  }),
  '폐회식',
)

assert.equal(
  resolveEducationScheduleRowLabel({
    educationStructure: 'CURRICULUM',
    sessionLabel: '2회차',
    scheduleName: '오리엔테이션',
  }),
  '2회차',
)
assert.equal(
  resolveEducationScheduleRowLabel({ educationStructure: 'CURRICULUM', scheduleName: '오리엔테이션' }),
  EDUCATION_SCHEDULE_EMPTY_LABEL,
)
assert.equal(
  resolveEducationScheduleRowLabel({
    educationStructure: 'SCHEDULE',
    sessionLabel: '1회차',
    scheduleName: '오리엔테이션',
  }),
  '오리엔테이션',
)
assert.equal(
  resolveEducationScheduleRowLabel({ educationStructure: 'SCHEDULE', sessionLabel: '1회차' }),
  EDUCATION_SCHEDULE_EMPTY_LABEL,
)
assert.equal(resolveEducationScheduleRowLabel({}), EDUCATION_SCHEDULE_EMPTY_LABEL)

console.log('common-info-label.selfcheck: ok')
