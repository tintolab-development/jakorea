import { formatInstitutionApplicationGradeDisplay } from '@/features/program/general/lib/institution-application-detail-edit-policy'

export const COMBINED_CLASS_PROCESS_MODAL_TITLE = '합반 처리 안내'

export const COMBINED_CLASS_PROCESS_MODAL_NOTICE =
  '합반 시 두 학년 모두 담당 교사의 신청 정보를 기준으로 교육이 진행됩니다.\n각 학년의 신청 학년과 학생 정보는 기존과 동일하게 확인할 수 있습니다.'

export const COMBINED_CLASS_GRADE_REQUIRED_MODAL_TITLE = '합반 학급 안내'

export const COMBINED_CLASS_GRADE_REQUIRED_MODAL_MESSAGE =
  '합반을 진행하시려면 합반 대상 학급을 선택해주세요.'

export const COMBINED_CLASS_CANCEL_MODAL_TITLE = '합반 처리 취소 안내'

export const COMBINED_CLASS_GRADE_REQUIRED_SAVE_RESULT = 'combined-class-grade-required' as const

export type InstitutionInfoSaveResult =
  | boolean
  | typeof COMBINED_CLASS_GRADE_REQUIRED_SAVE_RESULT

export function buildCombinedClassProcessDescription(params: {
  schoolName: string
  leadGrade: string
  partnerGrade: string
}): string {
  const schoolName = params.schoolName.trim() || '기관'
  const leadGrade = params.leadGrade.trim() || '학년'
  const partnerGrade = params.partnerGrade.trim() || '학년'
  return `[${schoolName}] ${leadGrade}과 ${partnerGrade}을 합반하시겠습니까?\n${COMBINED_CLASS_PROCESS_MODAL_NOTICE}`
}

export function buildCombinedClassCancelDescription(params: {
  schoolName: string
  leadGrade: string
  partnerGrade: string
}): string {
  const schoolName = params.schoolName.trim() || '기관'
  const leadGrade = params.leadGrade.trim() || '학년'
  const partnerGrade = params.partnerGrade.trim() || '학년'
  return `[${schoolName}] ${leadGrade}과 ${partnerGrade} 합반을 취소하시겠습니까?`
}

export const COMBINED_CLASS_CANCEL_COMPLETE_MODAL_TITLE = '합반 취소 완료'

export function buildCombinedClassCancelCompleteDescription(params: {
  schoolName: string
  leadGrade: string
  partnerGrade: string
}): string {
  const schoolName = params.schoolName.trim() || '기관'
  const leadGrade = params.leadGrade.trim() || '학년'
  const partnerGrade = params.partnerGrade.trim() || '학년'
  return `정보 수정이 완료되었습니다.\n[${schoolName}] ${leadGrade}과 ${partnerGrade} 합반이 취소되었습니다.`
}

export const COMBINED_CLASS_COMPLETE_MODAL_TITLE = '수정 완료'

export function buildCombinedClassCompleteDescription(params: {
  leadGrade: string
  partnerGrade: string
}): string {
  const leadGrade = params.leadGrade.trim() || '학년'
  const partnerGrade = params.partnerGrade.trim() || '학년'
  return `정보 수정이 완료되었습니다.\n${partnerGrade}은 ${leadGrade}의 신청 정보에 따라 합반 교육이 진행됩니다.`
}

export function formatCombinedClassLeadTeacherOptionLabel(
  teacherName: string,
  educationGrade: string
): string {
  const name = teacherName.trim() || '이름 없음'
  const grade = formatInstitutionApplicationGradeDisplay(educationGrade) || '학년 미정'
  return `${name} (${grade})`
}
