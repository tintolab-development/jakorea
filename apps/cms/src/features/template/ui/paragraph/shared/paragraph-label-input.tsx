import { useId } from 'react'
import type { ReactNode } from 'react'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import type { CmsTextAreaProps } from '@/shared/ui/cms-textarea'
import './paragraph-label-input.css'

export interface ParagraphLabelInputProps extends Omit<CmsTextAreaProps, 'label'> {
  /** 상단 라벨(앞에 · 구분자가 붙습니다) */
  label?: ReactNode
}

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function ParagraphLabelInput({
  label,
  className,
  id: idProp,
  width = '100%',
  ...rest
}: ParagraphLabelInputProps) {
  const uid = useId()
  const controlId = idProp ?? `paragraph-label-input-${uid}`

  return (
    <div className={cn('paragraph-label-input', className)}>
      {label != null && label !== '' ? (
        <label className="paragraph-label-input__label" htmlFor={controlId}>
          <span className="paragraph-label-input__bullet" aria-hidden>
            ·
          </span>
          {label}
        </label>
      ) : null}
      <CmsTextArea
        {...rest}
        id={controlId}
        width={width}
        className="paragraph-label-input__textarea"
        rows={1}
      />
    </div>
  )
}
