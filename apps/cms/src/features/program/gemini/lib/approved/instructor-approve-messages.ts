/** 강사 배정 승인 확인 모달 본문 */
export function buildGeminiInstructorApproveMessageLines(instructorName: string): string[] {
  const name = instructorName.trim() || '강사'
  return [
    `**[${name}]** 님의 프로그램 신청을 승인하시겠습니까?`,
    '승인 시 회원에게 승인 알림이 발송되며, 다른 신청 강사들은 자동으로 반려 처리됩니다.',
  ]
}

/** 강사 변경 확인 모달 본문 */
export function buildGeminiInstructorChangeMessageLines(instructorName: string): string[] {
  const name = instructorName.trim() || '강사'
  return [
    `**[${name}]** 님으로 강사를 변경하시겠습니까?`,
    '승인 시 회원에게 승인 알림이 발송되며, 연수일시가 바뀌면 기관에 일정이 안내됩니다.',
    '기존 강사는 사용자 귀책으로 활동 포기 처리되며, 처리 후에는 되돌릴 수 없습니다.',
  ]
}
