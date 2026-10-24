import type { VerticalTableParagraph } from '@jakorea/form-schema/writing-form'
import {
  FormTemplateHost,
  type FormUpdateParagraph,
  VerticalTablePreviewBody,
  patchVerticalTableBottomConsent,
} from '@jakorea/form-template-runtime'
import {
  PortraitVerticalTableBottom,
  PortraitVerticalTableMobileBody,
} from './portrait-vertical-table-mobile'
import styles from './consent-form.module.css'

/** 초상권 2·3번 표 — 읽기 전용 본문 + 하단 동의 */
export function PlatformPortraitLockedVerticalTable({
  paragraph,
  onUpdateParagraph,
  documentPreview = false,
}: {
  paragraph: VerticalTableParagraph
  onUpdateParagraph: FormUpdateParagraph
  documentPreview?: boolean
}) {
  return (
    <div className={styles.tableBlock}>
      <div className={styles.portraitTableDesktop}>
        <FormTemplateHost surface="platformUser">
          <VerticalTablePreviewBody
            paragraph={paragraph}
            interactionMode="user"
            onBottomConsentChange={value =>
              onUpdateParagraph(paragraph.id, current =>
                current.kind === 'single_item' && current.variant === 'vertical_table'
                  ? patchVerticalTableBottomConsent(current, value)
                  : current
              )
            }
          />
        </FormTemplateHost>
      </div>

      <div className={styles.portraitTableMobile}>
        <PortraitVerticalTableMobileBody paragraph={paragraph} onUpdateParagraph={onUpdateParagraph} />
        <PortraitVerticalTableBottom
          paragraph={paragraph}
          onUpdateParagraph={onUpdateParagraph}
          documentPreview={documentPreview}
        />
      </div>
    </div>
  )
}
