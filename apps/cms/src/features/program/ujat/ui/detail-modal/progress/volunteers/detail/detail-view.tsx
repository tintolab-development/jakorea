import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Program } from '@/types/domain'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { CmsButton, showUpdateCompletedAlert, useCmsAlert } from '@/shared/ui'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { resolveSessionProgramRole } from '@/entities/program/lib/program-privacy-access'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import type { UjatVolunteerPreferredRegion } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { clearUjatVolunteerApplicantsMockCache } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import {
  parseEducationProgressVolunteerProfileId,
  patchUjatVolunteerMockProfilePreferredRegion,
} from '@/features/program/ujat/model/ujat-volunteer-profile'
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
import {
  buildActivityCertificateVolunteerFromUjatDetail,
  buildStudentCertificateContextFromUjatVolunteer,
} from '../activity-certificate'
import type { UjatEducationProgressVolunteerDetail } from './volunteer-detail-data'
import { UjatEducationProgressVolunteerApplicationTab } from './application-tab'
import {
  UjatEducationProgressActivityWithdrawModal,
  type UjatEducationProgressActivityWithdrawPayload,
} from '../../shared/activity-withdraw-modal'
import { getVolunteerActivityWithdrawScheduleOptions } from './volunteer-assignment-data'
import {
  UjatEducationProgressVolunteerAssignmentProgressTab,
} from './assignment-progress-tab'
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
  const [isEditing, setIsEditing] = useState(false)
  const [preferredRegionDraft, setPreferredRegionDraft] = useState<UjatVolunteerPreferredRegion>(
    detail.applicant.preferredRegion
  )
  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [adminComment, setAdminComment] = useState(detail.adminComment)
  const [adminCommentDraft, setAdminCommentDraft] = useState(detail.adminComment)
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [activityCertPreviewOpen, setActivityCertPreviewOpen] = useState(false)
  const [studentCertificateIssueModalOpen, setStudentCertificateIssueModalOpen] = useState(false)
  const [studentCertificateExportContext, setStudentCertificateExportContext] =
    useState<StudentCertificateDownloadContext | null>(null)
  const [studentCertificateExportActive, setStudentCertificateExportActive] = useState(false)
  const [withdrawnScheduleRowIds, setWithdrawnScheduleRowIds] = useState<string[]>([])

  useEffect(() => {
    setIsEditing(false)
    setPreferredRegionDraft(detail.applicant.preferredRegion)
    setAdminComment(detail.adminComment)
    setAdminCommentDraft(detail.adminComment)
    setAdminCommentModalOpen(false)
    setActivityWithdrawModalOpen(false)
    setActivityCertPreviewOpen(false)
    setStudentCertificateIssueModalOpen(false)
    setStudentCertificateExportContext(null)
    setStudentCertificateExportActive(false)
    setWithdrawnScheduleRowIds([])
  }, [detail.volunteerId, detail.applicant.preferredRegion, detail.adminComment])

  const activityWithdrawScheduleOptions = useMemo(
    () =>
      getVolunteerActivityWithdrawScheduleOptions(detail.volunteerId, withdrawnScheduleRowIds),
    [detail.volunteerId, withdrawnScheduleRowIds]
  )

  const handleRequestActivityWithdraw = useCallback(() => {
    setActivityWithdrawModalOpen(true)
  }, [])

  const handleCancelActivityWithdraw = useCallback(() => {
    setActivityWithdrawModalOpen(false)
  }, [])

  const handleConfirmActivityWithdraw = useCallback(
    (payload: UjatEducationProgressActivityWithdrawPayload) => {
      setWithdrawnScheduleRowIds(prev =>
        prev.includes(payload.stopScheduleRowId)
          ? prev
          : [...prev, payload.stopScheduleRowId]
      )
      setActivityWithdrawModalOpen(false)
      showAlert({
        title: '활동 포기',
        content: `${detail.applicant.name} 봉사자가 활동 포기 처리되었습니다.`,
      })
    },
    [detail.applicant.name, showAlert]
  )

  const resolveAccessItem = useCallback(
    () => `${detail.applicant.name} 봉사자 신청 정보`,
    [detail.applicant.name]
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
    setPreferredRegionDraft(detail.applicant.preferredRegion)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    const profileId = parseEducationProgressVolunteerProfileId(detail.volunteerId)
    if (profileId) {
      patchUjatVolunteerMockProfilePreferredRegion(profileId, preferredRegionDraft)
      clearUjatVolunteerApplicantsMockCache()
      onDetailSaved?.()
    }
    setIsEditing(false)
    showUpdateCompletedAlert()
  }

  const handleCancelEdit = () => {
    setPreferredRegionDraft(detail.applicant.preferredRegion)
    setIsEditing(false)
  }

  const handleAdminCommentEditEnter = useCallback(() => {
    if (isEditing) return
    setAdminCommentDraft(adminComment)
    setAdminCommentModalOpen(true)
  }, [adminComment, isEditing])

  const handleAdminCommentSave = useCallback(() => {
    setAdminComment(adminCommentDraft.trim())
    setAdminCommentModalOpen(false)
    showAlert({
      title: '코멘트 저장',
      content: '관리자 코멘트가 저장되었습니다.',
    })
  }, [adminCommentDraft, showAlert])

  const handleAdminCommentModalCancel = useCallback(() => {
    setAdminCommentModalOpen(false)
  }, [])

  const activityCertificateVolunteer = useMemo(
    () => buildActivityCertificateVolunteerFromUjatDetail(detail),
    [detail]
  )

  const handleStudentCertificateIssueConfirm = useCallback(
    async (_reason: CertificateIssueReasonValue, reasonLabel: string) => {
      let context = buildStudentCertificateContextFromUjatVolunteer({
        detail,
        program,
        issuanceReasonLabel: reasonLabel,
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
    [detail, program, showAlert]
  )

  const handleStudentCertificateExportComplete = useCallback(
    (success: boolean) => {
      setStudentCertificateExportContext(null)
      setStudentCertificateExportActive(false)

      if (!success) {
        showAlert({
          title: '안내',
          content: '수료증/참여인증서 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      }
    },
    [showAlert]
  )

  const applicationHeaderActions = (
    <>
      <CmsButton
        type="button"
        variant="delete"
        size="h40"
        disabled={activityWithdrawScheduleOptions.length === 0}
        onClick={handleRequestActivityWithdraw}
      >
        활동 포기
      </CmsButton>
      <CmsButton
        type="button"
        variant="secondary"
        size="h40"
        icon={<ButtonDownloadIcon />}
        onClick={() => setActivityCertPreviewOpen(true)}
      >
        활동인증서 발급
      </CmsButton>
      <CmsButton
        type="button"
        variant="secondary"
        size="h40"
        icon={<ButtonDownloadIcon />}
        disabled={studentCertificateExportActive}
        onClick={() => setStudentCertificateIssueModalOpen(true)}
      >
        수료증/참여인증서 발급
      </CmsButton>
      <ProgramEditInfoActions
        size="h40"
        width={false}
        isEditing={isEditing}
        onEdit={handleEnterEdit}
        onCancel={handleCancelEdit}
        onSave={handleSaveEdit}
      />
      <CmsButton
        type="button"
        variant="primary"
        size="h40"
        disabled={isEditing}
        onClick={handleAdminCommentEditEnter}
      >
        코멘트 작성
      </CmsButton>
      <PersonalInfoRevealButton disabled={programPrivacyPending}
        labelMode="stickyReveal"
        revealed={personalInfoRevealed}
        onClick={openPersonalInfoRevealConfirm}
        cmsSize="h40"
        width="auto"
      />
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
            detail={detail}
            adminComment={adminComment}
            maskSensitive={maskSensitive}
            isEditing={isEditing}
            preferredRegionDraft={preferredRegionDraft}
            onPreferredRegionDraftChange={setPreferredRegionDraft}
            isAdminCommentEditing={false}
          />
        ) : (
          <UjatEducationProgressVolunteerAssignmentProgressTab
            volunteerId={detail.volunteerId}
            volunteerName={detail.applicant.name}
            withdrawnScheduleRowIds={withdrawnScheduleRowIds}
          />
        )}
      </div>

      {personalInfoRevealModal}

      <UjatEducationProgressActivityWithdrawModal
        open={activityWithdrawModalOpen}
        participantName={detail.applicant.name}
        scheduleOptions={activityWithdrawScheduleOptions}
        onCancel={handleCancelActivityWithdraw}
        onConfirm={handleConfirmActivityWithdraw}
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
        onChange={setAdminCommentDraft}
        onCancel={handleAdminCommentModalCancel}
        onConfirm={handleAdminCommentSave}
      />
    </div>
  )
}
