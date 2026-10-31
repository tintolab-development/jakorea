// @vitest-environment jsdom

import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ProgramEducationSlotResponse } from '@/shared/api/generated/dashboard/schemas/programEducationSlotResponse'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import {
  IndividualApproveScopeModal,
  IndividualBulkApproveScopeModal,
} from './individual-approve-scope-modal'

vi.mock('@/shared/ui/cms-alert-modal-provider', () => ({
  useCmsAlert: () => ({ showAlert: vi.fn() }),
}))

vi.mock('@/features/program/general/api/program-schedules-api-client', () => ({
  fetchAdminProgramEducationSlotsRemote: vi.fn(),
}))

import { fetchAdminProgramEducationSlotsRemote } from '@/features/program/general/api/program-schedules-api-client'

const fetchSlots = vi.mocked(fetchAdminProgramEducationSlotsRemote)

function educationSlot(
  scheduleId: number,
  overrides: Partial<ProgramEducationSlotResponse> = {}
): ProgramEducationSlotResponse {
  return {
    scheduleId,
    sessionNo: scheduleId,
    startAt: '2026-11-05T00:00:00Z',
    endAt: '2026-11-05T01:00:00Z',
    allDay: false,
    educationSlotKey: `general-common-line:${scheduleId}`,
    scheduleRole: 'EDUCATION',
    scheduleStatus: 'ACTIVE',
    scheduleOrigin: 'PROGRAM_DEFINED',
    ...overrides,
  }
}

function preferred(scheduleId: number | null, label?: string): PreferredEducationSchedule {
  return {
    scheduleId,
    round: 1,
    startAt: '2026-11-05T00:00:00Z',
    endAt: '2026-11-05T01:00:00Z',
    label: label ?? null,
  }
}

function programOf(structure: 'curriculum' | 'schedule', round: 'single' | 'multi') {
  return {
    generalProgramEducationStructure: structure,
    generalProgramSessionRound: round,
    generalCommonInfo: { educationScheduleMode: 'date' as const },
  }
}

function renderSingle(
  props: Partial<Parameters<typeof IndividualApproveScopeModal>[0]>
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onConfirm = vi.fn()
  render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(IndividualApproveScopeModal, {
        open: true,
        participantName: '김참여자',
        programId: '168005',
        program: programOf('curriculum', 'single'),
        preferredEducationSchedules: [preferred(168351, '26년 11월 5일')],
        onCancel: vi.fn(),
        onConfirm,
        ...props,
      }) as ReactNode
    )
  )
  return { onConfirm }
}

function submitApproval() {
  fireEvent.click(screen.getByRole('button', { name: '승인' }))
}

async function submitWithReason() {
  fireEvent.change(screen.getByPlaceholderText('승인 사유를 입력해 주세요.'), {
    target: { value: '교육 일정 확정' },
  })
  submitApproval()
}

afterEach(() => {
  cleanup()
  fetchSlots.mockReset()
})

