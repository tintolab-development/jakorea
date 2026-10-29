import { useContext } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { FormItemInputContext } from 'antd/es/form/context'
import { FieldDeleteIcon } from '../icons/field-icons.js'
import { hasFieldNode, joinClassNames } from '../lib/join-class-names.js'
import { cmsControlSizeClass, type AdminControlSize } from './control-size.js'
import './admin-field.css'

export interface AdminFieldProps {
  label?: ReactNode
  required?: boolean
  message?: ReactNode
  error?: boolean
}

export function useAdminFieldStatus({
  error,
  status,
  message,
  disabled,
}: {
  error?: boolean
  status?: string
  message?: ReactNode
  disabled?: boolean
}) {
  const { status: formStatus, errors: formErrors = [] } = useContext(FormItemInputContext)
  const rawError = Boolean(error) || status === 'error' || formStatus === 'error'
  const isError = rawError && !disabled
  const formError = rawError && formErrors.length > 0 ? formErrors[0] : undefined
  const resolvedMessage: ReactNode = rawError ? (formError ?? message) : message
  return {
    isError,
    message: resolvedMessage,
    hasMessage: hasFieldNode(resolvedMessage),
  }
}

export interface AdminFieldFrameProps {
  size: AdminControlSize
  label?: ReactNode
  required?: boolean
  message?: ReactNode
  isError?: boolean
  htmlFor?: string
  messageId?: string
  className?: string
  style?: CSSProperties
  labelClassName?: string
  requiredClassName?: string
  messageClassName?: string
  children: ReactNode
}

export function AdminFieldFrame({
  size,
  label,
  required = false,
  message,
  isError = false,
  htmlFor,
  messageId,
  className,
  style,
  labelClassName,
  requiredClassName,
  messageClassName,
  children,
}: AdminFieldFrameProps) {
  const hasLabel = hasFieldNode(label)
  const hasMessage = hasFieldNode(message)

  const labelContent = (
    <>
      <span className="cms-field__label-text">{label}</span>
      {required ? (
        <span className={joinClassNames('cms-field__required', requiredClassName)} aria-hidden>
          *
        </span>
      ) : null}
    </>
  )

  return (
    <span
      className={joinClassNames(
        'cms-field',
        cmsControlSizeClass(size),
        hasLabel && 'cms-field--has-label',
        isError && 'cms-field--error',
        className
      )}
      style={style}
    >
      {hasLabel ? (
        htmlFor ? (
          <label className={joinClassNames('cms-field__label', labelClassName)} htmlFor={htmlFor}>
            {labelContent}
          </label>
        ) : (
          <span className={joinClassNames('cms-field__label', labelClassName)}>{labelContent}</span>
        )
      ) : null}
      {children}
      {hasMessage ? (
        <span
          id={messageId}
          className={joinClassNames(
            'cms-field__message',
            isError && 'cms-field__message--error',
            messageClassName
          )}
          role={isError ? 'alert' : undefined}
        >
          {message}
        </span>
      ) : null}
    </span>
  )
}

export function AdminClearIconSvg() {
  return <FieldDeleteIcon />
}

export function AdminFieldClearButton({
  onClear,
  className,
  label = '입력 내용 지우기',
}: {
  onClear: () => void
  className?: string
  label?: string
}) {
  return (
    <button
      type="button"
      className={joinClassNames('cms-field__clear', className)}
      aria-label={label}
      tabIndex={-1}
      onMouseDown={event => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onClick={event => {
        event.stopPropagation()
        onClear()
      }}
    >
      <AdminClearIconSvg />
    </button>
  )
}
