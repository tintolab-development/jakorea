/**
 * 앱 공통 셀렉트 (재사용)
 * CMS 전역에서 너비·높이·패딩·테두리·배경 통일
 */

import { forwardRef } from 'react'
import { Select } from 'antd'
import type { SelectProps } from 'antd'
import type { RefSelectProps } from 'antd/es/select'
import './app-select.css'

export interface AppSelectProps extends Omit<SelectProps, 'variant'> {
  /** Ant Select 루트(.ant-select)에만 붙는 클래스 */
  selectClassName?: string
  /** filter: 44px·8px radius 등 통일 필터 토큰 (Ant variant와 무관) */
  uiVariant?: 'default' | 'filter'
}

export const AppSelect = forwardRef<RefSelectProps, AppSelectProps>(
  ({ className, selectClassName, uiVariant = 'default', ...rest }, ref) => {
    const wrapperCn = ['app-select', uiVariant === 'filter' && 'app-select--filter', className]
      .filter(Boolean)
      .join(' ')
    return (
      <span className={wrapperCn}>
        <Select ref={ref} variant="borderless" className={selectClassName} {...rest} />
      </span>
    )
  }
)

AppSelect.displayName = 'AppSelect'
