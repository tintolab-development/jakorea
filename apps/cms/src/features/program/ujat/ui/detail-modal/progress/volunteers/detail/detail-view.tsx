import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  resolveProgramEditInfoClick,
} from '@/features/program/shared/lib/program-edit-info-button'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
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
import type { UjatEducationProgressVolunteerDetail } from './detail-mock'
import { UjatEducationProgressVolunteerApplicationTab } from './application-tab'
import {
  UjatEducationProgressActivityWithdrawModal,
  type UjatEducationProgressActivityWithdrawPayload,
} from '../../shared/activity-withdraw-modal'
import { getVolunteerActivityWithdrawScheduleOptions } from './assignment-mock'
import {
  UjatEducationProgressVolunteerAssignmentProgressTab,
  type UjatVolunteerAssignmentProgressTabHandle,
} from './assignment-progress-tab'
import './detail.css'

const TAB_KEYS = Object.keys(
  UJAT_EDU_PROGRESS_VOLUNTEER_DETAIL_TAB_LABELS
) as UjatEducationProgressVolunteerDetailTab[]

export function UjatEducationProgressVolunteerDetailView({
  detail,
  activeTab,
  onSelectTab,
  onDetailSaved,
}: {
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
  const assignmentProgressTabRef = useRef<UjatVolunteerAssignmentProgressTabHandle>(null)
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [withdrawnScheduleRowIds, setWithdrawnScheduleRowIds] = useState<string[]>([])

  useEffect(() => {
    setIsEditing(false)
    setPreferredRegionDraft(detail.applicant.preferredRegion)
    setActivityWithdrawModalOpen(false)
    setWithdrawnScheduleRowIds([])
  }, [detail.volunteerId, detail.applicant.preferredRegion])

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

  const showComingSoon = () => {
    showAlert({
      title: '안내',
      content: FEATURE_COMING_SOON_ALERT_MESSAGE,
    })
  }

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
        onClick={showComingSoon}
      >
        활동인증서 발급
      </CmsButton>
      <CmsButton
        type="button"
        variant="secondary"
        size="large"
        width={210}
        icon={<DownloadOutlined />}
        onClick={showComingSoon}
      >
        수료증/참여인증서 발급
      </CmsButton>
      <CmsButton
        type="button"
        variant="secondary"
        size="large"
        width={140}
        onClick={resolveProgramEditInfoClick(isEditing, {
          onEnterEdit: handleEnterEdit,
          onSaveEdit: handleSaveEdit,
        })}
      >
        {PROGRAM_EDIT_INFO_BUTTON_LABEL}
      </CmsButton>
      <PersonalInfoRevealButton
        labelMode="stickyReveal"
        revealed={personalInfoRevealed}
        onClick={openPersonalInfoRevealConfirm}
        width={180}
      />
    </>
  )

  const assignmentHeaderActions = (
    <>
      <CmsButton
        type="button"
        variant="delete"
        size="large"
        width={140}
        onClick={() => assignmentProgressTabRef.current?.openCancelModal()}
      >
        배정 취소
      </CmsButton>
      <CmsButton
        type="button"
        variant="secondary"
        size="large"
        width={160}
        onClick={() => assignmentProgressTabRef.current?.openAttendanceCorrectionModal()}
      >
        출결 정정
      </CmsButton>
      <CmsButton
        type="button"
        variant="primary"
        size="large"
        width={210}
        onClick={() => assignmentProgressTabRef.current?.openAssignModal()}
      >
        파트너 및 교육 배정
      </CmsButton>
    </>
  )

  const headerActions = (
    <div className="program-detail-fullpage-modal__header-actions">
      {activeTab === 'application' ? applicationHeaderActions : assignmentHeaderActions}
    </div>
  )

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
            maskSensitive={maskSensitive}
            isEditing={isEditing}
            preferredRegionDraft={preferredRegionDraft}
            onPreferredRegionDraftChange={setPreferredRegionDraft}
          />
        ) : (
          <UjatEducationProgressVolunteerAssignmentProgressTab
            ref={assignmentProgressTabRef}
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
    </div>
  )
}
