/**
 * Design System — 상태 태그 (extended)
 * 정산·수강·기관 확인·출석·교재·Editable 톤 + My* 잔존 Legacy StatusBadge/Display
 */

import { ProgramAttendanceStatusText } from '@/features/program/shared/ui/program-attendance-status-text'
import '@/features/program/shared/ui/program-attendance-detail.css'
import { SecondInterviewScreeningStatusText } from '@/features/program/shared/ui/volunteer-screening/second-interview-screening-status-text'
import { GeneralInterviewAssignmentStatusText } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/status-text'
import { GeminiInstitutionApprovalStatusBadge } from '@/features/program/gemini/ui/detail/gemini-institution-approval-status-badge'
import { SponsorContactTypeBadge } from '@/features/sponsor/ui/sponsor-contact-type-badge'
import { SponsorSponsorshipStatusBadge } from '@/features/sponsor/ui/sponsor-sponsorship-status-badge'
import { UjatInstitutionApplicationStatusBadge } from '@/features/program/ujat/ui/detail-modal/application-institution/list/status-badge'
import { DocumentScreeningStatusText } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/shared/document-screening-status-text'
import { UjatInstitutionScheduleConfirmStatusBadge } from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-confirm/status-badge'
import {
  UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_ORDER,
  type UjatInstitutionScheduleConfirmStatus,
} from '@/features/program/ujat/ui/detail-modal/application-institution/schedule-confirm/types'
import type { PaymentOrderAdminLineProcessingStatus } from '@/data/mock/payment-order-admin-list'
import { EditableStatusBadge } from '@/shared/components/editable-status-badge'
import { InstructorPaymentStatusBadge } from '@/shared/components/instructor-payment-status-badge'
import { PaymentOrderLineProcessingStatusBadge } from '@/shared/components/payment-order-line-processing-status-badge'
import { ProgramEnrollmentStatusText } from '@/shared/components/program-enrollment-status-text'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_ORDER,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'
import {
  PROGRAM_ENROLLMENT_DISPLAY_STATUS_ORDER,
  type ProgramEnrollmentDisplayStatus,
} from '@/shared/constants/status'
import type { EditableStatusBadgeTone } from '@/shared/constants/editable-status-badge-tones'
import { DsDemo, DsSection } from './section'

const PAYMENT_ORDER_LINE_SAMPLES: PaymentOrderAdminLineProcessingStatus[] = [
  'pending',
  'confirmed',
  'correction',
  'rejected',
  'application_rejected',
]

const ATTENDANCE_SAMPLES: Array<{
  kind: 'present' | 'late' | 'absent' | 'excused_absence' | 'dash'
  label: string
  lateTime?: string
}> = [
  { kind: 'present', label: '출석' },
  { kind: 'absent', label: '결석' },
  { kind: 'late', label: '지각', lateTime: '09:15' },
  { kind: 'excused_absence', label: '사유 불참' },
  { kind: 'dash', label: '-' },
]

const EDITABLE_TONE_SAMPLES: Array<{ label: string; tone: EditableStatusBadgeTone }> = [
  { label: 'blue', tone: 'blue' },
  { label: 'gray', tone: 'gray' },
  { label: 'green', tone: 'green' },
  { label: 'greenOverlay', tone: 'greenOverlay' },
  { label: 'red', tone: 'red' },
]

