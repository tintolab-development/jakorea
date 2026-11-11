import { describe, expect, it } from 'vitest'
import {
  buildLectureReportEducationScheduleLabel,
  mapLectureReportDtoToInstructorRow,
} from './lecture-reports-adapters'
import type { Program } from '@/types/domain'

describe('buildLectureReportEducationScheduleLabel', () => {
  it('does not use BE dateRoundTimeLabel that marks sessionNo as 차시', () => {
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-07',
        sessionNo: 3,
        timeLabel: '22:00-23:00',
        dateRoundTimeLabel: '2026-11-07 · 3차시 · 22:00-23:00',
        lectureLabel: '2026-11-07 · 3차시 · 22:00-23:00',
      })
    ).toBe('2026-11-07 | 3회차 | 22:00-23:00')
  })

  it('shows 회차 and confirmed curriculum 차시 as separate tokens', () => {
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-07',
        sessionNo: 3,
        curriculumSessionCount: 2,
        scheduleRole: 'EDUCATION',
        educationSlotKey: 'general-common-line:3',
        timeLabel: '22:00-23:00',
        dateRoundTimeLabel: '2026-11-07 · 3회차 · 2차시 · 22:00-23:00',
      })
    ).toBe('2026-11-07 | 3회차 | 2차시 | 22:00-23:00')
  })

  it('shows 사전교육 from canonical role, not from a missing sessionNo', () => {
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-06',
        sessionNo: null,
        scheduleRole: 'PRE_EDUCATION',
        educationSlotKey: 'general-pre-education:1',
        timeLabel: '15:00-15:10',
        dateRoundTimeLabel: '2026-11-06 · 사전교육 · 15:00-15:10',
      })
    ).toBe('2026-11-06 | 사전교육 | 15:00-15:10')
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-06',
        sessionNo: null,
        timeLabel: '15:00-15:10',
      })
    ).toBe('2026-11-06 | 15:00-15:10')
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-06',
        sessionNo: 1,
        scheduleRole: 'CLOSING',
        timeLabel: '15:00-15:10',
      })
    ).toBe('2026-11-06 | 1회차 | 15:00-15:10')
  })

  it('does not invent a missing 차시 or 회차', () => {
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-07',
        sessionNo: 3,
        curriculumSessionCount: null,
        timeLabel: '22:00-23:00',
      })
    ).toBe('2026-11-07 | 3회차 | 22:00-23:00')
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-07',
        curriculumSessionCount: 2,
        timeLabel: '22:00-23:00',
        dateRoundTimeLabel: '2026-11-07 · 22:00-23:00',
      })
    ).toBe('2026-11-07 · 22:00-23:00')
  })

  it('uses new-server dateRoundTimeLabel when canonical unit fields are absent', () => {
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-08',
        sessionNo: null,
        curriculumSessionCount: null,
        scheduleRole: null,
        timeLabel: '10:00-11:00',
        dateRoundTimeLabel: '2026-11-08 · 10:00-11:00',
      })
    ).toBe('2026-11-08 · 10:00-11:00')
  })
})

describe('mapLectureReportDtoToInstructorRow', () => {
  it('maps the CMS lecture-report list label from structured fields', () => {
    const row = mapLectureReportDtoToInstructorRow(
      {
        reportId: 11,
        lectureDate: '2026-11-07',
        sessionNo: 3,
        curriculumSessionCount: 1,
        scheduleRole: 'EDUCATION',
        timeLabel: '22:00-23:00',
        dateRoundTimeLabel: '2026-11-07 · 3회차 · 1차시 · 22:00-23:00',
        reportStatus: 'SUBMITTED',
        submittedAt: '2026-11-07T14:00:00Z',
      },
      0
    )
    expect(row?.educationScheduleLabel).toBe('2026-11-07 | 3회차 | 1차시 | 22:00-23:00')
    expect(row?.sessionNo).toBe(3)
    expect(row?.curriculumSessionCount).toBe(1)
  })
})

