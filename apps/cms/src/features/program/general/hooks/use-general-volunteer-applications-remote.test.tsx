/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generalInterviewSlotsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import type { ScreeningSubjectKind } from '@/features/program/general/lib/screening-subject-kind'

const mocks = vi.hoisted(() => ({
  fetchIndividualPage: vi.fn(),
  fetchVolunteerPage: vi.fn(),
  cancelIndividualDocumentApproval: vi.fn(),
  cancelIndividualApproval: vi.fn(),
  cancelVolunteerApproval: vi.fn(),
  cancelInterviewAssignment: vi.fn(),
  giveUpIndividual: vi.fn(),
  giveUpVolunteer: vi.fn(),
  showAlert: vi.fn(),
}))

vi.mock('@/features/program/general/api/applications-remote-capabilities', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  shouldUseGeneralApplicationsRemoteApi: () => true,
  shouldUseApplicationsHttpRemoteApi: () => true,
}))

vi.mock('@/features/program/general/api/admin-applications-service', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  fetchGeneralIndividualScreeningApplicationsPage: mocks.fetchIndividualPage,
  fetchGeneralVolunteerScreeningApplicationsPage: mocks.fetchVolunteerPage,
  cancelGeneralIndividualDocumentApproval: mocks.cancelIndividualDocumentApproval,
  cancelGeneralIndividualApplicationApproval: mocks.cancelIndividualApproval,
  cancelGeneralVolunteerApplicationApproval: mocks.cancelVolunteerApproval,
  cancelGeneralInterviewAssignment: mocks.cancelInterviewAssignment,
  giveUpGeneralVolunteerApplication: mocks.giveUpVolunteer,
}))

vi.mock('@/features/program/general/api/applications-api-client', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  giveUpIndividualApplicationRemote: mocks.giveUpIndividual,
}))

vi.mock('@/shared/ui/cms-alert-modal-provider', () => ({
  useCmsAlert: () => ({ showAlert: mocks.showAlert }),
}))

import { useGeneralVolunteerApplicationsRemote } from './use-general-volunteer-applications-remote'

function renderRemote(subjectKind: ScreeningSubjectKind) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const hook = renderHook(
    () =>
      useGeneralVolunteerApplicationsRemote({
        programId: '77',
        stage: 'docPassed',
        subjectKind,
        setList: () => {},
      }),
    { wrapper: Wrapper }
  )
  return { ...hook, invalidateSpy }
}

function invalidatedKeys(spy: { mock: { calls: unknown[][] } }): unknown[] {
  return spy.mock.calls.map(
    (call: unknown[]) => (call[0] as { queryKey?: unknown } | undefined)?.queryKey
  )
}

const PARTICIPANT_SLOTS_KEY = generalInterviewSlotsQueryKeys.listByAudience('77', 'PARTICIPANT')

