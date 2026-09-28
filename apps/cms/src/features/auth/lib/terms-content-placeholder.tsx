import type { TermsViewType } from './terms-view-config'
import { TERMS_DOCUMENT_BY_TYPE } from './terms-content/documents'

export function TermsContentPlaceholder({ type }: { type: TermsViewType }) {
  const content = TERMS_DOCUMENT_BY_TYPE[type]

  return (
    <div className="terms-view-modal__content">
      {content.intro ? <p className="terms-view-modal__paragraph">{content.intro}</p> : null}
      {content.sections.map(section => (
        <section key={section.heading} className="terms-view-modal__section">
          <h3 className="terms-view-modal__section-heading">{section.heading}</h3>
          {section.paragraphs.map((paragraph, index) => (
            <p key={`${section.heading}-${index}`} className="terms-view-modal__paragraph">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}
