import assert from 'node:assert/strict'
import { mapInquiryDetail, mapInquiryListItem } from './mappers.ts'

const listed = mapInquiryListItem(
  {
    inquiryId: 7,
    category: '프로그램',
    title: '문의 제목',
    status: 'ANSWERED',
    inquiredAt: '2026-10-25T01:30:00Z',
    answeredAt: '2026-10-26T02:45:00+09:00',
    programName: '테스트 프로그램',
  },
  0
)

assert(listed)
assert.equal(listed.createdAt, '2026년 10월 25일')
assert.equal(listed.answeredAt, '2026년 10월 26일(월) 02:45')
assert.equal(listed.status, 'answered')

const detail = mapInquiryDetail({
  inquiryId: 7,
  inquiredAt: '2026-10-25T10:30:00+09:00',
  answeredAt: '2026-10-26T02:00:00+09:00',
  answers: [
    { content: '첫 답변', answeredAt: '2026-10-26T02:30:00+09:00' },
    { content: '최신 답변', answeredAt: '2026-10-26T02:45:00+09:00' },
  ],
})

assert.equal(detail.question, '')
assert.equal(detail.answer, '첫 답변\n\n최신 답변')
assert.equal(detail.answeredAt, '2026년 10월 26일(월) 02:45')

const missingInquiryDate = mapInquiryListItem(
  { inquiryId: 8, answeredAt: '2026-10-26T02:45:00+09:00' },
  1
)
assert(missingInquiryDate)
assert.equal(missingInquiryDate.createdAt, '')
assert.equal(missingInquiryDate.answeredAt, '2026년 10월 26일(월) 02:45')

console.log('inquiry mappers selfcheck: ok')
