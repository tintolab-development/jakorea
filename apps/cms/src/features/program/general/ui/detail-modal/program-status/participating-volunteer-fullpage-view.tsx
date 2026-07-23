/**
 * 참여 봉사자 상세 풀페이지 인라인 뷰
 * 프로그램 진행 현황 > 참여 봉사자 — volunteerId 쿼리 시 목록 대신 표시
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import {
  applyParticipatingVolunteerActivityWithdraw,
  getParticipatingVolunteerActivityWithdrawScheduleOptions,
  mergeParticipatingVolunteerDetailRow,
} from '@/features/program/general/lib/participating-volunteer-detail'
import { ActivityWithdrawScheduleModal } from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import { ParticipatingVolunteerApplicationInfo } from './participating-volunteer-application-info'
import { ParticipatingVolunteerActivityCertificatePreviewModal } from './participating-volunteer-activity-certificate-preview-modal'
import { ParticipatingVolunteerAssignmentSection } from './participating-volunteer-assignment-section'
import { ParticipatingIndividualVolunteerAssignmentSection } from './participating-individual-volunteer-assignment-section'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import './school-detail-fullpage-view.css'
import './participating-volunteer-fullpage-view.css'

export const VOLUNTEER_DETAIL_TAB_KEYS = ['application', 'assignment'] as const
export type VolunteerDetailTabKey = (typeof VOLUNTEER_DETAIL_TAB_KEYS)[number]

export function normalizeVolunteerDetailTab(tab: string | null | undefined): VolunteerDetailTabKey {
  if (tab && (VOLUNTEER_DETAIL_TAB_KEYS as readonly string[]).includes(tab)) {
    return tab as VolunteerDetailTabKey
  }
  return 'application'
}

const TAB_LABELS: Record<VolunteerDetailTabKey, string> = {
  application: '신청 정보',
  assignment: '봉사 배정 현황',
}

export interface ParticipatingVolunteerFullpageViewProps {
  program: Program
  volunteer: ParticipatingVolunteerRow
  activeTab?: VolunteerDetailTabKey
  onTabChange?: (key: VolunteerDetailTabKey) => void
  onClearVolunteerId: () => void
}

export function ParticipatingVolunteerFullpageView({
  program,
  volunteer: initialVolunteer,
  activeTab: activeTabFromUrl,
  onTabChange,
  onClearVolunteerId: _onClearVolunteerId,
}: ParticipatingVolunteerFullpageViewProps) {
  const { showAlert } = useCmsAlert()
  /**
   * URL(`volunteerTab`)이 source of truth이지만, setSearchParams 반영 전·props 지연 시
   * 탭 UI/본문이 안 바뀌는 문제가 있어 로컬 탭을 먼저 갱신한 뒤 URL과 동기화한다.
   */
  const [uiTab, setUiTab] = useState<VolunteerDetailTabKey>(
    () => activeTabFromUrl ?? 'application'
  )
  const [volunteerPatches, setVolunteerPatches] = useState<Partial<ParticipatingVolunteerRow>>({})
  const [savedAdminComment, setSavedAdminComment] = useState('')
  const [isAdminCommentEditing, setIsAdminCommentEditing] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')
  const [adminCommentError, setAdminCommentError] = useState<string | undefined>()
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [activityCertPreviewOpen, setActivityCertPreviewOpen] = useState(false)

  const mergedVolunteer = useMemo(
    () => mergeParticipatingVolunteerDetailRow({ ...initialVolunteer, ...volunteerPatches }),
    [initialVolunteer, volunteerPatches]
  )

  const activityWithdrawScheduleOptions = useMemo(
    () => getParticipatingVolunteerActivityWithdrawScheduleOptions(mergedVolunteer),
    [mergedVolunteer]
  )

  const resolveParticipatingVolunteerFullpageAccessItem = useCallback(
    () => mergedVolunteer.volunteerName ?? '참여 봉사자 상세 정보',
    [mergedVolunteer.volunteerName]
  )

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolveParticipatingVolunteerFullpageAccessItem,
    resetDeps: [mergedVolunteer.id],
    controlMode: 'headerStickyNoop',
  })

  useEffect(() => {
    setUiTab(activeTabFromUrl ?? 'application')
  }, [mergedVolunteer.id, activeTabFromUrl])

  const activeTab = uiTab
  const setActiveTab = useCallback(
    (key: VolunteerDetailTabKey) => {
      setUiTab(key)
      onTabChange?.(key)
    },
    [onTabChange]
  )

  useEffect(() => {
    setSavedAdminComment(initialVolunteer.adminComment ?? '')
    setIsAdminCommentEditing(false)
    setAdminCommentDraft('')
    setAdminCommentError(undefined)
    setVolunteerPatches({})
    setActivityWithdrawModalOpen(false)
    setActivityCertPreviewOpen(false)
  }, [initialVolunteer.id, initialVolunteer.adminComment])

  const privacyMasked = !personalInfoRevealed

  const handleRequestActivityWithdraw = useCallback(() => {
    if (mergedVolunteer.activityWithdrawn) {
      showAlert({
        title: '활동 포기 안내',
        content: '이미 활동 포기 처리된 봉사자입니다.',
      })
      return
    }
    if (activityWithdrawScheduleOptions.length === 0) {
      showAlert({
        title: '안내',
        content: '활동 포기 처리할 수 있는 봉사 일정이 없습니다.',
      })
      return
    }
    if (isAdminCommentEditing) return
    setActivityWithdrawModalOpen(true)
  }, [
    activityWithdrawScheduleOptions.length,
    isAdminCommentEditing,
    mergedVolunteer.activityWithdrawn,
    showAlert,
  ])

  const handleConfirmActivityWithdraw = useCallback(
    (payload: { stopSessionKey: string }) => {
      const patch = applyParticipatingVolunteerActivityWithdraw(mergedVolunteer, payload)
      if (Object.keys(patch).length === 0) return
      setVolunteerPatches(prev => ({ ...prev, ...patch }))
      setActivityWithdrawModalOpen(false)
      showAlert({
        title: '활동 포기',
        content: `${mergedVolunteer.volunteerName} 봉사자가 활동 포기 처리되었습니다.`,
      })
    },
    [mergedVolunteer, showAlert]
  )

  const handleActivityCertificateIssueClick = useCallback(() => {
    setActivityCertPreviewOpen(true)
  }, [])

  const handleAdminCommentEditEnter = useCallback(() => {
    setAdminCommentDraft(savedAdminComment)
    setAdminCommentError(undefined)
    setIsAdminCommentEditing(true)
  }, [savedAdminComment])

  const handleAdminCommentSave = useCallback(() => {
    setSavedAdminComment(adminCommentDraft.trim())
    setIsAdminCommentEditing(false)
    setAdminCommentError(undefined)
  }, [adminCommentDraft])

  const handleAdminCommentDraftChange = useCallback((value: string) => {
    setAdminCommentDraft(value)
    setAdminCommentError(undefined)
  }, [])

  return (
    <div className="participating-volunteer-fullpage-view school-detail-fullpage-view">
      <CmsTextTabs
        className="school-detail-fullpage-view__tabs-row"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={VOLUNTEER_DETAIL_TAB_KEYS.map(key => ({
          key,
          label: TAB_LABELS[key],
        }))}
        trailing={
          activeTab === 'application' ? (
            <>
              <CmsButton
                variant="delete"
                size="large"
                width={140}
                disabled={
                  mergedVolunteer.activityWithdrawn ||
                  isAdminCommentEditing ||
                  activityWithdrawScheduleOptions.length === 0
                }
                onClick={handleRequestActivityWithdraw}
              >
                활동 포기
              </CmsButton>
              <CmsButton
                variant="secondary"
                size="large"
                width={180}
                icon={<DownloadOutlined />}
                onClick={handleActivityCertificateIssueClick}
              >
                활동인증서 발급
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                width={140}
                onClick={
                  isAdminCommentEditing ? handleAdminCommentSave : handleAdminCommentEditEnter
                }
              >
                {isAdminCommentEditing ? '코멘트 저장' : '코멘트 작성'}
              </CmsButton>
              <PersonalInfoRevealButton
                labelMode="stickyReveal"
                revealed={personalInfoRevealed}
                width={180}
                onClick={openPersonalInfoRevealConfirm}
              />
            </>
          ) : null
        }
      />

      <div className="program-detail-fullpage-modal__content school-detail-fullpage-view__content">
        {activeTab === 'application' ? (
          <div className="program-detail-fullpage-modal__info-tab">
            <div className="program-detail-fullpage-modal__info-tab-block participating-volunteer-fullpage-view__section-block">
              <ParticipatingVolunteerApplicationInfo
                volunteer={mergedVolunteer}
                privacyMasked={privacyMasked}
                adminComment={savedAdminComment}
                isAdminCommentEditing={isAdminCommentEditing}
                adminCommentDraft={adminCommentDraft}
                onAdminCommentDraftChange={handleAdminCommentDraftChange}
                adminCommentError={adminCommentError}
              />
            </div>
          </div>
        ) : (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab">
            {isGeneralIndividualProgram(program) ? (
              <ParticipatingIndividualVolunteerAssignmentSection
                program={program}
                volunteer={mergedVolunteer}
              />
            ) : (
              <ParticipatingVolunteerAssignmentSection program={program} volunteer={mergedVolunteer} />
            )}
          </div>
        )}
      </div>

      <ActivityWithdrawScheduleModal
        open={activityWithdrawModalOpen}
        scheduleOptions={activityWithdrawScheduleOptions}
        onCancel={() => setActivityWithdrawModalOpen(false)}
        onConfirm={payload =>
          handleConfirmActivityWithdraw({ stopSessionKey: payload.stopSessionKey })
        }
      />
      <ParticipatingVolunteerActivityCertificatePreviewModal
        open={activityCertPreviewOpen}
        onClose={() => setActivityCertPreviewOpen(false)}
        volunteer={mergedVolunteer}
        program={program}
      />
      {personalInfoRevealModal}
    </div>
  )
}
