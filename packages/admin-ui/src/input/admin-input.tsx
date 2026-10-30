import { forwardRef, useId, useState } from 'react'
import type { ChangeEvent, CSSProperties, ReactNode } from 'react'
import { Input } from 'antd'
import type { InputProps, InputRef } from 'antd'
import {
  AdminFieldClearButton,
  AdminFieldFrame,
  hasFieldNode,
  joinClassNames,
  useAdminFieldStatus,
  type AdminControlSize,
  type AdminFieldProps,
} from '../field/index.js'
import './admin-input.css'

export type AdminInputSize = AdminControlSize

export interface AdminInputProps
  extends Omit<InputProps, 'variant' | 'prefix' | 'size'>,
    AdminFieldProps {
  inputSize?: AdminInputSize
  icon?: ReactNode
  width?: number | string
  allowClear?: boolean
}

function hasInputText(value: InputProps['value'] | InputProps['defaultValue']): boolean {
  if (value == null) return false
  return String(value).length > 0
}

export const AdminInput = forwardRef<InputRef, AdminInputProps>(
  (
    {
      className,
      label,
      required = false,
      error = false,
      message,
      icon,
      inputSize = 'large',
      width,
      disabled,
      style,
      rootClassName,
      allowClear = true,
      id,
      value,
      defaultValue,
      status,
      onChange,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    const isControlled = value !== undefined
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '')
    const currentValue = isControlled ? value : uncontrolledValue
    const isFilled = hasInputText(currentValue)
    const showClear = Boolean(allowClear && !disabled && isFilled)

    const { isError, message: resolvedMessage, hasMessage } = useAdminFieldStatus({
      error,
      status,
      message,
      disabled,
    })

    const hasIcon = icon != null
    const hasExplicitWidth = width != null
    const hasLabel = hasFieldNode(label)
    const messageId = `${inputId}-message`

    const widthStyle: CSSProperties | undefined =
      width != null ? { width: typeof width === 'number' ? `${width}px` : width } : undefined

    const rootCn = joinClassNames(
      'cms-input',
      `cms-input--${inputSize}`,
      hasIcon && 'cms-input--has-icon',
      hasExplicitWidth && 'cms-input--explicit-width',
      hasExplicitWidth && 'cms-field--explicit-width',
      showClear && 'cms-input--clearable',
      isError && 'cms-input--error',
      hasLabel && 'cms-input--has-label',
      hasMessage && 'cms-input--has-message',
      className
    )

    const controlCn = joinClassNames(
      'cms-input__control',
      'cms-field__box',
      isFilled && 'cms-field__box--filled',
      disabled && 'cms-input__control--disabled',
      disabled && 'cms-field__box--disabled',
      isError && 'cms-input__control--error',
      isError && 'cms-field__box--error'
    )

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setUncontrolledValue(event.target.value)
      }
      onChange?.(event)
    }

    const handleClear = () => {
      if (!isControlled) {
        setUncontrolledValue('')
      }
      onChange?.({
        target: { value: '' },
        currentTarget: { value: '' },
      } as ChangeEvent<HTMLInputElement>)
    }

    return (
      <AdminFieldFrame
        size={inputSize}
        label={label}
        required={required}
        message={resolvedMessage}
        isError={isError}
        htmlFor={inputId}
        messageId={messageId}
        className={rootCn}
        style={{ ...widthStyle, ...style }}
        labelClassName="cms-input__label"
        requiredClassName="cms-input__required"
        messageClassName={joinClassNames(
          'cms-input__message',
          isError && 'cms-input__message--error'
        )}
      >
        <span className={controlCn}>
          {hasIcon ? <span className="cms-input__icon cms-field__icon">{icon}</span> : null}
          <span className="cms-input__inner">
            <Input
              ref={ref}
              id={inputId}
              disabled={disabled}
              rootClassName={rootClassName}
              variant="borderless"
              allowClear={false}
              value={isControlled ? value : uncontrolledValue}
              onChange={handleChange}
              aria-invalid={isError || undefined}
              aria-describedby={hasMessage ? messageId : undefined}
              {...rest}
            />
          </span>
          {showClear ? (
            <AdminFieldClearButton className="cms-input__clear" onClear={handleClear} />
          ) : null}
        </span>
      </AdminFieldFrame>
    )
  }
)

AdminInput.displayName = 'AdminInput'
