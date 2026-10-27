import { describe, expect, it } from 'vitest'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import { mapStudentRowsToRosterCommitRequest } from '@/features/program/general/api/adapters/student-roster-adapters'
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
  const serverRosterId = /^[1-9]\d*$/.test(id) ? Number(id) : undefined
  return {
    id,
    ...(serverRosterId != null ? { serverRosterId } : {}),
    no: 1,
    name: `학생${id}`,
    gradeClass: '1반',
  }
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

  it('shows the server message for add and save failures other than INVALID_VALUE', () => {
    const badRequest = {
      response: {
        status: 400,
        data: {
          message: '입력값을 확인해 주세요.',
          error: { code: 'BAD_REQUEST', message: '입력값을 확인해 주세요.' },
        },
      },
    }
    expect(resolveStudentRosterManualCommitFailureAlert(badRequest).content).toBe(
      '입력값을 확인해 주세요.'
    )
    expect(
      resolveStudentRosterManualCommitFailureAlert(new Error('생년월일 형식이 올바르지 않습니다.'))
        .content
    ).toBe('생년월일 형식이 올바르지 않습니다.')
  })

  it('FE-REV-08: student add commit includes expectedRevisionNo and full rows', () => {
    const baseline = [rosterRow('1'), rosterRow('2')]
    const commit = [
      ...baseline,
      { ...rosterRow('new'), contact: '010-2222-3333', email: 'new@example.com' },
    ]
    const result = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: baseline,
      commitRows: commit,
      totalCount: 2,
      expectedRevisionNo: 5,
      disallowExistingRowDrop: true,
    })
    expect(result.ok).toBe(true)
    const body = mapStudentRowsToRosterCommitRequest({
      expectedRevisionNo: 5,
      educationGrade: '3학년',
      rows: commit.map(row => ({
        ...row,
        gender: 'male',
        birthDate: '2015. 01. 01.',
        gradeClass: '3학년 1반',
      })),
    })
    expect(body.rows).toHaveLength(3)
    expect(body.expectedRevisionNo).toBe(5)
    expect(body.rows.map(row => row.rosterId)).toEqual([1, 2, undefined])
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

  it('allows existing roster rows without phone/email and requires them on new rows', () => {
    const existing = rosterRow('12')
    const existingOk = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: [existing],
      commitRows: [existing],
      totalCount: 1,
      expectedRevisionNo: 1,
    })
    expect(existingOk.ok).toBe(true)

    const newRow: SchoolDetailStudentRow = {
      id: 'new-student',
      no: 2,
      name: '신규학생',
      gradeClass: '2반',
    }
    const missingContact = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: [existing],
      commitRows: [existing, newRow],
      totalCount: 1,
      expectedRevisionNo: 1,
    })
    expect(missingContact.ok).toBe(false)
    if (!missingContact.ok) expect(missingContact.code).toBe('NEW_ROW_CONTACT_REQUIRED')

    const withContact = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: [existing],
      commitRows: [
        existing,
        { ...newRow, contact: '010-2222-3333', email: 'new@example.com' },
      ],
      totalCount: 1,
      expectedRevisionNo: 1,
    })
    expect(withContact.ok).toBe(true)
  })
})
