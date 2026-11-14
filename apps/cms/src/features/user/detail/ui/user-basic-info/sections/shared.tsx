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
        <>
          <DetailInfoForm.TdDivider />
          <CmsButton variant="secondary" size="h32" onClick={onOpen}>
            1365 바로가기
          </CmsButton>
        </>
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
  onAddressSelect,
}: {
  searchValue: string
  onSearchChange: (next: string) => void
  detailValue: string
  onDetailChange: (next: string) => void
  searchWidth: string | number
  detailWidth: string | number
  detailAriaLabel: string
  onAddressSelect?: (item: { zipNo?: string }) => void
}) {
  return (
    <>
      <AddressSearch
        value={searchValue}
        onChange={onSearchChange}
        placeholder="건물명, 도로명 또는 지번"
        inputSize="small"
        width={searchWidth}
        onSelect={onAddressSelect}
      />
      <DetailInfoForm.InputsSeparator />
      <CmsInput
        placeholder="상세 주소"
        value={detailValue}
        onChange={e => onDetailChange(e.target.value)}
        inputSize="small"
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
  required,
  inputWidth = '100%',
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
  /** 수정 모드 연락처·이메일 라벨 필수 `*` */
  required?: boolean
  /** 수정 입력 폭 — 기본 셀 꽉 참(`100%`), 시안 고정 폭이 있으면 px */
  inputWidth?: number | string
}) {
  return (
    <EditableRow type="double">
      <EditableField
        label="연락처"
        required={required}
        readOnlyDisplay={readOnlyDisplay}
        view={<span>{detailPhoneDisplay(user, personalInfoRevealed)}</span>}
        edit={
          <CmsPhoneInput
            value={phoneValue}
            onChange={e => onPhoneChange(e.target.value)}
            inputSize="small"
            width={inputWidth}
            placeholder={phonePlaceholder}
          />
        }
      />
      <EditableField
        label="이메일"
        required={required}
        readOnlyDisplay={readOnlyDisplay}
        view={<span>{detailEmailDisplay(user, personalInfoRevealed)}</span>}
        edit={
          <CmsInput
            value={emailValue}
            onChange={e => onEmailChange(e.target.value)}
            inputSize="small"
            width={inputWidth}
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
  onAddressSelect,
  searchWidth = '100%',
  detailWidth = '100%',
}: {
  searchValue: string
  onSearchChange: (next: string) => void
  detailValue: string
  onDetailChange: (next: string) => void
  detailAriaLabel: string
  onAddressSelect?: (item: { zipNo?: string }) => void
  /** 주소 검색 폭 — 기본 셀 꽉 참, 시안 고정 폭이 있으면 px */
  searchWidth?: number | string
  /** 상세 주소 폭 — 기본 셀 꽉 참, 시안 고정 폭이 있으면 px */
  detailWidth?: number | string
}) {
  const fixedSearchWidth = searchWidth !== '100%'
  return (
    <Space.Compact
      className={fixedSearchWidth ? 'user-basic-info-section__address--fixed' : undefined}
      style={{ width: '100%' }}
    >
      <AddressSearchDetailInputs
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        detailValue={detailValue}
        onDetailChange={onDetailChange}
        searchWidth={searchWidth}
        detailWidth={detailWidth}
        detailAriaLabel={detailAriaLabel}
        onAddressSelect={onAddressSelect}
      />
    </Space.Compact>
  )
}
