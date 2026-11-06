import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  GeneralVolunteerApplicantRow,
  GeneralVolunteerInterviewEvaluationPayload,
} from '@/features/program/general/model/volunteer-applicant'
import type { GeneralManagerEvaluation } from '@/features/program/general/lib/volunteer-screening-constants'
import { useGeneralInterview2EffectiveStatusTick } from '@/features/program/general/hooks/use-general-interview2-effective-status-tick'
import { useVolunteerApplicationDetailEnrichment } from '@/features/program/general/hooks/use-application-form-detail-enrichment'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { unmaskVolunteerApplicationPrivacyRemote } from '@/features/program/general/api/applications-api-client'
import { mapVolunteerApplicationDetailToApplicantRow } from '@/features/program/general/api/adapters/general-applications-adapters'
import { CmsButton } from '@/shared/ui'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { resolveSessionProgramRole } from '@/entities/program/lib/program-privacy-access'
import { sanitizeProgramPrivacyOverlay } from '@/features/program/shared/lib/program-my-assignment'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import {
  APPLICATION_ACTION_CANCEL_APPROVAL,
  APPLICATION_ACTION_CANCEL_FINAL_FAIL,
  APPLICATION_ACTION_CANCEL_FINAL_PASS,
  APPLICATION_ACTION_CANCEL_REJECTION,
  canPerformApplicationAction,
  hasExplicitApplicationAction,
} from '@/features/program/shared/lib/application-available-actions'
import { resolveVolunteerInterview2CancelPassButtonLabel } from '@/features/program/general/lib/volunteer-interview2-cancel-pass'
import {
  shouldShowVolunteerInterviewAvailabilitySection,
  shouldShowVolunteerManagerEvaluationSection,
  volunteerApplicationDecisionButtonLabels,
} from '@/features/program/general/lib/volunteer-application-detail-visibility'
import { GeneralVolunteerApplicantBasicInfo } from './basic-info'
import { GeneralVolunteerApplicantManagerEvaluationSection } from './manager-evaluation-section'
import { GeneralVolunteerApplicantInterviewAvailability } from './interview-availability'
import { GeneralVolunteerApplicantEssaySections } from './essay-sections'
import {
  GeneralVolunteerApplicantInterviewEvaluationSection,
  type GeneralVolunteerApplicantInterviewEvaluationSectionHandle,
} from './interview-evaluation-section'
import { resolveGeneralEffectiveSecondInterviewStatus } from '@/features/program/general/lib/general-volunteer-interview2-display'
import { canReassignVolunteerInterviewAssignment } from '@/features/program/shared/lib/volunteer-interview-reassign'
import {
  guardGeneralVolunteerInterview2Evaluation,
  isVolunteerAssignmentBlockedApplicationStatus,
} from './general-volunteer-applicant-guard-actions'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './detail.css'

export type GeneralVolunteerApplicantDetailVariant = 'doc_screening' | 'doc_passed' | 'interview2'

type DocScreeningDetailProps = {
  variant?: 'doc_screening'
  applicant: GeneralVolunteerApplicantRow
  /** 봉사자 면접 여부. false면 신청 상세 구성(평가·면접 일정 숨김) */
  interviewEnabled?: boolean
  onDocumentReject?: () => void
  onDocumentApprove?: () => void
  onCancelDocumentApproval?: () => void
  onCancelDocumentRejection?: () => void
  openManagerDropdown: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown: (value: { rowId: string; manager: 'A' | 'B' } | null) => void
  onManagerAEvaluationChange: (id: string, evaluation: GeneralManagerEvaluation) => void
  onManagerBEvaluationChange: (id: string, evaluation: GeneralManagerEvaluation) => void
  updatingManagerEvaluation: string | null
}

type DocPassedDetailProps = {
  variant: 'doc_passed'
  applicant: GeneralVolunteerApplicantRow
  onAssignInterview?: () => void
  onWithdrawActivity?: () => void
  onCancelDocumentApproval?: () => void
  onCancelDocumentRejection?: () => void
}

