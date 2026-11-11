import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  FilterTableToolbarButton,
  showUpdateCompletedAlert,
  useCmsAlert,
} from '@/shared/ui'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { resolveSessionProgramRole } from '@/entities/program/lib/program-privacy-access'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { unmaskVolunteerApplicationPrivacyRemote } from '@/features/program/general/api/applications-api-client'
import { cacheProjectedProgramPrivacy } from '@/features/program/shared/lib/program-my-assignment'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import type { UjatVolunteerPreferredRegion } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { upsertAdminCommentByTargetRemote } from '@/features/program/general/api/admin-comments-api-client'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import {
  giveUpUjatVolunteerApplicationRemote,
  patchUjatVolunteerPreferredRegionRemote,
} from '@/features/program/ujat/api/volunteer-mutations'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import { parseVolunteerApplicationNumericId } from '@/features/program/ujat/lib/volunteer-application-id'
import { resolvePreferredRegionEducationCode } from '@/features/program/ujat/lib/resolve-preferred-region-education-code'
import {
  UJAT_EDU_PROGRESS_VOLUNTEER_DETAIL_TAB_LABELS,
  type UjatEducationProgressVolunteerDetailTab,
} from '@/features/program/ujat/lib/ujat-program-detail-url'
import { ParticipatingVolunteerActivityCertificatePreviewModal } from '@/features/program/general/ui/detail-modal/program-status/participating-volunteer-activity-certificate-preview-modal'
import { CertificateBulkIssueReasonModal } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import type { CertificateIssueReasonValue } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import type { StudentCertificateDownloadContext } from '@/features/program/general/lib/build-student-certificate-issuance'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { StudentCertificatePdfExportHost } from '@/features/program/general/ui/detail-modal/program-status/student-certificate-pdf-export-host'
import { unmaskMemberForCertificateIssue } from '@/features/program/shared/lib/unmask-for-certificate-issue'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { getVolunteerActivityRegionErrorMessage } from '@/features/program/ujat/lib/volunteer-activity-region-error'
import {
  buildActivityCertificateVolunteerFromUjatDetail,
  buildStudentCertificateContextFromUjatVolunteer,
  describeUjatCertificateProgressBlock,
  hasUjatCertificateAssignment,
} from '../activity-certificate'
import type { UjatEducationProgressVolunteerDetail } from './volunteer-detail-data'
import { UjatEducationProgressVolunteerApplicationTab } from './application-tab'
import {
  UjatEducationProgressActivityWithdrawModal,
  type UjatEducationProgressActivityWithdrawPayload,
} from '../../shared/activity-withdraw-modal'
import { getVolunteerActivityWithdrawScheduleOptions } from './volunteer-assignment-data'
import { useVolunteerAssignmentProgress } from './use-assignment-progress'
import {
  UjatEducationProgressVolunteerAssignmentProgressTab,
} from './assignment-progress-tab'
import { UjatEducationProgressVolunteerSettlementTab } from './settlement-tab'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './detail.css'

const TAB_KEYS = Object.keys(
  UJAT_EDU_PROGRESS_VOLUNTEER_DETAIL_TAB_LABELS
) as UjatEducationProgressVolunteerDetailTab[]

