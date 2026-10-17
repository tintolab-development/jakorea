import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchAdminProgramSchedulesRemote = vi.fn()

vi.mock('@/features/program/general/api/program-schedules-api-client', () => ({
  fetchAdminProgramSchedulesRemote: (...args: unknown[]) =>
    fetchAdminProgramSchedulesRemote(...args),
}))

import {
  resolveLectureEvalBindingTarget,
  resolveLectureEvalBindingTargetForCreate,
} from '@/features/program/shared/lib/survey-management/resolve-lecture-eval-binding-target'

describe('resolveLectureEvalBindingTarget', () => {
  beforeEach(() => {
    fetchAdminProgramSchedulesRemote.mockReset()
  })

  it('binds the earliest session schedule', async () => {
    fetchAdminProgramSchedulesRemote.mockResolvedValue([
      { id: 30, sessionNo: 2 },
      { id: 10, sessionNo: 1 },
    ])

    await expect(resolveLectureEvalBindingTarget('186010')).resolves.toEqual({
      targetScope: 'SCHEDULE',
      targetScopeId: 10,
    })
  })

  it('returns null when the program has no schedule', async () => {
    fetchAdminProgramSchedulesRemote.mockResolvedValue([])

    await expect(resolveLectureEvalBindingTarget('186010')).resolves.toBeNull()
  })
})

describe('resolveLectureEvalBindingTargetForCreate', () => {
  beforeEach(() => {
    fetchAdminProgramSchedulesRemote.mockReset()
  })

  it('PROGRAM 바인딩(targetScopeId null)을 반환하고 schedules API를 호출하지 않는다', async () => {
    await expect(resolveLectureEvalBindingTargetForCreate('186010')).resolves.toEqual({
      targetScope: 'PROGRAM',
      targetScopeId: null,
    })
    expect(fetchAdminProgramSchedulesRemote).not.toHaveBeenCalled()
  })
})