/**
 * 엑셀 다운로드 공통 버튼 — h40 + icon 180×40 (padding 6 16 6 10)
 * 목록 CmsDataTable 툴바 높이 SSOT
 * 데이터 없음: disabled 대신 다운로드 안내 Alert
 */

import { forwardRef, type MouseEvent } from 'react'
import { CmsButton, type CmsButtonProps } from './cms-button'
import { useCmsAlert } from './cms-alert-modal-provider'
import fileDownloadWhiteUrl from './icons/file-download-white.svg'
import './excel-button.css'

export const EXCEL_EMPTY_DATA_ALERT = {
  title: '다운로드 안내',
  content: '다운로드할 데이터가 없습니다.',
} as const

export type ExcelButtonProps = Omit<CmsButtonProps, 'variant' | 'size' | 'icon' | 'children'> & {
  /** true면 클릭 시 다운로드하지 않고 안내 Alert */
  empty?: boolean
}

/** 테이블 상단 엑셀 — primary · h40 · has-icon */
export const ExcelButton = forwardRef<HTMLButtonElement, ExcelButtonProps>(
  ({ type = 'button', className, empty = false, onClick, ...rest }, ref) => {
    const { showAlert } = useCmsAlert()

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (empty) {
        showAlert(EXCEL_EMPTY_DATA_ALERT)
        return
      }
      onClick?.(event)
    }

    return (
      <CmsButton
        ref={ref}
        type={type}
        variant="primary"
        size="h40"
        icon={<img src={fileDownloadWhiteUrl} alt="" width={13} height={13} aria-hidden />}
        className={['excel-button', className].filter(Boolean).join(' ')}
        onClick={handleClick}
        {...rest}
      >
        엑셀 다운로드
      </CmsButton>
    )
  }
)

ExcelButton.displayName = 'ExcelButton'
