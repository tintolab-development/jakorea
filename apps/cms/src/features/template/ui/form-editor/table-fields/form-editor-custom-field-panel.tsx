import type { ReactNode } from 'react'
import { DeleteIconTrashcan } from '@/features/template/ui/shared/delete-icon-trashcan'

type CustomFieldHintTone = 'header' | 'body'

function customFieldHintClass(tone: CustomFieldHintTone, element: string, extra?: string) {
  const base =
    tone === 'header'
      ? `form-editor-horizontal-table-header-fields__${element}`
      : `form-editor-horizontal-table-body-fields__${element}`
  return [base, extra].filter(Boolean).join(' ')
}

export function FormEditorFieldHint({
  tone = 'body',
  mark = '*',
  children,
}: {
  tone?: CustomFieldHintTone
  mark?: ReactNode
  children: ReactNode
}) {
  return (
    <div className={customFieldHintClass(tone, 'hint')}>
      <span className={customFieldHintClass(tone, 'hint-mark')} aria-hidden>
        {mark}
      </span>
      <div className={customFieldHintClass(tone, 'hint-body')}>{children}</div>
    </div>
  )
}

export function FormEditorFieldHintLine({
  tone = 'body',
  second = false,
  children,
}: {
  tone?: CustomFieldHintTone
  second?: boolean
  children: ReactNode
}) {
  return (
    <p
      className={customFieldHintClass(
        tone,
        'hint-line',
        second && tone === 'header'
          ? 'form-editor-horizontal-table-header-fields__hint-line--second'
          : undefined
      )}
    >
      {children}
    </p>
  )
}

export function FormEditorFieldHintXInline({
  tone = 'body',
  children,
}: {
  tone?: CustomFieldHintTone
  children: ReactNode
}) {
  return (
    <span className={customFieldHintClass(tone, 'hint-x-inline')} aria-hidden>
      {children}
    </span>
  )
}

export function FormEditorRowDeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="form-editor-horizontal-table-body-fields__row-delete"
      onClick={e => {
        e.stopPropagation()
        onClick()
      }}
    >
      <DeleteIconTrashcan />
      <span className="form-editor-horizontal-table-body-fields__row-delete-label">행 삭제</span>
    </button>
  )
}

export function FormEditorCustomFieldPanel({
  title,
  titleClassName = 'form-editor-horizontal-table-body-fields__title',
  className = 'form-editor-horizontal-table-body-fields',
  beforeDelete,
  onDeleteRow,
  hint,
  children,
}: {
  title: string
  titleClassName?: string
  className?: string
  beforeDelete?: ReactNode
  onDeleteRow?: () => void
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className={className}>
      <h3 className={titleClassName}>{title}</h3>
      {beforeDelete}
      {onDeleteRow ? <FormEditorRowDeleteButton onClick={onDeleteRow} /> : null}
      {hint}
      {children}
    </div>
  )
}

export function FormEditorFieldList({
  children,
  className = 'form-editor-horizontal-table-body-fields__list',
}: {
  children: ReactNode
  className?: string
}) {
  return <ul className={className}>{children}</ul>
}

export function FormEditorFieldListItem({
  children,
  className = 'form-editor-horizontal-table-body-fields__item',
}: {
  children: ReactNode
  className?: string
}) {
  return <li className={className}>{children}</li>
}

export function FormEditorFieldTypeRow({
  children,
  trailing,
}: {
  children: ReactNode
  trailing?: ReactNode
}) {
  return (
    <div className="form-editor-horizontal-table-body-fields__type-row">
      <div className="form-editor-horizontal-table-body-fields__select-wrap">{children}</div>
      {trailing}
    </div>
  )
}
