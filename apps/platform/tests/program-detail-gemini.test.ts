import { describe, expect, it } from 'vitest'
import { mapPortalProgramDetail } from '../src/features/program/api/mappers'

describe('Gemini portal detail training request period', () => {
  it('keeps the training request period separate from the institution recruitment period', () => {
    const program = mapPortalProgramDetail({
      programId: 185003,
      programType: 'GEMINI_TRAINING',
      portalCategories: ['ORGANIZATION'],
      title: 'Gemini 연수',
      recruitments: [
        { recruitmentType: 'ORGANIZATION', startAt: '2026-08-01', endAt: '2026-08-31' },
      ],
      trainingRequestStartDate: '2026-09-01',
      trainingRequestEndDate: '2026-09-30',
      totalParticipants: 15,
    })

    expect(program?.detailCase).toBe('gemini')
    expect(program?.recruitmentPhases[0]?.value).toBe('2026년 8월 1일(토) ~ 2026년 8월 31일(월)')
    expect(program?.geminiTrainingRequestPeriodLabel).toBe('2026년 9월 1일(화) ~ 2026년 9월 30일(수)')
    expect(program?.recruitmentPhases[0]?.label).toBe('기관 모집 기간')
    expect(program?.basicInfoFields.find(field => field.label === '최소 수강 인원')?.value).toBe('15명')
  })

  it('does not expose the Gemini field for non-Gemini details or null periods', () => {
    const general = mapPortalProgramDetail({
      programId: 185004,
      programType: 'GENERAL',
      portalCategories: ['ORGANIZATION'],
      title: '일반 프로그램',
      trainingRequestStartDate: '2026-09-01',
      trainingRequestEndDate: '2026-09-30',
    })
    const geminiWithoutPeriod = mapPortalProgramDetail({
      programId: 185005,
      programType: 'GEMINI_TRAINING',
      portalCategories: ['ORGANIZATION'],
      title: '기간 미설정 Gemini',
      trainingRequestStartDate: null,
      trainingRequestEndDate: null,
    })

    expect(general?.geminiTrainingRequestPeriodLabel).toBeUndefined()
    expect(geminiWithoutPeriod?.geminiTrainingRequestPeriodLabel).toBeUndefined()
  })
})
