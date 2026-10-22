import { useRef, type ChangeEvent, type CSSProperties } from 'react'
import { openFilePicker } from '@/shared/lib/open-file-picker'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  FileAttachmentEmpty,
  FileAttachmentRow,
  FileUploadGuide,
} from '@/shared/ui/file-attachment-row'
import {
  FILE_SELECT_MAX_TOTAL_BYTES,
  FILE_SELECT_TOTAL_SIZE_GUIDE_LINE,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
} from '@/shared/ui/file-select-field-limits'
import './paragraph-file-upload.css'

export interface ParagraphFileUploadProps {
  /** input accept — 케이스별 */
  accept?: string
  /**
   * 다중 파일 선택. 기본 `true`(공통).
   * 썸네일 등 단건만 `false`.
   */
  multiple?: boolean
  disabled?: boolean
  buttonLabel?: string
  /** 안내 문구 — 케이스별(확장자 등). 기본 안내에는 총 15MB 포함 */
  guideLines?: string[]
  className?: string
  style?: CSSProperties
  /** 이번 선택분. 목록 누적은 호출측 `fileNames`로 관리 */
  onFilesChange?: (files: File[]) => void
  /** 첨부된 파일명 목록 — 전달 시 버튼 위에 파일 칩으로 노출 */
  fileNames?: string[]
  /** 칩의 X 클릭 핸들러 — 미전달 시 X 비노출(읽기 전용 칩) */
  onRemoveFile?: (index: number) => void
  /** 이미 첨부된 파일 합계(byte) */
  currentTotalBytes?: number
  /** 첨부 합계 상한(byte). 기본 15MB. `0`이면 용량 검사 생략 */
  maxTotalBytes?: number
}

const DEFAULT_GUIDE_LINES = [
  FILE_SELECT_TOTAL_SIZE_GUIDE_LINE,
  '- JPG, PNG 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

/** 단일항목 단락용 파일 업로드 안내 + 파일 추가 버튼 (옵셔널: 첨부 파일 칩 노출) */
export function ParagraphFileUpload({
  accept,
  multiple = true,
  disabled = false,
  buttonLabel = '파일 추가',
  guideLines = DEFAULT_GUIDE_LINES,
  className,
  style,
  onFilesChange,
  fileNames,
  onRemoveFile,
  currentTotalBytes = 0,
  maxTotalBytes = FILE_SELECT_MAX_TOTAL_BYTES,
}: ParagraphFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files?.length) {
      const incoming = Array.from(files)
      if (
        maxTotalBytes > 0 &&
        isFileSelectTotalSizeExceeded({
          incoming,
          currentTotalBytes,
          maxTotalBytes,
        })
      ) {
        notifyFileSelectTotalSizeExceeded()
      } else {
        onFilesChange?.(incoming)
      }
    }
    event.target.value = ''
  }

  const hasFiles = Array.isArray(fileNames) && fileNames.length > 0
  const interactionLocked = disabled

  return (
    <div
      className={[
        'paragraph-file-upload',
        interactionLocked ? 'paragraph-file-upload--locked' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {!interactionLocked ? (
        <input
          ref={inputRef}
          type="file"
          className="paragraph-file-upload__input"
          accept={accept}
          multiple={multiple}
          aria-label={buttonLabel}
          onChange={handleChange}
        />
      ) : null}

      {hasFiles ? (
        <div className="file-attachment-list paragraph-file-upload__files">
          {fileNames!.map((name, index) => (
            <FileAttachmentRow
              key={`${index}-${name}`}
              fileName={name}
              onRemove={
                onRemoveFile && !interactionLocked
                  ? event => {
                      event.stopPropagation()
                      onRemoveFile(index)
                    }
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <FileAttachmentEmpty />
      )}

      <div className="file-upload-actions paragraph-file-upload__content">
        <CmsButton
          variant="secondary"
          size="h32"
          type="button"
          aria-disabled={interactionLocked || undefined}
          onClick={() => {
            if (interactionLocked) return
            openFilePicker(inputRef.current)
          }}
        >
          {buttonLabel}
        </CmsButton>
        <FileUploadGuide lines={guideLines} className="paragraph-file-upload__guide" />
      </div>
    </div>
  )
}
