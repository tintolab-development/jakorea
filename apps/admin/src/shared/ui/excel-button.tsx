/**
 * 엑셀 다운로드 공통 버튼 — h40 + icon 180×40 (padding 6 16 6 10)
 * 목록 CmsDataTable 툴바 높이 SSOT
 */

import { forwardRef } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { CmsButton, type CmsButtonProps } from './cms-button'

export type ExcelButtonProps = Omit<
  CmsButtonProps,
  'variant' | 'size' | 'width' | 'icon' | 'children'
>

/** 테이블 상단 엑셀 — primary · h40 · has-icon → 180×40 */
export const ExcelButton = forwardRef<HTMLButtonElement, ExcelButtonProps>(
  ({ type = 'button', className, ...rest }, ref) => (
    <CmsButton
      ref={ref}
      type={type}
      variant="primary"
      size="h40"
      icon={<DownloadOutlined />}
      className={['excel-button', className].filter(Boolean).join(' ')}
      {...rest}
    >
      엑셀 다운로드
    </CmsButton>
  )
)

ExcelButton.displayName = 'ExcelButton'
