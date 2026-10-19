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

    expect(
      await screen.findByText(/신청 희망 교육 일정이 없습니다/)
    ).toBeTruthy()
    const firstSlot = await screen.findByRole('button', { name: /2026\. 11\. 02\(월\) 10:00 ~ 12:00/ })
    const secondSlot = screen.getByRole('button', { name: /2회차 · 2026\. 11\. 09\(월\) 13:30 ~ 16:00/ })
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
    expect(await screen.findByText(/2026\. 11\. 02\(월\) 10:00 ~ 12:00/)).toBeTruthy()
    expect(screen.getByText('2026. 11. 09(월) 13:30 ~ 16:00')).toBeTruthy()
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
    expect(await screen.findByText(/2026\. 11\. 02\(월\) 10:00 ~ 12:00/)).toBeTruthy()
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
          { scheduleId: 187134, label: '11월 2일 오전', startAt: '2026-11-02T01:00:00Z', endAt: '2026-11-02T03:00:00Z' },
        ],
      },
    })

    const preferredCard = await screen.findByRole('button', { name: /2026\. 11\. 02/ })
    const approve = screen.getByRole('button', { name: '승인' }) as HTMLButtonElement
    await waitFor(() => expect(approve.disabled).toBe(true))
    fireEvent.click(preferredCard)
    await waitFor(() => expect(approve.disabled).toBe(false))
    expect(preferredCard.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: '승인' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).toMatchObject({ selectedScheduleId: 187134 })
  })

  it('기간 지정 희망일은 공통 슬롯과 같은 날짜여도 배정 id를 만들지 않는다', async () => {
    fetchSlots.mockResolvedValue(program186266Slots)
    const { onConfirm } = renderModal({
      organizationApplicationId: undefined,
      educationScheduleMode: 'period',
      sessionRound: 'single',
      scheduleConfig: {
        preferredEducationSchedules: [
          { label: '2026-11-02', startAt: '2026-11-02', endAt: '2026-11-02' },
        ],
      },
    })

    expect(screen.queryByText(/기간 지정 희망일은 프로그램 공통 예정 슬롯과 매칭하지 않습니다/)).toBeNull()
    expect(screen.queryByText('공통 교육 예정 일정')).toBeNull()
    expect(screen.queryByText(/26년 11월 2일/)).toBeNull()
    const preferredCard = await screen.findByRole('button', { name: /2026\. 11\. 02/ })
    expect((preferredCard as HTMLButtonElement).disabled).toBe(false)
    const approve = screen.getByRole('button', { name: '승인' }) as HTMLButtonElement
    await waitFor(() => expect(approve.disabled).toBe(true))
    fireEvent.click(preferredCard)
    await waitFor(() => expect(approve.disabled).toBe(false))
    expect(preferredCard.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(approve)
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('selectedScheduleId')
    expect(onConfirm.mock.calls[0]?.[0]).not.toHaveProperty('slots')
  })
})
