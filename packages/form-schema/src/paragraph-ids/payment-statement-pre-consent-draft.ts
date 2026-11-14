import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeVerticalTableParagraph,
  normalizeWritingFormDraft,
  repairSeedHorizontalTableIfBroken,
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

/** 제거된 시드 단락 — API·localStorage 저장본에서 제거 */
export const PAYMENT_STATEMENT_PRE_CONSENT_REMOVED_SEED_PARAGRAPH_IDS = new Set<string>([
  'payment-statement-pre-consent-seed-ja-korea-activity',
])

const P1_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의를 거부할 경우 강사 신청과 강사비·영수증 금액 지급이 제한됩니다.'

const P2_BOTTOM =
  '주민등록번호는 「소득세법」에 따라 원천징수 및 지급명세서 제출을 위해 수집하는 정보로, 동의 대상이 아닙니다. 제공하지 않으면 활동비지급 및 세금신고 등 업무처리가 어렵습니다.'

const P3_BOTTOM =
  '국세청 제공은 「소득세법」에 따른 것으로 동의 대상이 아니며, 제공하지 않으면 활동비지급 및 세금 신고 등 업무처리가 어렵습니다.\n사회복지공동모금회 제공은 선택 사항으로 동의를 거부할 권리가 있으며, 동의하지 않아도 강사비·실비 지급은 제한되지 않습니다.\n다만 사회복지공동모금회 배분사업으로 운영하는 프로그램은 증빙서류 제출 등 업무처리에 제약이 발생할 수 있습니다.\n(선택) 위 개인정보 제3자 제공·이용(사회복지공동모금회)에 동의하십니까?'

const P4_BOTTOM =
  '주민등록번호는 「소득세법」에 따라 원천세 신고를 위해 국세청에 제공하는 정보로, 동의 대상이 아닙니다. 제공하지 않으면 활동비지급 및 세금 신고 등 업무처리가 어렵습니다.'

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
        '성명, 영문 성명, 생년월일, 소속, 주소, 전화번호, 이메일, 계좌정보(은행, 계좌번호, 예금주)',
    },
    {
      kind: 'text',
      value: '강사비 및 교통비 등 실비 지급 및 강사관리 및 사업에 필요한 업무 처리',
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
    paragraphTitle: '개인정보 수집‧이용',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['항목', '수집‧이용 목적', '보유기간'],
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
    // 시안: 법령에 따른 수집 — 동의 대상 아님(`*`·라디오 없음)
    requiredMark: false,
    paragraphTitle: '고유식별번호(주민등록번호) 수집‧이용 (법령에 따른 수집)',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['항목', '수집‧이용 목적', '보유기간'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields,
    fieldDataRows: [bodyRow],
    bottomText: P2_BOTTOM,
    showBottomText: true,
    showBottomConsent: false,
    bottomConsent: 'agree',
    answerRequired: false,
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
      { kind: 'text', value: '국세청 (법령에 따른 제공)' },
      { kind: 'text', value: '성명, 주소, 지급 금액' },
      // §8 D5 — CMS `원천세 신고` vs Platform `원천세신고` 결정 전 현행 유지
      { kind: 'text', value: '원천세 신고' },
      { kind: 'text', value: '소득세법에 따른 보관기간' },
    ],
    [
      { kind: 'text', value: '사회복지공동모금회 (선택 동의)' },
      {
        kind: 'text',
        value: '성명, 생년월일, 주소, 전화번호, 이메일, 계좌정보(은행, 계좌번호, 예금주)',
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
    paragraphTitle: '개인정보 제3자 제공‧이용',
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
    { kind: 'text', value: '주민등록번호' },
    { kind: 'text', value: '원천세신고' },
    { kind: 'text', value: '소득세법에 따른 보관기간' },
  ]
  return normalizeHorizontalTableParagraph({
    id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.p4RrnThirdParty,
    kind: 'single_item',
    variant: 'horizontal_table',
    // 시안: 법령에 따른 제공 — 동의 대상 아님(`*`·라디오 없음)
    requiredMark: false,
    paragraphTitle: '고유식별번호 제3자 제공·이용 (법령에 따른 제공)',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['제공받는 곳', '항목', '제공목적', '제공받는 자의 보유기간'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields,
    fieldDataRows: [bodyRow],
    bottomText: P4_BOTTOM,
    showBottomText: true,
    showBottomConsent: false,
    bottomConsent: 'agree',
    answerRequired: false,
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
  // 시안: 서문 카드 `*` 없음
  requiredMark: false,
  paragraphTitle: '개인정보 수집‧이용 및 제공 동의서',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  bodyPlaceholder: '',
  bodyText:
    'JA KOREA (이하 “기관”이라 함)는 「개인정보 보호법」제15조 및 22조에 의거하여 개인정보 수집 및 이용에 관한 정보주체의 동의절차를 준수하며, 개인정보 제공자가 동의한 이용목적(법령에 따라 처리하는 정보는 해당 법령에서 정한 목적) 외의 용도로는 이용․제공되지 않습니다.\n제공된 개인정보는 개인정보 보호책임자를 통해 열람, 정정, 삭제 등을 요구할 수 있습니다.',
  answerRequired: false,
}

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
  // 시안 5767:42072 · 6130:133665 — 단락 설명(Platform `PAYMENT_RECORD_WRITE_DESCRIPTION`과 같은 문구)
  paragraphDescription:
    '영문 성명·주민등록번호·정산 계좌 외의 기본 정보는 마이페이지에 등록된 정보를 불러옵니다. 수정이 필요하면 마이페이지에서 변경해 주세요.',
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
 * 가로형 표 단락(p1~p4)은 **서버 저장값 우선** — 표가 비었거나 구조가 깨진 경우
 * (열 수 불일치·시드보다 적은 행·전부 빈 값)에만 최신 시드로 복구한다.
 * 시드에 있는 mid/tail·귀하 등 단락이 없으면 시드 순서로 보강한다.
 * 제거된 단락(JA Korea 활동 경험 등)은 저장본에서 삭제한다.
 */
export function stripRemovedPaymentStatementPreConsentParagraphs(
  draft: WritingFormDraft
): WritingFormDraft {
  const paragraphs = draft.paragraphs.filter(
    p => !PAYMENT_STATEMENT_PRE_CONSENT_REMOVED_SEED_PARAGRAPH_IDS.has(p.id)
  )
  if (paragraphs.length === draft.paragraphs.length) return draft
  return { ...draft, paragraphs }
}

export function overlayPaymentStatementPreConsentSeedHorizontalTables(
  draft: WritingFormDraft
): WritingFormDraft {
  const stripped = stripRemovedPaymentStatementPreConsentParagraphs(draft)
  const seedDraft = createPaymentStatementPreConsentDraft()
  const seedById = new Map(seedDraft.paragraphs.map(p => [p.id, p] as const))

  const resolvedById = new Map<string, WritingFormParagraph>()
  for (const p of stripped.paragraphs) {
    const seedParagraph = seedById.get(p.id)
    if (
      PAYMENT_STATEMENT_PRE_CONSENT_HORIZONTAL_TABLE_IDS.has(p.id) &&
      seedParagraph?.kind === 'single_item' &&
      seedParagraph.variant === 'horizontal_table'
    ) {
      resolvedById.set(p.id, repairSeedHorizontalTableIfBroken(p, seedParagraph))
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
  for (const p of stripped.paragraphs) {
    if (usedIds.has(p.id)) continue
    if (PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS.has(p.id)) continue
    paragraphs.push(resolvedById.get(p.id) ?? p)
  }

  return normalizeWritingFormDraft({
    ...stripped,
    paragraphs,
  })
}
