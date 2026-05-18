import { useEffect, useId, useRef } from 'react'
import './cms-input-iconclick.css'

interface CmsInputIconClickProps {
  value: string
  editing: boolean
  onChange: (next: string) => void
  onRequestEdit: () => void
  onCommitEdit: () => void
  restoreValueIfEmptyOnBlur?: string
  inputAriaLabel?: string
  editButtonAriaLabel?: string
  containerClassName?: string
  inputClassName?: string
  textClassName?: string
  editButtonClassName?: string
  /** true면 제목 텍스트만 표시하고 연필 버튼·편집 입력을 쓰지 않음(템플릿 사용자 모드 등) */
  readOnly?: boolean
}

export function CmsInputIconClick({
  value,
  editing,
  onChange,
  onRequestEdit,
  onCommitEdit,
  restoreValueIfEmptyOnBlur = '',
  inputAriaLabel,
  editButtonAriaLabel,
  containerClassName,
  inputClassName,
  textClassName,
  editButtonClassName,
  readOnly = false,
}: CmsInputIconClickProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const iconMaskId = `cms-input-iconclick-title-mask-${useId().replace(/:/g, '')}`
  const join = (...names: Array<string | undefined>) => names.filter(Boolean).join(' ')

  useEffect(() => {
    if (readOnly) return
    if (!editing) return
    const id = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(id)
  }, [readOnly, editing])

  const handleBlur = () => {
    if (value.trim() === '' && restoreValueIfEmptyOnBlur !== '') {
      onChange(restoreValueIfEmptyOnBlur)
    }
    onCommitEdit()
  }

  return (
    <div
      className={join(
        'cms-input-iconclick',
        readOnly ? 'cms-input-iconclick--read-only' : undefined,
        containerClassName
      )}
    >
      {readOnly ? (
        <span className={join('cms-input-iconclick__text', textClassName)}>{value}</span>
      ) : editing ? (
        <input
          ref={inputRef}
          type="text"
          className={join(
            'cms-input-iconclick__input',
            editing ? 'cms-input-iconclick__input--editing' : undefined,
            inputClassName
          )}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleBlur()
            }
          }}
          aria-label={inputAriaLabel ?? '텍스트 입력'}
        />
      ) : (
        <span className={join('cms-input-iconclick__text', textClassName)}>{value}</span>
      )}
      {!readOnly ? (
        <button
          type="button"
          className={join('cms-input-iconclick__edit-btn', editButtonClassName)}
          onClick={onRequestEdit}
          aria-label={editButtonAriaLabel ?? '텍스트 수정'}
          aria-disabled={editing}
          tabIndex={editing ? -1 : 0}
          style={editing ? { pointerEvents: 'none' } : undefined}
        >
          <svg
            className="cms-input-iconclick__icon"
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <g opacity="0.4">
              <mask
                id={iconMaskId}
                style={{ maskType: 'alpha' }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="28"
                height="28"
              >
                <rect width="28" height="28" fill="#D9D9D9" />
              </mask>
              <g mask={`url(#${iconMaskId})`}>
                <path
                  d="M4.08301 27.9997C3.60584 27.9997 3.19488 27.8292 2.85013 27.4881C2.50538 27.1471 2.33301 26.7343 2.33301 26.2497C2.33301 25.7725 2.50538 25.3616 2.85013 25.0168C3.19488 24.6721 3.60584 24.4997 4.08301 24.4997H23.9163C24.3935 24.4997 24.8045 24.6702 25.1492 25.0113C25.494 25.3523 25.6663 25.7651 25.6663 26.2497C25.6663 26.7269 25.494 27.1378 25.1492 27.4826C24.8045 27.8273 24.3935 27.9997 23.9163 27.9997H4.08301ZM6.99967 19.1488H8.44226L18.1256 9.48324L17.3921 8.73861L16.6652 8.02286L6.99967 17.7062V19.1488ZM5.24967 19.8441V17.4011C5.24967 17.2605 5.2732 17.1267 5.32026 16.9995C5.36751 16.8723 5.44567 16.7541 5.55476 16.6448L18.3277 3.90132C18.4967 3.73235 18.6885 3.6045 18.9032 3.51778C19.1176 3.43106 19.3393 3.3877 19.5682 3.3877C19.8046 3.3877 20.0294 3.43106 20.2425 3.51778C20.4556 3.6045 20.6527 3.73838 20.8337 3.9194L22.2358 5.33953C22.4168 5.5085 22.5476 5.70139 22.6283 5.9182C22.7092 6.1352 22.7497 6.36182 22.7497 6.59807C22.7497 6.81507 22.7092 7.03081 22.6283 7.24528C22.5476 7.45995 22.4168 7.65779 22.2358 7.83882L9.49226 20.5823C9.38298 20.6916 9.26486 20.7716 9.13788 20.8224C9.01072 20.8733 8.87684 20.8988 8.73626 20.8988H6.30434C6.00354 20.8988 5.75261 20.7982 5.55155 20.5969C5.3503 20.3958 5.24967 20.1449 5.24967 19.8441ZM18.1256 9.48324L17.3921 8.73861L16.6652 8.02286L18.1256 9.48324Z"
                  fill="#3D3D3D"
                />
              </g>
            </g>
          </svg>
        </button>
      ) : null}
    </div>
  )
}
