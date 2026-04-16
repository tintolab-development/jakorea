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
    freeWriting1: '-',
    freeWriting2: '-',
    freeWriting3: '-',
    freeWriting4: '-',
    careerDetails: [],
    educations: [],
    qualifications: [],
    awards: [],
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
