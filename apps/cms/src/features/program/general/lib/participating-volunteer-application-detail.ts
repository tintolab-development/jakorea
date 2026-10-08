import { mapVolunteerApplicationDetailToApplicantRow } from '@/features/program/general/api/adapters/general-applications-adapters'
import { participatingVolunteerToApplicantView } from '@/features/program/general/lib/participating-volunteer-detail'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import type { VolunteerApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationDetailResponse'

export function participatingRowToVolunteerApplicationSeed(
  row: ParticipatingVolunteerRow
): GeneralVolunteerApplicantRow {
  return participatingVolunteerToApplicantView(row, { maskSensitive: false })
}

export function mergeVolunteerApplicationIntoParticipatingRow(
  base: ParticipatingVolunteerRow,
  applicant: GeneralVolunteerApplicantRow
): ParticipatingVolunteerRow {
  const mappedApplicationId =
    applicant.id && applicant.id !== base.id
      ? applicant.id
      : base.volunteerApplicationId

  return {
    ...base,
    volunteerApplicationId: mappedApplicationId,
    memberId: applicant.memberId ?? base.memberId,
    volunteerName: applicant.name?.trim() || base.volunteerName,
    contact: applicant.contact?.trim() || base.contact,
    email: applicant.email?.trim() || base.email,
    contactRaw: applicant.contactRaw?.trim() || applicant.contact?.trim() || base.contactRaw,
    emailRaw: applicant.emailRaw?.trim() || applicant.email?.trim() || base.emailRaw,
    id1365: applicant.id1365?.trim() || base.id1365,
    gender: applicant.gender ?? base.gender,
    birthDate: applicant.birthDate ?? base.birthDate,
    age: applicant.age ?? base.age,
    scheduleChangeCancelCount:
      applicant.scheduleChangeCancelCount ?? base.scheduleChangeCancelCount,
    hasJaVolunteerExperience:
      applicant.hasJaVolunteerExperience ?? base.hasJaVolunteerExperience,
    previousJaProgram: applicant.previousJaProgram ?? base.previousJaProgram,
    evidenceAttachments: applicant.evidenceAttachments ?? base.evidenceAttachments,
    adminComment: applicant.adminComment ?? base.adminComment,
    essayIntro: applicant.essayIntro ?? base.essayIntro,
    essayEducationExperience:
      applicant.essayEducationExperience ?? base.essayEducationExperience,
    essayNecessity: applicant.essayNecessity ?? base.essayNecessity,
    essayJaExperience: applicant.essayJaExperience ?? base.essayJaExperience,
  }
}

export function mapVolunteerApplicationDetailToParticipatingRow(
  dto: VolunteerApplicationDetailResponse,
  base: ParticipatingVolunteerRow
): ParticipatingVolunteerRow {
  const seed = participatingRowToVolunteerApplicationSeed({
    ...base,
    volunteerApplicationId:
      dto.id != null ? String(dto.id) : base.volunteerApplicationId,
  })
  const applicant = mapVolunteerApplicationDetailToApplicantRow(dto, {
    ...seed,
    id: dto.id != null ? String(dto.id) : seed.id,
  })
  return mergeVolunteerApplicationIntoParticipatingRow(base, applicant)
}
