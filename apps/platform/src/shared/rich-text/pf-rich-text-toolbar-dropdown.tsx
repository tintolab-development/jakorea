import type { EmojiItem } from '@jakorea/rich-text'
import { filterEmojis, getEmojiQuickPickItems } from '@jakorea/rich-text'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { PFTextInput } from '@/shared/ui'
import { PfChevronDown } from './pf-rich-text-toolbar-toggle'
import styles from './pf-rich-text-toolbar.module.css'

type PfToolbarDropdownProps = {
  label: string
  valueLabel?: string
  leadingIcon?: ReactNode
  iconOnly?: boolean
  disabled?: boolean
  ariaLabel: string
  menuItems?: { key: string; label: string; onClick: () => void }[]
  panel?: ReactNode
}

export function PfToolbarDropdown({
  label,
  valueLabel,
  leadingIcon,
  iconOnly,
  disabled,
  ariaLabel,
  menuItems,
  panel,
}: PfToolbarDropdownProps) {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPanelStyle({
      top: rect.bottom + 4,
      left: rect.left,
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const panelNode =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            className={styles['dropdown-panel']}
            style={{
              position: 'fixed',
              top: panelStyle.top,
              left: panelStyle.left,
              zIndex: 1100,
            }}
            role="menu"
            onMouseDown={event => event.preventDefault()}
          >
            {panel ??
              menuItems?.map(item => (
                <button
                  key={item.key}
                  type="button"
                  className={styles['dropdown-item']}
                  role="menuitem"
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => {
                    item.onClick()
                    setOpen(false)
                  }}
                >
                  {item.label}
                </button>
              ))}
          </div>,
          document.body
        )
      : null

  return (
    <div ref={rootRef} className={styles.dropdown}>
      <button
        ref={triggerRef}
        type="button"
        className={[
          styles.trigger,
          'rt-toolbar-trigger',
          iconOnly ? `${styles['trigger-icon-only']} rt-toolbar-icon-control` : styles['trigger-labeled'],
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onMouseDown={event => event.preventDefault()}
        onClick={() => setOpen(prev => !prev)}
      >
        {leadingIcon ? (
          <span className={styles['trigger-leading']} aria-hidden>
            {leadingIcon}
          </span>
        ) : null}
        {!iconOnly ? (
          <span className={styles['trigger-label']}>{valueLabel ?? label}</span>
        ) : null}
        <PfChevronDown />
      </button>
      {panelNode}
    </div>
  )
}

export function PfColorSwatchGrid({
  colors,
  activeValue,
  disabled,
  onPick,
  onClear,
  clearLabel = '기본값',
}: {
  colors: readonly { value: string; label: string }[]
  activeValue: string
  disabled?: boolean
  onPick: (value: string) => void
  onClear: () => void
  clearLabel?: string
}) {
  return (
    <div className={styles['swatch-grid']}>
      <div className={styles['swatch-row']}>
        {colors
          .filter(color => color.value)
          .map(color => (
            <button
              key={color.value}
              type="button"
              className={[
                styles.swatch,
                activeValue === color.value ? styles['swatch-active'] : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={color.label}
              disabled={disabled}
              style={{ backgroundColor: color.value }}
              onMouseDown={event => event.preventDefault()}
              onClick={() => onPick(color.value)}
            />
          ))}
      </div>
      <button
        type="button"
        className={styles['swatch-clear']}
        disabled={disabled}
        onMouseDown={event => event.preventDefault()}
        onClick={onClear}
      >
        {clearLabel}
      </button>
    </div>
  )
}

export function PfEmojiPickerGrid({
  disabled,
  onPick,
}: {
  disabled?: boolean
  onPick: (name: string) => void
}) {
  const [query, setQuery] = useState('')
  const quickPick = useMemo(() => getEmojiQuickPickItems(), [])
  const filtered = useMemo(() => filterEmojis(query, 64), [query])
  const items = query.trim() ? filtered : quickPick.length > 0 ? quickPick : filtered

  return (
    <div className={styles['emoji-picker']}>
      <PFTextInput
        size="medium"
        placeholder="이모지 검색"
        value={query}
        disabled={disabled}
        onChange={event => setQuery(event.target.value)}
      />
      <div className={styles['emoji-grid']} role="listbox" aria-label="이모지">
        {items.map((emoji: EmojiItem) => (
          <button
            key={emoji.name}
            type="button"
            className={styles['emoji-cell']}
            title={emoji.name}
            disabled={disabled}
            role="option"
            onMouseDown={event => event.preventDefault()}
            onClick={() => onPick(emoji.name)}
          >
            {emoji.emoji ?? `:${emoji.name}:`}
          </button>
        ))}
      </div>
    </div>
  )
}
