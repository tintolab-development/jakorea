import { beforeEach, describe, expect, it, vi } from 'vitest'

const { patchParticipantTextbookDeliveryRemoteMock, fetchProgramParticipantsRemoteMock } =
  vi.hoisted(() => ({
    patchParticipantTextbookDeliveryRemoteMock: vi.fn(),
    fetchProgramParticipantsRemoteMock: vi.fn(),
  }))

vi.mock('@/features/program/general/api/program-progress-api-client', () => ({
  patchParticipantTextbookDeliveryRemote: patchParticipantTextbookDeliveryRemoteMock,
  fetchProgramParticipantsRemote: fetchProgramParticipantsRemoteMock,
}))

vi.mock('./capabilities', () => ({
  shouldUseTrainedTeacherProgramsRemoteApi: () => true,
}))

import { updateTrainedTeacherOrganizationApplicationTextbookDelivery } from './organization-applications-service'

describe('updateTrainedTeacherOrganizationApplicationTextbookDelivery', () => {
  beforeEach(() => {
    patchParticipantTextbookDeliveryRemoteMock.mockReset()
    fetchProgramParticipantsRemoteMock.mockReset()
  })

  it('참여자 목록에서 participantId를 찾아 textbook-delivery PATCH를 보낸다', async () => {
    fetchProgramParticipantsRemoteMock.mockResolvedValue({
      items: [
        {
          participantId: 31001,
          organizationApplicationId: 1691599,
          participantType: 'ORGANIZATION',
        },
      ],
      totalPages: 1,
    })
    patchParticipantTextbookDeliveryRemoteMock.mockResolvedValue({
      participantId: 31001,
      textbookDeliveryStatus: 'SHIPPING',
    })

    await expect(
      updateTrainedTeacherOrganizationApplicationTextbookDelivery('186551', '1691599', 'SHIPPING')
    ).resolves.toMatchObject({ participantId: 31001, textbookDeliveryStatus: 'SHIPPING' })

    expect(fetchProgramParticipantsRemoteMock).toHaveBeenCalledWith('186551', {
      participantType: 'ORGANIZATION',
      size: 200,
      page: 0,
    })
    expect(patchParticipantTextbookDeliveryRemoteMock).toHaveBeenCalledWith('186551', '31001', {
      textbookDeliveryStatus: 'SHIPPING',
    })
  })

  it('참여자를 못 찾으면 기관 신청 id로 PATCH한다', async () => {
    fetchProgramParticipantsRemoteMock.mockResolvedValue({
      items: [],
      totalPages: 1,
    })
    patchParticipantTextbookDeliveryRemoteMock.mockResolvedValue({
      participantId: 1691599,
      textbookDeliveryStatus: 'SHIPPING',
    })

    await expect(
      updateTrainedTeacherOrganizationApplicationTextbookDelivery('186551', '1691599', 'SHIPPING')
    ).resolves.toMatchObject({ textbookDeliveryStatus: 'SHIPPING' })

    expect(patchParticipantTextbookDeliveryRemoteMock).toHaveBeenCalledWith('186551', '1691599', {
      textbookDeliveryStatus: 'SHIPPING',
    })
  })
})
