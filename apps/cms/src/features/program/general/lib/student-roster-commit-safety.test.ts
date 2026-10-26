import { describe, expect, it } from 'vitest'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import {
  buildStudentRosterCommitRequestBody,
  STUDENT_ROSTER_PUT_MAX_ROWS,
  validateStudentRosterCommit,
  validateStudentRosterEditEntry,
} from './student-roster-commit-safety'

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

describe('student-roster-commit-safety', () => {
  it('TC-09: blocks commit when loaded rows are fewer than totalCount', () => {
    const result = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: [rosterRow('1'), rosterRow('2')],
      commitRows: [rosterRow('1'), rosterRow('2')],
      totalCount: 10,
      expectedRevisionNo: 5,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('INCOMPLETE_LOAD')
  })

  it('TC-10: blocks commit when existing rosterId is missing from payload', () => {
    const baseline = [rosterRow('1'), rosterRow('2')]
    const commit = [rosterRow('1')]
    const result = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: baseline,
      commitRows: commit,
      totalCount: 2,
      expectedRevisionNo: 5,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('MISSING_EXISTING_ROSTER_ROW')
  })

  it('TC-10: blocks duplicate rosterId in payload', () => {
    const baseline = [rosterRow('1'), rosterRow('2')]
    const commit = [rosterRow('1'), rosterRow('1')]
    const result = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: baseline,
      commitRows: commit,
      totalCount: 2,
      expectedRevisionNo: 5,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('DUPLICATE_ROSTER_ID')
  })

  it('TC-15: blocks when row count exceeds OpenAPI max', () => {
    const baseline = Array.from({ length: STUDENT_ROSTER_PUT_MAX_ROWS + 1 }, (_, i) =>
      rosterRow(String(i + 1))
    )
    const result = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: baseline,
      commitRows: baseline,
      totalCount: baseline.length,
      expectedRevisionNo: 1,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('MAX_ROWS_EXCEEDED')
  })

  it('TC-11: manual PUT body never includes sourceFileObjectId', () => {
    const body = buildStudentRosterCommitRequestBody({ rows: [], expectedRevisionNo: 2 })
    expect(body).toEqual({ rows: [], expectedRevisionNo: 2 })
    expect('sourceFileObjectId' in body).toBe(false)
  })

  it('passes when full baseline is included in commit', () => {
    const baseline = [rosterRow('1'), rosterRow('2')]
    const commit = [
      { ...rosterRow('1'), name: '변경' },
      rosterRow('2'),
    ]
    const result = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: baseline,
      commitRows: commit,
      totalCount: 2,
      expectedRevisionNo: 3,
    })
    expect(result.ok).toBe(true)
  })

  it('T05/T06: a positive integer temp id is not an existing rosterId', () => {
    const existing = rosterRow('67243')
    const tempCollision: SchoolDetailStudentRow = {
      id: '67243',
      no: 2,
      name: '신규',
      gradeClass: '1반',
      contact: '010-2222-3333',
      email: 'new@example.com',
    }
    const uuidTemp: SchoolDetailStudentRow = {
      id: '67243e8a-4f2b-4c1d-9a10-aabbccddeeff',
      no: 3,
      name: '임시',
      gradeClass: '1반',
      contact: '010-3333-4444',
      email: 'temp@example.com',
    }
    const result = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: [existing],
      commitRows: [existing, tempCollision, uuidTemp],
      totalCount: 1,
      expectedRevisionNo: 0,
    })
    expect(result.ok).toBe(true)

    const missingContact = validateStudentRosterCommit({
      remoteEnabled: true,
      baselineRows: [],
      commitRows: [{ id: '67243', no: 1, name: '신규', gradeClass: '1반' }],
      totalCount: 0,
      expectedRevisionNo: 0,
    })
    expect(missingContact.ok).toBe(false)
    if (!missingContact.ok) expect(missingContact.code).toBe('NEW_ROW_CONTACT_REQUIRED')
  })

  it('edit entry blocked while loading', () => {
    const result = validateStudentRosterEditEntry({
      remoteEnabled: true,
      isLoading: true,
      baselineRows: [],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('LOADING')
  })
})
