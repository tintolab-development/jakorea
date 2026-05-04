import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { ProgramRegistrationIpsCategory } from '@/features/template/ui/form-set/program-registration-form/paragraphs/program-registration-ips-options'
import {
  PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS,
  PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS,
  PROGRAM_REGISTRATION_IPS_PREPARE_ONLY_OPTIONS,
  PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS,
} from '@/features/template/ui/form-set/program-registration-form/paragraphs/program-registration-ips-options'

export type ProgramRegistrationIpsTypeValue = {
  category: ProgramRegistrationIpsCategory | ''
  detail: string
}

export type ProgramRegistrationIpsTypeFieldsProps = {
  value: ProgramRegistrationIpsTypeValue
  onChange: (next: ProgramRegistrationIpsTypeValue) => void
}

export function ProgramRegistrationIpsTypeFields({
  value,
  onChange,
}: ProgramRegistrationIpsTypeFieldsProps) {
  const { category, detail } = value

  const handleCategoryChange = (v: unknown) => {
    const nextCategory = String(v ?? '') as ProgramRegistrationIpsCategory | ''
    const nextDetail = nextCategory === 'prepare' ? 'none' : ''
    onChange({ category: nextCategory, detail: nextDetail })
  }

  const handleDetailChange = (v: unknown) => {
    onChange({ ...value, detail: String(v ?? '') })
  }

  let secondaryPlaceholder = 'IPS 유형을 먼저 선택하세요'
  let secondaryOptions: { value: string; label: string }[] = []
  let secondaryDisabled = true

  if (category === 'succeed') {
    secondaryPlaceholder = '프로그램 종류'
    secondaryOptions = [...PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS]
    secondaryDisabled = false
  } else if (category === 'inspire') {
    secondaryPlaceholder = '프로그램 채널'
    secondaryOptions = [...PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS]
    secondaryDisabled = false
  } else if (category === 'prepare') {
    secondaryPlaceholder = '해당 없음'
    secondaryOptions = [...PROGRAM_REGISTRATION_IPS_PREPARE_ONLY_OPTIONS]
    secondaryDisabled = true
  }

  const secondaryValue =
    category === '' ? undefined : category === 'prepare' ? 'none' : detail || undefined

  return (
    <div className="detail-info-form-inputs-wrapper">
      <CmsSelect
        inputSize="medium"
        withAllOption={false}
        placeholder="IPS 유형"
        width={120}
        options={[...PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS]}
        value={category || undefined}
        onChange={handleCategoryChange}
      />
      <DetailInfoForm.InputsSeparator />
      <CmsSelect
        inputSize="medium"
        withAllOption={false}
        placeholder={secondaryPlaceholder}
        width={260}
        options={secondaryOptions}
        value={secondaryValue}
        disabled={secondaryDisabled}
        onChange={handleDetailChange}
      />
    </div>
  )
}
