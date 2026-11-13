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
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'
import {
  SETTLEMENT_ACCOMMODATION_PARAGRAPH_BOTTOM_TEXT,
  SETTLEMENT_ACCOMMODATION_PARAGRAPH_DESCRIPTION,
  SETTLEMENT_CALC_INFO_PARAGRAPH_DESCRIPTION,
  SETTLEMENT_TRANSPORT_PARAGRAPH_BOTTOM_TEXT,
  SETTLEMENT_TRANSPORT_PARAGRAPH_DESCRIPTION,
} from './settlement-application-issuance-draft.js'

export const PAYMENT_STATEMENT_ISSUANCE_IDS = {
  title: 'payment-statement-seed-title',
  tableBasic: 'payment-statement-seed-table-basic',
  tableCalcInfo: 'payment-statement-seed-table-calc-info',
  /** 발급 문서(실제 지급조서 미리보기·일괄 PDF) 전용 — 템플릿 시드(시안 5767:46455)에는 없음 */
  tableCalcLines: 'payment-statement-seed-table-calc-lines',
  tableTransport: 'payment-statement-seed-table-transport',
  tableAccommodation: 'payment-statement-seed-table-accommodation',
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
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableTransport,
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableAccommodation,
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
  dataRows: string[][],
  paragraphDescription = ''
): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle,
    paragraphDescription,
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

/** 지급조서 기본 정보 블록 — 시안 5767:46455 좌측 캔버스 「기본 정보」·「설명 입력」(사용자 결정 261113) */
const tableBasic = htText(
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableBasic,
  '기본 정보',
  ['항목', '내용'],
  [
    ['성명', ''],
    ['영문 성명', ''],
    ['주민등록번호', ''],
    ['소속', ''],
    ['자택 주소', ''],
    ['정산 계좌 정보', '은행 · 계좌번호 · 예금주'],
    ['지급 목적', ''],
  ],
  '설명 입력'
)

/** 예전 「강사비 산출 정보」 단락 제목 — 서버 저장본 보정·발급 문서 draft에서 비교 */
export const PAYMENT_STATEMENT_LEGACY_CALC_INFO_PARAGRAPH_TITLE = '강사비 산출 정보'

/** 예전 「강사비 산출 정보」 7항목(지급 항목 여부·총 학생 수 포함) — 실제 발급 문서는 이 구성을 유지 */
const LEGACY_CALC_INFO_DATA_ROWS: string[][] = [
  ['강사료 유형', ''],
  ['강사료 책정', ''],
  ['사업소득자 여부', ''],
  ['교육 진행 차시', ''],
  ['지급 항목 여부', '교통비 · 숙박비 등'],
  ['총 학생 수', ''],
  ['총 강의료', ''],
]

const LEGACY_CALC_INFO_ROW_LABELS = new Set(['지급 항목 여부', '총 학생 수'])

/** 시안 5767:46455 좌측 캔버스 「강사비 산출 내역」 5항목 — 정산 신청서(5767:44580)와 같은 구성 */
const CALC_INFO_DATA_ROWS: string[][] = [
  ['강사비 유형', ''],
  ['강사비 책정', ''],
  ['사업소득자 여부', ''],
  ['교육 진행 차시', ''],
  ['총 강사비', ''],
]

/**
 * 「강사비 산출 정보/내역」 단락이 예전 7항목(지급 항목 여부·총 학생 수) 구성인지.
 * 실제 발급 문서 draft(`createPaymentStatementIssuanceDocumentDraft`)는 예전 구성을 유지하므로 본문 레이아웃 분기에 쓴다.
 */
export function isPaymentStatementLegacyCalcInfoParagraph(p: WritingFormParagraph): boolean {
  if (p.id !== PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcInfo) return false
  if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') return false
  return p.dataRows.some(row => LEGACY_CALC_INFO_ROW_LABELS.has(row[0]?.trim() ?? ''))
}

/** 강사비 산출 내역 — 시안 5767:46455 (정산 신청서 단락과 같은 제목·설명·항목) */
const tableCalcInfo = htText(
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcInfo,
  '강사비 산출 내역',
  ['항목', '내용'],
  CALC_INFO_DATA_ROWS,
  SETTLEMENT_CALC_INFO_PARAGRAPH_DESCRIPTION
)

/** 실제 발급 문서 전용 — 예전 「강사비 산출 정보」 7항목(총 학생 수 등 발급 데이터 표시) */
const documentTableCalcInfo = htText(
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcInfo,
  PAYMENT_STATEMENT_LEGACY_CALC_INFO_PARAGRAPH_TITLE,
  ['항목', '내용'],
  LEGACY_CALC_INFO_DATA_ROWS
)

function htTextWithBottom(
  id: string,
  paragraphTitle: string,
  paragraphDescription: string,
  bottomText: string
): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    ...htText(id, paragraphTitle, ['항목', '내용'], [['', '']], paragraphDescription),
    bottomText,
    showBottomText: true,
  })
}

/** 교통비 신청 — 시안 5767:46455 (정산 신청서 교통비 신청과 같은 설명·하단 안내) */
const tableTransport = htTextWithBottom(
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableTransport,
  '교통비 신청',
  SETTLEMENT_TRANSPORT_PARAGRAPH_DESCRIPTION,
  SETTLEMENT_TRANSPORT_PARAGRAPH_BOTTOM_TEXT
)

