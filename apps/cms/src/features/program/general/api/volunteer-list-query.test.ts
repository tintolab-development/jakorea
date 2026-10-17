import { describe, expect, it } from 'vitest'
import {
  assignedInterviewTimeLabelToLocalTimeParam,
  buildGeneralVolunteerDoc1ListQuery,
  buildGeneralVolunteerDocPassedListQuery,
  buildGeneralVolunteerInterview2ListQuery,
  GENERAL_VOLUNTEER_INTERVIEW2_STAGE,
} from './volunteer-list-query'
import {
  DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS,
  DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS,
  DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
} from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'

describe('buildGeneralVolunteerDoc1ListQuery', () => {
  it('does not restrict document status when screening status is ALL', () => {
    expect(buildGeneralVolunteerDoc1ListQuery(DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS)).toEqual({})
  })

  it('maps searchable filters to OpenAPI query params', () => {
    expect(
      buildGeneralVolunteerDoc1ListQuery({
        volunteerName: '  홍길동 ',
        jaVolunteerExperience: 'yes',
        managerAEvaluation: 'neutral',
        managerBEvaluation: 'unreviewed',
        documentScreeningStatus: 'pending',
      })
    ).toEqual({
      keyword: '홍길동',
      isReparticipation: true,
      managerAEvaluation: 'NEUTRAL',
      managerBEvaluation: 'UNREVIEWED',
      documentStatus: 'PENDING',
    })
  })

  it('sends isReparticipation=false for "없음"', () => {
    expect(
      buildGeneralVolunteerDoc1ListQuery({
        ...DEFAULT_GENERAL_VOLUNTEER_DOC1_FILTERS,
        jaVolunteerExperience: 'no',
      })
    ).toEqual({ isReparticipation: false })
  })
})

describe('buildGeneralVolunteerDocPassedListQuery', () => {
  it('always scopes to document PASS', () => {
    expect(buildGeneralVolunteerDocPassedListQuery(DEFAULT_GENERAL_VOLUNTEER_DOC_PASSED_FILTERS)).toEqual(
      { documentStatus: 'PASS' }
    )
  })

  it('maps interview assignment filter to interviewStatus', () => {
    expect(
      buildGeneralVolunteerDocPassedListQuery({
        volunteerName: '김봉사',
        interviewAssignmentStatus: 'waiting',
      })
    ).toEqual({
      documentStatus: 'PASS',
      keyword: '김봉사',
      interviewStatus: 'WAITING',
    })
  })
})

describe('buildGeneralVolunteerInterview2ListQuery', () => {
  it('uses interviewStage SECOND_ROUND without interviewStatus', () => {
    const query = buildGeneralVolunteerInterview2ListQuery(DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS)
    expect(query).toEqual({
      documentStatus: 'PASS',
      interviewStage: GENERAL_VOLUNTEER_INTERVIEW2_STAGE,
    })
    expect(query.interviewStatus).toBeUndefined()
    expect(GENERAL_VOLUNTEER_INTERVIEW2_STAGE).toBe('SECOND_ROUND')
  })

  it('maps withdrawn UI filter to interviewStatus only (no interviewStage)', () => {
    const query = buildGeneralVolunteerInterview2ListQuery({
      ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
      secondInterviewScreeningStatus: 'withdrawn',
    })
    expect(query).toEqual({
      documentStatus: 'PASS',
      interviewStatus: 'WITHDRAWN',
    })
    expect(query.interviewStage).toBeUndefined()
  })

  it('never sends interviewStage and interviewStatus together', () => {
    const withdrawn = buildGeneralVolunteerInterview2ListQuery({
      ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
      secondInterviewScreeningStatus: 'withdrawn',
    })
    const defaultStage = buildGeneralVolunteerInterview2ListQuery(DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS)
    expect(withdrawn.interviewStage).toBeUndefined()
    expect(withdrawn.interviewStatus).toBe('WITHDRAWN')
    expect(defaultStage.interviewStatus).toBeUndefined()
    expect(defaultStage.interviewStage).toBe('SECOND_ROUND')
  })

  it('maps interview date and total score to server params', () => {
    expect(
      buildGeneralVolunteerInterview2ListQuery({
        ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
        interviewDate: '2026.04.10',
        totalScore: '8',
        volunteerName: '이름',
      })
    ).toEqual({
      documentStatus: 'PASS',
      interviewStage: 'SECOND_ROUND',
      assignedInterviewDate: '2026-04-10',
      totalScore: 8,
      keyword: '이름',
    })
  })

  it('maps second interview pass filter to finalResultStatus with interviewStage', () => {
    expect(
      buildGeneralVolunteerInterview2ListQuery({
        ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
        secondInterviewScreeningStatus: 'pass',
      })
    ).toEqual({
      documentStatus: 'PASS',
      interviewStage: 'SECOND_ROUND',
      finalResultStatus: 'PASS',
    })
  })

  it('maps interview time range label to assignedInterviewTime LocalTime', () => {
    expect(assignedInterviewTimeLabelToLocalTimeParam('10:00 ~ 11:00')).toBe('10:00:00')
    expect(assignedInterviewTimeLabelToLocalTimeParam('9:30')).toBe('09:30:00')
    expect(assignedInterviewTimeLabelToLocalTimeParam('not-a-time')).toBeUndefined()
  })

  it('sends assignedInterviewTime and date together', () => {
    expect(
      buildGeneralVolunteerInterview2ListQuery({
        ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
        interviewDate: '2026.04.10',
        interviewTime: '10:00 ~ 11:00',
      })
    ).toEqual({
      documentStatus: 'PASS',
      interviewStage: 'SECOND_ROUND',
      assignedInterviewDate: '2026-04-10',
      assignedInterviewTime: '10:00:00',
    })
  })

  it('maps total score empty to totalScoreUnevaluated without totalScore', () => {
    const query = buildGeneralVolunteerInterview2ListQuery({
      ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
      totalScore: 'empty',
    })
    expect(query.totalScoreUnevaluated).toBe(true)
    expect(query.totalScore).toBeUndefined()
  })

  it('maps waiting/completed to effectiveSecondInterviewStatus without finalResultStatus', () => {
    expect(
      buildGeneralVolunteerInterview2ListQuery({
        ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
        secondInterviewScreeningStatus: 'waiting',
      })
    ).toEqual({
      documentStatus: 'PASS',
      interviewStage: 'SECOND_ROUND',
      effectiveSecondInterviewStatus: 'WAITING',
    })
    expect(
      buildGeneralVolunteerInterview2ListQuery({
        ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
        secondInterviewScreeningStatus: 'completed',
      })
    ).toEqual({
      documentStatus: 'PASS',
      interviewStage: 'SECOND_ROUND',
      effectiveSecondInterviewStatus: 'COMPLETED',
    })
  })

  it('never sends totalScore and totalScoreUnevaluated together', () => {
    const numeric = buildGeneralVolunteerInterview2ListQuery({
      ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
      totalScore: '5',
    })
    const unevaluated = buildGeneralVolunteerInterview2ListQuery({
      ...DEFAULT_GENERAL_VOLUNTEER_INTERVIEW2_FILTERS,
      totalScore: 'empty',
    })
    expect(numeric.totalScore).toBe(5)
    expect(numeric.totalScoreUnevaluated).toBeUndefined()
    expect(unevaluated.totalScore).toBeUndefined()
    expect(unevaluated.totalScoreUnevaluated).toBe(true)
  })
})
