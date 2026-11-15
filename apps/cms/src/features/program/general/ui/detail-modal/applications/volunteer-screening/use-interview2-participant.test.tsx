/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'

const mocks = vi.hoisted(() => ({
  fetchIndividualPage: vi.fn(),
  fetchVolunteerPage: vi.fn(),
  submitEvaluation: vi.fn(),
  submitIndividualFinalResult: vi.fn(),
  submitVolunteerFinalResult: vi.fn(),
  approveIndividualWithScope: vi.fn(),
  approveVolunteerWithScope: vi.fn(),
  bulkApproveIndividualWithScope: vi.fn(),
  giveUpIndividual: vi.fn(),
  giveUpVolunteer: vi.fn(),
}))

vi.mock('@/features/program/general/api/applications-remote-capabilities', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  shouldUseGeneralApplicationsRemoteApi: () => true,
  shouldUseApplicationsHttpRemoteApi: () => true,
}))

vi.mock('@/features/program/general/api/program-schedules-api-client', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  fetchAdminProgramSchedulesRemote: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/features/program/general/api/admin-applications-service', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  fetchGeneralIndividualScreeningApplicationsPage: mocks.fetchIndividualPage,
  fetchGeneralVolunteerScreeningApplicationsPage: mocks.fetchVolunteerPage,
  submitGeneralInterviewAssignmentEvaluation: mocks.submitEvaluation,
  submitGeneralIndividualFinalResult: mocks.submitIndividualFinalResult,
  submitGeneralVolunteerFinalResult: mocks.submitVolunteerFinalResult,
  approveGeneralIndividualApplicationWithEducationScope: mocks.approveIndividualWithScope,
  approveGeneralVolunteerApplicationWithEducationScope: mocks.approveVolunteerWithScope,
  bulkApproveGeneralIndividualApplicationsWithEducationScope: mocks.bulkApproveIndividualWithScope,
  giveUpGeneralVolunteerApplication: mocks.giveUpVolunteer,
}))

vi.mock('@/features/program/general/api/applications-api-client', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  giveUpIndividualApplicationRemote: mocks.giveUpIndividual,
}))

// 시안 18-1 교육 일정 옵션·일정 ID 매핑은 별도 테스트가 다룬다 — 여기서는 give-up 요청 본문만 본다
vi.mock('@/features/program/general/lib/general-volunteer-activity-withdraw', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getGeneralVolunteerActivityWithdrawScheduleOptions: () => [{ value: 'session-1', label: '1회차' }],
  resolveGeneralVolunteerActivityWithdrawStopScheduleId: () => 3301,
}))

// 면접 종료·평가 완료 판정은 별도 테스트가 다룬다. 여기서는 합격·평가 API 경로만 본다.
vi.mock('./general-volunteer-applicant-guard-actions', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  guardGeneralVolunteerInterview2Pass: () => true,
  guardGeneralVolunteerInterview2Evaluation: () => true,
}))
vi.mock('./general-volunteer-interview2-actions', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  isGeneralVolunteerInterview2SelectableForResult: () => true,
}))

import { useGeneralVolunteerInterview2 } from './use-interview2'

const program = {
  id: '77',
  generalProgramAudience: 'individual',
} as unknown as Program

