import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import {
  fetchUjat1365RegistrationFormRemote,
  resolveParticipantIdForMember,
} from './ujat-1365-registration-form'

describe('fetchUjat1365RegistrationFormRemote', () => {
  beforeEach(() => {
    customInstanceMock.mockReset()
  })

  it('calls PREVIEW and DOWNLOAD as distinct modes and does not use member unmask', async () => {
    customInstanceMock.mockResolvedValue({
      programId: 1,
      participantId: 9,
      name: '홍길동',
      external1365Id: '0915123456',
      volunteerMinutes: 120,
      mode: 'PREVIEW',
    })
    await fetchUjat1365RegistrationFormRemote({
      programId: 186457,
      participantId: 9,
      mode: 'PREVIEW',
    })
    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/programs/186457/participants/9/1365-registration-form',
      method: 'POST',
      params: { mode: 'PREVIEW' },
      headers: { 'Cache-Control': 'no-store' },
    })
    customInstanceMock.mockClear()
    customInstanceMock.mockResolvedValue({ mode: 'DOWNLOAD' })
    await fetchUjat1365RegistrationFormRemote({
      programId: 186457,
      participantId: 9,
      mode: 'DOWNLOAD',
    })
    expect(customInstanceMock.mock.calls[0][0].params.mode).toBe('DOWNLOAD')
  })

  it('maps memberId to participantId and does not treat application id as participantId', () => {
    expect(
      resolveParticipantIdForMember(
        [
          { memberId: 44, participantId: 9 },
          { memberId: 55, participantId: 12 },
        ],
        '44'
      )
    ).toBe(9)
    expect(resolveParticipantIdForMember([{ memberId: 44, participantId: 9 }], '99')).toBeNull()
  })
})
