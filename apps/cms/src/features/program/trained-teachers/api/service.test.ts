import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getTrainedTeacherProgram } from './service'

const mocks = vi.hoisted(() => ({
  fetchAdminProgramByIdRemote: vi.fn(),
  fetchAdminProgramSponsorsRemote: vi.fn(),
  fetchTrainedTeacherInfoDetailRemote: vi.fn(),
}))

vi.mock('@/features/program/trained-teachers/api/capabilities', () => ({
  shouldUseTrainedTeacherProgramsRemoteApi: () => true,
}))

vi.mock('@/features/program/general/api/programs-api-client', () => ({
  bulkDeleteAdminProgramsRemote: vi.fn(),
  deleteAdminProgramRemote: vi.fn(),
  fetchAdminProgramByIdRemote: (...args: unknown[]) => mocks.fetchAdminProgramByIdRemote(...args),
  fetchAdminProgramSponsorsRemote: (...args: unknown[]) =>
    mocks.fetchAdminProgramSponsorsRemote(...args),
  fetchAdminProgramsRemote: vi.fn(),
  updateAdminProgramRemote: vi.fn(),
}))

vi.mock('./info-detail-client', () => ({
  fetchTrainedTeacherInfoDetailRemote: (...args: unknown[]) =>
    mocks.fetchTrainedTeacherInfoDetailRemote(...args),
  patchTrainedTeacherInfoDetailRemote: vi.fn(),
}))

describe('getTrainedTeacherProgram', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchAdminProgramByIdRemote.mockResolvedValue({})
    mocks.fetchAdminProgramSponsorsRemote.mockResolvedValue([])
    mocks.fetchTrainedTeacherInfoDetailRemote.mockResolvedValue({})
  })

  it('propagates sponsor lookup failure instead of returning partial program data', async () => {
    const error = new Error('sponsor request failed')
    mocks.fetchAdminProgramSponsorsRemote.mockRejectedValue(error)

    await expect(getTrainedTeacherProgram('186264')).rejects.toBe(error)
  })

  it('propagates trained-teacher detail lookup failure instead of falling back to base data', async () => {
    const error = new Error('trained-teacher detail request failed')
    mocks.fetchTrainedTeacherInfoDetailRemote.mockRejectedValue(error)

    await expect(getTrainedTeacherProgram('186264')).rejects.toBe(error)
  })
})