function row(overrides: Partial<GeneralVolunteerApplicantRow>): GeneralVolunteerApplicantRow {
  return {
    id: '501',
    no: 1,
    name: '참여자',
    contact: '-',
    email: '-',
    contactRaw: '',
    emailRaw: '',
    id1365: '-',
    scheduleChangeCancelCount: 0,
    applicationType: 'new',
    hasJaVolunteerExperience: false,
    essayIntro: '',
    essayEducationExperience: '',
    essayNecessity: '',
    essayJaExperience: '',
    managerAEvaluation: 'pass',
    managerBEvaluation: 'pass',
    availableActions: ['APPROVE', 'REJECT'],
    documentScreeningStatus: 'pass',
    interviewSlotCount: 1,
    interviewAssignmentStatus: 'assigned',
    programId: '77',
    englishName: '',
    gender: '',
    birthDate: '',
    age: 0,
    universityName: '',
    major: '',
    applicationRoute: '',
    interviewAvailability: [],
    interviewAssignmentId: 9001,
    managerAScore: 4,
    managerBScore: 3,
    ...overrides,
  } as GeneralVolunteerApplicantRow
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

async function renderInterview2(subjectKind: 'participant' | 'volunteer', listRow: GeneralVolunteerApplicantRow) {
  const page = { rows: [listRow], page: 0, hasMore: false, totalElements: 1 }
  mocks.fetchIndividualPage.mockResolvedValue(page)
  mocks.fetchVolunteerPage.mockResolvedValue(page)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const hook = renderHook(
    () => useGeneralVolunteerInterview2({ programId: '77', program, subjectKind }),
    { wrapper: wrapper(client) }
  )
  await waitFor(() => expect(hook.result.current.list).toHaveLength(1))
  return hook
}

describe('useGeneralVolunteerInterview2 — 개인 참여자', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.submitEvaluation.mockResolvedValue(undefined)
    mocks.approveIndividualWithScope.mockResolvedValue({
      decision: { toStatus: 'APPROVED', participantId: 3001 },
    })
  })

  it('면접 평가 저장은 목록 interviewAssignmentId로 evaluations API를 부른다', async () => {
    const participantRow = row({})
    const { result } = await renderInterview2('participant', participantRow)
    let saved = false
    await act(async () => {
      saved = await result.current.saveInterviewEvaluation(participantRow, {
        managerAScore: 4,
        managerBScore: 3,
        interviewEvaluationRemark: '비고',
      })
    })
    expect(saved).toBe(true)
    expect(mocks.submitEvaluation).toHaveBeenCalledWith(9001, {
      managerAScore: 4,
      managerBScore: 3,
      comment: '비고',
    })
  })

  it('목록 「합격」은 final-result가 아니라 approve-with-education-scope로 처리한다', async () => {
    const participantRow = row({
      participantApplicant: {
        id: '501',
        no: 1,
        applicantName: '참여자',
        affiliation: '',
        educationGrade: '',
        homeAddress: '',
        approvalStatus: 'pending',
        preferredEducationSchedules: [{ scheduleId: 41 }],
      },
    })
    const { result } = await renderInterview2('participant', participantRow)
    act(() => {
      result.current.requestInterview2Pass(participantRow)
    })
    await act(async () => {
      await result.current.handlePassModalConfirm({
        notifyTiming: 'immediate',
        reason: '',
        passType: 'pass',
      } as Parameters<typeof result.current.handlePassModalConfirm>[0])
    })
    expect(mocks.submitIndividualFinalResult).not.toHaveBeenCalled()
    expect(result.current.participantScopeApproval.target).toEqual({
      applicationId: '501',
      participantName: '참여자',
      preferredEducationSchedules: [{ scheduleId: 41 }],
      notify: { notifyTiming: 'immediate', manualNotifyAt: undefined },
    })

    await act(async () => {
      await result.current.participantScopeApproval.confirm({
        reason: '승인',
        confirmedScheduleIds: [41],
        expectedScopeRevision: 0,
        notifyTiming: 'immediate',
      })
    })
    expect(mocks.approveIndividualWithScope).toHaveBeenCalledWith(
      '501',
      expect.objectContaining({ confirmedScheduleIds: [41], expectedScopeRevision: 0, reason: '승인' })
    )
    expect(mocks.submitIndividualFinalResult).not.toHaveBeenCalled()
    expect(result.current.participantScopeApproval.target).toBeNull()
    expect(result.current.passCompleteVolunteerName).toBe('참여자')
  })

  it('단건 합격 — 16-1에서 고른 알림(발표일)을 교육 일정 팝업 값 대신 with-scope로 보낸다', async () => {
    const participantRow = row({})
    const { result } = await renderInterview2('participant', participantRow)
    act(() => {
      result.current.requestInterview2Pass(participantRow)
    })
    await act(async () => {
      await result.current.handlePassModalConfirm({
        notifyTiming: 'on_announcement',
        reason: '',
        passType: 'pass',
      } as Parameters<typeof result.current.handlePassModalConfirm>[0])
    })
    await act(async () => {
      // 일정 팝업은 알림 선택을 숨겨 기본값(immediate)이 온다
      await result.current.participantScopeApproval.confirm({
        reason: '승인',
        confirmedScheduleIds: [41],
        expectedScopeRevision: 0,
        notifyTiming: 'immediate',
      })
    })
    expect(mocks.approveIndividualWithScope).toHaveBeenCalledWith(
      '501',
      expect.objectContaining({ confirmedScheduleIds: [41], timing: 'ON_ANNOUNCEMENT' })
    )
  })

  it('일괄 합격 — 12-1에서 고른 알림(발표일)을 bulk with-scope로 보낸다', async () => {
    mocks.bulkApproveIndividualWithScope.mockResolvedValue({
      successIds: [501],
      failures: [],
      failureCount: 0,
    })
    const participantRow = row({})
    const { result } = await renderInterview2('participant', participantRow)
    act(() => {
      result.current.setSelectedRowKeys(['501'])
    })
    await act(async () => {
      await result.current.confirmBulkPass({
        notifyTiming: 'on_announcement',
        reason: '',
        passType: 'pass',
      } as Parameters<typeof result.current.confirmBulkPass>[0])
    })
    expect(result.current.participantScopeApproval.bulkTargets?.map(item => item.id)).toEqual([
      '501',
    ])
    await act(async () => {
      await result.current.participantScopeApproval.confirmBulk({
        reason: '일괄 승인',
        notifyTiming: 'immediate',
        targets: [{ applicationId: '501', confirmedScheduleIds: [41], expectedScopeRevision: 0 }],
      })
    })
    expect(mocks.bulkApproveIndividualWithScope).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: '일괄 승인',
        timing: 'ON_ANNOUNCEMENT',
        targets: [{ applicationId: 501, confirmedScheduleIds: [41], expectedScopeRevision: 0 }],
      })
    )
    expect(mocks.submitIndividualFinalResult).not.toHaveBeenCalled()
  })

  it('참여자 2차 면접 활동 포기는 봉사자와 같은 18-1 팝업 값(일정·귀책)으로 개인 give-up을 부른다', async () => {
    mocks.giveUpIndividual.mockResolvedValue({})
    const participantRow = row({})
    const { result } = await renderInterview2('participant', participantRow)
    act(() => {
      result.current.requestWithdrawActivity(participantRow)
    })
    expect(result.current.withdrawTarget?.id).toBe('501')
    await act(async () => {
      await result.current.confirmWithdrawActivity({
        stopSessionKey: 'session-1',
        stopScheduleLabel: '1회차',
        faultParty: 'USER',
      })
    })
    expect(mocks.giveUpIndividual).toHaveBeenCalledWith('501', {
      reason: '활동 포기 (1회차)',
      stopScheduleId: 3301,
      faultParty: 'USER',
    })
    expect(mocks.giveUpVolunteer).not.toHaveBeenCalled()
    // 18-2 활동 포기 완료
    expect(result.current.withdrawCompleteVolunteerName).toBe('참여자')
  })

  it('참여자 예비합격은 기존 final-result RESERVE를 쓴다', async () => {
    const participantRow = row({})
    const { result } = await renderInterview2('participant', participantRow)
    act(() => {
      result.current.requestInterview2Pass(participantRow)
    })
    await act(async () => {
      await result.current.handlePassModalConfirm({
        notifyTiming: 'immediate',
        reason: '',
        passType: 'reserve1',
      } as Parameters<typeof result.current.handlePassModalConfirm>[0])
    })
    expect(mocks.approveIndividualWithScope).not.toHaveBeenCalled()
    expect(mocks.submitIndividualFinalResult).toHaveBeenCalledWith(
      '501',
      expect.objectContaining({ result: 'RESERVE', reserveRank: 1 })
    )
  })
})

