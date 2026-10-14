import type { PlatformConsentFillOptions } from '@jakorea/form-schema/consent'
import type { WritingFormDraft, WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import type { ReactNode } from 'react'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PFFormSection } from '@/shared/ui'
import {
  PlatformConsentParagraphBody,
  resolvePlatformConsentSectionRequired,
  resolvePlatformConsentSectionTitle,
} from './platform-consent-paragraph-body'
import previewTypography from '@/features/mypage/settings/ui/consent-document-preview-typography.module.css'
import styles from './consent-form.module.css'

export type PlatformConsentFormBodyProps = {
  draft: WritingFormDraft
  hiddenParagraphIds: ReadonlySet<string>
  onUpdateParagraph: FormUpdateParagraph
  fillOptions?: PlatformConsentFillOptions
  /** 행정정보 공동이용 — 대상자 본인 성명(포털 로그인 회원명) */
  lockedNoticeSubjectMemberName?: string
  renderParagraphSlot?: (paragraph: WritingFormParagraph) => ReactNode | null | undefined
  /** 단락 섹션 카드 바로 다음(별도 카드 등) — 행정정보 대상자 본인 전자서명 */
  renderAfterParagraphSlot?: (paragraph: WritingFormParagraph) => ReactNode | null | undefined
  /** A4 동의서 미리보기 — CMS `form-document-preview-body` 타이포 */
  documentPreview?: boolean
  documentPreviewTemplateId?: string
}

function shouldHideParagraph(
  paragraph: WritingFormParagraph,
  hiddenParagraphIds: ReadonlySet<string>,
  documentPreview?: boolean,
): boolean {
  if (hiddenParagraphIds.has(paragraph.id)) return true
  if (paragraph.kind === 'description' && paragraph.variant === 'system') {
    if (paragraph.systemPreset === 'agreement_signature') return false
    if (documentPreview && paragraph.systemPreset === 'agreement_date') return false
    return true
  }
  if (paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period') {
    return true
  }
  return false
}

/** 제목·카드 셸 없이 본문만 (마무리글, 전자서명 슬롯, 지급조서 중간 안내 등) */
function isBodyOnlyParagraph(paragraph: WritingFormParagraph): boolean {
  if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine) return true
  if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm) return true
  if (
    paragraph.kind === 'description' &&
    paragraph.variant === 'system' &&
    paragraph.systemPreset === 'agreement_signature'
  ) {
    return true
  }
  if (paragraph.kind === 'description' && paragraph.variant === 'closing') return true
  return false
}

function wrapConsentParagraph(
  paragraph: WritingFormParagraph,
  title: string,
  content: ReactNode,
  documentPreview?: boolean,
): ReactNode {
  if (isBodyOnlyParagraph(paragraph)) {
    return (
      <div key={paragraph.id} className={styles.bodyOnlyWrap}>
        {content}
      </div>
    )
  }

  if (documentPreview) {
    return (
      <div
        key={paragraph.id}
        className={previewTypography.paragraph}
        data-paragraph-id={paragraph.id}
      >
        {title ? <p className={previewTypography.sectionTitle}>{title}</p> : null}
        {content}
      </div>
    )
  }

  return (
    <PFFormSection
      key={paragraph.id}
      id={paragraph.id}
      title={title}
      required={resolvePlatformConsentSectionRequired(paragraph)}
    >
      {content}
    </PFFormSection>
  )
}

/** schema draft + Platform `PFFormSection` / `ConsentInfoTable` shell */
export function PlatformConsentFormBody({
  draft,
  hiddenParagraphIds,
  onUpdateParagraph,
  fillOptions,
  lockedNoticeSubjectMemberName,
  renderParagraphSlot,
  renderAfterParagraphSlot,
  documentPreview = false,
  documentPreviewTemplateId,
}: PlatformConsentFormBodyProps) {
  let numberedIndex = 0

  const rootClassName = documentPreview
    ? [
        previewTypography.body,
        documentPreviewTemplateId === 'agreement-portrait' ? previewTypography.bodyPortrait : undefined,
      ]
        .filter(Boolean)
        .join(' ')
    : styles.paragraphStack

  return (
    <div className={rootClassName}>
      {draft.paragraphs.map(paragraph => {
        if (shouldHideParagraph(paragraph, hiddenParagraphIds, documentPreview)) {
          return null
        }

        const usesNumber = paragraph.participatesInTitleNumbering
        const titleIndex = usesNumber ? numberedIndex++ : numberedIndex
        const title = resolvePlatformConsentSectionTitle(paragraph, titleIndex)

        const slot = renderParagraphSlot?.(paragraph)
        const afterSlot = renderAfterParagraphSlot?.(paragraph)

        const content =
          slot != null
            ? slot
            : (
                <PlatformConsentParagraphBody
                  paragraph={paragraph}
                  onUpdateParagraph={onUpdateParagraph}
                  fillOptions={fillOptions}
                  lockedNoticeSubjectMemberName={lockedNoticeSubjectMemberName}
                  documentPreview={documentPreview}
                />
              )

        const wrapped = wrapConsentParagraph(paragraph, title, content, documentPreview)

        if (afterSlot != null && !documentPreview) {
          return (
            <div key={paragraph.id} className={styles.paragraphWithCompanion}>
              {wrapped}
              <div className={styles.bodyOnlyWrap}>{afterSlot}</div>
            </div>
          )
        }

        return wrapped
      })}
    </div>
  )
}
