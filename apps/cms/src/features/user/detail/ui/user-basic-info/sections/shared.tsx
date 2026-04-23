import { Space } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AddressSearch, CmsButton, CmsInput } from '@/shared/ui'
import type { User } from '@/types/user'
import type { UserBasicInfoExternalId1365 } from './types'
import { detailEmailDisplay, detailPhoneDisplay } from '../display'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'

const ID1365_NOT_REGISTERED_LABEL = '등록되지 않음'

function resolve1365DisplayText(
  personalInfoRevealed: boolean,
  externalId1365?: UserBasicInfoExternalId1365 | null
): string {
  if (!externalId1365) return ID1365_NOT_REGISTERED_LABEL
  if (personalInfoRevealed) {
    const full = externalId1365.fullLabel?.trim()
    if (full) return full
    return ID1365_NOT_REGISTERED_LABEL
  }
  const masked = externalId1365.maskedLabel?.trim()
  if (!masked || masked === '-') return ID1365_NOT_REGISTERED_LABEL
  return masked
}

export function Id1365View({
  personalInfoRevealed,
  externalId1365,
}: {
  personalInfoRevealed: boolean
  externalId1365?: UserBasicInfoExternalId1365 | null
}) {
  const label1365 = resolve1365DisplayText(personalInfoRevealed, externalId1365)

  return (
    <span className="user-basic-info-section__id1365-cell">
      <span>{label1365}</span>
      <DetailInfoForm.InputsSeparator />
      {externalId1365?.onOpen ? (
        <CmsButton size="medium" onClick={externalId1365.onOpen}>
          1365 바로가기
        </CmsButton>
      ) : null}
    </span>
  )
}

export function AddressSearchDetailInputs({
  searchValue,
  onSearchChange,
  detailValue,
  onDetailChange,
  searchWidth,
  detailWidth,
  detailAriaLabel,
}: {
  searchValue: string
  onSearchChange: (next: string) => void
  detailValue: string
  onDetailChange: (next: string) => void
  searchWidth: string | number
  detailWidth: string | number
  detailAriaLabel: string
}) {
  return (
    <>
      <AddressSearch
        value={searchValue}
        onChange={onSearchChange}
        placeholder="건물명, 도로명 또는 지번"
        inputSize="medium"
        width={searchWidth}
      />
      <DetailInfoForm.InputsSeparator />
      <CmsInput
        placeholder="상세 주소"
        value={detailValue}
        onChange={e => onDetailChange(e.target.value)}
        inputSize="medium"
        width={detailWidth}
        aria-label={detailAriaLabel}
      />
    </>
  )
}

export function ContactInfoFieldsRow({
  user,
  personalInfoRevealed,
  readOnlyDisplay,
  phoneValue,
  emailValue,
  onPhoneChange,
  onEmailChange,
  phonePlaceholder,
  emailPlaceholder,
}: {
  user: Omit<User, 'password'>
  personalInfoRevealed: boolean
  readOnlyDisplay?: boolean
  phoneValue: string
  emailValue: string
  onPhoneChange: (next: string) => void
  onEmailChange: (next: string) => void
  phonePlaceholder?: string
  emailPlaceholder?: string
}) {
  return (
    <EditableRow type="double">
      <EditableField
        label="연락처"
        readOnlyDisplay={readOnlyDisplay}
        view={<span>{detailPhoneDisplay(user, personalInfoRevealed)}</span>}
        edit={
          <CmsInput
            value={phoneValue}
            onChange={e => onPhoneChange(e.target.value)}
            inputSize="medium"
            width="100%"
            placeholder={phonePlaceholder}
          />
        }
      />
      <EditableField
        label="이메일"
        readOnlyDisplay={readOnlyDisplay}
        view={<span>{detailEmailDisplay(user, personalInfoRevealed)}</span>}
        edit={
          <CmsInput
            value={emailValue}
            onChange={e => onEmailChange(e.target.value)}
            inputSize="medium"
            width="100%"
            placeholder={emailPlaceholder}
          />
        }
      />
    </EditableRow>
  )
}

export function FullWidthAddressEdit({
  searchValue,
  onSearchChange,
  detailValue,
  onDetailChange,
  detailAriaLabel,
}: {
  searchValue: string
  onSearchChange: (next: string) => void
  detailValue: string
  onDetailChange: (next: string) => void
  detailAriaLabel: string
}) {
  return (
    <Space.Compact style={{ width: '100%' }}>
      <AddressSearchDetailInputs
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        detailValue={detailValue}
        onDetailChange={onDetailChange}
        searchWidth="100%"
        detailWidth="100%"
        detailAriaLabel={detailAriaLabel}
      />
    </Space.Compact>
  )
}
