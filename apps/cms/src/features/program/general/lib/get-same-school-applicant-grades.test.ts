import { describe, expect, it } from 'vitest'
import { getSameSchoolApplicantGrades } from './get-same-school-applicant-grades'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'

function row(
  patch: Partial<ApplicantSchoolRow> & Pick<ApplicantSchoolRow, 'id' | 'educationGrade'>
): ApplicantSchoolRow {
  return {
    no: 1,
    schoolName: '부영초등학교',
    region: '서울',
    classCount: 1,
    studentCount: 20,
    teacherName: '교사',
    approvalStatus: 'approved',
    programId: '186269',
    ...patch,
  }
}

describe('getSameSchoolApplicantGrades', () => {
  it('같은 교육일의 다른 학년만 남긴다', () => {
    const lead = row({
      id: '1691433',
      educationGrade: '1학년',
      preferredEducationSchedules: [{ startAt: '2026-05-12T01:00:00.000Z' }],
    })
    const sameDate = row({
      id: '1691432',
      educationGrade: '2학년',
      preferredEducationSchedules: [{ startAt: '2026-05-12T05:00:00.000Z' }],
    })
    const otherDate = row({
      id: '1691431',
      educationGrade: '3학년',
      preferredEducationSchedules: [{ startAt: '2026-05-13T01:00:00.000Z' }],
    })
    const missingDate = row({
      id: '1691430',
      educationGrade: '4학년',
    })

    expect(
      getSameSchoolApplicantGrades(
        [lead, sameDate, otherDate, missingDate],
        '186269',
        '부영초등학교',
        '1691433',
        '1학년'
      ).map(item => item.id)
    ).toEqual(['1691432'])
  })
})
