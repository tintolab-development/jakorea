/**
 * 신청 알림 관련 상수
 * Phase 4.2: 선정/미선정 안내 문구 (FR-F01)
 */

/**
 * 선정/미선정 안내 문구
 */
export const REVIEW_MESSAGES = {
  APPROVE: {
    title: '신청 결과 안내',
    content: '귀 학교/귀하의 프로그램 신청이 선정되었습니다.',
  },
  REJECT: {
    title: '신청 결과 안내',
    content: '귀 학교/귀하의 프로그램 신청이 미선정되었습니다.',
  },
} as const

/**
 * 신청 타입별 안내 문구 생성
 */
export function getReviewMessage(
  action: 'APPROVE' | 'REJECT',
  applicantType: 'INDIVIDUAL' | 'SCHOOL' | 'INSTRUCTOR'
): { title: string; content: string } {
  const baseMessage = REVIEW_MESSAGES[action]
  
  if (action === 'APPROVE') {
    const applicantLabel = applicantType === 'SCHOOL' ? '귀 학교' : '귀하'
    return {
      title: baseMessage.title,
      content: `${applicantLabel}의 프로그램 신청이 선정되었습니다.`,
    }
  } else {
    const applicantLabel = applicantType === 'SCHOOL' ? '귀 학교' : '귀하'
    return {
      title: baseMessage.title,
      content: `${applicantLabel}의 프로그램 신청이 미선정되었습니다.`,
    }
  }
}
