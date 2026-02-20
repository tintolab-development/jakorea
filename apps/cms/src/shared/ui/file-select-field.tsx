/**
 * 파일 선택 필드 공통 컴포넌트
 * - hidden input + 파일명 목록(삭제 X 버튼) + "파일 선택" 버튼 + 가이드 텍스트
 * - disabled 시 버튼 비활성화, input 미렌더, 삭제 버튼 미표시
 */

import { useRef, type ChangeEvent } from 'react'
import { Button } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import './file-select-field.css'

export interface FileSelectFieldProps {
  /** input accept 속성 (예: ".jpg,.png,.pdf") */
  accept?: string
  /** 다중 파일 선택 허용 */
  multiple?: boolean
  /** 비활성화 (버튼 비활성화, input 미렌더, 삭제 버튼 미표시) */
  disabled?: boolean
  /** 표시할 파일명 목록 */
  fileNames?: string[]
  /** 안내 문구 줄 목록 */
  guideLines?: string[]
  /** 파일 선택 시 콜백 */
  onFilesChange?: (files: File[]) => void
  /** 특정 인덱스 파일 업로드 취소(삭제) 시 콜백 — 전달 시 해당 파일 옆에 X 버튼 표시 */
  onRemoveFile?: (index: number) => void
  /** 버튼에 표시할 텍스트 (기본: "파일 선택") */
  buttonLabel?: string
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
  onRemoveFile,
  buttonLabel = '파일 선택',
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

  const canRemove = !disabled && typeof onRemoveFile === 'function'

  return (
    <div className={`file-select-field ${className}`.trim()}>
      {!disabled && (
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="file-select-field__input"
          aria-label={buttonLabel}
          onChange={handleChange}
        />
      )}

      {fileNames && fileNames.length > 0 && (
        <div className="file-select-field__names">
          {fileNames.map((name, i) => (
            <span key={`${i}-${name}`} className="file-select-field__name-row">
              <span className="file-select-field__name">{name}</span>
              {canRemove && (
                <button
                  type="button"
                  className="file-select-field__remove"
                  onClick={() => onRemoveFile?.(i)}
                  aria-label={`${name} 업로드 취소`}
                >
                  <CloseOutlined />
                </button>
              )}
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
          {buttonLabel}
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
