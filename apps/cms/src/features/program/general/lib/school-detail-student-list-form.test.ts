import { describe, expect, it } from 'vitest'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import {
  buildStudentEditVisibleRows,
  formValuesToRows,
  rowsToFormValues,
} from './school-detail-student-list-form'

function row(
  partial: Partial<SchoolDetailStudentRow> & Pick<SchoolDetailStudentRow, 'id' | 'name' | 'gradeClass'>
): SchoolDetailStudentRow {
  return {
    no: 1,
    gender: 'male',
    ...partial,
  }
}

describe('school-detail-student-list-form', () => {
  const fullRoster: SchoolDetailStudentRow[] = [
    row({ id: '1', no: 1, name: 'A', gradeClass: '1반', gender: 'male' }),
    row({ id: '2', no: 2, name: 'B', gradeClass: '2반', gender: 'male' }),
    row({ id: '3', no: 3, name: 'C', gradeClass: '1반', gender: 'female' }),
    row({ id: '4', no: 4, name: 'D', gradeClass: '2반', gender: 'female' }),
    row({ id: '5', no: 5, name: 'E', gradeClass: '1반', gender: 'male' }),
    row({ id: '6', no: 6, name: 'F', gradeClass: '2반', gender: 'male' }),
    row({ id: '7', no: 7, name: 'G', gradeClass: '1반', gender: 'female' }),
    row({ id: '8', no: 8, name: 'H', gradeClass: '2반', gender: 'female' }),
    row({ id: '9', no: 9, name: 'I', gradeClass: '1반', gender: 'male' }),
    row({ id: '10', no: 10, name: 'J', gradeClass: '2반', gender: 'male' }),
  ]

  it('TC-01: class filter — commit payload keeps all students after editing one visible row', () => {
    const form = rowsToFormValues(fullRoster)
    const visible = buildStudentEditVisibleRows({
      formStudents: form.students,
      rosterRows: fullRoster,
      appliedFilters: { studentName: '', studentGender: 'all', studentClass: '1반' },
    })
    expect(visible).toHaveLength(5)
    const targetIndex = visible[0]!.formIndex
    form.students[targetIndex]!.name = 'A-수정'
    const commitRows = formValuesToRows(form.students)
    expect(commitRows).toHaveLength(10)
    expect(commitRows.find(r => r.id === '1')?.name).toBe('A-수정')
    expect(commitRows.find(r => r.id === '2')?.name).toBe('B')
  })

  it('TC-02: name search — full roster preserved on save', () => {
    const form = rowsToFormValues(fullRoster)
    const visible = buildStudentEditVisibleRows({
      formStudents: form.students,
      rosterRows: fullRoster,
      appliedFilters: { studentName: 'C', studentGender: 'all', studentClass: 'all' },
    })
    expect(visible).toHaveLength(1)
    expect(visible[0]!.formIndex).toBe(2)
    form.students[visible[0]!.formIndex]!.name = 'C-수정'
    const commitRows = formValuesToRows(form.students)
    expect(commitRows).toHaveLength(10)
    expect(commitRows[2]?.name).toBe('C-수정')
    expect(commitRows[1]?.name).toBe('B')
  })

  it('TC-03: gender filter — edits target correct student', () => {
    const form = rowsToFormValues(fullRoster)
    const visible = buildStudentEditVisibleRows({
      formStudents: form.students,
      rosterRows: fullRoster,
      appliedFilters: { studentName: '', studentGender: 'female', studentClass: 'all' },
    })
    const cRow = visible.find(v => v.id === '3')
    expect(cRow?.formIndex).toBe(2)
    form.students[cRow!.formIndex]!.gender = 'male'
    const commitRows = formValuesToRows(form.students)
    expect(commitRows[2]?.gender).toBe('male')
    expect(commitRows[1]?.gender).toBe('male')
  })

  it('TC-04: compound filters', () => {
    const visible = buildStudentEditVisibleRows({
      formStudents: rowsToFormValues(fullRoster).students,
      rosterRows: fullRoster,
      appliedFilters: { studentName: 'G', studentGender: 'female', studentClass: '1반' },
    })
    expect(visible).toHaveLength(1)
    expect(visible[0]?.id).toBe('7')
  })

  it('keeps serverRosterId through edit and leaves draft rows without it', () => {
    const existing = row({
      id: '12',
      serverRosterId: 12,
      name: '기존',
      gradeClass: '1반',
    })
    const draft = row({
      id: 'draft-student-67243e8a-4f2b-4c1d-9a10-aabbccddeeff',
      name: '신규',
      gradeClass: '1반',
    })
    const form = rowsToFormValues([existing, draft])
    form.students[0]!.name = '기존-수정'
    const commitRows = formValuesToRows(form.students)
    expect(commitRows[0]?.serverRosterId).toBe(12)
    expect(commitRows[0]?.name).toBe('기존-수정')
    expect(commitRows[1]?.serverRosterId).toBeUndefined()
  })

  it('TC-05: form index alignment — editing C does not change B', () => {
    const form = rowsToFormValues(fullRoster)
    const visible = buildStudentEditVisibleRows({
      formStudents: form.students,
      rosterRows: fullRoster,
      appliedFilters: { studentName: '', studentGender: 'all', studentClass: '1반' },
    })
    const c = visible.find(v => v.id === '3')
    expect(c?.formIndex).toBe(2)
    form.students[c!.formIndex]!.name = 'C-only'
    expect(form.students[1]!.name).toBe('B')
    expect(form.students[2]!.name).toBe('C-only')
  })
})
