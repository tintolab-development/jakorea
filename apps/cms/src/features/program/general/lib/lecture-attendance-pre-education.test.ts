/**
 * 강의 출석 모달 — 사전교육 행 「사전교육」 라벨·scheduleId 식별·본교육 회차 유지.
 */
import { describe, expect, it } from 'vitest'
import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'
import { countLectureAttendanceHeldAndAttended } from '@/features/program/general/lib/lecture-attendance-count'
import {
  formatLectureAttendanceSessionLabel,
  lectureAttendanceSessionKey,
} from '@/features/program/general/lib/lecture-attendance-session-identity'
import { mapSessionProgressToLectureAttendanceSessions } from '@/features/program/general/lib/participating-individual-participant-lecture-attendance'
import type { LectureAttendanceSession } from '@/features/program/general/model/school-detail-types'

describe('lecture attendance session identity', () => {
  it('사전교육은 「사전교육」, 본교육은 「N회차」', () => {
    expect(formatLectureAttendanceSessionLabel({ roundNumber: 0, preEducation: true })).toBe('사전교육')
    expect(formatLectureAttendanceSessionLabel({ roundNumber: 1 })).toBe('1회차')
  })

  it('같은 회차 번호여도 scheduleId가 다르면 다른 행', () => {
    const a: LectureAttendanceSession = { roundNumber: 1, status: 'attended', scheduleId: 7000 }
    const b: LectureAttendanceSession = { roundNumber: 1, status: 'attended', scheduleId: 9001 }
    expect(lectureAttendanceSessionKey(a)).not.toBe(lectureAttendanceSessionKey(b))
    expect(lectureAttendanceSessionKey({ roundNumber: 2 })).toBe('round:2')
  })
})

describe('mapSessionProgressToLectureAttendanceSessions — 사전교육 행', () => {
  it('sessionNo=null 사전교육은 회차 0·preEducation, 본교육 폴백 회차는 밀리지 않는다', () => {
    const sessions = mapSessionProgressToLectureAttendanceSessions([
      { scheduleId: 7000, sessionNo: null, scheduleRole: 'PRE_EDUCATION', attendanceStatus: 'PRESENT' },
      { scheduleId: 9001, sessionNo: null, attendanceStatus: 'ABSENT' },
      { scheduleId: 9002, sessionNo: 2, attendanceStatus: 'LATE' },
    ] as unknown as SessionProgress[])
    expect(sessions).toEqual([
      { roundNumber: 0, status: 'attended', scheduleId: 7000, preEducation: true },
      { roundNumber: 1, status: 'absent', scheduleId: 9001 },
      { roundNumber: 2, status: 'late', scheduleId: 9002 },
    ])
    expect(new Set(sessions.map(lectureAttendanceSessionKey)).size).toBe(3)
    expect(sessions.map(formatLectureAttendanceSessionLabel)).toEqual(['사전교육', '1회차', '2회차'])
  })

  it('출석률 분모에 사전교육을 포함한다', () => {
    const sessions = mapSessionProgressToLectureAttendanceSessions([
      { scheduleId: 7000, sessionNo: null, scheduleRole: 'PRE_EDUCATION', attendanceStatus: 'PRESENT' },
      { scheduleId: 9001, sessionNo: 1, attendanceStatus: 'ABSENT' },
    ] as unknown as SessionProgress[])
    expect(countLectureAttendanceHeldAndAttended(sessions)).toEqual({ attended: 1, held: 2 })
  })
})
