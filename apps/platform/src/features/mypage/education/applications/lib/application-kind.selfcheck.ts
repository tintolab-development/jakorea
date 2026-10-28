import assert from 'node:assert/strict'
import type { EducationApplicationListItem } from '../model/types.ts'
import {
  isInstructorRoleApplication,
  resolveApplicationRole,
} from './application-kind.ts'

function item(
  overrides: Partial<EducationApplicationListItem> & Pick<EducationApplicationListItem, 'id' | 'programId'>,
): EducationApplicationListItem {
  return {
    title: '-',
    recruitmentPeriodLabel: '-',
    operatingPeriodLabel: '-',
    recruitmentStatus: 'RECRUITING',
    educationTargetLabel: '-',
    educationForm: 'offline',
    educationFormLabel: '-',
    displayStatus: 'in_progress',
    detailCase: 'instructor',
    ...overrides,
  } as EducationApplicationListItem
}

assert.equal(
  resolveApplicationRole(
    item({ id: '1', programId: 'gemini-prog-instructor-1', applicationType: 'INSTRUCTOR' }),
  ),
  'instructor',
)
assert.equal(
  isInstructorRoleApplication(
    item({ id: '2', programId: 'gemini-prog-instructor-1', detailCase: 'instructor' }),
  ),
  true,
)
assert.equal(
  isInstructorRoleApplication(
    item({ id: '3', programId: 'general-prog-instructor-1', detailCase: 'instructor' }),
  ),
  true,
)
assert.equal(
  resolveApplicationRole(item({ id: '4', programId: 'p-1', applicationType: 'INDIVIDUAL', detailCase: 'gemini' })),
  'participant',
)

console.log('application-kind.selfcheck: ok')
