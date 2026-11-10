import type { ReactNode } from 'react'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ApprovalStatusText } from '@/shared/components/approval-status-text'
import { SendNotiButton } from '@/features/program/shared/ui/detail-modal/components/send-noti-button'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import { formatGeneralJaVolunteerExperienceLabel } from '@/features/program/general/lib/volunteer-screening-constants'
import { mapVolunteerProgramApprovalStatus } from '@/features/program/general/lib/volunteer-application-detail-visibility'
import { resolveGeneralEffectiveSecondInterviewStatus } from '@/features/program/general/lib/general-volunteer-interview2-display'
import { IndividualApplicantId1365Cell } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/individual-screening-sections'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import {
  GeneralDocumentScreeningStatusText,
  GeneralInterviewAssignmentStatusText,
  GeneralSecondInterviewStatusText,
} from './status-text'

export type GeneralVolunteerApplicantBasicInfoStatusRow =
  | 'document_screening'
  | 'program_approval'
  | 'interview_assignment'
  | 'second_interview'
  | 'none'

function formatBirthDateAndAge(birthDate: string, age: number): string {
  const formatted = birthDate.replace(/\./g, '. ')
  return `${formatted} (만 ${age}세)`
}

export interface GeneralVolunteerApplicantBasicInfoProps {
  applicant: GeneralVolunteerApplicantRow
  maskSensitive: boolean
  statusRow?: GeneralVolunteerApplicantBasicInfoStatusRow
  onResendDocumentNotificationClick?: () => void
}

function resolveStatusField(
  applicant: GeneralVolunteerApplicantRow,
  statusRow: GeneralVolunteerApplicantBasicInfoStatusRow,
  onResendDocumentNotificationClick?: () => void
): { label: string; value: ReactNode } {
  if (statusRow === 'second_interview') {
    const effectiveStatus = resolveGeneralEffectiveSecondInterviewStatus(applicant)
    return {
      label: '2차 면접 심사 현황',
      value:
        effectiveStatus === 'withdrawn' ? (
          <GeneralInterviewAssignmentStatusText status="withdrawn" />
        ) : (
          <GeneralSecondInterviewStatusText status={effectiveStatus} />
        ),
    }
  }

  if (statusRow === 'interview_assignment') {
    return {
      label: '면접일 배정 현황',
      value: (
        <div className="applicant-institution-basic-info__approval-status-row">
          <GeneralInterviewAssignmentStatusText status={applicant.interviewAssignmentStatus} />
          {onResendDocumentNotificationClick ? (
            <>
              <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
              <SendNotiButton mode="resend" onClick={onResendDocumentNotificationClick} />
            </>
          ) : null}
        </div>
      ),
    }
  }

  if (statusRow === 'program_approval') {
    return {
      label: '프로그램 승인 현황',
      value: (
        <ApprovalStatusText status={mapVolunteerProgramApprovalStatus(applicant)} />
      ),
    }
  }

  // 시안 03-3(9781:50571) — 서류 불합격이면 `사유 : …`
  const rejectionReason =
    applicant.documentScreeningStatus === 'fail' ? applicant.documentRejectionReason?.trim() : ''
  return {
    label: '1차 서류 심사 현황',
    value: (
      <div className="applicant-institution-basic-info__approval-status-row">
        <GeneralDocumentScreeningStatusText status={applicant.documentScreeningStatus} />
        {rejectionReason ? (
          <>
            <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
            <span>사유 : {rejectionReason}</span>
          </>
        ) : null}
        {onResendDocumentNotificationClick ? (
          <>
            <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
            <SendNotiButton mode="resend" onClick={onResendDocumentNotificationClick} />
          </>
        ) : null}
      </div>
    ),
  }
}

export function GeneralVolunteerApplicantBasicInfo({
  applicant,
  maskSensitive,
  statusRow = 'document_screening',
  onResendDocumentNotificationClick,
}: GeneralVolunteerApplicantBasicInfoProps) {
  const contactDisplay = maskSensitive ? applicant.contact : applicant.contactRaw
  const emailDisplay = maskSensitive ? applicant.email : applicant.emailRaw
  const genderBirthDisplay = withProgramDetailTdDivider([
    applicant.gender,
    formatBirthDateAndAge(applicant.birthDate, applicant.age),
  ])

  const nameCell =
    applicant.scheduleChangeCancelCount > 0 ? (
      <>
        {applicant.name}
        <ScheduleChangeHistoryBadge
          count={applicant.scheduleChangeCancelCount}
          className="applicant-instructor-basic-info__name-badge"
        />
      </>
    ) : (
      applicant.name
    )

  const statusField =
    statusRow === 'none'
      ? null
      : resolveStatusField(applicant, statusRow, onResendDocumentNotificationClick)

  return (
    <section className="general-volunteer-applicant-basic-info">
      {statusField != null ? (
        <DetailInfoForm title="기본 정보" mode="view">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label={statusField.label}
              fullRow
              readOnlyDisplay
              view={statusField.value}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      ) : null}
      <DetailInfoForm title="기본 정보" hideHeader={statusField != null} mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="성명" readOnlyDisplay view={nameCell} />
          <DetailInfoForm.Field
            label="성별 및 생년월일"
            readOnlyDisplay
            view={<ProgramDetailTdSegmentWrap>{genderBirthDisplay}</ProgramDetailTdSegmentWrap>}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="연락처" readOnlyDisplay view={contactDisplay} />
          <DetailInfoForm.Field label="이메일" readOnlyDisplay view={emailDisplay} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="1365 ID"
            readOnlyDisplay
            view={<IndividualApplicantId1365Cell id1365={applicant.id1365?.trim() ?? ''} />}
          />
          <DetailInfoForm.Field
            label="JA 봉사 진행 경험"
            readOnlyDisplay
            view={formatGeneralJaVolunteerExperienceLabel(applicant.hasJaVolunteerExperience)}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
