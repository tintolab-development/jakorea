import { useId, type ReactNode } from 'react'
import { Form } from 'antd'
import type { NamePath } from 'antd/es/form/interface'
import { CmsTextArea } from '@/shared/ui'
import './free-write-items-section.css'

export type FreeWriteItemConfig = {
  name: NamePath
  label: string
}

export type FreeWriteItemsSectionProps = {
  title?: string
  /** 타이틀 옆 필수 `*` */
  required?: boolean
  /** 타이틀과 같은 행에 노출되는 안내 문구 */
  description?: ReactNode
  items: readonly FreeWriteItemConfig[]
  placeholder?: string
  rows?: number
  className?: string
}

export function FreeWriteItemsSection({
  title = '자유 작성 항목',
  required = false,
  description,
  items,
  placeholder = '자유롭게 작성해주세요',
  rows = 5,
  className,
}: FreeWriteItemsSectionProps) {
  const titleId = useId()
  const rootClass = ['free-write-items-section', className].filter(Boolean).join(' ')

  return (
    <section className={rootClass} aria-labelledby={titleId}>
      <header className="free-write-items-section__header">
        <h2 id={titleId} className="free-write-items-section__title">
          {title}
          {required ? (
            <span className="free-write-items-section__required" aria-hidden>
              *
            </span>
          ) : null}
        </h2>
        {description != null && description !== '' ? (
          <p className="free-write-items-section__description">{description}</p>
        ) : null}
      </header>
      <div className="free-write-items-section__list" role="list">
        {items.map(item => (
          <article key={String(item.name)} className="free-write-items-section__card" role="listitem">
            <div className="free-write-items-section__card-header">{item.label}</div>
            <div className="free-write-items-section__card-body">
              <Form.Item name={item.name} noStyle>
                <CmsTextArea
                  inputSize="medium"
                  width="100%"
                  rows={rows}
                  placeholder={placeholder}
                />
              </Form.Item>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
