import {
  forwardRef,
  type ComponentProps,
  type ComponentRef,
  type CSSProperties,
  type ForwardRefExoticComponent,
  type ForwardRefRenderFunction,
  type Ref,
  type RefAttributes,
} from 'react'
import { TimePicker } from 'antd'
import {
  AdminFieldFrame,
  cmsControlSizeClass,
  joinClassNames,
  shouldRenderFieldFrame,
  useAdminFieldStatus,
  type AdminControlSize,
  type AdminFieldProps,
} from '../field/index.js'
import { FieldClockIcon } from '../icons/field-icons.js'
import {
  AdminPickerPrefixIcon,
  adminDatePickerPopupContainer,
  resolveAdminPickerAllowClear,
  type AdminDatePickerRef,
} from './admin-datepicker.js'
import { ADMIN_TIME_FORMAT, DEFAULT_ADMIN_TIME_PLACEHOLDER } from './date-format.js'

type InternalTimePickerRef = ComponentRef<typeof TimePicker>
type AntTimePickerProps = ComponentProps<typeof TimePicker>

export type AdminTimePickerRef = AdminDatePickerRef

export interface AdminTimePickerProps
  extends Omit<AntTimePickerProps, 'variant' | 'className' | 'size' | 'status'>,
    AdminFieldProps {
  className?: string
  pickerClassName?: string
  inputSize?: AdminControlSize
  width?: number | string
  status?: AntTimePickerProps['status']
}

const AdminTimePickerRender: ForwardRefRenderFunction<AdminTimePickerRef, AdminTimePickerProps> = (
  props,
  ref
) => {
  const {
    className,
    pickerClassName,
    format,
    prefix,
    suffixIcon,
    inputReadOnly,
    inputSize = 'large',
    width,
    placeholder,
    disabled,
    style,
    allowClear,
    label,
    required = false,
    message,
    error = false,
    status,
    value,
    getPopupContainer,
    ...rest
  } = props
  const framed = shouldRenderFieldFrame(props, label)
  const { isError, message: resolvedMessage } = useAdminFieldStatus({
    error,
    status,
    message,
    disabled,
  })
  const hasExplicitWidth = width != null
  const widthStyle: CSSProperties | undefined =
    width != null ? { width: typeof width === 'number' ? `${width}px` : width } : undefined

  const boxCn = joinClassNames(
    'cms-datepicker',
    'cms-time-picker',
    `cms-datepicker--${inputSize}`,
    cmsControlSizeClass(inputSize),
    'cms-field__box',
    hasExplicitWidth && 'cms-datepicker--explicit-width',
    disabled && 'cms-datepicker--disabled',
    disabled && 'cms-field__box--disabled',
    isError && 'cms-field__box--error',
    value != null && 'cms-field__box--filled',
    framed ? undefined : className
  )
  const pickerCn = joinClassNames('cms-datepicker__picker', 'cms-time-picker__picker', pickerClassName)

  const box = (
    <span className={boxCn} style={framed ? undefined : { ...widthStyle, ...style }}>
      <TimePicker
        ref={ref as Ref<InternalTimePickerRef>}
        variant="borderless"
        className={pickerCn}
        format={format ?? ADMIN_TIME_FORMAT}
        prefix={
          prefix ?? (
            <AdminPickerPrefixIcon>
              <FieldClockIcon className="cms-time-picker__clock-icon" />
            </AdminPickerPrefixIcon>
          )
        }
        suffixIcon={suffixIcon ?? null}
        inputReadOnly={inputReadOnly ?? true}
        placeholder={placeholder ?? DEFAULT_ADMIN_TIME_PLACEHOLDER}
        disabled={disabled}
        allowClear={resolveAdminPickerAllowClear(allowClear)}
        value={value}
        {...rest}
        getPopupContainer={getPopupContainer ?? adminDatePickerPopupContainer}
      />
    </span>
  )

  if (!framed) return box

  return (
    <AdminFieldFrame
      size={inputSize}
      label={label}
      required={required}
      message={resolvedMessage}
      isError={isError}
      className={joinClassNames(
        'cms-time-picker-field',
        hasExplicitWidth && 'cms-field--explicit-width',
        className
      )}
      style={{ ...widthStyle, ...style }}
    >
      {box}
    </AdminFieldFrame>
  )
}

export const AdminTimePicker: ForwardRefExoticComponent<
  AdminTimePickerProps & RefAttributes<AdminTimePickerRef>
> = forwardRef(AdminTimePickerRender)

AdminTimePicker.displayName = 'AdminTimePicker'
