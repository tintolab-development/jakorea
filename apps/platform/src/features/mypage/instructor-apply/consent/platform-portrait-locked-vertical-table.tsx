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
import previewTypography from '@/features/mypage/settings/ui/consent-document-preview-typography.module.css'
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
  // A4 is a fixed document canvas, not the responsive/interactive write screen.
  // 하단 안내·동의 라디오는 런타임(antd) 대신 Platform 비활성 라디오로 그린다 (1번 표와 동일).
  if (documentPreview) {
    return (
      <div className={previewTypography.portraitLockedTableBlock}>
        <FormTemplateHost surface="cmsAdmin">
          <VerticalTablePreviewBody
            paragraph={{ ...paragraph, showBottomText: false, showBottomConsent: false }}
            interactionMode="preview"
          />
        </FormTemplateHost>
        <PortraitVerticalTableBottom
          paragraph={paragraph}
          onUpdateParagraph={onUpdateParagraph}
          documentPreview
        />
      </div>
    )
  }

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
