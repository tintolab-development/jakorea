/**
 * 첨부 파일 행 공통 (디자인 시스템)
 * - 파일명(말줄임) + 삭제 X — 파일 추가 컴포넌트(수정 모드)에서는 파일 유형 아이콘을 두지 않는다
 * - 빈 상태 「첨부된 파일이 없습니다.」
 * - 버튼+가이드 줄은 `.file-upload-actions` / `.file-upload-guide` 클래스 공통
 * 사용처: ThumbnailUploadField, FileSelectField, ParagraphFileUpload
 */

import type { MouseEvent } from 'react'
import { FileRemoveIcon } from '@/shared/ui/icons/FileRemoveIcon'
import './file-attachment-row.css'

export const FILE_ATTACHMENT_EMPTY_TEXT = '첨부된 파일이 없습니다.'

export interface FileAttachmentRowProps {
  fileName: string
  /** 전달 시 X 버튼 노출 */
  onRemove?: (event: MouseEvent<HTMLButtonElement>) => void
  removeLabel?: string
  className?: string
}

export function FileAttachmentRow({
  fileName,
  onRemove,
  removeLabel,
  className,
}: FileAttachmentRowProps) {
  return (
    <span className={['file-attachment-row', className].filter(Boolean).join(' ')}>
      <span className="file-attachment-row__name" title={fileName}>
        {fileName}
      </span>
      {onRemove ? (
        <button
          type="button"
          className="file-attachment-row__remove"
          onClick={onRemove}
          aria-label={removeLabel ?? `${fileName} 삭제`}
        >
          <FileRemoveIcon />
        </button>
      ) : null}
    </span>
  )
}

export function FileAttachmentEmpty({ className }: { className?: string }) {
  return (
    <span className={['file-attachment-empty', className].filter(Boolean).join(' ')}>
      {FILE_ATTACHMENT_EMPTY_TEXT}
    </span>
  )
}

export interface FileUploadGuideProps {
  lines?: string[]
  className?: string
}

export function FileUploadGuide({ lines, className }: FileUploadGuideProps) {
  if (!lines || lines.length === 0) return null
  return (
    <div className={['file-upload-guide', className].filter(Boolean).join(' ')}>
      {lines.map((line, i) => (
        <span key={`${i}-${line}`} className="file-upload-guide__line">
          {line}
        </span>
      ))}
    </div>
  )
}
