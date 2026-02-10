/**
 * 파일 선택 필드 공통 컴포넌트
 * - hidden input + 파일명 목록 + "파일 선택" 버튼 + 가이드 텍스트
 * - disabled 시 버튼만 표시 (input 미렌더)
 */

import { useRef, type ChangeEvent } from 'react'
import { Button } from 'antd'
import './file-select-field.css'

export interface FileSelectFieldProps {
  /** input accept 속성 (예: ".jpg,.png,.pdf") */
  accept?: string
  /** 다중 파일 선택 허용 */
  multiple?: boolean
  /** 비활성화 (버튼만 표시, input 미렌더) */
  disabled?: boolean
  /** 표시할 파일명 목록 */
  fileNames?: string[]
  /** 안내 문구 줄 목록 */
  guideLines?: string[]
  /** 파일 선택 시 콜백 */
  onFilesChange?: (files: File[]) => void
  /** 추가 클래스명 */
  className?: string
}

export function FileSelectField({
  accept,
  multiple = false,
  disabled = false,
  fileNames,
  guideLines,
  onFilesChange,
  className = '',
}: FileSelectFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) {
      onFilesChange?.(Array.from(files))
    }
    e.target.value = ''
  }

  return (
    <div className={`file-select-field ${className}`.trim()}>
      {!disabled && (
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="file-select-field__input"
          aria-label="파일 선택"
          onChange={handleChange}
        />
      )}

      {fileNames && fileNames.length > 0 && (
        <div className="file-select-field__names">
          {fileNames.map((name, i) => (
            <span key={i} className="file-select-field__name">
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="file-select-field__actions">
        <Button
          type="default"
          disabled={disabled}
          className="file-select-field__btn"
          onClick={() => inputRef.current?.click()}
        >
          파일 선택
        </Button>
        {guideLines && guideLines.length > 0 && (
          <div className="file-select-field__guide">
            {guideLines.map((line, i) => (
              <span key={i} className="file-select-field__guide-line">
                {line}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
