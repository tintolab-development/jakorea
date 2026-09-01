/**
 * 파일 선택 필드 공통 컴포넌트 (디자인 시스템)
 * - hidden input + 파일명 목록(삭제 X 버튼) + "파일 선택" 버튼 + 가이드 텍스트
 * - 기본 다중 선택(`multiple=true`). accept·가이드 문구는 케이스별 props
 * - 첨부 합계 기본 최대 15MB (`maxTotalBytes` / `currentTotalBytes`)
 * - disabled 시 버튼 비활성화, input 미렌더, 삭제 버튼 미표시
 */

import { useRef, type ChangeEvent } from 'react'
import './file-select-field.css'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  FILE_SELECT_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
} from '@/shared/ui/file-select-field-limits'

function RemoveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <g opacity="0.6">
        <mask
          id="mask0_859_28883"
          style={{ maskType: 'alpha' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="20"
          height="20"
        >
          <rect width="20" height="20" fill="#D9D9D9" />
        </mask>
        <g mask="url(#mask0_859_28883)">
          <path
            d="M10.0001 10.774L12.5609 13.3351C12.6763 13.4504 12.804 13.5059 12.944 13.5017C13.0839 13.4974 13.2142 13.4349 13.3351 13.3142C13.4558 13.1934 13.5161 13.0644 13.5161 12.9272C13.5161 12.7899 13.4558 12.6609 13.3351 12.5401L10.774 10.0001L13.3351 7.43925C13.4504 7.32383 13.5094 7.19612 13.5122 7.05612C13.5148 6.91626 13.4558 6.78591 13.3351 6.66508C13.2142 6.54439 13.0852 6.48404 12.948 6.48404C12.8108 6.48404 12.6817 6.54439 12.5609 6.66508L10.0001 9.22612L7.43925 6.66508C7.32383 6.5498 7.1996 6.49078 7.06654 6.488C6.93362 6.48536 6.80675 6.54439 6.68591 6.66508C6.56522 6.78591 6.50487 6.91494 6.50487 7.05217C6.50487 7.18939 6.56522 7.31842 6.68591 7.43925L9.22612 10.0001L6.66508 12.5609C6.5498 12.6763 6.49425 12.8006 6.49841 12.9336C6.50272 13.0665 6.56522 13.1934 6.68591 13.3142C6.80675 13.4349 6.93578 13.4953 7.073 13.4953C7.21022 13.4953 7.33925 13.4349 7.46008 13.3142L10.0001 10.774ZM10.0015 17.5834C8.9621 17.5834 7.98147 17.3861 7.05966 16.9913C6.13786 16.5966 5.33105 16.0535 4.63925 15.362C3.94744 14.6704 3.40404 13.864 3.00904 12.9426C2.61418 12.0212 2.41675 11.0408 2.41675 10.0015C2.41675 8.94821 2.61411 7.96411 3.00883 7.04925C3.40355 6.13439 3.94668 5.33105 4.63821 4.63925C5.32973 3.94744 6.13619 3.40404 7.05758 3.00904C7.97897 2.61418 8.95932 2.41675 9.99862 2.41675C11.052 2.41675 12.0361 2.61411 12.9509 3.00883C13.8658 3.40355 14.6691 3.94668 15.3609 4.63821C16.0527 5.32973 16.5961 6.13272 16.9911 7.04716C17.386 7.96161 17.5834 8.94543 17.5834 9.99862C17.5834 11.0381 17.3861 12.0187 16.9913 12.9405C16.5966 13.8623 16.0535 14.6691 15.362 15.3609C14.6704 16.0527 13.8674 16.5961 12.953 16.9911C12.0386 17.386 11.0547 17.5834 10.0015 17.5834Z"
            fill="#1C1B1F"
          />
        </g>
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
  /** 안내 문구 줄 목록 — 케이스별(확장자 등). 용량은 공통 총 15MB 정책 */
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
  /** 첨부 합계 상한(byte). 기본 15MB. `0`이면 용량 검사 생략 */
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
  buttonLabel = '파일 선택',
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
        notifyFileSelectTotalSizeExceeded()
      } else {
        onFilesChange?.(incoming)
      }
    }
    e.target.value = ''
  }

  const canRemove = !disabled && typeof onRemoveFile === 'function'
  const hasFiles = Boolean(fileNames && fileNames.length > 0)
  const showNames = hasFiles || uploading

  return (
    <div
      className={[
        'file-select-field',
        !showNames ? 'file-select-field--empty' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
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

      {showNames ? (
        <div className="file-select-field__names">
          {uploading ? (
            <span className="file-select-field__name-row">
              <span className="file-select-field__name file-select-field__name--uploading">
                파일을 업로드중입니다
              </span>
            </span>
          ) : (
            fileNames!.map((name, i) => (
              <span key={`${i}-${name}`} className="file-select-field__name-row">
                <span className="file-select-field__name">{name}</span>
                {canRemove && (
                  <button
                    type="button"
                    className="file-select-field__remove"
                    onClick={() => onRemoveFile?.(i)}
                    aria-label={`${name} 업로드 취소`}
                  >
                    <RemoveIcon />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
      ) : null}

      <div className="file-select-field__actions">
        <CmsButton
          type="button"
          variant="secondary"
          size="medium"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </CmsButton>
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
