import assert from 'node:assert/strict'
import {
  buildInProgressDetailTabItems,
  buildTeacherInProgressDetailTabItems,
  buildTeacherWithdrawnDuringDetailTabItems,
  buildWithdrawnDuringDetailTabItems,
  EDUCATION_ACTIVITY_SCHEDULE_TAB_LABEL,
  INSTRUCTOR_ASSIGNMENT_TAB_LABEL,
  UJAT_PARTICIPANT_ASSIGNMENT_TAB_LABEL,
  resolveVolunteerActivityDetailCase,
  shouldShowSettlementTab,
} from './detail-tabs.ts'
import { hasTeacherAssignmentAsideContent } from '../model/types.ts'

const options = {
  detailCase: 'general' as const,
  programType: 'GENERAL_ORGANIZATION',
  surveyConfigured: true,
  satisfactionConfigured: true,
}

const schoolTeacherOptions = { ...options, schoolTeacherMember: true }
const instructorDualOptions = { ...options, schoolTeacherMember: false }

const general = buildInProgressDetailTabItems(options)
assert.deepEqual(
  general.map(item => item.key),
  ['notice', 'schedule', 'survey', 'satisfaction', 'settlement'],
)

const instructorWithAssignments = buildInProgressDetailTabItems({
  ...options,
  detailCase: 'instructor',
  lectureReportVisible: true,
  instructorAssignmentVisible: true,
})
assert.deepEqual(
  instructorWithAssignments.map(item => item.key),
  ['schedule', 'notice', 'lecture-report', 'settlement'],
)
assert.deepEqual(
  instructorWithAssignments.map(item => item.label),
  ['배정 현황', '안내사항', '강의보고서', '정산 현황'],
)
assert.equal(instructorWithAssignments[0]?.label, INSTRUCTOR_ASSIGNMENT_TAB_LABEL)

assert.equal(resolveVolunteerActivityDetailCase('general'), 'volunteer')
assert.equal(resolveVolunteerActivityDetailCase('volunteer'), 'volunteer')
assert.equal(resolveVolunteerActivityDetailCase('ujat-volunteer'), 'ujat-volunteer')

const ujatVolunteerTabs = buildInProgressDetailTabItems({
  detailCase: resolveVolunteerActivityDetailCase('ujat-volunteer'),
  surveyConfigured: true,
  satisfactionConfigured: true,
})
assert.equal(
  ujatVolunteerTabs.find(item => item.key === 'schedule')?.label,
  '배정 및 출결 현황',
)
const ujatVolunteerWithdrawnTabs = buildWithdrawnDuringDetailTabItems({
  detailCase: 'ujat-volunteer',
  surveyConfigured: true,
  satisfactionConfigured: true,
})
assert.ok(!ujatVolunteerWithdrawnTabs.some(item => item.key === 'notice'))
assert.equal(
  ujatVolunteerWithdrawnTabs.find(item => item.key === 'schedule')?.label,
  '배정 및 출결 현황',
)
assert.equal(resolveVolunteerActivityDetailCase(undefined), 'volunteer')

const volunteerTabs = buildInProgressDetailTabItems({
  detailCase: resolveVolunteerActivityDetailCase('general'),
  surveyConfigured: true,
  satisfactionConfigured: true,
})
assert.deepEqual(
  volunteerTabs.map(item => item.label),
  ['안내사항', '배정현황', '설문조사', '만족도조사', '정산현황'],
)

const teacher = buildTeacherInProgressDetailTabItems(schoolTeacherOptions)
assert.deepEqual(
  teacher.map(item => item.key),
  ['notice', 'schedule', 'students', 'survey', 'satisfaction'],
)

const instructorDualEducation = buildTeacherInProgressDetailTabItems(instructorDualOptions)
assert.deepEqual(
  instructorDualEducation.map(item => item.key),
  ['notice', 'schedule', 'students', 'survey', 'satisfaction', 'settlement'],
)

const trainedTeacher = buildTeacherInProgressDetailTabItems({
  ...schoolTeacherOptions,
  programType: 'TRAINED_TEACHER',
})
assert.deepEqual(
  trainedTeacher.map(item => item.key),
  ['notice', 'schedule', 'students', 'survey', 'satisfaction'],
)

const teacherWithJournal = buildTeacherInProgressDetailTabItems({
  ...schoolTeacherOptions,
  educationJournalEnabled: true,
})
assert.deepEqual(
  teacherWithJournal.map(item => item.key),
  ['educationJournal', 'schedule', 'students', 'survey', 'satisfaction'],
)

const trainedTeacherWithJournal = buildTeacherInProgressDetailTabItems({
  ...schoolTeacherOptions,
  programType: 'TRAINED_TEACHER',
  educationJournalEnabled: true,
})
assert.deepEqual(
  trainedTeacherWithJournal.map(item => item.key),
  ['educationJournal', 'schedule', 'students', 'survey', 'satisfaction'],
)

