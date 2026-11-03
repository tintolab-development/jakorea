/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UjatEducationProgressVolunteerAssignmentAttendanceInfo } from './assignment-attendance-info'
import type {
  UjatVolunteerAssignmentAbsenceReason,
  UjatVolunteerAssignmentProgressRow,
} from './assignment-types'

const downloadAbsenceEvidenceFile = vi.fn(async (..._args: [number, string]) => undefined)

vi.mock('@/features/program/general/api/absence-reasons', () => ({
  downloadAbsenceEvidenceFile: (fileObjectId: number, fileName: string) =>
    downloadAbsenceEvidenceFile(fileObjectId, fileName),
}))

vi.mock('@/shared/ui', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/ui')>()
  return {
    ...actual,
    useCmsAlert: () => ({ showAlert: vi.fn() }),
  }
})

describe('UjatEducationProgressVolunteerAssignmentAttendanceInfo', () => {
  beforeEach(() => {
    cleanup()
    downloadAbsenceEvidenceFile.mockClear()
  })

  const assignmentRows: UjatVolunteerAssignmentProgressRow[] = [
    {
      id: 'row-1',
      scheduleLabel: '1회차',
      role: 'none',
      assignedInstitution: { kind: 'dash' },
      partner: { kind: 'dash' },
      classDisplay: { kind: 'dash' },
      attendance: { kind: 'excused_absence' },
      educationPlanSubmitted: false,
      educationLogSubmitted: false,
      educationProgress: 'dash',
      isWithdrawn: false,
    },
  ]

  const attendanceSummary = {
    completionStatus: '미수료',
    lateCountLabel: '0',
  }

  it('shows 첨부 없음 when fileObjectIds is empty', () => {
    const absenceReasons: UjatVolunteerAssignmentAbsenceReason[] = [
      {
        id: 'absence-1',
        dateLabel: '1회차',
        reason: '개인 사정',
        fileObjectIds: [],
        originalFileNames: [],
      },
    ]
    render(
      <UjatEducationProgressVolunteerAssignmentAttendanceInfo
        assignmentRows={assignmentRows}
        attendanceSummary={attendanceSummary}
        absenceReasons={absenceReasons}
      />
    )
    expect(screen.getByText('첨부 없음')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders one download control per attachment and calls downloadAbsenceEvidenceFile', () => {
    const absenceReasons: UjatVolunteerAssignmentAbsenceReason[] = [
      {
        id: 'absence-2',
        dateLabel: '2회차',
        reason: '병원 방문',
        fileObjectIds: [101, 102],
        originalFileNames: ['진단서.pdf', '영수증.pdf'],
      },
    ]
    render(
      <UjatEducationProgressVolunteerAssignmentAttendanceInfo
        assignmentRows={assignmentRows}
        attendanceSummary={attendanceSummary}
        absenceReasons={absenceReasons}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /진단서\.pdf/ }))
    fireEvent.click(screen.getByRole('button', { name: /영수증\.pdf/ }))

    expect(downloadAbsenceEvidenceFile).toHaveBeenCalledTimes(2)
    expect(downloadAbsenceEvidenceFile).toHaveBeenNthCalledWith(1, 101, '진단서.pdf')
    expect(downloadAbsenceEvidenceFile).toHaveBeenNthCalledWith(2, 102, '영수증.pdf')
  })

  it('불참 사유가 없어도 출결 관련 정보·불참 사유 섹션을 둔다', () => {
    render(
      <UjatEducationProgressVolunteerAssignmentAttendanceInfo
        assignmentRows={[]}
        attendanceSummary={attendanceSummary}
        absenceReasons={[]}
      />
    )
    expect(screen.getByText('출결 관련 정보')).toBeTruthy()
    expect(screen.getByText('수료 여부')).toBeTruthy()
    expect(screen.getByText('지각 횟수')).toBeTruthy()
    expect(screen.getByText('불참 사유')).toBeTruthy()
    expect(screen.getByText('사유 기재 후 불참한 이력이 없습니다.')).toBeTruthy()
  })
})
