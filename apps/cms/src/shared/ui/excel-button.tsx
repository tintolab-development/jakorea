/**
 * 엑셀 다운로드 공통 버튼 — Large + icon 180×44 (padding 6 16 6 10)
 */

import { forwardRef } from 'react'
import { CmsButton, type CmsButtonProps } from './cms-button'

import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'

export type ExcelButtonProps = Omit<
  CmsButtonProps,
  'variant' | 'size' | 'width' | 'icon' | 'children' | 'adminAction'
>

/** 테이블 상단 엑셀 — primary · large · has-icon → 180×44 */
export const ExcelButton = forwardRef<HTMLButtonElement, ExcelButtonProps>(
  ({ type = 'button', className, ...rest }, ref) => {
    return (
      <CmsButton
        ref={ref}
        type={type}
        variant="primary"
        size="h40"
        width={140}
        icon={<ButtonDownloadIcon />}
        className={['excel-button', className].filter(Boolean).join(' ')}
        {...rest}
        adminAction="download"
      >
        엑셀 다운로드
      </CmsButton>
    )
  }
)

ExcelButton.displayName = 'ExcelButton'
