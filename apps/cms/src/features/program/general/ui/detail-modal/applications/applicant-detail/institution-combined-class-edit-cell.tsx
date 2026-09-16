import { CmsRadio } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { CombinedClassApplicationStatus } from '@/features/program/general/lib/applicant-institution-detail-edit'
import { COMBINED_CLASS_EFFECTIVE_FROM_NEXT_SCHEDULE_NOTICE } from '@/features/program/general/lib/combined-class-copy'
import { ProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import './institution-basic-info.css'

export type InstitutionCombinedClassPartnerOption = {
  value: string
  label: string
}

export interface InstitutionCombinedClassEditCellProps {
  combinedClassApplication: CombinedClassApplicationStatus
  partnerIds: string[]
  onCombinedClassApplicationChange: (next: CombinedClassApplicationStatus) => void
  onPartnerIdsChange: (next: string[]) => void
  sameSchoolGradeOptions: InstitutionCombinedClassPartnerOption[]
  /** 합반 대상 프로그램(단일 회차) — false면 편집 UI 대신 「해당 없음」 */
  isProgramEligible: boolean
  /** 동일 기관 타 학년 신청 없음 → 「신청」 라디오만 disabled */
  isApplyRadioDisabled: boolean
  /** 합반 멤버(비 lead) — 편집 불가 */
  readOnly?: boolean
  /** 진행된 교육이 있을 때 합반 반영 시점 안내 */
  showEffectiveFromNextScheduleNotice?: boolean
  validationError?: string
}

export function InstitutionCombinedClassEditCell({
  combinedClassApplication,
  partnerIds,
  onCombinedClassApplicationChange,
  onPartnerIdsChange,
  sameSchoolGradeOptions,
  isProgramEligible,
  isApplyRadioDisabled,
  readOnly = false,
  showEffectiveFromNextScheduleNotice = false,
  validationError,
}: InstitutionCombinedClassEditCellProps) {
  if (!isProgramEligible) {
    return <span className="institution-basic-info__combined-class-unavailable">해당 없음</span>
  }

  if (readOnly) {
    return (
      <span className="institution-basic-info__combined-class-readonly">
        {combinedClassApplication === '신청'
          ? `신청${partnerIds.length > 0 ? ' (lead 기관에서 관리)' : ''}`
          : '미신청'}
      </span>
    )
  }

  const isApplied = combinedClassApplication === '신청'
  const isSelectEnabled = isApplied && sameSchoolGradeOptions.length > 0
  const selectedPartnerId = partnerIds[0]

  return (
    <div className="institution-basic-info__combined-class-edit">
      <div className="institution-basic-info__combined-class-edit-row">
        <CmsRadio.Group
          className="institution-basic-info__combined-class-radios"
          size="large"
          value={combinedClassApplication}
          onChange={event => {
            const next = event.target.value as CombinedClassApplicationStatus
            onCombinedClassApplicationChange(next)
            if (next !== '신청') {
              onPartnerIdsChange([])
            }
          }}
        >
          <CmsRadio value="신청" size="large" disabled={isApplyRadioDisabled}>
            신청
          </CmsRadio>
          <CmsRadio value="미신청" size="large">
            미신청
          </CmsRadio>
        </CmsRadio.Group>
        <ProgramDetailTdDivider />
        <CmsSelect
          className="institution-basic-info__combined-class-select"
          inputSize="large"
          width={120}
          disabled={!isSelectEnabled}
          placeholder="해당 없음"
          value={isSelectEnabled ? selectedPartnerId : undefined}
          options={sameSchoolGradeOptions.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            if (value == null || value === '') {
              onPartnerIdsChange([])
              return
            }
            onPartnerIdsChange([String(value)])
          }}
        />
      </div>
      {showEffectiveFromNextScheduleNotice ? (
        <p className="institution-basic-info__combined-class-notice">
          {COMBINED_CLASS_EFFECTIVE_FROM_NEXT_SCHEDULE_NOTICE}
        </p>
      ) : null}
      {validationError ? (
        <span className="institution-basic-info__field-error">{validationError}</span>
      ) : null}
    </div>
  )
}
