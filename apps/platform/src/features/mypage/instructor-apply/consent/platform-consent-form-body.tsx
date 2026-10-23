import type {
  PaymentStatementBasicInfoValues,
  PlatformConsentFillOptions,
} from '@jakorea/form-schema/consent'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import type { ReactNode } from 'react'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PFFormSection } from '@/shared/ui'
import { ConsentPreviewPaymentInfo } from '@/features/mypage/settings/ui/consent-document-preview-payment-info'
import { resolveConsentDocumentPreviewBodyVariant } from '@/features/mypage/settings/lib/consent-document-preview-config'
import {
  ConsentPreviewRecipient,
  resolveConsentDocumentPreviewChrome,
} from '@/features/mypage/settings/ui/consent-document-preview-signature'
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
  /** 동의서 확인 — 서명란 날짜. `YYYY년 MM월 DD일` 또는 `-` */
  submittedDateLabel?: string
  /** 지급조서 마지막 페이지 — `JA KOREA 귀하` */
  showClosingRecipient?: boolean
  /** 지급조서 확인 — 제출된 기본 정보. 없으면 항목은 `-` */
  paymentBasicInfo?: Partial<PaymentStatementBasicInfoValues>
  signerName?: string
  signatureImageSrc?: string
}

function shouldHideParagraph(
  paragraph: WritingFormParagraph,
  hiddenParagraphIds: ReadonlySet<string>,
  documentPreview?: boolean,
): boolean {
  if (hiddenParagraphIds.has(paragraph.id)) return true
  if (documentPreview && paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingRecipient) {
    return true
  }
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
function isBodyOnlyParagraph(paragraph: WritingFormParagraph, documentPreview?: boolean): boolean {
  if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine) return true
  if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm) return true
  if (
    paragraph.kind === 'description' &&
    paragraph.variant === 'system' &&
    (paragraph.systemPreset === 'agreement_signature' ||
      (documentPreview && paragraph.systemPreset === 'agreement_date'))
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
  previewAttrs?: { stack?: 'signature'; rule?: 'confirm' | 'date' },
): ReactNode {
  if (isBodyOnlyParagraph(paragraph, documentPreview)) {
    return (
      <div
        key={paragraph.id}
        className={styles.bodyOnlyWrap}
        data-consent-preview-stack={previewAttrs?.stack}
        data-consent-preview-rule={previewAttrs?.rule}
      >
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
  submittedDateLabel = '-',
  showClosingRecipient = false,
  paymentBasicInfo,
  signerName,
  signatureImageSrc,
}: PlatformConsentFormBodyProps) {
  let numberedIndex = 0

  const bodyVariant = resolveConsentDocumentPreviewBodyVariant(documentPreviewTemplateId)
  const rootClassName = documentPreview
    ? [
        previewTypography.body,
        bodyVariant === 'payment' ? previewTypography.bodyPayment : undefined,
        bodyVariant === 'expense' ? previewTypography.bodyExpense : undefined,
        bodyVariant === 'notice' ? previewTypography.bodyNotice : undefined,
        bodyVariant === 'portrait' ? previewTypography.bodyPortrait : undefined,
      ]
        .filter(Boolean)
        .join(' ')
    : styles.paragraphStack
  const noticeClosingVisible =
    documentPreview &&
    draft.paragraphs.some(paragraph => paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing)

  return (
    <div className={rootClassName}>
      {draft.paragraphs.map((paragraph, index) => {
        if (shouldHideParagraph(paragraph, hiddenParagraphIds, documentPreview)) {
          return null
        }

        const usesNumber = paragraph.participatesInTitleNumbering
        const titleIndex = usesNumber ? numberedIndex++ : numberedIndex
        const title = resolvePlatformConsentSectionTitle(paragraph, titleIndex)

        const slot = renderParagraphSlot?.(paragraph)
        const afterSlot = renderAfterParagraphSlot?.(paragraph)
        const previewChrome = documentPreview
          ? resolveConsentDocumentPreviewChrome(
              paragraph,
              draft.paragraphs[index + 1],
              submittedDateLabel,
              { signerName, signatureImageSrc },
              { noticeClosingVisible },
            )
          : null

        const content =
          documentPreview && paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.paymentRecord
            ? <ConsentPreviewPaymentInfo values={paymentBasicInfo} />
            : previewChrome != null
              ? previewChrome.content
              : slot != null
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

        const wrapped = wrapConsentParagraph(
          paragraph,
          title,
          content,
          documentPreview,
          previewChrome ?? undefined,
        )

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
      {showClosingRecipient ? (
        <div className={styles.bodyOnlyWrap}>
          <ConsentPreviewRecipient />
        </div>
      ) : null}
    </div>
  )
}
