import {
  RtAlignLeftIcon,
  RtBoldIcon,
  RtChevronDownIcon,
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
import styles from './pf-rich-text-toolbar.module.css'

export function PfToolbarToggle({
  title,
  active,
  disabled,
  onAction,
  children,
}: {
  title: string
  active?: boolean
  disabled?: boolean
  onAction: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={[
        styles.toggle,
        'rt-toolbar-icon-control',
        active ? styles['toggle-active'] : '',
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

export function PfFontFamilyIcon() {
  return <RtFontFamilyIcon />
}

export function PfLineHeightIcon() {
  return <RtLineHeightIcon />
}

export function PfPaletteIcon() {
  return <RtPaletteIcon />
}

export function PfHighlightIcon() {
  return <RtHighlightIcon />
}

export function PfAlignLeftIcon() {
  return <RtAlignLeftIcon />
}

export function PfListIcon() {
  return <RtListIcon />
}

export function PfIndentIcon() {
  return <RtIndentIcon />
}

export function PfHorizontalRuleIcon() {
  return <RtHorizontalRuleIcon />
}

export function PfTableIcon() {
  return <RtTableIcon />
}

export function PfEmojiIcon() {
  return <RtEmojiIcon />
}

export function PfBoldIcon() {
  return <RtBoldIcon />
}

export function PfItalicIcon() {
  return <RtItalicIcon />
}

export function PfUnderlineIcon() {
  return <RtUnderlineIcon />
}

export function PfStrikeIcon() {
  return <RtStrikeIcon />
}

export function PfSuperscriptIcon() {
  return <RtSuperscriptIcon />
}

export function PfChevronDown() {
  return <RtChevronDownIcon className={styles.chevron} />
}
