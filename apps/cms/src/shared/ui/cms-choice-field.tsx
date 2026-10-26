/**
 * 체크박스·라디오 그룹 제목 라벨 래퍼 — CmsCheckbox.Group / CmsRadio.Group 의 label prop 에서 사용
 */

import type { ReactNode } from 'react'
import './cms-choice-field.css'

export type CmsChoiceFieldSize = 'large' | 'medium' | 'small'

export type CmsChoiceFieldProps = {
  label: ReactNode
  labelId: string
  required?: boolean
  size?: CmsChoiceFieldSize
  children: ReactNode
}

export const CMS_CHOICE_FIELD_GROUP_CLASS = 'cms-choice-field__group'

export function CmsChoiceField({ label, labelId, required = false, size = 'large', children }: CmsChoiceFieldProps) {
  return (
    <div className={`cms-choice-field cms-choice-field--${size}`} role="group" aria-labelledby={labelId}>
      <div className="cms-choice-field__label" id={labelId}>
        <span className="cms-choice-field__label-text">{label}</span>
        {required ? (
          <span className="cms-choice-field__required" aria-hidden>
            *
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}
