import type { CSSProperties } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsPhoneInput } from '@/shared/ui/cms-phone-input'
import { useIsGeneralRegistrationWizard } from '@/features/template/context/general-registration-wizard-context'

export const RECRUIT_FORM_MAX_SUFFIX_CLASS = 'detail-info-form-inputs-wrapper-no-gap'

const inquiryColumnStyle: CSSProperties = {
  display: 'flex',
  minWidth: 0,
  alignItems: 'center',
  gap: 8,
}

export function RecruitInquiryContactRow({
  inquiryContact,
  onInquiryContactChange,
  inquiryTel,
  onInquiryTelChange,
  inquiryEmail,
  onInquiryEmailChange,
  required = false,
  validationKeyPrefix = 'recruit.institution',
}: {
  inquiryContact: string
  onInquiryContactChange: (next: string) => void
  inquiryTel: string
  onInquiryTelChange: (next: string) => void
  inquiryEmail: string
  onInquiryEmailChange: (next: string) => void
  required?: boolean
  /** 등록 위저드 미입력 강조 — `recruit.{scope}` 접두 */
  validationKeyPrefix?: string
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label="문의처"
        required={required}
        validationKey={[
          `${validationKeyPrefix}.inquiryContact`,
          `${validationKeyPrefix}.inquiryTel`,
          `${validationKeyPrefix}.inquiryEmail`,
        ]}
        fullRow
        edit={
          <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
            <InquiryContactColumn
              label="문의처"
              placeholder="담당 문의처"
              value={inquiryContact}
              onChange={onInquiryContactChange}
            />
            <DetailInfoForm.InputsSeparator />
            <InquiryContactColumn
              label="Tel"
              placeholder="문의처 전화번호"
              value={inquiryTel}
              onChange={onInquiryTelChange}
              phone
            />
            <DetailInfoForm.InputsSeparator />
            <InquiryContactColumn
              label="E-mail"
              placeholder="문의처 이메일"
              value={inquiryEmail}
              onChange={onInquiryEmailChange}
            />
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

export function RecruitNotesRow({
  notesNotApplicable,
  onNotesNotApplicableChange,
  notes,
  onNotesChange,
  fullRow = false,
  validationKey = 'recruit.institution.notes',
}: {
  notesNotApplicable: boolean
  onNotesNotApplicableChange: (next: boolean) => void
  notes: string
  onNotesChange: (next: string) => void
  fullRow?: boolean
  validationKey?: string
}) {
  // 일반 프로그램 등록 위저드만 시안 문구 — 그 외 화면은 기존 문구
  const notesPlaceholder = useIsGeneralRegistrationWizard()
    ? '비고를 입력해 주세요'
    : '비고란을 작성하세요'
  return (
    <DetailInfoForm.Row type={fullRow ? 'single' : 'single'}>
      <DetailInfoForm.Field
        label="비고"
        validationKey={validationKey}
        fullRow={fullRow}
        edit={
          <div className={RECRUIT_FORM_MAX_SUFFIX_CLASS}>
            <CmsCheckbox
              checkboxSize="medium"
              checked={notesNotApplicable}
              onChange={e => {
                const checked = e.target.checked
                onNotesNotApplicableChange(checked)
                if (checked) onNotesChange('')
              }}
            >
              해당 없음
            </CmsCheckbox>
            <DetailInfoForm.InputsSeparator />
            <CmsInput
              inputSize="small"
              width="100%"
              style={{ flex: '1 1 0', minWidth: 0 }}
              placeholder={notesPlaceholder}
              value={notes}
              disabled={notesNotApplicable}
              onChange={e => onNotesChange(e.target.value)}
            />
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

function InquiryContactColumn({
  label,
  placeholder,
  value,
  onChange,
  phone,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (next: string) => void
  phone?: boolean
}) {
  const InputComponent = phone ? CmsPhoneInput : CmsInput
  return (
    <div style={inquiryColumnStyle}>
      <span className="nowrap" style={{ flexShrink: 0 }}>
        {label}
      </span>
      <InputComponent
        inputSize="small"
        width={240}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
