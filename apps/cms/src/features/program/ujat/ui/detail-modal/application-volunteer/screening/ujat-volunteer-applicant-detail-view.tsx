import { useCallback, useMemo } from 'react'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import type { UjatManagerEvaluation } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { CmsButton } from '@/shared/ui'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { UjatVolunteerApplicantBasicInfo } from './ujat-volunteer-applicant-basic-info'
import { UjatVolunteerApplicantManagerEvaluationSection } from './ujat-volunteer-applicant-manager-evaluation-section'
import { UjatVolunteerApplicantInterviewAvailability } from './ujat-volunteer-applicant-interview-availability'
import { UjatVolunteerApplicantEssaySections } from './ujat-volunteer-applicant-essay-sections'
import { UjatVolunteerApplicantPreviousUjatSection } from './ujat-volunteer-applicant-previous-ujat-section'
import { UjatVolunteerApplicantInterviewEvaluationSection } from './ujat-volunteer-applicant-interview-evaluation-section'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './ujat-volunteer-applicant-detail.css'

export type UjatVolunteerApplicantDetailVariant = 'doc_screening' | 'doc_passed' | 'interview2'

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

export type UjatVolunteerApplicantDetailViewProps =
  | DocScreeningDetailProps
  | DocPassedDetailProps
  | Interview2DetailProps

function isDocPassedProps(
  props: UjatVolunteerApplicantDetailViewProps
): props is DocPassedDetailProps {
  return props.variant === 'doc_passed'
}

function isInterview2Props(
  props: UjatVolunteerApplicantDetailViewProps
): props is Interview2DetailProps {
  return props.variant === 'interview2'
}

export function UjatVolunteerApplicantDetailView(props: UjatVolunteerApplicantDetailViewProps) {
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
      <div className="ujat-volunteer-applicant-detail">
        <div className="ujat-volunteer-applicant-detail__header">
          <div className="program-detail-fullpage-modal__header-actions">
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              width={160}
              onClick={onWithdrawActivity}
            >
              활동 포기
            </CmsButton>
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              width={160}
              onClick={onInterviewFail}
            >
              면접 불합격
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              width={160}
              onClick={onInterviewPass}
            >
              면접 합격
            </CmsButton>
            <CmsButton
              type="button"
              variant="primary"
              size="large"
              width={160}
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

        <div className="ujat-volunteer-applicant-detail__body applicant-info-section">
          <UjatVolunteerApplicantBasicInfo
            applicant={applicant}
            maskSensitive={!personalInfoRevealed}
            statusRow="second_interview"
          />
          <UjatVolunteerApplicantInterviewEvaluationSection applicant={applicant} />
          <UjatVolunteerApplicantEssaySections applicant={applicant} />
        </div>

        {personalInfoRevealModal}
      </div>
    )
  }

  if (isDocPassedProps(props)) {
    const { onAssignInterview, onWithdrawActivity } = props

    return (
      <div className="ujat-volunteer-applicant-detail">
        <div className="ujat-volunteer-applicant-detail__header">
          <div className="program-detail-fullpage-modal__header-actions">
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              width={160}
              onClick={onWithdrawActivity}
            >
              활동 포기
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              width={160}
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

        <div className="ujat-volunteer-applicant-detail__body applicant-info-section">
          <UjatVolunteerApplicantBasicInfo
            applicant={applicant}
            maskSensitive={!personalInfoRevealed}
            statusRow="interview_assignment"
          />
          <UjatVolunteerApplicantInterviewAvailability applicant={applicant} />
          <UjatVolunteerApplicantPreviousUjatSection applicant={applicant} />
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
    <div className="ujat-volunteer-applicant-detail">
      <div className="ujat-volunteer-applicant-detail__header">
        <div className="program-detail-fullpage-modal__header-actions">
          <CmsButton type="button" variant="delete" size="large" width={160} onClick={onDocumentReject}>
            서류 반려
          </CmsButton>
          <CmsButton type="button" variant="secondary" size="large" width={160} onClick={onDocumentApprove}>
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

      <div className="ujat-volunteer-applicant-detail__body applicant-info-section">
        <UjatVolunteerApplicantBasicInfo
          applicant={applicant}
          maskSensitive={!personalInfoRevealed}
        />
        <UjatVolunteerApplicantManagerEvaluationSection
          applicant={applicant}
          openManagerDropdown={openManagerDropdown}
          setOpenManagerDropdown={setOpenManagerDropdown}
          onManagerAEvaluationChange={onManagerAEvaluationChange}
          onManagerBEvaluationChange={onManagerBEvaluationChange}
        />
        <UjatVolunteerApplicantInterviewAvailability applicant={applicant} />
        <UjatVolunteerApplicantEssaySections applicant={applicant} />
      </div>

      {personalInfoRevealModal}
    </div>
  )
}
