import { mapIndividualApplicationDetailToApplicantRow } from '@/features/program/general/api/adapters/general-applications-adapters'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { IndividualApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationDetailResponse'

export function participatingRowToIndividualApplicationSeed(
  row: ParticipatingIndividualParticipantRow
): GeneralIndividualApplicantRow {
  return {
    ...row,
    id: row.individualApplicationId ?? row.id,
  }
}

export function mergeIndividualApplicationIntoParticipatingRow(
  base: ParticipatingIndividualParticipantRow,
  applicant: GeneralIndividualApplicantRow
): ParticipatingIndividualParticipantRow {
  const mappedApplicationId =
    applicant.individualApplicationId?.trim() ||
    base.individualApplicationId?.trim() ||
    (applicant.id && applicant.id !== base.id ? applicant.id : undefined)

  return {
    ...base,
    ...applicant,
    id: base.id,
    individualApplicationId: mappedApplicationId,
    lectureAttendanceSessions: base.lectureAttendanceSessions,
    satisfactionSurveyCompleted: base.satisfactionSurveyCompleted,
    participationAppliedAt: base.participationAppliedAt,
    activityWithdrawn: base.activityWithdrawn,
    activityWithdrawStopSessionKey: base.activityWithdrawStopSessionKey,
    activityWithdrawStopScheduleLabel: base.activityWithdrawStopScheduleLabel,
    sessions: base.sessions?.length ? base.sessions : applicant.sessions,
  }
}

export function mapIndividualApplicationDetailToParticipatingRow(
  dto: IndividualApplicationDetailResponse,
  base: ParticipatingIndividualParticipantRow
): ParticipatingIndividualParticipantRow {
  const seed = participatingRowToIndividualApplicationSeed(base)
  const applicant = mapIndividualApplicationDetailToApplicantRow(dto, seed)
  return mergeIndividualApplicationIntoParticipatingRow(base, applicant)
}
