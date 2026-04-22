import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { User } from '@/types/user'
import { formatDate } from '@/shared/utils'
import { MASKING_POLICY } from '@/shared/constants/download-policy'

export function userToApplicantInstructorRow(user: Omit<User, 'password'>): ApplicantInstructorRow {
  const grade = user.listMetrics?.jaEvaluationGrade?.trim()
  const years = user.participationHistory ?? 0
  const affiliation = user.affiliation?.trim() || 'JA 강사'
  return {
    id: user.id,
    no: 1,
    instructorName: user.name,
    lectureExperienceYears: years,
    educationLevel: '4년제 졸업',
    educationSchoolName: '-*대학교',
    contact: user.phone ?? '',
    email: user.email ?? '',
    address: user.detailAddress ?? user.schoolInfo?.address ?? '',
    affiliation,
    approvalStatus: 'approved',
    schoolName: user.schoolInfo?.schoolName ?? user.affiliatedSchoolName ?? '-',
    nameEnglish: user.nameEn ?? 'Park Tinto',
    birthDate: user.birthDate ? formatDate(user.birthDate) : '1990.09.15',
    gender: user.gender ?? '남성',
    bankName: user.instructorInfo?.bankName ?? '',
    accountNumber: user.instructorInfo?.accountNumber ?? '',
    accountHolder: user.instructorInfo?.accountHolder ?? '',
    evaluationGrade: grade || 'A',
    teachingExperience: years > 0 ? `${years}년` : '3년',
    oneLineIntro: user.bio ?? '-',
    businessIncomeEarnerStatus:
      user.instructorInfo?.isBusinessIncome === true
        ? '해당'
        : user.instructorInfo?.isBusinessIncome === false
          ? '해당 없음'
          : '해당 없음',
    lectureFeeBasisDisplay: '특강 강사비 | 915,000원',
    settlementStatusLabel: user.listMetrics?.settlementStatusLabel?.trim() || undefined,
    freeWriting1:
      '대학에서 경영학을 전공하며 금융과 경제에 관심을 갖게 되었습니다. 청소년 경제 교육에 지원하게 된 동기는, 아이들이 일상에서 접하는 돈·소비·저축의 원리를 이해하고 스스로 합리적인 선택을 할 수 있도록 돕고 싶기 때문입니다.',
    freeWriting2:
      '청소년 경제 교육은 미래 세대의 재정적 자립과 비판적 사고를 키우는 기반이 됩니다. 본인은 실생활 사례와 참여형 활동을 통해 개념을 쉽게 전달하고, 수업 후에도 질문을 환영하는 분위기를 만들려 노력합니다.',
    freeWriting3:
      '청소년과 소통할 때 가장 중요한 것은 경청과 신뢰라고 생각합니다. 말을 끊지 않고 의도를 확인하며, 수업 전후로 짧은 대화 시간을 갖는 등 지속적으로 관계를 다지려 합니다.',
    freeWriting4:
      '수업 중 참여도가 낮았을 때, 짝 활동과 퀴즈 형식으로 분위기를 전환한 경험이 있습니다. 그 결과 학생들의 참여가 늘었고, 이후에도 같은 방식을 상황에 맞게 적용하고 있습니다.',
    careerDetails: [],
    educations: [],
    qualifications: [],
    awards: [
      { year: '2024', name: 'OO교육원 웹마스터 915기 교육 수료' },
      { year: '2020', name: '서울특별시 대통령배 OO부문 금상' },
    ],
  }
}

export function maskedUserForInstructorDetail(user: Omit<User, 'password'>): Omit<User, 'password'> {
  return {
    ...user,
    phone: user.phone ? MASKING_POLICY.phone(user.phone) : user.phone,
    email: user.email ? MASKING_POLICY.email(user.email) : user.email,
    instructorInfo: user.instructorInfo
      ? {
          ...user.instructorInfo,
          accountNumber: MASKING_POLICY.accountNumber(user.instructorInfo.accountNumber),
          accountHolder: MASKING_POLICY.accountHolderName(user.instructorInfo.accountHolder),
        }
      : user.instructorInfo,
  }
}
