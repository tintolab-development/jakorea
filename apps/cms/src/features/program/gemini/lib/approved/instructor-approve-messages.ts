/** 강사 배정 승인 확인 모달 본문 */
export function buildGeminiInstructorApproveMessageLines(instructorName: string): string[] {
  return [
    `[${instructorName}] 강사를 승인하시겠습니까?`,
    '승인 시, 다른 신청 강사들은 자동으로 반려 처리됩니다.',
  ]
}

/** 강사 변경 확인 모달 본문 */
export function buildGeminiInstructorChangeMessageLines(): string[] {
  return [
    '승인 강사를 변경하시겠습니까?',
    '모든 신청 강사들이 자동으로 승인 대기 처리 됩니다.',
  ]
}
