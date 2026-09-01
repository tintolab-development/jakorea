/**
 * 엑셀 다운로드 공통 버튼 — Large + icon 180×44 (padding 6 16 6 10)
 */

import { forwardRef } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { CmsButton, type CmsButtonProps } from './cms-button'

export type ExcelButtonProps = Omit<
  CmsButtonProps,
  'variant' | 'size' | 'width' | 'icon' | 'children'
>

/** 테이블 상단 엑셀 — primary · large · has-icon → 180×44 */
export const ExcelButton = forwardRef<HTMLButtonElement, ExcelButtonProps>(
  ({ type = 'button', className, ...rest }, ref) => (
    <CmsButton
      ref={ref}
      type={type}
      variant="primary"
      size="large"
      icon={<DownloadOutlined />}
      className={['excel-button', className].filter(Boolean).join(' ')}
      {...rest}
    >
      엑셀 다운로드
    </CmsButton>
  )
)

ExcelButton.displayName = 'ExcelButton'
