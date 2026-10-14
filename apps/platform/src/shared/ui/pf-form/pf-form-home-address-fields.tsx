import { useState } from 'react'
import { AddressSearchModal } from '@/features/auth'
import { PFTextInput } from '../pf-text-input'
import { PFFormInlineSeparatedFields } from './pf-form-inline'
import styles from './pf-form.module.css'

export type PFFormHomeAddressFieldsProps = {
  roadValue: string
  detailValue: string
  onRoadChange: (value: string) => void
  onDetailChange: (value: string) => void
  roadPlaceholder?: string
  detailPlaceholder?: string
  /** 도로명·상세 모두 비활성. `roadDisabled` / `detailDisabled`보다 우선하지 않음 — 둘 다 true와 동일 */
  disabled?: boolean
  /** 도로명(검색)만 비활성. 미지정 시 `disabled` */
  roadDisabled?: boolean
  /** 상세 주소만 비활성. 미지정 시 `disabled` */
  detailDisabled?: boolean
  /** true면 도로명·상세 인풋이 한 행을 50%씩 채움 */
  fillRow?: boolean
}

/** Platform 양식 — 자택 주소 (도로명 검색 아이콘 + 상세. 모바일은 inlineRow가 세로 스택) */
export function PFFormHomeAddressFields({
  roadValue,
  detailValue,
  onRoadChange,
  onDetailChange,
  roadPlaceholder = '건물명, 도로명 또는 지번',
  detailPlaceholder = '상세 주소',
  disabled = false,
  roadDisabled,
  detailDisabled,
  fillRow = false,
}: PFFormHomeAddressFieldsProps) {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const isRoadDisabled = roadDisabled ?? disabled
  const isDetailDisabled = detailDisabled ?? disabled

  const openAddressModal = () => {
    if (isRoadDisabled) return
    setIsAddressModalOpen(true)
  }

  return (
    <>
      <PFFormInlineSeparatedFields className={fillRow ? styles.inlineRowFill : undefined}>
        <PFTextInput
          variant="formPage"
          size="large"
          hasIcon
          readOnly
          placeholder={roadPlaceholder}
          disabled={isRoadDisabled}
          value={roadValue}
          onClick={openAddressModal}
        />
        <PFTextInput
          variant="formPage"
          size="large"
          placeholder={detailPlaceholder}
          disabled={isDetailDisabled}
          value={detailValue}
          onValueChange={onDetailChange}
        />
      </PFFormInlineSeparatedFields>

      <AddressSearchModal
        open={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelect={selection => {
          onRoadChange(selection.address)
          setIsAddressModalOpen(false)
        }}
      />
    </>
  )
}
