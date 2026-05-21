import { useCallback, useMemo, useState } from 'react'
import { Typography } from 'antd'
import type { Program } from '@/types/domain'
import { CmsButton } from '@/shared/ui'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
import { EnrollmentProgramDetailPostsTab } from '@/features/user/detail/ui/enrollment-program-detail-posts-tab'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { useCmsAlert } from '@/shared/ui'
import type { UjatEducationProgressInstitutionDetailTab } from '@/features/program/ujat/lib/ujat-program-detail-url'
import {
  UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TAB_LABELS,
  type UjatEducationProgressInstitutionDetail,
} from './types'
import { UjatEducationProgressInstitutionApplicationTab } from './ujat-education-progress-institution-application-tab'
import './ujat-education-progress-institution-detail.css'

export function UjatEducationProgressInstitutionDetailView({
  detail,
  program,
  activeTab,
  onSelectTab,
}: {
  detail: UjatEducationProgressInstitutionDetail
  program: Program
  activeTab: UjatEducationProgressInstitutionDetailTab
  onSelectTab: (tab: UjatEducationProgressInstitutionDetailTab) => void
}) {
  const { showAlert } = useCmsAlert()
  const [postWriteModalOpen, setPostWriteModalOpen] = useState(false)

  const resolveAccessItem = useCallback(
    () => `${detail.institutionName} 참여 기관 신청 정보`,
    [detail.institutionName]
  )

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem,
    resetDeps: [detail.institutionId, detail.half],
    controlMode: 'headerStickyNoop',
  })

  const tabKeys = useMemo(
    () =>
      Object.keys(UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TAB_LABELS) as UjatEducationProgressInstitutionDetailTab[],
    []
  )

  const handleWithdraw = useCallback(() => {
    showAlert({
      title: '활동 포기',
      content: `${detail.institutionName} 기관이 활동 포기 처리되었습니다. (목 데이터)`,
    })
  }, [detail.institutionName, showAlert])

  return (
    <div className="ujat-education-progress-institution-detail">
      <div className="program-detail-fullpage-modal__tabs-row ujat-education-progress-institution-detail__tabs-row">
        <div className="program-detail-fullpage-modal__tabs">
          {tabKeys.map(key => (
            <button
              key={key}
              type="button"
              className={`program-detail-fullpage-modal__tab ${
                activeTab === key ? 'program-detail-fullpage-modal__tab--active' : ''
              }`}
              onClick={() => onSelectTab(key)}
            >
              <span className="program-detail-fullpage-modal__tab-label">
                {UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TAB_LABELS[key]}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'application' ? (
          <div className="program-detail-fullpage-modal__header-actions">
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              width={160}
              onClick={handleWithdraw}
            >
              활동 포기
            </CmsButton>
            <CmsButton
              type="button"
              variant="primary"
              size="large"
              width={160}
              onClick={() => window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)}
            >
              정보 수정
            </CmsButton>
            <PersonalInfoRevealButton
              labelMode="stickyReveal"
              revealed={personalInfoRevealed}
              cmsVariant="primary"
              cmsSize="large"
              width={180}
              onClick={openPersonalInfoRevealConfirm}
            />
          </div>
        ) : null}

        {activeTab === 'posts' ? (
          <div className="program-detail-fullpage-modal__header-actions">
            <CmsButton
              type="button"
              variant="primary"
              size="large"
              width={160}
              onClick={() => setPostWriteModalOpen(true)}
            >
              게시글 등록
            </CmsButton>
          </div>
        ) : null}
      </div>

      <div className="program-detail-fullpage-modal__content">
        {activeTab === 'application' ? (
          <div className="program-detail-fullpage-modal__info-tab">
            <UjatEducationProgressInstitutionApplicationTab
              detail={detail}
              personalInfoRevealed={personalInfoRevealed}
            />
          </div>
        ) : null}

        {activeTab === 'assignment' ? (
          <div className="program-detail-fullpage-modal__info-tab ujat-education-progress-institution-detail__placeholder">
            <Typography.Title level={5}>교육 배정 및 진행 현황</Typography.Title>
            <Typography.Paragraph type="secondary">
              해당 기능 화면이 연결되면 이 영역에 표시됩니다.
            </Typography.Paragraph>
          </div>
        ) : null}

        {activeTab === 'posts' ? (
          <div className="program-detail-fullpage-modal__info-tab">
            <EnrollmentProgramDetailPostsTab
              program={program}
              schoolId={detail.institutionId}
              showWriteButtonInSection={false}
              writeModalOpen={postWriteModalOpen}
              onWriteModalOpenChange={setPostWriteModalOpen}
            />
          </div>
        ) : null}
      </div>

      {personalInfoRevealModal}
    </div>
  )
}
