import { describe, expect, it } from 'vitest'
import { detailEditValuesToProgramPatch } from '@/features/program/shared/model/program-detail-edit-schema'
import type { Program } from '@/types/domain'
import {
  applyAudienceProgramOperationToRecruitmentWindows,
  audienceOperationPeriodLabelFromRecruitmentRow,
  resolveAudienceProgramOperationIsoRange,
  toOperationCalendarDate,
} from './general-program-recruitment-operation-period'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '1',
    sponsorId: 's1',
    title: 'T',
    type: 'offline',
    format: 'offline',
    category: 'school',
    rounds: [],
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    generalCommonInfo: {
      participantRecruitmentInfo: { operationPeriodLabel: '2026. 03. 01 ~ 2026. 03. 31' },
      instructorRecruitmentInfo: { operationPeriodLabel: '2026. 04. 01 ~ 2026. 04. 30' },
      volunteerRecruitmentInfo: { operationPeriodLabel: '2026. 05. 01 ~ 2026. 05. 31' },
    },
    ...overrides,
  } as Program
}

describe('general-program-recruitment-operation-period', () => {
  it('reads audience operation from nested label without business dates', () => {
    const program = baseProgram()
    const instructor = resolveAudienceProgramOperationIsoRange(program, 'instructor')
    expect(instructor.start).toBeTruthy()
    expect(instructor.end).toBeTruthy()
  })

  it('instructor recruitment save does not patch business startDate/endDate', () => {
    const existing = baseProgram()
    const patch = detailEditValuesToProgramPatch(
      {
        title: existing.title,
        category: 'school',
        type: 'offline',
        applicationStartDate: '2026-02-01',
        applicationEndDate: '2026-02-28',
        description: 'd',
        learningSupportContent: 'l',
        sponsorId: 's1',
        managerName: 'm',
        instructorProgramOperationStartDate: '2026-06-01T00:00:00.000Z',
        instructorProgramOperationEndDate: '2026-06-30T00:00:00.000Z',
      } as import('@/features/program/shared/model/program-detail-edit-schema').ProgramDetailEditFormValues,
      existing,
      { recruitmentAudience: 'instructor' }
    )
    expect(patch.startDate).toBe('2026-01-01')
    expect(patch.endDate).toBe('2026-12-31')
    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.operationPeriodLabel).toContain('2026')
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.operationPeriodLabel).toBe(
      '2026. 03. 01 ~ 2026. 03. 31'
    )
  })

  it('KST 자정 ISO는 달력일로 맞추고, 표시 라벨은 모집 행 날짜를 쓴다', () => {
    expect(toOperationCalendarDate('2026-11-30T15:00:00.000Z')).toBe('2026-12-01')
    expect(toOperationCalendarDate('2026-11-18')).toBe('2026-11-18')

    const program = baseProgram({
      programRecruitments: [
        {
          id: 186603,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          operationStartDate: '2026-11-18',
          operationEndDate: '2026-12-25',
        },
      ],
    })
    expect(audienceOperationPeriodLabelFromRecruitmentRow(program, 'participant')).toContain(
      '2026. 11. 18'
    )
    expect(audienceOperationPeriodLabelFromRecruitmentRow(program, 'participant')).not.toContain(
      '03. 01'
    )
  })

  it('참여기관 운영 기간은 기존 행 id를 유지한 채 달력일로 반영한다', () => {
    const existing = baseProgram({
      programRecruitments: [
        {
          id: 186603,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          targetType: 'ORGANIZATION',
          operationStartDate: '2026-11-18',
          operationEndDate: '2026-12-25',
        },
        {
          id: 186604,
          recruitmentType: 'INSTRUCTOR',
          operationStartDate: '2026-08-01',
          operationEndDate: '2026-08-31',
        },
      ],
    })
    const next = applyAudienceProgramOperationToRecruitmentWindows(
      existing,
      {
        participantProgramOperationStartDate: '2026-11-30T15:00:00.000Z',
        participantProgramOperationEndDate: '2027-01-14T15:00:00.000Z',
      } as import('@/features/program/shared/model/program-detail-edit-schema').ProgramDetailEditFormValues,
      'participant'
    )
    expect(next.programRecruitments?.[0]).toMatchObject({
      id: 186603,
      operationStartDate: '2026-12-01',
      operationEndDate: '2027-01-15',
    })
    expect(next.programRecruitments?.[1]).toMatchObject({
      id: 186604,
      operationStartDate: '2026-08-01',
      operationEndDate: '2026-08-31',
    })
  })
})
