import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  programToDetailEditValues,
  resolveStoredEducationFormLabel,
} from '@/features/program/shared/model/program-detail-edit-schema'
import { enrichTrainedTeachersTypeSettingsFromApi } from '@/features/program/trained-teachers/lib/resolve-type-settings-from-api'

function program(partial: Partial<Program>): Program {
  return {
    id: '900001',
    sponsorId: '1',
    title: 'P',
    type: 'online',
    format: 'workshop',
    category: 'school',
    description: '',
    rounds: [],
    startDate: '2026-04-01',
    endDate: '2026-12-31',
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('resolveStoredEducationFormLabel — 사전 교육 행(overlay 0) 제외', () => {
  it('일정형: 사전 교육 행만 라벨이 있으면 본 교육 라벨로 올리지 않는다', () => {
    expect(
      resolveStoredEducationFormLabel({
        scheduleDetails: [
          { scheduleLabel: '사전 교육', educationFormLabel: '오프라인' },
          { scheduleLabel: '세부 일정 01' },
        ],
      })
    ).toBe('')
  })

  it('일정형: 사전 교육과 본 교육 라벨이 다르면 본 교육 라벨을 쓴다', () => {
    expect(
      resolveStoredEducationFormLabel({
        scheduleDetails: [
          { scheduleLabel: '사전 교육', educationFormLabel: '오프라인' },
          { scheduleLabel: '세부 일정 01', educationFormLabel: '온라인' },
          { scheduleLabel: '세부 일정 02', educationFormLabel: '온라인' },
        ],
      })
    ).toBe('온라인')
  })

  it('커리큘럼형: 사전 교육 회차만 라벨이 있으면 빈 값', () => {
    expect(
      resolveStoredEducationFormLabel({
        curriculumSessions: [
          { sessionLabel: '사전 교육', educationFormLabel: '오프라인' },
          { sessionLabel: '1회차' },
        ],
      })
    ).toBe('')
  })

  it('루트 라벨이 있으면 그대로 쓴다', () => {
    expect(
      resolveStoredEducationFormLabel({
        educationFormLabel: '온/오프라인',
        scheduleDetails: [{ scheduleLabel: '사전 교육', educationFormLabel: '오프라인' }],
      })
    ).toBe('온/오프라인')
  })
})

describe('호출처 영향', () => {
  it('일반 programToDetailEditValues: 사전 교육 행 라벨이 본 교육 형태 시드가 되지 않는다', () => {
    const values = programToDetailEditValues(
      program({
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          educationFormScheduleDetail: 'common',
          scheduleDetails: [
            { scheduleLabel: '사전 교육', name: '사전 교육', educationFormLabel: '오프라인' },
            { scheduleLabel: '세부 일정 01', name: 'A' },
          ],
        },
      })
    )
    expect(values.educationForm).toBeUndefined()
  })

  it('TT enrich: 사전 교육 행 라벨만 있으면 API type 으로 본 교육 라벨을 보강한다', () => {
    const tt = program({
      type: 'online',
      backendProgramType: 'TRAINED_TEACHER',
      generalCommonInfo: {
        educationFormScheduleDetail: 'common',
        scheduleDetails: [
          { scheduleLabel: '사전 교육', name: '사전 교육', educationFormLabel: '오프라인' },
          { scheduleLabel: '세부 일정 01', name: 'A' },
        ],
      },
    })
    const patch = enrichTrainedTeachersTypeSettingsFromApi(tt, tt.generalCommonInfo!)
    expect(patch.educationFormLabel).toBe('온라인')
  })
})
