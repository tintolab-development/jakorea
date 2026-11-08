/**
 * GET /api/admin/programs/{programId}/participants — sessions[].scheduleRole → 「진행 일정」 셀.
 * 참여 봉사자·참여자·참여 기관 목록이 같은 매퍼·포맷터를 쓴다.
 */
import { describe, expect, it } from 'vitest'
import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'
import { mapSessionProgressToParticipatingSchoolSessions } from '@/features/program/general/api/adapters/general-applications-adapters'
import {
  formatParticipatingProgressEducationScheduleLine,
  formatParticipatingSchoolSessionLine,
} from '@/features/program/general/lib/participating-school-session-display'

const preEducation: SessionProgress = {
  scheduleId: 184833,
  requestedScheduleId: null,
  resolvedScheduleId: 184833,
  scheduleUnresolved: false,
  sessionNo: null,
  scheduleName: '사전교육',
  startAt: '2026-11-06T06:00:00Z',
  endAt: '2026-11-06T06:10:00Z',
  scheduleStatus: 'COMPLETED',
  attendanceStatus: null,
  assignmentStatus: null,
  scheduleRole: 'PRE_EDUCATION',
}

const education: SessionProgress = {
  scheduleId: 184834,
  requestedScheduleId: null,
  resolvedScheduleId: 184834,
  scheduleUnresolved: false,
  sessionNo: 1,
  scheduleName: '1회차',
  startAt: '2026-11-13T01:00:00Z',
  endAt: '2026-11-13T03:00:00Z',
  scheduleStatus: 'SCHEDULED',
  attendanceStatus: null,
  assignmentStatus: 'CONFIRMED',
  scheduleRole: 'EDUCATION',
}

function lines(sessions: SessionProgress[]) {
  const mapped = mapSessionProgressToParticipatingSchoolSessions(sessions)
  return {
    volunteer: mapped.map(formatParticipatingSchoolSessionLine),
    progress: mapped.map(session => formatParticipatingProgressEducationScheduleLine(session)),
  }
}

describe('participants sessions[].scheduleRole', () => {
  it('매퍼가 scheduleRole 원문을 버리지 않는다', () => {
    const [mapped] = mapSessionProgressToParticipatingSchoolSessions([preEducation])
    expect(mapped?.scheduleRole).toBe('PRE_EDUCATION')
  })

  it('PRE_EDUCATION이면 날짜·시간 뒤에 「| 사전교육」', () => {
    const { volunteer, progress } = lines([preEducation])
    expect(volunteer[0]).toMatch(/^2026\.11\.06\(금\) 15:00 ~ 15:10 \| 사전교육$/)
    expect(progress[0]).toMatch(/^2026\.11\.06\(금\) 15:00 ~ 15:10 \| 사전교육$/)
  })

  it('EDUCATION / CLOSING / SESSION / null / 필드 없음은 사전교육 라벨을 붙이지 않는다', () => {
    const variants: SessionProgress[] = [
      education,
      { ...education, scheduleRole: 'CLOSING' },
      { ...education, scheduleRole: 'SESSION' },
      { ...education, scheduleRole: null },
      (({ scheduleRole: _omit, ...rest }) => rest)(education),
    ]
    for (const session of variants) {
      const { volunteer, progress } = lines([session])
      expect(volunteer[0]).not.toContain('사전교육')
      expect(progress[0]).not.toContain('사전교육')
    }
  })

  it('sessionNo=null·일정명 「사전교육」만으로는 사전교육으로 판정하지 않는다', () => {
    const { volunteer, progress } = lines([{ ...preEducation, scheduleRole: null }])
    expect(volunteer[0]).not.toContain('사전교육')
    expect(progress[0]).not.toContain('사전교육')
  })

  it('sessions=[]이면 빈 목록', () => {
    expect(mapSessionProgressToParticipatingSchoolSessions([])).toEqual([])
  })
})
