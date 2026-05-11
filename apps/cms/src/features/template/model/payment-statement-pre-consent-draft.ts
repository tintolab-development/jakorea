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
} from '@/features/template/model/writing-form-draft.schema'

export const PAYMENT_STATEMENT_PRE_CONSENT_IDS = {
  title: 'payment-statement-pre-consent-seed-title',
  intro: 'payment-statement-pre-consent-seed-intro',
  p1Collection: 'payment-statement-pre-consent-seed-p1-collection',
  p2RrnCollection: 'payment-statement-pre-consent-seed-p2-rrn-collection',
  p3ThirdParty: 'payment-statement-pre-consent-seed-p3-third-party',
  p4RrnThirdParty: 'payment-statement-pre-consent-seed-p4-rrn-third-party',
  midConsentLine: 'payment-statement-pre-consent-seed-mid-consent-line',
  midDate: 'payment-statement-pre-consent-seed-mid-date',
  midSignature: 'payment-statement-pre-consent-seed-mid-signature',
  paymentRecord: 'payment-statement-pre-consent-seed-payment-record',
  finalConfirm: 'payment-statement-pre-consent-seed-final-confirm',
  tailDate: 'payment-statement-pre-consent-seed-tail-date',
  tailSignature: 'payment-statement-pre-consent-seed-tail-signature',
  closingRecipient: 'payment-statement-pre-consent-seed-closing-recipient',
} as const

export const PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(PAYMENT_STATEMENT_PRE_CONSENT_IDS)
)

const P1_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 다만 동의하지 않을 경우 본 지급조서 사전 동의 절차를 진행할 수 없습니다.'

const P2_BOTTOM =
  '위의 고유식별번호(주민등록번호) 수집·이용에 대한 동의를 거부할 권리가 있습니다. 다만 동의하지 않을 경우 본 지급조서 사전 동의 절차를 진행할 수 없습니다.'

const P3_BOTTOM =
  '위의 개인정보 제3자 제공에 대한 동의를 거부할 권리가 있습니다. 다만 동의하지 않을 경우 본 지급조서 사전 동의 절차를 진행할 수 없습니다.'

const P4_BOTTOM =
  '위의 고유식별번호 제3자 제공에 대한 동의를 거부할 권리가 있습니다. 다만 동의하지 않을 경우 본 지급조서 사전 동의 절차를 진행할 수 없습니다.'

