import assert from 'node:assert/strict'
import {
  educationCurriculumSessionSummaryLabel,
  hasEducationCurriculumSessions,
  visibleEducationCurriculumSessions,
} from './curriculum-sessions.ts'

assert.equal(hasEducationCurriculumSessions(undefined), false)
assert.equal(hasEducationCurriculumSessions(null), false)
assert.equal(hasEducationCurriculumSessions([]), false)
assert.equal(
  hasEducationCurriculumSessions([{ sessionNo: 1, sessionLabel: '1차시' }]),
  true,
)

const visible = visibleEducationCurriculumSessions([
  { sessionNo: 1, sessionLabel: '1차시', title: '1단원' },
  { sessionNo: 2, sessionLabel: null, title: null, content: '숨김' },
  { sessionNo: 3, sessionLabel: null, title: '2단원' },
])
assert.equal(visible.length, 2)
assert.equal(visible[0]?.sessionLabel, '1차시')
assert.equal(visible[1]?.title, '2단원')

assert.equal(
  educationCurriculumSessionSummaryLabel([
    { sessionNo: 1, sessionLabel: '1차시', title: '1단원' },
    { sessionNo: 2, sessionLabel: '2차시', title: '2단원' },
  ]),
  '1차시 · 2차시',
)

console.log('curriculum-sessions.selfcheck: ok')
