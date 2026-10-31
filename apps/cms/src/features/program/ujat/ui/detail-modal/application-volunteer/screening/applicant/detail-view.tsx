import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  UjatVolunteerApplicantRow,
  UjatVolunteerInterviewEvaluationPayload,
} from '@/features/program/ujat/model/ujat-volunteer-applicant'
import type { UjatManagerEvaluation } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { resolveSessionProgramRole } from '@/entities/program/lib/program-privacy-access'
import { sanitizeProgramPrivacyOverlay } from '@/features/program/shared/lib/program-my-assignment'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { unmaskVolunteerApplicationPrivacyRemote } from '@/features/program/general/api/applications-api-client'
import {
  applyUjatVolunteerApplicationDetail,
  useUjatVolunteerApplicationDetailEnrichment,
} from '@/features/program/ujat/lib/ujat-volunteer-application-detail'
import { ApplicantBasicInfo } from './basic-info'
import { ManagerEvaluationSection } from './manager-evaluation-section'
import { InterviewAvailabilitySection } from './interview-availability'
import { EssaySections } from './essay-sections'
import { PreviousTermSection } from './previous-term-section'
import {
  InterviewEvaluationSection,
  type InterviewEvaluationSectionHandle,
} from './interview-evaluation-section'
import { resolveUjatEffectiveSecondInterviewStatus } from '../interview2/display'
import { guardUjatVolunteerInterview2Evaluation } from './guard-actions'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './detail.css'

export type ApplicantDetailVariant = 'doc_screening' | 'doc_passed' | 'interview2'

type DocScreeningDetailProps = {
  variant?: 'doc_screening'
  applicant: UjatVolunteerApplicantRow
  onDocumentReject: () => void
  onDocumentApprove: () => void
  openManagerDropdown: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown: (value: { rowId: string; manager: 'A' | 'B' } | null) => void
  onManagerAEvaluationChange: (id: string, evaluation: UjatManagerEvaluation) => void
  onManagerBEvaluationChange: (id: string, evaluation: UjatManagerEvaluation) => void
}

type DocPassedDetailProps = {
  variant: 'doc_passed'
  applicant: UjatVolunteerApplicantRow
  onAssignInterview?: () => void
  onWithdrawActivity?: () => void
}

type Interview2DetailProps = {
  variant: 'interview2'
  applicant: UjatVolunteerApplicantRow
  onWithdrawActivity?: () => void
  onInterviewFail?: () => void
  onInterviewPass?: () => void
  /** 인라인 면접 평가 저장. 편집 중 「면접 평가」 재클릭 시 호출 */
  onSaveInterviewEvaluation?: (payload: UjatVolunteerInterviewEvaluationPayload) => Promise<boolean>
}

export type ApplicantDetailViewProps =
  | DocScreeningDetailProps
  | DocPassedDetailProps
  | Interview2DetailProps

function isDocPassedProps(props: ApplicantDetailViewProps): props is DocPassedDetailProps {
  return props.variant === 'doc_passed'
}

function isInterview2Props(props: ApplicantDetailViewProps): props is Interview2DetailProps {
  return props.variant === 'interview2'
}

function Interview2ApplicantDetail({
  applicant,
  personalInfoRevealed,
  programPrivacyPending,
  openPersonalInfoRevealConfirm,
  personalInfoRevealModal,
  onWithdrawActivity,
  onInterviewFail,
  onInterviewPass,
  onSaveInterviewEvaluation,
}: {
  applicant: UjatVolunteerApplicantRow
  personalInfoRevealed: boolean
  programPrivacyPending: boolean
  openPersonalInfoRevealConfirm: () => void
  personalInfoRevealModal: ReactNode
  onWithdrawActivity?: () => void
  onInterviewFail?: () => void
  onInterviewPass?: () => void
  onSaveInterviewEvaluation?: (payload: UjatVolunteerInterviewEvaluationPayload) => Promise<boolean>
}) {
  const evaluationSectionRef = useRef<InterviewEvaluationSectionHandle>(null)
  const [isEvaluationEditing, setIsEvaluationEditing] = useState(false)
  const interviewNotEnded = resolveUjatEffectiveSecondInterviewStatus(applicant) === 'waiting'

  useEffect(() => {
    setIsEvaluationEditing(false)
  }, [applicant.id])

  const handleInterviewEvaluationClick = useCallback(async () => {
    if (!isEvaluationEditing) {
      if (!guardUjatVolunteerInterview2Evaluation(applicant)) return
      setIsEvaluationEditing(true)
      return
    }
    const saved = await evaluationSectionRef.current?.submit()
    if (saved) setIsEvaluationEditing(false)
  }, [applicant, isEvaluationEditing])

  return (
    <div className="applicant-detail">
      <div className="applicant-detail__header">
        <div className="program-detail-fullpage-modal__header-actions">
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
          <CmsButton
            type="button"
            variant="delete"
            size="large"
            className="cms-button--action"
            width={CMS_ACTION_BUTTON_WIDTH}
            disabled={interviewNotEnded}
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
            disabled={interviewNotEnded}
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
            disabled={interviewNotEnded && !isEvaluationEditing}
            onClick={() => {
              void handleInterviewEvaluationClick()
            }}
          >
            면접 평가
          </CmsButton>
          <PersonalInfoRevealButton
            disabled={programPrivacyPending}
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            cmsVariant="primary"
            cmsSize="large"
            width={180}
            onClick={openPersonalInfoRevealConfirm}
          />
        </div>
      </div>

      <div className="applicant-detail__body applicant-info-section">
        <ApplicantBasicInfo
          applicant={applicant}
          maskSensitive={!personalInfoRevealed}
          statusRow="second_interview"
        />
        <InterviewEvaluationSection
          ref={evaluationSectionRef}
          applicant={applicant}
          isEditing={isEvaluationEditing}
          onSave={async payload => (await onSaveInterviewEvaluation?.(payload)) ?? false}
        />
        <PreviousTermSection applicant={applicant} />
        <EssaySections applicant={applicant} />
      </div>

      {personalInfoRevealModal}
    </div>
  )
}

