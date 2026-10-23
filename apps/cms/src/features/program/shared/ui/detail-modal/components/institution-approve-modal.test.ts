// @vitest-environment jsdom

import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import { InstitutionApproveModal } from './institution-approve-modal'

vi.mock('@/shared/ui/cms-alert-modal-provider', () => ({
  useCmsAlert: () => ({ showAlert: vi.fn() }),
}))

vi.mock('@/features/program/general/lib/program-planned-education-slots', () => ({
  fetchProgramPlannedEducationSlots: vi.fn(),
}))

vi.mock('@/features/program/general/api/applications-api-client', () => ({
  fetchOrganizationApplicationRequestedSchedulesRemote: vi.fn(async () => []),
}))

import { fetchProgramPlannedEducationSlots } from '@/features/program/general/lib/program-planned-education-slots'
import { fetchOrganizationApplicationRequestedSchedulesRemote } from '@/features/program/general/api/applications-api-client'

const fetchSlots = vi.mocked(fetchProgramPlannedEducationSlots)
const fetchRequested = vi.mocked(fetchOrganizationApplicationRequestedSchedulesRemote)

function educationSlot(
  id: number,
  overrides: Partial<ProgramScheduleResponse> = {}
): ProgramScheduleResponse {
  return {
    id,
    sessionNo: 1,
    startAt: '2026-11-02T01:00:00Z',
    endAt: '2026-11-02T03:00:00Z',
    scheduleOrigin: 'PROGRAM_DEFINED',
    scheduleRole: 'EDUCATION',
    scheduleStatus: 'ACTIVE',
    allDay: false,
    ...overrides,
  }
}

const program186266Slots = [
  educationSlot(187134, { sessionNo: undefined }),
  educationSlot(187135, {
    sessionNo: 2,
    startAt: '2026-11-09T04:30:00Z',
    endAt: '2026-11-09T07:00:00Z',
  }),
]

function renderModal(props: Partial<Parameters<typeof InstitutionApproveModal>[0]> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const onConfirm = vi.fn()
  const view = render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(InstitutionApproveModal, {
        open: true,
        schoolName: '테스트학교',
        programId: '186266',
        organizationApplicationId: '1691419',
        scheduleConfig: { preferredEducationSchedules: [] },
        onCancel: vi.fn(),
        onConfirm,
        ...props,
      }) as ReactNode
    )
  )
  return { ...view, onConfirm }
}

afterEach(() => {
  cleanup()
  fetchSlots.mockReset()
  fetchRequested.mockReset()
  fetchRequested.mockResolvedValue([])
})

