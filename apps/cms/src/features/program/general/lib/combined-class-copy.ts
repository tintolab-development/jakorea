/** 합반 반영 시점·실적 안내 (진행 교육 완료 건이 있을 때 편집 UI에 노출) */
export const COMBINED_CLASS_EFFECTIVE_FROM_NEXT_SCHEDULE_NOTICE =
  '합반 처리 시 다음 교육 일정부터 반영되며, 이전 교육은 실적에 개별 반영됩니다. 합반 이후 실적은 지정된 담당 교사가 신청한 학년 기준으로 반영됩니다.'

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
