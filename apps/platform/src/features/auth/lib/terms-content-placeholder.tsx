import { Fragment } from 'react'
import { PFDataTable, PFText } from '@/shared/ui'
import { TERMS_DOCUMENT_BY_TYPE, type TermsTableRow } from './terms-content/documents'
import type { TermsViewType } from '../model/terms-view.types'
import styles from '../ui/terms-view-modal/terms-view-modal.module.css'

function renderMultilineText(value: string) {
  const lines = value.split('\n')
  if (lines.length === 1) return value
  return lines.map((line, index) => (
    <Fragment key={index}>
      {index > 0 ? <br /> : null}
      {line || '\u00A0'}
    </Fragment>
  ))
}

function TermsParagraph({ paragraph }: { paragraph: string }) {
  if (paragraph.trim() === '') {
    const blankLines = Math.max(1, (paragraph.match(/\n/g) ?? []).length)
    return (
      <div
        className={styles.paragraphSpacer}
        style={{ height: `calc(1.5em * ${blankLines})` }}
        aria-hidden
      />
    )
  }

  return (
    <PFText as="p" typo="bd-md-rg" color="black" className={styles.paragraph}>
      {renderMultilineText(paragraph)}
    </PFText>
  )
}

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
            <PFText as="h3" typo="bd-md-sb" color="black" className={styles.sectionHeading}>
              {section.heading}
            </PFText>
          ) : null}
          {section.paragraphs.map((paragraph, index) => (
            <TermsParagraph
              key={`${section.heading ?? sectionIndex}-${index}`}
              paragraph={paragraph}
            />
          ))}
          {section.table ? (
            <div className={styles.tableContainer}>
              <PFDataTable<TermsTableRow>
                columns={section.table.columns.map(column => ({
                  key: column.key,
                  label: column.label,
                  width: column.width,
                  align: column.align,
                  render: row => renderMultilineText(row.cells[column.key] ?? ''),
                }))}
                rows={section.table.rows}
                rowKey={row => row.id}
                minWidth="100%"
              />
            </div>
          ) : null}
          {section.afterParagraphs?.map((paragraph, index) => (
            <TermsParagraph
              key={`${section.heading ?? sectionIndex}-after-${index}`}
              paragraph={paragraph}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
