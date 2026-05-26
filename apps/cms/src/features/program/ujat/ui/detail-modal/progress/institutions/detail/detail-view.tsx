import { useCallback, useEffect, useMemo, useState } from 'react'
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
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'
import { UjatEducationProgressInstitutionApplicationTab } from './application-tab'
import {
  UjatEducationProgressInstitutionAssignmentChangeButton,
  UjatEducationProgressInstitutionAssignmentTab,
} from './assignment-tab'
import {
  UjatEducationProgressActivityWithdrawModal,
  type UjatEducationProgressActivityWithdrawPayload,
} from '../../shared/activity-withdraw-modal'
import { UjatEducationProgressChangeClassModal } from './change-class-modal'
import {
  applyClassChangesToGradeBlocks,
  applyClassChangesToSchedules,
  resolveRegionKeyForInstitution,
  type ChangeClassConfirmPayload,
} from './change-class'
import './detail.css'

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
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)
  const [changeClassModalOpen, setChangeClassModalOpen] = useState(false)
  const [activityWithdrawn, setActivityWithdrawn] = useState(false)
  const [assignmentDataRevision, setAssignmentDataRevision] = useState(0)
  const [gradeBlocks, setGradeBlocks] = useState<UjatInstitutionApplicationGradeBlockDetail[]>(
    () => detail.applicationDetail.gradeBlocks
  )

  useEffect(() => {
    setWithdrawConfirmOpen(false)
    setChangeClassModalOpen(false)
    setActivityWithdrawn(false)
    setAssignmentDataRevision(0)
    setGradeBlocks(detail.applicationDetail.gradeBlocks)
  }, [detail.institutionId, detail.half, detail.applicationDetail.gradeBlocks])

  const detailWithGradeBlocks = useMemo(
    (): UjatEducationProgressInstitutionDetail => ({
      ...detail,
      applicationDetail: {
        ...detail.applicationDetail,
        gradeBlocks,
      },
    }),
    [detail, gradeBlocks]
  )

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
      Object.keys(
        UJAT_EDU_PROGRESS_INSTITUTION_DETAIL_TAB_LABELS
      ) as UjatEducationProgressInstitutionDetailTab[],
    []
  )

  const withdrawScheduleOptions = useMemo(
    () =>
      detail.confirmedScheduleRows.map(row => ({
        value: row.id,
        label: row.dateDisplay,
      })),
    [detail.confirmedScheduleRows]
  )

  const handleRequestWithdraw = useCallback(() => {
    if (activityWithdrawn) return
    setWithdrawConfirmOpen(true)
  }, [activityWithdrawn])

  const handleCancelWithdraw = useCallback(() => {
    setWithdrawConfirmOpen(false)
  }, [])

  const handleConfirmWithdraw = useCallback(
    (_payload: UjatEducationProgressActivityWithdrawPayload) => {
      setActivityWithdrawn(true)
      setWithdrawConfirmOpen(false)
      showAlert({
        title: '활동 포기',
        content: `${detail.institutionName} 기관이 활동 포기 처리되었습니다.`,
      })
    },
    [detail.institutionName, showAlert]
  )

  const handleConfirmChangeClass = useCallback(
    (payload: ChangeClassConfirmPayload) => {
      const regionKey = resolveRegionKeyForInstitution(detail.institutionId)
      if (regionKey) {
        applyClassChangesToSchedules(detail, regionKey, payload)
      }

      setGradeBlocks(prev => applyClassChangesToGradeBlocks(prev, payload.mappings))
      setAssignmentDataRevision(revision => revision + 1)
      setChangeClassModalOpen(false)
    },
    [detail]
  )

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
              disabled={activityWithdrawn}
              onClick={handleRequestWithdraw}
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

        {activeTab === 'assignment' ? (
          <div className="program-detail-fullpage-modal__header-actions">
            <UjatEducationProgressInstitutionAssignmentChangeButton
              onClick={() => setChangeClassModalOpen(true)}
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
              detail={detailWithGradeBlocks}
              personalInfoRevealed={personalInfoRevealed}
              gradeBlocks={gradeBlocks}
              onGradeBlocksChange={setGradeBlocks}
            />
          </div>
        ) : null}

        {activeTab === 'assignment' ? (
          <div className="program-detail-fullpage-modal__info-tab">
            <UjatEducationProgressInstitutionAssignmentTab
              detail={detailWithGradeBlocks}
              dataRevision={assignmentDataRevision}
            />
          </div>
        ) : null}

        {activeTab === 'posts' ? (
          <div className="program-detail-fullpage-modal__info-tab ujat-education-progress-institution-detail__posts-tab-wrap">
            <EnrollmentProgramDetailPostsTab
              program={program}
              schoolId={detail.institutionId}
              showWriteButtonInSection={false}
              writeModalOpen={postWriteModalOpen}
              onWriteModalOpenChange={setPostWriteModalOpen}
              writeAuthorName="담당 매니저"
              onPostWriteSuccess={() => {
                showAlert({
                  title: '게시글 등록',
                  content: '게시글이 등록되었습니다.',
                })
              }}
            />
          </div>
        ) : null}
      </div>

      {personalInfoRevealModal}

      <UjatEducationProgressActivityWithdrawModal
        open={withdrawConfirmOpen}
        participantName={detail.institutionName}
        scheduleOptions={withdrawScheduleOptions}
        onCancel={handleCancelWithdraw}
        onConfirm={handleConfirmWithdraw}
      />

      <UjatEducationProgressChangeClassModal
        open={changeClassModalOpen}
        half={detail.half}
        detail={detail}
        gradeBlocks={gradeBlocks}
        onCancel={() => setChangeClassModalOpen(false)}
        onConfirm={handleConfirmChangeClass}
      />
    </div>
  )
}
