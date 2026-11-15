import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  listInterviewSlotsRemote: vi.fn(),
  createInterviewSlotRemote: vi.fn(),
  createInterviewAssignmentRemote: vi.fn(),
}))

vi.mock('@/features/program/general/api/applications-remote-capabilities', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  shouldUseApplicationsHttpRemoteApi: () => true,
}))

vi.mock('@/features/program/general/api/applications-api-client', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  listInterviewSlotsRemote: mocks.listInterviewSlotsRemote,
  createInterviewSlotRemote: mocks.createInterviewSlotRemote,
  createInterviewAssignmentRemote: mocks.createInterviewAssignmentRemote,
}))

import {
  assignGeneralIndividualInterview,
  assignGeneralVolunteerInterview,
  listGeneralInterviewSlots,
} from './admin-applications-service'
import { generalInterviewSlotsQueryKeys } from './general-applications-query-keys'

const SLOT_TIME = {
  slotDate: '2026-12-11',
  startAt: '2026-12-11T01:00:00.000Z',
  endAt: '2026-12-11T01:30:00.000Z',
}

/** 같은 일시, 대상만 다른 슬롯 두 개 + 대상 필드 없는 기존 슬롯 */
const SAME_TIME_SLOTS = [
  { interviewSlotId: 11, ...SLOT_TIME, startAt: '2026-12-11T01:00:00Z', endAt: '2026-12-11T01:30:00Z' },
  {
    interviewSlotId: 22,
    audience: 'PARTICIPANT',
    ...SLOT_TIME,
    startAt: '2026-12-11T01:00:00Z',
    endAt: '2026-12-11T01:30:00Z',
  },
]

describe('면접 슬롯 대상(audience)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createInterviewAssignmentRemote.mockResolvedValue({ interviewAssignmentId: 900 })
  })

  it('목록 조회는 audience 쿼리를 보내고 응답도 그 대상만 남긴다', async () => {
    mocks.listInterviewSlotsRemote.mockResolvedValue(SAME_TIME_SLOTS)
    const participant = await listGeneralInterviewSlots('186300', { audience: 'PARTICIPANT' })
    expect(mocks.listInterviewSlotsRemote).toHaveBeenCalledWith('186300', { audience: 'PARTICIPANT' })
    expect(participant.map(slot => slot.interviewSlotId)).toEqual([22])

    const volunteer = await listGeneralInterviewSlots('186300', { audience: 'VOLUNTEER' })
    expect(mocks.listInterviewSlotsRemote).toHaveBeenLastCalledWith('186300', {
      audience: 'VOLUNTEER',
    })
    // audience 없는 기존 슬롯 = VOLUNTEER
    expect(volunteer.map(slot => [slot.interviewSlotId, slot.audience])).toEqual([[11, 'VOLUNTEER']])
  })

  it('쿼리 키가 대상별로 갈린다', () => {
    expect(generalInterviewSlotsQueryKeys.listByAudience('1', 'PARTICIPANT')).not.toEqual(
      generalInterviewSlotsQueryKeys.listByAudience('1', 'VOLUNTEER')
    )
  })

  it('개인 참여자 배정은 같은 일시의 PARTICIPANT 슬롯만 재사용한다', async () => {
    mocks.listInterviewSlotsRemote.mockResolvedValue(SAME_TIME_SLOTS)
    const result = await assignGeneralIndividualInterview({
      programId: '186300',
      applicationId: '501',
      ...SLOT_TIME,
    })
    expect(mocks.listInterviewSlotsRemote).toHaveBeenCalledWith('186300', {
      from: SLOT_TIME.slotDate,
      to: SLOT_TIME.slotDate,
      audience: 'PARTICIPANT',
    })
    expect(mocks.createInterviewSlotRemote).not.toHaveBeenCalled()
    expect(result.interviewSlotId).toBe(22)
    expect(mocks.createInterviewAssignmentRemote).toHaveBeenCalledWith(
      expect.objectContaining({ individualApplicationId: 501, interviewSlotId: 22 })
    )
  })

  it('개인 참여자 — 같은 일시의 VOLUNTEER 슬롯만 있으면 재사용하지 않고 PARTICIPANT 슬롯을 만든다', async () => {
    mocks.listInterviewSlotsRemote.mockResolvedValue([SAME_TIME_SLOTS[0]])
    mocks.createInterviewSlotRemote.mockResolvedValue({ interviewSlotId: 33 })
    const result = await assignGeneralIndividualInterview({
      programId: '186300',
      applicationId: '501',
      ...SLOT_TIME,
    })
    expect(mocks.createInterviewSlotRemote).toHaveBeenCalledWith('186300', {
      ...SLOT_TIME,
      maxAssignCount: 1,
      exceptionSlot: false,
      audience: 'PARTICIPANT',
    })
    expect(result.interviewSlotId).toBe(33)
  })

  it('봉사자 배정은 VOLUNTEER 슬롯만 재사용하고 요청 본문은 기존과 같다(audience 생략)', async () => {
    mocks.listInterviewSlotsRemote.mockResolvedValue(SAME_TIME_SLOTS)
    const result = await assignGeneralVolunteerInterview({
      programId: '186300',
      applicationId: '701',
      ...SLOT_TIME,
    })
    expect(mocks.listInterviewSlotsRemote).toHaveBeenCalledWith('186300', {
      from: SLOT_TIME.slotDate,
      to: SLOT_TIME.slotDate,
    })
    expect(result.interviewSlotId).toBe(11)

    mocks.listInterviewSlotsRemote.mockResolvedValue([SAME_TIME_SLOTS[1]])
    mocks.createInterviewSlotRemote.mockResolvedValue({ interviewSlotId: 44 })
    await assignGeneralVolunteerInterview({ programId: '186300', applicationId: '701', ...SLOT_TIME })
    expect(mocks.createInterviewSlotRemote).toHaveBeenCalledWith('186300', {
      ...SLOT_TIME,
      maxAssignCount: 1,
      exceptionSlot: false,
    })
  })
})
