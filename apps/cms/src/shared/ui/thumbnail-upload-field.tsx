/**
 * 썸네일 업로드 공통 필드 (디자인 시스템)
 * - 72×72 썸네일(확대 보기) / placeholder + 파일명(X) · 「첨부된 파일이 없습니다.」 + 「파일 추가」 + 가이드
 * - 단건 선택. 업로드 API 는 호출하지 않는다 — `onSelectFile` 에서 화면별로 처리
 * - 파일이 있거나 disabled·uploading 이면 버튼 비활성. disabled 면 X 미표시
 */

import { useEffect, useRef, type ChangeEvent } from 'react'
import { Image } from 'antd'
import { CmsButton } from '@/shared/ui/cms-button'
import { beginFileUploadOverlay } from '@/shared/ui/file-upload-overlay-store'
import {
  FILE_SELECT_MAX_TOTAL_BYTES,
  THUMBNAIL_SIZE_EXCEEDED_MESSAGE,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
} from '@/shared/ui/file-select-field-limits'
import { FileTypeIcon } from '@/shared/ui/icons/FileTypeIcon'
import { FileRemoveIcon } from '@/shared/ui/icons/FileRemoveIcon'
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
  /** 업로드 중이면 화면 전체 스피너를 띄우고 필드를 막는다 */
  uploading?: boolean
  buttonLabel?: string
  previewAlt?: string
  sizeExceededMessage?: string
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
  uploading = false,
  buttonLabel = '파일 추가',
  previewAlt = '',
  sizeExceededMessage = THUMBNAIL_SIZE_EXCEEDED_MESSAGE,
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
  const hasFile = name !== ''
  const locked = disabled || uploading
  const canSelect = !locked && !hasFile && typeof onSelectFile === 'function'
  const canRemove = !locked && hasFile && typeof onRemove === 'function'

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (isFileSelectTotalSizeExceeded({ incoming: [file], maxTotalBytes: FILE_SELECT_MAX_TOTAL_BYTES })) {
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
          <Image
            src={previewUrl}
            alt={previewAlt}
            width={72}
            height={72}
            className="thumbnail-upload-field__image"
            preview={{ mask: '확대 보기' }}
          />
        ) : (
          <ThumbnailPlaceholder />
        )}
      </div>

      <div className="thumbnail-upload-field__body">
        {hasFile ? (
          <span className="thumbnail-upload-field__file">
            <FileTypeIcon fileName={name} className="thumbnail-upload-field__file-icon" />
            <span className="thumbnail-upload-field__file-name" title={name}>
              {name}
            </span>
            {canRemove ? (
              <button
                type="button"
                className="thumbnail-upload-field__remove"
                onClick={onRemove}
                aria-label={`${name} 삭제`}
              >
                <FileRemoveIcon />
              </button>
            ) : null}
          </span>
        ) : (
          <span className="thumbnail-upload-field__empty">첨부된 파일이 없습니다.</span>
        )}

        <div className="thumbnail-upload-field__actions">
          {canSelect ? (
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="thumbnail-upload-field__input"
              aria-label={buttonLabel}
              onChange={handleChange}
            />
          ) : null}
          <CmsButton
            type="button"
            variant="secondary"
            size="small"
            disabled={!canSelect}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? '업로드 중…' : buttonLabel}
          </CmsButton>
          {guideLines && guideLines.length > 0 ? (
            <div className="thumbnail-upload-field__guide">
              {guideLines.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
