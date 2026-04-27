import { useRef, type ChangeEvent } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import './paragraph-file-upload.css'

export interface ParagraphFileUploadProps {
  accept?: string
  multiple?: boolean
  disabled?: boolean
  buttonLabel?: string
  guideLines?: string[]
  className?: string
  onFilesChange?: (files: File[]) => void
}

/** 단일항목 단락용 파일 업로드 안내 + 파일 추가 버튼 */
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
  onFilesChange,
}: ParagraphFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files?.length) {
      onFilesChange?.(Array.from(files))
    }
    event.target.value = ''
  }

  return (
    <div className={['paragraph-file-upload', className].filter(Boolean).join(' ')}>
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
