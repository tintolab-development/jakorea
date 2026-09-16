import { describe, expect, it } from 'vitest'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import { mapParticipantToVolunteerScreeningRow } from './participant-volunteer-row-adapter'

describe('mapParticipantToVolunteerScreeningRow', () => {
  it('상세 화면에서 사용할 원본 개인 신청 행을 보존한다', () => {
    const participant: GeneralIndividualApplicantRow = {
      id: '1690625',
      no: 1,
      applicantName: '테스트 참여자',
      affiliation: '테스트 기관',
      educationGrade: '대학생',
      homeAddress: '서울',
      approvalStatus: 'pending',
      programId: '168006',
      documentScreeningStatus: 'pass',
      interviewAssignmentStatus: 'assigned',
      detail: {
        contact: '010-1234-5678',
        email: 'test@example.com',
        interviewAvailability: [],
      },
    }

    const screeningRow = mapParticipantToVolunteerScreeningRow(participant)

    expect(screeningRow.id).toBe(participant.id)
    expect(screeningRow.participantApplicant).toBe(participant)
  })
})
