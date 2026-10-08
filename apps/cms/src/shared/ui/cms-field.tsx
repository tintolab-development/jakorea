/**
 * CMS 입력형 컴포넌트 공통 프레임 — 상단 라벨(+필수) / 컨트롤 박스 / 하단 메세지
 * - 라벨 ↔ 박스 ↔ 메세지 간격 6px, 사이즈별 수치는 `.cms-control--{size}` 변수
 * - 에러 상태에서 표시할 문구가 없으면 메세지 영역을 렌더하지 않는다
 * - disabled 이면 error 스타일보다 disabled 가 우선한다
 */

import { useContext } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { FormItemInputContext } from 'antd/es/form/context'
import type { CmsControlSize } from './cms-control-size'
import { FieldDeleteIcon } from './icons/FieldIcons'
import './cms-field.css'

export interface CmsFieldProps {
  /** 박스 상단 라벨(선택) */
  label?: ReactNode
  /** 라벨 옆 필수 표시(*) */
  required?: boolean
  /** 박스 하단 메세지(안내/에러, 선택) */
  message?: ReactNode
  /** 에러 상태(테두리·메세지 색) */
  error?: boolean
}

export function cmsControlSizeClass(size: CmsControlSize): string {
  return `cms-control--${size}`
}

export function hasCmsFieldNode(node: ReactNode): boolean {
  return node != null && node !== '' && node !== false
}

export function joinCmsClassNames(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ')
}

/**
 * 라벨/메세지 프레임을 둘지 여부.
 * `message` 키가 props 에 있으면(값이 undefined 여도) 프레임을 유지해 메세지 토글 시 컨트롤이 remount 되지 않게 한다.
 */
export function shouldRenderCmsFieldFrame(props: object, label: ReactNode): boolean {
  return hasCmsFieldNode(label) || Object.prototype.hasOwnProperty.call(props, 'message')
}

/**
 * error / status / Form.Item 상태를 합쳐 최종 에러·메세지를 계산한다.
 * Form.Item 밖에서도 쓰므로 `Form.Item.useStatus()` 대신 컨텍스트를 직접 읽는다(컨텍스트 없을 때 개발 경고 방지).
 */
export function useCmsFieldStatus({
  error,
  status,
  message,
  disabled,
}: {
  error?: boolean
  status?: string
  message?: ReactNode
  disabled?: boolean
}) {
  const { status: formStatus, errors: formErrors = [] } = useContext(FormItemInputContext)
  const rawError = Boolean(error) || status === 'error' || formStatus === 'error'
  const isError = rawError && !disabled
  const formError = rawError && formErrors.length > 0 ? formErrors[0] : undefined
  const resolvedMessage: ReactNode = rawError ? (formError ?? message) : message
  return {
    isError,
    message: resolvedMessage,
    hasMessage: hasCmsFieldNode(resolvedMessage),
  }
}

export interface CmsFieldFrameProps {
  size: CmsControlSize
  label?: ReactNode
  required?: boolean
  message?: ReactNode
  isError?: boolean
  /** 라벨을 `<label for>` 로 연결할 컨트롤 id */
  htmlFor?: string
  /** 메세지 요소 id (aria-describedby 연결용) */
  messageId?: string
  className?: string
  style?: CSSProperties
  /** 하위 호환 클래스(예: `cms-input__label`) */
  labelClassName?: string
  requiredClassName?: string
  messageClassName?: string
  children: ReactNode
}

export function CmsFieldFrame({
  size,
  label,
  required = false,
  message,
  isError = false,
  htmlFor,
  messageId,
  className,
  style,
  labelClassName,
  requiredClassName,
  messageClassName,
  children,
}: CmsFieldFrameProps) {
  const hasLabel = hasCmsFieldNode(label)
  const hasMessage = hasCmsFieldNode(message)

  const labelContent = (
    <>
      <span className="cms-field__label-text">{label}</span>
      {required ? (
        <span className={joinCmsClassNames('cms-field__required', requiredClassName)} aria-hidden>
          *
        </span>
      ) : null}
    </>
  )

  return (
    <span
      className={joinCmsClassNames(
        'cms-field',
        cmsControlSizeClass(size),
        hasLabel && 'cms-field--has-label',
        isError && 'cms-field--error',
        className
      )}
      style={style}
    >
      {hasLabel ? (
        htmlFor ? (
          <label className={joinCmsClassNames('cms-field__label', labelClassName)} htmlFor={htmlFor}>
            {labelContent}
          </label>
        ) : (
          <span className={joinCmsClassNames('cms-field__label', labelClassName)}>{labelContent}</span>
        )
      ) : null}
      {children}
      {hasMessage ? (
        <span
          id={messageId}
          className={joinCmsClassNames(
            'cms-field__message',
            isError && 'cms-field__message--error',
            messageClassName
          )}
          role={isError ? 'alert' : undefined}
        >
          {message}
        </span>
      ) : null}
    </span>
  )
}

export function CmsClearIconSvg() {
  return <FieldDeleteIcon />
}

/** 값이 있을 때 박스 우측에 노출하는 삭제(X) 버튼 — 사이즈별 아이콘 크기는 `--cms-icon-size` */
export function CmsFieldClearButton({
  onClear,
  className,
  label = '입력 내용 지우기',
}: {
  onClear: () => void
  className?: string
  label?: string
}) {
  return (
    <button
      type="button"
      className={joinCmsClassNames('cms-field__clear', className)}
      aria-label={label}
      tabIndex={-1}
      onMouseDown={event => {
        // 컨트롤 blur·드롭다운 열림 전에 clear 되도록
        event.preventDefault()
        event.stopPropagation()
      }}
      onClick={event => {
        event.stopPropagation()
        onClear()
      }}
    >
      <CmsClearIconSvg />
    </button>
  )
}