describe('IndividualApproveScopeModal', () => {
  it('CURRICULUM / SINGLE approves the one preferred schedule', async () => {
    fetchSlots.mockResolvedValue([educationSlot(168351), educationSlot(168352, { sessionNo: 2 })])
    const { onConfirm } = renderSingle({})
    await screen.findByRole('button', { name: /^2026\.11\.05\(목\)$/ })
    expect(screen.getByText('프로그램 신청 승인 안내')).toBeTruthy()
    expect(screen.getByText(/김참여자/)).toBeTruthy()
    expect(screen.getByText(/회원에게 승인 알림이 발송됩니다/)).toBeTruthy()
    expect(screen.getByText('배정된 일정')).toBeTruthy()
    expect(screen.queryByText('교육 진행 예정일')).toBeNull()
    submitApproval()
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0].confirmedScheduleIds).toEqual([168351])
    expect(onConfirm.mock.calls[0]?.[0].expectedScopeRevision).toBe(0)
    expect(onConfirm.mock.calls[0]?.[0].reason).toBe('교육 일정 확정')
  })

  it('volunteer CURRICULUM / SINGLE keeps every selected preferred schedule', async () => {
    fetchSlots.mockResolvedValue([
      educationSlot(1, { sessionNo: 1 }),
      educationSlot(2, { sessionNo: 2, startAt: '2026-11-06T00:00:00Z' }),
    ])
    const { onConfirm } = renderSingle({
      scheduleAssignmentAudience: 'volunteer',
      preferredEducationSchedules: [
        preferred(1, '첫째 일정'),
        { ...preferred(2, '둘째 일정'), round: 2, startAt: '2026-11-06T00:00:00Z' },
      ],
    })
    const first = await screen.findByRole('button', { name: /첫째 일정/ })
    const second = screen.getByRole('button', { name: /둘째 일정/ })
    fireEvent.click(first)
    fireEvent.click(second)
    expect(first.getAttribute('aria-pressed')).toBe('true')
    expect(second.getAttribute('aria-pressed')).toBe('true')
    submitApproval()
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0].confirmedScheduleIds).toEqual([1, 2])
  })

  it('CURRICULUM / SINGLE replaces the previous choice so two ids are not submitted', async () => {
    fetchSlots.mockResolvedValue([
      educationSlot(1, { sessionNo: 1 }),
      educationSlot(2, { sessionNo: 2, startAt: '2026-11-06T00:00:00Z' }),
    ])
    const { onConfirm } = renderSingle({
      preferredEducationSchedules: [
        preferred(1, '첫째 일정'),
        { ...preferred(2, '둘째 일정'), round: 2, startAt: '2026-11-06T00:00:00Z' },
      ],
    })
    const first = await screen.findByRole('button', { name: /첫째 일정/ })
    const second = screen.getByRole('button', { name: /둘째 일정/ })
    fireEvent.click(first)
    fireEvent.click(second)
    expect(second.getAttribute('aria-pressed')).toBe('true')
    expect(first.getAttribute('aria-pressed')).toBe('false')
    submitApproval()
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0].confirmedScheduleIds).toEqual([2])
  })

  it('CURRICULUM / MULTI sends every selected preferred schedule', async () => {
    fetchSlots.mockResolvedValue([educationSlot(21), educationSlot(22, { sessionNo: 2 })])
    const { onConfirm } = renderSingle({
      program: programOf('curriculum', 'multi'),
      preferredEducationSchedules: [
        preferred(21, '첫째 일정'),
        { ...preferred(22, '둘째 일정'), round: 2 },
      ],
    })
    fireEvent.click(await screen.findByRole('button', { name: /첫째 일정/ }))
    fireEvent.click(screen.getByRole('button', { name: /둘째 일정/ }))
    expect(screen.getByText('교육은 여러 개의 일정에 배정할 수 있습니다.')).toBeTruthy()
    expect(screen.getByText('배정된 일정')).toBeTruthy()
    submitApproval()
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0].confirmedScheduleIds).toEqual([21, 22])
  })

  it('SCHEDULE / SINGLE approves one preferred schedule', async () => {
    fetchSlots.mockResolvedValue([educationSlot(168371)])
    const { onConfirm } = renderSingle({
      programId: '168007',
      program: programOf('schedule', 'single'),
      preferredEducationSchedules: [preferred(168371, '일정형 단일')],
    })
    await screen.findByRole('button', { name: /^일정형 단일$/ })
    submitApproval()
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0].confirmedScheduleIds).toEqual([168371])
  })

  it('SCHEDULE / MULTI hides 배정일 and submits every program-defined slot', async () => {
    fetchSlots.mockResolvedValue([
      educationSlot(31, { sessionNo: 1 }),
      educationSlot(32, { sessionNo: 2 }),
    ])
    const { onConfirm } = renderSingle({
      program: programOf('schedule', 'multi'),
      preferredEducationSchedules: [],
    })
    await waitFor(() =>
      expect((screen.getByRole('button', { name: '승인' }) as HTMLButtonElement).disabled).toBe(
        false
      )
    )
    expect(screen.queryByText('배정일')).toBeNull()
    expect(screen.queryByText('배정된 일정')).toBeNull()
    expect(screen.queryByText('교육 일정을 지정해주세요.')).toBeNull()
    expect(screen.queryByText('교육 진행 예정일')).toBeNull()
    submitApproval()
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0].confirmedScheduleIds).toEqual([31, 32])
  })

  it('does not enable approval for a line label without scheduleId', async () => {
    fetchSlots.mockResolvedValue([educationSlot(51)])
    renderSingle({
      preferredEducationSchedules: [preferred(null, 'line:1')],
    })
    expect((await screen.findAllByText('신청 희망 기간')).length).toBeGreaterThan(0)
    expect((screen.getByRole('button', { name: '승인' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: /^line:1$/ })).toBeNull()
  })

  it('keeps a period window informational and approves only the matched slot', async () => {
    fetchSlots.mockResolvedValue([educationSlot(168385)])
    const { onConfirm } = renderSingle({
      program: programOf('curriculum', 'multi'),
      preferredEducationSchedules: [
        {
          ...preferred(null, '11월 희망 기간'),
          startAt: '2026-11-01T00:00:00Z',
          endAt: '2026-11-30T00:00:00Z',
          unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH',
        },
        { ...preferred(168385, '매칭 슬롯'), round: 2 },
      ],
    })
    expect((await screen.findAllByText('신청 희망 기간')).length).toBeGreaterThan(0)
    expect(
      (screen.getByRole('button', { name: /신청 희망 기간/ }) as HTMLButtonElement).disabled
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /매칭 슬롯/ }))
    submitApproval()
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0].confirmedScheduleIds).toEqual([168385])
  })

  it('highlights rejected schedule cards and deselects them after 409', async () => {
    fetchSlots.mockResolvedValue([educationSlot(168351)])
    const { onConfirm } = renderSingle({})
    onConfirm.mockResolvedValue({ rejectedScheduleIds: [168351] })
    const card = await screen.findByRole('button', { name: /^2026\.11\.05\(목\)$/ })
    expect(card.getAttribute('aria-pressed')).toBe('true')
    submitApproval()
    await waitFor(() => {
      expect(card.className).toContain('rejected')
      expect(card.getAttribute('aria-pressed')).toBe('false')
    })
  })

  it('disables approval when education slots are empty', async () => {
    fetchSlots.mockResolvedValue([])
    renderSingle({})
    expect(
      (await screen.findAllByText(/연결되지 않아|교육 일정이 없습니다/)).length
    ).toBeGreaterThan(0)
    await waitFor(() =>
      expect((screen.getByRole('button', { name: '승인' }) as HTMLButtonElement).disabled).toBe(true)
    )
  })
})

