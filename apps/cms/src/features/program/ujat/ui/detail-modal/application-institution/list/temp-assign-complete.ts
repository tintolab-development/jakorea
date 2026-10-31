/** 프로그램 신청 반려 성공 — 시안 `반려 완료` */
export const UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_TITLE = '반려 완료'
export const UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_CONTENT = '반려되었습니다.'

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

export const UJAT_INSTITUTION_TEMP_ASSIGN_CANCEL_COMPLETE_TITLE = '임시 배정 취소 완료'
export const UJAT_INSTITUTION_TEMP_ASSIGN_CANCEL_COMPLETE_CONTENT =
  '임시 배정이 취소되어 평가 대기로 돌아갔습니다.'

export const UJAT_INSTITUTION_TEMP_REJECT_CANCEL_COMPLETE_TITLE = '임시 반려 취소 완료'
export const UJAT_INSTITUTION_TEMP_REJECT_CANCEL_COMPLETE_CONTENT =
  '임시 반려가 취소되어 평가 대기로 돌아갔습니다.'
