/**
 * 모달 본문용 2열 스펙 표 — 라벨 고정폭 + 값 셀(텍스트에어리어·인풋 등)
 */

import type { ReactNode } from 'react'
import './modal-spec-table.css'

export type ModalSpecTableLabelVariant =
  | 'paymentRequirement'
  /** 특강(w-4) 등 — 지급 요건 행 높이 80px */
  | 'paymentRequirementShort'
  | 'remark'
  | 'basis'

const LABEL_VARIANT_CLASS: Record<ModalSpecTableLabelVariant, string> = {
  paymentRequirement: 'modal-spec-table__label--payment-requirement',
  paymentRequirementShort: 'modal-spec-table__label--payment-requirement-short',
  remark: 'modal-spec-table__label--remark',
  basis: 'modal-spec-table__label--basis',
}

export interface ModalSpecTableProps {
  children: ReactNode
  className?: string
  'aria-label'?: string
}

export function ModalSpecTable({ children, className, 'aria-label': ariaLabel }: ModalSpecTableProps) {
  return (
    <div
      className={['modal-spec-table', className].filter(Boolean).join(' ')}
      role="table"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}

export interface ModalSpecTableRowProps {
  label: ReactNode
  labelVariant: ModalSpecTableLabelVariant
  children: ReactNode
  className?: string
}

export function ModalSpecTableRow({ label, labelVariant, children, className }: ModalSpecTableRowProps) {
  return (
    <div className={['modal-spec-table__row', className].filter(Boolean).join(' ')} role="row">
      <div
        className={['modal-spec-table__label', LABEL_VARIANT_CLASS[labelVariant]].join(' ')}
        role="columnheader"
      >
        {label}
      </div>
      <div className="modal-spec-table__cell" role="cell">
        {children}
      </div>
    </div>
  )
}

export { ModalSpecTableRadioCell } from './modal-spec-table-radio-cell'
export type {
  ModalSpecTableRadioCellProps,
  ModalSpecTableRadioOption,
} from './modal-spec-table-radio-cell'
