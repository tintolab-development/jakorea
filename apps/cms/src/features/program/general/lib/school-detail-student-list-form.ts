/**
 * 학교 상세 학생 명단 — RHF 폼 값 ↔ UI row 변환 및 편집 표시 행(formIndex) 연결
 */

import type { StudentListFilterParams } from '@/features/program/general/hooks/use-student-list-filter-params'
import type {
  SchoolDetailStudentRow,
  StudentListFormStudent,
  StudentListFormValues,
} from '@/features/program/general/model/school-detail-types'
import { matchesStudentListFilters } from '@/features/program/general/lib/student-list-filter-fields'

export function rowsToFormValues(rows: SchoolDetailStudentRow[]): StudentListFormValues {
  return {
    students: rows.map(r => ({
      id: r.id,
      no: r.no,
      name: r.name,
      gender: r.gender,
      birthDate: r.birthDate ?? '',
      gradeClass: r.gradeClass,
      contact: r.contact ?? '',
      email: r.email ?? '',
      notes: r.notes ?? '',
      lectureAttendance: r.lectureAttendance,
    })),
  }
}

export function formValuesToRows(students: StudentListFormStudent[]): SchoolDetailStudentRow[] {
  return students.map(r => ({
    id: r.id,
    no: r.no,
    name: r.name,
    gender: r.gender,
    birthDate: r.birthDate?.trim() || undefined,
    gradeClass: r.gradeClass,
    contact: r.contact?.trim() || undefined,
    email: r.email?.trim() || undefined,
    notes: r.notes?.trim() || undefined,
    lectureAttendance: r.lectureAttendance,
  }))
}

/** 편집 테이블 한 행 — Ant Table index와 RHF `students.${formIndex}` 정합 */
export type StudentEditTableRow = StudentListFormStudent & {
  formIndex: number
}

/**
 * 전체 폼 배열은 유지하고, 화면에는 필터에 맞는 학생만 노출한다.
 * `rosterRows` 순서(merged 명단)를 따른다.
 */
export function buildStudentEditVisibleRows(input: {
  formStudents: StudentListFormStudent[]
  rosterRows: SchoolDetailStudentRow[]
  appliedFilters: StudentListFilterParams
}): StudentEditTableRow[] {
  const formById = new Map(
    input.formStudents.map((student, formIndex) => [student.id, { student, formIndex }])
  )
  const visible: StudentEditTableRow[] = []
  for (const rosterRow of input.rosterRows) {
    if (!matchesStudentListFilters(rosterRow, input.appliedFilters)) continue
    const entry = formById.get(rosterRow.id)
    if (!entry) continue
    visible.push({ ...entry.student, formIndex: entry.formIndex })
  }
  return visible
}
