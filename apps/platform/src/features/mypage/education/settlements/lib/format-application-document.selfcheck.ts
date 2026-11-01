import assert from 'node:assert/strict'
import {
  buildSettlementDocumentBasicRows,
  displaySettlementDocumentText,
  formatSettlementDocumentAccountInfo,
  formatSettlementDocumentAmount,
  formatSettlementDocumentLectureDate,
  formatSettlementDocumentSignedAmount,
  formatSettlementDocumentYesNo,
  isSettlementDocumentDeductionLine,
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
  true,
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
assert.equal(formatSettlementDocumentAccountInfo(basic), '국민 · ******1234 · 홍길동')
const rows = buildSettlementDocumentBasicRows(basic)
assert.equal(rows[0]?.value, SETTLEMENT_DOCUMENT_EMPTY)
assert.equal(rows[2]?.value, '000915-1******')

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
  '2026.01.28(수) | 2회차',
)
assert.equal(formatSettlementDocumentSignedAmount(250000), '+250,000원')
assert.equal(formatSettlementDocumentSignedAmount(-33000), '-33,000원')
assert.equal(settlementDocumentLinesSectionTitle('RECEIPT_SETTLEMENT'), '영수증 산출 내역')
assert.equal(settlementDocumentLinesSectionTitle('PAYMENT_STATEMENT'), '강의비 산출 내역')
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
    '  ',
  ),
  SETTLEMENT_DOCUMENT_EMPTY,
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
    'JA 경제교육',
  ),
  'JA 경제교육',
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
    'JA 경제교육',
  ),
  '제이초등학교',
)

console.log('format-application-document.selfcheck: ok')
