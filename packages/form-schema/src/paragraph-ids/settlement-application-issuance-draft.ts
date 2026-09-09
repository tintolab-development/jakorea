/**
 * 발급 양식 — 정산 신청서 시드 초안
 */

import {
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type TitleWithPeriodParagraph,
  type WritingFormDraft,
} from '../writing-form/draft-schema.js'

export const SETTLEMENT_APPLICATION_ISSUANCE_IDS = {
  title: 'settlement-application-seed-title',
  tableBasic: 'settlement-application-seed-table-basic',
  tableCalcInfo: 'settlement-application-seed-table-calc-info',
  tableTransport: 'settlement-application-seed-table-transport',
  tableAccommodation: 'settlement-application-seed-table-accommodation',
} as const

export const SETTLEMENT_APPLICATION_SEED_PARAGRAPH_IDS = new Set<string>([
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.title,
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableBasic,
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableCalcInfo,
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableTransport,
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableAccommodation,
])

function htText(
  id: string,
  paragraphTitle: string,
  columnHeaders: string[],
  dataRows: string[][],
  overrides?: Partial<
    Pick<
      HorizontalTableParagraph,
      | 'paragraphDescription'
      | 'bottomText'
      | 'showBottomText'
    >
  >
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
    ...overrides,
  })
}

const seedTitle: TitleWithPeriodParagraph = {
  id: SETTLEMENT_APPLICATION_ISSUANCE_IDS.title,
  kind: 'description',
  variant: 'survey_title_with_period',
  requiredMark: true,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  surveyTitle: 'JA KOREA 정산 신청서',
  surveyDescription: '',
  periodMode: 'immediate',
  startAt: null,
  endAt: null,
  showWritingPeriodOnForm: true,
}

const tableBasic = htText(
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableBasic,
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
  ]
)

const tableCalcInfo = htText(
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableCalcInfo,
  '강의비 산출 내역',
  ['항목', '내용'],
  [
    ['강의비 유형', ''],
    ['강사비 책정', ''],
    ['사업소득자 여부', ''],
    ['교육 진행 차시', ''],
    ['총 강의비', ''],
  ]
)

/** 정산 신청서 — 교통비 신청 단락 설명·하단 안내 (스크린샷 SSOT) */
export const SETTLEMENT_TRANSPORT_PARAGRAPH_DESCRIPTION =
  '강의 진행을 위한 교통비에 한해 신청이 가능합니다.'

export const SETTLEMENT_TRANSPORT_PARAGRAPH_BOTTOM_TEXT =
  '교통비는 자택과 출강지 간의 거리가 편도 30km 이상인 경우에만 지급되며, 거리 및 유류비와 총 산정 금액은 입력된 정보를 바탕으로 자동 산출됩니다.'

const tableTransport = htText(
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableTransport,
  '교통비 신청',
  ['항목', '내용'],
  [['', '']],
  {
    paragraphDescription: SETTLEMENT_TRANSPORT_PARAGRAPH_DESCRIPTION,
    bottomText: SETTLEMENT_TRANSPORT_PARAGRAPH_BOTTOM_TEXT,
    showBottomText: true,
  }
)

/** 정산 신청서 — 숙박비 신청 단락 설명·하단 안내 (스크린샷 SSOT) */
export const SETTLEMENT_ACCOMMODATION_PARAGRAPH_DESCRIPTION =
  '사전에 안내된 경우에만 지급되며 임의 신청 건은 반려될 수 있습니다.'

export const SETTLEMENT_ACCOMMODATION_PARAGRAPH_BOTTOM_TEXT =
  '숙박비는 1인 1실 기준, 최대 15만원까지 지급됩니다. 지출 금액이 15만원을 넘어가는 경우 150,000원으로 기재해 주세요.'

const tableAccommodation = htText(
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableAccommodation,
  '숙박비 신청',
  ['항목', '내용'],
  [['', '']],
  {
    paragraphDescription: SETTLEMENT_ACCOMMODATION_PARAGRAPH_DESCRIPTION,
    bottomText: SETTLEMENT_ACCOMMODATION_PARAGRAPH_BOTTOM_TEXT,
    showBottomText: true,
  }
)

export function createSettlementApplicationIssuanceDraft(): WritingFormDraft {
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [seedTitle, tableBasic, tableCalcInfo, tableTransport, tableAccommodation],
  })
}