describe('InstitutionApproveModal schedule sources', () => {
  it('186266 — 희망 일정이 없으면 공통 예정 일정을 골라 배정한다', async () => {
    fetchSlots.mockResolvedValue(program186266Slots)
    fetchRequested.mockResolvedValue([])
    const { onConfirm } = renderModal({
      educationScheduleMode: 'date',
      educationStructure: 'curriculum',
      sessionRound: 'multi',
    })

    expect(await screen.findByText(/신청 희망 교육 일정이 없습니다/)).toBeTruthy()
    const firstSlot = await screen.findByRole('button', {
      name: /2026\.11\.02\(월\) 10:00 ~ 12:00/,
    })
    const secondSlot = screen.getByRole('button', {
      name: /2회차 · 2026\.11\.09\(월\) 13:30 ~ 16:00/,
    })
    expect(screen.getByText('공통 교육 예정 일정')).toBeTruthy()
    expect(screen.queryByText('00:00')).toBeNull()

    const approve = screen.getByRole('button', { name: '승인' }) as HTMLButtonElement
    await waitFor(() => expect(approve.disabled).toBe(true))
    fireEvent.click(firstSlot)
    fireEvent.click(secondSlot)
    await waitFor(() => expect(approve.disabled).toBe(false))
    fireEvent.click(approve)
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).toMatchObject({
      slots: [{ scheduleId: 187134 }, { scheduleId: 187135 }],
    })
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('selectedScheduleId')
  })

  it('일정형·복수 회차는 교육 진행 일정을 선택 없이 모두 배정한다', async () => {
    fetchSlots.mockResolvedValue(program186266Slots)
    fetchRequested.mockResolvedValue([])
    const { onConfirm } = renderModal({
      educationScheduleMode: 'date',
      educationStructure: 'schedule',
      sessionRound: 'multi',
    })

    expect(await screen.findByText(/담당 교사에게 승인 알림이 발송됩니다/)).toBeTruthy()
    expect(screen.queryByText(/교육 진행 일정이 자동으로 배정되며/)).toBeNull()
    expect(await screen.findByText(/2026\.11\.02\(월\) 10:00 ~ 12:00/)).toBeTruthy()
    expect(screen.getByText('2026.11.09(월) 13:30 ~ 16:00')).toBeTruthy()
    expect(screen.queryByText(/2회차/)).toBeNull()
    expect(screen.getAllByText('교육 진행 일정')).toHaveLength(1)
    expect(screen.queryByText('행사 일정 01')).toBeNull()
    expect(screen.queryByText('행사 일정 02')).toBeNull()
    expect(screen.queryByRole('button', { name: /11월 2일/ })).toBeNull()
    expect(screen.queryByText('신청 희망 교육 일정이 없습니다')).toBeNull()
    expect(screen.queryByText('00:00')).toBeNull()

    const approve = screen.getByRole('button', { name: '승인' }) as HTMLButtonElement
    await waitFor(() => expect(approve.disabled).toBe(false))
    fireEvent.click(approve)
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).toMatchObject({
      slots: [{ scheduleId: 187134 }, { scheduleId: 187135 }],
    })
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('selectedScheduleId')
  })

  it('일정형·복수 회차의 교육 진행 일정이 한 건이면 selectedScheduleId만 보낸다', async () => {
    fetchSlots.mockResolvedValue([program186266Slots[0]!])
    const { onConfirm } = renderModal({
      educationScheduleMode: 'date',
      educationStructure: 'schedule',
      sessionRound: 'multi',
    })

    expect(await screen.findByText('교육 진행 일정')).toBeTruthy()
    expect(await screen.findByText(/2026\.11\.02\(월\) 10:00 ~ 12:00/)).toBeTruthy()
    const approve = screen.getByRole('button', { name: '승인' }) as HTMLButtonElement
    await waitFor(() => expect(approve.disabled).toBe(false))
    fireEvent.click(approve)
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).toMatchObject({ selectedScheduleId: 187134 })
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('slots')
  })

  it('일정형·복수 회차에 교육 진행 일정이 없으면 승인할 수 없다', async () => {
    fetchSlots.mockResolvedValue([])
    const { onConfirm } = renderModal({
      educationScheduleMode: 'date',
      educationStructure: 'schedule',
      sessionRound: 'multi',
    })

    expect(await screen.findByText('등록된 교육 진행 일정이 없습니다.')).toBeTruthy()
    const approve = screen.getByRole('button', { name: '승인' }) as HTMLButtonElement
    await waitFor(() => expect(approve.disabled).toBe(true))
    fireEvent.click(approve)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('날짜 지정에서 희망 scheduleId가 공통 슬롯과 같으면 그 id만 승인한다', async () => {
    fetchSlots.mockResolvedValue(program186266Slots)
    const { onConfirm } = renderModal({
      organizationApplicationId: undefined,
      educationScheduleMode: 'date',
      educationStructure: 'schedule',
      sessionRound: 'single',
      scheduleConfig: {
        preferredEducationSchedules: [
          {
            scheduleId: 187134,
            label: '11월 2일 오전',
            startAt: '2026-11-02T01:00:00Z',
            endAt: '2026-11-02T03:00:00Z',
          },
        ],
      },
    })

    const preferredCard = await screen.findByRole('button', { name: /2026\.11\.02/ })
    const approve = screen.getByRole('button', { name: '승인' }) as HTMLButtonElement
    await waitFor(() => expect(approve.disabled).toBe(true))
    fireEvent.click(preferredCard)
    await waitFor(() => expect(approve.disabled).toBe(false))
    expect(preferredCard.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: '승인' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).toMatchObject({ selectedScheduleId: 187134 })
  })

  it('교육받은 교사 preferredScheduleBlocks도 일반 기관 일정 카드와 동일하게 배정한다', async () => {
    fetchSlots.mockResolvedValue([
      educationSlot(187134, {
        sessionNo: 2,
        startAt: '2026-04-20T00:30:00Z',
        endAt: '2026-04-20T03:20:00Z',
      }),
    ])
    const { onConfirm } = renderModal({
      scheduleConfig: {
        preferredScheduleBlocks: [
          {
            preferenceRank: 1,
            date: '2026-04-20',
            dayOfWeek: '월',
            sessionCount: 1,
            sessionTimes: [],
            scheduleId: 187134,
            startAt: '2026-04-20T00:30:00Z',
            endAt: '2026-04-20T03:20:00Z',
            round: 2,
            label: '2026.04.20(월) 09:30 ~ 12:20',
            scheduleStatus: 'MATCHED',
          },
        ],
      },
      educationScheduleMode: 'date',
      educationStructure: 'curriculum',
      sessionRound: 'single',
    })

    await waitFor(() => expect(fetchSlots).toHaveBeenCalled())
    const choice = await screen.findByRole('button', {
      name: /2026\.\s*04\.\s*20\(월\) 09:30 ~ 12:20/,
    })
    expect(screen.getByText('2차시')).toBeTruthy()
    expect((choice as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(choice)
    await waitFor(() => expect(choice.getAttribute('aria-pressed')).toBe('true'))
    const approve = screen.getByRole('button', { name: '승인' }) as HTMLButtonElement
    await waitFor(() => expect(approve.disabled).toBe(false))
    fireEvent.click(approve)
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).toMatchObject({ selectedScheduleId: 187134 })
  })

  it('교육받은 교사 기간형도 매칭된 일정 id를 선택 확정한다', async () => {
    fetchSlots.mockResolvedValue([])
    const { onConfirm } = renderModal({
      scheduleConfig: {
        preferredScheduleBlocks: [
          {
            preferenceRank: 1,
            date: '2026-04-20',
            dayOfWeek: '월',
            sessionCount: 1,
            sessionTimes: [],
            scheduleId: 187134,
            startAt: '2026-04-20T00:30:00Z',
            endAt: '2026-04-20T03:20:00Z',
            round: 2,
            label: '2026.04.20(월) 09:30 ~ 12:20',
            scheduleStatus: 'MATCHED',
          },
        ],
      },
      educationScheduleMode: 'period',
      isTrainedTeacherProgram: true,
      applicationStatus: 'SUBMITTED',
      educationStructure: 'schedule',
      sessionRound: 'single',
    })

    const choice = await screen.findByRole('button', {
      name: /2026\.\s*04\.\s*20\(월\) 09:30 ~ 12:20/,
    })
    fireEvent.click(choice)
    const approve = screen.getByRole('button', { name: '승인' }) as HTMLButtonElement
    await waitFor(() => expect(approve.disabled).toBe(false))
    fireEvent.click(approve)
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).toMatchObject({
      preferredScheduleRank: 1,
    })
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('selectedScheduleId')
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('slots')
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('requestedScheduleId')
  })

  it('교육받은 교사 기간형 UNMATCHED 희망 일정은 rank로 선택 승인한다', async () => {
    fetchSlots.mockResolvedValue([
      educationSlot(187157, {
        startAt: '2026-11-05T00:00:00+09:00',
        endAt: '2026-11-12T00:00:00+09:00',
      }),
    ])
    const { onConfirm } = renderModal({
      scheduleConfig: {
        preferredScheduleBlocks: [
          {
            preferenceRank: 1,
            date: '2026-11-09',
            dayOfWeek: '월',
            sessionCount: 1,
            sessionTimes: [
              { sessionIndex: 1, classPeriod: '1교시', timeRange: '01:00 ~ 02:00' },
            ],
            scheduleId: null,
            scheduleStatus: 'UNMATCHED',
          },
          {
            preferenceRank: 2,
            date: '2026-11-10',
            dayOfWeek: '화',
            sessionCount: 1,
            sessionTimes: [
              { sessionIndex: 1, classPeriod: '2교시', timeRange: '03:00 ~ 04:00' },
            ],
            scheduleId: null,
            scheduleStatus: 'UNMATCHED',
          },
          {
            preferenceRank: 3,
            date: '2026-11-11',
            dayOfWeek: '수',
            sessionCount: 1,
            sessionTimes: [
              { sessionIndex: 1, classPeriod: '3교시', timeRange: '05:00 ~ 06:00' },
            ],
            scheduleId: null,
            scheduleStatus: 'UNMATCHED',
          },
        ],
      },
      educationScheduleMode: 'period',
      isTrainedTeacherProgram: true,
      applicationStatus: 'SUBMITTED',
      educationStructure: 'curriculum',
      sessionRound: 'single',
    })

    const firstChoice = await screen.findByRole('button', { name: /2026\.\s*11\.\s*09/ })
    const secondChoice = await screen.findByRole('button', { name: /2026\.\s*11\.\s*10/ })
    const thirdChoice = await screen.findByRole('button', { name: /2026\.\s*11\.\s*11/ })
    expect(screen.queryByText('승인 시 실제 일정 생성')).toBeNull()
    expect(screen.queryByText('승인 시 선택한 희망 일정이 기관별 교육 일정으로 생성됩니다.')).toBeNull()
    expect((firstChoice as HTMLButtonElement).disabled).toBe(false)
    expect((secondChoice as HTMLButtonElement).disabled).toBe(false)
    expect((thirdChoice as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(firstChoice)
    await waitFor(() => {
      expect(firstChoice.className).toContain('institution-approve-modal__schedule-card--selected')
    })
    expect(screen.getByText('배정된 일정')).toBeTruthy()
    expect(screen.getByText('교육은 한 개의 일정에만 배정할 수 있습니다.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '승인' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).toMatchObject({ preferredScheduleRank: 1 })
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('selectedScheduleId')
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('slots')
  })

  it('교육받은 교사 기간형은 선택 없이 일정 미확정 승인할 수 있다', async () => {
    fetchSlots.mockResolvedValue([])
    const { onConfirm } = renderModal({
      scheduleConfig: {
        preferredScheduleBlocks: [
          {
            preferenceRank: 1,
            date: '2026-11-09',
            dayOfWeek: '월',
            sessionCount: 1,
            sessionTimes: [],
            scheduleId: null,
            scheduleStatus: 'UNMATCHED',
          },
        ],
      },
      educationScheduleMode: 'period',
      isTrainedTeacherProgram: true,
      applicationStatus: 'SUBMITTED',
      educationStructure: 'curriculum',
      sessionRound: 'single',
    })

    const approve = screen.getByRole('button', { name: '승인' }) as HTMLButtonElement
    await waitFor(() => expect(approve.disabled).toBe(false))
    fireEvent.click(approve)
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('preferredScheduleRank')
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('selectedScheduleId')
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('slots')
  })

  it('교육받은 교사 복수 회차는 서버가 매칭한 preferredScheduleBlocks만 배정한다', async () => {
    fetchSlots.mockResolvedValue([
      program186266Slots[0]!,
      program186266Slots[1]!,
      educationSlot(187136, {
        sessionNo: 3,
        startAt: '2026-11-16T04:30:00Z',
        endAt: '2026-11-16T07:00:00Z',
      }),
    ])
    const { onConfirm } = renderModal({
      scheduleConfig: {
        preferredScheduleBlocks: [
          {
            preferenceRank: 2,
            date: '2026-11-09',
            dayOfWeek: '월',
            sessionCount: 1,
            sessionTimes: [{ sessionIndex: 1, classPeriod: '1차시', timeRange: '13:30 ~ 16:00' }],
            scheduleId: 187135,
            scheduleStatus: 'MATCHED',
            round: 2,
          },
          {
            preferenceRank: 1,
            date: '2026-11-02',
            dayOfWeek: '월',
            sessionCount: 1,
            sessionTimes: [{ sessionIndex: 1, classPeriod: '1차시', timeRange: '10:00 ~ 12:00' }],
            scheduleId: 187134,
            scheduleStatus: 'MATCHED',
            round: 1,
          },
        ],
      },
      educationScheduleMode: 'date',
      educationStructure: 'schedule',
      sessionRound: 'multi',
    })

    const first = await screen.findByRole('button', { name: /2026\.\s*11\.\s*02/ })
    const second = await screen.findByRole('button', { name: /2026\.\s*11\.\s*09/ })
    expect((first as HTMLButtonElement).disabled).toBe(false)
    expect((second as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByText('교육 진행 일정')).toBeNull()
    fireEvent.click(first)
    fireEvent.click(second)
    fireEvent.click(screen.getByRole('button', { name: '승인' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).toMatchObject({
      slots: [{ scheduleId: 187134 }, { scheduleId: 187135 }],
    })
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('selectedScheduleId')
  })

  it('교육받은 교사 MATCHED가 아닌 일정은 비활성으로 보이고 무본문 승인을 유지한다', async () => {
    fetchSlots.mockResolvedValue([])
    const { onConfirm } = renderModal({
      scheduleConfig: {
        preferredScheduleBlocks: [
          {
            preferenceRank: 1,
            date: '2026-04-20',
            dayOfWeek: '월',
            sessionCount: 2,
            sessionTimes: [
              { sessionIndex: 1, classPeriod: '1차시', timeRange: '09:30 ~ 10:50' },
              { sessionIndex: 2, classPeriod: '2차시', timeRange: '11:00 ~ 12:20' },
            ],
            scheduleId: null,
            scheduleStatus: 'UNMATCHED',
            round: 2,
          },
          {
            preferenceRank: 2,
            date: '2026-04-27',
            dayOfWeek: '월',
            sessionCount: 1,
            sessionTimes: [{ sessionIndex: 1, classPeriod: '1차시', timeRange: '13:00 ~ 15:50' }],
            scheduleId: 187135,
            scheduleStatus: 'INACTIVE_OR_DELETED',
            round: 1,
          },
        ],
      },
      educationScheduleMode: 'date',
      educationStructure: 'curriculum',
      sessionRound: 'single',
    })

    const choice = await screen.findByRole('button', { name: /2026\.\s*04\.\s*20/ })
    expect((choice as HTMLButtonElement).disabled).toBe(true)
    const inactiveChoice = await screen.findByRole('button', { name: /2026\.\s*04\.\s*27/ })
    expect((inactiveChoice as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/서버가 프로그램 운영 일정과 연결하지 못한 희망 일정/)).toBeTruthy()
    expect(screen.getByText(/종료되었거나 삭제된 일정/)).toBeTruthy()
    const approve = screen.getByRole('button', { name: '승인' }) as HTMLButtonElement
    await waitFor(() => expect(approve.disabled).toBe(false))
    fireEvent.click(approve)
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('selectedScheduleId')
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('slots')
  })

  it('기간 지정 단일 회차는 희망 일정 행 id 1건만 승인하고 공통 슬롯 id는 보내지 않는다', async () => {
    fetchSlots.mockResolvedValue(program186266Slots)
    fetchRequested.mockResolvedValue([
      {
        id: 184944,
        preferenceOrder: 1,
        requestedDate: '2026-11-05',
        resolvedScheduleId: 187141,
        sessionCount: 1,
        sessionTimes: [],
      },
      {
        id: 184945,
        preferenceOrder: 2,
        requestedDate: '2026-11-13',
        resolvedScheduleId: null,
        sessionCount: 1,
        sessionTimes: [],
      },
    ] as never)
    const { onConfirm } = renderModal({
      educationScheduleMode: 'period',
      educationStructure: 'schedule',
      sessionRound: 'single',
      scheduleConfig: {
        preferredEducationSchedules: [
          { label: '2026-11-05', startAt: '2026-11-05', endAt: '2026-11-05' },
        ],
      },
    })

    expect(screen.queryByText('공통 교육 예정 일정')).toBeNull()
    const firstChoice = await screen.findByRole('button', { name: /2026\.11\.05/ })
    const secondChoice = await screen.findByRole('button', { name: /2026\.11\.13/ })
    expect((secondChoice as HTMLButtonElement).disabled).toBe(false)
    const approve = screen.getByRole('button', { name: '승인' }) as HTMLButtonElement
    await waitFor(() => expect(approve.disabled).toBe(true))
    fireEvent.click(firstChoice)
    await waitFor(() => expect(approve.disabled).toBe(false))
    fireEvent.click(approve)
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).toMatchObject({ requestedScheduleId: 184944 })
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('selectedScheduleId')
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('slots')
  })

  it('커리큘럼 기간형은 희망 일정 행 id를 승인 본문에 넣지 않는다', async () => {
    fetchSlots.mockResolvedValue(program186266Slots)
    fetchRequested.mockResolvedValue([
      {
        id: 184944,
        preferenceOrder: 1,
        requestedDate: '2026-11-02',
        resolvedScheduleId: null,
        sessionCount: 1,
        sessionTimes: [],
      },
    ] as never)
    const { onConfirm } = renderModal({
      educationScheduleMode: 'period',
      educationStructure: 'curriculum',
      sessionRound: 'single',
      scheduleConfig: {
        preferredEducationSchedules: [
          { label: '2026-11-02', startAt: '2026-11-02', endAt: '2026-11-02' },
        ],
      },
    })

    const preferredCard = await screen.findByRole('button', { name: /2026\.11\.02/ })
    fireEvent.click(preferredCard)
    fireEvent.click(screen.getByRole('button', { name: '승인' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('requestedScheduleId')
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('selectedScheduleId')
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('slots')
  })
})
