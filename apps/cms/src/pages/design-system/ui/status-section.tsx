import { ProgramLifecycleStatusBadge } from '@/shared/components/program-lifecycle-status-badge'
import { ApprovalStatusBadge } from '@/shared/components/approval-status-badge'
import { RecruitmentStatusBadge } from '@/shared/ui/recruitment-status-badge'
import { StatusBadge } from '@/shared/ui/status-badge'
import { StatusDisplay } from '@/shared/ui/status-display'
import type { ProgramLifecycleStatus } from '@/types/domain'
import { DsDemo, DsSection } from './section'

const GENERIC_STATUS_CONFIG = {
  active: { label: '활성', color: 'green' },
  inactive: { label: '비활성', color: 'default' },
  pending: { label: '대기', color: 'gold' },
}

const LIFECYCLE_SAMPLES: ProgramLifecycleStatus[] = [
  'planned',
  'recruiting_students',
  'education_in_progress',
  'education_completed',
]

export function StatusSection() {
  return (
    <DsSection
      id="status"
      title="Status"
      description="범용 StatusBadge/StatusDisplay와 도메인 배지(결재·모집·프로그램 lifecycle) 패턴입니다. 도메인 배지 전수는 다루지 않습니다."
    >
      <DsDemo label="StatusBadge / StatusDisplay">
        <div className="ds-demo__row">
          <StatusBadge status="active" statusConfig={GENERIC_STATUS_CONFIG} />
          <StatusBadge status="inactive" statusConfig={GENERIC_STATUS_CONFIG} />
          <StatusBadge status="pending" statusConfig={GENERIC_STATUS_CONFIG} />
          <StatusDisplay
            status="active"
            statusLabels={{ active: '현재 활성 상태입니다.' }}
            statusColors={{ active: 'success' }}
          />
        </div>
      </DsDemo>

      <DsDemo label="ApprovalStatusBadge">
        <div className="ds-demo__row">
          <ApprovalStatusBadge status="pending" />
          <ApprovalStatusBadge status="approved" />
          <ApprovalStatusBadge status="rejected" />
          <ApprovalStatusBadge status="cancelled" />
        </div>
      </DsDemo>

      <DsDemo label="RecruitmentStatusBadge">
        <div className="ds-demo__row">
          <RecruitmentStatusBadge status="scheduled" />
          <RecruitmentStatusBadge status="recruiting" />
          <RecruitmentStatusBadge status="closed" />
        </div>
      </DsDemo>

      <DsDemo label="ProgramLifecycleStatusBadge (대표 값)">
        <div className="ds-demo__row">
          {LIFECYCLE_SAMPLES.map(status => (
            <ProgramLifecycleStatusBadge key={status} status={status} />
          ))}
        </div>
      </DsDemo>
    </DsSection>
  )
}