describe('useGeneralVolunteerInterview2 — 봉사자(변경 없음)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.submitEvaluation.mockResolvedValue(undefined)
  })

  it('개인 프로그램 봉사자 「합격」은 기존 교육 배정 안내(봉사자 with-scope)로 간다', async () => {
    const volunteerRow = row({ id: '601', name: '봉사자' })
    const { result } = await renderInterview2('volunteer', volunteerRow)
    act(() => {
      result.current.requestInterview2Pass(volunteerRow)
    })
    await act(async () => {
      await result.current.handlePassModalConfirm({
        notifyTiming: 'immediate',
        reason: '',
        passType: 'pass',
      } as Parameters<typeof result.current.handlePassModalConfirm>[0])
    })
    expect(result.current.educationAssign.target?.applicationId).toBe('601')
    expect(result.current.participantScopeApproval.target).toBeNull()
    expect(mocks.approveIndividualWithScope).not.toHaveBeenCalled()
    expect(mocks.submitVolunteerFinalResult).not.toHaveBeenCalled()
  })

  it('봉사자 일괄 합격은 기존 final-result 일괄이고 참여자 일정 팝업을 열지 않는다', async () => {
    const volunteerRow = row({ id: '601', name: '봉사자' })
    const { result } = await renderInterview2('volunteer', volunteerRow)
    act(() => {
      result.current.setSelectedRowKeys(['601'])
    })
    await act(async () => {
      await result.current.confirmBulkPass({
        notifyTiming: 'on_announcement',
        reason: '',
        passType: 'pass',
      } as Parameters<typeof result.current.confirmBulkPass>[0])
    })
    expect(result.current.participantScopeApproval.bulkTargets).toBeNull()
    expect(mocks.bulkApproveIndividualWithScope).not.toHaveBeenCalled()
    // 1건 선택은 기존대로 단건 final-result — 알림 값도 그대로
    expect(mocks.submitVolunteerFinalResult).toHaveBeenCalledWith(
      '601',
      expect.objectContaining({ result: 'PASS', notifyTiming: 'ON_ANNOUNCEMENT' })
    )
  })

  it('봉사자 2차 면접 활동 포기는 기존 봉사자 give-up 그대로다', async () => {
    mocks.giveUpVolunteer.mockResolvedValue({})
    const volunteerRow = row({ id: '601', name: '봉사자' })
    const { result } = await renderInterview2('volunteer', volunteerRow)
    act(() => {
      result.current.requestWithdrawActivity(volunteerRow)
    })
    await act(async () => {
      await result.current.confirmWithdrawActivity({
        stopSessionKey: 'session-1',
        stopScheduleLabel: '1회차',
        faultParty: 'ADMIN',
      })
    })
    expect(mocks.giveUpVolunteer).toHaveBeenCalledWith('601', {
      reason: '활동 포기 (1회차)',
      stopScheduleId: 3301,
      faultParty: 'ADMIN',
    })
    expect(mocks.giveUpIndividual).not.toHaveBeenCalled()
  })

  it('봉사자 면접 평가도 같은 evaluations API를 그대로 쓴다', async () => {
    const volunteerRow = row({ id: '601', interviewAssignmentId: 7001 })
    const { result } = await renderInterview2('volunteer', volunteerRow)
    await act(async () => {
      await result.current.saveInterviewEvaluation(volunteerRow, {
        managerAScore: 5,
        managerBScore: null,
        interviewEvaluationRemark: '',
      })
    })
    expect(mocks.submitEvaluation).toHaveBeenCalledWith(7001, { managerAScore: 5 })
  })
})