const teacherWithdrawn = buildTeacherWithdrawnDuringDetailTabItems(schoolTeacherOptions)
assert.deepEqual(
  teacherWithdrawn.map(item => item.key),
  ['schedule', 'students', 'survey', 'satisfaction'],
)

const instructorDualWithdrawn = buildTeacherWithdrawnDuringDetailTabItems(instructorDualOptions)
assert.deepEqual(
  instructorDualWithdrawn.map(item => item.key),
  ['schedule', 'students', 'survey', 'satisfaction', 'settlement'],
)

const trainedTeacherWithdrawn = buildTeacherWithdrawnDuringDetailTabItems({
  ...schoolTeacherOptions,
  programType: 'TRAINED_TEACHER',
})
assert.deepEqual(
  trainedTeacherWithdrawn.map(item => item.key),
  ['schedule', 'students', 'survey', 'satisfaction'],
)

const generalWithdrawn = buildWithdrawnDuringDetailTabItems(options)
assert.ok(!generalWithdrawn.some(item => item.key === 'notice'))
assert.ok(generalWithdrawn.some(item => item.key === 'settlement'))

assert.equal(
  hasTeacherAssignmentAsideContent({ instructors: [], textbook: undefined }),
  false,
)
assert.equal(
  hasTeacherAssignmentAsideContent({
    instructors: [{ id: '1', name: '김' }],
  }),
  true,
)
assert.equal(
  hasTeacherAssignmentAsideContent({
    textbook: {
      title: '교재',
      kitCountLabel: '1키트',
      volumeCountLabel: '1권',
      deliveryStatus: 'before',
    },
    instructors: [],
  }),
  true,
)

assert.equal(shouldShowSettlementTab(options), true)
assert.equal(shouldShowSettlementTab(instructorDualOptions), true)
assert.equal(shouldShowSettlementTab(schoolTeacherOptions), false)
assert.equal(
  shouldShowSettlementTab({ ...schoolTeacherOptions, programType: 'TRAINED_TEACHER' }),
  false,
)
assert.equal(
  shouldShowSettlementTab({ detailCase: 'ujat-participant', schoolTeacherMember: true }),
  false,
)
assert.equal(shouldShowSettlementTab({ detailCase: 'instructor' }), true)
assert.equal(shouldShowSettlementTab({ detailCase: 'volunteer' }), true)
assert.equal(shouldShowSettlementTab({ detailCase: 'ujat-volunteer' }), true)
assert.equal(shouldShowSettlementTab({ detailCase: 'general', programType: 'GENERAL' }), true)

const teacherNoSurvey = buildTeacherInProgressDetailTabItems({
  ...schoolTeacherOptions,
  programType: 'TRAINED_TEACHER',
  surveyConfigured: false,
  satisfactionConfigured: false,
})
assert.deepEqual(
  teacherNoSurvey.map(item => item.key),
  ['notice', 'schedule', 'students'],
)

const teacherNoStudentDocuments = buildTeacherInProgressDetailTabItems({
  ...schoolTeacherOptions,
  teacherStudentDocumentTabsVisible: false,
})
assert.deepEqual(
  teacherNoStudentDocuments.map(item => item.key),
  ['notice', 'schedule', 'survey', 'satisfaction'],
)

const teacherWithdrawnNoStudentDocuments = buildTeacherWithdrawnDuringDetailTabItems({
  ...schoolTeacherOptions,
  teacherStudentDocumentTabsVisible: false,
})
assert.deepEqual(
  teacherWithdrawnNoStudentDocuments.map(item => item.key),
  ['schedule', 'survey', 'satisfaction'],
)

const teacherInstructorProgramCase = buildTeacherInProgressDetailTabItems({
  detailCase: 'instructor',
  scheduleTabLabel: EDUCATION_ACTIVITY_SCHEDULE_TAB_LABEL,
  surveyConfigured: true,
  satisfactionConfigured: true,
  lectureReportVisible: true,
})
assert.equal(
  teacherInstructorProgramCase.find(item => item.key === 'schedule')?.label,
  '교육 일정',
)

const ujatTeacher = buildTeacherInProgressDetailTabItems({
  detailCase: 'ujat-participant',
  scheduleTabLabel: UJAT_PARTICIPANT_ASSIGNMENT_TAB_LABEL,
  surveyConfigured: true,
  satisfactionConfigured: true,
  teacherStudentDocumentTabsVisible: false,
  schoolTeacherMember: true,
})
assert.deepEqual(
  ujatTeacher.map(item => item.label),
  ['안내사항', '봉사자 배정 현황', '설문조사', '만족도조사'],
)
assert.ok(teacherInstructorProgramCase.some(item => item.key === 'lecture-report'))
assert.ok(!general.some(item => item.key === 'lecture-report'))

console.log('detail-tabs.teacher.selfcheck: ok')
