import assert from 'node:assert/strict'
import {
  buildSettlementDocumentBasicRows,
  buildSettlementDocumentCalcRows,
  displaySettlementDocumentText,
  formatSettlementDocumentAccountInfo,
  formatSettlementDocumentAccountParts,
  formatSettlementDocumentAmount,
  formatSettlementDocumentLectureDate,
  formatSettlementDocumentLectureDateParts,
  formatSettlementDocumentSignedAmount,
  formatSettlementDocumentYesNo,
  buildSettlementDocumentLineSpans,
  isSettlementDocumentDeductionLine,
  layoutSettlementDocumentInfoRows,
  SETTLEMENT_DOCUMENT_EMPTY,
  settlementDocumentFirstColumnHeader,
  shouldShowSettlementDocumentFirstColumn,
  showSettlementDocumentAttachmentsPage,
  formatSettlementDocumentPaymentItems,
  formatSettlementDocumentEducationProgressParts,
  formatSettlementDocumentEducationTimeRange,
  formatSettlementDocumentInstructorFeeParts,
  settlementDocumentFirstColumnValue,
  settlementDocumentLinesSectionTitle,
} from './format-application-document.ts'
import type {
  SettlementApplicationDocumentBasicInfo,
  SettlementApplicationDocumentCalcInfo,
  SettlementApplicationDocumentResponse,
} from '../api/application-document-types.ts'

assert.equal(displaySettlementDocumentText(null), SETTLEMENT_DOCUMENT_EMPTY)
assert.equal(displaySettlementDocumentText('  '), SETTLEMENT_DOCUMENT_EMPTY)
assert.equal(displaySettlementDocumentText('홍길동'), '홍길동')
assert.equal(formatSettlementDocumentAmount(-33000), '-33,000원')
assert.equal(formatSettlementDocumentYesNo(true), '예')
assert.equal(formatSettlementDocumentYesNo(null), SETTLEMENT_DOCUMENT_EMPTY)
assert.equal(
  isSettlementDocumentDeductionLine({
    institutionName: null,
    educationDate: null,
    sessionLabel: null,
    direction: 'DEDUCTION',
    category: '원천징수',
    description: null,
    amount: -33000,
  }),
  true
)

const basic: SettlementApplicationDocumentBasicInfo = {
  name: null,
  englishName: null,
  residentNumberMasked: '000915-1******',
  affiliation: null,
  homeAddress: null,
  homeAddressDetail: null,
  bank: '국민',
  accountNumberMasked: '******1234',
  accountHolder: '홍길동',
  paymentPurpose: null,
}
assert.equal(formatSettlementDocumentAccountInfo(basic), '국민 ******1234 | 홍길동')
assert.deepEqual(formatSettlementDocumentAccountParts(basic), ['국민 ******1234', '홍길동'])
assert.deepEqual(
  formatSettlementDocumentAccountParts({
    ...basic,
    bank: null,
    accountNumberMasked: null,
    accountHolder: null,
  }),
  [SETTLEMENT_DOCUMENT_EMPTY]
)
const rows = buildSettlementDocumentBasicRows(basic)
assert.equal(rows[0]?.value, SETTLEMENT_DOCUMENT_EMPTY)
assert.equal(rows[2]?.value, '000915-1******')
assert.deepEqual(
  layoutSettlementDocumentInfoRows(rows).map(([left, right]) => [left.label, right?.label ?? null]),
  [
    ['성명', '영문 성명'],
    ['주민등록번호', '소속'],
    ['자택 주소', null],
    ['정산 계좌 정보', null],
    ['지급 목적', null],
  ]
)
assert.deepEqual(
  layoutSettlementDocumentInfoRows([
    { label: 'a', value: '1' },
    { label: 'b', value: '2' },
    { label: 'c', value: '3' },
  ]).map(([left, right]) => [left.label, right?.label ?? null]),
  [
    ['a', 'b'],
    ['c', null],
  ]
)

