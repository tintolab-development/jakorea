import { CmsSelect } from '@/shared/ui/cms-select'
import type { ProgramRegistrationIpsCategory } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import {
  PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS,
  PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS,
  PROGRAM_REGISTRATION_IPS_PREPARE_ONLY_OPTIONS,
  PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'

export type ProgramRegistrationIpsTypeValue = {
  category: ProgramRegistrationIpsCategory | ''
  detail: string
}

export type ProgramRegistrationIpsTypeFieldsProps = {
  value: ProgramRegistrationIpsTypeValue
  onChange: (next: ProgramRegistrationIpsTypeValue) => void
  /** true면 1·2차 IPS 셀렉트 모두 비활성 (값은 `value` 그대로 표시) */
  disabled?: boolean
  className?: string
  /** double 행 반쪽 — 2번째 셀렉트를 남는 폭에 맞춤 (커리큘럼 회차별 IPS) */
  layout?: 'default' | 'inline'
}

export function ProgramRegistrationIpsTypeFields({
  value,
  onChange,
  disabled = false,
  className,
  layout = 'default',
}: ProgramRegistrationIpsTypeFieldsProps) {
  const { category, detail } = value

  const handleCategoryChange = (v: unknown) => {
    if (disabled) return
    const nextCategory = String(v ?? '') as ProgramRegistrationIpsCategory | ''
    const nextDetail = nextCategory === 'prepare' ? 'none' : ''
    onChange({ category: nextCategory, detail: nextDetail })
  }

  const handleDetailChange = (v: unknown) => {
    if (disabled) return
    onChange({ ...value, detail: String(v ?? '') })
  }

  let secondaryPlaceholder = 'IPS를 먼저 선택하세요'
  let secondaryOptions: { value: string; label: string }[] = []
  let secondaryDisabled = true

  if (category === 'succeed') {
    secondaryPlaceholder = '프로그램 종류를 선택하세요'
    secondaryOptions = [...PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS]
    secondaryDisabled = false
  } else if (category === 'inspire') {
    secondaryPlaceholder = '프로그램 채널을 선택하세요'
    secondaryOptions = [...PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS]
    secondaryDisabled = false
  } else if (category === 'prepare') {
    secondaryPlaceholder = '해당 없음'
    secondaryOptions = [...PROGRAM_REGISTRATION_IPS_PREPARE_ONLY_OPTIONS]
    secondaryDisabled = true
  }

  const firstSelectPlaceholder = 'IPS 유형'

  const secondaryValue =
    category === '' ? undefined : category === 'prepare' ? 'none' : detail || undefined

  const primaryDisabled = disabled
  const secondarySelectDisabled = disabled || secondaryDisabled
  const isInlineLayout = layout === 'inline'

  const wrapperClassName = [
    'detail-info-form-inputs-wrapper',
    isInlineLayout && 'program-registration-paragraph__schedule-detail-row',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClassName}>
      <CmsSelect
        inputSize="medium"
        withAllOption={false}
        placeholder={firstSelectPlaceholder}
        width={120}
        options={[...PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS]}
        value={category || undefined}
        disabled={primaryDisabled}
        onChange={handleCategoryChange}
      />
      <CmsSelect
        inputSize="medium"
        withAllOption={false}
        placeholder={secondaryPlaceholder}
        width={isInlineLayout ? '100%' : 360}
        options={secondaryOptions}
        value={secondaryValue}
        disabled={secondarySelectDisabled}
        onChange={handleDetailChange}
      />
    </div>
  )
}
