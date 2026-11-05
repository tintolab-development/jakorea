/**
 * 모달 스펙 표 TD 안 가로 라디오 그룹 — 항목 2개 이상, 항목 간격 16px
 */

import type { ReactNode } from 'react'
import type { RadioChangeEvent } from 'antd'
import { CmsRadio, type CmsRadioSize } from '@/shared/ui/cms-radio'

export interface ModalSpecTableRadioOption<T extends string = string> {
  value: T
  label: ReactNode
}

export interface ModalSpecTableRadioCellProps<T extends string = string> {
  value: T | undefined
  onChange: (value: T) => void
  options: ModalSpecTableRadioOption<T>[]
  'aria-label'?: string
  className?: string
  /** 미지정 시 기존과 같이 CmsRadio 기본(large) */
  size?: CmsRadioSize
  disabled?: boolean
}

export function ModalSpecTableRadioCell<T extends string = string>({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
  className,
  size,
  disabled,
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
      size={size}
      disabled={disabled}
    >
      {options.map(opt => (
        <CmsRadio key={String(opt.value)} value={opt.value}>
          {opt.label}
        </CmsRadio>
      ))}
    </CmsRadio.Group>
  )
}
