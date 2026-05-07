import dayjs from 'dayjs'
import {
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type AgreementExplanationTextParagraph,
  type ClosingParagraph,
  type HorizontalTableParagraph,
  type TitleWithPeriodParagraph,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

export const PAYMENT_STATEMENT_PRE_CONSENT_IDS = {
  title: 'payment-statement-pre-consent-seed-title',
  tableBasic: 'payment-statement-pre-consent-seed-table-basic',
  tableCalcInfo: 'payment-statement-pre-consent-seed-table-calc-info',
  tableCalcLines: 'payment-statement-pre-consent-seed-table-calc-lines',
  tableWorkLog: 'payment-statement-pre-consent-seed-table-work-log',
  consentNotice: 'payment-statement-pre-consent-seed-consent-notice',
  closingDate: 'payment-statement-pre-consent-seed-closing-date',
  closingSignature: 'payment-statement-pre-consent-seed-closing-signature',
} as const

export const PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.title,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tableBasic,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tableCalcInfo,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tableCalcLines,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tableWorkLog,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.consentNotice,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingDate,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingSignature,
])

function dateLabel(now = new Date()): string {
  return dayjs(now).format('YYYY년 MM월 DD일')
}

function htText(
  id: string,
  paragraphTitle: string,
  columnHeaders: string[],
  dataRows: string[][]
): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle,
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'text',
    columnHeaders,
    dataRows,
    columnFields: [],
    fieldDataRows: [],
    bottomText: '',
    showBottomText: false,
    showBottomConsent: false,
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
  surveyTitle: 'JA KOREA 지급조서 사전 동의서',
  surveyDescription: '',
  periodMode: 'immediate',
  startAt: null,
  endAt: null,
  showWritingPeriodOnForm: false,
}

const tableBasic = htText(
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tableBasic,
  '지급조서 기본 정보',
  ['항목', '내용'],
  [
    ['성명', ''],
    ['영문 성명', ''],
    ['주민등록번호', ''],
    ['소속', ''],
    ['자택 주소', ''],
    ['정산 계좌 정보', '은행 · 계좌번호 · 예금주'],
    ['지급 목적', ''],
  ]
)

const tableCalcInfo = htText(
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tableCalcInfo,
  '강의비 산출 정보',
  ['항목', '내용'],
  [
    ['강사료 유형', ''],
    ['강사료 책정', ''],
    ['사업소득자 여부', ''],
    ['교육 진행 차시', ''],
    ['지급 항목 여부', '교통비 · 숙박비 등'],
    ['총 학생 수', ''],
    ['총 강의료', ''],
  ]
)

const tableCalcLines = htText(
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tableCalcLines,
  '강의비 산출 내역',
  ['참여 기관명', '강의 진행 일자', '지급/공제', '구분', '항목명', '금액'],
  [
    ['○○고등학교', '2025-09-01', '지급', '강사료', '강사료', '500,000'],
    ['○○고등학교', '2025-09-02', '지급', '비목', '교통비', '50,000'],
    ['○○고등학교', '2025-09-03', '지급', '비목', '숙박비', '100,000'],
    ['', '', '', '합계', '강사료+교통비+숙박비-원천징수', '650,000'],
  ]
)

const tableWorkLog = normalizeHorizontalTableParagraph({
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.tableWorkLog,
  kind: 'single_item',
  variant: 'horizontal_table',
  requiredMark: true,
  paragraphTitle: '근무일지',
  paragraphDescription: '설명 입력',
  participatesInTitleNumbering: true,
  tableFlavor: 'text',
  columnHeaders: ['날짜', '근무자(인)', '확인자(인)', '날짜', '근무자(인)', '확인자(인)'],
  dataRows: Array.from({ length: 16 }, () => ['', '', '', '', '', '']),
  columnFields: [],
  fieldDataRows: [],
  bottomText: '',
  showBottomText: false,
  showBottomConsent: false,
  bottomConsent: 'agree',
  answerRequired: true,
})

const consentNotice: AgreementExplanationTextParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.consentNotice,
  kind: 'single_item',
  variant: 'agreement_explanation_text',
  requiredMark: false,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  bodyPlaceholder: '',
  bodyText:
    '상기 기재한 내용은 사실과 다름이 없으며, 지급조서 발급을 위한 개인정보 및 정산정보 활용에 동의합니다.',
  answerRequired: false,
}

const seedClosingSignature: ClosingParagraph = {
  id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingSignature,
  kind: 'description',
  variant: 'closing',
  requiredMark: false,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  body: '사단법인 JA KOREA 회장 이은형',
}

export function createPaymentStatementPreConsentDraft(): WritingFormDraft {
  const seedClosingDate: ClosingParagraph = {
    id: PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingDate,
    kind: 'description',
    variant: 'closing',
    requiredMark: false,
    paragraphTitle: '',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    body: dateLabel(),
  }

  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      seedTitle,
      tableBasic,
      tableCalcInfo,
      tableCalcLines,
      tableWorkLog,
      consentNotice,
      seedClosingDate,
      seedClosingSignature,
    ],
  })
}
