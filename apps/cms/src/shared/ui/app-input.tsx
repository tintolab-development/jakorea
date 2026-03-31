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
}

export const AppInput = forwardRef<InputRef, AppInputProps>(
  ({ className, uiVariant = 'default', ...rest }, ref) => {
    const wrapperCn = ['app-input', uiVariant === 'filter' && 'app-input--filter', className]
      .filter(Boolean)
      .join(' ')
    return (
      <span className={wrapperCn}>
        <Input ref={ref} {...rest} variant="borderless" />
      </span>
    )
  }
)

AppInput.displayName = 'AppInput'