export function ApplicantDetailView(props: ApplicantDetailViewProps) {
  const applicantEnriched = useUjatVolunteerApplicationDetailEnrichment(props.applicant)
  const [unmaskedOverlay, setUnmaskedOverlay] = useState<UjatVolunteerApplicantRow | null>(null)

  useEffect(() => {
    setUnmaskedOverlay(null)
  }, [props.applicant.id])

  const applicant = unmaskedOverlay ?? applicantEnriched

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
      return applyUjatVolunteerApplicationDetail(applicant, response.application, response.profile)
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
        sanitizeProgramPrivacyOverlay(applicant.programId, payload as UjatVolunteerApplicantRow)
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

  if (isInterview2Props(props)) {
    return (
      <Interview2ApplicantDetail
        applicant={applicant}
        personalInfoRevealed={personalInfoRevealed}
        programPrivacyPending={programPrivacyPending}
        openPersonalInfoRevealConfirm={openPersonalInfoRevealConfirm}
        personalInfoRevealModal={personalInfoRevealModal}
        onWithdrawActivity={props.onWithdrawActivity}
        onInterviewFail={props.onInterviewFail}
        onInterviewPass={props.onInterviewPass}
        onSaveInterviewEvaluation={props.onSaveInterviewEvaluation}
      />
    )
  }

  if (isDocPassedProps(props)) {
    const { onAssignInterview, onWithdrawActivity } = props

    return (
      <div className="applicant-detail">
        <div className="applicant-detail__header">
          <div className="program-detail-fullpage-modal__header-actions">
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
              disabled={programPrivacyPending}
              labelMode="stickyReveal"
              revealed={personalInfoRevealed}
              cmsVariant="primary"
              cmsSize="large"
              width={180}
              onClick={openPersonalInfoRevealConfirm}
            />
          </div>
        </div>

        <div className="applicant-detail__body applicant-info-section">
          <ApplicantBasicInfo
            applicant={applicant}
            maskSensitive={!personalInfoRevealed}
            statusRow="interview_assignment"
          />
          <InterviewAvailabilitySection applicant={applicant} />
          <PreviousTermSection applicant={applicant} />
          <EssaySections applicant={applicant} />
        </div>

        {personalInfoRevealModal}
      </div>
    )
  }

  const {
    onDocumentReject,
    onDocumentApprove,
    openManagerDropdown,
    setOpenManagerDropdown,
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
  } = props

  return (
    <div className="applicant-detail">
      <div className="applicant-detail__header">
        <div className="program-detail-fullpage-modal__header-actions">
          <CmsButton type="button" variant="delete" size="large" onClick={onDocumentReject}>
            서류 반려
          </CmsButton>
          <CmsButton type="button" variant="secondary" size="large" onClick={onDocumentApprove}>
            서류 승인
          </CmsButton>
          <PersonalInfoRevealButton
            disabled={programPrivacyPending}
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            cmsVariant="primary"
            cmsSize="large"
            onClick={openPersonalInfoRevealConfirm}
          />
        </div>
      </div>

      <div className="applicant-detail__body applicant-info-section">
        <ApplicantBasicInfo applicant={applicant} maskSensitive={!personalInfoRevealed} />
        <ManagerEvaluationSection
          applicant={applicant}
          openManagerDropdown={openManagerDropdown}
          setOpenManagerDropdown={setOpenManagerDropdown}
          onManagerAEvaluationChange={onManagerAEvaluationChange}
          onManagerBEvaluationChange={onManagerBEvaluationChange}
        />
        <InterviewAvailabilitySection applicant={applicant} />
        <PreviousTermSection applicant={applicant} />
        <EssaySections applicant={applicant} />
      </div>

      {personalInfoRevealModal}
    </div>
  )
}
