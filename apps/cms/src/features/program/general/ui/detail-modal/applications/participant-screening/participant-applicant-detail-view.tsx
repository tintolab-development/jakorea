import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import {
  getGeneralIndividualApplicationsForProgram,
  patchGeneralIndividualApplicantForApprovalStatus,
  patchGeneralIndividualApplicantForNotificationResend,
  updateGeneralIndividualApplicantApprovalStatus,
  updateGeneralIndividualApplicantNotificationResend,
  type GeneralIndividualApplicantDetailSavePayload,
  type GeneralIndividualApplicantRow,
} from '@/features/program/general/model/individual-applicant'
import {
  approveGeneralIndividualApplicationWithEducationScope,
  rejectGeneralIndividualApplication,
  submitGeneralIndividualDocumentResult,
  cancelGeneralIndividualApplicationApproval,
  cancelGeneralIndividualApplicationRejection,
  submitGeneralIndividualFinalResult,
} from '@/features/program/general/api/admin-applications-service'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import type { ParticipantCancelRejectionConfirmPayload } from '@/features/program/general/lib/participant-cancel-rejection'
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
  formatIndividualApprovalScopeErrorMessage,
  invalidateIndividualApprovalScopeQueries,
  isEducationScopeRevisionConflict,
  isRejectedEducationScheduleSelectionError,
  parseRejectedEducationScheduleIds,
} from '@/features/program/general/lib/individual-approval-education-scope'
import { IndividualApproveScopeModal } from '@/features/program/general/ui/detail-modal/applications/individual-approve-scope-modal'
import {
  ParticipantApproveModal,
  ParticipantCancelApprovalModal,
  ParticipantCancelApprovalCompleteModal,
  ParticipantCancelRejectModal,
  ParticipantCancelRejectCompleteModal,
} from '@/features/program/shared/ui/detail-modal/components/participant-application-flow-modals'
import {
  showApplicationApprovalCompletedAlert,
  showApplicationRejectionCompletedAlert,
} from '@/shared/ui'
import { ApplicantNotificationResendModal } from '@/features/program/shared/ui/detail-modal/components/applicant-notification-resend-modal'
import { ProgramApplicationRejectModal } from '@/features/program/shared/ui/detail-modal/components/program-application-reject-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
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
import {
  mapIndividualApplicationDetailToApplicantRow,
  type IndividualApplicationDetailEnriched,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { resolveIndividualApplicationTeamDetail } from '@/features/program/general/lib/individual-application-team-detail'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { extractApiErrorMessage, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { formatApplicationEligibilityConflictMessage } from '@/features/program/shared/lib/application-eligibility-conflict'
import { formatApplicationDecisionCancelConflictMessage } from '@/features/program/shared/lib/application-decision-cancel-conflict'
import { formatApplicationStatusConflictMessage } from '@/features/program/shared/lib/application-status-conflict'
import {
  toNestedDecisionNotification,
  toScreeningNotifyFields,
  toTimedBulkNotifyTiming,
} from '@/features/program/general/lib/application-decision-notify-timing'
import type { VolunteerInterview2CancelFailConfirmPayload } from '@/features/program/general/lib/volunteer-interview2-cancel-fail'
import { GeneralVolunteerInterview2CancelPassModal } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/general-volunteer-interview2-cancel-pass-modal'
import { GeneralVolunteerInterview2CancelFailModal } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/general-volunteer-interview2-cancel-fail-modal'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import { MESSAGES } from '@/shared/constants/messages'
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
  const teamDetail = resolveIndividualApplicationTeamDetail({ team: response.team })

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
      teamName: teamDetail.teamName ?? row.detail?.teamName,
      teamMemberCount: teamDetail.teamMemberCount ?? row.detail?.teamMemberCount,
      teamMemberCountSelect: teamDetail.teamMemberCountSelect ?? row.detail?.teamMemberCountSelect,
      teamRole: teamDetail.teamRole ?? row.detail?.teamRole,
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
  const usesApplicationMock = false
  const useRemote = shouldUseGeneralApplicationsRemoteApi()
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
      return mapIndividualApplicationDetailToApplicantRow(
        detailQuery.data as IndividualApplicationDetailEnriched,
        base
      )
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
        content:
          formatApplicationEligibilityConflictMessage(error) ??
          formatApplicationDecisionCancelConflictMessage(error) ??
          formatApplicationStatusConflictMessage(error) ??
          extractApiErrorMessage(
            error && typeof error === 'object' && 'response' in error
              ? (error as { response?: { data?: unknown } }).response?.data
              : undefined,
            {
              httpStatus: getApiErrorHttpStatus(error),
              fallback:
                '참여자 신청 상태 변경 중 오류가 발생했습니다. 다시 시도해 주세요.',
            }
          ),
      })
    },
    [showAlert]
  )

  const [approveTarget, setApproveTarget] = useState<{ id: string; name: string } | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null)
  const [cancelRejectTarget, setCancelRejectTarget] = useState<{ id: string; name: string } | null>(
    null
  )
  const [cancelRejectComplete, setCancelRejectComplete] = useState<{
    participantName: string
  } | null>(null)
  const [cancelApprovalTarget, setCancelApprovalTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [cancelFinalPassOpen, setCancelFinalPassOpen] = useState(false)
  const [cancelFinalFailOpen, setCancelFinalFailOpen] = useState(false)
  const [cancelApprovalComplete, setCancelApprovalComplete] = useState<{
    participantName: string
    cancellationReason: string
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
            payload.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE || !payload.textbookId?.trim()
              ? null
              : Number(payload.textbookId),
          teamName: payload.teamName?.trim() || null,
          teamMemberCount: payload.teamMemberCount,
        })
        const responseRow = mergeApplicationUpdateResponse(applicant, response)
        const updated =
          payload.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE ||
          !payload.textbookId?.trim() ||
          response.textbook == null
            ? {
                ...responseRow,
                textbookId: undefined,
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
      return mapIndividualApplicationDetailToApplicantRow(
        response as IndividualApplicationDetailEnriched,
        applicant
      )
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

  const cancelApprovalParticipant = useMemo(() => {
    if (!cancelApprovalTarget || !applicant) return null
    return applicant
  }, [applicant, cancelApprovalTarget])

  const volunteerModalRow = useMemo((): GeneralVolunteerApplicantRow | null => {
    if (!applicant) return null
    return {
      id: applicant.id,
      no: applicant.no,
      name: applicant.applicantName,
      contact: '',
      email: '',
      availableActions: applicant.availableActions ?? [],
    } as GeneralVolunteerApplicantRow
  }, [applicant])

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
        onCancelApproval={id => {
          setCancelApprovalTarget({ id, name: applicant.applicantName })
        }}
        onCancelReject={id => {
          setCancelRejectTarget({ id, name: applicant.applicantName })
        }}
        onCancelFinalPass={
          usesApplicationMock
            ? undefined
            : () => {
                setCancelFinalPassOpen(true)
              }
        }
        onCancelFinalFail={
          usesApplicationMock
            ? undefined
            : () => {
                setCancelFinalFailOpen(true)
              }
        }
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
      <IndividualApproveScopeModal
        open={screeningStage !== 'doc1' && approveTarget != null}
        participantName={approveTarget?.name ?? applicant.applicantName}
        programId={program.id}
        program={program}
        preferredEducationSchedules={applicant.preferredEducationSchedules}
        confirmLoading={decisionBusy}
        onCancel={() => {
          if (decisionBusy) return
          setApproveTarget(null)
        }}
        onConfirm={payload => {
          if (!approveTarget || decisionBusy) return Promise.resolve()
          const run = async () => {
            if (!useRemote) {
              void showAlert({
                title: '승인 불가',
                content: '개인 프로그램 승인 API를 사용할 수 없습니다.',
              })
              return
            }
            setDecisionBusy(true)
            try {
              const response = await approveGeneralIndividualApplicationWithEducationScope(
                applicant.id,
                {
                  confirmedScheduleIds: payload.confirmedScheduleIds,
                  expectedScopeRevision: payload.expectedScopeRevision,
                  reason: payload.reason,
                  ...toTimedBulkNotifyTiming(payload.notifyTiming, payload.manualNotifyAt),
                }
              )
              await invalidateIndividualApprovalScopeQueries(queryClient, {
                programId: program.id,
                applicationIds: [applicant.id],
                participantIds:
                  response.decision?.participantId != null
                    ? [response.decision.participantId]
                    : [],
              })
              if (response.decision?.toStatus && response.decision.toStatus !== 'APPROVED') {
                void showAlert({
                  title: '승인 결과 확인',
                  content: `신청 상태가 ${response.decision.toStatus}로 변경되었습니다.`,
                })
                return
              }
              syncApplicant(
                patchGeneralIndividualApplicantForApprovalStatus(applicant, 'approved', {
                  notifyTiming: payload.notifyTiming,
                  manualNotifyAt: payload.manualNotifyAt ?? undefined,
                })
              )
              setApproveTarget(null)
              void showAlert({
                title: '승인 완료',
                content: '승인되었습니다.',
              })
            } catch (error) {
              await invalidateIndividualApprovalScopeQueries(queryClient, {
                programId: program.id,
                applicationIds: [applicant.id],
              })
              const message = formatIndividualApprovalScopeErrorMessage(error)
              void showAlert({
                title: isEducationScopeRevisionConflict(error) ? '교육 일정 갱신' : '처리 실패',
                content: isEducationScopeRevisionConflict(error)
                  ? `${message}\n최신 교육 일정을 다시 불러왔습니다. 선택을 확인한 뒤 다시 승인해 주세요.`
                  : message,
              })
              if (isRejectedEducationScheduleSelectionError(error)) {
                const rejectedScheduleIds = parseRejectedEducationScheduleIds(error)
                if (rejectedScheduleIds.length > 0) return { rejectedScheduleIds }
              }
            } finally {
              setDecisionBusy(false)
            }
          }
          return run()
        }}
      />
      <ParticipantApproveModal
        open={screeningStage === 'doc1' && approveTarget != null}
        participantName={approveTarget?.name ?? ''}
        onCancel={() => {
          if (decisionBusy) return
          setApproveTarget(null)
        }}
        onConfirm={payload => {
          if (!approveTarget || decisionBusy || screeningStage !== 'doc1') return
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
          }
          const run = async () => {
            if (useRemote) {
              setDecisionBusy(true)
              try {
                await submitGeneralIndividualDocumentResult(applicant.id, {
                  result: 'PASS',
                  ...toScreeningNotifyFields(payload.notifyTiming, payload.manualNotifyAt),
                })
                await invalidateIndividualApplications()
              } catch (error) {
                notifyDecisionFailure(error)
                return
              } finally {
                setDecisionBusy(false)
              }
            }
            syncApplicant({
              ...applicant,
              documentScreeningStatus: 'pass' as const,
              approvalNotifyTiming: notifyOptions.notifyTiming,
            })
            setApproveTarget(null)
            showApplicationApprovalCompletedAlert()
          }
          void run()
        }}
      />
      <ProgramApplicationRejectModal
        open={rejectTarget != null}
        audience="member"
        variant="single"
        subjectName={rejectTarget?.name ?? ''}
        zIndex={2500}
        notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.full}
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
                    ...toScreeningNotifyFields(payload.notifyTiming, payload.manualNotifyAt),
                  })
                } else {
                  await rejectGeneralIndividualApplication(applicant.id, {
                    reason: payload.reason.trim() || '반려',
                    ...toTimedBulkNotifyTiming(payload.notifyTiming, payload.manualNotifyAt),
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
            showApplicationRejectionCompletedAlert()
          }
          void run()
        }}
      />
      <ParticipantCancelApprovalModal
        open={cancelApprovalTarget != null}
        participant={cancelApprovalParticipant}
        onCancel={() => {
          if (decisionBusy) return
          setCancelApprovalTarget(null)
        }}
        onConfirm={payload => {
          if (!cancelApprovalTarget || !applicant || decisionBusy) return
          const run = async () => {
            if (useRemote) {
              setDecisionBusy(true)
              try {
                await cancelGeneralIndividualApplicationApproval(
                  applicant.id,
                  payload.reason,
                  toNestedDecisionNotification(payload.notifyTiming, payload.manualNotifyAt)
                    ?.notification
                )
                await invalidateIndividualApplications()
                await detailQuery.refetch()
              } catch (error) {
                const responseData =
                  error && typeof error === 'object' && 'response' in error
                    ? (error as { response?: { data?: unknown } }).response?.data
                    : undefined
                void showAlert({
                  title: '처리 실패',
                  content: extractApiErrorMessage(responseData, {
                    httpStatus: getApiErrorHttpStatus(error),
                    fallback: '참여자 신청 승인 취소를 처리하지 못했습니다. 다시 시도해 주세요.',
                  }),
                })
                return
              } finally {
                setDecisionBusy(false)
              }
            } else {
              notifyProgramApiUnavailable(
                'general-individual-application-cancel-approval',
                '참여자 신청 · 승인 취소'
              )
              return
            }
            setCancelApprovalTarget(null)
            setCancelApprovalComplete({
              participantName: cancelApprovalTarget.name,
              cancellationReason: payload.reason,
            })
          }
          void run()
        }}
      />
      <ParticipantCancelApprovalCompleteModal
        open={cancelApprovalComplete != null}
        participantName={cancelApprovalComplete?.participantName ?? ''}
        cancellationReason={cancelApprovalComplete?.cancellationReason ?? ''}
        onClose={() => setCancelApprovalComplete(null)}
      />
      <ParticipantCancelRejectModal
        open={cancelRejectTarget != null}
        participant={cancelRejectParticipant}
        onCancel={() => setCancelRejectTarget(null)}
        onConfirm={(payload: ParticipantCancelRejectionConfirmPayload) => {
          if (!cancelRejectTarget || !applicant || decisionBusy) return
          const run = async () => {
            if (useRemote) {
              setDecisionBusy(true)
              try {
                const rejectionReason =
                  payload.variant === 'alreadySent'
                    ? payload.reason
                    : '반려 취소'
                const notification =
                  payload.variant === 'alreadySent'
                    ? toNestedDecisionNotification(
                        payload.notifyTiming,
                        payload.manualNotifyAt
                      )?.notification
                    : undefined
                await cancelGeneralIndividualApplicationRejection(
                  applicant.id,
                  rejectionReason,
                  notification
                )
                await invalidateIndividualApplications()
                await detailQuery.refetch()
              } catch (error) {
                notifyDecisionFailure(error)
                return
              } finally {
                setDecisionBusy(false)
              }
            } else {
              notifyProgramApiUnavailable(
                'general-individual-application-cancel-rejection',
                '참여자 신청 · 반려 취소'
              )
              return
            }
            setCancelRejectTarget(null)
            setCancelRejectComplete({ participantName: cancelRejectTarget.name })
          }
          void run()
        }}
      />
      <ParticipantCancelRejectCompleteModal
        open={cancelRejectComplete != null}
        participantName={cancelRejectComplete?.participantName ?? ''}
        onClose={() => setCancelRejectComplete(null)}
      />
      <GeneralVolunteerInterview2CancelPassModal
        open={cancelFinalPassOpen}
        volunteer={volunteerModalRow}
        onCancel={() => {
          if (decisionBusy) return
          setCancelFinalPassOpen(false)
        }}
        onConfirm={payload => {
          if (!applicant || decisionBusy) return
          const run = async () => {
            if (!useRemote) {
              notifyProgramApiUnavailable(
                'general-individual-cancel-final-pass',
                '참여자 신청 · 합격 취소'
              )
              return
            }
            setDecisionBusy(true)
            try {
              const notify = toScreeningNotifyFields(
                payload.notifyTiming,
                payload.manualNotifyAt
              )
              await submitGeneralIndividualFinalResult(applicant.id, {
                result: 'FAIL',
                reason: payload.reason.trim() || '합격 취소',
                notifyTiming: notify.notifyTiming,
                scheduledAt: notify.scheduledAt,
              })
              await invalidateIndividualApplications()
              await detailQuery.refetch()
              setCancelFinalPassOpen(false)
              void showAlert({
                title: '취소 완료',
                content: MESSAGES.success.cancelled,
              })
            } catch (error) {
              notifyDecisionFailure(error)
            } finally {
              setDecisionBusy(false)
            }
          }
          void run()
        }}
      />
      <GeneralVolunteerInterview2CancelFailModal
        open={cancelFinalFailOpen}
        volunteer={volunteerModalRow}
        onCancel={() => {
          if (decisionBusy) return
          setCancelFinalFailOpen(false)
        }}
        onConfirm={(payload: VolunteerInterview2CancelFailConfirmPayload) => {
          if (!applicant || decisionBusy) return
          const run = async () => {
            if (!useRemote) {
              notifyProgramApiUnavailable(
                'general-individual-cancel-final-fail',
                '참여자 신청 · 불합격 취소'
              )
              return
            }
            setDecisionBusy(true)
            try {
              const reason =
                payload.variant === 'alreadySent'
                  ? payload.reason
                  : payload.reason.trim() || '불합격 취소'
              const notification =
                payload.variant === 'alreadySent'
                  ? toNestedDecisionNotification(
                      payload.notifyTiming,
                      payload.manualNotifyAt
                    )?.notification
                  : undefined
              await cancelGeneralIndividualApplicationRejection(
                applicant.id,
                reason,
                notification
              )
              await invalidateIndividualApplications()
              await detailQuery.refetch()
              setCancelFinalFailOpen(false)
              void showAlert({
                title: '취소 완료',
                content: MESSAGES.success.cancelled,
              })
            } catch (error) {
              notifyDecisionFailure(error)
            } finally {
              setDecisionBusy(false)
            }
          }
          void run()
        }}
      />
    </>
  )
}
