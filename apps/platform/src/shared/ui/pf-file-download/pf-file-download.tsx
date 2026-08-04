import type { AnchorHTMLAttributes } from 'react'
import { downloadAttachment } from '@/shared/lib/download-attachment'
import { downloadIconUrl } from './icons'
import styles from './pf-file-download.module.css'

export type PFFileDownloadProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'download' | 'children' | 'onClick'
> & {
  fileName: string
  /** 실파일 URL. 없거나 `#`이면 빈 파일 폴백 다운로드 */
  href?: string
}

/**
 * 첨부 파일 다운로드 칩 — 360×40, warm-100, Body/Small/medium + 말줄임.
 * 프로그램 상세·결과 확인 상세 공통.
 * 아이콘: `./icons/download.svg` (24×24)
 */
export function PFFileDownload({
  fileName,
  href,
  className,
  ...props
}: PFFileDownloadProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(' ')

  return (
    <a
      className={rootClassName}
      href={href?.trim() || '#'}
      download={fileName}
      onClick={event => {
        event.preventDefault()
        downloadAttachment(fileName, href)
      }}
      {...props}
    >
      <span className={`typo-bd-sm-md ${styles.name}`}>{fileName}</span>
      <img
        className={styles.icon}
        src={downloadIconUrl}
        alt=""
        width={24}
        height={24}
        aria-hidden="true"
      />
    </a>
  )
}
