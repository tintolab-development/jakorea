type TocItem = {
  id: string
  label: string
}

export const DS_TOC_ITEMS: TocItem[] = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'impact-audit', label: 'Impact audit' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'forms', label: 'Forms' },
  { id: 'search-modals', label: 'Search modals' },
  { id: 'posts-attachments', label: 'Posts & attachments' },
  { id: 'detail-forms', label: 'Detail Forms' },
  { id: 'forms-extras', label: 'Forms extras' },
  { id: 'editor', label: 'Rich text editor' },
  { id: 'filters-tables', label: 'Filters & Tables' },
  { id: 'dashboard', label: 'Dashboard layouts' },
  { id: 'modals', label: 'ContentModal' },
  { id: 'modal-catalog', label: 'Modal catalog' },
  { id: 'modal-processes', label: 'Modal processes' },
  { id: 'modals-extended', label: 'Modals (extended)' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'status', label: 'Status tags' },
  { id: 'status-extended', label: 'Status tags (extended)' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'feedback', label: 'Empty & Loading' },
  { id: 'do-dont', label: "Do / Don't" },
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
