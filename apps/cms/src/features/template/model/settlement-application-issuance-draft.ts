/**
 * 발급 양식 — 정산 신청서 시드 초안
 */

import {
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type TitleWithPeriodParagraph,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

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

const tableTransport = htText(
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableTransport,
  '교통비 신청',
  ['항목', '내용'],
  [['', '']],
  {
    paragraphDescription: '강의 과정에서 발생한 교통비에 한해 신청해 주세요',
    bottomText:
      '* 자택과 출강지 간 편도 거리 30km 이상인 경우에 한해 신청 가능합니다. 유류비·통행료는 실비를 원칙으로 하되, 총 산정 교통비는 자동 계산 값을 따릅니다.',
    showBottomText: true,
  }
)

const tableAccommodation = htText(
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableAccommodation,
  '숙박비 신청',
  ['항목', '내용'],
  [['', '']],
  {
    paragraphDescription:
      '사전 협의가 완료된 건에 한해 지급됩니다. 협의되지 않은 숙박비는 지급 대상에서 제외됩니다.',
    bottomText: '* 숙박비는 건당 80,000원으로 고정합니다.',
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
