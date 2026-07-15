import { EditableStatusBadge } from '@/shared/components/editable-status-badge'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import { RoleBadge } from '@/shared/ui/role-badge'
import { DsDemo, DsSection } from './section'

export function StatusExtendedSection() {
  return (
    <DsSection
      id="status-extended"
      title="Status (extended)"
      description="역할·편집 가능 배지·교재·일정변경 이력 등 추가 상태 패턴입니다. 도메인 배지 전수는 다루지 않습니다."
    >
      <p className="ds-note">
        <code>EditableStatusBadge</code>는 톤·라벨만 표시합니다. 드롭다운 변경은{' '}
        <code>StatusDropdownCell</code>과 조합합니다.
      </p>

      <DsDemo label="RoleBadge">
        <div className="ds-demo__row">
          <RoleBadge role="ADMIN" />
          <RoleBadge role="INSTRUCTOR" />
          <RoleBadge role="INDIVIDUAL" />
          <RoleBadge role="SCHOOL" />
        </div>
      </DsDemo>

      <DsDemo label="EditableStatusBadge">
        <div className="ds-demo__row">
          <EditableStatusBadge label="재직" tone="green" />
          <EditableStatusBadge label="휴직" tone="gray" />
          <EditableStatusBadge label="승인" tone="blue" />
          <EditableStatusBadge label="반려" tone="red" />
          <EditableStatusBadge label="진행" tone="greenOverlay" />
        </div>
      </DsDemo>

      <DsDemo label="TextbookStatusBadge">
        <div className="ds-demo__row">
          <TextbookStatusBadge status="preparing" />
          <TextbookStatusBadge status="shipping" />
          <TextbookStatusBadge status="delivered" />
          <TextbookStatusBadge status="not_applicable" />
        </div>
      </DsDemo>

      <DsDemo label="ScheduleChangeHistoryBadge">
        <div className="ds-demo__row">
          <ScheduleChangeHistoryBadge count={0} />
          <ScheduleChangeHistoryBadge count={1} />
          <ScheduleChangeHistoryBadge count={3} />
        </div>
      </DsDemo>
    </DsSection>
  )
}
