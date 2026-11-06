import type { ApplyTrainedTeachersBasicInfoValues } from './apply-trained-teachers-basic-info-answers'

export function findIncompleteTrainedTeachersBasicInfoMessage(
  values: ApplyTrainedTeachersBasicInfoValues,
): string | null {
  if (!values.schoolName.trim()) return '신청 기관명(학교명)을 확인해 주세요.'
  if (!values.regionLabel.trim()) return '기관 소재지를 확인해 주세요.'
  if (!values.applicationGrade.trim()) return '신청 학년을 선택해 주세요.'
  if (!values.addressDetail.trim()) return '상세 주소를 입력해 주세요.'
  const classCount = Number.parseInt(values.classCount, 10)
  if (!Number.isFinite(classCount) || classCount < 1) return '신청 학급 수를 선택해 주세요.'
  const studentCount = Number.parseInt(values.studentCount, 10)
  if (!Number.isFinite(studentCount) || studentCount < 1) return '총 학생 수를 입력해 주세요.'
  if (!values.applicationReason.trim()) return '신청 사유를 입력해 주세요.'
  if (!values.teacherName.trim()) return '담당 교사명을 입력해 주세요.'
  if (!values.teacherTel.trim() && !values.teacherMobile.trim()) {
    return '담당 교사 연락처를 입력해 주세요.'
  }
  if (!values.teacherEmail.trim()) return '담당 교사 이메일을 입력해 주세요.'
  return null
}
