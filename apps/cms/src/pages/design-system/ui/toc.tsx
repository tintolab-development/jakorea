type TocItem = {
  id: string
  label: string
}

export const DS_TOC_ITEMS: TocItem[] = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'forms', label: 'Forms' },
  { id: 'detail-forms', label: 'Detail Forms' },
  { id: 'forms-extras', label: 'Forms extras' },
  { id: 'filters-tables', label: 'Filters & Tables' },
  { id: 'modals', label: 'Modals' },
  { id: 'modals-extended', label: 'Modals (extended)' },
]

export function DesignSystemToc() {
  return (
    <nav className="ds-page__toc" aria-label="디자인 시스템 섹션">
      <p className="ds-page__toc-title">Sections</p>
      {DS_TOC_ITEMS.map(item => (
        <a key={item.id} className="ds-page__toc-link" href={`#${item.id}`}>
          {item.label}
        </a>
      ))}
    </nav>
  )
}
