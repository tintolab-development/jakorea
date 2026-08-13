/**
 * CMS 전용 텍스트 인풋 — Ant Input borderless + `.cms-input__control` 크롬
 * - size: xlarge | large | medium | small
 * - 라벨 / 에러 메세지 / value 있을 때 clear
 */

import { forwardRef, useId, useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Form, Input } from 'antd'
import type { InputProps, InputRef } from 'antd'
import type { CmsControlSize } from './cms-control-size'
import './cms-input.css'

export type CmsInputSize = CmsControlSize | 'xlarge'

export interface CmsInputProps extends Omit<InputProps, 'variant' | 'prefix' | 'size'> {
  /** xlarge 52px / large 44px / medium 40px / small 32px */
  inputSize?: CmsInputSize
  /** 입력 상단 라벨(선택) */
  label?: ReactNode
  /** 라벨 옆 필수 표시(*) */
  required?: boolean
  /** 에러 상태(테두리·메세지 색). `status="error"`와 동일 */
  error?: boolean
  /** 인풋 하단 메세지(에러/안내) */
  message?: ReactNode
  /** 인풋 왼쪽 아이콘(선택) */
  icon?: ReactNode
  /** 지정 시 사이즈별 기본 width 대신 적용 (숫자는 px) */
  width?: number | string
  /** value 있을 때 clear 버튼 (기본 true) */
  allowClear?: boolean
}

function CmsInputClearIcon() {
  const maskId = useId().replace(/:/g, '')

  return (
    <span className="cms-input__clear-icon" aria-hidden>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
      >
        <mask
          id={maskId}
          style={{ maskType: 'alpha' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="22"
          height="22"
        >
          <rect
            x="22"
            y="22"
            width="22"
            height="22"
            transform="rotate(180 22 22)"
            fill="#D9D9D9"
          />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path
            d="M10.9997 10.0341L8.18276 7.21691C8.0558 7.09011 7.89622 7.02518 7.70403 7.02212C7.51199 7.01922 7.34951 7.08415 7.21659 7.21691C7.08383 7.34983 7.01745 7.51086 7.01745 7.7C7.01745 7.88914 7.08383 8.05016 7.21659 8.18308L10.0337 11L7.21659 13.8169C7.08979 13.9439 7.02486 14.1034 7.0218 14.2956C7.0189 14.4877 7.08383 14.6502 7.21659 14.7831C7.34951 14.9158 7.51054 14.9822 7.69968 14.9822C7.88881 14.9822 8.04984 14.9158 8.18276 14.7831L10.9997 11.9659L13.8166 14.7831C13.9436 14.9099 14.1031 14.9748 14.2953 14.9779C14.4874 14.9808 14.6498 14.9158 14.7828 14.7831C14.9155 14.6502 14.9819 14.4891 14.9819 14.3C14.9819 14.1109 14.9155 13.9498 14.7828 13.8169L11.9656 11L14.7828 8.18308C14.9096 8.05612 14.9745 7.89654 14.9775 7.70435C14.9805 7.51231 14.9155 7.34983 14.7828 7.21691C14.6498 7.08415 14.4888 7.01777 14.2997 7.01777C14.1105 7.01777 13.9495 7.08415 13.8166 7.21691L10.9997 10.0341ZM10.9981 2.29166C12.2026 2.29166 13.3347 2.52022 14.3945 2.97733C15.4544 3.43444 16.3762 4.05479 17.1601 4.83839C17.944 5.62199 18.5647 6.54347 19.0221 7.60283C19.4794 8.66219 19.708 9.79404 19.708 10.9984C19.708 12.2029 19.4795 13.3351 19.0223 14.3949C18.5652 15.4547 17.9449 16.3766 17.1613 17.1605C16.3777 17.9444 15.4562 18.565 14.3968 19.0224C13.3375 19.4797 12.2056 19.7083 11.0013 19.7083C9.79678 19.7083 8.66462 19.4798 7.6048 19.0227C6.54498 18.5656 5.62312 17.9452 4.83922 17.1616C4.05531 16.378 3.43466 15.4565 2.97724 14.3972C2.51998 13.3378 2.29134 12.2059 2.29134 11.0016C2.29134 9.7971 2.5199 8.66494 2.97701 7.60512C3.43412 6.5453 4.05447 5.62344 4.83807 4.83954C5.62167 4.05563 6.54315 3.43497 7.60251 2.97756C8.66187 2.52029 9.79372 2.29166 10.9981 2.29166Z"
            fill="#BDC6C9"
          />
        </g>
      </svg>
    </span>
  )
}

export const CmsInput = forwardRef<InputRef, CmsInputProps>(
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
      ...rest
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const { status: formStatus, errors: formErrors } = Form.Item.useStatus()

    const isError = error || status === 'error' || formStatus === 'error'
    const resolvedMessage =
      message ?? (isError && formErrors.length > 0 ? formErrors[0] : undefined)

    const hasIcon = icon != null
    const hasExplicitWidth = width != null
    const hasLabel = label != null && label !== ''
    const hasMessage = resolvedMessage != null && resolvedMessage !== ''

    const widthStyle: CSSProperties | undefined =
      width != null
        ? { width: typeof width === 'number' ? `${width}px` : width }
        : undefined

    const clearConfig = useMemo(
      () =>
        allowClear && !disabled
          ? { clearIcon: <CmsInputClearIcon /> }
          : false,
      [allowClear, disabled]
    )

    const rootCn = [
      'cms-input',
      `cms-input--${inputSize}`,
      hasIcon && 'cms-input--has-icon',
      hasExplicitWidth && 'cms-input--explicit-width',
      isError && 'cms-input--error',
      hasLabel && 'cms-input--has-label',
      hasMessage && 'cms-input--has-message',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const controlCn = [
      'cms-input__control',
      disabled && 'cms-input__control--disabled',
      isError && 'cms-input__control--error',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <span className={rootCn} style={{ ...widthStyle, ...style }}>
        {hasLabel ? (
          <label className="cms-input__label" htmlFor={inputId}>
            <span className="cms-input__label-text">{label}</span>
            {required ? (
              <span className="cms-input__required" aria-hidden>
                *
              </span>
            ) : null}
          </label>
        ) : null}

        <span className={controlCn}>
          {hasIcon ? <span className="cms-input__icon">{icon}</span> : null}
          <span className="cms-input__inner">
            <Input
              ref={ref}
              id={inputId}
              disabled={disabled}
              rootClassName={rootClassName}
              variant="borderless"
              allowClear={clearConfig}
              value={value}
              defaultValue={defaultValue}
              aria-invalid={isError || undefined}
              aria-describedby={hasMessage ? `${inputId}-message` : undefined}
              {...rest}
            />
          </span>
        </span>

        {hasMessage ? (
          <p
            id={`${inputId}-message`}
            className={[
              'cms-input__message',
              isError ? 'cms-input__message--error' : undefined,
            ]
              .filter(Boolean)
              .join(' ')}
            role={isError ? 'alert' : undefined}
          >
            {resolvedMessage}
          </p>
        ) : null}
      </span>
    )
  }
)

CmsInput.displayName = 'CmsInput'
