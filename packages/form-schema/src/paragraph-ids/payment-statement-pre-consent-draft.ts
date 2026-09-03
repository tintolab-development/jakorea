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

export const PAYMENT_STATEMENT_PRE_CONSENT_IDS = {
  title: 'payment-statement-pre-consent-seed-title',
  intro: 'payment-statement-pre-consent-seed-intro',
  p1Collection: 'payment-statement-pre-consent-seed-p1-collection',
  p2RrnCollection: 'payment-statement-pre-consent-seed-p2-rrn-collection',
  p3ThirdParty: 'payment-statement-pre-consent-seed-p3-third-party',
  p4RrnThirdParty: 'payment-statement-pre-consent-seed-p4-rrn-third-party',
  /** 시안 5번 — 지급조서(6) 직전·중간 서명 앞 */
  jaKoreaActivity: 'payment-statement-pre-consent-seed-ja-korea-activity',
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
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의를 거부할 경우 기관 사업에 필요한 업무처리에 제약이 발생할 수 있습니다.'

const P2_BOTTOM =
  '위의 고유식별번호(주민등록번호) 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의를 거부할 경우 활동비지급 및 세금신고 등 업무처리에 제약이 발생할 수 있습니다.'

const P3_BOTTOM =
  '위의 개인정보의 제3자 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의를 거부할 경우 활동비지급 및 세금신고 등 업무처리에 제약이 발생할 수 있습니다.'

const P4_BOTTOM =
  '위의 고유식별정보의 제3자 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의를 거부할 경우 활동비지급 및 세금 신고 등 업무처리에 제약이 발생할 수 있습니다.'

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
      value:
        '강사비, 회의비 등 목적에 맞게 사용 지급 및\n강사관리 및 사업에 필요한 업무처리',
    },
    {
      kind: 'text',
      value: '10년',
    },
  ]
  return normalizeHorizontalTableParagraph({
    id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection,
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
      value: '지급명세서(소득세 납부) 제출 항목',
    },
    {
      kind: 'text',
      value: '10년',
    },
  ]
  return normalizeHorizontalTableParagraph({
    id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '고유식별번호(주민등록번호) 수집·이용',
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
  const bodyRows: HorizontalTableFieldCellValue[][] = [
    [
      { kind: 'text', value: '국세청' },
      { kind: 'text', value: '성명, 주소' },
      { kind: 'text', value: '원천세 신고' },
      { kind: 'text', value: '소득세법에 따른 보관기간' },
    ],
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
    id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.p3ThirdParty,
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
    { kind: 'text', value: '국세청' },
    { kind: 'text', value: '성명, 주소' },
    { kind: 'text', value: '원천세 신고' },
    { kind: 'text', value: '소득세법에 따른 보관기간' },
  ]
  return normalizeHorizontalTableParagraph({
    id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '고유식별번호 제3자 제공·이용',
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
  requiredMark: true,
  paragraphTitle: '개인정보 수집‧이용 및 제공 동의서',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  bodyPlaceholder: '',
  bodyText:
    'JA KOREA (이하 "기관"이라 함)는 「개인정보 보호법」 제15조 및 22조에 의거하여 개인정보 수집 및 이용에 관한 정보주체의 동의절차를 준수하며,\n개인정보 제공자가 동의한 이용목적 외의 용도로는 이용, 제공되지 않습니다. 제공된 개인정보는 개인정보 관리책임자를 통해 열람, 정정, 삭제 등을 요구할 수 있습니다.',
  answerRequired: true,
}

/**
 * 시안 「5. JA Korea 활동 경험」— 좌측 라벨「활동 이력」+ 기간·프로그램명·역할 행.
 * fill UI는 CMS/Platform에서 커스텀 슬롯으로 렌더(지급조서 sidecar와 동일 패턴).
 */
const jaKoreaActivity = normalizeVerticalTableParagraph({
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.jaKoreaActivity,
  kind: 'single_item',
  variant: 'vertical_table',
  verticalTableFlavor: 'text',
  requiredMark: true,
  paragraphTitle: 'JA Korea 활동 경험',
  paragraphDescription: '',
  participatesInTitleNumbering: true,
  rows: [
    {
      stageCount: 2,
      headers: ['활동 이력', ''],
      cells: ['', ''],
      stageKinds: ['text', 'text'],
      placeholderHints: ['프로그램명', '역할'],
    },
    {
      stageCount: 2,
      headers: ['활동 이력', ''],
      cells: ['', ''],
      stageKinds: ['text', 'text'],
      placeholderHints: ['프로그램명', '역할'],
    },
  ],
  bottomText: '',
  showBottomText: false,
  showBottomConsent: false,
  bottomConsent: 'agree',
  answerRequired: true,
})

const midConsentLine: AgreementExplanationTextParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine,
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
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.midDate,
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_date',
  requiredMark: true,
  paragraphTitle: '날짜 유형',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
}

const midSignature: WritingFormParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.midSignature,
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_signature',
  requiredMark: true,
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
  paragraphTitle: '지급조서',
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
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailDate,
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_date',
  requiredMark: true,
  paragraphTitle: '날짜 유형',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
}

const tailSignature: WritingFormParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailSignature,
  kind: 'description',
  variant: 'system',
  systemPreset: 'agreement_signature',
  requiredMark: true,
  paragraphTitle: '서명란 유형',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
}

const closingRecipient: ClosingParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingRecipient,
  kind: 'description',
  variant: 'closing',
  requiredMark: true,
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
      jaKoreaActivity,
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

/** 지급조서 사전 동의서 — 가로형 시드 표(p1~p4) ID */
export const PAYMENT_STATEMENT_PRE_CONSENT_HORIZONTAL_TABLE_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.p1Collection,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.p2RrnCollection,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.p3ThirdParty,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty,
])

/**
 * 저장된 draft에 구 시드(1행·옛 문구)가 남아 있어도
 * 가로형 표 단락(p1~p4)은 최신 시드 내용으로 덮어쓴다.
 * 시드에 있는 mid/tail·활동경험·귀하 등 단락이 없으면 시드 순서로 보강한다.
 */
export function overlayPaymentStatementPreConsentSeedHorizontalTables(
  draft: WritingFormDraft
): WritingFormDraft {
  const seedDraft = createPaymentStatementPreConsentDraft()
  const seedById = new Map(seedDraft.paragraphs.map(p => [p.id, p] as const))

  const resolvedById = new Map<string, WritingFormParagraph>()
  for (const p of draft.paragraphs) {
    if (PAYMENT_STATEMENT_PRE_CONSENT_HORIZONTAL_TABLE_IDS.has(p.id)) {
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
    if (PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS.has(p.id)) continue
    paragraphs.push(resolvedById.get(p.id) ?? p)
  }

  return normalizeWritingFormDraft({
    ...draft,
    paragraphs,
  })
}
