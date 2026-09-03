import { useState } from 'react'
import { AddressSearchModal } from '@/features/auth'
import { PFTextInput } from '../pf-text-input'
import { PFFormInlineRow, PFFormInlineSegment, PFFormInlineSeparator } from './pf-form-inline'
import styles from './pf-form.module.css'

export type PFFormHomeAddressFieldsProps = {
  roadValue: string
  detailValue: string
  onRoadChange: (value: string) => void
  onDetailChange: (value: string) => void
  roadPlaceholder?: string
  detailPlaceholder?: string
  disabled?: boolean
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
  fillRow = false,
}: PFFormHomeAddressFieldsProps) {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  const openAddressModal = () => {
    if (disabled) return
    setIsAddressModalOpen(true)
  }

  return (
    <>
      <PFFormInlineRow className={fillRow ? styles.inlineRowFill : undefined}>
        <PFFormInlineSegment>
          <PFTextInput
            variant="formPage"
            size="large"
            hasIcon
            readOnly
            placeholder={roadPlaceholder}
            disabled={disabled}
            value={roadValue}
            onClick={openAddressModal}
          />
        </PFFormInlineSegment>
        <PFFormInlineSeparator />
        <PFFormInlineSegment>
          <PFTextInput
            variant="formPage"
            size="large"
            placeholder={detailPlaceholder}
            disabled={disabled}
            value={detailValue}
            onValueChange={onDetailChange}
          />
        </PFFormInlineSegment>
      </PFFormInlineRow>

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
