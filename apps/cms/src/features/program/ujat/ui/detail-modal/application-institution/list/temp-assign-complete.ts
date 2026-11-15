/** 프로그램 신청 반려 성공 — 시안 `반려 완료` */
export const UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_TITLE = '반려 완료'
export const UJAT_INSTITUTION_APPLICATION_REJECT_COMPLETE_CONTENT = '반려되었습니다.'

/**
 * 임시 배정 완료 — 시안 `09-2. 임시 배정 완료 팝업`(10011:27109).
 * 상세 [임시 배정]·목록 [선택 임시 배정]의 POST temporary-assignments가 `successCount >= 1`이고
 * 실패가 없을 때 띄운다. 팝업을 닫으면 상세·목록을 다시 조회한다.
 */
export const UJAT_INSTITUTION_TEMP_ASSIGN_COMPLETE_TITLE = '배정 완료'
export const UJAT_INSTITUTION_TEMP_ASSIGN_COMPLETE_CONTENT = '배정되었습니다.'

/** 신청 기관 상세 임시 반려 완료 — 시안 `06-2. 임시 반려 완료 팝업`(10011:26779), 상세 위에 표시 */
export const UJAT_INSTITUTION_TEMP_REJECT_DETAIL_COMPLETE_TITLE = '반려 완료'
export const UJAT_INSTITUTION_TEMP_REJECT_DETAIL_COMPLETE_CONTENT = '반려되었습니다.'

/** 목록 일괄 임시 반려 완료 — 시안에 일괄 완료 팝업 프레임이 없어 기존 문구 유지 */
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
