/**
 * Design System — 상태 태그 (core)
 * 스크린샷 「상태 태그」상단·승인/모집 축. 기존 공용 컴포넌트만 나열.
 */

import { SchoolTeacherEmploymentStatusBadge } from '@/features/user/detail/lib/school-teacher-employment-status'
import { INSTRUCTOR_ROLE_LABELS, type InstructorRoleKey } from '@/features/program/general/model/school-detail-types'
import { ManagerEvaluationBadge } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/shared/manager-evaluation-badge'
import { UJAT_MANAGER_EVALUATION_ORDER } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { ApprovalStatusBadge } from '@/shared/components/approval-status-badge'
import { ApprovalStatusText } from '@/shared/components/approval-status-text'
import { AppStatusBadge } from '@/shared/components/app-status-badge'
import { CalendarApprovalStatusBadge } from '@/shared/components/calendar/ui/item-list/calendar-approval-status-badge'
import { InstitutionApplicationStatusBadge } from '@/shared/components/calendar/ui/item-list/institution-application-status-badge'
import { DeliveryStatusBadge, type TextbookDeliveryStatus } from '@/shared/components/delivery-status-badge'
import { EditableStatusBadge } from '@/shared/components/editable-status-badge'
import { ProgramCategoryBadge } from '@/shared/components/program-category-badge'
import { ProgramLifecycleStatusTableCell } from '@/shared/components/program-lifecycle-status-table-cell'
import { ProgramLifecycleStatusBadge } from '@/shared/components/program-lifecycle-status-badge'
import { ProgramLifecycleStatusText } from '@/shared/components/program-lifecycle-status-text'
import { ProgramListOverviewProgressCell } from '@/shared/components/program-list-overview-progress-cell'
import { SessionFormatBadge } from '@/shared/components/session-format-badge'
import { getInstructorRoleBadgeTone } from '@/shared/constants/editable-status-badge-tones'
import { RecruitmentStatusBadge } from '@/shared/ui/recruitment-status-badge'
import type { ProgramLifecycleStatus } from '@/types/domain'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import { DsDemo, DsSection } from './section'

const EMPLOYMENT_SAMPLES: SchoolTeacherEmploymentStatus[] = [
  'ACTIVE',
  'ON_LEAVE',
  'TRANSFERRED',
  'WITHDRAWN',
]

const INSTRUCTOR_ROLE_SAMPLES: InstructorRoleKey[] = ['lead', 'assistant']

const DELIVERY_SAMPLES: TextbookDeliveryStatus[] = [
  'before_shipping',
  'shipping',
  'delivered',
]

const LIFECYCLE_SAMPLES: ProgramLifecycleStatus[] = [
  'planned',
  'recruiting_students',
  'recruiting_instructors',
  'recruiting_volunteers',
  'education_in_progress',
  'education_completed',
]

