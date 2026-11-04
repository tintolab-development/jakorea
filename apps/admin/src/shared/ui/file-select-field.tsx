/**
 * 파일 선택 필드 공통 컴포넌트 (디자인 시스템)
 * - hidden input + 파일명 목록(삭제 X 버튼) / 「첨부된 파일이 없습니다.」 + 「파일 추가」(h32) + 가이드
 * - 기본 다중 선택(`multiple=true`). accept·가이드 문구는 케이스별 props
 * - 첨부 합계는 `maxTotalBytes` / `currentTotalBytes` (운영 화면은 20MB 또는 100MB를 명시)
 * - disabled 시 버튼 비활성화, input 미렌더, 삭제 버튼 미표시
 */

import { useId, useRef, type ChangeEvent } from 'react'
import './file-select-field.css'

/** Figma Table/Common/Cell/File — 모달 td 이미지 추가 영역 */
export const FILE_SELECT_IMAGE_CELL_CLASS = 'file-select-image-cell'
export const FILE_SELECT_IMAGE_CELL_PREVIEW_CLASS = 'file-select-image-cell__preview'
import { CmsButton } from '@/shared/ui/cms-button'
import { openFilePicker } from '@/shared/lib/open-file-picker'
import {
  FILE_SELECT_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
} from '@/shared/ui/file-select-field-limits'

function RemoveIcon() {
  const maskId = `file-select-remove-${useId().replace(/:/g, '')}`
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
    >
      <mask
        id={maskId}
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="18"
        height="18"
      >
        <rect width="18" height="18" fill="#D9D9D9" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M9 9.79031L11.3048 12.0952C11.4086 12.199 11.5392 12.2521 11.6964 12.2546C11.8536 12.257 11.9865 12.2039 12.0953 12.0952C12.2039 11.9865 12.2582 11.8548 12.2582 11.7C12.2582 11.5452 12.2039 11.4135 12.0953 11.3048L9.79031 9L12.0953 6.69525C12.199 6.59138 12.2521 6.46081 12.2546 6.30356C12.257 6.14644 12.2039 6.0135 12.0953 5.90475C11.9865 5.79612 11.8548 5.74181 11.7 5.74181C11.5452 5.74181 11.4135 5.79612 11.3048 5.90475L9 8.20969L6.69525 5.90475C6.59137 5.801 6.46081 5.74787 6.30356 5.74537C6.14644 5.743 6.0135 5.79612 5.90475 5.90475C5.79613 6.0135 5.74181 6.14525 5.74181 6.3C5.74181 6.45475 5.79613 6.5865 5.90475 6.69525L8.20969 9L5.90475 11.3048C5.801 11.4086 5.74788 11.5392 5.74538 11.6964C5.743 11.8536 5.79613 11.9865 5.90475 12.0952C6.0135 12.2039 6.14525 12.2582 6.3 12.2582C6.45475 12.2582 6.5865 12.2039 6.69525 12.0952L9 9.79031ZM9.00131 16.125C8.01581 16.125 7.0895 15.938 6.22237 15.564C5.35525 15.19 4.601 14.6824 3.95962 14.0413C3.31825 13.4002 2.81044 12.6463 2.43619 11.7795C2.06206 10.9128 1.875 9.98669 1.875 9.00131C1.875 8.01581 2.062 7.0895 2.436 6.22237C2.81 5.35525 3.31756 4.601 3.95869 3.95962C4.59981 3.31825 5.35375 2.81044 6.2205 2.43619C7.08725 2.06206 8.01331 1.875 8.99869 1.875C9.98419 1.875 10.9105 2.062 11.7776 2.436C12.6448 2.81 13.399 3.31756 14.0404 3.95869C14.6818 4.59981 15.1896 5.35375 15.5638 6.2205C15.9379 7.08725 16.125 8.01331 16.125 8.99869C16.125 9.98419 15.938 10.9105 15.564 11.7776C15.19 12.6448 14.6824 13.399 14.0413 14.0404C13.4002 14.6818 12.6463 15.1896 11.7795 15.5638C10.9128 15.9379 9.98669 16.125 9.00131 16.125Z"
          fill="#BDC6C9"
        />
      </g>
    </svg>
  )
}

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
  /** 안내 문구 줄 목록 — 케이스별(확장자·용량 등) */
  guideLines?: readonly string[]
  /** 파일 선택 시 콜백 (이번 선택분). 목록 누적은 호출측에서 `fileNames`로 관리 */
  onFilesChange?: (files: File[]) => void
  /** 특정 인덱스 파일 업로드 취소(삭제) 시 콜백 — 전달 시 해당 파일 옆에 X 버튼 표시 */
  onRemoveFile?: (index: number) => void
  /** 버튼에 표시할 텍스트 (기본: "파일 선택") */
  buttonLabel?: string
  /** 업로드 중일 때 true — 파일명 영역에 "파일을 업로드중입니다" 표시하여 UI shifting 방지 */
  uploading?: boolean
  /** 추가 클래스명 */
  className?: string
  /**
   * 이미 첨부된 파일 합계(byte). 여러 번 선택해 누적할 때 전달.
   * 미전달 시 이번 선택분만 `maxTotalBytes`와 비교.
   */
  currentTotalBytes?: number
  /** 첨부 합계 상한(byte). 기본은 레거시 15MB. 운영 화면은 20MB/100MB를 명시. `0`이면 용량 검사 생략 */
  maxTotalBytes?: number
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
}: FileSelectFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
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
        notifyFileSelectTotalSizeExceeded(maxTotalBytes)
      } else {
        onFilesChange?.(incoming)
      }
    }
    e.target.value = ''
  }

  const canRemove = !disabled && typeof onRemoveFile === 'function'
  const hasFiles = Boolean(fileNames && fileNames.length > 0)

  return (
    <div
      className={['file-select-field', !hasFiles ? 'file-select-field--empty' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {uploading ? (
        <div className="file-select-field__names">
          <span className="file-select-field__name-row">
            <span className="file-select-field__name file-select-field__name--uploading">
              파일을 업로드중입니다
            </span>
          </span>
        </div>
      ) : hasFiles ? (
        <div className="file-select-field__names">
          {fileNames!.map((name, i) => (
            <span key={`${i}-${name}`} className="file-select-field__name-row">
              <span className="file-select-field__name">{name}</span>
              {canRemove ? (
                <button
                  type="button"
                  className="file-select-field__remove"
                  onClick={() => onRemoveFile?.(i)}
                  aria-label={`${name} 업로드 취소`}
                >
                  <RemoveIcon />
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : (
        <span className="file-select-field__empty">첨부된 파일이 없습니다.</span>
      )}

      <div className="file-select-field__actions">
        <span className="file-upload-picker">
          {!disabled ? (
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
            size="medium"
            disabled={disabled}
            tabIndex={disabled ? undefined : -1}
            onClick={() => openFilePicker(inputRef.current)} >
            {buttonLabel}
          </CmsButton>
        </span>
        {guideLines && guideLines.length > 0 ? (
          <div className="file-select-field__guide">
            {guideLines.map((line, i) => (
              <span key={i} className="file-select-field__guide-line">
                {line}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
