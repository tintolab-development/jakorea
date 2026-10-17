import { describe, expect, it } from 'vitest'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import {
  buildStudentRosterCommitRequestBody,
  validateStudentRosterCommit,
} from './student-roster-commit-safety'
import {
  isStudentRosterInvalidValueError,
  isStudentRosterMemberIdConflictError,
  isStudentRosterRevisionConflictError,
  parseStudentRosterRevisionNo,
  resolveStudentRosterCommitErrorAlert,
  resolveStudentRosterManualCommitFailureAlert,
  STUDENT_ROSTER_MEMBER_ID_CONFLICT,
  STUDENT_ROSTER_REVISION_CONFLICT,
  validateStudentRosterExpectedRevisionNo,
} from './student-roster-revision'

function rosterRow(id: string): SchoolDetailStudentRow {
  return { id, no: 1, name: `학생${id}`, gradeClass: '1반' }
}

describe('student-roster-revision', () => {
  it('FE-REV-02: first save uses revision 0 when BE returns 0', () => {
    expect(parseStudentRosterRevisionNo(0)).toBe(0)
    const body = buildStudentRosterCommitRequestBody({ rows: [], expectedRevisionNo: 0 })
    expect(body.expectedRevisionNo).toBe(0)
  })

  it('FE-REV-03: blocks commit when revision is missing', () => {
    const result = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: [rosterRow('1')],
      commitRows: [rosterRow('1')],
      totalCount: 1,
      expectedRevisionNo: undefined,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('REVISION_UNKNOWN')
    expect(validateStudentRosterExpectedRevisionNo(undefined).ok).toBe(false)
    expect(validateStudentRosterExpectedRevisionNo(null).ok).toBe(false)
  })

  it('FE-REV-04: PUT body uses session revision, not latest GET', () => {
    const body = buildStudentRosterCommitRequestBody({
      expectedRevisionNo: 5,
      rows: [],
    })
    expect(body.expectedRevisionNo).toBe(5)
  })

  it('FE-REV-05/06: revision and memberId conflict detection', () => {
    const revisionError = {
      response: { status: 409, data: { error: { code: STUDENT_ROSTER_REVISION_CONFLICT } } },
    }
    const memberError = {
      response: { status: 409, data: { error: { code: STUDENT_ROSTER_MEMBER_ID_CONFLICT } } },
    }
    const other409 = {
      response: { status: 409, data: { error: { code: 'OTHER_CONFLICT' } } },
    }
    expect(isStudentRosterRevisionConflictError(revisionError)).toBe(true)
    expect(isStudentRosterMemberIdConflictError(revisionError)).toBe(false)
    expect(isStudentRosterMemberIdConflictError(memberError)).toBe(true)
    expect(resolveStudentRosterCommitErrorAlert(revisionError)?.title).toContain('충돌')
    expect(resolveStudentRosterCommitErrorAlert(memberError)?.title).toContain('회원')
    expect(resolveStudentRosterCommitErrorAlert(other409)).toBeNull()
  })

  it('INVALID_VALUE maps to manual commit failure hint', () => {
    const invalid = {
      response: { status: 400, data: { error: { code: 'INVALID_VALUE' } } },
    }
    expect(isStudentRosterInvalidValueError(invalid)).toBe(true)
    expect(resolveStudentRosterManualCommitFailureAlert(invalid).content).toContain(
      'sourceFileObjectId'
    )
  })

  it('FE-REV-08: student add commit includes expectedRevisionNo and full rows', () => {
    const baseline = [rosterRow('1'), rosterRow('2')]
    const commit = [...baseline, rosterRow('new')]
    const result = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: baseline,
      commitRows: commit,
      totalCount: 2,
      expectedRevisionNo: 5,
      disallowExistingRowDrop: true,
    })
    expect(result.ok).toBe(true)
    const body = buildStudentRosterCommitRequestBody({
      expectedRevisionNo: 5,
      rows: commit.map(row => ({
        studentName: row.name,
        birthDate: '2015-01-01',
        grade: '3학년',
        className: '1반',
        studentNo: row.no,
        rosterId: Number.parseInt(row.id, 10),
      })),
    })
    expect(body.rows).toHaveLength(3)
    expect(body.expectedRevisionNo).toBe(5)
  })

  it('FE-REV-12: filtered view still commits full roster with revision', () => {
    const full = Array.from({ length: 10 }, (_, i) => rosterRow(String(i + 1)))
    const result = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: full,
      commitRows: full,
      totalCount: 10,
      expectedRevisionNo: 2,
    })
    expect(result.ok).toBe(true)
  })

  it('rejects invalid revision numbers', () => {
    expect(parseStudentRosterRevisionNo(-1)).toBeNull()
    expect(parseStudentRosterRevisionNo(1.5)).toBeNull()
    expect(parseStudentRosterRevisionNo(Number.NaN)).toBeNull()
  })
})
