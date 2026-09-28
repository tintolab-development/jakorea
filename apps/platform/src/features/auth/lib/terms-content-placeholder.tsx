import { PFDataTable, PFText } from '@/shared/ui'
import { TERMS_DOCUMENT_BY_TYPE, type TermsTableRow } from './terms-content/documents'
import type { TermsViewType } from '../model/terms-view.types'
import styles from '../ui/terms-view-modal/terms-view-modal.module.css'

type TermsContentPlaceholderProps = {
  type: TermsViewType
}

export function TermsContentPlaceholder({ type }: TermsContentPlaceholderProps) {
  const content = TERMS_DOCUMENT_BY_TYPE[type]

  if (!content.intro && content.sections.length === 0) {
    return null
  }

  return (
    <div className={styles.content}>
      {content.intro ? (
        <PFText as="p" typo="bd-md-rg" color="black">
          {content.intro}
        </PFText>
      ) : null}
      {content.sections.map((section, sectionIndex) => (
        <section key={section.heading ?? `section-${sectionIndex}`} className={styles.section}>
          {section.heading ? (
            <PFText as="h3" typo="bd-md-sb" color="black">
              {section.heading}
            </PFText>
          ) : null}
          {section.paragraphs.map((paragraph, index) => (
            <PFText key={`${section.heading ?? sectionIndex}-${index}`} as="p" typo="bd-md-rg" color="black">
              {paragraph}
            </PFText>
          ))}
          {section.table ? (
            <PFDataTable<TermsTableRow>
              columns={section.table.columns.map(column => ({
                key: column.key,
                label: column.label,
                width: column.width,
                align: column.align,
                render: row => row.cells[column.key],
              }))}
              rows={section.table.rows}
              rowKey={row => row.id}
              minWidth="100%"
            />
          ) : null}
          {section.afterParagraphs?.map((paragraph, index) => (
            <PFText
              key={`${section.heading ?? sectionIndex}-after-${index}`}
              as="p"
              typo="bd-md-rg"
              color="black"
            >
              {paragraph}
            </PFText>
          ))}
        </section>
      ))}
    </div>
  )
}
