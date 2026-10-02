import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import customInstance from '@/shared/api/orval-mutator'
import {
  createProgramInstructorParticipantRemote,
  createProgramParticipantRemote,
  patchParticipantTextbookDeliveryRemote,
  putParticipantAssignedOrganizationsRemote,
} from './program-progress-api-client'

describe('createProgramInstructorParticipantRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('INSTRUCTOR participant 등록 body만 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      participantId: 1,
      programId: 170002,
      memberId: 190010,
      participantType: 'INSTRUCTOR',
      participantStatus: 'APPROVED',
      sourceApplicationId: null,
    })

    await createProgramInstructorParticipantRemote('170002', {
      participantType: 'INSTRUCTOR',
      memberId: 190010,
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/170002/participants',
      method: 'POST',
      data: { participantType: 'INSTRUCTOR', memberId: 190010 },
    })
  })
})

describe('createProgramParticipantRemote volunteer', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('VOLUNTEER participant 등록 body에 volunteerKind를 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      participantId: 41001,
      programId: 168001,
      memberId: 190033,
      participantType: 'VOLUNTEER',
      volunteerKind: 'GENERAL',
    })

    await createProgramParticipantRemote('168001', {
      participantType: 'VOLUNTEER',
      memberId: 190033,
      volunteerKind: 'GENERAL',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/168001/participants',
      method: 'POST',
      data: { participantType: 'VOLUNTEER', memberId: 190033, volunteerKind: 'GENERAL' },
    })
  })
})

describe('patchParticipantTextbookDeliveryRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('교재 배송 PATCH body만 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      participantId: 31001,
      textbookDeliveryStatus: 'DELIVERED',
    })

    await patchParticipantTextbookDeliveryRemote('168001', '31001', {
      textbookDeliveryStatus: 'DELIVERED',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/168001/participants/31001/textbook-delivery',
      method: 'PATCH',
      data: { textbookDeliveryStatus: 'DELIVERED' },
    })
  })
})

describe('putParticipantAssignedOrganizationsRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('기관형 봉사 배정 PUT body만 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({ revision: 2 })

    await putParticipantAssignedOrganizationsRemote('168001', '41001', {
      organizationApplicationIds: [8801, 8802],
      expectedRevision: 0,
      reason: '봉사 배정',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/168001/participants/41001/assigned-organizations',
      method: 'PUT',
      data: {
        organizationApplicationIds: [8801, 8802],
        expectedRevision: 0,
        reason: '봉사 배정',
      },
    })
  })
})
