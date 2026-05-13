import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './paragraph-chip.css'

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export type ParagraphChipSize = 'default' | 'compact'

export type ParagraphChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  children: ReactNode
  selected?: boolean
  size?: ParagraphChipSize
}

/** 단락 공통 선택 Chip — 단일항목 사용자 정보 유형의 chip UI 기준 */
export function ParagraphChip({
  children,
  selected = false,
  size = 'default',
  className,
  disabled,
  ...buttonProps
}: ParagraphChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'paragraph-chip',
        `paragraph-chip--${size}`,
        selected && 'paragraph-chip--selected',
        !disabled && 'paragraph-chip--interactive',
        className
      )}
      disabled={disabled}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
