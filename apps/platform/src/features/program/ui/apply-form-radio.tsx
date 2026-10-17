import { Radio } from 'antd'

export type ApplyFormRadioOption = {
  value: string
  label: string
}

type ApplyFormRadioGroupProps = {
  name: string
  value: string
  options: readonly ApplyFormRadioOption[]
  onChange: (next: string) => void
}

/** 신청 양식 슬롯 라디오 — `MultipleChoiceFill`(form-template-runtime)과 동일 마크업 */
export function ApplyFormRadioGroup({
  name,
  value,
  options,
  onChange,
}: ApplyFormRadioGroupProps) {
  return (
    <Radio.Group
      className="form-template-fill-multiple-choice__radios app-radio-group app-radio-group--large"
      size="large"
      name={name}
      value={value || undefined}
      aria-label={name}
      onChange={event => onChange(String(event.target.value))}
    >
      {options.map(option => (
        <Radio key={option.value} value={option.value}>
          {option.label}
        </Radio>
      ))}
    </Radio.Group>
  )
}
