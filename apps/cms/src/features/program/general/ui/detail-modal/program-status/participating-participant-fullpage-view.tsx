/**
 * 참여자(개인) 상세 풀페이지 인라인 뷰
 * 프로그램 진행 현황 > 참여자 — participantId 쿼리 시 목록 대신 표시
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
import {
  patchGeneralIndividualApplicantDetail,
  type GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'
import { CmsButton, useCmsAlert, CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH } from '@/shared/ui'
import { MESSAGES } from '@/shared/constants/messages'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { useApplicantIndividualDetailEdit } from '@/features/program/general/hooks/use-applicant-individual-detail-edit'
import { buildParticipatingParticipantCertificateContext } from '@/features/program/general/lib/participating-individual-participant-certificate'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import { getParticipatingInstitutionActivityWithdrawScheduleOptions } from '@/features/program/general/lib/participating-institution-activity-withdraw'
import { screeningWithdrawCompleteContent } from '@/features/program/general/lib/screening-subject-kind'
import { isWithinStudentCertificateIssuancePeriod } from '@/features/program/general/lib/resolve-student-certificate-kind'
import type { StudentCertificateDownloadContext } from '@/features/program/general/lib/build-student-certificate-issuance'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  PROGRAM_EDIT_INFO_BUTTON_PROPS,
  resolveProgramEditInfoClick,
} from '@/features/program/shared/lib/program-edit-info-button'
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
  const attendanceSectionRef = useRef<ParticipatingIndividualParticipantAttendanceSectionHandle>(null)
  const assignmentSectionRef = useRef<ParticipatingIndividualParticipantAssignmentSectionHandle>(null)
  const [participantPatches, setParticipantPatches] = useState<
    Partial<ParticipatingIndividualParticipantRow>
  >({})
  const [savedAdminComment, setSavedAdminComment] = useState('')
  const [isAdminCommentEditing, setIsAdminCommentEditing] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [certificateIssueModalOpen, setCertificateIssueModalOpen] = useState(false)
  const [certificateExportContext, setCertificateExportContext] =
    useState<StudentCertificateDownloadContext | null>(null)
  const [certificateExportActive, setCertificateExportActive] = useState(false)

  const mergedParticipant = useMemo(
    () => ({ ...initialParticipant, ...participantPatches }),
    [initialParticipant, participantPatches]
  )

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
    saveEdit: saveApplicationInfoEdit,
    updateDraft,
  } = useApplicantIndividualDetailEdit({
    applicant: mergedParticipant,
    program,
    onSaved: handleParticipantSaved,
  })

  useEffect(() => {
    setParticipantPatches({})
    setSavedAdminComment(initialParticipant.adminComment ?? '')
    setIsAdminCommentEditing(false)
    setAdminCommentDraft('')
    setActivityWithdrawModalOpen(false)
    setCertificateIssueModalOpen(false)
    setCertificateExportContext(null)
    setCertificateExportActive(false)
  }, [initialParticipant.id, initialParticipant.adminComment])

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
    if (isApplicationInfoEditing || isAdminCommentEditing) return
    setActivityWithdrawModalOpen(true)
  }, [
    activityWithdrawScheduleOptions.length,
    isActivityWithdrawn,
    isAdminCommentEditing,
    isApplicationInfoEditing,
    showAlert,
  ])

  const handleConfirmActivityWithdraw = useCallback(
    (payload: { stopSessionKey: string; stopScheduleLabel: string }) => {
      setParticipantPatches(prev => ({
        ...prev,
        activityWithdrawn: true,
        activityWithdrawStopSessionKey: payload.stopSessionKey,
        activityWithdrawStopScheduleLabel: payload.stopScheduleLabel,
      }))
      setActivityWithdrawModalOpen(false)
      showAlert({
        title: '활동 포기',
        content: screeningWithdrawCompleteContent('participant', mergedParticipant.applicantName),
      })
    },
    [mergedParticipant.applicantName, showAlert]
  )

  const handleCertificateIssueClick = useCallback(() => {
    if (certificateExportActive) return
    if (!isWithinStudentCertificateIssuancePeriod(mergedParticipant.participationAppliedAt)) {
      return
    }
    if (isApplicationInfoEditing || isAdminCommentEditing) return
    setCertificateIssueModalOpen(true)
  }, [
    certificateExportActive,
    isAdminCommentEditing,
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
    setIsAdminCommentEditing(true)
  }, [isApplicationInfoEditing, savedAdminComment])

  const handleAdminCommentSave = useCallback(() => {
    const trimmed = adminCommentDraft.trim()
    const updated = patchGeneralIndividualApplicantDetail(mergedParticipant.id, {
      adminComment: trimmed,
    })
    if (!updated) {
      void showAlert({
        title: '안내',
        content: MESSAGES.error.save,
      })
      return
    }
    setSavedAdminComment(trimmed)
    setParticipantPatches(prev => ({ ...prev, adminComment: updated.adminComment }))
    setIsAdminCommentEditing(false)
  }, [adminCommentDraft, mergedParticipant.id, showAlert])

  const handleAdminCommentDraftChange = useCallback((value: string) => {
    setAdminCommentDraft(value)
  }, [])

  const displayAdminComment = isAdminCommentEditing
    ? adminCommentDraft
    : isApplicationInfoEditing && draft
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
                width={CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH}
                icon={<DownloadOutlined />}
                disabled={
                  certificateExportActive ||
                  isApplicationInfoEditing ||
                  isAdminCommentEditing ||
                  !isWithinStudentCertificateIssuancePeriod(
                    mergedParticipant.participationAppliedAt
                  )
                }
                onClick={handleCertificateIssueClick}
              >
                수료증/참여인증서 발급
              </CmsButton>
              <CmsButton
                {...PROGRAM_EDIT_INFO_BUTTON_PROPS}
                disabled={isAdminCommentEditing}
                onClick={resolveProgramEditInfoClick(isApplicationInfoEditing, {
                  onEnterEdit: enterApplicationInfoEdit,
                  onSaveEdit: () => saveApplicationInfoEdit(),
                })}
              >
                {PROGRAM_EDIT_INFO_BUTTON_LABEL}
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                width={140}
                disabled={isApplicationInfoEditing}
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
              <CmsButton
                variant="primary"
                size="large"
                width={180}
                icon={<DownloadOutlined />}
                onClick={() => attendanceSectionRef.current?.exportExcel()}
              >
                엑셀 다운로드
              </CmsButton>
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
                onClick={() => assignmentSectionRef.current?.bulkDownloadAssignments()}
              >
                과제 일괄 다운로드
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                width={180}
                icon={<DownloadOutlined />}
                onClick={() => assignmentSectionRef.current?.exportExcel()}
              >
                엑셀 다운로드
              </CmsButton>
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
                isAdminCommentEditing={isAdminCommentEditing}
                adminCommentDraft={adminCommentDraft}
                onAdminCommentDraftChange={handleAdminCommentDraftChange}
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
    </div>
  )
}
