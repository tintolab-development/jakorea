import type { TermsViewType } from './terms-view-config'
import { TERMS_DOCUMENT_BY_TYPE } from './terms-content/documents'

export function TermsContentPlaceholder({ type }: { type: TermsViewType }) {
  const content = TERMS_DOCUMENT_BY_TYPE[type]

  return (
    <div className="terms-view-modal__content">
      {content.intro ? <p className="terms-view-modal__paragraph">{content.intro}</p> : null}
      {content.sections.map(section => (
        <section key={section.heading} className="terms-view-modal__section">
          {section.heading ? (
            <h3 className="terms-view-modal__section-heading">{section.heading}</h3>
          ) : null}
          {section.paragraphs.map((paragraph, index) => (
            <p key={`${section.heading}-${index}`} className="terms-view-modal__paragraph">
              {paragraph}
            </p>
          ))}
          {section.table ? (
            <div className="terms-view-modal__table-wrap">
              <table className="terms-view-modal__table">
                <thead>
                  <tr>
                    {section.table.columns.map(column => (
                      <th key={column} scope="col">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map(row => (
                    <tr key={row[0]}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${row[0]}-${cellIndex}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  )
}
