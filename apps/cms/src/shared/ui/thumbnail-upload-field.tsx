/**
 * 썸네일 업로드 공통 필드 (디자인 시스템)
 * - 72×72 썸네일 / placeholder + 파일명(X) · 「첨부된 파일이 없습니다.」 + 「파일 추가」 + 가이드
 * - 단건 선택. 업로드 API 는 호출하지 않는다 — `onSelectFile` 에서 화면별로 처리
 * - 파일이 있거나 disabled·uploading 이면 버튼 비활성. disabled 면 X 미표시
 */

import { useEffect, useRef, type ChangeEvent } from 'react'
import { openFilePicker } from '@/shared/lib/open-file-picker'
import { CmsButton } from '@/shared/ui/cms-button'
import { beginFileUploadOverlay } from '@/shared/ui/file-upload-overlay-store'
import {
  FILE_SELECT_MAX_TOTAL_BYTES,
  THUMBNAIL_SIZE_EXCEEDED_MESSAGE,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
} from '@/shared/ui/file-select-field-limits'
import {
  FileAttachmentEmpty,
  FileAttachmentRow,
  FileUploadGuide,
} from '@/shared/ui/file-attachment-row'
import { ThumbnailPlaceholder } from '@/shared/ui/thumbnail-placeholder'
import './thumbnail-upload-field.css'

export const THUMBNAIL_UPLOAD_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'

export interface ThumbnailUploadFieldProps {
  previewUrl?: string | null
  fileName?: string | null
  guideLines?: string[]
  accept?: string
  /** 버튼 비활성 + X 미표시 (보기 모드) */
  disabled?: boolean
  /** 읽기 화면 — 썸네일·파일명만 노출(「파일 추가」 버튼·안내 숨김) */
  readOnly?: boolean
  /** 업로드 중이면 화면 전체 스피너를 띄우고 필드를 막는다 */
  uploading?: boolean
  buttonLabel?: string
  previewAlt?: string
  sizeExceededMessage?: string
  /** 단일 파일 상한(byte). 기본 15MB. */
  maxBytes?: number
  onSelectFile?: (file: File) => void
  onRemove?: () => void
  className?: string
}

export function ThumbnailUploadField({
  previewUrl,
  fileName,
  guideLines,
  accept = THUMBNAIL_UPLOAD_ACCEPT,
  disabled = false,
  readOnly = false,
  uploading = false,
  buttonLabel = '파일 추가',
  previewAlt = '',
  sizeExceededMessage = THUMBNAIL_SIZE_EXCEEDED_MESSAGE,
  maxBytes = FILE_SELECT_MAX_TOTAL_BYTES,
  onSelectFile,
  onRemove,
  className,
}: ThumbnailUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!uploading) return
    return beginFileUploadOverlay()
  }, [uploading])

  const name = fileName?.trim() ?? ''
  const hasFile = name !== '' || Boolean(previewUrl?.trim())
  const locked = disabled || readOnly || uploading
  const canSelect = !locked && !hasFile && typeof onSelectFile === 'function'
  const canRemove = !locked && hasFile && typeof onRemove === 'function'

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (isFileSelectTotalSizeExceeded({ incoming: [file], maxTotalBytes: maxBytes })) {
      notifyFileSelectTotalSizeExceeded(sizeExceededMessage)
      return
    }
    onSelectFile?.(file)
  }

  return (
    <div
      className={['thumbnail-upload-field', className].filter(Boolean).join(' ')}
      aria-busy={uploading || undefined}
    >
      <div className="thumbnail-upload-field__thumb">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={previewAlt}
            width={72}
            height={72}
            className="thumbnail-upload-field__image"
          />
        ) : (
          <ThumbnailPlaceholder />
        )}
      </div>

      <div className="thumbnail-upload-field__body">
        {hasFile ? (
          <FileAttachmentRow
            fileName={name || '썸네일.jpg'}
            onRemove={canRemove ? () => onRemove?.() : undefined}
          />
        ) : (
          <FileAttachmentEmpty />
        )}

        {readOnly ? null : (
          <div className="file-upload-actions">
            <span className="file-upload-picker">
              {canSelect ? (
                <input
                  ref={inputRef}
                  type="file"
                  accept={accept}
                  className="file-upload-picker__input"
                  aria-label={buttonLabel}
                  onChange={handleChange}
                />
              ) : null}
              <CmsButton
                type="button"
                variant="secondary"
                size="h32"
                disabled={!canSelect}
                tabIndex={canSelect ? -1 : undefined}
                onClick={() => openFilePicker(inputRef.current)}
              >
                {uploading ? '업로드 중…' : buttonLabel}
              </CmsButton>
            </span>
            <FileUploadGuide lines={guideLines} />
          </div>
        )}
      </div>
    </div>
  )
}
