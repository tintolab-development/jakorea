import { useId } from 'react'
import type { ReactNode } from 'react'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import type { CmsTextAreaProps } from '@/shared/ui/cms-textarea'
import './paragraph-label-input.css'

export interface ParagraphLabelInputProps extends Omit<CmsTextAreaProps, 'label'> {
  /** 상단 라벨(앞에 · 구분자가 붙습니다) */
  label?: ReactNode
  /** 있으면 textarea 대신 이 컨트롤을 렌더 (생년월일·전화번호 등) */
  control?: ReactNode
  /** `rows={1}`일 때 한 줄 높이에서 세로 확장·resize 허용 (`CmsTextArea`) */
  expandableFromSingleRow?: boolean
}

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function ParagraphLabelInput({
  label,
  className,
  id: idProp,
  width = '100%',
  /** 단일항목 주관식 등 — 기본 1줄, `rows`로 확장 */
  rows = 1,
  expandableFromSingleRow,
  control,
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
      {control ?? (
        <CmsTextArea
          {...rest}
          id={controlId}
          width={width}
          className="paragraph-label-input__textarea"
          rows={rows ? rows : 1}
          expandableFromSingleRow={expandableFromSingleRow}
        />
      )}
    </div>
  )
}
