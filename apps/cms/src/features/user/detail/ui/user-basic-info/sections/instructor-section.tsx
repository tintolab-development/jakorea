/**
 * 강사 기본 정보 — **조회 전용** 섹션.
 * 수정 화면은 등록 폼을 재사용하는 `InstructorDetailEditForm`이 SSOT이므로
 * 이 파일에 `edit` 슬롯을 추가하지 않는다.
 */

import type { ReactNode } from 'react'
import { DetailInfoFormTdDivider } from '@/shared/components/detail-info-form'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { isInstructorDualProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import {
  parseSchoolTeacherEmploymentStatus,
  SchoolTeacherEmploymentStatusDropdown,
} from '@/features/user/detail/lib/school-teacher-employment-status'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import {
  detailAddressView,
  genderBirthView,
  instructorApplicationTypeLine,
  instructorBankView,
  instructorCareerYearsLine,
  instructorFeeGradeLine,
  oneLineIntroLine,
  resolveInstructorAffiliationParts,
  socialView,
} from '../display'
import { InstructorJaEvaluationGradeField } from '../instructor-ja-grade-field'
import {
  PermissionApprovalStatusWithResend,
  settlementStatusView,
} from '../status'
import type { BasicInfoSectionContext } from './types'
import { ContactInfoViewRow } from './shared'
import { formatDate } from '@/shared/utils'

function instructorBusinessIncomeView(user: BasicInfoSectionContext['user']) {
  const businessIncome =
    user.instructorInfo?.isBusinessIncome === true
      ? '해당'
      : user.instructorInfo?.isBusinessIncome === false
        ? '해당 없음'
        : '-'
  return <span>{businessIncome}</span>
}

/**
 * 소속 — 여러 개면 콤마로 나열.
 * 교사 겸직(instructor_dual)이면 소속 기관명 옆에 재직 현황 태그(변경 가능).
 * 예: `진월초등학교 | [재직중], 제미나이 강사단`
 */
function InstructorAffiliationView({ user }: { user: BasicInfoSectionContext['user'] }) {
  const { schoolName, others } = resolveInstructorAffiliationParts(user)
  const employmentLabel = user.listMetrics?.employmentStatusLabel
  const showEmployment =
    Boolean(schoolName) &&
    isInstructorDualProfile(user) &&
    parseSchoolTeacherEmploymentStatus(employmentLabel) != null

  if (!schoolName && others.length === 0) {
    return <span>-</span>
  }

  const schoolNode =
    schoolName && showEmployment ? (
      <span className="user-basic-info-section__inline-segments">
        <span>{schoolName}</span>
        <DetailInfoFormTdDivider />
        <SchoolTeacherEmploymentStatusDropdown
          userId={user.id}
          employmentStatusLabel={employmentLabel}
          emptyFallback={null}
        />
      </span>
    ) : schoolName ? (
      <span>{schoolName}</span>
    ) : null

  const segments: ReactNode[] = []
  if (schoolNode) segments.push(schoolNode)
  for (const other of others) {
    segments.push(<span key={other}>{other}</span>)
  }

  if (segments.length === 1) return <>{segments[0]}</>

  return (
    <span className="user-basic-info-section__affiliation-multi">
      {segments.map((seg, i) => (
        <span key={i} className="user-basic-info-section__affiliation-multi-item">
          {i > 0 ? <span className="user-basic-info-section__affiliation-multi-sep">, </span> : null}
          {seg}
        </span>
      ))}
    </span>
  )
}

export function InstructorMetaSection(ctx: BasicInfoSectionContext) {
  const {
    user,
    onPermissionResendNotification,
    viewContext,
  } = ctx
  const isInstructorPermissionDetail =
    viewContext.permissionView && viewContext.permissionRole === 'instructor'

  return (
    <>
      <EditableRow type="double">
        {isInstructorPermissionDetail ? (
          <EditableField
            label="권한 승인 현황"
            readOnlyDisplay
            view={
              <PermissionApprovalStatusWithResend
                user={user}
                onPermissionResendNotification={onPermissionResendNotification}
                notifyPermissionRole="instructor"
              />
            }
          />
        ) : (
          <EditableField label="정산 현황" readOnlyDisplay view={settlementStatusView(user)} />
        )}
        <EditableField
          label="JA 평가 등급"
          readOnlyDisplay
          view={
            <InstructorJaEvaluationGradeField
              user={user}
              wrapClassName="user-basic-info-section__permission-approval-dropdown-wrap"
              onOpenJaGradeEvaluation={ctx.onOpenJaGradeEvaluation}
            />
          }
        />
      </EditableRow>
      <EditableRow type="double">
        <EditableField label="가입일" readOnlyDisplay view={<span>{formatDate(user.createdAt)}</span>} />
        <EditableField label="연동된 소셜 계정" readOnlyDisplay view={<span>{socialView(user)}</span>} />
      </EditableRow>
    </>
  )
}

export function InstructorSection(ctx: BasicInfoSectionContext) {
  const { user, scheduleChangeCount, personalInfoRevealed, viewContext } = ctx
  const isInstructorPermissionDetail =
    viewContext.permissionView && viewContext.permissionRole === 'instructor'
  const nameWithBadge = (nameNode: ReactNode) => (
    <span className="user-basic-info-section__name-with-badge">
      {nameNode}
      {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
        <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
      ) : null}
    </span>
  )

  return (
    <>
      <EditableRow type="double">
        <EditableField label="성명" readOnlyDisplay view={nameWithBadge(user.name)} />
        <EditableField label="성별 및 생년월일" readOnlyDisplay view={genderBirthView(user)} />
      </EditableRow>

      <ContactInfoViewRow user={user} personalInfoRevealed={personalInfoRevealed} />

      <EditableRow type="double">
        <EditableField
          label="소속"
          readOnlyDisplay
          view={<InstructorAffiliationView user={user} />}
        />
        <EditableField
          label="강사 경력"
          readOnlyDisplay
          view={<span>{instructorCareerYearsLine(user)}</span>}
        />
      </EditableRow>

      <EditableRow type="double">
        <EditableField
          label="자택 주소지"
          readOnlyDisplay
          view={<span>{detailAddressView(user, personalInfoRevealed)}</span>}
        />
        <EditableField
          label="정산 계좌 정보"
          readOnlyDisplay
          view={<span>{instructorBankView(user, personalInfoRevealed)}</span>}
        />
      </EditableRow>

      <EditableRow type="double">
        {!isInstructorPermissionDetail ? (
          <EditableField
            label="강사비 등급"
            readOnlyDisplay
            view={<span>{instructorFeeGradeLine(user)}</span>}
          />
        ) : (
          <EditableField
            label="신청 유형"
            readOnlyDisplay
            view={<span>{instructorApplicationTypeLine(user)}</span>}
          />
        )}
        <EditableField
          label="사업소득자 여부"
          readOnlyDisplay
          view={instructorBusinessIncomeView(user)}
        />
      </EditableRow>

      <EditableRow type="single">
        <EditableField
          label="한 줄 소개"
          readOnlyDisplay
          view={<span>{oneLineIntroLine(user)}</span>}
        />
      </EditableRow>
    </>
  )
}
