import { describe, expect, it } from 'vitest'
import { participantToPaymentStatementInstructorShape } from '@/features/program/general/lib/participating-participant-payment-statement-instructor-shape'

describe('participantToPaymentStatementInstructorShape', () => {
  it('신청자명을 강사명으로 맞춰 지급조서 보기에 넘긴다', () => {
    const instructor = participantToPaymentStatementInstructorShape({
      id: 'p1',
      no: 3,
      applicantName: '김참여자',
      affiliation: '서울고등학교',
      educationGrade: '2학년',
      memberId: '42',
      affiliationOrganizationId: 9,
      detail: { contact: '010-1111-2222', email: 'p@example.com' },
    })

    expect(instructor.instructorName).toBe('김참여자')
    expect(instructor.memberId).toBe('42')
    expect(instructor.schoolName).toBe('서울고등학교')
    expect(instructor.contact).toBe('010-1111-2222')
    expect(instructor.email).toBe('p@example.com')
  })
})
