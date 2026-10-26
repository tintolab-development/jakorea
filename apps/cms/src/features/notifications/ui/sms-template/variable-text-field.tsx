import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
  type UIEvent,
} from 'react'
import {
  applyAtomicMailVariableDeletion,
  jumpCaretAcrossMailVariableAtom,
  resolveTypingOutsideMailVariableAtom,
  snapSelectionOutsideMailVariableAtoms,
} from '@/features/notifications/model/mail-template/insert-variable'
import { renderNotificationVariableText } from '@/features/notifications/model/shared/render-notification-variable-text'
import './variable-text-field.css'

type TextControl = HTMLTextAreaElement | HTMLInputElement

type SmsVariableTextFieldProps = {
  value: string
  multiline?: boolean
  children: ReactNode
  className?: string
  maxLength?: number
  /**
   * 변수 원자 삭제·중간 입력 차단 후 값 반영.
   * 없으면 미러만 그리고 가드는 동작하지 않는다.
   */
  onValueChange?: (next: string) => void
}

function isTextControl(node: EventTarget | null): node is TextControl {
  return node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement
}

function readSelection(control: TextControl): { start: number; end: number } {
  return {
    start: control.selectionStart ?? control.value.length,
    end: control.selectionEnd ?? control.value.length,
  }
}

function applyValueAndCaret(
  control: TextControl,
  next: string,
  caret: number,
  onValueChange?: (next: string) => void
) {
  onValueChange?.(next)
  requestAnimationFrame(() => {
    const length = next.length
    const safe = Math.max(0, Math.min(caret, length))
    try {
      control.focus()
      control.setSelectionRange(safe, safe)
    } catch {
      /* input type may not support setSelectionRange */
    }
  })
}

/**
 * native input/textarea 위에 `#{변수}` mint 하이라이트 미러.
 * 메일 TipTap atom과 같이 토큰 중간 입력 차단·통째 삭제·화살표 점프.
 */
