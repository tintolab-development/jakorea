export const COMBINED_CLASS_LEAD_TEACHER_MODAL_TITLE = '합반 담당 교사 지정'

export const COMBINED_CLASS_LEAD_TEACHER_MODAL_DESCRIPTION =
  '합반 대상 교사 중 담당 교사 1명을 지정해 주세요.'

export const COMBINED_CLASS_COMPLETE_MODAL_TITLE = '합반 처리 완료'

export function buildCombinedClassCompleteDescription(teacherLabel: string): string {
  const trimmed = teacherLabel.trim() || '담당 교사'
  return `합반 처리가 완료되었습니다.\n담당 교사: ${trimmed}`
}

export function formatCombinedClassLeadTeacherOptionLabel(
  teacherName: string,
  educationGrade: string
): string {
  const name = teacherName.trim() || '이름 없음'
  const grade = educationGrade.trim() || '학년 미정'
  return `${name} (${grade} 담당)`
}
