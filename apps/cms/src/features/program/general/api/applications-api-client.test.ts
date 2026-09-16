import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import customInstance from '@/shared/api/orval-mutator'
import { updateIndividualApplication } from './applications-api-client'

describe('updateIndividualApplication', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('개인 신청 운영정보를 canonical PATCH 경로로 저장한다', async () => {
    const response = {
      applicationId: 1690625,
      programId: 168006,
      applicationStatus: 'APPROVED',
      textbook: null,
      team: null,
      managerComment: '신청 정보 재확인 필요',
      updatedAt: '2026-09-16T03:30:00Z',
      availableActions: ['VIEW', 'COMMENT_UPDATE'],
    }
    vi.mocked(customInstance).mockResolvedValue(response)

    await expect(
      updateIndividualApplication('1690625', {
        managerComment: '신청 정보 재확인 필요',
      })
    ).resolves.toEqual(response)

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/1690625',
      method: 'PATCH',
      data: {
        managerComment: '신청 정보 재확인 필요',
      },
    })
  })

  it('명시적 null을 그대로 전송해 코멘트를 삭제한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 1690625,
      managerComment: null,
    })

    await updateIndividualApplication('1690625', { managerComment: null })

    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          managerComment: null,
        },
      })
    )
  })

  it('교재 미사용과 팀 운영정보를 같은 PATCH 요청으로 전송한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({ applicationId: 1690627 })

    await updateIndividualApplication('1690627', {
      textbookId: null,
      teamName: '우리가 최고',
      teamMemberCount: 3,
      teamRole: 'LEADER',
    })

    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          textbookId: null,
          teamName: '우리가 최고',
          teamMemberCount: 3,
          teamRole: 'LEADER',
        },
      })
    )
  })
})