export function StatusSection() {
  return (
    <DsSection
      id="status"
      title="Status tags"
      description="CMS 상태 태그 — 재직·역할·배송·서류평가·승인·모집·lifecycle. 전용 *StatusBadge / EditableStatusBadge 톤 헬퍼만 사용합니다."
    >
      <p className="ds-note">
        고정 도메인 상태는 전용 <code>*StatusBadge</code>를 쓰고, 편집 가능 셀은{' '}
        <code>EditableStatusBadge</code> + <code>StatusDropdownCell</code>을 조합합니다. 알림
        발송·서류 미제출 등 미공통 라벨은 Status (extended) 안내를 참고하세요.
      </p>

      <DsDemo label="재직 (SchoolTeacherEmploymentStatusBadge)">
        <div className="ds-demo__row">
          {EMPLOYMENT_SAMPLES.map(status => (
            <SchoolTeacherEmploymentStatusBadge key={status} status={status} />
          ))}
        </div>
      </DsDemo>

      <DsDemo label="강사 역할 (EditableStatusBadge + getInstructorRoleBadgeTone)">
        <div className="ds-demo__row">
          {INSTRUCTOR_ROLE_SAMPLES.map(role => (
            <EditableStatusBadge
              key={role}
              label={INSTRUCTOR_ROLE_LABELS[role]}
              tone={getInstructorRoleBadgeTone(role)}
            />
          ))}
        </div>
      </DsDemo>

      <DsDemo label="배송 (DeliveryStatusBadge)">
        <div className="ds-demo__row">
          {DELIVERY_SAMPLES.map(status => (
            <DeliveryStatusBadge key={status} status={status} />
          ))}
        </div>
      </DsDemo>

      <DsDemo label="서류평가 (ManagerEvaluationBadge)">
        <div className="ds-demo__row">
          {UJAT_MANAGER_EVALUATION_ORDER.map(evaluation => (
            <ManagerEvaluationBadge key={evaluation} evaluation={evaluation} />
          ))}
        </div>
      </DsDemo>

      <DsDemo label="승인 (ApprovalStatusBadge)">
        <div className="ds-demo__row">
          <ApprovalStatusBadge status="pending" />
          <ApprovalStatusBadge status="approved" />
          <ApprovalStatusBadge status="rejected" />
          <ApprovalStatusBadge status="cancelled" />
        </div>
      </DsDemo>

      <DsDemo label="승인 표현 비교 — badge / text / calendar">
        <div className="ds-coverage-grid">
          <div>
            <span className="ds-demo__label">Table badge</span>
            <ApprovalStatusBadge status="approved" />
          </div>
          <div>
            <span className="ds-demo__label">Text only</span>
            <ApprovalStatusText status="approved" />
          </div>
          <div>
            <span className="ds-demo__label">Calendar list</span>
            <CalendarApprovalStatusBadge status="approved" />
          </div>
          <div>
            <span className="ds-demo__label">Institution calendar</span>
            <InstitutionApplicationStatusBadge
              statusKey="institution_confirmed"
              label="기관 확인 완료"
            />
          </div>
        </div>
      </DsDemo>

      <DsDemo label="모집 (RecruitmentStatusBadge)">
        <p className="ds-note" style={{ marginTop: 0 }}>
          화면의 「참여자 모집 중」등 접두어는 배지 상태가 아니라 라벨 문자열 조합입니다. 배지
          자체는 scheduled / recruiting / closed 3종입니다.
        </p>
        <div className="ds-demo__row">
          <RecruitmentStatusBadge status="scheduled" />
          <RecruitmentStatusBadge status="recruiting" />
          <RecruitmentStatusBadge status="closed" />
        </div>
      </DsDemo>

      <DsDemo label="프로그램 lifecycle (ProgramLifecycleStatusBadge)">
        <p className="ds-note" style={{ marginTop: 0 }}>
          <code>/programs/general</code> 등 목록 경로에서는 라벨이 「진행 예정 / 중 / 완료」 3단계로
          축약됩니다. 아래는 상세·비목록 경로 기준 도메인 라벨입니다.
        </p>
        <div className="ds-demo__row">
          {LIFECYCLE_SAMPLES.map(status => (
            <ProgramLifecycleStatusBadge key={status} status={status} />
          ))}
        </div>
        <div className="ds-demo__row" style={{ marginTop: 12 }}>
          <ProgramLifecycleStatusBadge status="recruiting_students" variant="table" />
          <span className="ds-note" style={{ margin: 0 }}>
            ↑ <code>variant=&quot;table&quot;</code> — 고정 폭 해제
          </span>
        </div>
      </DsDemo>

      <DsDemo label="프로그램 lifecycle 표현 비교">
        <div className="ds-coverage-grid">
          <div>
            <span className="ds-demo__label">AppStatusBadge base</span>
            <AppStatusBadge label="공통 배지 베이스" />
          </div>
          <div>
            <span className="ds-demo__label">Table cell</span>
            <ProgramLifecycleStatusTableCell status="recruiting_students" />
          </div>
          <div>
            <span className="ds-demo__label">Domain text</span>
            <ProgramLifecycleStatusText status="recruiting_students" />
          </div>
          <div>
            <span className="ds-demo__label">Overview 3-phase text</span>
            <ProgramListOverviewProgressCell status="education_in_progress" />
          </div>
        </div>
      </DsDemo>

      <DsDemo label="프로그램 분류 — SessionFormatBadge / ProgramCategoryBadge">
        <div className="ds-demo__row">
          <SessionFormatBadge isOnline />
          <SessionFormatBadge isOnline={false} />
          <ProgramCategoryBadge category="school" />
          <ProgramCategoryBadge category="individual" />
          <ProgramCategoryBadge category="instructor" />
          <ProgramCategoryBadge category="volunteer" />
        </div>
      </DsDemo>
    </DsSection>
  )
}
