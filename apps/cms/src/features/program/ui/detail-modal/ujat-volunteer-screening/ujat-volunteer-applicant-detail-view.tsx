import { useCallback } from 'react'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import type { UjatManagerEvaluation } from '@/features/program/model/ujat-volunteer-screening-constants'
import { AppButton } from '@/shared/ui/app-button'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { UjatVolunteerApplicantBasicInfo } from './ujat-volunteer-applicant-basic-info'
import { UjatVolunteerApplicantManagerEvaluationSection } from './ujat-volunteer-applicant-manager-evaluation-section'
import { UjatVolunteerApplicantInterviewAvailability } from './ujat-volunteer-applicant-interview-availability'
import { UjatVolunteerApplicantEssaySections } from './ujat-volunteer-applicant-essay-sections'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './ujat-volunteer-applicant-detail.css'

export interface UjatVolunteerApplicantDetailViewProps {
  applicant: UjatVolunteerApplicantRow
  onDocumentReject: () => void
  onDocumentApprove: () => void
  openManagerDropdown: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown: (value: { rowId: string; manager: 'A' | 'B' } | null) => void
  onManagerAEvaluationChange: (id: string, evaluation: UjatManagerEvaluation) => void
  onManagerBEvaluationChange: (id: string, evaluation: UjatManagerEvaluation) => void
}

export function UjatVolunteerApplicantDetailView({
  applicant,
  onDocumentReject,
  onDocumentApprove,
  openManagerDropdown,
  setOpenManagerDropdown,
  onManagerAEvaluationChange,
  onManagerBEvaluationChange,
}: UjatVolunteerApplicantDetailViewProps) {
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
