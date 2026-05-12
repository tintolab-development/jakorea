import { useRef, type ChangeEvent, type CSSProperties } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { ItemDeleteButton } from '@/features/template/ui/paragraph/shared/item-delete-button'
import './paragraph-file-upload.css'

export interface ParagraphFileUploadProps {
  accept?: string
  multiple?: boolean
  disabled?: boolean
  buttonLabel?: string
  guideLines?: string[]
  className?: string
  style?: CSSProperties
  onFilesChange?: (files: File[]) => void
  /** 첨부된 파일명 목록 — 전달 시 버튼 위에 파일 칩으로 노출 */
  fileNames?: string[]
  /** 칩의 X 클릭 핸들러 — 미전달 시 X 비노출(읽기 전용 칩) */
  onRemoveFile?: (index: number) => void
}

function getFileTypeLabel(name: string): string {
  const idx = name.lastIndexOf('.')
  if (idx <= 0 || idx === name.length - 1) return 'FILE'
  const ext = name.slice(idx + 1).toLowerCase()
  if (ext === 'jpeg') return 'JPG'
  return ext.toUpperCase()
}

function FilePreviewIcon({ label }: { label: string }) {
  const fontSize = label.length >= 4 ? 4 : 5
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12.8714 3.59961H7C6.44771 3.59961 6 4.04732 6 4.59961V18.7996C6 19.3519 6.44772 19.7996 7 19.7996H16.8385C17.3907 19.7996 17.8385 19.3519 17.8385 18.7996V8.38885C17.8385 8.11568 17.7267 7.85441 17.5292 7.66573L13.5622 3.87649C13.3761 3.69877 13.1287 3.59961 12.8714 3.59961Z"
        fill="#3D3D3D"
      />
      <text
        x="12"
        y="17.6"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        fill="#FFFFFF"
        fontFamily="Pretendard, system-ui, sans-serif"
      >
        {label}
      </text>
    </svg>
  )
}

/** 단일항목 단락용 파일 업로드 안내 + 파일 추가 버튼 (옵셔널: 첨부 파일 칩 노출) */
export function ParagraphFileUpload({
  accept,
  multiple = false,
  disabled = false,
  buttonLabel = '파일 추가',
  guideLines = [
    '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
    '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
  ],
  className,
  style,
  onFilesChange,
  fileNames,
  onRemoveFile,
}: ParagraphFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files?.length) {
      onFilesChange?.(Array.from(files))
    }
    event.target.value = ''
  }

  const hasFiles = Array.isArray(fileNames) && fileNames.length > 0

  return (
    <div
      className={['paragraph-file-upload', className].filter(Boolean).join(' ')}
      style={style}
    >
      {!disabled ? (
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
        <div className="paragraph-file-upload__files">
          {fileNames!.map((name, index) => (
            <span
              key={`${index}-${name}`}
              className="paragraph-file-upload__file-chip"
            >
              <FilePreviewIcon label={getFileTypeLabel(name)} />
              <span className="paragraph-file-upload__file-name">{name}</span>
              {onRemoveFile ? (
                <ItemDeleteButton
                  className="item-delete-button paragraph-file-upload__file-remove"
                  aria-label={`${name} 삭제`}
                  onClick={event => {
                    event.stopPropagation()
                    onRemoveFile(index)
                  }}
                />
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      <div className="paragraph-file-upload__content">
        <CmsButton
          variant="secondary"
          size="medium"
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </CmsButton>

        {guideLines.length > 0 ? (
          <div className="paragraph-file-upload__guide">
            {guideLines.map((line, index) => (
              <span key={`${index}-${line}`} className="paragraph-file-upload__guide-line">
                {line}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
