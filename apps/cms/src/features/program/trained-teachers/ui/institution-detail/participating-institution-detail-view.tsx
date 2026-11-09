/**
 * 교육받은 교사 — 프로그램 진행 현황 참여 기관 상세 (신청 정보 | 학생 명단 | 출석 관리 | 교육 일지)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CmsButton, showNotificationResendRequestCompletedAlert } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { displayServerPiiAsIs } from '@/features/program/shared/lib/program-pii-display'
import {
  MESSAGES,
  PARTICIPATING_INSTITUTION_ALREADY_ACTIVITY_WITHDRAWN_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import {
  getProgramProgressDisplayStatus,
  resolveProgramEnrollmentDisplayStatusFromLabel,
} from '@/shared/constants/status'
import { ProgramEnrollmentStatusText } from '@/shared/components/program-enrollment-status-text'
import { StatusDropdownCell } from '@/shared/components'
import { StatusTag } from '@/shared/components/status-tag'
import { getTextbookStatusTag } from '@/shared/lib/status-tag-specs'
import { TEXTBOOK_STATUS_OPTION_KEYS } from '@/features/program/general/model/participating-schools'
import type { TextbookStatusKey } from '@/features/program/general/model/participating-schools'
import { useParticipatingInstitutionDetailEdit } from '@/features/program/general/hooks/use-participating-institution-detail-edit'
import { shouldShowInstitutionApplicationEducationFormatField } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { resolveStoredEducationFormLabel } from '@/features/program/shared/model/program-detail-edit-schema'
import { resolveTrainedTeachersEducationFormView } from '@/features/program/trained-teachers/lib/common-info-display'
import {
  canParticipatingInstitutionApplicationInfoEdit,
  getParticipatingInstitutionApplicationInfoEditBlockedAlertMessage,
} from '@/features/program/general/lib/participating-institution-application-edit-policy'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import {
  ensureTextbookNotUsedSelectOption,
  formatParticipatingInstitutionKitQuantity,
} from '@/features/program/general/lib/participating-institution-textbook'
import { resolveParticipatingInstitutionActivityWithdrawPatch } from '@/features/program/general/lib/participating-institution-activity-withdraw'
import {
  InstitutionAddressDetailEdit,
  InstitutionClassAndStudentCountEdit,
  InstitutionEducationFormatRadios,
  InstitutionGradeSelectEdit,
  InstitutionTeacherEdit,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { formatClassStudentCountSegments } from '@/features/program/general/lib/detail-value-helpers'
import {
  buildInstitutionClassCountOptions,
  resolveProgramParticipantMaxClassCount,
} from '@/features/template/lib/participant-recruitment-institution-limits'
import {
  ActivityWithdrawScheduleModal,
  type ActivityWithdrawScheduleModalPayload,
} from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { resolveSessionProgramRole } from '@/entities/program/lib/program-privacy-access'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { fetchMemberRolePrivacyUnmask } from '@/features/user/api/member-privacy-unmask'
import {
  APPLICATION_EDIT_MODE_UNMASK_REASON,
  EDIT_MODE_REVEAL,
  type PrivacyRevealOptions,
} from '@/shared/lib/privacy-unmask-purpose'
import { unmaskOrganizationApplicationPrivacyRemote } from '@/features/program/general/api/applications-api-client'
import { cacheProjectedProgramPrivacy } from '@/features/program/shared/lib/program-my-assignment'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { mergeOrganizationApplicationDetailOntoSchoolDetail } from '@/features/program/general/lib/school-detail'
import type { OrganizationApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationDetailResponse'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import { resolveTrainedTeacherTextbookDeliveryBadge } from '@/features/program/trained-teachers/api/organization-applications-adapters'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import {
  getTrainedTeacherOrganizationApplication,
  giveUpTrainedTeacherOrganizationApplication,
  resendTrainedTeacherOrganizationApplicationNotification,
} from '@/features/program/trained-teachers/api/organization-applications-service'
import { trainedTeacherQueryKeys } from '@/features/program/trained-teachers/api/query-keys'
import {
  buildTrainedTeacherActivityWithdrawScheduleOptions,
  parseTrainedTeacherStopScheduleId,
} from '@/features/program/trained-teachers/lib/organization-activity-withdraw-schedules'
import { fetchAdminProgramSchedulesRemote } from '@/features/program/general/api/program-schedules-api-client'
import { extractApiErrorMessage, getApiErrorCode } from '@/shared/lib/extract-api-error-message'
import { ApplicationGiveUpRequestFaultParty as FaultParty } from '@/shared/api/generated/dashboard/schemas/applicationGiveUpRequestFaultParty'
import axios from 'axios'
import { upsertAdminCommentByTargetRemote } from '@/features/program/general/api/admin-comments-api-client'
import {
  buildProgramApiUnavailableSaveContent,
  PROGRAM_API_UNAVAILABLE_TITLE,
} from '@/features/program/shared/lib/program-api-unavailable'
import { isCmsAdminUser } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_LABELS,
  getTrainedTeachersInstitutionDetailTabKeys,
  normalizeTrainedTeachersInstitutionDetailTab,
  type TrainedTeachersInstitutionDetailTabKey,
} from '@/features/program/trained-teachers/lib/institution-detail-tabs'
import { TrainedTeachersParticipatingInstitutionApplicationInfo } from './participating-institution-application-info'
import { ProgramApprovalStatusDetailValue } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/program-approval-status-detail-value'
import { ApplicantNotificationResendModal } from '@/features/program/shared/ui/detail-modal/components/applicant-notification-resend-modal'
import {
  canResendApplicationResultNotification,
  toApplicantNotificationResendNotifyOptions,
} from '@/features/program/general/lib/applicant-notification-resend'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { TrainedTeachersEducationJournalSection } from './education-journal-section'
import { SchoolDetailAttendanceSection } from '@/features/program/general/ui/detail-modal/program-status/school-detail-attendance-section'
import { SchoolDetailStudentListSection } from '@/features/program/general/ui/detail-modal/program-status/school-detail-student-list-section'
import { isParticipatingInstitutionStudentListApplicable } from '@/features/program/general/lib/participating-institution-detail-tabs'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import type { SchoolDetailFullpageViewProps } from '@/features/program/general/ui/detail-modal/program-status/school-detail-fullpage-view'
import '@/features/program/general/ui/detail-modal/program-status/school-detail-fullpage-view.css'
import '@/features/program/general/ui/detail-modal/program-status/participating-institutions-section.css'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info.css'

export function TrainedTeachersParticipatingInstitutionDetailView({
  program,
  detail,
  row,
  navigationCapabilities,
  navigationCapabilitiesLoading = false,
  participatingSchoolList = [],
  activeTab: activeTabFromUrl,
  onTabChange,
  onSaveBasicInfo,
  savedBasicPatches = {},
  onTextbookStatusChange,
}: SchoolDetailFullpageViewProps) {
  const currentUser = useAuthStore(state => state.user)
  const showAdminCommentSection = isCmsAdminUser(currentUser)
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const [internalTab, setInternalTab] =
    useState<TrainedTeachersInstitutionDetailTabKey>('application')
  const studentListApplicable = isParticipatingInstitutionStudentListApplicable(program)
  const visibleDetailTabs = useMemo(
    () =>
      getTrainedTeachersInstitutionDetailTabKeys(
        navigationCapabilities?.educationJournalEnabled,
        navigationCapabilities?.studentRosterEnabled,
        studentListApplicable
      ),
    [
      navigationCapabilities?.educationJournalEnabled,
      navigationCapabilities?.studentRosterEnabled,
      studentListApplicable,
    ]
  )
  const normalizedActiveTab = normalizeTrainedTeachersInstitutionDetailTab(
    activeTabFromUrl !== undefined && activeTabFromUrl !== null ? activeTabFromUrl : internalTab,
    navigationCapabilities?.educationJournalEnabled,
    studentListApplicable
  )
  const activeTab = visibleDetailTabs.includes(normalizedActiveTab)
    ? normalizedActiveTab
    : 'application'
  const setActiveTab = (key: TrainedTeachersInstitutionDetailTabKey) => {
    if (onTabChange) onTabChange(key)
    else setInternalTab(key)
  }

  const [textbookStatusDropdownOpen, setTextbookStatusDropdownOpen] = useState(false)
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [activityWithdrawSubmitting, setActivityWithdrawSubmitting] = useState(false)
  const [notificationResendOpen, setNotificationResendOpen] = useState(false)
  const [notificationResendSubmitting, setNotificationResendSubmitting] = useState(false)
  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')
  const [adminCommentError, setAdminCommentError] = useState<string | undefined>()

  const programId = String(program?.id ?? row.programId ?? '')
  const ttRemoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi() && programId !== ''

  const programSchedulesQuery = useQuery({
    queryKey: trainedTeacherQueryKeys.programSchedules(programId),
    queryFn: () => fetchAdminProgramSchedulesRemote(programId),
    enabled: ttRemoteEnabled && activityWithdrawModalOpen,
    staleTime: 60_000,
    retry: false,
  })

  const applicationDetailId = Number.isFinite(Number(row.id)) ? row.id : ''
  const activeTabUsesApplicationDetail = activeTab !== 'journal'
  const canFetchApplicationDetail =
    ttRemoteEnabled && activeTabUsesApplicationDetail && applicationDetailId !== ''
  const applicationDetailQuery = useQuery({
    queryKey: trainedTeacherQueryKeys.organizationApplication(programId, applicationDetailId),
    queryFn: () => getTrainedTeacherOrganizationApplication(programId, applicationDetailId),
    enabled: canFetchApplicationDetail,
    staleTime: 30_000,
    retry: false,
  })
  const applicationBasicInfo = useMemo(() => {
    const remote = applicationDetailQuery.data
    if (!remote) return null
    return {
      schoolName: remote.schoolName,
      region: remote.region,
      educationGrade: remote.educationGrade,
      classCount: remote.classCount,
      studentCount: remote.studentCount,
      teacherName: remote.teacherName,
      ...(remote.detail != null && Object.prototype.hasOwnProperty.call(remote.detail, 'teacherTel')
        ? { teacherPhone: remote.detail.teacherTel }
        : {}),
      ...(remote.detail?.teacherPhone != null || remote.detail?.teacherMobile != null
        ? { teacherMobile: remote.detail.teacherPhone ?? remote.detail.teacherMobile }
        : remote.contact
          ? { teacherMobile: remote.contact }
          : {}),
      teacherEmail: remote.detail?.teacherEmail,
      addressDetail: remote.detail?.addressDetail,
      ...(remote.detail?.educationType?.trim()
        ? { educationFormat: remote.detail.educationType.trim() }
        : {}),
      textbookId: remote.detail?.textbookId,
      lectureRound: remote.lectureRound,
      textbookName: remote.textbookName,
      ...(remote.textbookStatus ? { textbookStatus: remote.textbookStatus } : {}),
      ...(typeof remote.textbookKits === 'number' ? { textbookKits: remote.textbookKits } : {}),
      ...(typeof remote.textbookQuantity === 'number'
        ? { textbookQuantity: remote.textbookQuantity }
        : {}),
      applicationReason: remote.detail?.applicationReason,
      otherRequests: remote.detail?.otherRequests,
      gradeBlocks: remote.gradeBlocks ?? null,
    }
  }, [applicationDetailQuery.data])
  const rosterDependentQueryKeys = useMemo(
    () => [trainedTeacherQueryKeys.organizationApplication(programId, applicationDetailId)],
    [applicationDetailId, programId]
  )

  useEffect(() => {
    if (!activityWithdrawModalOpen || !ttRemoteEnabled) return
    if (programSchedulesQuery.isLoading || programSchedulesQuery.isFetching) return
    if (programSchedulesQuery.isError) {
      void showAlert({
        title: '안내',
        content: '프로그램 일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      })
      setActivityWithdrawModalOpen(false)
      return
    }
    if (programSchedulesQuery.isSuccess && (programSchedulesQuery.data?.length ?? 0) === 0) {
      void showAlert({
        title: '안내',
        content: '활동 포기에 사용할 프로그램 일정이 없습니다.',
      })
      setActivityWithdrawModalOpen(false)
    }
  }, [
    activityWithdrawModalOpen,
    programSchedulesQuery.data?.length,
    programSchedulesQuery.isError,
    programSchedulesQuery.isFetching,
    programSchedulesQuery.isLoading,
    programSchedulesQuery.isSuccess,
    showAlert,
    ttRemoteEnabled,
  ])

  useEffect(() => {
    setAdminCommentModalOpen(false)
    setAdminCommentDraft('')
    setAdminCommentError(undefined)
    setActivityWithdrawModalOpen(false)
  }, [detail.id, detail.adminComment, savedBasicPatches[detail.id]?.adminComment])

  const savedBasicPatch = savedBasicPatches[detail.id]
  const mergedDetail = {
    ...detail,
    ...(applicationBasicInfo ?? {}),
    ...savedBasicPatch,
  }
  const sessions = applicationDetailQuery.data?.educationScheduleSessions ?? []
  const attendanceRow = useMemo(() => {
    return {
      ...row,
      organizationApplicationId: row.organizationApplicationId ?? row.id,
      sessions,
    }
  }, [row, sessions])
  const isActivityWithdrawn = mergedDetail.activityWithdrawn === true
  const applicationApprovalStatus =
    applicationDetailQuery.data?.approvalStatus ?? row.approvalStatus
  const canResendApplicationNotification =
    ttRemoteEnabled &&
    applicationDetailId !== '' &&
    canResendApplicationResultNotification({
      approvalStatus: applicationApprovalStatus,
      availableActions:
        applicationDetailQuery.data?.availableActions ?? row.availableActions,
    })

  const activityWithdrawScheduleOptions = useMemo(
    () => buildTrainedTeacherActivityWithdrawScheduleOptions(programSchedulesQuery.data ?? []),
    [programSchedulesQuery.data]
  )

  const applicationInfoEdit = useParticipatingInstitutionDetailEdit({
    detail: mergedDetail,
    row,
    program,
    participatingSchoolList,
    onSaveBasicInfo,
  })

  const {
    isEditing: isApplicationInfoEditing,
    draft: applicationInfoDraft,
    validationErrors: applicationInfoValidationErrors,
    textbookOptions,
    textbookDisplay,
    usesTextbook,
    canEditTextbook,
    enterEdit: enterApplicationInfoEdit,
    cancelEdit: cancelApplicationInfoEdit,
    saveEdit: saveApplicationInfoEdit,
    updateDraft: updateApplicationInfoDraft,
  } = applicationInfoEdit

  const programProgressStatus =
    mergedDetail.programProgressStatus ??
    resolveProgramEnrollmentDisplayStatusFromLabel(mergedDetail.programProgressLabel) ??
    getProgramProgressDisplayStatus(program)

  const canEditApplicationInfo = canParticipatingInstitutionApplicationInfoEdit({
    program,
    enrollmentStatus: programProgressStatus,
  })
  const showEducationFormatField = shouldShowInstitutionApplicationEducationFormatField(program)
  const applicationEducationFormatDisplay = useMemo(() => {
    const fromApplication = mergedDetail.educationFormat?.trim() ?? ''
    if (fromApplication) return fromApplication
    const common = resolveGeneralProgramCommonInfo(program)
    const storedLabel = resolveStoredEducationFormLabel({
      educationFormLabel: common.educationFormLabel,
      scheduleDetails: common.scheduleDetails,
      curriculumSessions: common.curriculumSessions,
    }).trim()
    const fromProgram = resolveTrainedTeachersEducationFormView({
      programType: program.type,
      educationFormScheduleDetail: common.educationFormScheduleDetail,
      educationFormLabel: storedLabel,
    }).formLabel.trim()
    if (!fromProgram || fromProgram === '-' || fromProgram.includes('참여자')) return '-'
    return fromProgram
  }, [mergedDetail.educationFormat, program])

  useEffect(() => {
    if (isApplicationInfoEditing && !canEditApplicationInfo) {
      cancelApplicationInfoEdit()
    }
  }, [canEditApplicationInfo, cancelApplicationInfoEdit, isApplicationInfoEditing])

  const [editUnmaskConfirmOpen, setEditUnmaskConfirmOpen] = useState(false)
  const [editUnmaskConfirmLoading, setEditUnmaskConfirmLoading] = useState(false)

  const resolvePersonalInfoAccessItem = useCallback(
    () => mergedDetail.schoolName ?? row.schoolName ?? '학교 상세 정보',
    [mergedDetail.schoolName, row.schoolName]
  )

  const revealInstitutionTeacherPersonalInfo = useCallback(
    async (reason: string, options?: PrivacyRevealOptions) => {
      const orgAppId = (row.organizationApplicationId ?? row.id)?.trim()
      if (orgAppId) {
        const programIdNumber = Number(programId)
        const dto = await unmaskOrganizationApplicationPrivacyRemote(
          orgAppId,
          reason,
          Number.isFinite(programIdNumber) ? programIdNumber : undefined,
          options
        )
        return cacheProjectedProgramPrivacy(
          queryClient,
          generalApplicationsQueryKeys.organizationDetail(orgAppId),
          programId,
          dto
        )
      }
      if (row.teacherMemberId == null) {
        throw new Error('기관 신청 ID 또는 담당 교사 회원 ID가 없습니다.')
      }
      return fetchMemberRolePrivacyUnmask(row.teacherMemberId, reason, 'SCHOOL')
    },
    [programId, queryClient, row.id, row.organizationApplicationId, row.teacherMemberId]
  )

  const applyInstitutionTeacherPersonalInfo = useCallback(
    (payload: unknown) => {
      if (payload == null || typeof payload !== 'object') return
      if (
        'teacherTel' in payload ||
        'teacherPhone' in payload ||
        'organizationName' in payload ||
        'privacyMaskingLevel' in payload
      ) {
        const unmasked = mergeOrganizationApplicationDetailOntoSchoolDetail(
          detail,
          payload as OrganizationApplicationDetailResponse
        )
        onSaveBasicInfo?.({
          id: detail.id,
          teacherName: unmasked.teacherName ?? '',
          teacherPhone: unmasked.teacherPhone ?? '',
          teacherMobile: unmasked.teacherMobile ?? '',
          teacherEmail: unmasked.teacherEmail ?? '',
        })
        return
      }
      const privacy = payload as { name?: unknown; phone?: unknown; email?: unknown }
      onSaveBasicInfo?.({
        id: detail.id,
        ...(typeof privacy.name === 'string' ? { teacherName: privacy.name } : {}),
        ...(typeof privacy.phone === 'string' ? { teacherMobile: privacy.phone } : {}),
        ...(typeof privacy.email === 'string' ? { teacherEmail: privacy.email } : {}),
      })
    },
    [detail, onSaveBasicInfo]
  )

  const {
    personalInfoRevealed,
    revealWithReason,
    onPrivacyControlClick: handlePrivacyToggleClick,
    confirmModal: personalInfoRevealModal,
    programPrivacyPending,
  } = usePersonalInfoReveal({
    privacyScope: 'program',
    programId: programId,
    resolveProgramRole: () => resolveSessionProgramRole(programId),
    resolveAccessItem: resolvePersonalInfoAccessItem,
    revealPersonalInfo: revealInstitutionTeacherPersonalInfo,
    onPrivacyUnmasked: applyInstitutionTeacherPersonalInfo,
    resetDeps: [detail.id],
    controlMode: 'toggleRemask',
  })

  const handleEnterApplicationInfoEdit = useCallback(() => {
    if (!canEditApplicationInfo) {
      void showAlert({
        title: '안내',
        content: getParticipatingInstitutionApplicationInfoEditBlockedAlertMessage({
          program,
          enrollmentStatus: programProgressStatus,
        }),
      })
      return
    }
    if (personalInfoRevealed) {
      enterApplicationInfoEdit()
      return
    }
    setEditUnmaskConfirmOpen(true)
  }, [
    canEditApplicationInfo,
    enterApplicationInfoEdit,
    personalInfoRevealed,
    program,
    programProgressStatus,
    showAlert,
  ])

  const closeEditUnmaskConfirm = useCallback(() => {
    if (editUnmaskConfirmLoading) return
    setEditUnmaskConfirmOpen(false)
  }, [editUnmaskConfirmLoading])

  const confirmEditUnmaskAndStartEdit = useCallback(() => {
    if (editUnmaskConfirmLoading) return
    setEditUnmaskConfirmLoading(true)
    void revealWithReason(APPLICATION_EDIT_MODE_UNMASK_REASON, EDIT_MODE_REVEAL)
      .then(result => {
        if (!result.ok) return
        setEditUnmaskConfirmOpen(false)
        if (
          result.payload != null &&
          typeof result.payload === 'object' &&
          ('teacherTel' in result.payload ||
            'teacherPhone' in result.payload ||
            'organizationName' in result.payload)
        ) {
          enterApplicationInfoEdit(
            mergeOrganizationApplicationDetailOntoSchoolDetail(
              mergedDetail,
              result.payload as OrganizationApplicationDetailResponse
            )
          )
          return
        }
        enterApplicationInfoEdit()
      })
      .finally(() => {
        setEditUnmaskConfirmLoading(false)
      })
  }, [editUnmaskConfirmLoading, enterApplicationInfoEdit, mergedDetail, revealWithReason])

  const handleAdminCommentEditEnter = useCallback(() => {
    if (isApplicationInfoEditing) return
    setAdminCommentDraft(mergedDetail.adminComment ?? '')
    setAdminCommentError(undefined)
    setAdminCommentModalOpen(true)
  }, [isApplicationInfoEditing, mergedDetail.adminComment])

  const handleAdminCommentSave = useCallback(async () => {
    const trimmed = adminCommentDraft.trim()
    if (shouldUseTrainedTeacherProgramsRemoteApi()) {
      const targetId = Number(detail.id)
      if (!Number.isFinite(targetId)) {
        void showAlert({
          title: '안내',
          content: MESSAGES.error.save,
        })
        return
      }
      try {
        const result = await upsertAdminCommentByTargetRemote({
          targetType: 'ORGANIZATION_APPLICATION',
          targetId,
          screenCode: 'ORGANIZATION_APPLICATION',
          comment: trimmed,
        })
        onSaveBasicInfo?.({
          id: detail.id,
          adminComment: result.commentText,
        })
        setAdminCommentModalOpen(false)
        setAdminCommentError(undefined)
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
      content: buildProgramApiUnavailableSaveContent('참여 기관 관리자 코멘트'),
    })
  }, [adminCommentDraft, detail.id, onSaveBasicInfo, showAlert])

  const handleAdminCommentModalCancel = useCallback(() => {
    setAdminCommentModalOpen(false)
    setAdminCommentError(undefined)
  }, [])

  const handleAdminCommentDraftChange = useCallback((value: string) => {
    setAdminCommentDraft(value)
    setAdminCommentError(undefined)
  }, [])

  const handleRequestActivityWithdraw = useCallback(() => {
    if (isActivityWithdrawn) {
      showAlert({
        title: '활동 포기 안내',
        content: PARTICIPATING_INSTITUTION_ALREADY_ACTIVITY_WITHDRAWN_ALERT_MESSAGE,
      })
      return
    }
    if (isApplicationInfoEditing) return
    setActivityWithdrawModalOpen(true)
  }, [isActivityWithdrawn, isApplicationInfoEditing, showAlert])

  const handleConfirmActivityWithdraw = useCallback(
    async (payload: ActivityWithdrawScheduleModalPayload) => {
      const stopScheduleId = parseTrainedTeacherStopScheduleId(payload.stopSessionKey)
      if (stopScheduleId == null) {
        void showAlert({
          title: '안내',
          content: '중단할 교육 일정을 선택해 주세요.',
        })
        return
      }

      const reason = payload.reason.trim()
      if (!reason) {
        void showAlert({
          title: '안내',
          content: '활동 포기 사유를 입력해 주세요.',
        })
        return
      }
      if (payload.faultParty !== FaultParty.USER && payload.faultParty !== FaultParty.ADMIN) {
        void showAlert({
          title: '안내',
          content: '귀책 유형을 선택해 주세요.',
        })
        return
      }

      if (ttRemoteEnabled) {
        setActivityWithdrawSubmitting(true)
        try {
          await giveUpTrainedTeacherOrganizationApplication(programId, detail.id, {
            stopScheduleId,
            reason,
            faultParty: payload.faultParty,
          })
          await queryClient.invalidateQueries({
            queryKey: trainedTeacherQueryKeys.participatingInstitutions(programId),
          })
          await queryClient.invalidateQueries({
            queryKey: trainedTeacherQueryKeys.organizationApplicationsProgram(programId),
          })
          await queryClient.invalidateQueries({
            queryKey: trainedTeacherQueryKeys.lists(),
          })
          await queryClient.invalidateQueries({
            queryKey: trainedTeacherQueryKeys.overviewStages(),
          })
          await queryClient.invalidateQueries({
            queryKey: trainedTeacherQueryKeys.organizationApplication(programId, detail.id),
          })
          await queryClient.invalidateQueries({
            queryKey: trainedTeacherQueryKeys.performanceSummary(programId),
          })
          onSaveBasicInfo?.({
            id: detail.id,
            activityWithdrawn: true,
            activityWithdrawStopSessionKey: payload.stopSessionKey,
            activityWithdrawStopScheduleLabel: payload.stopScheduleLabel,
          })
          setActivityWithdrawModalOpen(false)
          void showAlert({
            title: '활동 포기',
            content: `${mergedDetail.schoolName ?? '기관'}이 활동 포기 처리되었습니다.`,
          })
        } catch (error) {
          const responseData = axios.isAxiosError(error) ? error.response?.data : undefined
          const httpStatus = axios.isAxiosError(error) ? error.response?.status : undefined
          if (
            httpStatus === 409 ||
            getApiErrorCode(error) === 'TRAINED_TEACHER_ACTIVITY_ALREADY_GIVEN_UP'
          ) {
            await queryClient.invalidateQueries({
              queryKey: trainedTeacherQueryKeys.organizationApplicationsProgram(programId),
            })
            await queryClient.invalidateQueries({
              queryKey: trainedTeacherQueryKeys.organizationApplication(programId, detail.id),
            })
            await queryClient.invalidateQueries({
              queryKey: trainedTeacherQueryKeys.performanceSummary(programId),
            })
          }
          void showAlert({
            title: '활동 포기 실패',
            content: extractApiErrorMessage(responseData, {
              httpStatus,
              fallback:
                httpStatus === 409
                  ? '이미 활동 포기 처리된 기관입니다. 최신 상태를 다시 조회했습니다.'
                  : '활동 포기 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.',
            }),
          })
        } finally {
          setActivityWithdrawSubmitting(false)
        }
        return
      }

      const patch = resolveParticipatingInstitutionActivityWithdrawPatch(
        program,
        sessions,
        payload.stopSessionKey
      )
      if (!patch) return
      onSaveBasicInfo?.({ id: detail.id, ...patch })
      setActivityWithdrawModalOpen(false)
    },
    [
      detail.id,
      mergedDetail.schoolName,
      onSaveBasicInfo,
      program,
      programId,
      queryClient,
      sessions,
      showAlert,
      ttRemoteEnabled,
    ]
  )

  const teacherDisplaySegments = [
    mergedDetail.teacherName && `담당 교사 : ${mergedDetail.teacherName}`,
    mergedDetail.teacherPhone &&
      `Tel : ${displayServerPiiAsIs(mergedDetail.teacherPhone, mergedDetail.teacherPhone)}`,
    mergedDetail.teacherMobile &&
      `M : ${displayServerPiiAsIs(mergedDetail.teacherMobile, mergedDetail.teacherMobile)}`,
    mergedDetail.teacherEmail &&
      `E-mail : ${displayServerPiiAsIs(mergedDetail.teacherEmail, mergedDetail.teacherEmail)}`,
  ].filter((v): v is string => Boolean(v))

  const hasSelectedTextbook =
    ((mergedDetail.textbookId?.trim() ?? '') !== '' &&
      mergedDetail.textbookId?.trim() !== TEXTBOOK_NOT_USED_OPTION_VALUE) ||
    ((mergedDetail.textbookName?.trim() ?? '') !== '' &&
      mergedDetail.textbookName?.trim() !== '해당 없음' &&
      mergedDetail.textbookName?.trim() !== '-') ||
    (typeof mergedDetail.textbookKits === 'number' && mergedDetail.textbookKits > 0) ||
    (typeof mergedDetail.textbookQuantity === 'number' && mergedDetail.textbookQuantity > 0)
  const storedTextbookDelivery =
    mergedDetail.textbookStatus === 'preparing' ||
    mergedDetail.textbookStatus === 'shipping' ||
    mergedDetail.textbookStatus === 'delivered' ||
    mergedDetail.textbookStatus === 'not_applicable'
      ? mergedDetail.textbookStatus
      : undefined
  const textbookDeliveryStatus = resolveTrainedTeacherTextbookDeliveryBadge(
    storedTextbookDelivery,
    hasSelectedTextbook
  )
  const textbookStatusCell =
    textbookDeliveryStatus === 'not_applicable' ? (
      <StatusTag {...getTextbookStatusTag('not_applicable')} />
    ) : onTextbookStatusChange != null ? (
      <StatusDropdownCell<TextbookStatusKey>
        status={textbookDeliveryStatus}
        statusOptions={TEXTBOOK_STATUS_OPTION_KEYS.filter(key => key !== 'not_applicable')}
        getTag={getTextbookStatusTag}
        isItemDisabled={(cur, opt) => cur === opt}
        onChange={newStatus => onTextbookStatusChange(detail.id, newStatus)}
        isOpen={textbookStatusDropdownOpen}
        onOpenChange={setTextbookStatusDropdownOpen}
      />
    ) : (
      <StatusTag {...getTextbookStatusTag(textbookDeliveryStatus)} />
    )
  const textbookNameView = !hasSelectedTextbook
    ? '해당 없음'
    : textbookDisplay.textbookName?.trim() &&
        textbookDisplay.textbookName.trim() !== '-' &&
        textbookDisplay.textbookName.trim() !== '해당 없음'
      ? textbookDisplay.textbookName.trim()
      : mergedDetail.textbookName?.trim() &&
          mergedDetail.textbookName.trim() !== '-' &&
          mergedDetail.textbookName.trim() !== '해당 없음'
        ? mergedDetail.textbookName.trim()
        : ''
  const kitsAndQty = hasSelectedTextbook
    ? formatParticipatingInstitutionKitQuantity(
        textbookDisplay.textbookKits,
        textbookDisplay.textbookQuantity
      )
    : '-'

  const textbookSelectOptions = ensureTextbookNotUsedSelectOption(textbookOptions)

  const handleConfirmApplicationNotificationResend = useCallback(
    async (payload: PermissionModalPayload) => {
      if (notificationResendSubmitting) return
      if (!programId || applicationDetailId === '') return
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
      const notifyOptions = toApplicantNotificationResendNotifyOptions(payload)
      if (applicationApprovalStatus === 'rejected' && !payload.reason.trim()) {
        void showAlert({
          title: '반려 사유 확인',
          content: '반려 알림 재발송 시 사유를 입력해 주세요.',
        })
        return
      }
      setNotificationResendSubmitting(true)
      try {
        await resendTrainedTeacherOrganizationApplicationNotification(
          programId,
          applicationDetailId,
          {
            timing: notifyOptions.notifyTiming === 'manual' ? 'SCHEDULED' : 'IMMEDIATE',
            scheduledAt:
              notifyOptions.notifyTiming === 'manual'
                ? (notifyOptions.manualNotifyAt?.toISOString() ?? null)
                : null,
            reason: applicationApprovalStatus === 'rejected' ? payload.reason.trim() : null,
          },
          `tt-org-${applicationDetailId}-${crypto.randomUUID()}`
        )
        setNotificationResendOpen(false)
        await queryClient.invalidateQueries({
          queryKey: trainedTeacherQueryKeys.organizationApplication(programId, applicationDetailId),
        })
        showNotificationResendRequestCompletedAlert()
      } catch (error) {
        void showAlert({
          title: '알림 재발송 실패',
          content: extractApiErrorMessage(error) || '알림 재발송에 실패했습니다.',
        })
      } finally {
        setNotificationResendSubmitting(false)
      }
    },
    [
      applicationApprovalStatus,
      applicationDetailId,
      notificationResendSubmitting,
      programId,
      queryClient,
      showAlert,
    ]
  )

  const programApprovalStatusCell =
    applicationApprovalStatus != null ? (
      <ProgramApprovalStatusDetailValue
        status={applicationApprovalStatus}
        participationRejectionReason={applicationDetailQuery.data?.participationRejectionReason}
        approvalNotificationSentAt={applicationDetailQuery.data?.approvalNotificationSentAt}
        onResendNotificationClick={
          canResendApplicationNotification ? () => setNotificationResendOpen(true) : undefined
        }
      />
    ) : null

  const textbookCell =
    isApplicationInfoEditing && applicationInfoDraft && canEditTextbook ? (
      <div className="institution-basic-info__field-stack school-detail-fullpage-view__textbook-select-only">
        <CmsSelect
          className="institution-basic-info__full-width-control"
          inputSize="small"
          placeholder="교재명 선택"
          withAllOption={false}
          value={applicationInfoDraft.textbookId || TEXTBOOK_NOT_USED_OPTION_VALUE}
          options={textbookSelectOptions.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            const selected = textbookSelectOptions.find(option => option.value === value)
            const isNotUsed = value === TEXTBOOK_NOT_USED_OPTION_VALUE
            updateApplicationInfoDraft({
              textbookId: isNotUsed
                ? TEXTBOOK_NOT_USED_OPTION_VALUE
                : (selected?.value ?? String(value ?? '')),
              textbookName: isNotUsed ? '해당 없음' : (selected?.textbookName ?? ''),
            })
          }}
        />
        {applicationInfoValidationErrors?.textbookId ||
        applicationInfoValidationErrors?.textbookName ? (
          <span className="institution-basic-info__field-error">
            {applicationInfoValidationErrors.textbookId ??
              applicationInfoValidationErrors.textbookName}
          </span>
        ) : null}
      </div>
    ) : !hasSelectedTextbook ? (
      '-'
    ) : (
      <div className="participating-institution-application-info__textbook-value">
        <ProgramDetailTdSegmentWrap>
          {withProgramDetailTdDivider(
            [textbookNameView, kitsAndQty !== '-' ? kitsAndQty : null, textbookStatusCell].filter(
              (part): part is NonNullable<typeof part> => part != null && part !== ''
            )
          )}
        </ProgramDetailTdSegmentWrap>
      </div>
    )

  const isApplicationDetailEditing = isApplicationInfoEditing && applicationInfoDraft != null

  const classCountOptions = useMemo(
    () => buildInstitutionClassCountOptions(resolveProgramParticipantMaxClassCount(program)),
    [program]
  )
  const classAndCountDisplay = isApplicationDetailEditing ? (
    <InstitutionClassAndStudentCountEdit
      classCount={applicationInfoDraft.classCount}
      studentCount={applicationInfoDraft.studentCount}
      classCountOptions={classCountOptions}
      onChange={patch => updateApplicationInfoDraft(patch)}
    />
  ) : (
    withProgramDetailTdDivider(
      formatClassStudentCountSegments(mergedDetail.classCount, mergedDetail.studentCount)
    )
  )

  if (navigationCapabilitiesLoading) {
    return (
      <div className="school-detail-fullpage-view" role="status">
        교육일지 설정을 확인하는 중입니다.
      </div>
    )
  }

  if (canFetchApplicationDetail && applicationDetailQuery.isPending) {
    return (
      <div className="school-detail-fullpage-view" role="status">
        기관 신청 상세 정보를 불러오는 중입니다.
      </div>
    )
  }

  if (
    canFetchApplicationDetail &&
    applicationDetailQuery.isError &&
    activeTabUsesApplicationDetail
  ) {
    return (
      <div className="school-detail-fullpage-view">
        <CmsTextTabs
          className="school-detail-fullpage-view__tabs-row"
          activeKey={activeTab}
          onChange={key => setActiveTab(key as TrainedTeachersInstitutionDetailTabKey)}
          items={visibleDetailTabs.map(key => ({
            key,
            label: TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_LABELS[key],
          }))}
        />
        <div className="program-detail-fullpage-modal__content school-detail-fullpage-view__content">
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__application-tab">
            <div className="school-detail-fullpage-view__detail-error">
              교육받은 교사 기관 신청 상세 정보를 불러오지 못했습니다.
              <CmsButton
                variant="secondary"
                size="medium"
                onClick={() => {
                  void applicationDetailQuery.refetch()
                }}
              >
                다시 시도
              </CmsButton>
            </div>
          </div>
        </div>
        <div className="school-detail-fullpage-view__page-bottom-spacer" aria-hidden />
      </div>
    )
  }

  return (
    <div className="school-detail-fullpage-view">
      <CmsTextTabs
        className="school-detail-fullpage-view__tabs-row"
        activeKey={activeTab}
        onChange={key => setActiveTab(key as TrainedTeachersInstitutionDetailTabKey)}
        items={visibleDetailTabs.map(key => ({
          key,
          label: TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_LABELS[key],
        }))}
        trailing={
          activeTab === 'application' ? (
            <>
              {!isApplicationInfoEditing ? (
                <CmsButton
                  variant="delete"
                  size="h40"
                  disabled={isActivityWithdrawn}
                  onClick={handleRequestActivityWithdraw}
                >
                  활동 포기
                </CmsButton>
              ) : null}
              <ProgramEditInfoActions
                size="h40"
                isEditing={isApplicationInfoEditing}
                idleVariant="secondary"
                disabled={
                  isApplicationInfoEditing
                    ? false
                    : !canEditApplicationInfo ||
                      (canFetchApplicationDetail && applicationDetailQuery.isLoading)
                }
                onEdit={handleEnterApplicationInfoEdit}
                onCancel={cancelApplicationInfoEdit}
                onSave={() => {
                  void saveApplicationInfoEdit()
                }}
              />
              {!isApplicationInfoEditing ? (
                <>
                  {showAdminCommentSection ? (
                    <CmsButton variant="primary" size="h40" onClick={handleAdminCommentEditEnter}>
                      코멘트 작성
                    </CmsButton>
                  ) : null}
                  <PersonalInfoRevealButton
                    disabled={programPrivacyPending}
                    labelMode="toggle"
                    revealed={personalInfoRevealed}
                    cmsSize="h40"
                    onClick={handlePrivacyToggleClick}
                  />
                </>
              ) : null}
            </>
          ) : null
        }
      />

      <div className="program-detail-fullpage-modal__content school-detail-fullpage-view__content">
        {activeTab === 'application' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__application-tab">
            <TrainedTeachersParticipatingInstitutionApplicationInfo
              formError={applicationInfoValidationErrors?.form}
              showAdminComment={showAdminCommentSection}
              adminComment={mergedDetail.adminComment}
              isAdminCommentEditing={false}
              adminCommentError={adminCommentError}
              programProgressCell={<ProgramEnrollmentStatusText status={programProgressStatus} />}
              programApprovalStatusCell={programApprovalStatusCell}
              textbookCell={textbookCell}
              usesTextbook={usesTextbook}
              textbookEditFullWidth={isApplicationInfoEditing && canEditTextbook}
              institutionId={row.id}
              educationScheduleSessions={
                applicationDetailQuery.data?.educationScheduleSessions ?? []
              }
              preferredScheduleBlocks={
                applicationDetailQuery.data?.preferredScheduleBlocks ??
                mergedDetail.preferredScheduleBlocks ??
                []
              }
              schoolName={mergedDetail.schoolName}
              educationGrade={
                isApplicationDetailEditing ? (
                  <InstitutionGradeSelectEdit
                    value={applicationInfoDraft.educationGrade}
                    onChange={value => updateApplicationInfoDraft({ educationGrade: value })}
                  />
                ) : (
                  mergedDetail.educationGrade
                )
              }
              region={mergedDetail.region}
              addressDetail={
                isApplicationDetailEditing ? (
                  <InstitutionAddressDetailEdit
                    value={applicationInfoDraft.addressDetail}
                    onChange={value => updateApplicationInfoDraft({ addressDetail: value })}
                    error={applicationInfoValidationErrors?.addressDetail}
                  />
                ) : (
                  (mergedDetail.addressDetail ?? '-')
                )
              }
              classAndCount={classAndCountDisplay}
              educationFormat={
                isApplicationDetailEditing && showEducationFormatField ? (
                  <InstitutionEducationFormatRadios
                    value={applicationInfoDraft.educationFormat}
                    onChange={value => updateApplicationInfoDraft({ educationFormat: value })}
                    error={applicationInfoValidationErrors?.educationFormat}
                  />
                ) : (
                  applicationEducationFormatDisplay
                )
              }
              teacherInfo={
                isApplicationDetailEditing ? (
                  <InstitutionTeacherEdit
                    name={applicationInfoDraft.teacherName}
                    phone={applicationInfoDraft.teacherPhone}
                    mobile={applicationInfoDraft.teacherMobile}
                    email={applicationInfoDraft.teacherEmail}
                    onChange={patch => updateApplicationInfoDraft(patch)}
                    errors={applicationInfoValidationErrors}
                  />
                ) : teacherDisplaySegments.length > 0 ? (
                  withProgramDetailTdDivider(teacherDisplaySegments)
                ) : (
                  '-'
                )
              }
              applicationReason={mergedDetail.applicationReason ?? '-'}
              otherRequests={mergedDetail.otherRequests ?? '-'}
            />
          </div>
        )}

        {activeTab === 'students' && (
          <div className="program-detail-fullpage-modal__info-tab">
            <SchoolDetailStudentListSection
              schoolId={detail.id}
              studentCount={detail.studentCount}
              classCount={mergedDetail.classCount}
              registeredGradeBlocks={mergedDetail.gradeBlocks}
              schoolName={mergedDetail.schoolName ?? row.schoolName ?? ''}
              educationGrade={mergedDetail.educationGrade ?? ''}
              organizationApplicationId={row.organizationApplicationId ?? row.id}
              programId={program.id}
              programTitle={program.mainTitle ?? program.title ?? ''}
              programStartDate={program.startDate}
              programEndDate={program.endDate}
              participationAppliedAt={mergedDetail.participationAppliedAt}
              hasStudentSatisfactionSurvey={normalizeGeneralSurveyMenuKeys(
                program.generalSurveyMenuKeys ?? []
              ).includes('satisfaction')}
              readOnly={false}
              rosterDependentQueryKeys={rosterDependentQueryKeys}
              onViewDetail={() => {}}
              onSaveEdit={() => {}}
            />
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__journal-tab">
            <TrainedTeachersEducationJournalSection
              variant="progress"
              institutionId={row.id}
              institutionName={mergedDetail.schoolName ?? row.schoolName}
              programId={program?.id ?? row.programId}
            />
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__attendance-tab">
            <SchoolDetailAttendanceSection row={attendanceRow} program={program} />
          </div>
        )}
      </div>

      <div className="school-detail-fullpage-view__page-bottom-spacer" aria-hidden />

      {personalInfoRevealModal}
      <ConfirmModal
        open={editUnmaskConfirmOpen}
        title="정보 수정 안내"
        content={
          "정보 수정 시 개인정보 마스킹이 해제되며,\n개인정보 열람 사유는 '정보 수정'으로 로그 이력에 기록됩니다.\n해당 기관의 개인정보 열람 및 정보를 수정하시겠습니까?"
        }
        confirmText="정보 수정"
        cancelText="취소"
        onConfirm={confirmEditUnmaskAndStartEdit}
        onCancel={closeEditUnmaskConfirm}
        confirmLoading={editUnmaskConfirmLoading}
        zIndex={1100}
      />

      <ActivityWithdrawScheduleModal
        open={activityWithdrawModalOpen}
        scheduleOptions={activityWithdrawScheduleOptions}
        confirming={activityWithdrawSubmitting}
        subjectName={mergedDetail.schoolName ?? row.schoolName ?? ''}
        subjectKind="institution"
        onCancel={() => {
          if (activityWithdrawSubmitting) return
          setActivityWithdrawModalOpen(false)
        }}
        onConfirm={handleConfirmActivityWithdraw}
      />
      <MemberAdminCommentModal
        open={adminCommentModalOpen}
        value={adminCommentDraft}
        onChange={handleAdminCommentDraftChange}
        onCancel={handleAdminCommentModalCancel}
        onConfirm={handleAdminCommentSave}
      />
      <ApplicantNotificationResendModal
        open={notificationResendOpen}
        subjectKind="institution"
        subjectName={mergedDetail.schoolName ?? row.schoolName ?? ''}
        approvalStatus={applicationApprovalStatus === 'rejected' ? 'rejected' : 'approved'}
        confirmLoading={notificationResendSubmitting}
        zIndex={2600}
        onCancel={() => {
          if (notificationResendSubmitting) return
          setNotificationResendOpen(false)
        }}
        onConfirm={payload => {
          void handleConfirmApplicationNotificationResend(payload)
        }}
      />
    </div>
  )
}
