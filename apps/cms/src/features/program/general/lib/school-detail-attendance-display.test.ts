import { describe, expect, it } from 'vitest'
import { formatStudentGradeClassColumnLabel } from './student-registered-grade-class-options'
import {
  filterAttendanceStudentsForDisplay,
  hasSchoolDetailAttendanceStudentFilters,
} from './school-detail-attendance-display'
import { SCHOOL_ATTENDANCE_FILTER_ALL } from '../model/school-detail-types'
import type {
  SchoolDetailAttendanceFilters,
  SchoolDetailAttendanceStudentRow,
} from '../model/school-detail-types'

describe('formatStudentGradeClassColumnLabel', () => {
  it('shows class only when grade and class are combined', () => {
    expect(formatStudentGradeClassColumnLabel('초5 1반')).toBe('1반')
    expect(formatStudentGradeClassColumnLabel('초5 200반')).toBe('200반')
  })

  it('shows class when only 반 label is stored', () => {
    expect(formatStudentGradeClassColumnLabel('1반')).toBe('1반')
  })

  it('extracts trailing N반 from compact labels', () => {
    expect(formatStudentGradeClassColumnLabel('초2반')).toBe('2반')
  })
})

describe('school detail attendance student filters', () => {
  const emptyFilters: SchoolDetailAttendanceFilters = {
    educationSchedule: SCHOOL_ATTENDANCE_FILTER_ALL,
    studentName: '',
    studentGender: SCHOOL_ATTENDANCE_FILTER_ALL,
    studentClass: SCHOOL_ATTENDANCE_FILTER_ALL,
    attendanceStatus: SCHOOL_ATTENDANCE_FILTER_ALL,
  }
  const students: SchoolDetailAttendanceStudentRow[] = [
    {
      id: '1',
      no: 1,
      name: '김출석',
      gender: 'male',
      gradeClass: '1반',
      status: 'present',
      attendanceRecorded: true,
      participantId: 1,
    },
    {
      id: '2',
      no: 2,
      name: '이미기록',
      gender: 'female',
      gradeClass: '2반',
      status: 'unrecorded',
      attendanceRecorded: false,
      participantId: 2,
    },
  ]

  it('does not treat education-schedule-only filters as student filters', () => {
    expect(
      hasSchoolDetailAttendanceStudentFilters({
        ...emptyFilters,
        educationSchedule: '101',
      })
    ).toBe(false)
  })

  it('filters unrecorded attendance independently from present', () => {
    const rows = filterAttendanceStudentsForDisplay(students, {
      ...emptyFilters,
      attendanceStatus: 'unrecorded',
    })
    expect(rows.map(row => row.name)).toEqual(['이미기록'])
  })
})
