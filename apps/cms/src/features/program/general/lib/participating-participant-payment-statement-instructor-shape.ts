import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'

export function participantToPaymentStatementInstructorShape(
  participant: Pick<
    ParticipatingIndividualParticipantRow,
    | 'id'
    | 'no'
    | 'applicantName'
    | 'affiliation'
    | 'educationGrade'
    | 'memberId'
    | 'affiliationOrganizationId'
    | 'detail'
  >
): ParticipatingInstructorRow {
  return {
    id: participant.id,
    no: participant.no,
    instructorName: participant.applicantName,
    schoolName: participant.affiliation?.trim() || '',
    educationGrade: participant.educationGrade?.trim() || '-',
    classCount: 0,
    studentCount: 0,
    lectureRound: '',
    settlementStatus: 'none',
    teacherName: '',
    memberId:
      participant.memberId != null && String(participant.memberId).trim()
        ? String(participant.memberId).trim()
        : undefined,
    contact: participant.detail?.contact,
    email: participant.detail?.email,
    affiliation: participant.affiliation,
    affiliationOrganizationId: participant.affiliationOrganizationId,
  }
}
