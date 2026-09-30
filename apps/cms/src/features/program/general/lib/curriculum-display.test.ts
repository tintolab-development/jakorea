import { describe, expect, it } from 'vitest'
import {
  countGeneralCurriculumMultiRoundsFromOverlay,
  hasGeneralCurriculumMultiRoundOverlay,
  resolveEffectiveGeneralProgramTypeFields,
} from './curriculum-display'

describe('curriculum multi-round overlay inference', () => {
  it('progressSessionByRound가 있으면 복수 회차로 본다', () => {
    const overlay = {
      'generalRegistration.educationCurriculum.progressSessionByRound': { 1: '1' },
      'generalRegistration.educationCurriculum.roundContentByRound': {
        1: '필요한 것과 갖고 싶은 것을 구분하고 소비 계획을 세워 봅니다.',
      },
    }
    expect(hasGeneralCurriculumMultiRoundOverlay(overlay)).toBe(true)
    expect(countGeneralCurriculumMultiRoundsFromOverlay(overlay)).toBe(1)
    expect(
      resolveEffectiveGeneralProgramTypeFields({
        generalProgramAudience: 'individual',
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'single',
        curriculumSessions: [
          { sessionLabel: '1차시', title: '필요와 욕구, 현명한 소비', description: '내용' },
          { sessionLabel: '2차시', title: '', description: '' },
        ],
        registrationOverlay: overlay,
      }).sessionRound
    ).toBe('multi')
  })

  it('단수 시드용 빈 assignment 맵만으로는 복수 회차가 아니다', () => {
    expect(
      hasGeneralCurriculumMultiRoundOverlay({
        'generalRegistration.educationCurriculum.assignmentByRound': {
          1: { enabled: false, period: '' },
        },
      })
    ).toBe(false)
    expect(
      countGeneralCurriculumMultiRoundsFromOverlay({
        'generalRegistration.educationCurriculum.assignmentByRound': {
          1: { enabled: false, period: '' },
        },
      })
    ).toBe(0)
  })
})
