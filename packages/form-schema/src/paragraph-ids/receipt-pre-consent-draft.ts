import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeVerticalTableParagraph,
  normalizeWritingFormDraft,
  type AgreementExplanationTextParagraph,
  type ClosingParagraph,
  type HorizontalTableFieldCellValue,
  type HorizontalTableParagraph,
  type TitleWithPeriodParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

export const RECEIPT_PRE_CONSENT_TEMPLATE_CODE = 'agreement-receipt-pre-consent'

export const RECEIPT_PRE_CONSENT_IDS = {
  title: 'receipt-pre-consent-seed-title',
  intro: 'receipt-pre-consent-seed-intro',
  p1Collection: 'receipt-pre-consent-seed-p1-collection',
  p2ThirdParty: 'receipt-pre-consent-seed-p2-third-party',
  midConsentLine: 'receipt-pre-consent-seed-mid-consent-line',
  midDate: 'receipt-pre-consent-seed-mid-date',
  midSignature: 'receipt-pre-consent-seed-mid-signature',
  paymentRecord: 'receipt-pre-consent-seed-payment-record',
  finalConfirm: 'receipt-pre-consent-seed-final-confirm',
  tailDate: 'receipt-pre-consent-seed-tail-date',
  tailSignature: 'receipt-pre-consent-seed-tail-signature',
  closingRecipient: 'receipt-pre-consent-seed-closing-recipient',
} as const

export const RECEIPT_PRE_CONSENT_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(RECEIPT_PRE_CONSENT_IDS)
)

const P1_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의를 거부할 경우 기관 사업에 필요한 업무처리에 제약이 발생할 수 있습니다.'

const P2_BOTTOM =
  '위의 개인정보의 제3자 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의를 거부할 경우 실비 지급 등 업무처리에 제약이 발생할 수 있습니다.'

