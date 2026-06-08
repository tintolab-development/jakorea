/**
 * 엑셀 다운로드 공통 버튼 — `CmsButton` 고정 스펙 래퍼
 */

import { forwardRef } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { CmsButton, type CmsButtonProps } from './cms-button'

export type ExcelButtonProps = Omit<
  CmsButtonProps,
  'variant' | 'size' | 'width' | 'icon' | 'children'
>

export const ExcelButton = forwardRef<HTMLButtonElement, ExcelButtonProps>(
  ({ type = 'button', ...rest }, ref) => (
    <CmsButton
      ref={ref}
      type={type}
      variant="primary"
      size="large"
      width={180}
      icon={<DownloadOutlined />}
      {...rest}
    >
      엑셀 다운로드
    </CmsButton>
  )
)

ExcelButton.displayName = 'ExcelButton'
