/**
 * 파일 선택 필드 공통 컴포넌트 (디자인 시스템)
 * - hidden input + 파일 행(유형 아이콘·파일명·X) / 「첨부된 파일이 없습니다.」 + 「파일 추가」(h32) + 가이드
 * - 기본 다중 선택(`multiple=true`). accept·가이드 문구는 케이스별 props
 * - 첨부 합계 기본 최대 15MB (`maxTotalBytes` / `currentTotalBytes`)
 * - disabled 시 버튼 비활성화, input 미렌더, 삭제 버튼 미표시
 */

import { useEffect, useRef, type ChangeEvent } from 'react'
import './file-select-field.css'
import { openFilePicker } from '@/shared/lib/open-file-picker'
import { beginFileUploadOverlay } from '@/shared/ui/file-upload-overlay-store'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  FileAttachmentEmpty,
  FileAttachmentRow,
  FileUploadGuide,
} from '@/shared/ui/file-attachment-row'
import {
  FILE_SELECT_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
} from '@/shared/ui/file-select-field-limits'

export interface FileSelectFieldProps {
  /** input accept 속성 (예: ".jpg,.png,.pdf") — 케이스별 */
  accept?: string
  /**
   * 다중 파일 선택 허용.
   * 디자인 시스템 기본은 `true`(모든 업로드 케이스 공통).
   * 썸네일처럼 단건만 필요할 때만 `false`.
   */
  multiple?: boolean
  /** 비활성화 (버튼 비활성화, input 미렌더, 삭제 버튼 미표시) */
  disabled?: boolean
  /** 표시할 파일명 목록 */
  fileNames?: string[]
  /** 안내 문구 줄 목록 — 케이스별(확장자 등). 용량은 공통 총 15MB 정책 */
  guideLines?: string[]
  /** 파일 선택 시 콜백 (이번 선택분). 목록 누적은 호출측에서 `fileNames`로 관리 */
  onFilesChange?: (files: File[]) => void
  /** 특정 인덱스 파일 업로드 취소(삭제) 시 콜백 — 전달 시 해당 파일 옆에 X 버튼 표시 */
  onRemoveFile?: (index: number) => void
  /** 버튼에 표시할 텍스트 (기본: "파일 추가") */
  buttonLabel?: string
  /** 업로드 중이면 화면 전체 스피너를 띄우고 필드를 막는다 */
  uploading?: boolean
  /** 추가 클래스명 */
  className?: string
  /**
   * 이미 첨부된 파일 합계(byte). 여러 번 선택해 누적할 때 전달.
   * 미전달 시 이번 선택분만 `maxTotalBytes`와 비교.
   */
  currentTotalBytes?: number
  /** 첨부 합계 상한(byte). 기본 15MB. `0`이면 용량 검사 생략 */
  maxTotalBytes?: number
  /** 합계 초과 안내. 썸네일은 썸네일 문구를 넘긴다. */
  sizeExceededMessage?: string
  /** 단일 파일 상한(byte). 전달하면 이번 선택분의 각 파일을 검사한다. */
  maxFileBytes?: number
}

export function FileSelectField({
  accept,
  multiple = true,
  disabled = false,
  fileNames,
  guideLines,
  onFilesChange,
  onRemoveFile,
  buttonLabel = '파일 추가',
  uploading = false,
  className = '',
  currentTotalBytes = 0,
  maxTotalBytes = FILE_SELECT_MAX_TOTAL_BYTES,
  sizeExceededMessage,
  maxFileBytes,
}: FileSelectFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!uploading) return
    return beginFileUploadOverlay()
  }, [uploading])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) {
      const incoming = Array.from(files)
      const tooLargeFile =
        maxFileBytes != null &&
        maxFileBytes > 0 &&
        incoming.find(file => file.size > maxFileBytes)
      if (tooLargeFile) {
        notifyFileSelectTotalSizeExceeded(sizeExceededMessage ?? '파일당 최대 20MB까지 업로드 가능합니다.')
      } else if (
        maxTotalBytes > 0 &&
        isFileSelectTotalSizeExceeded({
          incoming,
          currentTotalBytes,
          maxTotalBytes,
        })
      ) {
        notifyFileSelectTotalSizeExceeded(sizeExceededMessage)
      } else {
        onFilesChange?.(incoming)
      }
    }
    e.target.value = ''
  }

  const fieldDisabled = disabled || uploading
  const canRemove = !fieldDisabled && typeof onRemoveFile === 'function'
  const hasFiles = Boolean(fileNames && fileNames.length > 0)

  return (
    <div
      className={['file-select-field', !hasFiles ? 'file-select-field--empty' : '', className]
        .filter(Boolean)
        .join(' ')}
      aria-busy={uploading || undefined}
    >
      {hasFiles ? (
        <div className="file-attachment-list file-select-field__names">
          {fileNames!.map((name, i) => (
            <FileAttachmentRow
              key={`${i}-${name}`}
              fileName={name}
              removeLabel={`${name} 업로드 취소`}
              onRemove={canRemove ? () => onRemoveFile?.(i) : undefined}
            />
          ))}
        </div>
      ) : (
        <FileAttachmentEmpty />
      )}

      <div className="file-upload-actions file-select-field__actions">
        <span className="file-upload-picker">
          {!fieldDisabled ? (
            <input
              ref={inputRef}
              type="file"
              multiple={multiple}
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
            disabled={fieldDisabled}
            tabIndex={fieldDisabled ? undefined : -1}
            onClick={() => openFilePicker(inputRef.current)}
          >
            {buttonLabel}
          </CmsButton>
        </span>
        <FileUploadGuide lines={guideLines} className="file-select-field__guide" />
      </div>
    </div>
  )
}