describe('buildLectureReportEducationScheduleLabel — 일반 프로그램 교육 구조별', () => {
  function generalProgram(
    structure: 'curriculum' | 'schedule',
    round: 'single' | 'multi',
    commonInfo: Record<string, unknown>
  ): Program {
    return {
      id: 'p-1',
      generalProgramAudience: 'organization',
      generalProgramEducationStructure: structure,
      generalProgramSessionRound: round,
      generalCommonInfo: commonInfo,
    } as unknown as Program
  }
  const dto = {
    lectureDate: '2026-11-07',
    sessionNo: 2,
    curriculumSessionCount: 3,
    scheduleRole: 'EDUCATION',
    timeLabel: '10:00-11:00',
  }

  it('일정형은 회차 대신 세부 일정명', () => {
    const program = generalProgram('schedule', 'multi', {
      scheduleDetails: [
        { scheduleLabel: '세부 일정 01', name: '오리엔테이션' },
        { scheduleLabel: '세부 일정 02', name: '워크숍' },
      ],
    })
    expect(buildLectureReportEducationScheduleLabel(dto, undefined, program)).toBe(
      '2026-11-07 | 워크숍 | 10:00-11:00'
    )
  })

  it('커리큘럼형 단일 회차는 회차 없이 차시 수', () => {
    const program = generalProgram('curriculum', 'single', {
      curriculumSessions: [
        { sessionLabel: '1차시', title: '', description: '' },
        { sessionLabel: '2차시', title: '', description: '' },
        { sessionLabel: '3차시', title: '', description: '' },
      ],
    })
    expect(buildLectureReportEducationScheduleLabel(dto, undefined, program)).toBe(
      '2026-11-07 | 3차시 | 10:00-11:00'
    )
  })

  it('커리큘럼형 복수 회차는 회차·차시 수 토큰 그대로', () => {
    const program = generalProgram('curriculum', 'multi', {
      curriculumSessions: [
        { sessionLabel: '1회차', title: '2', description: '' },
        { sessionLabel: '2회차', title: '3', description: '' },
      ],
    })
    expect(buildLectureReportEducationScheduleLabel(dto, undefined, program)).toBe(
      '2026-11-07 | 2회차 | 3차시 | 10:00-11:00'
    )
  })
})

describe('mapLectureReportDtoToInstructorRow — 서버 reportStatus 해석 (R01)', () => {
  const base = { reportId: 21, lectureProgressStatus: 'COMPLETED' }

  it('NOT_SUBMITTED는 SUBMIT 문자열을 포함해도 제출 완료로 읽지 않는다', () => {
    const row = mapLectureReportDtoToInstructorRow({ ...base, reportStatus: 'NOT_SUBMITTED' }, 0)
    expect(row?.submissionStatusLabel).toBe('미제출')
    expect(row?.canViewReport).toBe(false)
  })

  it('제출일이 있어도 reportStatus를 우선한다', () => {
    const row = mapLectureReportDtoToInstructorRow(
      { ...base, reportStatus: 'DRAFT', submittedAt: '2026-11-07T14:00:00Z' },
      0
    )
    expect(row?.submissionStatusLabel).toBe('미제출')
    expect(row?.canViewReport).toBe(false)
  })

  it('APPROVED·COMPLETED는 제출일이 없어도 제출 완료, EXCEPTION_ACCEPTED는 예외 승인(보기 불가)', () => {
    const labels = ['APPROVED', 'COMPLETED', 'EXCEPTION_ACCEPTED'].map(reportStatus => {
      const row = mapLectureReportDtoToInstructorRow({ ...base, reportStatus }, 0)
      return [row?.submissionStatusLabel, row?.canViewReport]
    })
    expect(labels).toEqual([
      ['제출 완료', true],
      ['제출 완료', true],
      ['예외 승인', false],
    ])
  })

  it('강의 진행 여부는 서버 lectureProgressStatus를 따른다', () => {
    const upcoming = mapLectureReportDtoToInstructorRow(
      { ...base, reportStatus: 'SUBMITTED', lectureProgressStatus: 'UPCOMING' },
      0
    )
    expect(upcoming?.lectureProgressLabel).toBe('진행 예정')
  })
})
