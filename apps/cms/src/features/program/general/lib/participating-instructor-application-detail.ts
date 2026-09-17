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
    oneLineIntro: applicant.oneLineIntro ?? base.oneLineIntro,
    lectureExperienceYears: applicant.lectureExperienceYears ?? base.lectureExperienceYears,
    educationLevel: applicant.educationLevel || base.educationLevel,
    educationSchoolName: applicant.educationSchoolName || base.educationSchoolName,
    jaEvaluationGrade: applicant.evaluationGrade ?? base.jaEvaluationGrade,
    instructorFeeGradeLabel: applicant.instructorFeeGradeLabel ?? base.instructorFeeGradeLabel,
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
  return mergeInstructorApplicationIntoParticipatingRow(base, applicant)
}