describe('IndividualBulkApproveScopeModal', () => {
  it('keeps a different schedule list for each applicant', async () => {
    fetchSlots.mockResolvedValue([educationSlot(123), educationSlot(124, { sessionNo: 2 })])
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const onConfirm = vi.fn()
    render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(IndividualBulkApproveScopeModal, {
          open: true,
          programId: '168006',
          program: programOf('curriculum', 'multi'),
          applicants: [
            {
              id: '12345',
              name: '김하나',
              preferredEducationSchedules: [preferred(123, '김하나 일정')],
            },
            {
              id: '12346',
              name: '이둘',
              preferredEducationSchedules: [
                preferred(124, '이둘 일정'),
                { ...preferred(123, '이둘 추가'), round: 2 },
              ],
            },
          ],
          onCancel: vi.fn(),
          onConfirm,
        })
      )
    )
    fireEvent.click(await screen.findByRole('button', { name: /김하나 일정/ }))
    fireEvent.click(screen.getByRole('button', { name: /이둘 일정/ }))
    fireEvent.click(screen.getByRole('button', { name: /이둘 추가/ }))
    await submitWithReason()
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
    expect(onConfirm.mock.calls[0]?.[0].targets).toEqual([
      { applicationId: '12345', confirmedScheduleIds: [123], expectedScopeRevision: 0 },
      { applicationId: '12346', confirmedScheduleIds: [124, 123], expectedScopeRevision: 0 },
    ])
  })
})
