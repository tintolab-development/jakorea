/**
 * 첨부파일 다운로드 목록 — 헤더(N개의 첨부파일) + 파일명 클릭 행
 */

import { AttachmentClipIcon } from '@/shared/ui/icons/AttachmentClipIcon'
import { FileDownloadRowIcon } from '@/shared/ui/icons/FileDownloadRowIcon'
import './attachment-download-list.css'

export type AttachmentDownloadItem = {
  id: string
  fileName: string
  fileUrl?: string
}

export interface AttachmentDownloadListProps {
  items: AttachmentDownloadItem[]
  onDownload: (item: AttachmentDownloadItem) => void
  className?: string
  /** 헤더 문구 — 기본 `{n}개의 첨부파일` */
  headerLabel?: string
}

export function AttachmentDownloadList({
  items,
  onDownload,
  className = '',
  headerLabel,
}: AttachmentDownloadListProps) {
  if (items.length === 0) return null

  const label = headerLabel ?? `${items.length}개의 첨부파일`

  return (
    <div className={['attachment-download-list', className].filter(Boolean).join(' ')}>
      <div className="attachment-download-list__header">
        <span className="attachment-download-list__header-icon">
          <AttachmentClipIcon />
        </span>
        <span>{label}</span>
      </div>
      <div className="attachment-download-list__file-list">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            className="attachment-download-list__file-item"
            onClick={() => onDownload(item)}
          >
            <span className="attachment-download-list__file-item-icon">
              <FileDownloadRowIcon />
            </span>
            <span className="attachment-download-list__file-item-name">{item.fileName}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
