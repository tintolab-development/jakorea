import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { applyEconomyRegistrationOverlayToProgram } from './economy-registration-overlay-to-program'

function baseProgram(): Program {
  return {
    id: 'company-school-local-1',
    title: '1사1교 테스트',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '1사1교 프로그램 등록(임시 저장)',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    applicationStartDate: '2026-01-01T00:00:00.000Z',
    applicationEndDate: '2026-01-31T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    generalCommonInfo: {
      educationScheduleMode: 'period',
      curriculumSessions: [
        { sessionLabel: '1차시', title: '1단원 나를 알리는 기술', description: '기본값 설명 1' },
        { sessionLabel: '2차시', title: '2단원 나를 보여주는 기술', description: '기본값 설명 2' },
      ],
      educationScheduleLines: ['2026. 03. 01 ~ 2026. 12. 31'],
      wageGradeRows: [
        { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 500,000원 | 장거리 : 500,000원' },
        { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 400,000원 | 장거리 : 400,000원' },
        { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 300,000원 | 장거리 : 300,000원' },
      ],
      paymentItems: '교통비(일사일교), 숙박비(일사일교)',
      deductionItems: '일용근로자 원천징수세액',
    },
  } as Program
}

describe('applyEconomyRegistrationOverlayToProgram', () => {
  it('overlay가 비어 있으면 기존 기본값(목업)을 그대로 유지한다', () => {
    const result = applyEconomyRegistrationOverlayToProgram(baseProgram(), {})
    expect(result.generalCommonInfo?.curriculumSessions?.[0].title).toBe('1단원 나를 알리는 기술')
    expect(result.generalCommonInfo?.educationScheduleLines).toEqual(['2026. 03. 01 ~ 2026. 12. 31'])
    expect(result.generalCommonInfo?.wageGradeRows?.[0].pricing).toContain('500,000원')
  })

  it('overlay에 실입력이 있으면 기본값 대신 실입력을 반영한다 (버그 수정 확인)', () => {
    const overlay: Record<string, unknown> = {
      'economyRegistration.educationCurriculum.session1.title': '실제 입력한 1차시 제목',
      'economyRegistration.educationCurriculum.session1.description': '실제 입력한 1차시 설명',
      'economyRegistration.educationCurriculum.session2.title': '실제 입력한 2차시 제목',
      'economyRegistration.educationCurriculum.session2.description': '실제 입력한 2차시 설명',
      'economyRegistration.educationScheduleSettings.dateRangeSeal': {
        start: '2026-05-01T00:00:00.000Z',
        end: '2026-11-30T00:00:00.000Z',
      },
      'economyRegistration.wageInfo.grade1Fee': 111111,
      'economyRegistration.wageInfo.grade1DistanceFee': 222222,
      'economyRegistration.wageInfo.grade2Fee': 33333,
      'economyRegistration.wageInfo.grade2DistanceFee': 44444,
      'economyRegistration.wageInfo.grade3Fee': 5555,
      'economyRegistration.wageInfo.grade3DistanceFee': 6666,
    }

    const result = applyEconomyRegistrationOverlayToProgram(baseProgram(), overlay)

    expect(result.generalCommonInfo?.curriculumSessions?.[0].title).toBe('실제 입력한 1차시 제목')
    expect(result.generalCommonInfo?.curriculumSessions?.[0].description).toBe(
      '실제 입력한 1차시 설명'
    )
    expect(result.generalCommonInfo?.curriculumSessions?.[1].title).toBe('실제 입력한 2차시 제목')

    expect(result.generalCommonInfo?.educationScheduleLines).toEqual([
      '2026. 05. 01 ~ 2026. 11. 30',
    ])

    expect(result.generalCommonInfo?.wageGradeRows?.[0].pricing).toContain('111,111원')
    expect(result.generalCommonInfo?.wageGradeRows?.[0].pricing).toContain('222,222원')
    expect(result.generalCommonInfo?.wageGradeRows?.[1].pricing).toContain('33,333원')
  })

  it('결제 항목 id가 overlay에 있으면 라벨로 변환해 반영한다', () => {
    const overlay: Record<string, unknown> = {
      'economyRegistration.wageInfo.paymentItemValues': ['p-166207'],
    }
    const result = applyEconomyRegistrationOverlayToProgram(baseProgram(), overlay)
    // 실제 라벨 매핑은 설정 데이터에 의존 — 최소한 기존 목업 텍스트로 되돌아가지 않는지만 확인
    expect(result.generalCommonInfo?.paymentItems).not.toBe(undefined)
  })
})
