import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import {
  getGeneralIndividualApplicationsForProgram,
  patchGeneralIndividualApplicantForApprovalStatus,
  patchGeneralIndividualApplicantForNotificationResend,
  updateGeneralIndividualApplicantApprovalStatus,
  updateGeneralIndividualApplicantCancelRejection,
  updateGeneralIndividualApplicantNotificationResend,
  type GeneralIndividualApplicantDetailSavePayload,
  type GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'
import {
  approveGeneralIndividualApplication,
  rejectGeneralIndividualApplication,
  submitGeneralIndividualDocumentResult,
} from '@/features/program/general/api/admin-applications-service'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import {
  patchParticipantForCancelRejection,
  toParticipantCancelRejectionNotifyOptions,
  type ParticipantCancelRejectionConfirmPayload,
} from '@/features/program/general/lib/participant-cancel-rejection'
import {
  resolveApplicantNotificationResendSentAt,
  toApplicantNotificationResendNotifyOptions,
} from '@/features/program/general/lib/applicant-notification-resend'
import type { IndividualApplicantScreeningStage } from '@/features/program/general/lib/individual-application-visibility'
import {
  screeningDoc1DetailTitle,
  screeningDocPassedDetailTitle,
  screeningInterview2DetailTitle,
} from '@/features/program/general/lib/screening-subject-kind'
import {
  ParticipantApproveModal,
  ParticipantApprovalCompleteModal,
  ParticipantRejectModal,
  ParticipantRejectCompleteModal,
  ParticipantCancelRejectModal,
  ParticipantCancelRejectCompleteModal,
} from '@/features/program/shared/ui/detail-modal/components/participant-application-flow-modals'
import { ApplicantNotificationResendModal } from '@/features/program/shared/ui/detail-modal/components/applicant-notification-resend-modal'
import {
  ApplicantsDetailContents,
} from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-contents'
import type { ApplicantDetailMeta } from '@/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail'
import {
  fetchIndividualApplicationDetailRemote,
  resendIndividualApplicationNotification,
  unmaskIndividualApplicationPrivacyRemote,
  updateIndividualApplication,
  updateIndividualDocumentEvaluationRemote,
} from '@/features/program/general/api/applications-api-client'
import { mapIndividualApplicationDetailToApplicantRow } from '@/features/program/general/api/adapters/general-applications-adapters'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldPreferGeneralApplicationListMock } from '@/features/program/general/lib/prefer-general-application-list-mock'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { extractApiErrorMessage, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import type { IndividualApplicationUpdateResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationUpdateResponse'
import type { IndividualDocumentEvaluationResponse } from '@/shared/api/generated/dashboard/schemas/individualDocumentEvaluationResponse'

function mergeApplicationUpdateResponse(
  row: GeneralIndividualApplicantRow,
  response: IndividualApplicationUpdateResponse
): GeneralIndividualApplicantRow {
  const textbook = response.textbook as
    | {
        id?: number
        name?: string
        kits?: number
        quantity?: number
        status?: string
      }
    | null
    | undefined
  const team = response.team as
    | {
        name?: string
        teamName?: string
        memberCount?: number
        role?: string
      }
    | undefined
  const role = team?.role?.toUpperCase()

  return {
    ...row,
    availableActions: response.availableActions ?? row.availableActions,
    adminComment:
      response.managerComment === null
        ? undefined
        : (response.managerComment ?? row.adminComment),
    textbookId: textbook?.id != null ? String(textbook.id) : undefined,
    textbookName: textbook?.name,
    textbookKits: textbook?.kits,
    textbookQuantity: textbook?.quantity,
    textbookStatus: textbook?.status?.toLowerCase() as GeneralIndividualApplicantRow['textbookStatus'],
    detail: {
      ...row.detail,
      teamName: team?.name ?? team?.teamName ?? row.detail?.teamName,
      teamMemberCount: team?.memberCount ?? row.detail?.teamMemberCount,
      teamMemberCountSelect:
        team?.memberCount != null && team.memberCount >= 1 && team.memberCount <= 5
          ? (String(team.memberCount) as '1' | '2' | '3' | '4' | '5')
          : team?.memberCount != null
            ? 'custom'
            : row.detail?.teamMemberCountSelect,
      teamRole:
        role === 'LEADER' ? 'leader' : role === 'MEMBER' ? 'member' : row.detail?.teamRole,
    },
  }
}

function mergeDocumentEvaluationResponse(
  row: GeneralIndividualApplicantRow,
  response: IndividualDocumentEvaluationResponse
): GeneralIndividualApplicantRow {
  const toEvaluation = (
    value?: string
  ): NonNullable<GeneralIndividualApplicantRow['managerAEvaluation']> => {
    const normalized = value?.toLowerCase()
    return normalized === 'pass' || normalized === 'neutral' || normalized === 'fail'
      ? normalized
      : 'unreviewed'
  }

  return {
    ...row,
    managerAEvaluation: toEvaluation(response.managerAEvaluation),
    managerBEvaluation: toEvaluation(response.managerBEvaluation),
    availableActions: response.availableActions ?? row.availableActions,
    canEditManagerAEvaluation:
      response.canEditManagerAEvaluation ?? row.canEditManagerAEvaluation,
    canEditManagerBEvaluation:
      response.canEditManagerBEvaluation ?? row.canEditManagerBEvaluation,
  }
}

function resolveParticipantScreeningDetailTitle(
  screeningStage: IndividualApplicantScreeningStage,
  name: string
): string {
  if (screeningStage === 'doc1') return screeningDoc1DetailTitle('participant', name)
  if (screeningStage === 'doc_passed') return screeningDocPassedDetailTitle('participant', name)
  if (screeningStage === 'interview2') return screeningInterview2DetailTitle('participant', name)
  return `참여자 신청 상세 (${name})`
}

export interface GeneralParticipantApplicantDetailViewProps {
  program: Program
  applicantId: string
  screeningStage: IndividualApplicantScreeningStage
  /** 목록 행(원격 API 등). 없으면 mock SSOT에서 id로 조회 */
  applicant?: GeneralIndividualApplicantRow | null
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onApplicantDetailMetaChange?: (meta: ApplicantDetailMeta) => void
  onApplicantUpdated?: (row: GeneralIndividualApplicantRow) => void
}

export function GeneralParticipantApplicantDetailView({
  program,
  applicantId,
  screeningStage,
  applicant: applicantProp = null,
  onRegisterApplicantCloseHandler: _onRegisterApplicantCloseHandler,
  onApplicantDetailMetaChange,
  onApplicantUpdated,
}: GeneralParticipantApplicantDetailViewProps) {
  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()
  const usesApplicationMock = shouldPreferGeneralApplicationListMock(program)
  const useRemote = !usesApplicationMock && shouldUseGeneralApplicationsRemoteApi()
  const resolveFromMock = useCallback((): GeneralIndividualApplicantRow | null => {
    if (!usesApplicationMock) return null
    return (
      getGeneralIndividualApplicationsForProgram(program.id).find(row => row.id === applicantId) ??
      null
    )
  }, [applicantId, program.id, usesApplicationMock])

  const [applicant, setApplicant] = useState<GeneralIndividualApplicantRow | null>(
    () => applicantProp ?? resolveFromMock()
  )

  useEffect(() => {
    if (!usesApplicationMock) {
      if (applicantProp) setApplicant(applicantProp)
      return
    }
    if (applicantProp) {
      setApplicant(applicantProp)
      return
    }
    const next = resolveFromMock()
    setApplicant(prev => (prev?.id === next?.id ? prev : next))
  }, [applicantProp, resolveFromMock, usesApplicationMock])

  const detailQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.individualDetail(applicantId),
    queryFn: () => fetchIndividualApplicationDetailRemote(applicantId),
    enabled: !usesApplicationMock && Boolean(applicantId),
    staleTime: 0,
    retry: false,
  })

  useEffect(() => {
    if (!detailQuery.data || usesApplicationMock) return
    setApplicant(previous => {
      const base =
        applicantProp ??
        previous ?? {
          id: applicantId,
          no: 0,
          applicantName: '',
          affiliation: '',
          educationGrade: '',
          homeAddress: '',
          approvalStatus: 'pending',
        }
      return mapIndividualApplicationDetailToApplicantRow(detailQuery.data, base)
    })
  }, [applicantId, applicantProp, detailQuery.data, usesApplicationMock])

  const onApplicantDetailMetaChangeRef = useRef(onApplicantDetailMetaChange)
  onApplicantDetailMetaChangeRef.current = onApplicantDetailMetaChange

  useEffect(() => {
    const notify = onApplicantDetailMetaChangeRef.current
    if (!notify) return
    if (!applicant) {
      notify(null)
      return
    }
    notify({
      title: resolveParticipantScreeningDetailTitle(screeningStage, applicant.applicantName),
      breadcrumbLabel: applicant.applicantName,
      kind: 'individual',
    })
    return () => {
      onApplicantDetailMetaChangeRef.current?.(null)
    }
  }, [applicant, screeningStage])

  const syncApplicant = useCallback(
    (row: GeneralIndividualApplicantRow) => {
      setApplicant(row)
      onApplicantUpdated?.(row)
    },
    [onApplicantUpdated]
  )

  const [decisionBusy, setDecisionBusy] = useState(false)

  const invalidateIndividualApplications = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: generalApplicationsQueryKeys.individualLists(program.id),
    })
    await queryClient.invalidateQueries({
      queryKey: generalApplicationsQueryKeys.individualDetail(applicantId),
    })
  }, [applicantId, program.id, queryClient])

  const notifyDecisionFailure = useCallback(
    (error: unknown) => {
      console.debug('participant detail decision remote failed', error)
      void showAlert({
        title: '처리 실패',
        content: '참여자 신청 상태 변경 중 오류가 발생했습니다. 다시 시도해 주세요.',
      })
    },
    [showAlert]
  )

  const [approveTarget, setApproveTarget] = useState<{ id: string; name: string } | null>(null)
  const [approveComplete, setApproveComplete] = useState<{ participantName: string } | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null)
  const [rejectComplete, setRejectComplete] = useState<{
    participantName: string
    rejectionReason: string
  } | null>(null)
  const [cancelRejectTarget, setCancelRejectTarget] = useState<{ id: string; name: string } | null>(
    null
  )
  const [cancelRejectComplete, setCancelRejectComplete] = useState<{
    participantName: string
  } | null>(null)
  const [notificationResendOpen, setNotificationResendOpen] = useState(false)
  const notificationIdempotencyKeyRef = useRef<string | null>(null)
  const resendNotificationMutation = useMutation({
    mutationFn: async (payload: {
      timing: 'IMMEDIATE' | 'SCHEDULED'
      scheduledAt: string | null
      reason: string | null
    }) => {
      const idempotencyKey =
        notificationIdempotencyKeyRef.current ??
        `individual-${applicantId}-${crypto.randomUUID()}`
      notificationIdempotencyKeyRef.current = idempotencyKey
      return resendIndividualApplicationNotification(applicantId, payload, idempotencyKey)
    },
  })

  const updateAdminCommentMutation = useMutation({
    mutationFn: (managerComment: string) =>
      updateIndividualApplication(applicantId, {
        managerComment: managerComment.trim() || null,
      }),
    retry: false,
  })

  const syncRemoteApplicant = useCallback(
    (updated: GeneralIndividualApplicantRow) => {
      const individualListsKey = generalApplicationsQueryKeys.individualLists(program.id)
      if (updated.privacyMaskingLevel === 'UNMASKED') {
        setApplicant(updated)
        void queryClient.invalidateQueries({ queryKey: individualListsKey })
        void queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.individualDetail(updated.id),
        })
        return
      }
      syncApplicant(updated)
      queryClient.setQueriesData<GeneralIndividualApplicantRow[]>(
        { queryKey: individualListsKey },
        rows => rows?.map(row => (row.id === updated.id ? updated : row))
      )
      void queryClient.invalidateQueries({ queryKey: individualListsKey })
      void queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.individualDetail(updated.id),
      })
    },
    [program.id, queryClient, syncApplicant]
  )

  const saveIndividualDetail = useCallback(
    async (
      payload: GeneralIndividualApplicantDetailSavePayload
    ): Promise<GeneralIndividualApplicantRow | null> => {
      if (!applicant) return null
      try {
        const response = await updateIndividualApplication(applicant.id, {
          textbookId:
            payload.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE
              ? null
              : payload.textbookId
                ? Number(payload.textbookId)
                : undefined,
          teamName: payload.teamName?.trim() || null,
          teamMemberCount: payload.teamMemberCount,
        })
        const responseRow = mergeApplicationUpdateResponse(applicant, response)
        const updated =
          payload.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE
            ? {
                ...responseRow,
                textbookId: TEXTBOOK_NOT_USED_OPTION_VALUE,
                textbookName: '해당 없음',
                textbookKits: 0,
                textbookQuantity: 0,
                textbookStatus: 'not_applicable' as const,
              }
            : responseRow
        syncRemoteApplicant(updated)
        return updated
      } catch (error) {
        const responseData =
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: unknown } }).response?.data
            : undefined
        void showAlert({
          title: '신청 정보 저장 실패',
          content: extractApiErrorMessage(responseData, {
            httpStatus: getApiErrorHttpStatus(error),
            fallback: '신청 정보를 저장하지 못했습니다. 다시 시도해 주세요.',
          }),
        })
        await detailQuery.refetch()
        throw error
      }
    },
    [applicant, detailQuery, showAlert, syncRemoteApplicant]
  )

  const saveTeamRole = useCallback(
    async (teamRole: 'leader' | 'member') => {
      if (!applicant) return
      try {
        const response = await updateIndividualApplication(applicant.id, {
          teamRole: teamRole.toUpperCase() as 'LEADER' | 'MEMBER',
        })
        syncRemoteApplicant(mergeApplicationUpdateResponse(applicant, response))
      } catch (error) {
        const responseData =
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: unknown } }).response?.data
            : undefined
        void showAlert({
          title: '팀 역할 저장 실패',
          content: extractApiErrorMessage(responseData, {
            httpStatus: getApiErrorHttpStatus(error),
            fallback: '팀 역할을 저장하지 못했습니다. 다시 시도해 주세요.',
          }),
        })
        await detailQuery.refetch()
        throw error
      }
    },
    [applicant, detailQuery, showAlert, syncRemoteApplicant]
  )

  const saveAdminComment = useCallback(
    async (managerComment: string): Promise<GeneralIndividualApplicantRow | null> => {
      if (!applicant) return null
      try {
        const response = await updateAdminCommentMutation.mutateAsync(managerComment)
        const updated: GeneralIndividualApplicantRow = {
          ...applicant,
          adminComment: response.managerComment ?? undefined,
          availableActions: response.availableActions ?? applicant.availableActions,
        }
        const individualListsKey = generalApplicationsQueryKeys.individualLists(program.id)
        queryClient.setQueriesData<GeneralIndividualApplicantRow[]>(
          { queryKey: individualListsKey },
          rows => rows?.map(row => (row.id === updated.id ? updated : row))
        )
        void queryClient.invalidateQueries({ queryKey: individualListsKey })
        return updated
      } catch (error) {
        const responseData =
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: unknown } }).response?.data
            : undefined
        void showAlert({
          title: '코멘트 저장 실패',
          content: extractApiErrorMessage(responseData, {
            httpStatus: getApiErrorHttpStatus(error),
            fallback: '코멘트를 저장하지 못했습니다. 다시 시도해 주세요.',
          }),
        })
        return null
      }
    },
    [applicant, program.id, queryClient, showAlert, updateAdminCommentMutation]
  )

  const revealIndividualPersonalInfo = useCallback(
    async (reason: string): Promise<GeneralIndividualApplicantRow> => {
      if (!applicant) throw new Error('신청 상세가 없습니다.')
      const response = await unmaskIndividualApplicationPrivacyRemote(applicant.id, reason)
      return mapIndividualApplicationDetailToApplicantRow(response, applicant)
    },
    [applicant]
  )

  const saveManagerEvaluation = useCallback(
    async (
      managerSlot: 'A' | 'B',
      evaluation: NonNullable<GeneralIndividualApplicantRow['managerAEvaluation']>
    ) => {
      if (!applicant) return
      try {
        const response = await updateIndividualDocumentEvaluationRemote(applicant.id, managerSlot, {
          evaluation: evaluation.toUpperCase(),
        })
        syncRemoteApplicant(mergeDocumentEvaluationResponse(applicant, response))
        await queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.individualLists(program.id),
        })
        await detailQuery.refetch()
      } catch (error) {
        const responseData =
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: unknown } }).response?.data
            : undefined
        void showAlert({
          title: '담당자 서류 평가 저장 실패',
          content: extractApiErrorMessage(responseData, {
            httpStatus: getApiErrorHttpStatus(error),
            fallback: '담당자 서류 평가를 저장하지 못했습니다.',
          }),
        })
        await detailQuery.refetch()
      }
    },
    [applicant, detailQuery, program.id, queryClient, showAlert, syncRemoteApplicant]
  )

  const cancelRejectParticipant = useMemo(() => {
    if (!cancelRejectTarget || !applicant) return null
    return applicant
  }, [applicant, cancelRejectTarget])

  const handleOpenNotificationResend = useCallback(() => {
    if (!applicant) return
    if (applicant.approvalStatus !== 'approved' && applicant.approvalStatus !== 'rejected') return
    if (
      !usesApplicationMock &&
      !applicant.availableActions?.includes('RESEND_NOTIFICATION')
    ) {
      return
    }
    notificationIdempotencyKeyRef.current =
      `individual-${applicant.id}-${crypto.randomUUID()}`
    setNotificationResendOpen(true)
  }, [applicant, usesApplicationMock])

  if (!applicant) return null

  return (
    <>
      <ApplicantsDetailContents
        type="individual-applications"
        detailVariant="general"
        data={applicant}
        program={program}
        individualScreeningStage={screeningStage}
        onBack={() => {}}
        onApprove={id => {
          setApproveTarget({ id, name: applicant.applicantName })
        }}
        onReject={id => {
          setRejectTarget({ id, name: applicant.applicantName })
        }}
        onCancelReject={id => {
          setCancelRejectTarget({ id, name: applicant.applicantName })
        }}
        onResendNotification={
          usesApplicationMock ||
          applicant.availableActions?.includes('RESEND_NOTIFICATION')
            ? handleOpenNotificationResend
            : undefined
        }
        onIndividualDetailSaved={syncApplicant}
        onSaveIndividualDetail={usesApplicationMock ? undefined : saveIndividualDetail}
        onSaveIndividualAdminComment={usesApplicationMock ? undefined : saveAdminComment}
        individualAdminCommentSaving={updateAdminCommentMutation.isPending}
        canUpdateIndividualAdminComment={
          usesApplicationMock || applicant.availableActions?.includes('COMMENT_UPDATE')
        }
        onRevealIndividualPersonalInfo={
          usesApplicationMock || applicant.canRevealPersonalInfo !== true
            ? undefined
            : revealIndividualPersonalInfo
        }
        onIndividualPrivacyUnmasked={setApplicant}
        showIndividualPrivacyReveal={
          usesApplicationMock ? undefined : applicant.canRevealPersonalInfo === true
        }
        onIndividualManagerEvaluationChange={
          usesApplicationMock ? undefined : saveManagerEvaluation
        }
        onIndividualTeamRoleChange={usesApplicationMock ? undefined : saveTeamRole}
      />
      <ApplicantNotificationResendModal
        open={notificationResendOpen}
        subjectKind="individual"
        subjectName={applicant.applicantName}
        approvalStatus={
          applicant.approvalStatus === 'rejected' ? 'rejected' : 'approved'
        }
        confirmLoading={resendNotificationMutation.isPending}
        onCancel={() => {
          if (resendNotificationMutation.isPending) return
          notificationIdempotencyKeyRef.current = null
          setNotificationResendOpen(false)
        }}
        onConfirm={async payload => {
          if (resendNotificationMutation.isPending) return

          if (usesApplicationMock) {
            const notifyOptions = toApplicantNotificationResendNotifyOptions(payload)
            const sentAt = resolveApplicantNotificationResendSentAt(notifyOptions)
            const patched = patchGeneralIndividualApplicantForNotificationResend(
              applicant,
              sentAt,
              { rejectionReason: notifyOptions.rejectionReason }
            )
            updateGeneralIndividualApplicantNotificationResend(applicant.id, sentAt, {
              rejectionReason: notifyOptions.rejectionReason,
            })
            syncApplicant(patched)
            setNotificationResendOpen(false)
            return
          }

          if (
            payload.notifyTiming === 'manual' &&
            (!payload.manualNotifyAt || !payload.manualNotifyAt.isAfter(new Date()))
          ) {
            void showAlert({
              title: '예약 발송 일시 확인',
              content: '예약 발송 일시는 현재 시각보다 이후로 설정해 주세요.',
            })
            return
          }

          try {
            await resendNotificationMutation.mutateAsync({
              timing: payload.notifyTiming === 'manual' ? 'SCHEDULED' : 'IMMEDIATE',
              scheduledAt:
                payload.notifyTiming === 'manual'
                  ? (payload.manualNotifyAt?.toISOString() ?? null)
                  : null,
              reason: applicant.approvalStatus === 'rejected' ? payload.reason.trim() : null,
            })
            await queryClient.invalidateQueries({
              queryKey: generalApplicationsQueryKeys.all,
            })
            notificationIdempotencyKeyRef.current = null
            setNotificationResendOpen(false)
          } catch (error) {
            const responseData =
              error && typeof error === 'object' && 'response' in error
                ? (error as { response?: { data?: unknown } }).response?.data
                : undefined
            void showAlert({
              title: '알림 재발송 실패',
              content: extractApiErrorMessage(responseData, {
                httpStatus: getApiErrorHttpStatus(error),
                fallback: '알림을 재발송하지 못했습니다. 다시 시도해 주세요.',
              }),
            })
          }
        }}
      />
      <ParticipantApproveModal
        open={approveTarget != null}
        participantName={approveTarget?.name ?? ''}
        onCancel={() => {
          if (decisionBusy) return
          setApproveTarget(null)
        }}
        onConfirm={payload => {
          if (!approveTarget || decisionBusy) return
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
          }
          const run = async () => {
            if (useRemote) {
              setDecisionBusy(true)
              try {
                if (screeningStage === 'doc1') {
                  await submitGeneralIndividualDocumentResult(applicant.id, { result: 'PASS' })
                } else {
                  await approveGeneralIndividualApplication(applicant.id)
                }
                await invalidateIndividualApplications()
              } catch (error) {
                notifyDecisionFailure(error)
                return
              } finally {
                setDecisionBusy(false)
              }
            } else {
              updateGeneralIndividualApplicantApprovalStatus(applicant.id, 'approved', notifyOptions)
            }
            const patched =
              screeningStage === 'doc1'
                ? {
                    ...applicant,
                    documentScreeningStatus: 'pass' as const,
                    approvalNotifyTiming: notifyOptions.notifyTiming,
                  }
                : patchGeneralIndividualApplicantForApprovalStatus(
                    applicant,
                    'approved',
                    notifyOptions
                  )
            syncApplicant(patched)
            setApproveTarget(null)
            setApproveComplete({ participantName: approveTarget.name })
          }
          void run()
        }}
      />
      <ParticipantApprovalCompleteModal
        open={approveComplete != null}
        participantName={approveComplete?.participantName ?? ''}
        onClose={() => setApproveComplete(null)}
      />
      <ParticipantRejectModal
        open={rejectTarget != null}
        participantName={rejectTarget?.name ?? ''}
        onCancel={() => {
          if (decisionBusy) return
          setRejectTarget(null)
        }}
        onConfirm={payload => {
          if (!rejectTarget || decisionBusy) return
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
            rejectionReason: payload.reason,
          }
          const run = async () => {
            if (useRemote) {
              setDecisionBusy(true)
              try {
                if (screeningStage === 'doc1') {
                  await submitGeneralIndividualDocumentResult(applicant.id, {
                    result: 'FAIL',
                    reason: payload.reason.trim() || '반려',
                  })
                } else {
                  await rejectGeneralIndividualApplication(applicant.id, {
                    reason: payload.reason.trim() || '반려',
                  })
                }
                await invalidateIndividualApplications()
              } catch (error) {
                notifyDecisionFailure(error)
                return
              } finally {
                setDecisionBusy(false)
              }
            } else {
              updateGeneralIndividualApplicantApprovalStatus(applicant.id, 'rejected', notifyOptions)
            }
            const patched =
              screeningStage === 'doc1'
                ? {
                    ...applicant,
                    documentScreeningStatus: 'fail' as const,
                    participationRejectionReason: payload.reason,
                    rejectionNotifyTiming: notifyOptions.notifyTiming,
                  }
                : patchGeneralIndividualApplicantForApprovalStatus(
                    applicant,
                    'rejected',
                    notifyOptions
                  )
            syncApplicant(patched)
            setRejectTarget(null)
            setRejectComplete({
              participantName: rejectTarget.name,
              rejectionReason: payload.reason,
            })
          }
          void run()
        }}
      />
      <ParticipantRejectCompleteModal
        open={rejectComplete != null}
        participantName={rejectComplete?.participantName ?? ''}
        rejectionReason={rejectComplete?.rejectionReason ?? ''}
        onClose={() => setRejectComplete(null)}
      />
      <ParticipantCancelRejectModal
        open={cancelRejectTarget != null}
        participant={cancelRejectParticipant}
        onCancel={() => setCancelRejectTarget(null)}
        onConfirm={(payload: ParticipantCancelRejectionConfirmPayload) => {
          if (!cancelRejectTarget) return
          const notifyOptions =
            payload.variant === 'alreadySent'
              ? toParticipantCancelRejectionNotifyOptions(payload)
              : undefined
          const patched = patchParticipantForCancelRejection(applicant, notifyOptions)
          updateGeneralIndividualApplicantCancelRejection(applicant.id, notifyOptions)
          syncApplicant(patched)
          setCancelRejectTarget(null)
          setCancelRejectComplete({ participantName: cancelRejectTarget.name })
        }}
      />
      <ParticipantCancelRejectCompleteModal
        open={cancelRejectComplete != null}
        participantName={cancelRejectComplete?.participantName ?? ''}
        onClose={() => setCancelRejectComplete(null)}
      />
    </>
  )
}
