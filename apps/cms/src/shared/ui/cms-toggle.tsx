/**
 * CMS 공통 토글 (스위치) — 라벨 + 트랙·썸
 */

import { forwardRef, useId, type ReactNode } from 'react'
import './cms-toggle.css'

export interface CmsToggleProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  /** 스위치 왼쪽 라벨 */
  label?: ReactNode
  disabled?: boolean
  className?: string
  /** 루트(span)에만 적용 */
  rootClassName?: string
  id?: string
  name?: string
}

export const CmsToggle = forwardRef<HTMLButtonElement, CmsToggleProps>(
  (
    {
      checked,
      onChange,
      label,
      disabled,
      className,
      rootClassName,
      id: idProp,
      name,
    },
    ref
  ) => {
    const uid = useId()
    const labelId = `${uid}-cms-toggle-label`
    const buttonId = idProp ?? `${uid}-cms-toggle`

    const rootCn = ['cms-toggle__root', rootClassName].filter(Boolean).join(' ')
    const btnCn = ['cms-toggle', checked ? 'cms-toggle--checked' : '', className]
      .filter(Boolean)
      .join(' ')

    return (
      <span className={rootCn}>
        {label != null && label !== '' ? (
          <span className="cms-toggle__label" id={labelId}>
            {label}
          </span>
        ) : null}
        <button
          ref={ref}
          id={buttonId}
          type="button"
          name={name}
          role="switch"
          aria-checked={checked}
          aria-labelledby={label != null && label !== '' ? labelId : undefined}
          disabled={disabled}
          className={btnCn}
          onClick={() => {
            if (disabled) return
            onChange?.(!checked)
          }}
        >
          <span className="cms-toggle__track" aria-hidden>
            <span className="cms-toggle__thumb" />
          </span>
        </button>
      </span>
    )
  }
)

CmsToggle.displayName = 'CmsToggle'
