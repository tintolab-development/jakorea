import { useCallback, useMemo } from 'react'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import type { UjatManagerEvaluation } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { ApplicantBasicInfo } from './basic-info'
import { ManagerEvaluationSection } from './manager-evaluation-section'
import { InterviewAvailabilitySection } from './interview-availability'
import { EssaySections } from './essay-sections'
import { PreviousTermSection } from './previous-term-section'
import { InterviewEvaluationSection } from './interview-evaluation-section'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './applicant-detail.css'

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
  onOpenInterviewEvaluation?: () => void
}

export type ApplicantDetailViewProps =
  | DocScreeningDetailProps
  | DocPassedDetailProps
  | Interview2DetailProps

function isDocPassedProps(
  props: ApplicantDetailViewProps
): props is DocPassedDetailProps {
  return props.variant === 'doc_passed'
}

function isInterview2Props(
  props: ApplicantDetailViewProps
): props is Interview2DetailProps {
  return props.variant === 'interview2'
}

export function ApplicantDetailView(props: ApplicantDetailViewProps) {
  const { applicant } = props

  const resolveAccessItem = useCallback(
    () => `${applicant.name} 봉사자 신청 정보`,
    [applicant.name]
  )

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem,
    resetDeps: [applicant.id],
    controlMode: 'headerStickyNoop',
  })

  const assignInterviewLabel = useMemo(() => {
    if (applicant.interviewAssignmentStatus === 'assigned') return '면접일 재배정'
    return '면접일 배정'
  }, [applicant.interviewAssignmentStatus])

  if (isInterview2Props(props)) {
    const { onWithdrawActivity, onInterviewFail, onInterviewPass, onOpenInterviewEvaluation } =
      props

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
              onClick={onOpenInterviewEvaluation}
            >
              면접 평가
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

        <div className="applicant-detail__body applicant-info-section">
          <ApplicantBasicInfo
            applicant={applicant}
            maskSensitive={!personalInfoRevealed}
            statusRow="second_interview"
          />
          <InterviewEvaluationSection applicant={applicant} />
          <EssaySections applicant={applicant} />
        </div>

        {personalInfoRevealModal}
      </div>
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
          <CmsButton type="button" variant="delete" size="large" className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH} onClick={onDocumentReject}>
            서류 반려
          </CmsButton>
          <CmsButton type="button" variant="secondary" size="large" className="cms-button--action"
              width={CMS_ACTION_BUTTON_WIDTH} onClick={onDocumentApprove}>
            서류 승인
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

      <div className="applicant-detail__body applicant-info-section">
        <ApplicantBasicInfo
          applicant={applicant}
          maskSensitive={!personalInfoRevealed}
        />
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
