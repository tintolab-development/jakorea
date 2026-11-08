import { mapInstructorApplicationDetailToApplicantRow } from '@/features/program/general/api/adapters/general-applications-adapters'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { InstructorApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationDetailResponse'

export function participatingRowToInstructorApplicationSeed(
  row: ParticipatingInstructorRow,
  programId: string
): ApplicantInstructorRow {
  const memberIdNum = row.memberId != null ? Number(row.memberId) : NaN
  return {
    id: row.instructorApplicationId ?? row.id,
    programId,
    no: row.no,
    instructorName: row.instructorName,
    instructorMemberId: Number.isFinite(memberIdNum) ? memberIdNum : undefined,
    lectureExperienceYears: row.lectureExperienceYears ?? 0,
    educationLevel: row.educationLevel ?? '',
    educationSchoolName: row.educationSchoolName ?? '',
    contact: row.contact ?? '',
    email: row.email ?? '',
    address: row.address ?? '',
    schoolName: row.schoolName,
    approvalStatus: 'approved',
    evaluationGrade: row.jaEvaluationGrade,
    instructorFeeGradeLabel: row.instructorFeeGradeLabel,
    affiliation: row.affiliation,
    oneLineIntro: row.oneLineIntro,
    managerComment: row.adminComment,
    educations: row.educations,
    careerDetails: row.careerDetails,
    qualifications: row.qualifications,
    awards: row.awards,
    freeWriting1: row.freeWriting1,
    freeWriting2: row.freeWriting2,
    freeWriting3: row.freeWriting3,
    freeWriting4: row.freeWriting4,
  }
}

export function mergeInstructorApplicationIntoParticipatingRow(
  base: ParticipatingInstructorRow,
  applicant: ApplicantInstructorRow
): ParticipatingInstructorRow {
  return {
    ...base,
    instructorName: applicant.instructorName || base.instructorName,
    contact: applicant.contact?.trim() || base.contact,
    email: applicant.email?.trim() || base.email,
    address: applicant.address?.trim() || base.address,
    nameHanja: applicant.nameHanja ?? base.nameHanja,
    nameEnglish: applicant.nameEnglish ?? base.nameEnglish,
    birthDate: applicant.birthDate ?? base.birthDate,
    gender: applicant.gender ?? base.gender,
    affiliation: applicant.affiliation ?? base.affiliation,
    bankName: applicant.bankName ?? base.bankName,
    accountNumber: applicant.accountNumber ?? base.accountNumber,
    accountHolder: applicant.accountHolder ?? base.accountHolder,
    settlementBusinessIncome: applicant.settlementBusinessIncome ?? base.settlementBusinessIncome,
    oneLineIntro: applicant.oneLineIntro ?? base.oneLineIntro,
    lectureExperienceYears: applicant.lectureExperienceYears ?? base.lectureExperienceYears,
    educationLevel: applicant.educationLevel || base.educationLevel,
    educationSchoolName: applicant.educationSchoolName || base.educationSchoolName,
    jaEvaluationGrade: applicant.evaluationGrade ?? base.jaEvaluationGrade,
    instructorFeeGradeLabel: applicant.instructorFeeGradeLabel ?? base.instructorFeeGradeLabel,
    lectureFeeBasisType: applicant.lectureFeeBasisType ?? base.lectureFeeBasisType,
    lectureFeeMeasure: applicant.lectureFeeMeasure ?? base.lectureFeeMeasure,
    lectureFeeAmount: applicant.lectureFeeAmount ?? base.lectureFeeAmount,
    lectureFeeBasisDisplay: applicant.lectureFeeBasisDisplay ?? base.lectureFeeBasisDisplay,
    businessIncomeEarnerStatus:
      applicant.businessIncomeEarnerStatus ?? base.businessIncomeEarnerStatus,
    adminComment: applicant.managerComment ?? base.adminComment,
    educations: applicant.educations ?? base.educations,
    careerDetails: applicant.careerDetails ?? base.careerDetails,
    qualifications: applicant.qualifications ?? base.qualifications,
    awards: applicant.awards ?? base.awards,
    freeWriting1: applicant.freeWriting1 ?? base.freeWriting1,
    freeWriting2: applicant.freeWriting2 ?? base.freeWriting2,
    freeWriting3: applicant.freeWriting3 ?? base.freeWriting3,
    freeWriting4: applicant.freeWriting4 ?? base.freeWriting4,
    memberId:
      applicant.instructorMemberId != null
        ? String(applicant.instructorMemberId)
        : base.memberId,
  }
}

export function mapInstructorApplicationDetailToParticipatingRow(
  dto: InstructorApplicationDetailResponse,
  base: ParticipatingInstructorRow,
  programId: string
): ParticipatingInstructorRow {
  const seed = participatingRowToInstructorApplicationSeed(base, programId)
  const applicant = mapInstructorApplicationDetailToApplicantRow(dto, seed)
  const merged = mergeInstructorApplicationIntoParticipatingRow(base, applicant)
  // 정산·사업소득자는 GET 정본만 사용한다. 값 없음이면 목록 row 값으로 보완하지 않는다.
  return {
    ...merged,
    bankName: applicant.bankName,
    accountNumber: applicant.accountNumber,
    accountHolder: applicant.accountHolder,
    settlementBusinessIncome: applicant.settlementBusinessIncome,
    businessIncomeEarnerStatus: applicant.businessIncomeEarnerStatus,
  }
}
