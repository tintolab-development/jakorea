/**
 * 모달 스펙 표 TD 안 가로 라디오 그룹 — 항목 2개 이상, 항목 간격 16px
 */

import type { ReactNode } from 'react'
import type { RadioChangeEvent } from 'antd'
import { CmsRadio } from '@/shared/ui/cms-radio'

export interface ModalSpecTableRadioOption<T extends string = string> {
  value: T
  label: ReactNode
}

export interface ModalSpecTableRadioCellProps<T extends string = string> {
  value: T
  onChange: (value: T) => void
  options: ModalSpecTableRadioOption<T>[]
  'aria-label'?: string
  className?: string
}

export function ModalSpecTableRadioCell<T extends string = string>({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
  className,
}: ModalSpecTableRadioCellProps<T>) {
  const handleChange = (e: RadioChangeEvent) => {
    onChange(e.target.value as T)
  }

  return (
    <CmsRadio.Group
      className={['modal-spec-table__radio-cell', className].filter(Boolean).join(' ')}
      value={value}
      onChange={handleChange}
      aria-label={ariaLabel}
    >
      {options.map(opt => (
        <CmsRadio key={String(opt.value)} value={opt.value}>
          {opt.label}
        </CmsRadio>
      ))}
    </CmsRadio.Group>
  )
}
