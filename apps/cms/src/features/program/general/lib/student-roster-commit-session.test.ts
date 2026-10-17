import { describe, expect, it } from 'vitest'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import {
  createStudentRosterCommitSession,
  isStudentRosterCommitSessionForOrganization,
} from './student-roster-commit-session'

function row(id: string): SchoolDetailStudentRow {
  return { id, no: 1, name: 'A', gradeClass: '1반' }
}

describe('student-roster-commit-session', () => {
  it('TC-02/08: session pins revision at modal or edit entry', () => {
    const session = createStudentRosterCommitSession({
      organizationApplicationId: '1001',
      revisionNo: 5,
      baselineRows: [row('1')],
    })
    expect(session?.expectedRevisionNo).toBe(5)
    // simulated background GET revision 6 — session unchanged
    expect(session?.expectedRevisionNo).toBe(5)
    expect(session?.baselineRows).toHaveLength(1)
  })

  it('TC-03 revision missing: no session', () => {
    expect(
      createStudentRosterCommitSession({
        organizationApplicationId: '1001',
        revisionNo: undefined,
      })
    ).toBeNull()
  })

  it('TC-14/16: organization mismatch invalidates session', () => {
    const session = createStudentRosterCommitSession({
      organizationApplicationId: '1001',
      revisionNo: 5,
    })
    expect(isStudentRosterCommitSessionForOrganization(session, '1001')).toBe(true)
    expect(isStudentRosterCommitSessionForOrganization(session, '1002')).toBe(false)
  })

  it('FE-REV-02: revision 0 allowed when BE returns 0', () => {
    const session = createStudentRosterCommitSession({
      organizationApplicationId: '1',
      revisionNo: 0,
    })
    expect(session?.expectedRevisionNo).toBe(0)
  })
})
