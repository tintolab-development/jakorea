import assert from 'node:assert/strict'
import {
  buildSettlementDocumentBasicRows,
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
  settlementDocumentFirstColumnValue,
  settlementDocumentLinesSectionTitle,
} from './format-application-document.ts'
import type { SettlementApplicationDocumentBasicInfo } from '../api/application-document-types.ts'

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