assert.equal(
  formatSettlementDocumentLectureDate({
    institutionName: null,
    educationDate: '2026.01.28(수)',
    sessionLabel: '2회차',
    direction: 'PAYMENT',
    category: null,
    description: null,
    amount: 250000,
  }),
  '2026.01.28(수) | 2회차'
)
assert.deepEqual(
  formatSettlementDocumentLectureDateParts({
    institutionName: null,
    educationDate: '2026.01.28(수)',
    sessionLabel: '2회차',
    direction: 'PAYMENT',
    category: null,
    description: null,
    amount: 250000,
  }),
  ['2026.01.28(수)', '2회차']
)
assert.equal(formatSettlementDocumentSignedAmount(250000), '+250,000원')
assert.equal(formatSettlementDocumentSignedAmount(-33000), '-33,000원')
assert.equal(settlementDocumentLinesSectionTitle('RECEIPT_SETTLEMENT'), '영수증 산출 내역')
assert.equal(settlementDocumentLinesSectionTitle('PAYMENT_STATEMENT'), '강사비 산출 내역')
assert.equal(settlementDocumentFirstColumnHeader('RECEIPT_SETTLEMENT'), '프로그램명')
assert.equal(settlementDocumentFirstColumnHeader('PAYMENT_STATEMENT'), '참여 기관명')
assert.equal(
  settlementDocumentFirstColumnValue(
    'RECEIPT_SETTLEMENT',
    {
      institutionName: '제이초등학교',
      educationDate: null,
      sessionLabel: null,
      direction: 'PAYMENT',
      category: null,
      description: null,
      amount: 0,
    },
    '  '
  ),
  SETTLEMENT_DOCUMENT_EMPTY
)
assert.equal(
  settlementDocumentFirstColumnValue(
    'RECEIPT_SETTLEMENT',
    {
      institutionName: '제이초등학교',
      educationDate: null,
      sessionLabel: null,
      direction: 'PAYMENT',
      category: null,
      description: null,
      amount: 0,
    },
    'JA 경제교육'
  ),
  'JA 경제교육'
)
assert.equal(
  settlementDocumentFirstColumnValue(
    'PAYMENT_STATEMENT',
    {
      institutionName: '제이초등학교',
      educationDate: null,
      sessionLabel: null,
      direction: 'PAYMENT',
      category: null,
      description: null,
      amount: 0,
    },
    'JA 경제교육'
  ),
  '제이초등학교'
)

console.log('format-application-document.selfcheck: ok')

// 산출 내역 첫 칸·일자 세로 병합 (CMS 5767:47881)
const spanPairs = (cells: Array<{ first: string; date: string }>) =>
  buildSettlementDocumentLineSpans(cells).map(span => [span.firstRowSpan, span.dateRowSpan])
// 연속 같은 값: 기관 4줄 합침, 일자 4줄 합침
assert.deepEqual(
  spanPairs([
    { first: '제이초등학교', date: '2026.01.28(수) | 2회차' },
    { first: '제이초등학교', date: '2026.01.28(수) | 2회차' },
    { first: '제이초등학교', date: '2026.01.28(수) | 2회차' },
    { first: '제이초등학교', date: '2026.01.28(수) | 2회차' },
  ]),
  [
    [4, 4],
    [0, 0],
    [0, 0],
    [0, 0],
  ]
)
// 떨어진 같은 값은 합치지 않음
assert.deepEqual(
  spanPairs([
    { first: 'A', date: 'd1' },
    { first: 'B', date: 'd1' },
    { first: 'A', date: 'd1' },
  ]),
  [
    [1, 1],
    [1, 1],
    [1, 1],
  ]
)
// 한 줄
assert.deepEqual(spanPairs([{ first: 'A', date: 'd1' }]), [[1, 1]])
assert.deepEqual(spanPairs([]), [])
// 섞임: 같은 기관 안에서 일자가 바뀌면 일자만 나눔, 기관이 바뀌면 같은 일자라도 새 묶음, 빈 값은 합치지 않음
assert.deepEqual(
  spanPairs([
    { first: 'A', date: 'd1' },
    { first: 'A', date: 'd1' },
    { first: 'A', date: 'd2' },
    { first: 'B', date: 'd2' },
    { first: 'B', date: 'd2' },
    { first: SETTLEMENT_DOCUMENT_EMPTY, date: 'd3' },
    { first: SETTLEMENT_DOCUMENT_EMPTY, date: 'd3' },
  ]),
  [
    [3, 2],
    [0, 0],
    [0, 1],
    [2, 2],
    [0, 0],
    [1, 1],
    [1, 1],
  ]
)

