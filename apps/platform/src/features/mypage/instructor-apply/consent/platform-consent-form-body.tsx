import type {
  PaymentStatementBasicInfoValues,
  PlatformConsentFillOptions,
} from '@jakorea/form-schema/consent'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/payment-statement-pre-consent-draft'
import { RECEIPT_PRE_CONSENT_IDS } from '@jakorea/form-schema/paragraph-ids/receipt-pre-consent-draft'
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
import type { PortraitPersonalConsentPrefillLock } from './portrait-prefill-lock'
import previewTypography from '@/features/mypage/settings/ui/consent-document-preview-typography.module.css'
import styles from './consent-form.module.css'

export type PlatformConsentFormBodyProps = {
  draft: WritingFormDraft
  hiddenParagraphIds: ReadonlySet<string>
  onUpdateParagraph: FormUpdateParagraph
  fillOptions?: PlatformConsentFillOptions
  /** 행정정보 공동이용 — 대상자 본인 성명(포털 로그인 회원명) */
  lockedNoticeSubjectMemberName?: string
  /** 초상권 1번 표 — 회원정보로 채운 성명·소속 잠금 */
  portraitPrefillLock?: PortraitPersonalConsentPrefillLock
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
  /**
   * A4 쪽 분할 시 전체(표시 대상) 단락 — 섹션 번호를 쪽마다 1부터 다시 세지 않고
   * 문서 전체 기준 번호(지급조서 2쪽 첫 섹션 = `5.`)를 쓰기 위한 기준 목록.
   */
  titleNumberingParagraphs?: readonly WritingFormParagraph[]
}

/** Platform 작성 화면 — 지급조서·영수증 `지급조서` 카드 설명(앱 UI 안내, 시안 S68) */
const PAYMENT_RECORD_WRITE_DESCRIPTION: Record<string, string> = {
  [PAYMENT_STATEMENT_PRE_CONSENT_IDS.paymentRecord]:
    '영문 성명·주민등록번호·정산 계좌 외의 기본 정보는 마이페이지에 등록된 정보를 불러옵니다. 수정이 필요하면 마이페이지에서 변경해 주세요.',
  [RECEIPT_PRE_CONSENT_IDS.paymentRecord]:
    '영문 성명·정산 계좌 외의 기본 정보는 마이페이지에 등록된 정보를 불러옵니다. 수정이 필요하면 마이페이지에서 변경해 주세요.',
}

/** 서문 카드 — 번호·`*`·라디오 없음(시안) */
const INTRO_PARAGRAPH_IDS_WITHOUT_REQUIRED = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.intro,
  RECEIPT_PRE_CONSENT_IDS.intro,
])

/** 지급조서 기본정보 카드 — 입력 칸 필수 검증이 항상 적용되므로 `*` 표시 */
const PAYMENT_RECORD_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.paymentRecord,
  RECEIPT_PRE_CONSENT_IDS.paymentRecord,
])

function resolveParagraphBodyText(paragraph: WritingFormParagraph | undefined): string {
  if (
    paragraph?.kind === 'single_item' &&
    paragraph.variant === 'agreement_explanation_text'
  ) {
    return paragraph.bodyText.trim()
  }
  return ''
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

/** 제목·카드 셸 없이 본문만 (마무리글, 전자서명 슬롯, 지급조서·영수증 진술문 등) */
function isBodyOnlyParagraph(paragraph: WritingFormParagraph, documentPreview?: boolean): boolean {
  if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine) return true
  if (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm) return true
  if (paragraph.id === RECEIPT_PRE_CONSENT_IDS.midConsentLine) return true
  if (paragraph.id === RECEIPT_PRE_CONSENT_IDS.finalConfirm) return true
  if (paragraph.id === EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing) return true
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
  footerNote?: string,
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
      description={
        /** 지급조서 섹션만 — 다른 단락의 설명은 본문 렌더러가 이미 표시(서약 조항 등 중복 방지) */
        PAYMENT_RECORD_PARAGRAPH_IDS.has(paragraph.id)
          ? paragraph.paragraphDescription?.trim() ||
            PAYMENT_RECORD_WRITE_DESCRIPTION[paragraph.id] ||
            undefined
          : undefined
      }
      required={
        INTRO_PARAGRAPH_IDS_WITHOUT_REQUIRED.has(paragraph.id)
          ? false
          : PAYMENT_RECORD_PARAGRAPH_IDS.has(paragraph.id) ||
            resolvePlatformConsentSectionRequired(paragraph)
      }
    >
      {content}
      {footerNote ? <p className={styles.sectionFooterNote}>{footerNote}</p> : null}
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
  portraitPrefillLock,
  renderParagraphSlot,
  renderAfterParagraphSlot,
  documentPreview = false,
  documentPreviewTemplateId,
  submittedDateLabel = '-',
  showClosingRecipient = false,
  paymentBasicInfo,
  signerName,
  signatureImageSrc,
  titleNumberingParagraphs,
}: PlatformConsentFormBodyProps) {
  let numberedIndex = 0
  /** 문서 전체 기준 섹션 번호(쪽 분할 시에도 데이터 번호 유지) */
  const titleIndexById = new Map<string, number>()
  if (titleNumberingParagraphs != null) {
    let index = 0
    for (const paragraph of titleNumberingParagraphs) {
      if (shouldHideParagraph(paragraph, hiddenParagraphIds, documentPreview)) continue
      if (paragraph.participatesInTitleNumbering) {
        titleIndexById.set(paragraph.id, index)
        index += 1
      }
    }
  }
  /** 행정정보 5번 하단 안내 — 작성 화면에서는 대상자 본인 카드 안에 표시 */
  const noticeSubjectNoteParagraph = documentPreview
    ? undefined
    : draft.paragraphs.find(
        paragraph =>
          paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.subjectNote &&
          draft.paragraphs.some(p => p.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.subject) &&
          !hiddenParagraphIds.has(paragraph.id),
      )
  const noticeSubjectNote = resolveParagraphBodyText(noticeSubjectNoteParagraph)

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
        if (noticeSubjectNoteParagraph != null && paragraph.id === noticeSubjectNoteParagraph.id) {
          return null
        }

        const usesNumber = paragraph.participatesInTitleNumbering
        const localTitleIndex = usesNumber ? numberedIndex++ : numberedIndex
        const titleIndex = titleIndexById.get(paragraph.id) ?? localTitleIndex
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
          documentPreview &&
          (paragraph.id === PAYMENT_STATEMENT_PRE_CONSENT_IDS.paymentRecord ||
            paragraph.id === RECEIPT_PRE_CONSENT_IDS.paymentRecord)
            ? (
                <ConsentPreviewPaymentInfo
                  values={paymentBasicInfo}
                  variant={
                    paragraph.id === RECEIPT_PRE_CONSENT_IDS.paymentRecord ? 'receipt' : 'payment'
                  }
                />
              )
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
                      portraitPrefillLock={portraitPrefillLock}
                      documentPreview={documentPreview}
                    />
                  )

        const wrapped = wrapConsentParagraph(
          paragraph,
          title,
          content,
          documentPreview,
          previewChrome ?? undefined,
          paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.subject ? noticeSubjectNote : undefined,
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
