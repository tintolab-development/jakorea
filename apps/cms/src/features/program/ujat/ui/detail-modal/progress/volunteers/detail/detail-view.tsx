import { useCallback, useEffect, useMemo, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { CmsButton, useCmsAlert, CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH } from '@/shared/ui'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  PROGRAM_EDIT_INFO_BUTTON_PROPS,
  resolveProgramEditInfoClick,
} from '@/features/program/shared/lib/program-edit-info-button'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import type { UjatVolunteerPreferredRegion } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { clearUjatVolunteerApplicantsMockCache } from '@/data/mock/ujat-volunteer-applicants-mock'
import {
  parseEducationProgressVolunteerProfileId,
  patchUjatVolunteerMockProfilePreferredRegion,
} from '@/data/mock/ujat-volunteer-mock-profiles'
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
import {
  buildActivityCertificateVolunteerFromUjatDetail,
  buildStudentCertificateContextFromUjatVolunteer,
} from '../activity-certificate'
import type { UjatEducationProgressVolunteerDetail } from './detail-mock'
import { UjatEducationProgressVolunteerApplicationTab } from './application-tab'
import {
  UjatEducationProgressActivityWithdrawModal,
  type UjatEducationProgressActivityWithdrawPayload,
} from '../../shared/activity-withdraw-modal'
import { getVolunteerActivityWithdrawScheduleOptions } from './assignment-mock'
import {
  UjatEducationProgressVolunteerAssignmentProgressTab,
} from './assignment-progress-tab'
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
  const [adminComment, setAdminComment] = useState(detail.adminComment)
  const [adminCommentDraft, setAdminCommentDraft] = useState(detail.adminComment)
  const [isAdminCommentEditing, setIsAdminCommentEditing] = useState(false)
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
    setIsAdminCommentEditing(false)
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
  } = usePersonalInfoReveal({
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
    showAlert({
      title: '안내',
      content: '희망 교육 활동 지역이 저장되었습니다.',
    })
  }

  const handleAdminCommentButtonClick = useCallback(() => {
    if (!isAdminCommentEditing) {
      setAdminCommentDraft(adminComment)
      setIsAdminCommentEditing(true)
      return
    }

    setAdminComment(adminCommentDraft)
    setIsAdminCommentEditing(false)
    showAlert({
      title: '코멘트 저장',
      content: '관리자 코멘트가 저장되었습니다.',
    })
  }, [adminComment, adminCommentDraft, isAdminCommentEditing, showAlert])

  const activityCertificateVolunteer = useMemo(
    () => buildActivityCertificateVolunteerFromUjatDetail(detail),
    [detail]
  )

  const handleStudentCertificateIssueConfirm = useCallback(
    (_reason: CertificateIssueReasonValue, reasonLabel: string) => {
      setStudentCertificateExportContext(
        buildStudentCertificateContextFromUjatVolunteer({
          detail,
          program,
          issuanceReasonLabel: reasonLabel,
        })
      )
      setStudentCertificateExportActive(true)
    },
    [detail, program]
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
        size="large"
        width={140}
        disabled={activityWithdrawScheduleOptions.length === 0}
        onClick={handleRequestActivityWithdraw}
      >
        활동 포기
      </CmsButton>
      <CmsButton
        type="button"
        variant="secondary"
        size="large"
        width={180}
        icon={<DownloadOutlined />}
        onClick={() => setActivityCertPreviewOpen(true)}
      >
        활동인증서 발급
      </CmsButton>
      <CmsButton
        type="button"
        variant="secondary"
        size="large"
        width={CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH}
        icon={<DownloadOutlined />}
        disabled={studentCertificateExportActive}
        onClick={() => setStudentCertificateIssueModalOpen(true)}
      >
        수료증/참여인증서 발급
      </CmsButton>
      <CmsButton
        type="button"
        {...PROGRAM_EDIT_INFO_BUTTON_PROPS}
        onClick={resolveProgramEditInfoClick(isEditing, {
          onEnterEdit: handleEnterEdit,
          onSaveEdit: handleSaveEdit,
        })}
      >
        {PROGRAM_EDIT_INFO_BUTTON_LABEL}
      </CmsButton>
      <CmsButton
        type="button"
        variant="primary"
        size="large"
        width={160}
        onClick={handleAdminCommentButtonClick}
      >
        {isAdminCommentEditing ? '코멘트 저장' : '코멘트 작성'}
      </CmsButton>
      <PersonalInfoRevealButton
        labelMode="stickyReveal"
        revealed={personalInfoRevealed}
        onClick={openPersonalInfoRevealConfirm}
        width={180}
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
            isAdminCommentEditing={isAdminCommentEditing}
            adminCommentDraft={adminCommentDraft}
            onAdminCommentDraftChange={setAdminCommentDraft}
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
    </div>
  )
}
