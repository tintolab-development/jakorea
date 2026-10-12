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
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
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
import { GeneralVolunteerApplicantBasicInfo } from './basic-info'
import { GeneralVolunteerApplicantManagerEvaluationSection } from './manager-evaluation-section'
import { GeneralVolunteerApplicantInterviewAvailability } from './interview-availability'
import { GeneralVolunteerApplicantEssaySections } from './essay-sections'
import {
  GeneralVolunteerApplicantInterviewEvaluationSection,
  type GeneralVolunteerApplicantInterviewEvaluationSectionHandle,
} from './interview-evaluation-section'
import { guardGeneralVolunteerInterview2Evaluation } from './general-volunteer-applicant-guard-actions'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './detail.css'

export type GeneralVolunteerApplicantDetailVariant = 'doc_screening' | 'doc_passed' | 'interview2'

type DocScreeningDetailProps = {
  variant?: 'doc_screening'
  applicant: GeneralVolunteerApplicantRow
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
              className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH}
              onClick={onCancelInterviewPass}
            >
              {cancelFinalPassButtonLabel}
            </CmsButton>
          ) : null}
          {canCancelFinalFail ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH}
              onClick={onCancelInterviewFail}
            >
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
                  className="cms-button--action"
                  width={CMS_ACTION_BUTTON_WIDTH}
                  onClick={onWithdrawActivity}
                >
                  활동 포기
                </CmsButton>
              ) : null}
              <CmsButton
                type="button"
                variant="delete"
                size="large"
                className="cms-button--action"
                width={CMS_ACTION_BUTTON_WIDTH}
                onClick={onInterviewFail}
              >
                면접 불합격
              </CmsButton>
              <CmsButton
                type="button"
                variant="secondary"
                size="large"
                className="cms-button--action"
                width={CMS_ACTION_BUTTON_WIDTH}
                onClick={onInterviewPass}
              >
                면접 합격
              </CmsButton>
              <CmsButton
                type="button"
                variant="primary"
                size="large"
                className="cms-button--action"
                width={CMS_ACTION_BUTTON_WIDTH}
                onClick={() => {
                  void handleInterviewEvaluationClick()
                }}
              >
                면접 평가
              </CmsButton>
            </>
          ) : null}
          <PersonalInfoRevealButton
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            cmsVariant="primary"
            cmsSize="large"
            width={180}
            onClick={openPersonalInfoRevealConfirm}
          />
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
  } = usePersonalInfoReveal({
    resolveAccessItem,
    revealPersonalInfo: revealVolunteerPersonalInfo,
    onPrivacyUnmasked: payload => {
      setUnmaskedOverlay(payload as GeneralVolunteerApplicantRow)
    },
    resetDeps: [applicant.id],
    controlMode: 'headerStickyNoop',
  })

  const assignInterviewLabel = useMemo(() => {
    if (applicant.interviewAssignmentStatus === 'assigned') return '면접일 재배정'
    return '면접일 배정'
  }, [applicant.interviewAssignmentStatus])

  if (isInterview2Props(props)) {
    return (
      <Interview2VolunteerApplicantDetail
        applicant={applicant}
        personalInfoRevealed={personalInfoRevealed}
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
                className="cms-button--action"
                width={CMS_ACTION_BUTTON_WIDTH}
                onClick={onCancelDocumentApproval}
              >
                승인 취소
              </CmsButton>
            ) : null}
            {canCancelDocumentRejection ? (
              <CmsButton
                type="button"
                variant="delete"
                size="large"
                className="cms-button--action"
                width={CMS_ACTION_BUTTON_WIDTH}
                onClick={onCancelDocumentRejection}
              >
                반려 취소
              </CmsButton>
            ) : null}
            {canGiveUp ? (
              <CmsButton
                type="button"
                variant="delete"
                size="large"
                className="cms-button--action"
                width={CMS_ACTION_BUTTON_WIDTH}
                onClick={onWithdrawActivity}
              >
                활동 포기
              </CmsButton>
            ) : null}
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH}
              onClick={onAssignInterview}
            >
              {assignInterviewLabel}
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

  return (
    <div className="general-volunteer-applicant-detail">
      <div className="general-volunteer-applicant-detail__header">
        <div className="program-detail-fullpage-modal__header-actions">
          {canCancelDocumentApproval ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH}
              onClick={onCancelDocumentApproval}
            >
              승인 취소
            </CmsButton>
          ) : null}
          {canCancelDocumentRejection ? (
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH}
              onClick={onCancelDocumentRejection}
            >
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
                  className="cms-button--action"
                  width={CMS_ACTION_BUTTON_WIDTH}
                  onClick={onDocumentReject}
                >
                  서류 반려
                </CmsButton>
              ) : null}
              {canDocumentApprove ? (
                <CmsButton
                  type="button"
                  variant="secondary"
                  size="large"
                  className="cms-button--action"
                  width={CMS_ACTION_BUTTON_WIDTH}
                  onClick={onDocumentApprove}
                >
                  서류 승인
                </CmsButton>
              ) : null}
            </>
          ) : null}
          <PersonalInfoRevealButton
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            cmsVariant="primary"
            cmsSize="large"
            width={180}
            onClick={openPersonalInfoRevealConfirm}
          />
        </div>
      </div>

      <div className="general-volunteer-applicant-detail__body applicant-info-section">
        <GeneralVolunteerApplicantBasicInfo
          applicant={applicant}
          maskSensitive={!personalInfoRevealed}
        />
        <GeneralVolunteerApplicantManagerEvaluationSection
          applicant={applicant}
          openManagerDropdown={openManagerDropdown}
          setOpenManagerDropdown={setOpenManagerDropdown}
          onManagerAEvaluationChange={onManagerAEvaluationChange}
          onManagerBEvaluationChange={onManagerBEvaluationChange}
          updatingManagerEvaluation={updatingManagerEvaluation}
        />
        <GeneralVolunteerApplicantInterviewAvailability applicant={applicant} />
        <GeneralVolunteerApplicantEssaySections applicant={applicant} />
      </div>

      {personalInfoRevealModal}
    </div>
  )
}
