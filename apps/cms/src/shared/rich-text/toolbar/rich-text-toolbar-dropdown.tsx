import { RtChevronDownIcon } from '@jakorea/rich-text/icons'
import type { EmojiItem } from '@jakorea/rich-text'
import { filterEmojis, getEmojiQuickPickItems } from '@jakorea/rich-text'
import { Dropdown, Input, type MenuProps } from 'antd'
import { useMemo, useState, type ReactNode } from 'react'

export type ToolbarDropdownProps = {
  label: ReactNode
  /** 트리거 앞 아이콘 (글꼴 T, 팔레트 등) */
  leadingIcon?: ReactNode
  /** 선택값이 있을 때 트리거에 표시 (예: H₁, 15) */
  valueLabel?: string
  menuItems?: MenuProps['items']
  disabled?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** 색상·하이라이트 그리드 패널 */
  panel?: ReactNode
  /** 라벨 숨김 — 아이콘+chevron만 (줄간격·이모지·정렬·목록) */
  iconOnly?: boolean
  ariaLabel: string
}

export function ToolbarDropdown({
  label,
  leadingIcon,
  valueLabel,
  menuItems,
  disabled,
  open,
  onOpenChange,
  panel,
  iconOnly,
  ariaLabel,
}: ToolbarDropdownProps) {
  const trigger = (
    <button
      type="button"
      className={[
        'rich-text-toolbar__dropdown-trigger',
        'rt-toolbar-trigger',
        iconOnly
          ? 'rich-text-toolbar__dropdown-trigger--icon-only rt-toolbar-icon-control'
          : 'rich-text-toolbar__dropdown-trigger--labeled',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-haspopup="menu"
      onMouseDown={event => event.preventDefault()}
    >
      {leadingIcon ? (
        <span className="rich-text-toolbar__dropdown-leading" aria-hidden>
          {leadingIcon}
        </span>
      ) : null}
      {!iconOnly ? (
        <span className="rich-text-toolbar__dropdown-label">
          {valueLabel ?? label}
        </span>
      ) : null}
      <RtChevronDownIcon className="rich-text-toolbar__dropdown-chevron" />
    </button>
  )

  if (panel) {
    return (
      <Dropdown
        trigger={['click']}
        disabled={disabled}
        open={open}
        onOpenChange={onOpenChange}
        getPopupContainer={() => document.body}
        popupRender={() => (
          <div
            className="rich-text-toolbar__dropdown-panel"
            onMouseDown={event => event.preventDefault()}
          >
            {panel}
          </div>
        )}
      >
        {trigger}
      </Dropdown>
    )
  }

  return (
    <Dropdown
      menu={menuItems ? { items: menuItems } : undefined}
      trigger={['click']}
      disabled={disabled}
      open={open}
      onOpenChange={onOpenChange}
      getPopupContainer={() => document.body}
      popupRender={originNode => (
        <div onMouseDown={event => event.preventDefault()}>{originNode}</div>
      )}
    >
      {trigger}
    </Dropdown>
  )
}

export function ColorSwatchGrid({
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
    <div className="rich-text-toolbar__swatch-grid">
      <div className="rich-text-toolbar__swatch-row">
        {colors
          .filter(c => c.value)
          .map(color => (
            <button
              key={color.value}
              type="button"
              className={[
                'rich-text-toolbar__swatch',
                activeValue === color.value ? 'rich-text-toolbar__swatch--active' : '',
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
        className="rich-text-toolbar__swatch-clear"
        disabled={disabled}
        onMouseDown={event => event.preventDefault()}
        onClick={onClear}
      >
        {clearLabel}
      </button>
    </div>
  )
}

export function EmojiPickerGrid({
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
    <div className="rich-text-toolbar__emoji-picker">
      <Input
        size="small"
        placeholder="이모지 검색"
        value={query}
        disabled={disabled}
        allowClear
        onChange={event => setQuery(event.target.value)}
        onMouseDown={event => event.stopPropagation()}
      />
      <div className="rich-text-toolbar__emoji-grid" role="listbox" aria-label="이모지">
        {items.map((emoji: EmojiItem) => (
          <button
            key={emoji.name}
            type="button"
            className="rich-text-toolbar__emoji-cell"
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
