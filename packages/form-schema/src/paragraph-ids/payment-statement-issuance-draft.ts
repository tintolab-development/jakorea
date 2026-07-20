/**
 * 발급 양식 — 지급조서(발급용) 시드 초안
 * 스크린 레이아웃 근사(텍스트형 가로 표 위주). 시드 id는 잠금 판별에 사용.
 */

import dayjs from 'dayjs'
import {
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type ClosingParagraph,
  type HorizontalTableParagraph,
  type TitleWithPeriodParagraph,
  type WritingFormDraft,
} from '../writing-form/draft-schema.js'

export const PAYMENT_STATEMENT_ISSUANCE_IDS = {
  title: 'payment-statement-seed-title',
  tableBasic: 'payment-statement-seed-table-basic',
  tableCalcInfo: 'payment-statement-seed-table-calc-info',
  tableCalcLines: 'payment-statement-seed-table-calc-lines',
  tableWorkLog: 'payment-statement-seed-table-work-log',
  closingDate: 'payment-statement-seed-closing-date',
  closingSignature: 'payment-statement-seed-closing-signature',
} as const

/** 템플릿 고정 단락 — 삭제·복제·구조 편집·순서 변경 불가 */
export const PAYMENT_STATEMENT_SEED_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_ISSUANCE_IDS.title,
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableBasic,
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcInfo,
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcLines,
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableWorkLog,
  PAYMENT_STATEMENT_ISSUANCE_IDS.closingDate,
  PAYMENT_STATEMENT_ISSUANCE_IDS.closingSignature,
])

function paymentStatementIssuanceDateLabel(now = new Date()): string {
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
  id: PAYMENT_STATEMENT_ISSUANCE_IDS.title,
  kind: 'description',
  variant: 'survey_title_with_period',
  requiredMark: true,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  surveyTitle: 'JA KOREA 지급조서',
  surveyDescription: '',
  periodMode: 'immediate',
  startAt: null,
  endAt: null,
  showWritingPeriodOnForm: false,
}

/** 지급조서 기본 정보 블록 */
const tableBasic = htText(
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableBasic,
  '지급조서',
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

/** 강의비 산출 정보 */
const tableCalcInfo = htText(
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcInfo,
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

/** 강의비 산출 내역 — 편집기 시드(헤더·행 텍스트). 실제 미리보기 본문은 `PaymentStatementIssuanceCalculationLinesTable`가 담당 */
const tableCalcLines = htText(
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcLines,
  '강의비 산출 내역',
  ['참여 기관명', '강의 진행 일자', '지급/공제', '구분', '항목명', '금액'],
  [
    ['○○고등학교', '2025-09-01', '지급', '강사료', '강사료', '500,000'],
    ['○○고등학교', '2025-09-02', '지급', '비목', '교통비', '50,000'],
    ['○○고등학교', '2025-09-03', '지급', '비목', '숙박비', '100,000'],
    ['', '', '', '합계', '강사료+교통비+숙박비-원천징수', '650,000'],
  ]
)

/** 근무일지 — 본문은 전용 정적 테이블 UI; dataRows는 스키마·정규화용 16행 빈 행 */
const tableWorkLog = normalizeHorizontalTableParagraph({
  id: PAYMENT_STATEMENT_ISSUANCE_IDS.tableWorkLog,
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

const seedClosingSignature: ClosingParagraph = {
  id: PAYMENT_STATEMENT_ISSUANCE_IDS.closingSignature,
  kind: 'description',
  variant: 'closing',
  requiredMark: false,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  body: '사단법인 JA KOREA 회장 이은형',
}

export function createPaymentStatementIssuanceDraft(): WritingFormDraft {
  const seedClosingDate: ClosingParagraph = {
    id: PAYMENT_STATEMENT_ISSUANCE_IDS.closingDate,
    kind: 'description',
    variant: 'closing',
    requiredMark: false,
    paragraphTitle: '',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    body: paymentStatementIssuanceDateLabel(),
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
      seedClosingDate,
      seedClosingSignature,
    ],
  })
}

/** [단락 추가]로 삽입되는 사용자 편집 가능 제목형 */
export function createPaymentStatementUserTitleParagraph(id: string): TitleWithPeriodParagraph {
  return {
    id,
    kind: 'description',
    variant: 'survey_title_with_period',
    requiredMark: true,
    paragraphTitle: '',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    surveyTitle: '',
    surveyDescription: '',
    periodMode: 'immediate',
    startAt: null,
    endAt: null,
    showWritingPeriodOnForm: false,
  }
}
