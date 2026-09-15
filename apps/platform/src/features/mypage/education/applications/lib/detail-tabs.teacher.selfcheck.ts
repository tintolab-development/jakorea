import assert from 'node:assert/strict'
import {
  buildInProgressDetailTabItems,
  buildTeacherInProgressDetailTabItems,
  buildTeacherWithdrawnDuringDetailTabItems,
  buildWithdrawnDuringDetailTabItems,
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

console.log('detail-tabs.teacher.selfcheck: ok')
