import { useCallback, useMemo } from 'react'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import type { GeneralManagerEvaluation } from '@/features/program/general/lib/volunteer-screening-constants'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { GeneralVolunteerApplicantBasicInfo } from './basic-info'
import { GeneralVolunteerApplicantManagerEvaluationSection } from './manager-evaluation-section'
import { GeneralVolunteerApplicantInterviewAvailability } from './interview-availability'
import { GeneralVolunteerApplicantEssaySections } from './essay-sections'
import { GeneralVolunteerApplicantInterviewEvaluationSection } from './interview-evaluation-section'
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
}

type DocPassedDetailProps = {
  variant: 'doc_passed'
  applicant: GeneralVolunteerApplicantRow
  onAssignInterview?: () => void
  onWithdrawActivity?: () => void
}

type Interview2DetailProps = {
  variant: 'interview2'
  applicant: GeneralVolunteerApplicantRow
  onWithdrawActivity?: () => void
  onInterviewFail?: () => void
  onInterviewPass?: () => void
  onOpenInterviewEvaluation?: () => void
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

export function GeneralVolunteerApplicantDetailView(props: GeneralVolunteerApplicantDetailViewProps) {
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
      <div className="general-volunteer-applicant-detail">
        <div className="general-volunteer-applicant-detail__header">
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

        <div className="general-volunteer-applicant-detail__body applicant-info-section">
          <GeneralVolunteerApplicantBasicInfo
            applicant={applicant}
            maskSensitive={!personalInfoRevealed}
            statusRow="second_interview"
          />
          <GeneralVolunteerApplicantInterviewEvaluationSection applicant={applicant} />
          <GeneralVolunteerApplicantEssaySections applicant={applicant} />
        </div>

        {personalInfoRevealModal}
      </div>
    )
  }

  if (isDocPassedProps(props)) {
    const { onAssignInterview, onWithdrawActivity } = props

    return (
      <div className="general-volunteer-applicant-detail">
        <div className="general-volunteer-applicant-detail__header">
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
  } = props

  const isDocumentPassed = applicant.documentScreeningStatus === 'pass'
  const isDocumentFailed = applicant.documentScreeningStatus === 'fail'

  return (
    <div className="general-volunteer-applicant-detail">
      <div className="general-volunteer-applicant-detail__header">
        <div className="program-detail-fullpage-modal__header-actions">
          {isDocumentPassed ? (
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
          {isDocumentFailed ? (
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
          {!isDocumentPassed && !isDocumentFailed ? (
            <>
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
        />
        <GeneralVolunteerApplicantInterviewAvailability applicant={applicant} />
        <GeneralVolunteerApplicantEssaySections applicant={applicant} />
      </div>

      {personalInfoRevealModal}
    </div>
  )
}
