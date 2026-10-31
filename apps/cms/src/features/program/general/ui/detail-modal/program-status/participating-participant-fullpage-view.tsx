/**
 * 참여자(개인) 상세 풀페이지 인라인 뷰
 * 프로그램 진행 현황 > 참여자 — participantId 쿼리 시 목록 대신 표시
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cacheProjectedProgramPrivacy } from '@/features/program/shared/lib/program-my-assignment'
import type { Program } from '@/types/domain'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { MESSAGES } from '@/shared/constants/messages'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { resolveSessionProgramRole } from '@/entities/program/lib/program-privacy-access'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import {
  unmaskIndividualApplicationPrivacyRemote,
  updateIndividualApplication,
} from '@/features/program/general/api/applications-api-client'
import { resolveIndividualApplicationTeamDetail } from '@/features/program/general/lib/individual-application-team-detail'
import {
  extractApiErrorMessage,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'
import { fetchMemberRolePrivacyUnmask } from '@/features/user/api/member-privacy-unmask'
import {
  fetchGeneralParticipantEducationScope,
  giveUpGeneralParticipatingInstitution,
} from '@/features/program/general/api/admin-program-progress-service'
import { fetchAdminProgramEducationSlotsRemote } from '@/features/program/general/api/program-schedules-api-client'
import { individualApprovalEducationSlotsQueryKey } from '@/features/program/general/lib/individual-approval-education-scope'
import {
  resolveParticipatingIndividualProgressScheduleSessions,
  resolveParticipatingIndividualProgressScheduleSessionsFallback,
} from '@/features/program/general/lib/participating-individual-progress-schedule-sessions'
import {
  saveIndividualApplicationAdminCommentRemote,
  saveIndividualApplicationDetailRemote,
} from '@/features/program/general/api/individual-application-update-helpers'
import {
  generalApplicationsQueryKeys,
  generalProgramProgressQueryKeys,
} from '@/features/program/general/api/general-applications-query-keys'
import { mapIndividualApplicationDetailToParticipatingRow } from '@/features/program/general/lib/participating-individual-application-detail'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { useParticipatingIndividualApplicationDetailEnrichment } from '@/features/program/general/hooks/use-application-form-detail-enrichment'
import {
  buildProgramApiUnavailableSaveContent,
  notifyProgramApiUnavailable,
  PROGRAM_API_UNAVAILABLE_TITLE,
} from '@/features/program/shared/lib/program-api-unavailable'
import { useApplicantIndividualDetailEdit } from '@/features/program/general/hooks/use-applicant-individual-detail-edit'
import {
  buildParticipatingParticipantCertificateContext,
  hydrateParticipatingParticipantCertificateProfile,
} from '@/features/program/general/lib/participating-individual-participant-certificate'
import { hydrateParticipatingIndividualLectureAttendanceSessions } from '@/features/program/general/lib/participating-individual-participant-lecture-attendance'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import {
  getParticipatingInstitutionActivityWithdrawScheduleOptions,
  buildParticipatingSchoolSessionKey,
} from '@/features/program/general/lib/participating-institution-activity-withdraw'
import { screeningWithdrawCompleteContent } from '@/features/program/general/lib/screening-subject-kind'
import { isWithinStudentCertificateIssuancePeriod } from '@/features/program/general/lib/resolve-student-certificate-kind'
import type { StudentCertificateDownloadContext } from '@/features/program/general/lib/build-student-certificate-issuance'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import {
  ActivityWithdrawScheduleModal,
  type ActivityWithdrawScheduleModalPayload,
} from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import { CertificateBulkIssueReasonModal } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import type { CertificateIssueReasonValue } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { handleError } from '@/shared/utils/error-handler'
import { ApplicantGeneralIndividualBasicInfo } from '../applications/applicant-detail/individual-basic-info'
import {
  ParticipatingIndividualParticipantAttendanceSection,
  type ParticipatingIndividualParticipantAttendanceSectionHandle,
} from './participating-individual-participant-attendance-section'
import {
  ParticipatingIndividualParticipantAssignmentSection,
  type ParticipatingIndividualParticipantAssignmentSectionHandle,
} from './participating-individual-participant-assignment-section'
import { ParticipatingParticipantSettlementSection } from './participating-participant-settlement-section'
import { StudentCertificatePdfExportHost } from './student-certificate-pdf-export-host'
import { isSubmissionTeamApplicable } from '@/features/program/general/lib/submission-team-applicable'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import {
  getParticipantDetailTabKeys,
  getParticipantDetailTabLabel,
  normalizeParticipantDetailTab,
  type ParticipantDetailTabKey,
} from '@/features/program/general/lib/participating-individual-detail-tabs'
import './school-detail-fullpage-view.css'
import './participating-participant-fullpage-view.css'

const APPLICATION_INFO_EDIT_UNMASK_REASON = '신청 정보 수정'

const APPLICATION_INFO_EDIT_UNMASK_CONFIRM_CONTENT =
  "정보 수정 시 개인정보 마스킹이 해제되며,\n개인정보 열람 사유는 '정보 수정'으로 로그 이력에 기록됩니다.\n해당 참여자의 개인정보 열람 및 정보를 수정하시겠습니까?"

const APPLICATION_INFO_EDIT_UNMASK_MODAL_Z_INDEX = 1100

export interface ParticipatingParticipantFullpageViewProps {
  program: Program
  participant: ParticipatingIndividualParticipantRow
  activeTab?: ParticipantDetailTabKey
  onTabChange?: (key: ParticipantDetailTabKey) => void
  onClearParticipantId: () => void
}

export function ParticipatingParticipantFullpageView({
  program,
  participant: initialParticipant,
  activeTab = 'application',
  onTabChange,
  onClearParticipantId: _onClearParticipantId,
}: ParticipatingParticipantFullpageViewProps) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const progressRemoteEnabled = shouldUseGeneralProgramProgressRemoteApi()
  const attendanceSectionRef =
    useRef<ParticipatingIndividualParticipantAttendanceSectionHandle>(null)
  const assignmentSectionRef =
    useRef<ParticipatingIndividualParticipantAssignmentSectionHandle>(null)
  const [submissionTeamRejected, setSubmissionTeamRejected] = useState(false)
  const submissionTeamApplicable =
    isSubmissionTeamApplicable(program.businessArea) && !submissionTeamRejected
  const handleSubmissionTeamNotApplicable = useCallback(() => setSubmissionTeamRejected(true), [])
  const [participantPatches, setParticipantPatches] = useState<
    Partial<ParticipatingIndividualParticipantRow>
  >({})
  const [savedAdminComment, setSavedAdminComment] = useState('')
  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [activityWithdrawSubmitting, setActivityWithdrawSubmitting] = useState(false)
  const [certificateIssueModalOpen, setCertificateIssueModalOpen] = useState(false)
  const [certificateExportContext, setCertificateExportContext] =
    useState<StudentCertificateDownloadContext | null>(null)
  const [certificateExportActive, setCertificateExportActive] = useState(false)
  const availableTabKeys = useMemo(() => getParticipantDetailTabKeys(program), [program])
  const visibleActiveTab = availableTabKeys.includes(activeTab) ? activeTab : 'application'

  const enrichedParticipant =
    useParticipatingIndividualApplicationDetailEnrichment(initialParticipant)
  const baseParticipant = enrichedParticipant ?? initialParticipant

  const mergedParticipant = useMemo(
    () => ({ ...baseParticipant, ...participantPatches }),
    [baseParticipant, participantPatches]
  )

  const individualApplicationId = mergedParticipant.individualApplicationId?.trim() || ''
  const hasIndividualApplicationId = individualApplicationId !== ''

  const sessions = mergedParticipant.sessions ?? []
  const isActivityWithdrawn = mergedParticipant.activityWithdrawn === true

  const educationScopeQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.educationScope(program.id, mergedParticipant.id),
    queryFn: () => fetchGeneralParticipantEducationScope(program.id, mergedParticipant.id),
    enabled:
      progressRemoteEnabled &&
      mergedParticipant.approvalStatus === 'approved' &&
      Boolean(mergedParticipant.id.trim()),
    staleTime: 0,
    retry: false,
  })
  const educationSlotsQuery = useQuery({
    queryKey: individualApprovalEducationSlotsQueryKey(program.id),
    queryFn: () => fetchAdminProgramEducationSlotsRemote(program.id),
    enabled:
      progressRemoteEnabled &&
      mergedParticipant.approvalStatus === 'approved' &&
      (educationScopeQuery.data?.scheduleIds?.length ?? 0) > 0,
    staleTime: 0,
    retry: false,
  })

  const progressScheduleSessions = useMemo(() => {
    if (mergedParticipant.approvalStatus !== 'approved') return []
    if (!progressRemoteEnabled) {
      return resolveParticipatingIndividualProgressScheduleSessionsFallback(sessions)
    }
    if (!educationScopeQuery.isSuccess) return []
    return resolveParticipatingIndividualProgressScheduleSessions({
      participantSessions: sessions,
      assignedScheduleIds: educationScopeQuery.data?.scheduleIds,
      educationSlots: educationSlotsQuery.data,
    })
  }, [
    educationScopeQuery.data?.scheduleIds,
    educationScopeQuery.isSuccess,
    educationSlotsQuery.data,
    mergedParticipant.approvalStatus,
    progressRemoteEnabled,
    sessions,
  ])

  const progressScheduleSessionsLoading =
    progressRemoteEnabled &&
    mergedParticipant.approvalStatus === 'approved' &&
    educationScopeQuery.isLoading

  const activityWithdrawScheduleOptions = useMemo(
    () =>
      getParticipatingInstitutionActivityWithdrawScheduleOptions(
        program,
        progressScheduleSessions.length > 0 ? progressScheduleSessions : sessions
      ),
    [program, progressScheduleSessions, sessions]
  )

  const hasStudentSatisfactionSurvey = useMemo(
    () =>
      normalizeGeneralSurveyMenuKeys(program.generalSurveyMenuKeys ?? []).includes('satisfaction'),
    [program.generalSurveyMenuKeys]
  )

  const resolvePersonalInfoAccessItem = useCallback(
    () => mergedParticipant.applicantName ?? '참여자 상세 정보',
    [mergedParticipant.applicantName]
  )

  const revealParticipatingParticipantPersonalInfo = useCallback(
    async (reason: string) => {
      if (hasIndividualApplicationId) {
        const dto = await unmaskIndividualApplicationPrivacyRemote(individualApplicationId, reason)
        const safeDto = cacheProjectedProgramPrivacy(
          queryClient,
          generalApplicationsQueryKeys.individualDetail(individualApplicationId),
          program.id,
          dto
        )
        const mapped = mapIndividualApplicationDetailToParticipatingRow(safeDto, mergedParticipant)
        setParticipantPatches(prev => ({
          ...prev,
          applicantName: mapped.applicantName,
          homeAddress: mapped.homeAddress,
          memberId: mapped.memberId,
          detail: {
            ...mergedParticipant.detail,
            ...mapped.detail,
          },
        }))
        return {
          name: dto.profile?.name?.trim() || undefined,
          phone: dto.profile?.contact?.trim() || undefined,
          email: dto.profile?.email?.trim() || undefined,
          address: mapped.homeAddress?.trim() || undefined,
        }
      }

      const memberId = Number(mergedParticipant.memberId)
      if (!Number.isFinite(memberId) || memberId <= 0) {
        throw new Error('개인 신청 ID 또는 회원 ID가 없습니다.')
      }
      return fetchMemberRolePrivacyUnmask(memberId, reason, 'INDIVIDUAL')
    },
    [hasIndividualApplicationId, individualApplicationId, mergedParticipant, queryClient]
  )

  const applyParticipatingParticipantPersonalInfo = useCallback(
    (payload: unknown) => {
      if (payload == null || typeof payload !== 'object') return
      const privacy = payload as {
        name?: unknown
        phone?: unknown
        email?: unknown
        address?: unknown
      }
      setParticipantPatches(prev => ({
        ...prev,
        ...(typeof privacy.name === 'string' ? { applicantName: privacy.name } : {}),
        ...(typeof privacy.address === 'string' ? { homeAddress: privacy.address } : {}),
        detail: {
          ...mergedParticipant.detail,
          ...prev.detail,
          ...(typeof privacy.phone === 'string' ? { contact: privacy.phone } : {}),
          ...(typeof privacy.email === 'string' ? { email: privacy.email } : {}),
          ...(typeof privacy.address === 'string' ? { homeAddressFull: privacy.address } : {}),
        },
      }))
    },
    [mergedParticipant.detail]
  )

  const {
    personalInfoRevealed,
    revealWithReason,
    openPersonalInfoRevealConfirm,
    confirmModal: personalInfoRevealModal,
  programPrivacyPending,
  } = usePersonalInfoReveal({
    privacyScope: 'program',
    programId: program.id,
    resolveProgramRole: () => resolveSessionProgramRole(program.id),
    resolveAccessItem: resolvePersonalInfoAccessItem,
    revealPersonalInfo: revealParticipatingParticipantPersonalInfo,
    onPrivacyUnmasked: applyParticipatingParticipantPersonalInfo,
    resetDeps: [mergedParticipant.id, individualApplicationId, mergedParticipant.memberId],
    controlMode: 'headerStickyNoop',
  })

  const privacyMasked = !personalInfoRevealed
  const [editUnmaskConfirmOpen, setEditUnmaskConfirmOpen] = useState(false)
  const [editUnmaskConfirmLoading, setEditUnmaskConfirmLoading] = useState(false)

  const handleParticipantSaved = useCallback((updatedRow: GeneralIndividualApplicantRow) => {
    setParticipantPatches(prev => ({
      ...prev,
      adminComment: updatedRow.adminComment,
      textbookId: updatedRow.textbookId,
      textbookName: updatedRow.textbookName,
      textbookKits: updatedRow.textbookKits,
      textbookQuantity: updatedRow.textbookQuantity,
      textbookStatus: updatedRow.textbookStatus,
      detail: updatedRow.detail,
    }))
    if (updatedRow.adminComment != null) {
      setSavedAdminComment(updatedRow.adminComment)
    }
  }, [])

  const {
    isEditing: isApplicationInfoEditing,
    draft,
    validationErrors,
    textbookOptions,
    enterEdit: enterApplicationInfoEdit,
    cancelEdit: cancelApplicationInfoEdit,
    saveEdit: saveApplicationInfoEdit,
    updateDraft,
  } = useApplicantIndividualDetailEdit({
    applicant: mergedParticipant,
    program,
    onSaved: handleParticipantSaved,
    saveApplicant: async payload => {
      if (!shouldUseGeneralApplicationsRemoteApi() || !hasIndividualApplicationId) {
        return null
      }
      return saveIndividualApplicationDetailRemote(mergedParticipant, payload)
    },
  })

  const requestStartApplicationInfoEdit = useCallback(() => {
    if (personalInfoRevealed) {
      enterApplicationInfoEdit()
      return
    }
    setEditUnmaskConfirmOpen(true)
  }, [enterApplicationInfoEdit, personalInfoRevealed])

  const closeEditUnmaskConfirm = useCallback(() => {
    if (editUnmaskConfirmLoading) return
    setEditUnmaskConfirmOpen(false)
  }, [editUnmaskConfirmLoading])

  const confirmEditUnmaskAndStartEdit = useCallback(() => {
    if (editUnmaskConfirmLoading) return
    setEditUnmaskConfirmLoading(true)
    void revealWithReason(APPLICATION_INFO_EDIT_UNMASK_REASON)
      .then(result => {
        if (!result.ok) return
        setEditUnmaskConfirmOpen(false)
        enterApplicationInfoEdit()
      })
      .finally(() => {
        setEditUnmaskConfirmLoading(false)
      })
  }, [editUnmaskConfirmLoading, enterApplicationInfoEdit, revealWithReason])

  useEffect(() => {
    setParticipantPatches({})
    setSavedAdminComment(baseParticipant.adminComment ?? '')
    setAdminCommentModalOpen(false)
    setAdminCommentDraft('')
    setActivityWithdrawModalOpen(false)
    setActivityWithdrawSubmitting(false)
    setCertificateIssueModalOpen(false)
    setCertificateExportContext(null)
    setCertificateExportActive(false)
    setEditUnmaskConfirmOpen(false)
    setEditUnmaskConfirmLoading(false)
  }, [initialParticipant.id, baseParticipant.adminComment])

  const setActiveTab = (key: string) => {
    onTabChange?.(normalizeParticipantDetailTab(key, program))
  }

  const handleRequestActivityWithdraw = useCallback(() => {
    if (isActivityWithdrawn) {
      showAlert({
        title: '활동 포기 안내',
        content: '이미 활동 포기 처리된 참여자입니다.',
      })
      return
    }
    if (activityWithdrawScheduleOptions.length === 0) {
      showAlert({
        title: '안내',
        content: '활동 포기 처리할 수 있는 교육 일정이 없습니다.',
      })
      return
    }
    if (isApplicationInfoEditing) return
    setActivityWithdrawModalOpen(true)
  }, [
    activityWithdrawScheduleOptions.length,
    isActivityWithdrawn,
    isApplicationInfoEditing,
    showAlert,
  ])

  const handleConfirmActivityWithdraw = useCallback(
    async (payload: ActivityWithdrawScheduleModalPayload) => {
      const matched = sessions
        .map((session, index) => ({
          session,
          key: buildParticipatingSchoolSessionKey(session, index),
        }))
        .find(({ key }) => key === payload.stopSessionKey)
      const stopScheduleIdRaw = matched?.session.resolvedScheduleId
      const stopScheduleIdNum = stopScheduleIdRaw != null ? Number(stopScheduleIdRaw) : Number.NaN

      if (progressRemoteEnabled) {
        setActivityWithdrawSubmitting(true)
        try {
          await giveUpGeneralParticipatingInstitution(program.id, mergedParticipant.id, {
            reason: payload.reason,
            faultParty: payload.faultParty,
            stopScheduleId: Number.isFinite(stopScheduleIdNum) ? stopScheduleIdNum : undefined,
          })
          await queryClient.invalidateQueries({
            queryKey: generalProgramProgressQueryKeys.participants(program.id, 'INDIVIDUAL'),
          })
          setParticipantPatches(prev => ({
            ...prev,
            activityWithdrawn: true,
            activityWithdrawStopSessionKey: payload.stopSessionKey,
            activityWithdrawStopScheduleLabel: payload.stopScheduleLabel,
          }))
          setActivityWithdrawModalOpen(false)
          showAlert({
            title: '활동 포기',
            content: screeningWithdrawCompleteContent(
              'participant',
              mergedParticipant.applicantName
            ),
          })
        } catch (error) {
          const message =
            error instanceof Error && error.message.trim()
              ? error.message
              : '활동 포기 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          showAlert({
            title: '활동 포기 실패',
            content: message,
          })
        } finally {
          setActivityWithdrawSubmitting(false)
        }
        return
      }

      notifyProgramApiUnavailable(
        'general-participating-individual-give-up',
        '일반 프로그램 · 참여자 활동 포기'
      )
    },
    [
      mergedParticipant.applicantName,
      mergedParticipant.id,
      program.id,
      progressRemoteEnabled,
      queryClient,
      sessions,
      showAlert,
    ]
  )

  const handleCertificateIssueClick = useCallback(() => {
    if (certificateExportActive) return
    if (!isWithinStudentCertificateIssuancePeriod(mergedParticipant.participationAppliedAt)) {
      return
    }
    if (isApplicationInfoEditing) return
    setCertificateIssueModalOpen(true)
  }, [certificateExportActive, isApplicationInfoEditing, mergedParticipant.participationAppliedAt])

  const handleCertificateIssueModalCancel = useCallback(() => {
    setCertificateIssueModalOpen(false)
  }, [])

  const handleCertificateIssueConfirm = useCallback(
    async (_reason: CertificateIssueReasonValue, reasonLabel: string) => {
      try {
        const [lectureAttendanceSessions, profileHydrated] = await Promise.all([
          progressRemoteEnabled
            ? hydrateParticipatingIndividualLectureAttendanceSessions({
                programId: String(program.id),
                participantId: mergedParticipant.id,
                existing: mergedParticipant.lectureAttendanceSessions,
              })
            : mergedParticipant.lectureAttendanceSessions,
          shouldUseGeneralApplicationsRemoteApi()
            ? hydrateParticipatingParticipantCertificateProfile(mergedParticipant)
            : mergedParticipant,
        ])

        setCertificateExportContext(
          buildParticipatingParticipantCertificateContext({
            participant: { ...profileHydrated, lectureAttendanceSessions },
            program,
            hasStudentSatisfactionSurvey,
            issuanceReasonLabel: reasonLabel,
          })
        )
        setCertificateExportActive(true)
      } catch (error) {
        handleError(error, {
          context: 'participatingParticipantFullpageView.certificateAttendanceHydrate',
        })
        showAlert({
          title: '열람 실패',
          content: '개인정보 원문 조회에 실패했습니다.',
        })
      }
    },
    [hasStudentSatisfactionSurvey, mergedParticipant, program, progressRemoteEnabled, showAlert]
  )

  const handleCertificateExportComplete = useCallback((success: boolean) => {
    setCertificateExportContext(null)
    setCertificateExportActive(false)
    setCertificateIssueModalOpen(false)
    if (!success) {
      handleError(new Error('participant certificate pdf export failed'), {
        context: 'participatingParticipantFullpageView.certificateDownload',
      })
    }
  }, [])

  const handleAdminCommentEditEnter = useCallback(() => {
    if (isApplicationInfoEditing) return
    setAdminCommentDraft(savedAdminComment)
    setAdminCommentModalOpen(true)
  }, [isApplicationInfoEditing, savedAdminComment])

  const handleAdminCommentSave = useCallback(async () => {
    const trimmed = adminCommentDraft.trim()
    if (shouldUseGeneralApplicationsRemoteApi() && hasIndividualApplicationId) {
      try {
        const updated = await saveIndividualApplicationAdminCommentRemote(
          mergedParticipant,
          trimmed
        )
        setSavedAdminComment(updated.adminComment ?? '')
        setParticipantPatches(prev => ({ ...prev, adminComment: updated.adminComment }))
        setAdminCommentModalOpen(false)
        return
      } catch {
        void showAlert({
          title: '안내',
          content: MESSAGES.error.save,
        })
        return
      }
    }
    void showAlert({
      title: PROGRAM_API_UNAVAILABLE_TITLE,
      content: hasIndividualApplicationId
        ? buildProgramApiUnavailableSaveContent('참여자 관리자 코멘트')
        : '개인 신청 ID가 없어 코멘트를 저장할 수 없습니다. participants API에 sourceApplicationId 매핑이 필요합니다.',
    })
  }, [adminCommentDraft, hasIndividualApplicationId, mergedParticipant, showAlert])

  const handleAdminCommentModalCancel = useCallback(() => {
    setAdminCommentModalOpen(false)
  }, [])

  const handleAdminCommentDraftChange = useCallback((value: string) => {
    setAdminCommentDraft(value)
  }, [])

  const displayAdminComment =
    isApplicationInfoEditing && draft
      ? draft.adminComment
      : savedAdminComment || mergedParticipant.adminComment

  const saveTeamRole = useCallback(
    async (teamRole: 'leader' | 'member') => {
      if (!shouldUseGeneralApplicationsRemoteApi() || !hasIndividualApplicationId) {
        void showAlert({
          title: PROGRAM_API_UNAVAILABLE_TITLE,
          content: buildProgramApiUnavailableSaveContent('참여자 팀 역할'),
        })
        return
      }
      try {
        const response = await updateIndividualApplication(individualApplicationId, {
          teamRole: teamRole.toUpperCase() as 'LEADER' | 'MEMBER',
        })
        const teamDetail = resolveIndividualApplicationTeamDetail({ team: response.team })
        setParticipantPatches(prev => ({
          ...prev,
          detail: {
            ...mergedParticipant.detail,
            ...prev.detail,
            teamRole: teamDetail.teamRole ?? teamRole,
            teamName: teamDetail.teamName ?? mergedParticipant.detail?.teamName,
            teamMemberCount:
              teamDetail.teamMemberCount ?? mergedParticipant.detail?.teamMemberCount,
          },
        }))
        await queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.individualDetail(individualApplicationId),
        })
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
        throw error
      }
    },
    [
      hasIndividualApplicationId,
      individualApplicationId,
      mergedParticipant.detail,
      queryClient,
      showAlert,
    ]
  )

  return (
    <div className="participating-participant-fullpage-view school-detail-fullpage-view">
      <CmsTextTabs
        className="school-detail-fullpage-view__tabs-row"
        activeKey={visibleActiveTab}
        onChange={setActiveTab}
        items={availableTabKeys.map(key => ({
          key,
          label: getParticipantDetailTabLabel(key),
        }))}
        trailing={
          visibleActiveTab === 'application' ? (
            <>
              <CmsButton
                variant="delete"
                size="h40"
                disabled={
                  isActivityWithdrawn ||
                  isApplicationInfoEditing ||
                  activityWithdrawSubmitting ||
                  activityWithdrawScheduleOptions.length === 0
                }
                onClick={handleRequestActivityWithdraw} >
                활동 포기
              </CmsButton>
              <CmsButton
                variant="secondary"
                size="h40"
                icon={<ButtonDownloadIcon />}
                disabled={
                  certificateExportActive ||
                  isApplicationInfoEditing ||
                  !isWithinStudentCertificateIssuancePeriod(
                    mergedParticipant.participationAppliedAt
                  )
                }
                onClick={handleCertificateIssueClick} >
                수료증/참여인증서 발급
              </CmsButton>
              <ProgramEditInfoActions
                size="h40"
                isEditing={isApplicationInfoEditing}
                onEdit={requestStartApplicationInfoEdit}
                onCancel={cancelApplicationInfoEdit}
                onSave={() => {
                  void saveApplicationInfoEdit()
                }} />
              <CmsButton
                variant="primary"
                size="h40"
                disabled={isApplicationInfoEditing}
                onClick={handleAdminCommentEditEnter} >
                코멘트 작성
              </CmsButton>
              <PersonalInfoRevealButton disabled={programPrivacyPending}
                labelMode="stickyReveal"
                revealed={personalInfoRevealed}
                cmsSize="h40"
                onClick={openPersonalInfoRevealConfirm} />
            </>
          ) : visibleActiveTab === 'attendance' ? (
            <>
              <CmsButton
                variant="secondary"
                size="h40"
                onClick={() => attendanceSectionRef.current?.openAttendanceCorrectionModal()} >
                출결 정정
              </CmsButton>
              <ExcelButton
                size="h40"
                onClick={() => attendanceSectionRef.current?.exportExcel()} />
            </>
          ) : visibleActiveTab === 'assignments' ? (
            <>
              {submissionTeamApplicable ? (
                <CmsButton
                  variant="secondary"
                  size="h40"
                  onClick={() => assignmentSectionRef.current?.openTeamChangeModal()} >
                  팀 변경
                </CmsButton>
              ) : null}
              <CmsButton
                variant="secondary"
                size="h40"
                icon={<ButtonDownloadIcon />}
                adminAction="download"
                onClick={() => assignmentSectionRef.current?.bulkDownloadAssignments()} >
                과제 일괄 다운로드
              </CmsButton>
              <ExcelButton onClick={() => assignmentSectionRef.current?.exportExcel()} />
            </>
          ) : null
        }
      />

      <div className="program-detail-fullpage-modal__content school-detail-fullpage-view__content">
        {visibleActiveTab === 'application' ? (
          <div className="program-detail-fullpage-modal__info-tab">
            <div className="program-detail-fullpage-modal__info-tab-block participating-participant-fullpage-view__section-block">
              <ApplicantGeneralIndividualBasicInfo
                applicant={{
                  ...mergedParticipant,
                  adminComment: displayAdminComment,
                }}
                program={program}
                maskSensitive={privacyMasked}
                mode={isApplicationInfoEditing ? 'edit' : 'view'}
                detailContext="progress"
                draft={isApplicationInfoEditing ? (draft ?? undefined) : undefined}
                onDraftChange={isApplicationInfoEditing ? updateDraft : undefined}
                validationErrors={validationErrors}
                textbookOptions={textbookOptions}
                onTeamRoleChange={
                  shouldUseGeneralApplicationsRemoteApi() && hasIndividualApplicationId
                    ? saveTeamRole
                    : undefined
                }
                progressScheduleSessions={progressScheduleSessions}
                progressScheduleSessionsLoading={progressScheduleSessionsLoading}
              />
            </div>
          </div>
        ) : visibleActiveTab === 'attendance' ? (
          <div
            className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab"
            aria-label="출석 관리"
          >
            <ParticipatingIndividualParticipantAttendanceSection
              ref={attendanceSectionRef}
              program={program}
              participant={mergedParticipant}
              assignedSessions={progressScheduleSessions}
              assignedSessionsLoading={progressScheduleSessionsLoading}
            />
          </div>
        ) : visibleActiveTab === 'assignments' ? (
          <div
            className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab"
            aria-label="과제 관리"
          >
            <ParticipatingIndividualParticipantAssignmentSection
              ref={assignmentSectionRef}
              program={program}
              participant={mergedParticipant}
              onTeamFeatureNotApplicable={handleSubmissionTeamNotApplicable}
            />
          </div>
        ) : visibleActiveTab === 'settlement' ? (
          <div
            className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab"
            aria-label="정산 현황"
          >
            <ParticipatingParticipantSettlementSection
              program={program}
              participant={mergedParticipant}
            />
          </div>
        ) : null}
      </div>

      <ActivityWithdrawScheduleModal
        open={activityWithdrawModalOpen}
        scheduleOptions={activityWithdrawScheduleOptions}
        onCancel={() => setActivityWithdrawModalOpen(false)}
        onConfirm={handleConfirmActivityWithdraw}
        confirming={activityWithdrawSubmitting}
        subjectName={mergedParticipant.applicantName ?? ''}
        subjectKind="person"
      />
      <CertificateBulkIssueReasonModal
        open={certificateIssueModalOpen}
        onCancel={handleCertificateIssueModalCancel}
        applicationIds={[mergedParticipant.id]}
        onIssue={handleCertificateIssueConfirm}
      />
      <FormCertificatePdfExportOverlay visible={certificateExportActive} />
      {certificateExportContext != null ? (
        <StudentCertificatePdfExportHost
          key={`${certificateExportContext.student.id}-${certificateExportContext.certificateKind}-${certificateExportContext.issuanceReasonLabel}`}
          context={certificateExportContext}
          onComplete={handleCertificateExportComplete}
        />
      ) : null}
      {personalInfoRevealModal}
      <ConfirmModal
        open={editUnmaskConfirmOpen}
        title="정보 수정 안내"
        content={APPLICATION_INFO_EDIT_UNMASK_CONFIRM_CONTENT}
        confirmText="정보 수정"
        cancelText="취소"
        onConfirm={confirmEditUnmaskAndStartEdit}
        onCancel={closeEditUnmaskConfirm}
        confirmLoading={editUnmaskConfirmLoading}
        zIndex={APPLICATION_INFO_EDIT_UNMASK_MODAL_Z_INDEX}
      />
      <MemberAdminCommentModal
        open={adminCommentModalOpen}
        value={adminCommentDraft}
        onChange={handleAdminCommentDraftChange}
        onCancel={handleAdminCommentModalCancel}
        onConfirm={handleAdminCommentSave}
      />
      <div className="school-detail-fullpage-view__page-bottom-spacer" aria-hidden />
    </div>
  )
}
