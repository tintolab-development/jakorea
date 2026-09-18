/**
 * 참여자(개인) 상세 풀페이지 인라인 뷰
 * 프로그램 진행 현황 > 참여자 — participantId 쿼리 시 목록 대신 표시
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DownloadOutlined } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type {
  GeneralIndividualApplicantRow,
} from '@/features/program/general/model/individual-applicant'
import { CmsButton, ExcelButton, useCmsAlert, CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH } from '@/shared/ui'
import { MESSAGES } from '@/shared/constants/messages'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { giveUpGeneralParticipatingInstitution } from '@/features/program/general/api/admin-program-progress-service'
import {
  saveIndividualApplicationAdminCommentRemote,
  saveIndividualApplicationDetailRemote,
} from '@/features/program/general/api/individual-application-update-helpers'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { useParticipatingIndividualApplicationDetailEnrichment } from '@/features/program/general/hooks/use-application-form-detail-enrichment'
import {
  buildProgramApiUnavailableSaveContent,
  notifyProgramApiUnavailable,
  PROGRAM_API_UNAVAILABLE_TITLE,
} from '@/features/program/shared/lib/program-api-unavailable'
import { useApplicantIndividualDetailEdit } from '@/features/program/general/hooks/use-applicant-individual-detail-edit'
import { buildParticipatingParticipantCertificateContext } from '@/features/program/general/lib/participating-individual-participant-certificate'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import {
  getParticipatingInstitutionActivityWithdrawScheduleOptions,
  buildParticipatingSchoolSessionKey,
} from '@/features/program/general/lib/participating-institution-activity-withdraw'
import { screeningWithdrawCompleteContent } from '@/features/program/general/lib/screening-subject-kind'
import { isWithinStudentCertificateIssuancePeriod } from '@/features/program/general/lib/resolve-student-certificate-kind'
import type { StudentCertificateDownloadContext } from '@/features/program/general/lib/build-student-certificate-issuance'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { ActivityWithdrawScheduleModal } from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import { CertificateBulkIssueReasonModal } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import type { CertificateIssueReasonValue } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { handleError } from '@/shared/utils/error-handler'
import { ApplicantGeneralIndividualBasicInfo } from '../applications/applicant-detail/individual-basic-info'
import {
  ParticipatingIndividualParticipantAttendanceSection,
  type ParticipatingIndividualParticipantAttendanceSectionHandle,
} from './participating-individual-participant-attendance-section'
import {
  ParticipatingIndividualParticipantAssignmentSection,
  type ParticipatingIndividualParticipantAssignmentSectionHandle,
} from './participating-individual-participant-assignment-section'
import { StudentCertificatePdfExportHost } from './student-certificate-pdf-export-host'
import './school-detail-fullpage-view.css'
import './participating-participant-fullpage-view.css'

export const PARTICIPANT_DETAIL_TAB_KEYS = ['application', 'attendance', 'assignments'] as const
export type ParticipantDetailTabKey = (typeof PARTICIPANT_DETAIL_TAB_KEYS)[number]

export function normalizeParticipantDetailTab(
  tab: string | null | undefined
): ParticipantDetailTabKey {
  if (tab && (PARTICIPANT_DETAIL_TAB_KEYS as readonly string[]).includes(tab)) {
    return tab as ParticipantDetailTabKey
  }
  return 'application'
}

const TAB_LABELS: Record<ParticipantDetailTabKey, string> = {
  application: '신청 정보',
  attendance: '출석 관리',
  assignments: '과제 관리',
}

export interface ParticipatingParticipantFullpageViewProps {
  program: Program
  participant: ParticipatingIndividualParticipantRow
  activeTab?: ParticipantDetailTabKey
  onTabChange?: (key: ParticipantDetailTabKey) => void
  onClearParticipantId: () => void
}

export function ParticipatingParticipantFullpageView({
  program,
  participant: initialParticipant,
  activeTab = 'application',
  onTabChange,
  onClearParticipantId: _onClearParticipantId,
}: ParticipatingParticipantFullpageViewProps) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const progressRemoteEnabled = shouldUseGeneralProgramProgressRemoteApi()
  const attendanceSectionRef = useRef<ParticipatingIndividualParticipantAttendanceSectionHandle>(null)
  const assignmentSectionRef = useRef<ParticipatingIndividualParticipantAssignmentSectionHandle>(null)
  const [participantPatches, setParticipantPatches] = useState<
    Partial<ParticipatingIndividualParticipantRow>
  >({})
  const [savedAdminComment, setSavedAdminComment] = useState('')
  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [activityWithdrawSubmitting, setActivityWithdrawSubmitting] = useState(false)
  const [certificateIssueModalOpen, setCertificateIssueModalOpen] = useState(false)
  const [certificateExportContext, setCertificateExportContext] =
    useState<StudentCertificateDownloadContext | null>(null)
  const [certificateExportActive, setCertificateExportActive] = useState(false)

  const enrichedParticipant = useParticipatingIndividualApplicationDetailEnrichment(
    initialParticipant
  )
  const baseParticipant = enrichedParticipant ?? initialParticipant

  const mergedParticipant = useMemo(
    () => ({ ...baseParticipant, ...participantPatches }),
    [baseParticipant, participantPatches]
  )

  const individualApplicationId = mergedParticipant.individualApplicationId?.trim() || ''
  const hasIndividualApplicationId = individualApplicationId !== ''

  const sessions = mergedParticipant.sessions ?? []
  const isActivityWithdrawn = mergedParticipant.activityWithdrawn === true

  const activityWithdrawScheduleOptions = useMemo(
    () => getParticipatingInstitutionActivityWithdrawScheduleOptions(program, sessions),
    [program, sessions]
  )

  const hasStudentSatisfactionSurvey = useMemo(
    () =>
      normalizeGeneralSurveyMenuKeys(program.generalSurveyMenuKeys ?? []).includes('satisfaction'),
    [program.generalSurveyMenuKeys]
  )

  const resolvePersonalInfoAccessItem = useCallback(
    () => mergedParticipant.applicantName ?? '참여자 상세 정보',
    [mergedParticipant.applicantName]
  )

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    resetDeps: [mergedParticipant.id],
    controlMode: 'headerStickyNoop',
  })

  const privacyMasked = !personalInfoRevealed

  const handleParticipantSaved = useCallback((updatedRow: GeneralIndividualApplicantRow) => {
    setParticipantPatches(prev => ({
      ...prev,
      adminComment: updatedRow.adminComment,
      textbookId: updatedRow.textbookId,
      textbookName: updatedRow.textbookName,
      textbookKits: updatedRow.textbookKits,
      textbookQuantity: updatedRow.textbookQuantity,
      textbookStatus: updatedRow.textbookStatus,
      detail: updatedRow.detail,
    }))
    if (updatedRow.adminComment != null) {
      setSavedAdminComment(updatedRow.adminComment)
    }
  }, [])

  const {
    isEditing: isApplicationInfoEditing,
    draft,
    validationErrors,
    textbookOptions,
    enterEdit: enterApplicationInfoEdit,
    cancelEdit: cancelApplicationInfoEdit,
    saveEdit: saveApplicationInfoEdit,
    updateDraft,
  } = useApplicantIndividualDetailEdit({
    applicant: mergedParticipant,
    program,
    onSaved: handleParticipantSaved,
    saveApplicant: async payload => {
      if (!shouldUseGeneralApplicationsRemoteApi() || !hasIndividualApplicationId) {
        return null
      }
      return saveIndividualApplicationDetailRemote(mergedParticipant, payload)
    },
  })

  useEffect(() => {
    setParticipantPatches({})
    setSavedAdminComment(baseParticipant.adminComment ?? '')
    setAdminCommentModalOpen(false)
    setAdminCommentDraft('')
    setActivityWithdrawModalOpen(false)
    setActivityWithdrawSubmitting(false)
    setCertificateIssueModalOpen(false)
    setCertificateExportContext(null)
    setCertificateExportActive(false)
  }, [initialParticipant.id, baseParticipant.adminComment])

  const setActiveTab = (key: string) => {
    onTabChange?.(normalizeParticipantDetailTab(key))
  }

  const handleRequestActivityWithdraw = useCallback(() => {
    if (isActivityWithdrawn) {
      showAlert({
        title: '활동 포기 안내',
        content: '이미 활동 포기 처리된 참여자입니다.',
      })
      return
    }
    if (activityWithdrawScheduleOptions.length === 0) {
      showAlert({
        title: '안내',
        content: '활동 포기 처리할 수 있는 교육 일정이 없습니다.',
      })
      return
    }
    if (isApplicationInfoEditing) return
    setActivityWithdrawModalOpen(true)
  }, [
    activityWithdrawScheduleOptions.length,
    isActivityWithdrawn,
    isApplicationInfoEditing,
    showAlert,
  ])

  const handleConfirmActivityWithdraw = useCallback(
    async (payload: { stopSessionKey: string; stopScheduleLabel: string }) => {
      const reason =
        [mergedParticipant.applicantName, payload.stopScheduleLabel].filter(Boolean).join(' · ') ||
        payload.stopScheduleLabel ||
        '활동 포기'
      const matched = sessions
        .map((session, index) => ({
          session,
          key: buildParticipatingSchoolSessionKey(session, index),
        }))
        .find(({ key }) => key === payload.stopSessionKey)
      const stopScheduleIdRaw = matched?.session.resolvedScheduleId
      const stopScheduleIdNum =
        stopScheduleIdRaw != null ? Number(stopScheduleIdRaw) : Number.NaN

      if (progressRemoteEnabled) {
        setActivityWithdrawSubmitting(true)
        try {
          await giveUpGeneralParticipatingInstitution(program.id, mergedParticipant.id, reason, {
            stopScheduleId: Number.isFinite(stopScheduleIdNum) ? stopScheduleIdNum : undefined,
          })
          setParticipantPatches(prev => ({
            ...prev,
            activityWithdrawn: true,
            activityWithdrawStopSessionKey: payload.stopSessionKey,
            activityWithdrawStopScheduleLabel: payload.stopScheduleLabel,
          }))
          await queryClient.invalidateQueries({
            queryKey: generalProgramProgressQueryKeys.participants(program.id, 'INDIVIDUAL'),
          })
          setActivityWithdrawModalOpen(false)
          showAlert({
            title: '활동 포기',
            content: screeningWithdrawCompleteContent('participant', mergedParticipant.applicantName),
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
        'general-participating-individual-give-up',
        '일반 프로그램 · 참여자 활동 포기'
      )
    },
    [
      mergedParticipant.applicantName,
      mergedParticipant.id,
      program.id,
      progressRemoteEnabled,
      queryClient,
      sessions,
      showAlert,
    ]
  )

  const handleCertificateIssueClick = useCallback(() => {
    if (certificateExportActive) return
    if (!isWithinStudentCertificateIssuancePeriod(mergedParticipant.participationAppliedAt)) {
      return
    }
    if (isApplicationInfoEditing) return
    setCertificateIssueModalOpen(true)
  }, [
    certificateExportActive,
    isApplicationInfoEditing,
    mergedParticipant.participationAppliedAt,
  ])

  const handleCertificateIssueModalCancel = useCallback(() => {
    setCertificateIssueModalOpen(false)
  }, [])

  const handleCertificateIssueConfirm = useCallback(
    (_reason: CertificateIssueReasonValue, reasonLabel: string) => {
      setCertificateExportContext(
        buildParticipatingParticipantCertificateContext({
          participant: mergedParticipant,
          program,
          hasStudentSatisfactionSurvey,
          issuanceReasonLabel: reasonLabel,
        })
      )
      setCertificateExportActive(true)
    },
    [hasStudentSatisfactionSurvey, mergedParticipant, program]
  )

  const handleCertificateExportComplete = useCallback((success: boolean) => {
    setCertificateExportContext(null)
    setCertificateExportActive(false)
    setCertificateIssueModalOpen(false)
    if (!success) {
      handleError(new Error('participant certificate pdf export failed'), {
        context: 'participatingParticipantFullpageView.certificateDownload',
      })
    }
  }, [])

  const handleAdminCommentEditEnter = useCallback(() => {
    if (isApplicationInfoEditing) return
    setAdminCommentDraft(savedAdminComment)
    setAdminCommentModalOpen(true)
  }, [isApplicationInfoEditing, savedAdminComment])

  const handleAdminCommentSave = useCallback(async () => {
    const trimmed = adminCommentDraft.trim()
    if (shouldUseGeneralApplicationsRemoteApi() && hasIndividualApplicationId) {
      try {
        const updated = await saveIndividualApplicationAdminCommentRemote(
          mergedParticipant,
          trimmed
        )
        setSavedAdminComment(updated.adminComment ?? '')
        setParticipantPatches(prev => ({ ...prev, adminComment: updated.adminComment }))
        setAdminCommentModalOpen(false)
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
      content: hasIndividualApplicationId
        ? buildProgramApiUnavailableSaveContent('참여자 관리자 코멘트')
        : '개인 신청 ID가 없어 코멘트를 저장할 수 없습니다. participants API에 sourceApplicationId 매핑이 필요합니다.',
    })
  }, [adminCommentDraft, hasIndividualApplicationId, mergedParticipant, showAlert])

  const handleAdminCommentModalCancel = useCallback(() => {
    setAdminCommentModalOpen(false)
  }, [])

  const handleAdminCommentDraftChange = useCallback((value: string) => {
    setAdminCommentDraft(value)
  }, [])

  const displayAdminComment =
    isApplicationInfoEditing && draft
      ? draft.adminComment
      : savedAdminComment || mergedParticipant.adminComment

  return (
    <div className="participating-participant-fullpage-view school-detail-fullpage-view">
      <CmsTextTabs
        className="school-detail-fullpage-view__tabs-row"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={PARTICIPANT_DETAIL_TAB_KEYS.map(key => ({
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
                  isActivityWithdrawn ||
                  isApplicationInfoEditing ||
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
                width={CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH}
                icon={<DownloadOutlined />}
                disabled={
                  certificateExportActive ||
                  isApplicationInfoEditing ||
                  !isWithinStudentCertificateIssuancePeriod(
                    mergedParticipant.participationAppliedAt
                  )
                }
                onClick={handleCertificateIssueClick}
              >
                수료증/참여인증서 발급
              </CmsButton>
              <ProgramEditInfoActions
                isEditing={isApplicationInfoEditing}
                onEdit={enterApplicationInfoEdit}
                onCancel={cancelApplicationInfoEdit}
                onSave={() => {
                  void saveApplicationInfoEdit()
                }}
              />
              <CmsButton
                variant="primary"
                size="large"
                width={140}
                disabled={isApplicationInfoEditing}
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
          ) : activeTab === 'attendance' ? (
            <>
              <CmsButton
                variant="secondary"
                size="large"
                width={140}
                onClick={() => attendanceSectionRef.current?.openAttendanceCorrectionModal()}
              >
                출결 정정
              </CmsButton>
              <ExcelButton
                onClick={() => attendanceSectionRef.current?.exportExcel()}
              />
            </>
          ) : activeTab === 'assignments' ? (
            <>
              <CmsButton
                variant="secondary"
                size="large"
                width={140}
                onClick={() => assignmentSectionRef.current?.openTeamChangeModal()}
              >
                팀 변경
              </CmsButton>
              <CmsButton
                variant="secondary"
                size="large"
                width={200}
                icon={<DownloadOutlined />}
                adminAction="download"
                onClick={() => assignmentSectionRef.current?.bulkDownloadAssignments()}
              >
                과제 일괄 다운로드
              </CmsButton>
              <ExcelButton onClick={() => assignmentSectionRef.current?.exportExcel()} />
            </>
          ) : null
        }
      />

      <div className="program-detail-fullpage-modal__content school-detail-fullpage-view__content">
        {activeTab === 'application' ? (
          <div className="program-detail-fullpage-modal__info-tab">
            <div className="program-detail-fullpage-modal__info-tab-block participating-participant-fullpage-view__section-block">
              <ApplicantGeneralIndividualBasicInfo
                applicant={{
                  ...mergedParticipant,
                  adminComment: displayAdminComment,
                }}
                program={program}
                maskSensitive={privacyMasked}
                mode={isApplicationInfoEditing ? 'edit' : 'view'}
                detailContext="progress"
                draft={isApplicationInfoEditing ? draft ?? undefined : undefined}
                onDraftChange={isApplicationInfoEditing ? updateDraft : undefined}
                validationErrors={validationErrors}
                textbookOptions={textbookOptions}
              />
            </div>
          </div>
        ) : activeTab === 'attendance' ? (
          <div
            className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab"
            aria-label="출석 관리"
          >
            <ParticipatingIndividualParticipantAttendanceSection
              ref={attendanceSectionRef}
              program={program}
              participant={mergedParticipant}
            />
          </div>
        ) : (
          <div
            className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab"
            aria-label="과제 관리"
          >
            <ParticipatingIndividualParticipantAssignmentSection
              ref={assignmentSectionRef}
              program={program}
              participant={mergedParticipant}
            />
          </div>
        )}
      </div>

      <ActivityWithdrawScheduleModal
        open={activityWithdrawModalOpen}
        scheduleOptions={activityWithdrawScheduleOptions}
        onCancel={() => setActivityWithdrawModalOpen(false)}
        onConfirm={handleConfirmActivityWithdraw}
      />
      <CertificateBulkIssueReasonModal
        open={certificateIssueModalOpen}
        onCancel={handleCertificateIssueModalCancel}
        applicationIds={[mergedParticipant.id]}
        onIssue={handleCertificateIssueConfirm}
      />
      <FormCertificatePdfExportOverlay visible={certificateExportActive} />
      {certificateExportContext != null ? (
        <StudentCertificatePdfExportHost
          key={`${certificateExportContext.student.id}-${certificateExportContext.certificateKind}-${certificateExportContext.issuanceReasonLabel}`}
          context={certificateExportContext}
          onComplete={handleCertificateExportComplete}
        />
      ) : null}
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