const calc: SettlementApplicationDocumentCalcInfo = {
  lectureFeeType: 'GRADE_1',
  instructorFeeAmount: 300000,
  businessIncomeYn: false,
  educationSessionCount: 3,
  recognizedSessionCount: 1,
  actualTrainingMinutes: 60,
  totalStudentCount: null,
  totalLectureFee: 300000,
}
const calcRows = buildSettlementDocumentCalcRows(calc)
assert.equal(
  calcRows.find(row => row.label === '교육 진행 차시')?.value,
  '1차시'
)
assert.equal(
  calcRows.find(row => row.label === '총 강사비')?.value,
  '300,000원'
)
assert.equal(calcRows.some(row => row.label === '교육 진행 회차'), false)
assert.equal(calcRows.some(row => row.label === '인정 차시'), false)

const legacyCalc = buildSettlementDocumentCalcRows({
  ...calc,
  recognizedSessionCount: null,
  actualTrainingMinutes: null,
  totalLectureFee: 300000,
})
assert.equal(legacyCalc.find(row => row.label === '교육 진행 차시')?.value, null)
assert.notEqual(legacyCalc.find(row => row.label === '교육 진행 차시')?.value, '3회차')
assert.notEqual(legacyCalc.find(row => row.label === '교육 진행 차시')?.value, '3차시')

assert.equal(shouldShowSettlementDocumentFirstColumn('PAYMENT_STATEMENT', 'GENERAL_INDIVIDUAL'), false)
assert.equal(shouldShowSettlementDocumentFirstColumn('PAYMENT_STATEMENT', 'GENERAL_ORGANIZATION'), true)
assert.equal(shouldShowSettlementDocumentFirstColumn('PAYMENT_STATEMENT', null), true)
assert.equal(shouldShowSettlementDocumentFirstColumn('RECEIPT_SETTLEMENT', 'GENERAL_INDIVIDUAL'), false)
assert.equal(shouldShowSettlementDocumentFirstColumn('RECEIPT_SETTLEMENT', null), true)
assert.equal(buildSettlementDocumentCalcRows({
  lectureFeeType: null, instructorFeeAmount: null, businessIncomeYn: true, educationSessionCount: null,
  recognizedSessionCount: null, actualTrainingMinutes: null, totalStudentCount: null, totalLectureFee: null,
}).find(row => row.label === '사업소득자 여부')?.value, '해당 | 사업 소득 3.3% 적용')

