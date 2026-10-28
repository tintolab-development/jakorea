import { describe, expect, it } from 'vitest'
import { getSameSchoolParticipatingGrades } from './get-same-school-participating-grades'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'

function session(startAt: string): ParticipatingSchoolSession {
  return {
    round: 1,
    date: '',
    dayOfWeek: '',
    duration: '',
    format: '',
    classNum: '',
    timeRange: '',
    startAt,
  }
}

function row(
  patch: Partial<ParticipatingSchoolRow> & Pick<ParticipatingSchoolRow, 'id' | 'educationGrade'>
): ParticipatingSchoolRow {
  return {
    no: 1,
    schoolName: '부영초등학교',
    region: '서울',
    classCount: 1,
    studentCount: 20,
    lectureRound: '1',
    textbookStatus: 'preparing',
    approvalStatus: 'approved',
    teacherName: '교사',
    instructors: '',
    ...patch,
  }
}

describe('getSameSchoolParticipatingGrades', () => {
  it('교육일(OSA 날짜)이 달라도 다른 학년은 모두 합반 후보로 남긴다', () => {
    const lead = row({
      id: 'p-1',
      educationGrade: '1학년',
      sessions: [session('2026-05-12T01:00:00.000Z')],
    })
    const sameDate = row({
      id: 'p-2',
      educationGrade: '2학년',
      preferredEducationSchedules: [{ startAt: '2026-05-12T05:00:00.000Z' }],
    })
    const otherDate = row({
      id: 'p-3',
      educationGrade: '3학년',
      sessions: [session('2026-05-13T01:00:00.000Z')],
    })

    expect(
      getSameSchoolParticipatingGrades(
        [lead, sameDate, otherDate],
        '부영초등학교',
        'p-1',
        '1학년'
      ).map(item => item.id)
    ).toEqual(['p-2', 'p-3'])
  })
})