export function UjatEducationProgressVolunteerDetailView({
  program,
  detail,
  activeTab,
  onSelectTab,
  onDetailSaved,
}: {
  program: Program
  detail: UjatEducationProgressVolunteerDetail
  activeTab: UjatEducationProgressVolunteerDetailTab
  onSelectTab: (tab: UjatEducationProgressVolunteerDetailTab) => void
  onDetailSaved?: () => void
}) {
  const { showAlert } = useCmsAlert()
  const canWrite = useUjatCanWrite()
  const queryClient = useQueryClient()
  const { regions } = useUjatEducationRegions()
  const [isEditing, setIsEditing] = useState(false)
  const [savingRegion, setSavingRegion] = useState(false)
  const [savingComment, setSavingComment] = useState(false)
  const [givingUp, setGivingUp] = useState(false)
  const [preferredRegionDraft, setPreferredRegionDraft] = useState<UjatVolunteerPreferredRegion>('')
  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [adminComment, setAdminComment] = useState(detail.adminComment)
  const [adminCommentDraft, setAdminCommentDraft] = useState(detail.adminComment)
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [activityCertPreviewOpen, setActivityCertPreviewOpen] = useState(false)
  const [studentCertificateIssueModalOpen, setStudentCertificateIssueModalOpen] = useState(false)
  const [studentCertificateExportContext, setStudentCertificateExportContext] =
    useState<StudentCertificateDownloadContext | null>(null)
  const [studentCertificateExportActive, setStudentCertificateExportActive] = useState(false)
  const preferredRegionCodeDraft = useMemo(
    () =>
      resolvePreferredRegionEducationCode(
        detail.applicant.preferredRegionCode?.trim() || detail.applicant.preferredRegion,
        regions
      ) ?? '',
    [
      detail.applicant.preferredRegion,
      detail.applicant.preferredRegionCode,
      regions,
    ]
  )

  useEffect(() => {
    setIsEditing(false)
    setPreferredRegionDraft(preferredRegionCodeDraft)
    setAdminComment(detail.adminComment)
    setAdminCommentDraft(detail.adminComment)
    setAdminCommentModalOpen(false)
    setActivityWithdrawModalOpen(false)
    setActivityCertPreviewOpen(false)
    setStudentCertificateIssueModalOpen(false)
    setStudentCertificateExportContext(null)
    setStudentCertificateExportActive(false)
  }, [detail.volunteerId, detail.adminComment, preferredRegionCodeDraft])

  const assignmentProgress = useVolunteerAssignmentProgress({
    programId: program.id,
    half: detail.half,
    memberId: detail.applicant.memberId ?? detail.row.memberId,
    regionKey: detail.row.regionKey,
  })

  const activityWithdrawScheduleOptions = useMemo(
    () => getVolunteerActivityWithdrawScheduleOptions(assignmentProgress.bundle.rows),
    [assignmentProgress.bundle.rows]
  )

  const applicationNumericId = parseVolunteerApplicationNumericId(detail.volunteerId)
  const remoteReady = shouldUseUjatApplicationsRemoteApi()

  const invalidateVolunteerRemote = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ujatQueryKeys.volunteerApplicationsRoot(program.id),
    })
    await queryClient.invalidateQueries({
      queryKey: ujatQueryKeys.volunteerApplicationComments(program.id, detail.volunteerId),
    })
    await queryClient.invalidateQueries({
      queryKey: ujatQueryKeys.volunteerApplicationDetail(detail.volunteerId),
    })
    if (applicationNumericId != null) {
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.volunteerApplicationDetail(String(applicationNumericId)),
      })
    }
    // 활동 포기 후 배정표·출결은 remote matrix giveUp이 SSOT. 로컬 invent만 남기지 않는다.
    await queryClient.invalidateQueries({
      queryKey: ujatQueryKeys.volunteerAssignmentProgressRoot(program.id),
    })
    await queryClient.invalidateQueries({
      queryKey: ujatQueryKeys.allocationMatrixRoot(program.id),
    })
  }, [applicationNumericId, detail.volunteerId, program.id, queryClient])

  const handleRequestActivityWithdraw = useCallback(() => {
    setActivityWithdrawModalOpen(true)
  }, [])

  const handleCancelActivityWithdraw = useCallback(() => {
    setActivityWithdrawModalOpen(false)
  }, [])

  const handleConfirmActivityWithdraw = useCallback(
    async (payload: UjatEducationProgressActivityWithdrawPayload) => {
      if (applicationNumericId == null || !remoteReady) {
        showAlert({
          title: '저장 실패',
          content: '봉사자 신청 API가 활성화되지 않았거나 신청 ID가 올바르지 않습니다.',
        })
        return
      }
      const stopScheduleId = Number(payload.stopScheduleRowId)
      const hasStopSchedule =
        payload.stopScheduleRowId != null &&
        Number.isSafeInteger(stopScheduleId) &&
        stopScheduleId > 0
      const scheduleLabel = activityWithdrawScheduleOptions.find(
        option => option.value === payload.stopScheduleRowId
      )?.label
      setGivingUp(true)
      try {
        await giveUpUjatVolunteerApplicationRemote(
          String(applicationNumericId),
          scheduleLabel ? `활동 포기 (${scheduleLabel})` : '활동 포기',
          hasStopSchedule ? { stopScheduleId } : undefined
        )
        setActivityWithdrawModalOpen(false)
        await invalidateVolunteerRemote()
        onDetailSaved?.()
        showAlert({
          title: '활동 포기',
          content: `${detail.applicant.name} 봉사자가 활동 포기 처리되었습니다.`,
        })
      } catch (error) {
        showAlert({
          title: '활동 포기 처리 실패',
          content: getGeneralProgramApiErrorMessage(
            error,
            '활동 포기 처리에 실패했습니다. 다시 시도해 주세요.'
          ),
        })
      } finally {
        setGivingUp(false)
      }
    },
    [
      activityWithdrawScheduleOptions,
      applicationNumericId,
      detail.applicant.name,
      invalidateVolunteerRemote,
      onDetailSaved,
      remoteReady,
      showAlert,
    ]
  )

  const resolveAccessItem = useCallback(
    () => `${detail.applicant.name} 봉사자 신청 정보`,
    [detail.applicant.name]
  )

  const revealVolunteerPersonalInfo = useCallback(
    async (reason: string) => {
      if (applicationNumericId == null) {
        throw new Error('봉사자 신청 ID가 올바르지 않습니다.')
      }
      const programIdNumber = Number(program.id)
      const dto = await unmaskVolunteerApplicationPrivacyRemote(
        String(applicationNumericId),
        reason,
        Number.isSafeInteger(programIdNumber) ? programIdNumber : undefined
      )
      return cacheProjectedProgramPrivacy(
        queryClient,
        ujatQueryKeys.volunteerApplicationDetail(detail.volunteerId),
        program.id,
        dto
      )
    },
    [applicationNumericId, detail.volunteerId, program.id, queryClient]
  )

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal: personalInfoRevealModal,
    programPrivacyPending,
  } = usePersonalInfoReveal({
    privacyScope: 'program',
    programId: program.id,
    resolveProgramRole: () => resolveSessionProgramRole(program.id),
    resolveAccessItem,
    revealPersonalInfo: revealVolunteerPersonalInfo,
    resetDeps: [detail.volunteerId, detail.half],
    controlMode: 'headerStickyNoop',
  })

  const maskSensitive = !personalInfoRevealed

  const tabItems = useMemo(
    () =>
      TAB_KEYS.map(key => ({
        key,
        label: UJAT_EDU_PROGRESS_VOLUNTEER_DETAIL_TAB_LABELS[key],
      })),
    []
  )

  const handleEnterEdit = () => {
    setPreferredRegionDraft(preferredRegionCodeDraft)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (applicationNumericId == null || !remoteReady) {
      showAlert({
        title: '저장 실패',
        content: '봉사자 신청 API가 활성화되지 않았거나 신청 ID가 올바르지 않습니다.',
      })
      return
    }
    const educationRegionCode = resolvePreferredRegionEducationCode(preferredRegionDraft, regions)
    if (!educationRegionCode) {
      showAlert({
        title: '저장 실패',
        content: '희망 교육 활동 지역을 선택해 주세요.',
      })
      return
    }
    setSavingRegion(true)
    try {
      await patchUjatVolunteerPreferredRegionRemote(String(applicationNumericId), educationRegionCode)
      await invalidateVolunteerRemote()
      onDetailSaved?.()
      setIsEditing(false)
      showUpdateCompletedAlert()
    } catch (error) {
      showAlert({
        title: '저장 실패',
        content: getVolunteerActivityRegionErrorMessage(error),
      })
    } finally {
      setSavingRegion(false)
    }
  }

  const handleCancelEdit = () => {
    setPreferredRegionDraft(preferredRegionCodeDraft)
    setIsEditing(false)
  }

  const handleAdminCommentEditEnter = useCallback(() => {
    if (isEditing) return
    setAdminCommentDraft(adminComment)
    setAdminCommentModalOpen(true)
  }, [adminComment, isEditing])

  const handleAdminCommentSave = useCallback(async () => {
    if (applicationNumericId == null || !remoteReady) {
      showAlert({
        title: '저장 실패',
        content: '봉사자 신청 API가 활성화되지 않았거나 신청 ID가 올바르지 않습니다.',
      })
      return
    }
    setSavingComment(true)
    try {
      const result = await upsertAdminCommentByTargetRemote({
        targetType: 'VOLUNTEER_APPLICATION',
        targetId: applicationNumericId,
        screenCode: 'VOLUNTEER_APPLICATION',
        comment: adminCommentDraft,
      })
      const nextComment = result.commentText ?? ''
      setAdminComment(nextComment)
      setAdminCommentDraft(nextComment)
      setAdminCommentModalOpen(false)
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.volunteerApplicationComments(program.id, detail.volunteerId),
      })
      showAlert({
        title: '코멘트 저장',
        content: '관리자 코멘트가 저장되었습니다.',
      })
    } catch (error) {
      showAlert({
        title: '저장 실패',
        content: getGeneralProgramApiErrorMessage(error, '관리자 코멘트를 저장하지 못했습니다.'),
      })
    } finally {
      setSavingComment(false)
    }
  }, [
    adminCommentDraft,
    applicationNumericId,
    detail.volunteerId,
    program.id,
    queryClient,
    remoteReady,
    showAlert,
  ])

  const handleAdminCommentModalCancel = useCallback(() => {
    setAdminCommentModalOpen(false)
  }, [])

  const certificateProgressBlockReason = describeUjatCertificateProgressBlock({
    isLoading: assignmentProgress.isLoading,
    isError: assignmentProgress.isError,
    isParticipantUnresolved: assignmentProgress.isParticipantUnresolved,
    hasNoAssignment: !hasUjatCertificateAssignment(assignmentProgress.bundle),
  })
  const certificateIssueDisabled =
    certificateProgressBlockReason != null || studentCertificateExportActive

  const activityCertificateVolunteer = useMemo(
    () => buildActivityCertificateVolunteerFromUjatDetail(detail, assignmentProgress.bundle),
    [assignmentProgress.bundle, detail]
  )

  const handleActivityCertificateIssueClick = useCallback(() => {
    if (certificateProgressBlockReason != null) {
      showAlert({ title: '안내', content: certificateProgressBlockReason })
      return
    }
    setActivityCertPreviewOpen(true)
  }, [certificateProgressBlockReason, showAlert])

  const handleStudentCertificateIssueClick = useCallback(() => {
    if (certificateProgressBlockReason != null) {
      showAlert({ title: '안내', content: certificateProgressBlockReason })
      return
    }
    if (studentCertificateExportActive) return
    setStudentCertificateIssueModalOpen(true)
  }, [certificateProgressBlockReason, showAlert, studentCertificateExportActive])

  const handleStudentCertificateIssueConfirm = useCallback(
    async (_reason: CertificateIssueReasonValue, reasonLabel: string) => {
      if (certificateProgressBlockReason != null) {
        showAlert({ title: '안내', content: certificateProgressBlockReason })
        return
      }
      let context = buildStudentCertificateContextFromUjatVolunteer({
        detail,
        program,
        issuanceReasonLabel: reasonLabel,
        bundle: assignmentProgress.bundle,
      })
      const memberId = Number(detail.applicant.memberId ?? detail.row.memberId)
      if (Number.isSafeInteger(memberId) && memberId > 0) {
        try {
          const person = await unmaskMemberForCertificateIssue(memberId)
          context = {
            ...context,
            student: {
              ...context.student,
              name: person.name || context.student.name,
              birthDate: person.birthDate || context.student.birthDate,
            },
          }
        } catch (error) {
          showAlert({
            title: '열람 실패',
            content: getGeneralProgramApiErrorMessage(
              error,
              '개인정보 원문 조회에 실패했습니다.'
            ),
          })
          return
        }
      }
      setStudentCertificateExportContext(context)
      setStudentCertificateExportActive(true)
    },
    [assignmentProgress.bundle, certificateProgressBlockReason, detail, program, showAlert]
  )

  const handleStudentCertificateExportComplete = useCallback(
    (success: boolean) => {
      setStudentCertificateExportContext(null)
      setStudentCertificateExportActive(false)

      if (!success) {
        showAlert({
          title: '안내',
          content: '수료증/참가인증서 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      }
    },
    [showAlert]
  )

  const applicationHeaderActions = (
    <>
      {!isEditing ? (
        <>
          <FilterTableToolbarButton
              type="button"
              variant="delete"
              disabled={givingUp || activityWithdrawScheduleOptions.length === 0}
              onClick={handleRequestActivityWithdraw}
            >
              활동 포기
            </FilterTableToolbarButton>
          <FilterTableToolbarButton
            type="button"
            variant="secondary"
            icon={<ButtonDownloadIcon />}
            disabled={certificateIssueDisabled}
            onClick={handleActivityCertificateIssueClick}
          >
            활동인증서 발급
          </FilterTableToolbarButton>
          <FilterTableToolbarButton
            type="button"
            variant="secondary"
            icon={<ButtonDownloadIcon />}
            disabled={certificateIssueDisabled}
            onClick={handleStudentCertificateIssueClick}
          >
            수료증/참가인증서 발급
          </FilterTableToolbarButton>
        </>
      ) : null}
      <ProgramEditInfoActions
        canWrite={canWrite}
        useToolbarButton
        size="h40"
        isEditing={isEditing}
        saving={savingRegion}
        disabled={savingRegion}
        onEdit={handleEnterEdit}
        onCancel={handleCancelEdit}
        onSave={() => {
          void handleSaveEdit()
        }}
      />
      {!isEditing ? (
        <>
          <FilterTableToolbarButton
              type="button"
              variant="primary"
              onClick={handleAdminCommentEditEnter}
            >
              코멘트 작성
            </FilterTableToolbarButton>
          <PersonalInfoRevealButton
            disabled={programPrivacyPending}
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            onClick={openPersonalInfoRevealConfirm}
            cmsSize="h40"
          />
        </>
      ) : null}
    </>
  )

  const headerActions =
    activeTab === 'application' ? (
      <div className="program-detail-fullpage-modal__header-actions">{applicationHeaderActions}</div>
    ) : undefined

  return (
    <div className="ujat-education-progress-volunteer-detail">
      <CmsTextTabs
        className="ujat-education-progress-volunteer-detail__tabs-row"
        variant="detail"
        activeKey={activeTab}
        onChange={onSelectTab}
        items={tabItems}
        trailing={headerActions}
        ariaLabel="봉사자 상세 탭"
      />

      <div className="ujat-education-progress-volunteer-detail__content">
        {activeTab === 'application' ? (
          <UjatEducationProgressVolunteerApplicationTab
            program={program}
            detail={detail}
            adminComment={adminComment}
            maskSensitive={maskSensitive}
            isEditing={isEditing}
            preferredRegionDraft={preferredRegionDraft}
            onPreferredRegionDraftChange={setPreferredRegionDraft}
            isAdminCommentEditing={false}
          />
        ) : activeTab === 'settlement' ? (
          <UjatEducationProgressVolunteerSettlementTab
            program={program}
            volunteerId={detail.volunteerId}
          />
        ) : (
          <UjatEducationProgressVolunteerAssignmentProgressTab
            programId={program.id}
            half={detail.half}
            volunteerId={detail.volunteerId}
            memberId={detail.applicant.memberId ?? detail.row.memberId}
            regionKey={detail.row.regionKey}
            volunteerName={detail.applicant.name}
          />
        )}
      </div>

      {personalInfoRevealModal}

      <UjatEducationProgressActivityWithdrawModal
        open={activityWithdrawModalOpen}
        subjectKind="person"
        participantName={detail.applicant.name}
        scheduleOptions={activityWithdrawScheduleOptions}
        requireSchedule={activityWithdrawScheduleOptions.length > 0}
        submitting={givingUp}
        onCancel={handleCancelActivityWithdraw}
        onConfirm={payload => {
          void handleConfirmActivityWithdraw(payload)
        }}
      />
      <ParticipatingVolunteerActivityCertificatePreviewModal
        open={activityCertPreviewOpen}
        onClose={() => setActivityCertPreviewOpen(false)}
        volunteer={activityCertificateVolunteer}
        program={program}
      />
      <CertificateBulkIssueReasonModal
        open={studentCertificateIssueModalOpen}
        onCancel={() => setStudentCertificateIssueModalOpen(false)}
        applicationIds={[detail.volunteerId]}
        onIssue={handleStudentCertificateIssueConfirm}
      />
      <FormCertificatePdfExportOverlay visible={studentCertificateExportActive} />
      {studentCertificateExportContext != null ? (
        <StudentCertificatePdfExportHost
          key={`${studentCertificateExportContext.student.id}-${studentCertificateExportContext.certificateKind}-${studentCertificateExportContext.issuanceReasonLabel}`}
          context={studentCertificateExportContext}
          onComplete={handleStudentCertificateExportComplete}
        />
      ) : null}
      <MemberAdminCommentModal
        open={adminCommentModalOpen}
        value={adminCommentDraft}
        loading={savingComment}
        onChange={setAdminCommentDraft}
        onCancel={handleAdminCommentModalCancel}
        onConfirm={() => {
          void handleAdminCommentSave()
        }}
      />
    </div>
  )
}
