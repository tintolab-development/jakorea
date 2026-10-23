/**
 * 엑셀 다운로드 공통 버튼 — primary + 아이콘. 기본 h40 × 140.
 */

import { forwardRef } from 'react'
import { CmsButton, type CmsButtonProps } from './cms-button'

import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'

export type ExcelButtonProps = Omit<
  CmsButtonProps,
  'variant' | 'icon' | 'children' | 'adminAction'
>

/** 테이블 상단 엑셀 — primary · 기본 h40 × 140. `size`/`width`로 오버라이드 */
export const ExcelButton = forwardRef<HTMLButtonElement, ExcelButtonProps>(
  ({ type = 'button', className, size = 'h40', width = 140, ...rest }, ref) => {
    return (
      <CmsButton
        ref={ref}
        type={type}
        variant="primary"
        size={size}
        width={width}
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
