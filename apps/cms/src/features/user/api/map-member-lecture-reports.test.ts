import { describe, expect, it } from 'vitest'
import { mapMemberLectureReportsToTableRows } from './map-member-lecture-reports'

describe('mapMemberLectureReportsToTableRows — 회원 API reportStatus 합성값', () => {
  it('강의 전(UPCOMING)은 미제출이 아니라 진행 예정이다', () => {
    const [row] = mapMemberLectureReportsToTableRows([
      { reportStatus: 'UPCOMING', lectureProgressStatus: 'UPCOMING' },
    ])
    expect(row.lectureProgressLabel).toBe('진행 예정')
    expect(row.submissionStatusLabel).toBe('진행 예정')
    expect(row.canViewReport).toBe(false)
  })

  it('강의 후 미제출(NOT_SUBMITTED)은 진행 완료 · 미제출', () => {
    const [row] = mapMemberLectureReportsToTableRows([
      { reportStatus: 'NOT_SUBMITTED', lectureProgressStatus: 'COMPLETED' },
    ])
    expect(row.lectureProgressLabel).toBe('진행 완료')
    expect(row.submissionStatusLabel).toBe('미제출')
    expect(row.canViewReport).toBe(false)
  })

  it('보기는 내려받을 첨부(file_object)가 있을 때만 — 제출 완료·예외 승인 라벨은 구분', () => {
    const rows = mapMemberLectureReportsToTableRows([
      { reportId: 1, reportStatus: 'SUBMITTED', lectureProgressStatus: 'COMPLETED', reportFileIds: [11, 12] },
      { reportId: 2, reportStatus: 'SUBMITTED', lectureProgressStatus: 'COMPLETED' },
      { reportId: 3, reportStatus: 'EXCEPTION_ACCEPTED', lectureProgressStatus: 'COMPLETED' },
    ])
    expect(rows.map(row => [row.submissionStatusLabel, row.canViewReport])).toEqual([
      ['제출 완료', true],
      ['제출 완료', false],
      ['예외 승인', false],
    ])
    expect(rows[0].reportFileIds).toEqual([11, 12])
  })

  it('활동 포기(GAVE_UP)는 서버 진행 여부를 그대로 쓰고, 제출된 첨부가 있으면 보기는 유지한다', () => {
    const [withoutReport, withReport] = mapMemberLectureReportsToTableRows([
      { reportStatus: 'GAVE_UP', lectureProgressStatus: 'COMPLETED' },
      { reportId: 9, reportStatus: 'GAVE_UP', lectureProgressStatus: 'COMPLETED', reportFileIds: [77] },
    ])
    expect(withoutReport.lectureProgressLabel).toBe('진행 완료')
    expect(withoutReport.submissionStatusLabel).toBe('활동 포기')
    expect(withoutReport.canViewReport).toBe(false)
    expect(withReport.submissionStatusLabel).toBe('활동 포기')
    expect(withReport.canViewReport).toBe(true)
  })

  it('교육 진행 일정은 강의 시작일 | 회차, 제출 기간은 제출 마감일까지', () => {
    const [row, preEducation] = mapMemberLectureReportsToTableRows([
      {
        instructorAssignmentId: 31,
        programScheduleId: 9001,
        sessionOrdinal: 3,
        lectureStartAt: '2026-11-07T01:00:00Z',
        submitDueAt: '2026-12-05T14:59:59Z',
        submittedAt: '2026-11-20T03:00:00Z',
        reportStatus: 'SUBMITTED',
        lectureProgressStatus: 'COMPLETED',
      },
      { instructorAssignmentId: 32, lectureStartAt: '2026-11-01T01:00:00Z', reportStatus: 'UPCOMING' },
    ])
    expect(row.id).toBe('31')
    expect(row.educationDateLabel).toMatch(/^2026\.11\.07\(.\) \| 3회차$/)
    expect(row.educationDateLabel).not.toContain('9001')
    expect(row.submissionPeriodLabel).toMatch(/^2026\.12\.05\(.\)까지$/)
    expect(preEducation.educationDateLabel).toMatch(/^2026\.11\.01\(.\)$/)
    expect(preEducation.submissionPeriodLabel).toBe('-')
  })
})
