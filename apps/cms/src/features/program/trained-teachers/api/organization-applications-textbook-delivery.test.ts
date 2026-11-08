import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

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

function axiosNotFound() {
  const error = new axios.AxiosError('Not Found')
  error.response = {
    status: 404,
    data: { error: { code: 'PARTICIPANT_NOT_FOUND' } },
    statusText: 'Not Found',
    headers: {},
    config: {} as never,
  }
  return error
}

describe('updateTrainedTeacherOrganizationApplicationTextbookDelivery', () => {
  beforeEach(() => {
    patchParticipantTextbookDeliveryRemoteMock.mockReset()
    fetchProgramParticipantsRemoteMock.mockReset()
  })

  it('신청 id와 맞는 ORGANIZATION 참여자 participantId로 PATCH한다', async () => {
    fetchProgramParticipantsRemoteMock.mockResolvedValue({
      items: [
        {
          participantId: 1695085,
          organizationApplicationId: 1691592,
          sourceApplicationId: 1691592,
          participantType: 'ORGANIZATION',
        },
        {
          participantId: 31001,
          organizationApplicationId: 1691599,
          sourceApplicationId: 1691599,
          participantType: 'ORGANIZATION',
        },
      ],
      totalPages: 1,
    })
    patchParticipantTextbookDeliveryRemoteMock.mockResolvedValue({
      participantId: 31001,
      programId: 186551,
      organizationApplicationId: 1691599,
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

  it('캐시된 participantId가 있으면 참여자 목록을 다시 조회하지 않는다', async () => {
    patchParticipantTextbookDeliveryRemoteMock.mockResolvedValue({
      participantId: 31001,
      textbookDeliveryStatus: 'DELIVERED',
    })

    await expect(
      updateTrainedTeacherOrganizationApplicationTextbookDelivery(
        '186551',
        '1691599',
        'DELIVERED',
        '31001'
      )
    ).resolves.toMatchObject({ textbookDeliveryStatus: 'DELIVERED' })

    expect(fetchProgramParticipantsRemoteMock).not.toHaveBeenCalled()
    expect(patchParticipantTextbookDeliveryRemoteMock).toHaveBeenCalledWith('186551', '31001', {
      textbookDeliveryStatus: 'DELIVERED',
    })
  })

  it('캐시 id가 404 PARTICIPANT_NOT_FOUND이면 목록에서 다시 찾아 PATCH한다', async () => {
    patchParticipantTextbookDeliveryRemoteMock
      .mockRejectedValueOnce(axiosNotFound())
      .mockResolvedValueOnce({
        participantId: 31002,
        textbookDeliveryStatus: 'SHIPPING',
      })
    fetchProgramParticipantsRemoteMock.mockResolvedValue({
      items: [
        {
          participantId: 31002,
          organizationApplicationId: 1691599,
          sourceApplicationId: 1691599,
        },
      ],
      totalPages: 1,
    })

    await expect(
      updateTrainedTeacherOrganizationApplicationTextbookDelivery(
        '186551',
        '1691599',
        'SHIPPING',
        '1695085'
      )
    ).resolves.toMatchObject({ participantId: 31002, textbookDeliveryStatus: 'SHIPPING' })

    expect(patchParticipantTextbookDeliveryRemoteMock).toHaveBeenNthCalledWith(
      2,
      '186551',
      '31002',
      { textbookDeliveryStatus: 'SHIPPING' }
    )
  })

  it('신청 id와 같은 participantId만 있고 신청 매칭이 없으면 PATCH하지 않는다', async () => {
    fetchProgramParticipantsRemoteMock.mockResolvedValue({
      items: [
        {
          participantId: 1691599,
          organizationApplicationId: 1691592,
          sourceApplicationId: 1691592,
        },
      ],
      totalPages: 1,
    })

    await expect(
      updateTrainedTeacherOrganizationApplicationTextbookDelivery('186551', '1691599', 'SHIPPING')
    ).rejects.toThrow('기관 참여자를 찾지 못했습니다')

    expect(patchParticipantTextbookDeliveryRemoteMock).not.toHaveBeenCalled()
  })
})
