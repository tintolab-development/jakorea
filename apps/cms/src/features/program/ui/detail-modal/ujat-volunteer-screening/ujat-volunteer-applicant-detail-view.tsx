import { useCallback, useMemo } from 'react'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import type { UjatManagerEvaluation } from '@/features/program/model/ujat-volunteer-screening-constants'
import { AppButton } from '@/shared/ui/app-button'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { UjatVolunteerApplicantBasicInfo } from './ujat-volunteer-applicant-basic-info'
import { UjatVolunteerApplicantManagerEvaluationSection } from './ujat-volunteer-applicant-manager-evaluation-section'
import { UjatVolunteerApplicantInterviewAvailability } from './ujat-volunteer-applicant-interview-availability'
import { UjatVolunteerApplicantEssaySections } from './ujat-volunteer-applicant-essay-sections'
import { UjatVolunteerApplicantPreviousUjatSection } from './ujat-volunteer-applicant-previous-ujat-section'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './ujat-volunteer-applicant-detail.css'

export type UjatVolunteerApplicantDetailVariant = 'doc_screening' | 'doc_passed'

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

export type UjatVolunteerApplicantDetailViewProps = DocScreeningDetailProps | DocPassedDetailProps

function isDocPassedProps(
  props: UjatVolunteerApplicantDetailViewProps
): props is DocPassedDetailProps {
  return props.variant === 'doc_passed'
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

  const isWithdrawn = applicant.interviewAssignmentStatus === 'withdrawn'

  if (isDocPassedProps(props)) {
    const { onAssignInterview, onWithdrawActivity } = props

    return (
      <div className="ujat-volunteer-applicant-detail">
        <div className="ujat-volunteer-applicant-detail__header">
          <div className="program-detail-fullpage-modal__header-actions">
            <AppButton
              variant="danger"
              size="filter"
              disabled={isWithdrawn}
              onClick={onWithdrawActivity}
            >
              활동 포기
            </AppButton>
            <AppButton
              variant="cancel"
              size="filter"
              disabled={isWithdrawn}
              onClick={onAssignInterview}
            >
              {assignInterviewLabel}
            </AppButton>
            <PersonalInfoRevealButton
              ui="app"
              labelMode="stickyReveal"
              revealed={personalInfoRevealed}
              variant="primary"
              size="filter-wide"
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
          <AppButton variant="danger" size="filter" onClick={onDocumentReject}>
            서류 반려
          </AppButton>
          <AppButton variant="cancel" size="filter" onClick={onDocumentApprove}>
            서류 승인
          </AppButton>
          <PersonalInfoRevealButton
            ui="app"
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            variant="primary"
            size="filter-wide"
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
