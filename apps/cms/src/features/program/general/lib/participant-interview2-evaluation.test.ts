import { describe, expect, it } from 'vitest'
import {
  mapIndividualApplicationDetailToApplicantRow,
  mapIndividualApplicationToApplicantRow,
  type IndividualApplicationDetailEnriched,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import type { IndividualApplicationListItemEnriched } from '@/features/program/general/api/individual-application-screening-api-types'
import {
  mapParticipantToVolunteerScreeningRow,
  mapVolunteerScreeningRowToParticipant,
} from '@/features/program/general/lib/participant-volunteer-row-adapter'
import { hasIndividualInterviewPass } from '@/features/program/general/lib/individual-application-visibility'
import { resolveGeneralInterview2PassRoute } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/general-volunteer-interview2-actions'

const listItem: IndividualApplicationListItemEnriched = {
  id: 501,
  programId: 77,
  memberName: '참여자',
  applicationStatus: 'DOCUMENT_PASSED',
  documentStatus: 'PASS',
  interviewStatus: 'EVALUATED',
  interviewAssignmentId: 9001,
  assignedInterviewSlotId: 31,
  assignedInterviewStartAt: '2026-11-10T01:00:00Z',
  assignedInterviewEndAt: '2026-11-10T01:30:00Z',
  interviewEvaluations: [
    { evaluatorOrder: 2, evaluatorAdminId: 12, score: 3, evaluationStatus: 'SUBMITTED' },
    { evaluatorOrder: 1, evaluatorAdminId: 11, score: 4, evaluationStatus: 'SUBMITTED' },
  ],
  availableActions: ['APPROVE', 'REJECT'],
}

describe('개인 참여자 2차 면접 — 목록 매핑', () => {
  it('목록 interviewAssignmentId와 담당자 A·B 점수를 버리지 않는다', () => {
    const row = mapIndividualApplicationToApplicantRow(listItem, 0, '77')
    expect(row.interviewAssignmentId).toBe(9001)
    expect(row.managerAScore).toBe(4)
    expect(row.managerBScore).toBe(3)
    expect(row.managerAEvaluatorAdminId).toBe(11)
    expect(row.managerBEvaluatorAdminId).toBe(12)
  })

  it('배정·평가가 없으면 빈 값으로 둔다(다른 소스로 채우지 않음)', () => {
    const row = mapIndividualApplicationToApplicantRow(
      { ...listItem, interviewAssignmentId: undefined, interviewEvaluations: [] },
      0,
      '77'
    )
    expect(row.interviewAssignmentId).toBeUndefined()
    expect(row.managerAScore).toBeNull()
    expect(row.managerBScore).toBeNull()
  })

  it('봉사자 심사 행으로 바꿔도 배정 ID·점수가 그대로 간다(평가 API path)', () => {
    const participant = mapIndividualApplicationToApplicantRow(listItem, 0, '77')
    const screeningRow = mapParticipantToVolunteerScreeningRow(participant)
    expect(screeningRow.interviewAssignmentId).toBe(9001)
    expect(screeningRow.managerAScore).toBe(4)
    expect(screeningRow.managerBScore).toBe(3)
    expect(mapVolunteerScreeningRowToParticipant(screeningRow).interviewAssignmentId).toBe(9001)
  })
})

describe('개인 참여자 2차 면접 — 상세 평가 완료', () => {
  const base = mapIndividualApplicationToApplicantRow(listItem, 0, '77')
  const detail = (evaluations: NonNullable<
    NonNullable<IndividualApplicationDetailEnriched['screening']>['interviewEvaluations']
  >): IndividualApplicationDetailEnriched => ({
    id: 501,
    programId: 77,
    applicationStatus: 'DOCUMENT_PASSED',
    screening: { documentStatus: 'PASS', interviewEvaluations: evaluations },
  })

  it('상세 평가 슬롯 A·B가 모두 있으면 평가 완료로 보고 참여 승인 차단을 푼다', () => {
    const row = mapIndividualApplicationDetailToApplicantRow(
      detail([
        { evaluatorOrder: 1, score: 4, evaluationStatus: 'SUBMITTED' },
        { evaluatorOrder: 2, score: 0, evaluationStatus: 'SUBMITTED' },
      ]),
      base
    )
    expect(row.interviewResultStatus).toBe('EVALUATED')
    expect(row.managerAScore).toBe(4)
    expect(row.managerBScore).toBe(0)
    expect(row.interviewAssignmentId).toBe(9001)
    expect(hasIndividualInterviewPass(row)).toBe(true)
  })

  it('한 명만 평가했으면 평가 완료가 아니다', () => {
    const row = mapIndividualApplicationDetailToApplicantRow(
      detail([{ evaluatorOrder: 1, score: 4, evaluationStatus: 'SUBMITTED' }]),
      base
    )
    expect(row.interviewResultStatus).not.toBe('EVALUATED')
    expect(hasIndividualInterviewPass(row)).toBe(false)
  })
})

describe('2차 면접 합격 경로', () => {
  it('일반 개인 프로그램 참여자 합격(단건·일괄)은 approve-with-education-scope로 간다', () => {
    for (const mode of ['single', 'bulk'] as const) {
      expect(
        resolveGeneralInterview2PassRoute({
          subjectKind: 'participant',
          isIndividualProgram: true,
          isOrganizationProgram: false,
          passType: 'pass',
          mode,
        })
      ).toBe('participant-education-scope')
    }
  })

  it('참여자 예비합격은 기존 final-result로 간다', () => {
    expect(
      resolveGeneralInterview2PassRoute({
        subjectKind: 'participant',
        isIndividualProgram: true,
        isOrganizationProgram: false,
        passType: 'reserve1',
        mode: 'single',
      })
    ).toBe('final-result')
  })

  it('봉사자 경로는 기존과 같다', () => {
    const volunteer = (
      isIndividualProgram: boolean,
      isOrganizationProgram: boolean,
      mode: 'single' | 'bulk',
      passType: 'pass' | 'reserve2' = 'pass'
    ) =>
      resolveGeneralInterview2PassRoute({
        subjectKind: 'volunteer',
        isIndividualProgram,
        isOrganizationProgram,
        passType,
        mode,
      })
    expect(volunteer(true, false, 'single')).toBe('volunteer-education-assign')
    expect(volunteer(false, true, 'single')).toBe('organization-assign')
    expect(volunteer(true, false, 'bulk')).toBe('final-result')
    expect(volunteer(false, true, 'bulk')).toBe('final-result')
    expect(volunteer(true, false, 'single', 'reserve2')).toBe('final-result')
    expect(volunteer(false, false, 'single')).toBe('final-result')
  })
})
