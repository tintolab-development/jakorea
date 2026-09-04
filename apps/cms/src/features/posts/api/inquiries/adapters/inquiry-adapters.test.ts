import { describe, expect, it } from 'vitest'
import { mapInquiryDetail, mapInquiryListResponse } from './inquiry-adapters'

describe('inquiry-adapters', () => {
  it('maps inquirer and assignee display fields from InquiryResponse', () => {
    const rows = mapInquiryListResponse({
      items: [
        {
          id: 7,
          title: '정산 문의',
          category: '정산',
          status: 'PENDING',
          inquirerName: '홍길동',
          inquirerPhone: '010-1111-2222',
          inquirerEmail: 'hong@example.com',
          assignedAdminName: '이관리',
          programNameSnapshot: 'UJAT',
        },
      ],
    })
    expect(rows[0]).toMatchObject({
      id: '7',
      memberName: '홍길동',
      phone: '010-1111-2222',
      email: 'hong@example.com',
      assignee: '이관리',
      programName: 'UJAT',
      status: 'PENDING',
    })
  })

  it('maps CLOSED and answers to ANSWERED', () => {
    const detail = mapInquiryDetail(
      { id: 1, status: 'CLOSED', title: '문의' },
      [{ content: '답변입니다', createdAt: '2026-09-01T00:00:00Z', answeredByAdminId: 3 }]
    )
    expect(detail.status).toBe('ANSWERED')
    expect(detail.answerMarkdown).toBe('답변입니다')
    expect(detail.assignee).toBe('관리자 #3')
  })
})