export function SmsVariableTextField({
  value,
  multiline = false,
  children,
  className,
  maxLength,
  onValueChange,
}: SmsVariableTextFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef(value)
  valueRef.current = value
  /** IME 조합 중에는 selection을 건드리지 않는다 (한글 조합 깨짐 방지) */
  const composingRef = useRef(false)

  /**
   * 미러 글자 위치를 실제 input/textarea와 맞춘다.
   * 입력 글자는 투명이라 미러와 폰트·여백이 다르면 caret·선택·IME 조합 위치가
   * 보이는 글자와 어긋나 "포커스가 튀는" 것처럼 보인다 (small 14px vs 미러 16px 등).
   */
  const syncMirrorMetrics = useCallback(() => {
    const root = rootRef.current
    const mirror = mirrorRef.current
    if (!root || !mirror) return
    const control = root.querySelector('textarea, input') as TextControl | null
    if (!control) return
    const cs = window.getComputedStyle(control)
    const rootRect = root.getBoundingClientRect()
    const rect = control.getBoundingClientRect()
    // 모달 오픈 애니메이션(scale) 중에도 레이아웃 px 기준으로 계산
    const scale = root.offsetWidth > 0 ? rootRect.width / root.offsetWidth : 1
    const px = (v: string) => Number.parseFloat(v) || 0
    const paddingLeft = px(cs.paddingLeft)
    const paddingRight = px(cs.paddingRight)
    const left = (rect.left - rootRect.left) / (scale || 1) + control.clientLeft + paddingLeft
    const contentWidth = control.clientWidth - paddingLeft - paddingRight
    const right = Math.max(0, root.offsetWidth - left - contentWidth)
    const style = mirror.style
    style.fontFamily = cs.fontFamily
    style.fontSize = cs.fontSize
    style.fontWeight = cs.fontWeight
    style.letterSpacing = cs.letterSpacing
    style.wordSpacing = cs.wordSpacing
    style.lineHeight = cs.lineHeight
    style.paddingLeft = `${left}px`
    style.paddingRight = `${right}px`
    if (multiline) {
      const top = (rect.top - rootRect.top) / (scale || 1) + control.clientTop + px(cs.paddingTop)
      style.paddingTop = `${top}px`
    }
  }, [multiline])

  useLayoutEffect(() => {
    syncMirrorMetrics()
    const root = rootRef.current
    if (!root || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => syncMirrorMetrics())
    observer.observe(root)
    const control = root.querySelector('textarea, input')
    if (control) observer.observe(control)
    return () => observer.disconnect()
  }, [syncMirrorMetrics])

  const syncScrollFromControl = useCallback(() => {
    const root = rootRef.current
    const mirror = mirrorRef.current
    if (!root || !mirror) return
    const control = root.querySelector('textarea, input') as TextControl | null
    if (!control) return
    if ('scrollTop' in control) {
      mirror.scrollTop = control.scrollTop
      mirror.scrollLeft = control.scrollLeft
    }
  }, [])

  useEffect(() => {
    syncScrollFromControl()
  }, [value, syncScrollFromControl])

  function handleScrollCapture(event: UIEvent) {
    const target = event.target
    if (!isTextControl(target)) return
    const mirror = mirrorRef.current
    if (!mirror) return
    mirror.scrollTop = target.scrollTop
    mirror.scrollLeft = target.scrollLeft
  }

  const snapControlSelection = useCallback((control: TextControl) => {
    if (composingRef.current) return
    const text = valueRef.current
    const { start, end } = readSelection(control)
    const snapped = snapSelectionOutsideMailVariableAtoms(text, start, end)
    if (snapped.from === start && snapped.to === end) return
    try {
      control.setSelectionRange(snapped.from, snapped.to)
    } catch {
      /* ignore */
    }
  }, [])

  const handleSelectCapture = useCallback(
    (event: SyntheticEvent) => {
      if (!onValueChange) return
      const target = event.target
      if (!isTextControl(target)) return
      snapControlSelection(target)
    },
    [onValueChange, snapControlSelection]
  )

  const handleKeyDownCapture = useCallback(
    (event: ReactKeyboardEvent) => {
      if (!onValueChange) return
      const target = event.target
      if (!isTextControl(target)) return
      if (event.nativeEvent.isComposing || event.key === 'Process') return

      const text = valueRef.current
      const { start, end } = readSelection(target)

      if (event.key === 'Backspace' || event.key === 'Delete') {
        const result = applyAtomicMailVariableDeletion(
          text,
          start,
          end,
          event.key === 'Backspace' ? 'backward' : 'forward'
        )
        if (!result) return
        event.preventDefault()
        event.stopPropagation()
        applyValueAndCaret(target, result.next, result.caret, onValueChange)
        return
      }

      if (
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
        !event.shiftKey &&
        !event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        start === end
      ) {
        const nextCaret = jumpCaretAcrossMailVariableAtom(
          text,
          start,
          event.key === 'ArrowLeft' ? 'left' : 'right'
        )
        if (nextCaret == null) return
        event.preventDefault()
        event.stopPropagation()
        try {
          target.setSelectionRange(nextCaret, nextCaret)
        } catch {
          /* ignore */
        }
      }
    },
    [onValueChange]
  )

  const handleBeforeInputCapture = useCallback(
    (event: SyntheticEvent) => {
      if (!onValueChange) return
      const target = event.target
      if (!isTextControl(target)) return
      const native = event.nativeEvent as InputEvent
      if (typeof native.inputType !== 'string') return
      if (!native.inputType.startsWith('insert')) return
      if (native.isComposing) return

      const text = valueRef.current
      const { start, end } = readSelection(target)
      const safe = resolveTypingOutsideMailVariableAtom(text, start, end)
      if (safe.from === start && safe.to === end) return

      // 토큰 중간(또는 부분 선택) → 토큰 밖으로 스냅한 뒤 같은 입력을 이어 붙인다.
      event.preventDefault()
      event.stopPropagation()
      const data = native.data ?? ''
      const nextRaw = `${text.slice(0, safe.from)}${data}${text.slice(safe.to)}`
      const next = maxLength != null ? nextRaw.slice(0, maxLength) : nextRaw
      const caret = Math.min(safe.from + data.length, next.length)
      applyValueAndCaret(target, next, caret, onValueChange)
    },
    [maxLength, onValueChange]
  )

  const handleCompositionStartCapture = useCallback(
    (event: SyntheticEvent) => {
      if (!onValueChange) return
      const target = event.target
      if (!isTextControl(target)) return
      // 조합 시작 직전에만 토큰 밖으로 스냅하고, 조합 중에는 selection을 건드리지 않는다.
      snapControlSelection(target)
      composingRef.current = true
    },
    [onValueChange, snapControlSelection]
  )

  const handleCompositionEndCapture = useCallback(() => {
    composingRef.current = false
  }, [])

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        onSelect: (event: SyntheticEvent) => {
          const props = (children as ReactElement<Record<string, unknown>>).props
          const prev = props.onSelect as ((event: SyntheticEvent) => void) | undefined
          handleSelectCapture(event)
          prev?.(event)
        },
        onClick: (event: SyntheticEvent) => {
          const props = (children as ReactElement<Record<string, unknown>>).props
          const prev = props.onClick as ((event: SyntheticEvent) => void) | undefined
          handleSelectCapture(event)
          prev?.(event)
        },
        onKeyUp: (event: SyntheticEvent) => {
          const props = (children as ReactElement<Record<string, unknown>>).props
          const prev = props.onKeyUp as ((event: SyntheticEvent) => void) | undefined
          handleSelectCapture(event)
          prev?.(event)
        },
      })
    : children

  return (
    <div
      ref={rootRef}
      className={[
        'sms-variable-text-field',
        multiline ? 'sms-variable-text-field--multiline' : 'sms-variable-text-field--single',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onScrollCapture={handleScrollCapture}
      onKeyDownCapture={handleKeyDownCapture}
      onBeforeInputCapture={handleBeforeInputCapture}
      onCompositionStartCapture={handleCompositionStartCapture}
      onCompositionEndCapture={handleCompositionEndCapture}
      onFocusCapture={syncMirrorMetrics}
    >
      <div ref={mirrorRef} className="sms-variable-text-field__mirror" aria-hidden>
        {renderNotificationVariableText(value, {
          emptyFallback: '\u00a0',
        })}
        {multiline ? '\n' : null}
      </div>
      <div className="sms-variable-text-field__control">{control}</div>
    </div>
  )
}
