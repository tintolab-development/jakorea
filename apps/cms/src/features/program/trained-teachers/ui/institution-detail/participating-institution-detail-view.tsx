/**
 * 교육받은 교사 — 프로그램 진행 현황 참여 기관 상세 (신청 정보 | 교육 일지 2탭)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CmsButton } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
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
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME,
} from '@/shared/components'
import { TEXTBOOK_STATUS_OPTION_KEYS } from '@/features/program/general/model/participating-schools'
import type { TextbookStatusKey } from '@/features/program/general/model/participating-schools'
import { useParticipatingInstitutionDetailEdit } from '@/features/program/general/hooks/use-participating-institution-detail-edit'
import { shouldShowInstitutionApplicationEducationFormatField } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import {
  canParticipatingInstitutionApplicationInfoEdit,
  getParticipatingInstitutionApplicationInfoEditBlockedAlertMessage,
} from '@/features/program/general/lib/participating-institution-application-edit-policy'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import { ensureTextbookNotUsedSelectOption } from '@/features/program/general/lib/participating-institution-textbook'
import { resolveParticipatingInstitutionActivityWithdrawPatch } from '@/features/program/general/lib/participating-institution-activity-withdraw'
import {
  InstitutionAddressDetailEdit,
  InstitutionClassAndStudentCountEdit,
  InstitutionEducationFormatRadios,
  InstitutionGradeSelectEdit,
  InstitutionMultilineEdit,
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
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { fetchMemberRolePrivacyUnmask } from '@/features/user/api/member-privacy-unmask'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import {
  getTrainedTeacherOrganizationApplication,
  giveUpTrainedTeacherOrganizationApplication,
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
import { TrainedTeachersEducationJournalSection } from './education-journal-section'
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
  const visibleDetailTabs = useMemo(
    () =>
      getTrainedTeachersInstitutionDetailTabKeys(navigationCapabilities?.educationJournalEnabled),
    [navigationCapabilities?.educationJournalEnabled]
  )
  const normalizedActiveTab = normalizeTrainedTeachersInstitutionDetailTab(
    activeTabFromUrl !== undefined && activeTabFromUrl !== null ? activeTabFromUrl : internalTab
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
  const canFetchApplicationDetail =
    ttRemoteEnabled && activeTab === 'application' && applicationDetailId !== ''
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
      teacherPhone: remote.contact,
      teacherMobile: remote.contact,
      teacherEmail: remote.detail?.teacherEmail,
      addressDetail: remote.detail?.addressDetail,
      educationFormat: remote.detail?.educationType,
      textbookId: remote.detail?.textbookId,
      lectureRound: remote.lectureRound,
      textbookName: remote.textbookName,
      applicationReason: remote.detail?.applicationReason,
      otherRequests: remote.detail?.otherRequests,
      preferredScheduleBlocks: remote.preferredScheduleBlocks ?? [],
    }
  }, [applicationDetailQuery.data])

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
  const sessions = row.sessions ?? []
  const isActivityWithdrawn = mergedDetail.activityWithdrawn === true

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

  useEffect(() => {
    if (isApplicationInfoEditing && !canEditApplicationInfo) {
      cancelApplicationInfoEdit()
    }
  }, [canEditApplicationInfo, cancelApplicationInfoEdit, isApplicationInfoEditing])

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
    enterApplicationInfoEdit()
  }, [canEditApplicationInfo, enterApplicationInfoEdit, program, programProgressStatus, showAlert])

  const resolvePersonalInfoAccessItem = useCallback(
    () => mergedDetail.schoolName ?? row.schoolName ?? '학교 상세 정보',
    [mergedDetail.schoolName, row.schoolName]
  )

  const revealInstitutionTeacherPersonalInfo = useCallback(
    async (reason: string) => {
      if (row.teacherMemberId == null) {
        throw new Error('담당 교사 회원 ID가 없습니다.')
      }
      return fetchMemberRolePrivacyUnmask(row.teacherMemberId, reason, 'SCHOOL')
    },
    [row.teacherMemberId]
  )

  const applyInstitutionTeacherPersonalInfo = useCallback(
    (payload: unknown) => {
      if (payload == null || typeof payload !== 'object') return
      const privacy = payload as { name?: unknown; phone?: unknown; email?: unknown }
      onSaveBasicInfo?.({
        id: detail.id,
        ...(typeof privacy.name === 'string' ? { teacherName: privacy.name } : {}),
        ...(typeof privacy.phone === 'string' ? { teacherPhone: privacy.phone } : {}),
        ...(typeof privacy.email === 'string' ? { teacherEmail: privacy.email } : {}),
      })
    },
    [detail.id, onSaveBasicInfo]
  )

  const {
    personalInfoRevealed,
    onPrivacyControlClick: handlePrivacyToggleClick,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    revealPersonalInfo: revealInstitutionTeacherPersonalInfo,
    onPrivacyUnmasked: applyInstitutionTeacherPersonalInfo,
    resetDeps: [detail.id],
    controlMode: 'toggleRemask',
  })

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
            queryKey: trainedTeacherQueryKeys.organizationApplicationsRoot(),
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
              queryKey: trainedTeacherQueryKeys.organizationApplicationsRoot(),
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

  const textbookStatusCell =
    onTextbookStatusChange != null ? (
      <span className={STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME}>
        <StatusDropdownCell<TextbookStatusKey>
          status={mergedDetail.textbookStatus}
          statusOptions={TEXTBOOK_STATUS_OPTION_KEYS}
          renderBadge={s => <TextbookStatusBadge status={s} />}
          isItemDisabled={(cur, opt) => cur === opt}
          onChange={newStatus => onTextbookStatusChange(detail.id, newStatus)}
          isOpen={textbookStatusDropdownOpen}
          onOpenChange={setTextbookStatusDropdownOpen}
          tagLayout="tag100"
        />
      </span>
    ) : (
      <TextbookStatusBadge status={mergedDetail.textbookStatus} />
    )

  const hasSelectedTextbook =
    ((mergedDetail.textbookId?.trim() ?? '') !== '' &&
      mergedDetail.textbookId?.trim() !== TEXTBOOK_NOT_USED_OPTION_VALUE) ||
    ((mergedDetail.textbookName?.trim() ?? '') !== '' &&
      mergedDetail.textbookName?.trim() !== '해당 없음')
  const textbookNameView = !hasSelectedTextbook ? '해당 없음' : textbookDisplay.textbookName
  const kitsAndQty =
    hasSelectedTextbook && textbookDisplay.textbookKits != null && textbookDisplay.textbookKits > 0
      ? `${textbookDisplay.textbookKits}키트 (${textbookDisplay.textbookQuantity}권)`
      : '-'

  const textbookSelectOptions = ensureTextbookNotUsedSelectOption(textbookOptions)
  const textbookCell =
    isApplicationInfoEditing && applicationInfoDraft && canEditTextbook ? (
      <div className="institution-basic-info__field-stack school-detail-fullpage-view__textbook-select-only">
        <CmsSelect
          className="institution-basic-info__full-width-control"
          inputSize="large"
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
    ) : (
      <div className="participating-institution-application-info__textbook-value">
        <ProgramDetailTdSegmentWrap>
          {withProgramDetailTdDivider([textbookNameView, kitsAndQty, textbookStatusCell])}
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

  if (canFetchApplicationDetail && applicationDetailQuery.isError && activeTab === 'application') {
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
              <CmsButton
                variant="delete"
                size="large"
                width={140}
                disabled={isActivityWithdrawn || isApplicationInfoEditing}
                onClick={handleRequestActivityWithdraw}
              >
                활동 포기
              </CmsButton>
              <ProgramEditInfoActions
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
              {showAdminCommentSection ? (
                <CmsButton
                  variant="primary"
                  size="large"
                  width={140}
                  disabled={isApplicationInfoEditing}
                  onClick={handleAdminCommentEditEnter}
                >
                  코멘트 작성
                </CmsButton>
              ) : null}
              <PersonalInfoRevealButton
                labelMode="toggle"
                revealed={personalInfoRevealed}
                style={{ minWidth: 180 }}
                onClick={handlePrivacyToggleClick}
              />
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
              textbookCell={textbookCell}
              usesTextbook={usesTextbook}
              textbookEditFullWidth={isApplicationInfoEditing && canEditTextbook}
              institutionId={row.id}
              preferredScheduleBlocks={mergedDetail.preferredScheduleBlocks}
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
                  (mergedDetail.educationFormat ?? '-')
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
              applicationReason={
                isApplicationDetailEditing ? (
                  <InstitutionMultilineEdit
                    value={applicationInfoDraft.applicationReason}
                    onChange={value => updateApplicationInfoDraft({ applicationReason: value })}
                    placeholder="신청 사유를 입력해 주세요."
                    error={applicationInfoValidationErrors?.applicationReason}
                  />
                ) : (
                  (mergedDetail.applicationReason ?? '-')
                )
              }
              otherRequests={
                isApplicationDetailEditing ? (
                  <InstitutionMultilineEdit
                    value={applicationInfoDraft.otherRequests}
                    onChange={value => updateApplicationInfoDraft({ otherRequests: value })}
                    placeholder="기타 요청사항을 입력해 주세요."
                    error={applicationInfoValidationErrors?.otherRequests}
                  />
                ) : (
                  (mergedDetail.otherRequests ?? '-')
                )
              }
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
      </div>

      {personalInfoRevealModal}

      <ActivityWithdrawScheduleModal
        open={activityWithdrawModalOpen}
        scheduleOptions={activityWithdrawScheduleOptions}
        confirming={activityWithdrawSubmitting}
        faultPartyRequired
        reasonMinLength={1}
        reasonMaxLength={1000}
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
    </div>
  )
}