const designRows = buildSettlementDocumentCalcRows(
  {
    ...calc,
    lectureFeeType: 'GRADE_3',
    instructorFeeAmount: 240000,
    instructorFeeCalculationUnit: 'PER_SESSION',
    businessIncomeYn: false,
    recognizedSessionCount: 2,
    educationStartAt: '2026-01-28T00:00:00Z',
    educationEndAt: '2026-01-28T02:20:00Z',
    totalStudentCount: 3200,
    totalLectureFee: 280000,
  },
  [
    { institutionName: null, educationDate: null, sessionLabel: null, direction: 'PAYMENT', category: '강의비', description: null, amount: 240000 },
    { institutionName: null, educationDate: null, sessionLabel: null, direction: 'PAYMENT', category: '교통비', description: null, amount: 30000 },
    { institutionName: null, educationDate: null, sessionLabel: null, direction: 'PAYMENT', category: '숙박비', description: null, amount: 10000 },
    { institutionName: null, educationDate: null, sessionLabel: null, direction: 'DEDUCTION', category: '원천징수', description: null, amount: -1000 },
  ]
)
assert.deepEqual(
  designRows.map(row => row.label),
  ['강사비 유형', '강사비 책정', '사업소득자 여부', '교육 진행 차시', '지급 항목 여부', '총 학생 수', '총 강사비']
)
const designValue = (label: string) => designRows.find(row => row.label === label)?.value
assert.equal(designValue('강사비 책정'), '출강 1회당 | 기본 : 240,000원')
assert.equal(designValue('사업소득자 여부'), '해당 없음 | 기타 소득 8.8% 적용')
assert.equal(designValue('교육 진행 차시'), '2차시 | 09:00 ~ 11:20')
assert.equal(designValue('지급 항목 여부'), '교통비, 숙박비')
assert.equal(designValue('총 학생 수'), '3,200명')
assert.equal(designRows.at(-1)?.fullRow, true)
assert.equal(formatSettlementDocumentPaymentItems([]), null)
assert.equal(showSettlementDocumentAttachmentsPage({ documentType: 'PAYMENT_STATEMENT', attachments: [{ fileObjectId: 1 }] }), false)
assert.equal(showSettlementDocumentAttachmentsPage({ documentType: 'RECEIPT_SETTLEMENT', attachments: [{ fileObjectId: 1 }] }), true)
assert.equal(showSettlementDocumentAttachmentsPage({ documentType: 'RECEIPT_SETTLEMENT', attachments: [] }), false)

assert.equal(formatSettlementDocumentSignedAmount(0), '0원')
assert.equal(formatSettlementDocumentSignedAmount(1000), '+1,000원')
assert.equal(formatSettlementDocumentSignedAmount(-1000), '-1,000원')

// ── CalcInfo 신규 필드 (instructorFeeCalculationUnit / educationStartAt·EndAt / recognizedSessionCount) ──
const calcValue = (rowsIn: ReturnType<typeof buildSettlementDocumentCalcRows>, label: string) =>
  rowsIn.find(row => row.label === label)?.value

// 1) 신규 필드 모두 있음 — 인정 차시만 「교육 진행 차시」, educationSessionCount(회차 번호)는 무시
const fullCalc: SettlementApplicationDocumentCalcInfo = {
  lectureFeeType: 'GRADE_1',
  instructorFeeCalculationUnit: 'PER_CLASS',
  instructorFeeAmount: 50000,
  businessIncomeYn: true,
  educationSessionCount: 7,
  recognizedSessionCount: 1,
  educationStartAt: '2026-03-02T00:00:00Z',
  educationEndAt: '2026-03-02T02:20:00Z',
  actualTrainingMinutes: 140,
  totalStudentCount: 25,
  totalLectureFee: 50000,
}
const fullRows = buildSettlementDocumentCalcRows(fullCalc)
assert.equal(calcValue(fullRows, '강사비 책정'), '차시당 | 기본 : 50,000원')
assert.equal(calcValue(fullRows, '교육 진행 차시'), '1차시 | 09:00 ~ 11:20')
assert.equal(calcValue(fullRows, '총 강사비'), '50,000원')
assert.equal(calcValue(fullRows, '총 학생 수'), '25명')
assert.ok(!String(calcValue(fullRows, '교육 진행 차시')).includes('7'))
assert.equal(
  formatSettlementDocumentEducationProgressParts({ ...fullCalc, educationEndAt: '2026-03-02T09:05:00+09:00' }).at(-1),
  '09:00 ~ 09:05'
)
// PER_HOUR(레거시)·PER_LECTURE 라벨 — lecture-fee-preview instructorFeeUnitDisplayLabel 재사용
assert.deepEqual(formatSettlementDocumentInstructorFeeParts({ instructorFeeCalculationUnit: 'PER_HOUR', instructorFeeAmount: null }), ['차시당'])
assert.deepEqual(formatSettlementDocumentInstructorFeeParts({ instructorFeeCalculationUnit: 'PER_LECTURE', instructorFeeAmount: null }), ['출강 1회당'])

