import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type UIEvent,
} from 'react'
import { renderNotificationVariableText } from '@/features/notifications/model/shared/render-notification-variable-text'
import './variable-text-field.css'

type SmsVariableTextFieldProps = {
  value: string
  multiline?: boolean
  children: ReactNode
  className?: string
}

/**
 * native input/textarea 위에 `#{변수}` mint 하이라이트 미러.
 * children은 CmsInput / CmsTextArea (투명 글자 + caret 유지).
 */
export function SmsVariableTextField({
  value,
  multiline = false,
  children,
  className,
}: SmsVariableTextFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)

  const syncScrollFromControl = useCallback(() => {
    const root = rootRef.current
    const mirror = mirrorRef.current
    if (!root || !mirror) return
    const control = root.querySelector('textarea, input') as
      | HTMLTextAreaElement
      | HTMLInputElement
      | null
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
    if (!(target instanceof HTMLTextAreaElement) && !(target instanceof HTMLInputElement)) {
      return
    }
    const mirror = mirrorRef.current
    if (!mirror) return
    mirror.scrollTop = target.scrollTop
    mirror.scrollLeft = target.scrollLeft
  }

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
    >
      <div ref={mirrorRef} className="sms-variable-text-field__mirror" aria-hidden>
        {renderNotificationVariableText(value, {
          emptyFallback: '\u00a0',
        })}
        {multiline ? '\n' : null}
      </div>
      <div className="sms-variable-text-field__control">{children}</div>
    </div>
  )
}
