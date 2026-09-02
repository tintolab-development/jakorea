import type { CSSProperties } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'

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
}: {
  inquiryContact: string
  onInquiryContactChange: (next: string) => void
  inquiryTel: string
  onInquiryTelChange: (next: string) => void
  inquiryEmail: string
  onInquiryEmailChange: (next: string) => void
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label="문의처"
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
}: {
  notesNotApplicable: boolean
  onNotesNotApplicableChange: (next: boolean) => void
  notes: string
  onNotesChange: (next: string) => void
  fullRow?: boolean
}) {
  return (
    <DetailInfoForm.Row type={fullRow ? 'single' : 'single'}>
      <DetailInfoForm.Field
        label="비고"
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
              inputSize="medium"
              width="100%"
              style={{ flex: '1 1 0', minWidth: 0 }}
              placeholder="비고란을 작성하세요"
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
}: {
  label: string
  placeholder: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div style={inquiryColumnStyle}>
      <span className="nowrap" style={{ flexShrink: 0 }}>
        {label}
      </span>
      <CmsInput
        inputSize="medium"
        width={240}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
