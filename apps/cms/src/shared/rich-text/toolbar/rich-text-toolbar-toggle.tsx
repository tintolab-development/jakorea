import {
  RtAlignLeftIcon,
  RtBoldIcon,
  RtEmojiIcon,
  RtFontFamilyIcon,
  RtHighlightIcon,
  RtHorizontalRuleIcon,
  RtIndentIcon,
  RtItalicIcon,
  RtLineHeightIcon,
  RtListIcon,
  RtPaletteIcon,
  RtStrikeIcon,
  RtSuperscriptIcon,
  RtTableIcon,
  RtUnderlineIcon,
} from '@jakorea/rich-text/icons'
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
        'rt-toolbar-icon-control',
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

export function FontFamilyIcon() {
  return <RtFontFamilyIcon />
}

export function PaletteIcon() {
  return <RtPaletteIcon />
}

export function HighlightIcon() {
  return <RtHighlightIcon />
}

export function LineHeightIcon() {
  return <RtLineHeightIcon />
}

export function SuperscriptIcon() {
  return <RtSuperscriptIcon />
}

export function AlignLeftIcon() {
  return <RtAlignLeftIcon />
}

export function EmojiIcon() {
  return <RtEmojiIcon />
}

export function ListMenuIcon() {
  return <RtListIcon />
}

export function IndentIcon() {
  return <RtIndentIcon />
}

export function HorizontalRuleIcon() {
  return <RtHorizontalRuleIcon />
}

export function TableIcon() {
  return <RtTableIcon />
}

export function BoldIcon() {
  return <RtBoldIcon />
}

export function ItalicIcon() {
  return <RtItalicIcon />
}

export function UnderlineIcon() {
  return <RtUnderlineIcon />
}

export function StrikeIcon() {
  return <RtStrikeIcon />
}