describe('useGeneralVolunteerApplicationsRemote — 개인 참여자 심사 취소·포기 경로', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const emptyPage = { rows: [], page: 0, hasMore: false, totalElements: 0 }
    mocks.fetchIndividualPage.mockResolvedValue(emptyPage)
    mocks.fetchVolunteerPage.mockResolvedValue(emptyPage)
    mocks.cancelIndividualDocumentApproval.mockResolvedValue({ toStatus: 'APPROVAL_CANCELLED' })
    mocks.cancelVolunteerApproval.mockResolvedValue({ toStatus: 'APPROVAL_CANCELLED' })
    mocks.cancelInterviewAssignment.mockResolvedValue({ assignmentStatus: 'CANCELLED' })
    mocks.giveUpIndividual.mockResolvedValue({})
    mocks.giveUpVolunteer.mockResolvedValue({})
  })

  it('참여자 서류 승인 취소는 개인 cancel-document-approval 서비스만 부르고 목록·PARTICIPANT 슬롯을 다시 받는다', async () => {
    const { result, invalidateSpy } = renderRemote('participant')
    let ok = false
    await act(async () => {
      ok = await result.current.applyRemoteDocumentCancelApproval('501', '서류 재검토')
    })
    expect(ok).toBe(true)
    expect(mocks.cancelIndividualDocumentApproval).toHaveBeenCalledWith('501', '서류 재검토', undefined)
    // 최종 승인 취소(cancel-approval)·봉사자 경로로 보내지 않는다
    expect(mocks.cancelIndividualApproval).not.toHaveBeenCalled()
    expect(mocks.cancelVolunteerApproval).not.toHaveBeenCalled()
    expect(invalidatedKeys(invalidateSpy)).toContainEqual(PARTICIPANT_SLOTS_KEY)
  })

  it('봉사자 서류 승인 취소는 기존 봉사자 cancel-approval 그대로다', async () => {
    const { result, invalidateSpy } = renderRemote('volunteer')
    await act(async () => {
      await result.current.applyRemoteDocumentCancelApproval('601', '사유')
    })
    expect(mocks.cancelVolunteerApproval).toHaveBeenCalledWith('601', '사유', undefined)
    expect(mocks.cancelIndividualDocumentApproval).not.toHaveBeenCalled()
    expect(invalidatedKeys(invalidateSpy)).not.toContainEqual(PARTICIPANT_SLOTS_KEY)
  })

  it('면접 배정 취소는 목록 배정 ID를 path로 쓰고 참여자는 PARTICIPANT 슬롯을 다시 받는다', async () => {
    const { result, invalidateSpy } = renderRemote('participant')
    let ok = false
    await act(async () => {
      ok = await result.current.applyRemoteInterviewAssignmentCancel(9001, '일정 변경')
    })
    expect(ok).toBe(true)
    expect(mocks.cancelInterviewAssignment).toHaveBeenCalledWith(9001, '일정 변경')
    expect(invalidatedKeys(invalidateSpy)).toContainEqual(PARTICIPANT_SLOTS_KEY)
  })

  it('배정 ID가 없으면 면접 배정 취소를 호출하지 않는다', async () => {
    const { result } = renderRemote('participant')
    let ok = true
    await act(async () => {
      ok = await result.current.applyRemoteInterviewAssignmentCancel(undefined, '일정 변경')
    })
    expect(ok).toBe(false)
    expect(mocks.cancelInterviewAssignment).not.toHaveBeenCalled()
  })

  it('면접 평가가 있어 409가 오면 서버 문구를 그대로 안내한다', async () => {
    mocks.cancelInterviewAssignment.mockRejectedValue({
      response: {
        status: 409,
        data: {
          code: 'VOLUNTEER_INTERVIEW_EVALUATION_EXISTS',
          message: '이미 면접 평가가 등록되어 있습니다.',
        },
      },
    })
    const { result } = renderRemote('participant')
    let ok = true
    await act(async () => {
      ok = await result.current.applyRemoteInterviewAssignmentCancel(9001, '일정 변경')
    })
    expect(ok).toBe(false)
    expect(mocks.showAlert).toHaveBeenCalledWith(
      expect.objectContaining({ content: '이미 면접 평가가 등록되어 있습니다.' })
    )
  })

  it('참여자 활동 포기는 개인 give-up, 봉사자는 봉사자 give-up을 부른다', async () => {
    const participant = renderRemote('participant')
    await act(async () => {
      await participant.result.current.applyRemoteGiveUp('501', { reason: '개인 사정' })
    })
    expect(mocks.giveUpIndividual).toHaveBeenCalledWith('501', { reason: '개인 사정' })
    expect(mocks.giveUpVolunteer).not.toHaveBeenCalled()
    expect(invalidatedKeys(participant.invalidateSpy)).toContainEqual(PARTICIPANT_SLOTS_KEY)

    const volunteer = renderRemote('volunteer')
    await act(async () => {
      await volunteer.result.current.applyRemoteGiveUp('601', { reason: '개인 사정' })
    })
    expect(mocks.giveUpVolunteer).toHaveBeenCalledWith('601', { reason: '개인 사정' })
    expect(mocks.giveUpIndividual).toHaveBeenCalledTimes(1)
  })
})