/** 숙박비 신청 — 시안 5767:46455 (정산 신청서 숙박비 신청과 같은 설명·하단 안내) */
const tableAccommodation = htTextWithBottom(
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableAccommodation,
  '숙박비 신청',
  SETTLEMENT_ACCOMMODATION_PARAGRAPH_DESCRIPTION,
  SETTLEMENT_ACCOMMODATION_PARAGRAPH_BOTTOM_TEXT
)

/**
 * 강사비 산출 내역(산출 행 표) — 실제 발급 문서 전용(헤더·행 텍스트는 스키마용).
 * 본문은 `PaymentStatementIssuanceCalculationLinesTable`가 발급 데이터로 그린다. 템플릿 시드(시안 5767:46455)에는 없음.
 */
const tableCalcLines = htText(
  PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcLines,
  '강사비 산출 내역',
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

function createSeedClosingDate(): ClosingParagraph {
  return {
    id: PAYMENT_STATEMENT_ISSUANCE_IDS.closingDate,
    kind: 'description',
    variant: 'closing',
    requiredMark: false,
    paragraphTitle: '',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    body: paymentStatementIssuanceDateLabel(),
  }
}

/**
 * 템플릿 관리 시드 — 시안 5767:46455 좌측 캔버스(사용자 결정 261113):
 * 제목 → 기본 정보 → 강사비 산출 내역 → 교통비 신청 → 숙박비 신청 → 근무일지 → 날짜·회장.
 */
export function createPaymentStatementIssuanceDraft(): WritingFormDraft {
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs: [
      seedTitle,
      tableBasic,
      tableCalcInfo,
      tableTransport,
      tableAccommodation,
      tableWorkLog,
      createSeedClosingDate(),
      seedClosingSignature,
    ],
  })
}

/**
 * 실제 지급조서 발급 문서(참여 강사·정산 화면 미리보기, 일괄 PDF, 정산 신청서 문서 미리보기) draft.
 * 발급 데이터가 채워지는 「강사비 산출 정보」 7항목·「강사비 산출 내역」 산출 행 표를 유지한다.
 * 교통비·숙박비 신청 단락은 발급 데이터 매핑이 없어 넣지 않는다(템플릿 시드와 다름 — 총괄 보고).
 */
export function createPaymentStatementIssuanceDocumentDraft(): WritingFormDraft {
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs: [
      seedTitle,
      tableBasic,
      documentTableCalcInfo,
      tableCalcLines,
      tableWorkLog,
      createSeedClosingDate(),
      seedClosingSignature,
    ],
  })
}

/**
 * 예전 서버 저장본(시안 반영 전) → 시안 5767:46455 구성 보정.
 * - 「강사비 산출 정보」 7항목 → 「강사비 산출 내역」 5항목(제목은 예전 시드 문구일 때만, 설명은 비었거나 「설명 입력」일 때만 바꿈)
 * - 「강사비 산출 내역」 산출 행 표(`…-table-calc-lines`) 제거
 * - 교통비·숙박비 신청 단락이 없으면 강사비 산출 내역(교통비 신청) 뒤에 시드로 넣음
 */
export function migratePaymentStatementIssuanceParagraphs(
  draft: WritingFormDraft
): WritingFormDraft {
  let changed = false
  const paragraphs: WritingFormParagraph[] = []
  for (const p of draft.paragraphs) {
    if (p.id === PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcLines) {
      changed = true
      continue
    }
    if (
      isPaymentStatementLegacyCalcInfoParagraph(p) &&
      p.kind === 'single_item' &&
      p.variant === 'horizontal_table'
    ) {
      const description = p.paragraphDescription?.trim() ?? ''
      paragraphs.push(
        normalizeHorizontalTableParagraph({
          ...p,
          paragraphTitle:
            p.paragraphTitle.trim() === PAYMENT_STATEMENT_LEGACY_CALC_INFO_PARAGRAPH_TITLE
              ? tableCalcInfo.paragraphTitle
              : p.paragraphTitle,
          paragraphDescription:
            description === '' || description === '설명 입력'
              ? tableCalcInfo.paragraphDescription
              : p.paragraphDescription,
          columnHeaders: [...tableCalcInfo.columnHeaders],
          dataRows: tableCalcInfo.dataRows.map(row => [...row]),
        })
      )
      changed = true
      continue
    }
    paragraphs.push(p)
  }

  // 시드 고정 단락(삭제 불가)인 강사비 산출 내역이 있는 저장본에만 교통비·숙박비 신청을 보충한다
  const hasId = (id: string) => paragraphs.some(p => p.id === id)
  const missing = [tableTransport, tableAccommodation].filter(p => !hasId(p.id))
  if (missing.length > 0 && hasId(PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcInfo)) {
    const anchorIds = new Set<string>([
      PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcInfo,
      PAYMENT_STATEMENT_ISSUANCE_IDS.tableTransport,
      PAYMENT_STATEMENT_ISSUANCE_IDS.tableAccommodation,
    ])
    let anchorIndex = -1
    paragraphs.forEach((p, index) => {
      if (anchorIds.has(p.id)) anchorIndex = index
    })
    paragraphs.splice(
      anchorIndex + 1,
      0,
      ...missing.map(p => normalizeHorizontalTableParagraph({ ...p }))
    )
    changed = true
  }

  return changed ? { ...draft, paragraphs } : draft
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
