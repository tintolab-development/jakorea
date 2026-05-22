import { useCallback, useEffect, useMemo, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { CmsButton, useCmsAlert } from '@/shared/ui'
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
import type { UjatEducationProgressVolunteerDetail } from './ujat-education-progress-volunteer-detail-mock'
import { UjatEducationProgressVolunteerApplicationTab } from './ujat-education-progress-volunteer-application-tab'
import { UjatEducationProgressVolunteerAssignmentProgressTab } from './ujat-education-progress-volunteer-assignment-progress-tab'
import './ujat-education-progress-volunteer-detail.css'

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

  useEffect(() => {
    setIsEditing(false)
    setPreferredRegionDraft(detail.applicant.preferredRegion)
  }, [detail.volunteerId, detail.applicant.preferredRegion])

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

  const handleToggleEdit = () => {
    if (!isEditing) {
      setPreferredRegionDraft(detail.applicant.preferredRegion)
      setIsEditing(true)
      return
    }

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

  const headerActions = (
    <div className="program-detail-fullpage-modal__header-actions">
      <CmsButton type="button" variant="delete" size="large" width={140} onClick={showComingSoon}>
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
        variant="primary"
        size="large"
        width={140}
        onClick={handleToggleEdit}
      >
        {isEditing ? '정보 저장' : '정보 수정'}
      </CmsButton>
      <PersonalInfoRevealButton
        labelMode="stickyReveal"
        revealed={personalInfoRevealed}
        onClick={openPersonalInfoRevealConfirm}
        width={180}
      />
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
          <UjatEducationProgressVolunteerAssignmentProgressTab />
        )}
      </div>

      {personalInfoRevealModal}
    </div>
  )
}
