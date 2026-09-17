/**
 * 참여 봉사자 상세 풀페이지 인라인 뷰
 * 프로그램 진행 현황 > 참여 봉사자 — volunteerId 쿼리 시 목록 대신 표시
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DownloadOutlined } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { MESSAGES } from '@/shared/constants/messages'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { upsertAdminCommentByTargetRemote } from '@/features/program/general/api/admin-comments-api-client'
import { giveUpGeneralParticipatingInstitution } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import {
  buildProgramApiUnavailableSaveContent,
  notifyProgramApiUnavailable,
  PROGRAM_API_UNAVAILABLE_TITLE,
} from '@/features/program/shared/lib/program-api-unavailable'
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
import { ParticipatingVolunteerSettlementSection } from './participating-volunteer-settlement-section'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import './school-detail-fullpage-view.css'
import './participating-volunteer-fullpage-view.css'

export const VOLUNTEER_DETAIL_TAB_KEYS = ['application', 'assignment', 'settlement'] as const
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
  settlement: '정산 현황',
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
  const queryClient = useQueryClient()
  const progressRemoteEnabled = shouldUseGeneralProgramProgressRemoteApi()
  /**
   * URL(`volunteerTab`)이 source of truth이지만, setSearchParams 반영 전·props 지연 시
   * 탭 UI/본문이 안 바뀌는 문제가 있어 로컬 탭을 먼저 갱신한 뒤 URL과 동기화한다.
   */
  const [uiTab, setUiTab] = useState<VolunteerDetailTabKey>(
    () => activeTabFromUrl ?? 'application'
  )
  const [volunteerPatches, setVolunteerPatches] = useState<Partial<ParticipatingVolunteerRow>>({})
  const [savedAdminComment, setSavedAdminComment] = useState('')
  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')
  const [adminCommentError, setAdminCommentError] = useState<string | undefined>()
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [activityWithdrawSubmitting, setActivityWithdrawSubmitting] = useState(false)
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
    setAdminCommentModalOpen(false)
    setAdminCommentDraft('')
    setAdminCommentError(undefined)
    setVolunteerPatches({})
    setActivityWithdrawModalOpen(false)
    setActivityWithdrawSubmitting(false)
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
    setActivityWithdrawModalOpen(true)
  }, [activityWithdrawScheduleOptions.length, mergedVolunteer.activityWithdrawn, showAlert])

  const handleConfirmActivityWithdraw = useCallback(
    async (payload: { stopSessionKey: string }) => {
      const stopSession = (mergedVolunteer.sessions ?? []).find(
        session => String(session.round) === payload.stopSessionKey
      )
      const stopScheduleLabel = stopSession
        ? activityWithdrawScheduleOptions.find(option => option.value === payload.stopSessionKey)
            ?.label
        : undefined
      const reason =
        [mergedVolunteer.volunteerName, stopScheduleLabel].filter(Boolean).join(' · ') ||
        stopScheduleLabel ||
        '활동 포기'
      const stopScheduleIdNum =
        stopSession?.resolvedScheduleId != null ? Number(stopSession.resolvedScheduleId) : Number.NaN

      if (progressRemoteEnabled) {
        setActivityWithdrawSubmitting(true)
        try {
          await giveUpGeneralParticipatingInstitution(program.id, mergedVolunteer.id, reason, {
            stopScheduleId: Number.isFinite(stopScheduleIdNum) ? stopScheduleIdNum : undefined,
          })
          const patch = applyParticipatingVolunteerActivityWithdraw(mergedVolunteer, payload)
          if (Object.keys(patch).length > 0) {
            setVolunteerPatches(prev => ({ ...prev, ...patch }))
          }
          await queryClient.invalidateQueries({
            queryKey: generalProgramProgressQueryKeys.volunteers(program.id),
          })
          setActivityWithdrawModalOpen(false)
          showAlert({
            title: '활동 포기',
            content: `${mergedVolunteer.volunteerName} 봉사자가 활동 포기 처리되었습니다.`,
          })
        } catch (error) {
          const message =
            error instanceof Error && error.message.trim()
              ? error.message
              : '활동 포기 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          showAlert({
            title: '활동 포기 실패',
            content: message,
          })
        } finally {
          setActivityWithdrawSubmitting(false)
        }
        return
      }

      notifyProgramApiUnavailable(
        'general-participating-volunteer-give-up',
        '일반 프로그램 · 참여 봉사자 활동 포기'
      )
    },
    [
      activityWithdrawScheduleOptions,
      mergedVolunteer,
      program.id,
      progressRemoteEnabled,
      queryClient,
      showAlert,
    ]
  )

  const handleActivityCertificateIssueClick = useCallback(() => {
    setActivityCertPreviewOpen(true)
  }, [])

  const handleAdminCommentEditEnter = useCallback(() => {
    setAdminCommentDraft(savedAdminComment)
    setAdminCommentError(undefined)
    setAdminCommentModalOpen(true)
  }, [savedAdminComment])

  const handleAdminCommentSave = useCallback(async () => {
    const trimmed = adminCommentDraft.trim()
    if (shouldUseGeneralApplicationsRemoteApi()) {
      const targetId = Number(mergedVolunteer.id)
      if (!Number.isFinite(targetId)) {
        void showAlert({
          title: '안내',
          content: MESSAGES.error.save,
        })
        return
      }
      try {
        const result = await upsertAdminCommentByTargetRemote({
          targetType: 'VOLUNTEER_APPLICATION',
          targetId,
          screenCode: 'VOLUNTEER_APPLICATION',
          comment: trimmed,
        })
        setSavedAdminComment(result.commentText ?? '')
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
      content: buildProgramApiUnavailableSaveContent('참여 봉사자 관리자 코멘트'),
    })
  }, [adminCommentDraft, mergedVolunteer.id, showAlert])

  const handleAdminCommentModalCancel = useCallback(() => {
    setAdminCommentModalOpen(false)
    setAdminCommentError(undefined)
  }, [])

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
                  activityWithdrawSubmitting ||
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
                onClick={handleAdminCommentEditEnter}
              >
                코멘트 작성
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
                isAdminCommentEditing={false}
                adminCommentError={adminCommentError}
              />
            </div>
          </div>
        ) : activeTab === 'settlement' ? (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab">
            <ParticipatingVolunteerSettlementSection
              program={program}
              volunteer={mergedVolunteer}
            />
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
