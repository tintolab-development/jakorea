import type { InstructorRegisterMissingKey } from '@jakorea/domain/instructor/validate-register'

/**
 * 강사 신청서·강사 프로필 수정 「필수 항목 미입력」 팝업(Figma 14550-2349)에 넣을 항목명.
 * 도메인 검증(`collectInstructorRegisterValidation`)이 돌려준 키를 각 화면의 필드 라벨로 바꾼다.
 * 같은 칸에 묶인 키(성별·생년월일, 학교·재직 현황 등)는 라벨 하나로 합친다.
 */
export type InstructorRegisterMissingLabelSurface = 'apply' | 'settings'

type LabelMap = Partial<Record<InstructorRegisterMissingKey, string>>

/** 강사 신청서 (instructor-apply-form) 필드 라벨 */
const APPLY_FIELD_LABELS: LabelMap = {
  name: '성명',
  gender: '성별 및 생년월일',
  birthDate: '성별 및 생년월일',
  contact: '연락처',
  email: '이메일',
  memberType: '소속',
  schoolName: '소속',
  employmentStatus: '소속',
  affiliationName: '소속',
  homeAddress: '자택 주소지',
  homeAddressDetail: '자택 주소지',
  instructorCareer: '강사 경력',
  isBusinessIncome: '사업소득자 여부',
  oneLineIntro: '한 줄 소개',
  eduSchoolType: '최종 학력',
  eduStatus: '최종 학력',
  highSchool: '고등학교',
  college23Rows: '대학교 2, 3년제',
  college4Rows: '대학교 4년제',
  graduateRows: '대학원',
  careerLevel: '경력 구분',
  careers: '경력 사항',
}

/** 강사 프로필 수정 (settings basic-edit-form · 학력·경력 필드) 라벨 */
function settingsFieldLabels(isDualTeacher: boolean): LabelMap {
  return {
    name: '이름',
    gender: '성별',
    birthDate: '생년월일',
    contact: '휴대폰 번호',
    email: '이메일 ID',
    schoolName: isDualTeacher ? '소속/학교' : '소속',
    employmentStatus: '재직 현황',
    affiliationName: '소속',
    homeAddress: '자택 주소',
    homeAddressDetail: '자택 주소',
    instructorCareer: '강사 경력',
    isBusinessIncome: '사업소득자 여부',
    oneLineIntro: '한 줄 소개',
    eduSchoolType: '최종 학력',
    eduStatus: '최종 학력',
    highSchool: '고등학교',
    college23Rows: '대학교 2, 3년제',
    college4Rows: '대학교 4년제',
    graduateRows: '대학원',
    careerLevel: '경력 구분',
    careers: '경력 사항',
  }
}

export function resolveInstructorRegisterMissingLabels(
  keys: readonly InstructorRegisterMissingKey[],
  surface: InstructorRegisterMissingLabelSurface,
  options: { isDualTeacher?: boolean } = {}
): string[] {
  const labels =
    surface === 'apply' ? APPLY_FIELD_LABELS : settingsFieldLabels(options.isDualTeacher ?? false)
  const resolved: string[] = []
  for (const key of keys) {
    const label = labels[key]
    if (label && !resolved.includes(label)) resolved.push(label)
  }
  return resolved
}