// 2) 모두 null — 빈 문자열·`-`·기본값 없이 value = null (빈 칸)
const allNullCalc: SettlementApplicationDocumentCalcInfo = {
  lectureFeeType: null,
  instructorFeeCalculationUnit: null,
  instructorFeeAmount: null,
  businessIncomeYn: null,
  educationSessionCount: null,
  recognizedSessionCount: null,
  educationStartAt: null,
  educationEndAt: null,
  actualTrainingMinutes: null,
  totalStudentCount: null,
  totalLectureFee: null,
}
for (const row of buildSettlementDocumentCalcRows(allNullCalc)) {
  assert.equal(row.value, null, `${row.label} should be empty`)
  assert.equal(row.parts, undefined)
}
// 누락(undefined)과 null 동일
assert.deepEqual(buildSettlementDocumentCalcRows({}), buildSettlementDocumentCalcRows(allNullCalc))
assert.equal(formatSettlementDocumentEducationTimeRange({}), null)
// 시작·종료 중 하나만 있으면 시간 미표시 (start/end로 재계산·보정하지 않음)
assert.equal(formatSettlementDocumentEducationTimeRange({ educationStartAt: '2026-03-02T00:00:00Z', educationEndAt: null }), null)

// 3) 구 스냅샷 — instructorFeeCalculationUnit + recognizedSessionCount만 있음
const oldSnapshot = JSON.parse(
  '{"instructorFeeCalculationUnit":"PER_SESSION","recognizedSessionCount":2}'
) as SettlementApplicationDocumentCalcInfo
const oldRows = buildSettlementDocumentCalcRows(oldSnapshot)
assert.equal(calcValue(oldRows, '강사비 책정'), '출강 1회당')
assert.equal(calcValue(oldRows, '교육 진행 차시'), '2차시')
assert.equal(calcValue(oldRows, '강사비 유형'), null)
assert.equal(calcValue(oldRows, '사업소득자 여부'), null)
assert.equal(calcValue(oldRows, '총 학생 수'), null)
assert.equal(calcValue(oldRows, '총 강사비'), null)

// 4) 영수증 — calcInfo null, 첨부 페이지·산출 내역은 유지
const receiptDoc: SettlementApplicationDocumentResponse = {
  documentType: 'RECEIPT_SETTLEMENT',
  title: '영수증 정산 신청서',
  revisionNo: 1,
  submittedAt: null,
  status: 'SUBMITTED',
  basicInfo: basic,
  calcInfo: null,
  lines: [
    { institutionName: null, educationDate: '2026.03.02(월)', sessionLabel: null, direction: 'PAYMENT', category: '교통비', description: null, amount: 12000 },
  ],
  total: { amount: 12000, formulaLabel: null },
  attachments: [{ fileObjectId: 9, originalFileName: 'r.jpg' }],
}
assert.equal(receiptDoc.calcInfo, null)
assert.equal(showSettlementDocumentAttachmentsPage(receiptDoc), true)
assert.equal(settlementDocumentLinesSectionTitle(receiptDoc.documentType), '영수증 산출 내역')
assert.equal(
  settlementDocumentFirstColumnValue(receiptDoc.documentType, receiptDoc.lines[0]!, 'JA 경제교육'),
  'JA 경제교육'
)

// 5) 소속 null — 빈 칸, 프로필 값(JA 강사단)·`-`로 채우지 않음
const affiliationRow = buildSettlementDocumentBasicRows(basic).find(row => row.label === '소속')
assert.equal(affiliationRow?.value, null)
assert.equal(
  buildSettlementDocumentBasicRows({ ...basic, affiliation: '  ' }).find(row => row.label === '소속')?.value,
  null
)
assert.equal(
  buildSettlementDocumentBasicRows({ ...basic, affiliation: '제이초등학교' }).find(row => row.label === '소속')?.value,
  '제이초등학교'
)

console.log('format-application-document.selfcheck (calcInfo): ok')
