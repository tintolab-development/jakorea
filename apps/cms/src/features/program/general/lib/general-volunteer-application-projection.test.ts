import { describe, expect, it } from 'vitest'
import { readGeneralVolunteerProjection } from './general-volunteer-application-projection'

const base = {
  hasJaVolunteerExperience: false,
  previousJaProgram: undefined,
  essayIntro: '',
  essayEducationExperience: '',
  essayNecessity: '',
  essayJaExperience: '',
}

describe('readGeneralVolunteerProjection', () => {
  it('keeps base when application.general is absent', () => {
    expect(readGeneralVolunteerProjection({ attachments: [] }, base)).toEqual(base)
    expect(readGeneralVolunteerProjection(null, base)).toEqual(base)
  })

  it('maps essays, JA experience and previous program', () => {
    const row = readGeneralVolunteerProjection(
      {
        general: {
          jaExperience: true,
          previousJaProgram: { applicationYear: '2021', programName: '경제교실' },
          essayIntro: ' 자기소개 ',
          essayEducationExperience: '교육 경험',
          essayNecessity: '필요성',
          essayJaExperience: 'JA 경험',
        },
      },
      base,
    )
    expect(row).toEqual({
      hasJaVolunteerExperience: true,
      previousJaProgram: '2021 · 경제교실',
      essayIntro: '자기소개',
      essayEducationExperience: '교육 경험',
      essayNecessity: '필요성',
      essayJaExperience: 'JA 경험',
    })
  })

  it('ignores null fields', () => {
    const row = readGeneralVolunteerProjection(
      { general: { jaExperience: null, essayIntro: null, previousJaProgram: null } },
      { ...base, essayIntro: '기존' },
    )
    expect(row.essayIntro).toBe('기존')
    expect(row.hasJaVolunteerExperience).toBe(false)
  })
})
