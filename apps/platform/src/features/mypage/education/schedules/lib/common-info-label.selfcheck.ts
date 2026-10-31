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

// 일정형 사전교육 블록: scheduleName 이 null 이어도 「사전교육」
assert.equal(
  resolveEducationScheduleRowLabel({ educationStructure: 'SCHEDULE', blockKind: 'PRE_EDUCATION' }),
  '사전교육',
)
assert.equal(
  resolveEducationScheduleRowLabel({
    educationStructure: 'SCHEDULE',
    blockKind: 'PRE_EDUCATION',
    scheduleName: '오리엔테이션',
  }),
  '오리엔테이션',
)
assert.equal(
  resolveEducationScheduleRowLabel({ educationStructure: 'SCHEDULE', blockKind: 'SUB' }),
  EDUCATION_SCHEDULE_EMPTY_LABEL,
)
// 일정형: scheduleName 이 없으면 title(CMS 일정명)
assert.equal(
  resolveEducationScheduleRowLabel({ educationStructure: 'SCHEDULE', blockKind: 'SUB', title: '팀일정111' }),
  '팀일정111',
)
assert.equal(
  resolveEducationScheduleRowLabel({
    educationStructure: 'SCHEDULE',
    blockKind: 'SUB',
    scheduleName: '개회식',
    title: '팀일정111',
  }),
  '개회식',
)
// 사전교육은 title 보다 「사전교육」 표기 우선
assert.equal(
  resolveEducationScheduleRowLabel({ educationStructure: 'SCHEDULE', blockKind: 'PRE_EDUCATION', title: '사전 교육' }),
  '사전교육',
)
// 커리큘럼형은 blockKind 를 쓰지 않는다
assert.equal(
  resolveEducationScheduleRowLabel({ educationStructure: 'CURRICULUM', blockKind: 'PRE_EDUCATION' }),
  EDUCATION_SCHEDULE_EMPTY_LABEL,
)

console.log('common-info-label.selfcheck: ok')