export function StatusExtendedSection() {
  return (
    <DsSection
      id="status-extended"
      title="Status tags (extended)"
      description="정산·수강·기관 확인·출석·교재·심사·Sponsor 등 활성 도메인 상태 표현입니다."
    >
      <p className="ds-note">
        <strong>선택 가이드</strong> — 고정 도메인 → 전용 <code>*StatusBadge</code> · 편집 가능 셀
        → <code>EditableStatusBadge</code> + <code>StatusDropdownCell</code>. 스크린샷의 알림
        발송(준비중~실패)·서류 미제출/기한 미준수·예비 1~4 전용 배지 등은 아직 공통화되지 않아 DS에서
        제외합니다.
      </p>

      <DsDemo label="지급조서 (InstructorPaymentStatusBadge)">
        <div className="ds-demo__row">
          {INSTRUCTOR_SETTLEMENT_STATUS_ORDER.map((status: InstructorSettlementUiStatus) => (
            <InstructorPaymentStatusBadge key={status} status={status} />
          ))}
        </div>
      </DsDemo>

      <DsDemo label="정산 텍스트 (InstructorSettlementStatusText)">
        <div className="ds-demo__row">
          {INSTRUCTOR_SETTLEMENT_STATUS_ORDER.map((status: InstructorSettlementUiStatus) => (
            <InstructorSettlementStatusText key={status} status={status} />
          ))}
        </div>
      </DsDemo>

      <DsDemo label="지급조서 라인 (PaymentOrderLineProcessingStatusBadge)">
        <div className="ds-demo__row">
          {PAYMENT_ORDER_LINE_SAMPLES.map(status => (
            <PaymentOrderLineProcessingStatusBadge key={status} status={status} />
          ))}
        </div>
      </DsDemo>

      <DsDemo label="수강/진행 (ProgramEnrollmentStatusText)">
        <div className="ds-demo__row">
          {PROGRAM_ENROLLMENT_DISPLAY_STATUS_ORDER.map(
            (status: ProgramEnrollmentDisplayStatus) => (
              <ProgramEnrollmentStatusText key={status} status={status} />
            )
          )}
        </div>
      </DsDemo>

      <DsDemo label="기관 일정 확인 (UjatInstitutionScheduleConfirmStatusBadge)">
        <div className="ds-demo__row">
          {UJAT_INSTITUTION_SCHEDULE_CONFIRM_STATUS_ORDER.map(
            (status: UjatInstitutionScheduleConfirmStatus) => (
              <UjatInstitutionScheduleConfirmStatusBadge key={status} status={status} />
            )
          )}
        </div>
      </DsDemo>

      <DsDemo label="출석 (ProgramAttendanceStatusText)">
        <p className="ds-note" style={{ marginTop: 0 }}>
          배지가 아니라 테이블 셀용 텍스트 강조 패턴입니다.
        </p>
        <div className="ds-demo__row">
          {ATTENDANCE_SAMPLES.map(sample => (
            <ProgramAttendanceStatusText
              key={sample.kind}
              kind={sample.kind}
              label={sample.label}
              lateTime={sample.lateTime}
            />
          ))}
        </div>
      </DsDemo>

      <DsDemo label="교재 (TextbookStatusBadge)">
        <div className="ds-demo__row">
          <TextbookStatusBadge status="preparing" />
          <TextbookStatusBadge status="shipping" />
          <TextbookStatusBadge status="delivered" />
          <TextbookStatusBadge status="not_applicable" />
        </div>
      </DsDemo>

      <DsDemo label="일정변경 (ScheduleChangeHistoryBadge)">
        <div className="ds-demo__row">
          <ScheduleChangeHistoryBadge count={0} />
          <ScheduleChangeHistoryBadge count={1} />
          <ScheduleChangeHistoryBadge count={3} />
        </div>
      </DsDemo>

      <DsDemo label="EditableStatusBadge 톤 팔레트">
        <p className="ds-note" style={{ marginTop: 0 }}>
          현행 CMS 상태 태그 베이스입니다. 드롭다운 변경은 Filters &amp; Tables의{' '}
          <code>StatusDropdownCell</code>과 조합합니다.
        </p>
        <div className="ds-demo__row">
          {EDITABLE_TONE_SAMPLES.map(({ label, tone }) => (
            <EditableStatusBadge key={tone} label={label} tone={tone} />
          ))}
        </div>
      </DsDemo>

      <DsDemo label="서류·면접·배정 상태 텍스트">
        <div className="ds-demo__row">
          <DocumentScreeningStatusText status="pending" />
          <DocumentScreeningStatusText status="pass" />
          <DocumentScreeningStatusText status="fail" />
          <SecondInterviewScreeningStatusText status="waiting" />
          <SecondInterviewScreeningStatusText status="pass" />
          <SecondInterviewScreeningStatusText status="reserve1" />
          <GeneralInterviewAssignmentStatusText status="waiting" />
          <GeneralInterviewAssignmentStatusText status="assigned" />
          <GeneralInterviewAssignmentStatusText status="withdrawn" />
        </div>
      </DsDemo>

      <DsDemo label="UJAT / Gemini 기관 상태">
        <div className="ds-demo__row">
          <UjatInstitutionApplicationStatusBadge status="evaluation_pending" />
          <UjatInstitutionApplicationStatusBadge status="temp_assigned" />
          <UjatInstitutionApplicationStatusBadge status="application_rejected" />
          <GeminiInstitutionApprovalStatusBadge status="PENDING" />
          <GeminiInstitutionApprovalStatusBadge status="APPROVED" />
          <GeminiInstitutionApprovalStatusBadge status="REJECTED" />
        </div>
      </DsDemo>

      <DsDemo label="Sponsor 담당·후원 상태">
        <div className="ds-demo__row">
          <SponsorContactTypeBadge type="lead" />
          <SponsorContactTypeBadge type="assistant" />
          <SponsorSponsorshipStatusBadge status="active" />
          <SponsorSponsorshipStatusBadge status="ended" />
        </div>
      </DsDemo>
    </DsSection>
  )
}
