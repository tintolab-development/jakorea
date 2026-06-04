import {
  AlignLeftOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

export function ToolbarToggle({
  title,
  active,
  disabled,
  onAction,
  children,
  className,
}: {
  title: string
  active?: boolean
  disabled?: boolean
  onAction: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      className={[
        'rich-text-toolbar__toggle',
        active ? 'rich-text-toolbar__toggle--active' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={event => event.preventDefault()}
      onClick={onAction}
    >
      {children}
    </button>
  )
}

export function ToolbarGlyphToggle({
  title,
  glyph,
  active,
  disabled,
  onAction,
  underline,
}: {
  title: string
  glyph: string
  active?: boolean
  disabled?: boolean
  onAction: () => void
  underline?: boolean
}) {
  return (
    <ToolbarToggle title={title} active={active} disabled={disabled} onAction={onAction}>
      <span
        className={[
          'rich-text-toolbar__glyph',
          underline ? 'rich-text-toolbar__glyph--underline' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {glyph}
      </span>
    </ToolbarToggle>
  )
}

export function AlignLeftIcon() {
  return <AlignLeftOutlined className="rich-text-toolbar__icon" />
}

export function BulletListIcon() {
  return <UnorderedListOutlined className="rich-text-toolbar__icon" />
}

export function OrderedListIcon() {
  return <OrderedListOutlined className="rich-text-toolbar__icon" />
}

export function FontFamilyIcon() {
  return <span className="rich-text-toolbar__font-icon" aria-hidden>T</span>
}

export function PaletteIcon() {
  return (
    <svg
      className="rich-text-toolbar__palette-icon"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M9 2.25C5.75 2.25 3 4.88 3 8.06c0 2.17 1.17 4.08 2.94 5.19.45.28.73.76.73 1.28v.22c0 .72.58 1.31 1.3 1.31h.66c.72 0 1.3-.59 1.3-1.31v-.1c0-.5.28-.96.72-1.2C11.72 12.9 13 10.95 13 8.06 13 4.88 10.25 2.25 9 2.25Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="6.5" cy="7.5" r="0.9" fill="currentColor" />
      <circle cx="9" cy="6" r="0.9" fill="currentColor" />
      <circle cx="11.5" cy="7.5" r="0.9" fill="currentColor" />
      <circle cx="10" cy="10" r="0.9" fill="currentColor" />
    </svg>
  )
}