function createP1CollectionTable(): HorizontalTableParagraph {
  const colCount = 3
  const columnFields = Array.from({ length: colCount }, () => ({
    kind: 'text' as const,
    placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  }))
  const bodyRow: HorizontalTableFieldCellValue[] = [
    {
      kind: 'text',
      value:
        '성명, 생년월일, 주소, 전화번호, e-mail,\n계좌정보(은행, 계좌번호, 예금주)',
    },
    {
      kind: 'text',
      value: '실비 정산 지급 및\n사업에 필요한 업무처리',
    },
    {
      kind: 'text',
      value: '10년',
    },
  ]
  return normalizeHorizontalTableParagraph({
    id: RECEIPT_PRE_CONSENT_IDS.p1Collection,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '개인정보 수집·이용',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['항목', '수집·이용 목적', '보유기간'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields,
    fieldDataRows: [bodyRow],
    bottomText: P1_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

function createP2ThirdPartyTable(): HorizontalTableParagraph {
  const colCount = 4
  const columnFields = [
    { kind: 'text' as const, placeholder: '제공받는 곳을 입력해 주세요' },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
  ]
  const bodyRows: HorizontalTableFieldCellValue[][] = [
    [
      { kind: 'text', value: '사회복지공동모금회' },
      {
        kind: 'text',
        value:
          '성명, 생년월일, 주소, 전화번호, e-mail,\n계좌정보(은행, 계좌번호, 예금주)',
      },
      { kind: 'text', value: '배분사업 수행 관련 증빙서류 제출' },
      { kind: 'text', value: '10년' },
    ],
  ]
  return normalizeHorizontalTableParagraph({
    id: RECEIPT_PRE_CONSENT_IDS.p2ThirdParty,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '개인정보 제3자 제공·이용',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['제공받는 곳', '항목', '제공목적', '제공받는 자의 보유기간'],
    dataRows: bodyRows.map(() => Array.from({ length: colCount }, () => '')),
    columnFields,
    fieldDataRows: bodyRows,
    bottomText: P2_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

const seedTitle: TitleWithPeriodParagraph = {
  id: RECEIPT_PRE_CONSENT_IDS.title,
  kind: 'description',
  variant: 'survey_title_with_period',
  requiredMark: true,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  surveyTitle: '영수증 발급 사전 동의서',
  surveyDescription: '',
  periodMode: 'immediate',
  startAt: null,
  endAt: null,
  showWritingPeriodOnForm: false,
}

const intro: AgreementExplanationTextParagraph = {
  id: RECEIPT_PRE_CONSENT_IDS.intro,
  kind: 'single_item',
  variant: 'agreement_explanation_text',
  requiredMark: true,
  paragraphTitle: '개인정보 수집‧이용 및 제공 동의서',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  bodyPlaceholder: '',
  bodyText:
    'JA KOREA (이하 "기관"이라 함)는 「개인정보 보호법」 제15조 및 22조에 의거하여 개인정보 수집 및 이용에 관한 정보주체의 동의절차를 준수하며,\n개인정보 제공자가 동의한 이용목적 외의 용도로는 이용, 제공되지 않습니다. 제공된 개인정보는 개인정보 관리책임자를 통해 열람, 정정, 삭제 등을 요구할 수 있습니다.',
  answerRequired: true,
}

const midConsentLine: AgreementExplanationTextParagraph = {
  id: RECEIPT_PRE_CONSENT_IDS.midConsentLine,
  kind: 'single_item',
  variant: 'agreement_explanation_text',
  requiredMark: true,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  bodyPlaceholder: '',
  bodyText:
    '상기 본인은 위와 같이 「개인정보보호법」등 관련 법규에 의거하여 개인정보 수집 및 활용에 동의합니다.',
  answerRequired: true,
}

const midDate: WritingFormParagraph = {
  id: RECEIPT_PRE_CONSENT_IDS.midDate,
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_date',
  requiredMark: true,
  paragraphTitle: '날짜 유형',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
}

const midSignature: WritingFormParagraph = {
  id: RECEIPT_PRE_CONSENT_IDS.midSignature,
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_signature',
  requiredMark: true,
  paragraphTitle: '서명란 유형',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
}

const paymentRecord = normalizeVerticalTableParagraph({
  id: RECEIPT_PRE_CONSENT_IDS.paymentRecord,
  kind: 'single_item',
  variant: 'vertical_table',
  verticalTableFlavor: 'text',
  requiredMark: true,
  paragraphTitle: '지급 확인 정보',
  paragraphDescription: '',
  participatesInTitleNumbering: true,
  rows: [{ stageCount: 1, headers: [''], cells: [''], stageKinds: ['text'] }],
  bottomText: '',
  showBottomText: false,
  showBottomConsent: false,
  bottomConsent: 'agree',
  answerRequired: true,
})

const finalConfirm: AgreementExplanationTextParagraph = {
  id: RECEIPT_PRE_CONSENT_IDS.finalConfirm,
  kind: 'single_item',
  variant: 'agreement_explanation_text',
  requiredMark: true,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  bodyPlaceholder: '',
  bodyText:
    '본인은 본 비용 지급 목적의 활동에 참여하였으며 상기 내용을 바탕으로 금액을 수령함을 확인합니다.',
  answerRequired: true,
}

const tailDate: WritingFormParagraph = {
  id: RECEIPT_PRE_CONSENT_IDS.tailDate,
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_date',
  requiredMark: true,
  paragraphTitle: '날짜 유형',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
}

const tailSignature: WritingFormParagraph = {
  id: RECEIPT_PRE_CONSENT_IDS.tailSignature,
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_signature',
  requiredMark: true,
  paragraphTitle: '서명란 유형',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
}

const closingRecipient: ClosingParagraph = {
  id: RECEIPT_PRE_CONSENT_IDS.closingRecipient,
  kind: 'description',
  variant: 'closing',
  requiredMark: true,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  body: 'JA KOREA 귀하',
}

export function createReceiptPreConsentDraft(): WritingFormDraft {
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      seedTitle,
      intro,
      createP1CollectionTable(),
      createP2ThirdPartyTable(),
      midConsentLine,
      midDate,
      midSignature,
      paymentRecord,
      finalConfirm,
      tailDate,
      tailSignature,
      closingRecipient,
    ],
  })
}

export const RECEIPT_PRE_CONSENT_HORIZONTAL_TABLE_IDS = new Set<string>([
  RECEIPT_PRE_CONSENT_IDS.p1Collection,
  RECEIPT_PRE_CONSENT_IDS.p2ThirdParty,
])

export function overlayReceiptPreConsentSeedHorizontalTables(
  draft: WritingFormDraft
): WritingFormDraft {
  const seedDraft = createReceiptPreConsentDraft()
  const seedById = new Map(seedDraft.paragraphs.map(p => [p.id, p] as const))

  const resolvedById = new Map<string, WritingFormParagraph>()
  for (const p of draft.paragraphs) {
    if (RECEIPT_PRE_CONSENT_HORIZONTAL_TABLE_IDS.has(p.id)) {
      resolvedById.set(p.id, seedById.get(p.id) ?? p)
    } else {
      resolvedById.set(p.id, p)
    }
  }

  const paragraphs: WritingFormParagraph[] = []
  const usedIds = new Set<string>()
  for (const seedParagraph of seedDraft.paragraphs) {
    const existing = resolvedById.get(seedParagraph.id)
    paragraphs.push(existing ?? seedParagraph)
    usedIds.add(seedParagraph.id)
  }
  for (const p of draft.paragraphs) {
    if (usedIds.has(p.id)) continue
    if (RECEIPT_PRE_CONSENT_SEED_PARAGRAPH_IDS.has(p.id)) continue
    paragraphs.push(resolvedById.get(p.id) ?? p)
  }

  return normalizeWritingFormDraft({
    ...draft,
    paragraphs,
  })
}

export function receiptPreConsentDraftContainsResidentNumber(draft: WritingFormDraft): boolean {
  return draft.paragraphs.some(paragraph => {
    if (paragraph.id.toLowerCase().includes('rrn')) return true
    const blob = JSON.stringify(paragraph)
    return blob.includes('주민등록번호') || blob.includes('고유식별')
  })
}
