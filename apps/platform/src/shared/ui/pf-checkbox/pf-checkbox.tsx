import {
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from 'react'
import checkMarkDisabledUrl from './icons/check-mark-disabled.svg'
import checkMarkUrl from './icons/check-mark.svg'
import styles from './pf-checkbox.module.css'

export type PFCheckboxSize = 'large' | 'small'

export type PFCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> & {
  size?: PFCheckboxSize
  label?: ReactNode
  children?: ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function PFCheckbox({
  size = 'large',
  label,
  children,
  checked,
  onCheckedChange,
  disabled = false,
  className,
  id,
  onChange,
  ...props
}: PFCheckboxProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const content = label ?? children

  const rootClassName = [styles.root, styles[size], className].filter(Boolean).join(' ')

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(event.target.checked)
    onChange?.(event)
  }

  return (
    <label className={rootClassName} htmlFor={inputId}>
      <input
        {...props}
        id={inputId}
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
      />
      <span className={styles.box} aria-hidden="true">
        <img
          className={[styles.checkIcon, styles.checkIconDefault].join(' ')}
          src={checkMarkUrl}
          alt=""
        />
        <img
          className={[styles.checkIcon, styles.checkIconDisabled].join(' ')}
          src={checkMarkDisabledUrl}
          alt=""
        />
      </span>
      {content ? (
        <span className={[styles.labelText, 'typo-bd-md-md'].join(' ')}>{content}</span>
      ) : null}
    </label>
  )
}
