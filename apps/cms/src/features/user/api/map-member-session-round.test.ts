import { describe, expect, it } from 'vitest'
import type { MemberAssignmentSubmissionResponse } from '@/shared/api/generated/members/schemas/memberAssignmentSubmissionResponse'
import { formatLectureAttendanceSessionLabel } from '@/features/program/general/lib/lecture-attendance-session-identity'
import { mapMemberAssignmentSubmissionsToDetail } from './map-member-assignment-submissions'
import { mapMemberLectureAttendanceToDetail } from './map-member-lecture-attendance'

describe('회원 상세 강의 출석·과제 — 회차 번호를 행 순서로 만들지 않는다', () => {
  it('출석 회차가 없으면 null, 있으면 서버 값', () => {
    const detail = mapMemberLectureAttendanceToDetail(
      { sessions: [{ status: 'PRESENT' }, { roundNumber: 3, status: 'ABSENT' }] },
      '학생'
    )
    expect(detail.sessions.map(session => session.roundNumber)).toEqual([null, 3])
    expect(detail.sessions.map(formatLectureAttendanceSessionLabel)).toEqual(['', '3회차'])
  })

  it('과제 회차가 없으면 null', () => {
    const detail = mapMemberAssignmentSubmissionsToDetail(
      [
        { submissionId: 1 } as MemberAssignmentSubmissionResponse,
        { submissionId: 2, roundNumber: 2 } as MemberAssignmentSubmissionResponse,
      ],
      '프로그램',
      '학생'
    )
    expect(detail.rows.map(row => row.roundNumber)).toEqual([null, 2])
  })

  it('사전교육·교육 구조 라벨은 회차보다 우선', () => {
    expect(
      formatLectureAttendanceSessionLabel({ roundNumber: 0, preEducation: true })
    ).toBe('사전교육')
    expect(
      formatLectureAttendanceSessionLabel({ roundNumber: 2, sessionLabel: '워크숍' })
    ).toBe('워크숍')
  })
})