type Interview2DetailProps = {
  variant: 'interview2'
  applicant: GeneralVolunteerApplicantRow
  onWithdrawActivity?: () => void
  onInterviewFail?: () => void
  onInterviewPass?: () => void
  onCancelInterviewPass?: () => void
  onCancelInterviewFail?: () => void
  canFillBothEvaluationSlots: boolean
  currentAdminId: number | null
  onSaveInterviewEvaluation: (
    payload: GeneralVolunteerInterviewEvaluationPayload
  ) => Promise<boolean>
}

export type GeneralVolunteerApplicantDetailViewProps =
  | DocScreeningDetailProps
  | DocPassedDetailProps
  | Interview2DetailProps

function isDocPassedProps(
  props: GeneralVolunteerApplicantDetailViewProps
): props is DocPassedDetailProps {
  return props.variant === 'doc_passed'
}

function isInterview2Props(
  props: GeneralVolunteerApplicantDetailViewProps
): props is Interview2DetailProps {
  return props.variant === 'interview2'
}

function Interview2VolunteerApplicantDetail({
  applicant,
  personalInfoRevealed,
  programPrivacyPending,
  openPersonalInfoRevealConfirm,
  personalInfoRevealModal,
  onWithdrawActivity,
  onInterviewFail,
  onInterviewPass,
  onCancelInterviewPass,
  onCancelInterviewFail,
  canFillBothEvaluationSlots,
  currentAdminId,
  onSaveInterviewEvaluation,
}: {
  applicant: GeneralVolunteerApplicantRow
  personalInfoRevealed: boolean
  programPrivacyPending: boolean
  openPersonalInfoRevealConfirm: () => void
  personalInfoRevealModal: ReactNode
  onWithdrawActivity?: () => void
  onInterviewFail?: () => void
  onInterviewPass?: () => void
  onCancelInterviewPass?: () => void
  onCancelInterviewFail?: () => void
  canFillBothEvaluationSlots: boolean
  currentAdminId: number | null
  onSaveInterviewEvaluation: (
    payload: GeneralVolunteerInterviewEvaluationPayload
  ) => Promise<boolean>
}) {
  const evaluationSectionRef = useRef<GeneralVolunteerApplicantInterviewEvaluationSectionHandle>(null)
  const [isEvaluationEditing, setIsEvaluationEditing] = useState(false)
  const interviewNotEnded =
    resolveGeneralEffectiveSecondInterviewStatus(applicant) === 'waiting'
  const canCancelFinalPass = hasExplicitApplicationAction(
    applicant.availableActions,
    APPLICATION_ACTION_CANCEL_FINAL_PASS
  )
  const canCancelFinalFail = hasExplicitApplicationAction(
    applicant.availableActions,
    APPLICATION_ACTION_CANCEL_FINAL_FAIL
  )
  const canGiveUp = canPerformApplicationAction(applicant.availableActions, 'GIVE_UP')
  const showInterviewDecisionActions = !canCancelFinalPass && !canCancelFinalFail
  const cancelFinalPassButtonLabel = resolveVolunteerInterview2CancelPassButtonLabel(
    applicant.secondInterviewScreeningStatus
  )

  useEffect(() => {
    setIsEvaluationEditing(false)
  }, [applicant.id])

  const handleInterviewEvaluationClick = useCallback(async () => {
    if (!isEvaluationEditing) {
      if (!guardGeneralVolunteerInterview2Evaluation(applicant)) return
      setIsEvaluationEditing(true)
      return
    }
    const saved = await evaluationSectionRef.current?.submit()
    if (saved) setIsEvaluationEditing(false)
  }, [applicant, isEvaluationEditing])

  return (
    <div className="general-volunteer-applicant-detail">
      <div className="general-volunteer-applicant-detail__header">
        <div className="program-detail-fullpage-modal__header-actions">
          {canCancelFinalPass ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              onClick={onCancelInterviewPass} >
              {cancelFinalPassButtonLabel}
            </CmsButton>
          ) : null}
          {canCancelFinalFail ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              onClick={onCancelInterviewFail} >
              불합격 취소
            </CmsButton>
          ) : null}
          {showInterviewDecisionActions ? (
            <>
              {canGiveUp ? (
                <CmsButton
                  type="button"
                  variant="delete"
                  size="large"
                  onClick={onWithdrawActivity} >
                  활동 포기
                </CmsButton>
              ) : null}
              <CmsButton
                type="button"
                variant="delete"
                size="large"
                disabled={interviewNotEnded}
                onClick={onInterviewFail} >
                면접 불합격
              </CmsButton>
              <CmsButton
                type="button"
                variant="secondary"
                size="large"
                disabled={interviewNotEnded}
                onClick={onInterviewPass} >
                면접 합격
              </CmsButton>
              <CmsButton
                type="button"
                variant="primary"
                size="large"
                disabled={interviewNotEnded && !isEvaluationEditing}
                onClick={() => {
                  void handleInterviewEvaluationClick()
                }} >
                면접 평가
              </CmsButton>
            </>
          ) : null}
          <PersonalInfoRevealButton disabled={programPrivacyPending}
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            cmsVariant="primary"
            cmsSize="large"
            onClick={openPersonalInfoRevealConfirm} />
        </div>
      </div>

      <div className="general-volunteer-applicant-detail__body applicant-info-section">
        <GeneralVolunteerApplicantBasicInfo
          applicant={applicant}
          maskSensitive={!personalInfoRevealed}
          statusRow="second_interview"
        />
        <GeneralVolunteerApplicantInterviewEvaluationSection
          ref={evaluationSectionRef}
          applicant={applicant}
          isEditing={isEvaluationEditing}
          canFillBothSlots={canFillBothEvaluationSlots}
          currentAdminId={currentAdminId}
          onSave={onSaveInterviewEvaluation}
        />
        <GeneralVolunteerApplicantEssaySections applicant={applicant} />
      </div>

      {personalInfoRevealModal}
    </div>
  )
}

