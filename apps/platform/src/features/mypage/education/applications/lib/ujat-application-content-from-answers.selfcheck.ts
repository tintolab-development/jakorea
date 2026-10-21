import assert from 'node:assert/strict'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'
import {
  buildUjatApplicationContentFromPortal,
  hasUjatApplicationContent,
} from './ujat-application-content-from-answers.ts'
import { shouldUseUjatApplicationContent } from './ujat-portal-banner.ts'

const ujatBasic = UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo
const ujatGrade = UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo
const ujatClassTime = UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime
const ujatSchedule = UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule
const generalBasic = PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo

assert.equal(shouldUseUjatApplicationContent('ujat-participant'), true)
assert.equal(shouldUseUjatApplicationContent('general'), false)

const empty = buildUjatApplicationContentFromPortal({ answers: {} })
assert.equal(empty, undefined)

const fromBlocks = buildUjatApplicationContentFromPortal({
  preferredScheduleBlocks: [{ date: '2026-04-20' }, { dateText: '2026-04-27' }],
})
assert.ok(fromBlocks)
assert.deepEqual(fromBlocks!.preferredDates, ['2026년 4월 20일(월)', '2026년 4월 27일(월)'])

const fromAnswersOnly = buildUjatApplicationContentFromPortal({
  preferredScheduleBlocks: [],
  answers: {
    [ujatSchedule]: ['2026-05-04', '2026-05-11'],
  },
})
assert.deepEqual(fromAnswersOnly!.preferredDates, ['2026년 5월 4일(월)', '2026년 5월 11일(월)'])

const blocksWinOverAnswers = buildUjatApplicationContentFromPortal({
  preferredScheduleBlocks: [{ date: '2026-04-20' }],
  answers: { [ujatSchedule]: ['2026-05-04'] },
})
assert.deepEqual(blocksWinOverAnswers!.preferredDates, ['2026년 4월 20일(월)'])

const institution = buildUjatApplicationContentFromPortal({
  answers: {
    [ujatBasic]: {
      schoolName: 'UJAT초등학교',
      regionLabel: '인천광역시 연수구',
      addressDetail: '교무실',
      teacherName: '김교사',
      teacherTel: '032-111-2222',
      teacherMobile: '010-1111-2222',
      teacherEmail: 'ujat@test.com',
      otherRequests: '주차 안내',
    },
    [generalBasic]: {
      schoolName: '일반기관',
      regionLabel: '서울',
      addressDetail: '본관',
      teacherName: '다른교사',
      teacherTel: '02-000-0000',
      teacherMobile: '010-0000-0000',
      teacherEmail: 'other@test.com',
      otherRequests: '일반 요청',
    },
  },
})
assert.equal(institution!.institution.name, 'UJAT초등학교')
assert.equal(institution!.institution.address, '인천광역시 연수구')
assert.equal(institution!.institution.addressDetail, '교무실')
assert.equal(
  institution!.institution.teacherContact,
  '김교사 | 032-111-2222 | 010-1111-2222 | ujat@test.com',
)
assert.equal(institution!.institution.otherRequests, '주차 안내')

const gradeBlocks = buildUjatApplicationContentFromPortal({
  answers: {
    [ujatGrade]: [
      {
        gradeLabel: '1',
        classCount: 6,
        classes: [
          { classNo: 1, studentCount: 28 },
          { classNo: 2, studentCount: 27 },
        ],
      },
    ],
  },
})
assert.equal(gradeBlocks!.gradeBlocks[0]?.gradeLabel, '1학년')
assert.equal(gradeBlocks!.gradeBlocks[0]?.classCountLabel, '6학급')
assert.equal(gradeBlocks!.gradeBlocks[0]?.classesLabel, '1반 28명, 2반 27명')

const overlayGrades = buildUjatApplicationContentFromPortal({
  answers: {
    [ujatGrade]: {
      'ujatApplication.applicationGradeByBlockId': { a: '2' },
      'ujatApplication.gradeDetailByBlock': {
        a: {
          classCountInput: '3',
          classNoByIndex: { 0: '1', 1: '3' },
          studentCountByIndex: { 0: '24', 1: '25' },
        },
      },
    },
  },
})
assert.equal(overlayGrades!.gradeBlocks[0]?.gradeLabel, '2학년')
assert.equal(overlayGrades!.gradeBlocks[0]?.classCountLabel, '3학급')
assert.equal(overlayGrades!.gradeBlocks[0]?.classesLabel, '1반 24명, 3반 25명')

const classTimes = buildUjatApplicationContentFromPortal({
  answers: {
    [ujatClassTime]: [
      {
        gradeRangeLabel: '1,2',
        periods: ['09:00~09:40', '', '10:30~11:10', ''],
      },
    ],
  },
})
assert.equal(classTimes!.classTimeBlocks[0]?.gradeRangeLabel, '1학년, 2학년')
assert.deepEqual(classTimes!.classTimeBlocks[0]?.periods, [
  { periodLabel: '1교시', timeLabel: '09:00~09:40' },
  { periodLabel: '3교시', timeLabel: '10:30~11:10' },
])

const overlayClassTimes = buildUjatApplicationContentFromPortal({
  answers: {
    [ujatClassTime]: {
      'ujatApplication.classTimeCheckedByBlock': { b: { '1': true, '2': true } },
      'ujatApplication.classTimePeriodsByBlock': {
        b: {
          '1': { start: '09:00', end: '09:40' },
          '2': { start: '09:50', end: '10:30' },
        },
      },
    },
  },
})
assert.equal(overlayClassTimes!.classTimeBlocks[0]?.gradeRangeLabel, '1학년, 2학년')
assert.equal(overlayClassTimes!.classTimeBlocks[0]?.periods[0]?.periodLabel, '1교시')
assert.equal(overlayClassTimes!.classTimeBlocks[0]?.periods[0]?.timeLabel, '09:00~09:40')

const dashes = buildUjatApplicationContentFromPortal({
  answers: {
    [ujatBasic]: {
      schoolName: '',
      regionLabel: '',
    },
  },
})
assert.equal(dashes, undefined)

const mappedContent = buildUjatApplicationContentFromPortal({
  answers: {
    [ujatBasic]: { schoolName: '매핑학교', regionLabel: '대전' },
    [generalBasic]: { schoolName: '일반학교', regionLabel: '서울' },
  },
  preferredScheduleBlocks: [{ date: '2026-04-20' }],
})
assert.equal(mappedContent?.institution.name, '매핑학교')
assert.notEqual(mappedContent?.institution.name, '일반학교')
assert.deepEqual(mappedContent?.preferredDates, ['2026년 4월 20일(월)'])
assert.equal(hasUjatApplicationContent(mappedContent), true)

assert.equal(
  buildUjatApplicationContentFromPortal({
    answers: { [generalBasic]: { schoolName: '일반학교', regionLabel: '서울' } },
  }),
  undefined,
)

console.log('ujat-application-content-from-answers.selfcheck: ok')
