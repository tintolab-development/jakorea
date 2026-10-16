import assert from 'node:assert/strict'
import {
  buildInProgressDetailTabItems,
  buildTeacherInProgressDetailTabItems,
  buildTeacherWithdrawnDuringDetailTabItems,
  buildWithdrawnDuringDetailTabItems,
  EDUCATION_ACTIVITY_SCHEDULE_TAB_LABEL,
  resolveVolunteerActivityDetailCase,
} from './detail-tabs.ts'
import { hasTeacherAssignmentAsideContent } from '../model/types.ts'

const options = {
  detailCase: 'general' as const,
  surveyConfigured: true,
  satisfactionConfigured: true,
}

const general = buildInProgressDetailTabItems(options)
assert.deepEqual(
  general.map(item => item.key),
  ['notice', 'schedule', 'survey', 'satisfaction', 'settlement'],
)

assert.equal(resolveVolunteerActivityDetailCase('general'), 'volunteer')
assert.equal(resolveVolunteerActivityDetailCase('volunteer'), 'volunteer')
assert.equal(resolveVolunteerActivityDetailCase('ujat-volunteer'), 'ujat-volunteer')
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

const teacher = buildTeacherInProgressDetailTabItems(options)
assert.deepEqual(
  teacher.map(item => item.key),
  ['notice', 'schedule', 'students', 'survey', 'satisfaction'],
)

const teacherWithdrawn = buildTeacherWithdrawnDuringDetailTabItems(options)
assert.deepEqual(
  teacherWithdrawn.map(item => item.key),
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

const teacherNoSurvey = buildTeacherInProgressDetailTabItems({
  ...options,
  surveyConfigured: false,
  satisfactionConfigured: false,
})
assert.deepEqual(
  teacherNoSurvey.map(item => item.key),
  ['notice', 'schedule', 'students'],
)

const teacherNoStudentDocuments = buildTeacherInProgressDetailTabItems({
  ...options,
  teacherStudentDocumentTabsVisible: false,
})
assert.deepEqual(
  teacherNoStudentDocuments.map(item => item.key),
  ['notice', 'schedule', 'survey', 'satisfaction'],
)

const teacherWithdrawnNoStudentDocuments = buildTeacherWithdrawnDuringDetailTabItems({
  ...options,
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
})
assert.equal(
  teacherInstructorProgramCase.find(item => item.key === 'schedule')?.label,
  '교육일정',
)

console.log('detail-tabs.teacher.selfcheck: ok')