export function GeneralVolunteerApplicantDetailView(
  props: GeneralVolunteerApplicantDetailViewProps
) {
  const applicantBase = props.applicant
  const applicantEnriched = useVolunteerApplicationDetailEnrichment(applicantBase, {
    enabled: shouldUseGeneralApplicationsRemoteApi(),
  })
  const [unmaskedOverlay, setUnmaskedOverlay] = useState<GeneralVolunteerApplicantRow | null>(null)

  useEffect(() => {
    setUnmaskedOverlay(null)
  }, [applicantBase.id])

  const applicant = unmaskedOverlay ?? applicantEnriched ?? applicantBase

  const interview2StatusTickRows = useMemo(
    () => (props.variant === 'interview2' ? [applicant] : []),
    [applicant, props.variant]
  )
  useGeneralInterview2EffectiveStatusTick(interview2StatusTickRows)

  const resolveAccessItem = useCallback(
    () => `${applicant.name} 봉사자 신청 정보`,
    [applicant.name]
  )

  const revealVolunteerPersonalInfo = useCallback(
    async (reason: string) => {
      const programId = Number(applicant.programId)
      const response = await unmaskVolunteerApplicationPrivacyRemote(
        applicant.id,
        reason,
        Number.isSafeInteger(programId) ? programId : undefined
      )
      return mapVolunteerApplicationDetailToApplicantRow(response, applicant)
    },
    [applicant]
  )

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal: personalInfoRevealModal,
  programPrivacyPending,
  } = usePersonalInfoReveal({
    privacyScope: 'program',
    programId: applicant.programId,
    resolveProgramRole: () => resolveSessionProgramRole(applicant.programId),
    resolveAccessItem,
    revealPersonalInfo: revealVolunteerPersonalInfo,
    onPrivacyUnmasked: payload => {
      setUnmaskedOverlay(
        sanitizeProgramPrivacyOverlay(
          applicant.programId,
          payload as GeneralVolunteerApplicantRow
        )
      )
    },
    resetDeps: [applicant.id],
    controlMode: 'headerStickyNoop',
  })

  useEffect(() => {
    if (!personalInfoRevealed) setUnmaskedOverlay(null)
  }, [personalInfoRevealed])

  const assignInterviewLabel = useMemo(() => {
    if (applicant.interviewAssignmentStatus === 'assigned') return '면접일 재배정'
    return '면접일 배정'
  }, [applicant.interviewAssignmentStatus])

  const assignInterviewDisabled = useMemo(() => {
    if (isVolunteerAssignmentBlockedApplicationStatus(applicant.applicationStatus)) return true
    if (applicant.interviewAssignmentStatus === 'withdrawn') return true
    if (applicant.interviewAssignmentStatus === 'not_required') return true
    if (applicant.interviewAssignmentStatus === 'assigned') {
      return !canReassignVolunteerInterviewAssignment(applicant)
    }
    return false
  }, [applicant])

  if (isInterview2Props(props)) {
    return (
      <Interview2VolunteerApplicantDetail
        applicant={applicant}
        personalInfoRevealed={personalInfoRevealed}
        programPrivacyPending={programPrivacyPending}
        openPersonalInfoRevealConfirm={openPersonalInfoRevealConfirm}
        personalInfoRevealModal={personalInfoRevealModal}
        onWithdrawActivity={props.onWithdrawActivity}
        onInterviewFail={props.onInterviewFail}
        onInterviewPass={props.onInterviewPass}
        onCancelInterviewPass={props.onCancelInterviewPass}
        onCancelInterviewFail={props.onCancelInterviewFail}
        canFillBothEvaluationSlots={props.canFillBothEvaluationSlots}
        currentAdminId={props.currentAdminId}
        onSaveInterviewEvaluation={props.onSaveInterviewEvaluation}
      />
    )
  }

  if (isDocPassedProps(props)) {
    const {
      onAssignInterview,
      onWithdrawActivity,
      onCancelDocumentApproval,
      onCancelDocumentRejection,
    } = props
    const canCancelDocumentApproval = canPerformApplicationAction(
      applicant.availableActions,
      APPLICATION_ACTION_CANCEL_APPROVAL
    )
    const canCancelDocumentRejection = canPerformApplicationAction(
      applicant.availableActions,
      APPLICATION_ACTION_CANCEL_REJECTION
    )
    const canGiveUp = canPerformApplicationAction(applicant.availableActions, 'GIVE_UP')

    return (
      <div className="general-volunteer-applicant-detail">
        <div className="general-volunteer-applicant-detail__header">
          <div className="program-detail-fullpage-modal__header-actions">
            {canCancelDocumentApproval ? (
              <CmsButton
                type="button"
                variant="delete"
                size="large"
                onClick={onCancelDocumentApproval} >
                승인 취소
              </CmsButton>
            ) : null}
            {canCancelDocumentRejection ? (
              <CmsButton
                type="button"
                variant="delete"
                size="large"
                onClick={onCancelDocumentRejection} >
                반려 취소
              </CmsButton>
            ) : null}
            {canGiveUp ? (
              <CmsButton
                type="button"
                variant="delete"
                size="large"
                onClick={onWithdrawActivity} >
                활동 포기
              </CmsButton>
            ) : null}
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              disabled={assignInterviewDisabled}
              onClick={onAssignInterview}
            >
              {assignInterviewLabel}
            </CmsButton>
            <PersonalInfoRevealButton disabled={programPrivacyPending}
              labelMode="stickyReveal"
              revealed={personalInfoRevealed}
              cmsVariant="primary"
              cmsSize="large"
              onClick={openPersonalInfoRevealConfirm} />
          </div>
        </div>

        <div className="general-volunteer-applicant-detail__body applicant-info-section">
          <GeneralVolunteerApplicantBasicInfo
            applicant={applicant}
            maskSensitive={!personalInfoRevealed}
            statusRow="interview_assignment"
          />
          <GeneralVolunteerApplicantInterviewAvailability applicant={applicant} />
          <GeneralVolunteerApplicantEssaySections applicant={applicant} />
        </div>

        {personalInfoRevealModal}
      </div>
    )
  }

  const {
    interviewEnabled = true,
    onDocumentReject,
    onDocumentApprove,
    onCancelDocumentApproval,
    onCancelDocumentRejection,
    openManagerDropdown,
    setOpenManagerDropdown,
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
    updatingManagerEvaluation,
  } = props
  const showManagerEvaluation = shouldShowVolunteerManagerEvaluationSection(interviewEnabled)
  const showInterviewAvailability =
    shouldShowVolunteerInterviewAvailabilitySection(interviewEnabled)

  const canCancelDocumentApproval = canPerformApplicationAction(
    applicant.availableActions,
    APPLICATION_ACTION_CANCEL_APPROVAL
  )
  const canCancelDocumentRejection = canPerformApplicationAction(
    applicant.availableActions,
    APPLICATION_ACTION_CANCEL_REJECTION
  )
  const canDocumentApprove = canPerformApplicationAction(applicant.availableActions, 'APPROVE')
  const canDocumentReject = canPerformApplicationAction(applicant.availableActions, 'REJECT')
  const showPendingDocumentActions = canDocumentApprove || canDocumentReject
  const decisionButtonLabels = volunteerApplicationDecisionButtonLabels(interviewEnabled)

  return (
    <div className="general-volunteer-applicant-detail">
      <div className="general-volunteer-applicant-detail__header">
        <div className="program-detail-fullpage-modal__header-actions">
          {canCancelDocumentApproval ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              onClick={onCancelDocumentApproval} >
              승인 취소
            </CmsButton>
          ) : null}
          {canCancelDocumentRejection ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              onClick={onCancelDocumentRejection} >
              반려 취소
            </CmsButton>
          ) : null}
          {showPendingDocumentActions ? (
            <>
              {canDocumentReject ? (
                <CmsButton
                  type="button"
                  variant="delete"
                  size="large"
                  onClick={onDocumentReject} >
                  {decisionButtonLabels.reject}
                </CmsButton>
              ) : null}
              {canDocumentApprove ? (
                <CmsButton
                  type="button"
                  variant="secondary"
                  size="large"
                  onClick={onDocumentApprove} >
                  {decisionButtonLabels.approve}
                </CmsButton>
              ) : null}
            </>
          ) : null}
          <PersonalInfoRevealButton disabled={programPrivacyPending}
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            cmsVariant="primary"
            cmsSize="large"
            onClick={openPersonalInfoRevealConfirm} />
        </div>
      </div>

      <div className="general-volunteer-applicant-detail__body applicant-info-section">
        <GeneralVolunteerApplicantBasicInfo
          applicant={applicant}
          maskSensitive={!personalInfoRevealed}
          statusRow={interviewEnabled ? 'document_screening' : 'program_approval'}
        />
        {showManagerEvaluation ? (
          <GeneralVolunteerApplicantManagerEvaluationSection
            applicant={applicant}
            openManagerDropdown={openManagerDropdown}
            setOpenManagerDropdown={setOpenManagerDropdown}
            onManagerAEvaluationChange={onManagerAEvaluationChange}
            onManagerBEvaluationChange={onManagerBEvaluationChange}
            updatingManagerEvaluation={updatingManagerEvaluation}
          />
        ) : null}
        {showInterviewAvailability ? (
          <GeneralVolunteerApplicantInterviewAvailability applicant={applicant} />
        ) : null}
        <GeneralVolunteerApplicantEssaySections applicant={applicant} />
      </div>

      {personalInfoRevealModal}
    </div>
  )
}
