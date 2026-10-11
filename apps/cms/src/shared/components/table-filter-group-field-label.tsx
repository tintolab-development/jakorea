import type { ReactNode } from 'react'

export type TableFilterFieldLabelProps = {
  children: ReactNode
  /** 단일 컨트롤과 연결 시 — `CmsFieldFrame`과 동일하게 `<label htmlFor>` */
  htmlFor?: string
  /** radio·multi 등 그룹 컨트롤 — `aria-labelledby`용 (htmlFor 없을 때는 `<span>`) */
  id?: string
}

/**
 * TableFilterGroup 필드 레이블 — 필터 타이포(`table-filter-group__label`) + CmsField 라벨 마크업.
 */
export function TableFilterFieldLabel({ children, htmlFor, id }: TableFilterFieldLabelProps) {
  const className = 'table-filter-group__label cms-field__label'
  const content = <span className="cms-field__label-text">{children}</span>

  if (htmlFor) {
    return (
      <label id={id} className={className} htmlFor={htmlFor}>
        {content}
      </label>
    )
  }

  return (
    <span id={id} className={className}>
      {content}
    </span>
  )
}
