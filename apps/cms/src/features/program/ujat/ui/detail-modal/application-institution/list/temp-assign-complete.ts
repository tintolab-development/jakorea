export const UJAT_INSTITUTION_TEMP_ASSIGN_ALERT_TITLE = '임시 배정 완료'

export function getUjatInstitutionTempAssignCompleteContent(count: number): string {
  return count === 1
    ? '선택한 기관에 임시 배정이 완료되었습니다.'
    : `선택한 ${count}개 기관에 임시 배정이 완료되었습니다.`
}

export const UJAT_INSTITUTION_TEMP_REJECT_ALERT_TITLE = '임시 반려 완료'

export function getUjatInstitutionTempRejectCompleteContent(count: number): string {
  return count === 1
    ? '선택한 기관에 임시 반려가 반영되었습니다.'
    : `선택한 ${count}개 기관에 임시 반려가 반영되었습니다.`
}
