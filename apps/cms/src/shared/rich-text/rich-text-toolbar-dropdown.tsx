import { DownOutlined } from '@ant-design/icons'
import { Dropdown, type MenuProps } from 'antd'
import type { ReactNode } from 'react'

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
  ariaLabel,
}: ToolbarDropdownProps) {
  const trigger = (
    <button
      type="button"
      className="rich-text-toolbar__dropdown-trigger"
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
      <span className="rich-text-toolbar__dropdown-label">
        {valueLabel ?? label}
      </span>
      <DownOutlined className="rich-text-toolbar__dropdown-chevron" />
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
        dropdownRender={() => (
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
        <div
          onMouseDown={event => {
            event.preventDefault()
            event.stopPropagation()
          }}
        >
          {originNode}
        </div>
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
