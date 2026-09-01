import { useRef, type ChangeEvent, type CSSProperties } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
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

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  if (idx <= 0 || idx === name.length - 1) return ''
  return name.slice(idx + 1).toLowerCase()
}

function FilePreviewIcon({ fileName }: { fileName: string }) {
  const extension = getFileExtension(fileName)

  if (extension === 'pdf') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 12 17"
        fill="none"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1 0H6.87144C7.12872 0 7.37611 0.0991646 7.56216 0.276875L11.5292 4.06612C11.7267 4.2548 11.8385 4.51607 11.8385 4.78924V15.2C11.8385 15.7523 11.3907 16.2 10.8385 16.2H1C0.447715 16.2 0 15.7523 0 15.2V1C0 0.447715 0.447715 0 1 0ZM5.64074 2.43671C5.64074 2.32985 5.62744 2.25778 5.61242 2.21308C5.60626 2.19476 5.59914 2.1832 5.5943 2.17534L5.59289 2.17304L5.58974 2.17406L5.58703 2.17499C5.55672 2.21626 5.51938 2.31301 5.53039 2.52265C5.53725 2.65246 5.56169 2.80266 5.60168 2.96796C5.6265 2.7827 5.64073 2.60498 5.64074 2.43671ZM3.33117 8.0705C3.13943 8.16658 3.01292 8.2491 2.94934 8.31269C2.83756 8.42449 2.80361 8.50605 2.79504 8.54511C2.79628 8.54508 2.79759 8.54513 2.79897 8.54521C2.80003 8.54528 2.80113 8.54537 2.80227 8.54546C2.80752 8.54587 2.81358 8.54635 2.82043 8.54511C2.86804 8.53646 2.94871 8.5027 3.04406 8.40741C3.12789 8.32358 3.2245 8.20936 3.33117 8.0705ZM5.71398 4.8664C5.55538 5.29588 5.3741 5.72225 5.18078 6.12519C5.05385 6.38974 4.91982 6.64718 4.78527 6.89374C5.41114 6.70398 6.09151 6.52534 6.72668 6.38202C6.55843 6.19689 6.38457 5.97824 6.21105 5.71796C6.05136 5.4784 5.8789 5.18456 5.71398 4.8664ZM6.24133 2.43671C6.2413 2.93036 6.14053 3.47854 5.98254 4.0412C6.20486 4.54274 6.47402 5.03184 6.71008 5.38593C6.96228 5.76419 7.20557 6.03757 7.42492 6.23554C7.82129 6.16204 8.13765 6.15047 8.38391 6.18866C8.63842 6.22817 8.85944 6.32717 8.98547 6.50702C9.12398 6.70478 9.10462 6.94211 8.97766 7.11347C8.85868 7.27397 8.66296 7.35966 8.45617 7.36151L8.45324 7.36249H8.43762C8.4248 7.36244 8.40774 7.36177 8.38781 7.36054C8.34797 7.35806 8.29403 7.35236 8.22863 7.34003C8.09749 7.31527 7.92028 7.26344 7.71105 7.15937C7.57344 7.09091 7.42417 6.99954 7.26574 6.88007C6.45382 7.04988 5.51692 7.28733 4.71008 7.54315C4.60783 7.57558 4.50851 7.60989 4.41171 7.64333L4.33117 7.67108C4.01167 8.18139 3.70791 8.59318 3.46887 8.83222C3.15848 9.14247 2.6965 9.27517 2.38391 9.00116C2.22648 8.86316 2.1672 8.65837 2.20129 8.45331C2.23416 8.2557 2.35051 8.06388 2.52551 7.88886C2.69867 7.7157 2.99434 7.55641 3.32336 7.41229C3.50728 7.33174 3.71324 7.25071 3.93469 7.17108C4.16809 6.78454 4.41197 6.3402 4.63977 5.86542C4.91967 5.28201 5.16804 4.67001 5.34777 4.08319C5.28315 3.92794 5.2228 3.77284 5.17004 3.6203C5.04153 3.24876 4.94772 2.87594 4.93078 2.5539C4.91473 2.24843 4.96448 1.89243 5.2384 1.67987L5.26086 1.66229L5.28723 1.64862C5.48713 1.54857 5.75573 1.51971 5.97375 1.70331C6.17117 1.86959 6.24133 2.14351 6.24133 2.43671ZM1.61973 14.5386H2.33356V13.32H2.95222C3.74696 13.32 4.20381 12.8063 4.20381 12.0601C4.20381 11.3243 3.7541 10.8002 2.97126 10.8002H1.61973V14.5386ZM2.33356 12.6952V11.4353H2.83801C3.26155 11.4379 3.46856 11.6883 3.46618 12.0601C3.46856 12.4371 3.26155 12.6952 2.83801 12.6952H2.33356ZM5.86943 14.5386C6.92115 14.5386 7.55646 13.8338 7.55408 12.6643C7.55646 11.4999 6.92115 10.8002 5.88371 10.8002H4.65591V14.5386H5.86943ZM5.36975 13.8725V11.4663H5.84564C6.49761 11.4663 6.84025 11.8252 6.84025 12.6643C6.84025 13.5033 6.49761 13.8725 5.84088 13.8725H5.36975ZM8.78664 14.5386H8.0728V10.8002H10.3428V11.4405H8.78664V12.3493H10.1953V12.9896H8.78664V14.5386Z"
          fill="#3D3D3D"
        />
      </svg>
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 12 17"
      fill="none"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.87144 0H1C0.447715 0 0 0.447715 0 1V15.2C0 15.7523 0.447715 16.2 1 16.2H10.8385C11.3907 16.2 11.8385 15.7523 11.8385 15.2V4.78924C11.8385 4.51608 11.7267 4.2548 11.5292 4.06612L7.56216 0.276876C7.37611 0.0991649 7.12872 0 6.87144 0ZM3.30233 4.68554C3.73592 4.68554 4.08741 4.33405 4.08741 3.90046C4.08741 3.46688 3.73592 3.11538 3.30233 3.11538C2.86875 3.11538 2.51725 3.46688 2.51725 3.90046C2.51725 4.33405 2.86875 4.68554 3.30233 4.68554ZM7.53761 4.7746L9.88812 7.90862C10.0859 8.17231 9.89774 8.54862 9.56812 8.54862H2.82622C2.49082 8.54862 2.30435 8.16064 2.51387 7.89874L3.80833 6.28067C3.95726 6.0945 4.23494 6.07913 4.40352 6.2477L4.81826 6.66245C4.98684 6.83103 5.26453 6.81565 5.41346 6.62949L6.90526 4.76473C7.06861 4.56054 7.38072 4.56542 7.53761 4.7746ZM9.23631 11.8133H9.93673C9.84457 11.0973 9.26626 10.5923 8.51284 10.5923C7.6327 10.5923 6.95531 11.2857 6.95531 12.4666C6.95531 13.6172 7.59123 14.3308 8.52666 14.3308C9.36764 14.3308 9.96899 13.7479 9.96899 12.7932V12.3409H8.57735V12.9087H9.30082C9.2916 13.366 9.00821 13.66 8.53127 13.6625C7.99904 13.66 7.66035 13.2253 7.66035 12.4565C7.66035 11.6927 8.01056 11.2631 8.52666 11.2606C8.8907 11.2631 9.14184 11.4717 9.23631 11.8133ZM3.13582 10.6425V13.1801C3.13582 13.5368 2.99066 13.7228 2.7257 13.7228C2.47686 13.7228 2.31558 13.5544 2.31097 13.2655H1.61976C1.61746 13.984 2.08979 14.3308 2.69344 14.3308C3.36392 14.3308 3.82242 13.8861 3.82242 13.1801V10.6425H3.13582ZM4.98437 14.2805H4.29316V10.6425H5.60185C6.35988 10.6425 6.79534 11.1526 6.79534 11.8686C6.79534 12.5947 6.35297 13.0947 5.58342 13.0947H4.98437V14.2805ZM4.98437 11.2606V12.4867H5.47283C5.88295 12.4867 6.0834 12.2354 6.08109 11.8686C6.0834 11.5068 5.88295 11.2631 5.47283 11.2606H4.98437Z"
        fill="#3D3D3D"
      />
    </svg>
  )
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
              <FilePreviewIcon fileName={name} />
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
