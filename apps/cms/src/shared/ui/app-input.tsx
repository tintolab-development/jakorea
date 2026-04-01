/**
 * 앱 공통 텍스트 인풋 (재사용)
 * CMS 전역에서 높이·패딩·테두리·배경 통일
 */

import { forwardRef } from 'react'
import { Input } from 'antd'
import type { InputProps, InputRef } from 'antd'
import './app-input.css'

export interface AppInputProps extends Omit<InputProps, 'variant'> {
  /** filter: 44px·8px radius 등 통일 필터 토큰 */
  uiVariant?: 'default' | 'filter'
  /** 입력 상단 라벨(선택) */
  label?: React.ReactNode | string
  suffix?: React.ReactNode | string
}

export const AppInput = forwardRef<InputRef, AppInputProps>(
  ({ className, label, suffix, uiVariant = 'default', ...rest }, ref) => {
    const classTokens = (className ?? '').split(/\s+/).filter(Boolean)
    const compatInputClassName = classTokens
      .filter(token => token.startsWith('labeled-search-input__'))
      .join(' ')
    const wrapperClassName = classTokens
      .filter(token => !token.startsWith('labeled-search-input__'))
      .join(' ')

    const wrapperCn = [
      'app-input',
      uiVariant === 'filter' && 'app-input--filter',
      suffix != null && suffix !== '' && 'app-input--with-suffix',
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ')
    const inputNode = (
      <span className={wrapperCn}>
        <span className="app-input__control">
          <Input
            ref={ref}
            {...rest}
            rootClassName={compatInputClassName || undefined}
            className={compatInputClassName || undefined}
            variant="borderless"
          />
        </span>
        {suffix != null && suffix !== '' ? (
          <span className="app-input__suffix">{suffix}</span>
        ) : null}
      </span>
    )
    if (label == null || label === '') return inputNode
    return (
      <span className="app-input__field">
        <span className="app-input__label">{label}</span>
        {inputNode}
      </span>
    )
  }
)

AppInput.displayName = 'AppInput'
