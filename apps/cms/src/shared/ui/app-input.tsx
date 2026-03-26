/**
 * 앱 공통 텍스트 인풋 (재사용)
 * CMS 전역에서 높이·패딩·테두리·배경 통일
 */

import { forwardRef } from 'react'
import { Input } from 'antd'
import type { InputProps, InputRef } from 'antd'
import './app-input.css'

export interface AppInputProps extends Omit<InputProps, 'variant'> {
  /** Ant Input 루트(affix 래퍼)에만 붙는 클래스 */
  inputClassName?: string
}

export const AppInput = forwardRef<InputRef, AppInputProps>(
  ({ className, inputClassName, ...rest }, ref) => {
    const wrapperCn = ['app-input', className].filter(Boolean).join(' ')
    return (
      <span className={wrapperCn}>
        <Input ref={ref} variant="borderless" className={inputClassName} {...rest} />
      </span>
    )
  }
)

AppInput.displayName = 'AppInput'
