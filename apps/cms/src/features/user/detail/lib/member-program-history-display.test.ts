import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Application, UserHistory } from '@/types/domain'
import {
  resolveApplicationEnrollmentDisplayStatus,
  resolveMemberProgramTitle,
  resolveMemberProgramYear,
  resolveVolunteerHistoryDisplayStatus,
} from './member-program-history-display'

const getByIdSync = vi.fn()

vi.mock('@/entities/program/api/program-service', () => ({
  programService: {
    getByIdSync: (...args: unknown[]) => getByIdSync(...args),
  },
}))

vi.mock('@/features/user/api/member-remote-capabilities', () => ({
  isMembersRemoteEnabled: vi.fn(() => true),
}))

import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'

function baseApplication(partial: Partial<Application> = {}): Application {
  return {
    id: 'app-1',
    programId: 'prog-mock-1',
    subjectType: 'instructor',
    subjectId: 'user-1',
    status: 'submitted',
    submittedAt: '2026-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...partial,
  }
}

function baseVolunteerHistory(partial: Partial<UserHistory> = {}): UserHistory {
  return {
    id: 'hist-1',
    userId: 'user-1',
    programId: 'prog-mock-1',
    role: 'VOLUNTEER',
    completedAt: '2026-01-01',
    finalStatus: 'CONFIRMED',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...partial,
  }
}

describe('member-program-history-display (remote)', () => {
  beforeEach(() => {
    vi.mocked(isMembersRemoteEnabled).mockReturnValue(true)
    getByIdSync.mockReset()
    getByIdSync.mockReturnValue({
      id: 'prog-mock-1',
      title: '최강사 체험 프로그램',
      startDate: '2024-01-01',
      lifecycleStatus: 'education_in_progress',
    })
  })

  it('remote에서 programName·year API 없으면 mock lookup 없이 programId/null 반환', () => {
    const app = baseApplication()
    expect(resolveMemberProgramTitle(app.programId, app)).toBe('prog-mock-1')
    expect(resolveMemberProgramYear(app.programId, app)).toBeNull()
    expect(getByIdSync).not.toHaveBeenCalled()
  })

  it('remote에서 API programName·progressYear가 있으면 사용한다', () => {
    const app = baseApplication({
      customFields: {
        programName: 'BE 프로그램',
        progressYear: 2025,
      },
    })
    expect(resolveMemberProgramTitle(app.programId, app)).toBe('BE 프로그램')
    expect(resolveMemberProgramYear(app.programId, app)).toBe(2025)
    expect(getByIdSync).not.toHaveBeenCalled()
  })

  it('remote에서 enrollmentDisplayStatus API 없으면 getByIdSync 없이 status만 사용', () => {
    const app = baseApplication({ status: 'approved', progressStatus: 'IN_PROGRESS' })
    const status = resolveApplicationEnrollmentDisplayStatus(app)
    expect(status).toBeTruthy()
    expect(getByIdSync).not.toHaveBeenCalled()
  })

  it('remote에서 enrollmentDisplayStatus API 값이 있으면 우선 사용', () => {
    const app = baseApplication({
      customFields: { enrollmentDisplayStatus: 'PROGRAM_ENDED' },
    })
    expect(resolveApplicationEnrollmentDisplayStatus(app)).toBe('PROGRAM_ENDED')
    expect(getByIdSync).not.toHaveBeenCalled()
  })

  it('remote에서 봉사 이력 CONFIRMED 상태는 mock program lifecycle lookup 없이 처리', () => {
    const history = baseVolunteerHistory({ finalStatus: 'CONFIRMED' })
    resolveVolunteerHistoryDisplayStatus(history)
    expect(getByIdSync).not.toHaveBeenCalled()
  })

  it('mock 모드에서는 programService.getByIdSync로 보강한다', () => {
    vi.mocked(isMembersRemoteEnabled).mockReturnValue(false)
    const app = baseApplication()
    expect(resolveMemberProgramTitle(app.programId, app)).toBe('최강사 체험 프로그램')
    expect(getByIdSync).toHaveBeenCalledWith('prog-mock-1')
  })
})
