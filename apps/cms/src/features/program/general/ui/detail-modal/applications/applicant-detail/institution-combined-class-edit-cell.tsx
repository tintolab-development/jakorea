import { CmsRadio } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { CombinedClassApplicationStatus } from '@/features/program/general/lib/applicant-institution-detail-edit'
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
  /** 단일 회차 프로그램 여부 — false면 편집 UI 대신 「해당 없음」 */
  isProgramEligible: boolean
  /** 동일 기관 타 학년 신청 없음 → 「신청」 라디오만 disabled */
  isApplyRadioDisabled: boolean
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
  validationError,
}: InstitutionCombinedClassEditCellProps) {
  if (!isProgramEligible) {
    return <span className="institution-basic-info__combined-class-unavailable">해당 없음</span>
  }

  const isApplied = combinedClassApplication === '신청'

  return (
    <div className="institution-basic-info__combined-class-edit">
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
        <CmsRadio value="미신청" size="large">
          미신청
        </CmsRadio>
        <CmsRadio value="신청" size="large" disabled={isApplyRadioDisabled}>
          신청
        </CmsRadio>
      </CmsRadio.Group>
      {isApplied ? (
        <CmsSelect
          className="institution-basic-info__combined-class-select"
          inputSize="large"
          mode="multiple"
          placeholder="합반 대상 학년 선택"
          value={partnerIds}
          options={sameSchoolGradeOptions.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            onPartnerIdsChange(Array.isArray(value) ? value.map(String) : [])
          }}
        />
      ) : null}
      {validationError ? (
        <span className="institution-basic-info__field-error">{validationError}</span>
      ) : null}
    </div>
  )
}