function createP1CollectionTable(): HorizontalTableParagraph {
  const colCount = 3
  const columnFields = Array.from({ length: colCount }, () => ({
    kind: 'text' as const,
    placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  }))
  const bodyRow: HorizontalTableFieldCellValue[] = [
    {
      kind: 'text',
      value: '성명, 연락처, 이메일, 소속, 계좌정보 등 지급 및 정산에 필요한 정보',
    },
    {
      kind: 'text',
      value: '지급조서 작성, 지급 대상 확인, 세무·회계 처리 및 관련 안내',
    },
    {
      kind: 'text',
      value:
        '수집·이용 목적 달성 시까지. 관련 법령에 따라 보존이 필요한 경우 해당 기간까지 보관 후 지체 없이 파기',
    },
  ]
  return normalizeHorizontalTableParagraph({
    id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '1. 개인정보 수집·이용',
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

function createP2RrnCollectionTable(): HorizontalTableParagraph {
  const colCount = 3
  const columnFields = Array.from({ length: colCount }, () => ({
    kind: 'text' as const,
    placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  }))
  const bodyRow: HorizontalTableFieldCellValue[] = [
    {
      kind: 'text',
      value: '주민등록번호',
    },
    {
      kind: 'text',
      value: '소득 지급 및 원천징수 등 세무 신고·관리',
    },
    {
      kind: 'text',
      value:
        '수집·이용 목적 달성 시까지. 관련 법령에 따라 보존이 필요한 경우 해당 기간까지 보관 후 지체 없이 파기',
    },
  ]
  return normalizeHorizontalTableParagraph({
    id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '2. 고유식별번호(주민등록번호) 수집·이용',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['항목', '수집·이용 목적', '보유기간'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields,
    fieldDataRows: [bodyRow],
    bottomText: P2_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

function createP3ThirdPartyTable(): HorizontalTableParagraph {
  const colCount = 4
  const columnFields = [
    { kind: 'text' as const, placeholder: '제공받는 곳을 입력해 주세요' },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
  ]
  const bodyRow: HorizontalTableFieldCellValue[] = [
    { kind: 'text', value: '국세청 등 관계 기관' },
    {
      kind: 'text',
      value: '성명, 연락처, 이메일, 소속, 계좌정보 등',
    },
    {
      kind: 'text',
      value: '세무 신고·공제·환급 및 관련 법령에 따른 업무 수행',
    },
    {
      kind: 'text',
      value: '제공 목적 달성 시 또는 관련 법령에 따른 보존 기간',
    },
  ]
  return normalizeHorizontalTableParagraph({
    id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.p3ThirdParty,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '3. 개인정보 제3자 제공·이용',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['제공받는 곳', '항목', '제공목적', '제공받는 자의 보유기간'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields,
    fieldDataRows: [bodyRow],
    bottomText: P3_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

function createP4RrnThirdPartyTable(): HorizontalTableParagraph {
  const colCount = 4
  const columnFields = [
    { kind: 'text' as const, placeholder: '제공받는 곳을 입력해 주세요' },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
  ]
  const bodyRow: HorizontalTableFieldCellValue[] = [
    { kind: 'text', value: '국세청 등 관계 기관' },
    {
      kind: 'text',
      value: '주민등록번호',
    },
    {
      kind: 'text',
      value: '소득 지급 및 원천징수 등 세무 신고·관리',
    },
    {
      kind: 'text',
      value: '제공 목적 달성 시 또는 관련 법령에 따른 보존 기간',
    },
  ]
  return normalizeHorizontalTableParagraph({
    id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '4. 고유식별번호 제3자 제공·이용',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['제공받는 곳', '항목', '제공목적', '제공받는 자의 보유기간'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields,
    fieldDataRows: [bodyRow],
    bottomText: P4_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

const seedTitle: TitleWithPeriodParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.title,
  kind: 'description',
  variant: 'survey_title_with_period',
  requiredMark: true,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  surveyTitle: '지급조서 사전 동의서',
  surveyDescription: '',
  periodMode: 'immediate',
  startAt: null,
  endAt: null,
  showWritingPeriodOnForm: false,
}

const intro: AgreementExplanationTextParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.intro,
  kind: 'single_item',
  variant: 'agreement_explanation_text',
  requiredMark: false,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  bodyPlaceholder: '',
  bodyText:
    '「개인정보 보호법」 등 관련 법령에 따라 개인정보를 수집·이용 및 제3자에게 제공하고자 합니다. 아래 내용을 충분히 확인하신 후 동의 여부를 선택해 주시기 바랍니다.',
  answerRequired: false,
}

const midConsentLine: AgreementExplanationTextParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine,
  kind: 'single_item',
  variant: 'agreement_explanation_text',
  requiredMark: false,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  bodyPlaceholder: '',
  bodyText:
    '위 개인정보 수집·이용, 고유식별번호 수집·이용, 제3자 제공에 관한 사항을 확인하였으며 이에 동의합니다.',
  answerRequired: false,
}

const midDate: WritingFormParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.midDate,
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_date',
  requiredMark: false,
  paragraphTitle: '날짜 유형',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
}

const midSignature: WritingFormParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.midSignature,
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_signature',
  requiredMark: false,
  paragraphTitle: '서명란 유형',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
}

const paymentRecord = normalizeVerticalTableParagraph({
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.paymentRecord,
  kind: 'single_item',
  variant: 'vertical_table',
  verticalTableFlavor: 'text',
  requiredMark: true,
  paragraphTitle: '5. 지급조서',
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
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm,
  kind: 'single_item',
  variant: 'agreement_explanation_text',
  requiredMark: false,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  bodyPlaceholder: '',
  bodyText:
    '본인은 상기 지급조서에 기재된 내용이 사실과 다름없음을 확인하며, 지급 대상으로 확정될 경우 지급 금액을 정당하게 수령함을 확인합니다.',
  answerRequired: false,
}

const tailDate: WritingFormParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailDate,
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_date',
  requiredMark: false,
  paragraphTitle: '날짜 유형',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
}

const tailSignature: WritingFormParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailSignature,
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_signature',
  requiredMark: false,
  paragraphTitle: '서명란 유형',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
}

const closingRecipient: ClosingParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingRecipient,
  kind: 'description',
  variant: 'closing',
  requiredMark: false,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  body: 'JA KOREA 귀하',
}

export function createPaymentStatementPreConsentDraft(): WritingFormDraft {
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      seedTitle,
      intro,
      createP1CollectionTable(),
      createP2RrnCollectionTable(),
      createP3ThirdPartyTable(),
      createP4RrnThirdPartyTable(),
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
