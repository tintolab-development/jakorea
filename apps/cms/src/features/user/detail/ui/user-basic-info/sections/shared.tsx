import { Space } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AddressSearch, CmsButton, CmsInput, CmsPhoneInput } from '@/shared/ui'
import type { User } from '@/types/user'
import { detail1365Display } from '@/features/user/api/map-external-identifiers'
import { openPortal1365Main } from '@/shared/constants'
import { detailEmailDisplay, detailPhoneDisplay } from '../display'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'

const ID1365_NOT_REGISTERED_LABEL = '-'

/**
 * 1365 ID 조회 — 연락처/이메일과 같이 `personalInfoRevealed` 시에만 원문.
 * 수정 인풋 값은 draft(unmask 후 user.id1365)를 쓴다.
 */
export function Id1365View({
  personalInfoRevealed,
  id1365,
  onOpen = openPortal1365Main,
}: {
  personalInfoRevealed: boolean
  id1365?: string | null
  onOpen?: () => void
}) {
  const label1365 = detail1365Display(id1365, personalInfoRevealed)
  const hasValue = Boolean(id1365?.trim()) && label1365 !== ID1365_NOT_REGISTERED_LABEL

  return (
    <span className="user-basic-info-section__id1365-cell">
      <span>{label1365}</span>
      {hasValue && onOpen ? (
        <CmsButton size="medium" onClick={onOpen}>
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

/** 연락처·이메일 조회 전용 행 — 수정 슬롯이 없는 섹션(강사 등)에서 사용 */
export function ContactInfoViewRow({
  user,
  personalInfoRevealed,
}: {
  user: Omit<User, 'password'>
  personalInfoRevealed: boolean
}) {
  return (
    <EditableRow type="double">
      <EditableField
        label="연락처"
        readOnlyDisplay
        view={<span>{detailPhoneDisplay(user, personalInfoRevealed)}</span>}
      />
      <EditableField
        label="이메일"
        readOnlyDisplay
        view={<span>{detailEmailDisplay(user, personalInfoRevealed)}</span>}
      />
    </EditableRow>
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
          <CmsPhoneInput
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
