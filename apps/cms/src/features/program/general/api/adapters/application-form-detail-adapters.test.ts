import { describe, expect, it } from 'vitest'
import type { FormResponseResponse } from '@/shared/api/generated/forms-surveys/schemas/formResponseResponse'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import { hydrateVolunteerApplicationRowFromForm } from './application-form-detail-adapters'

const baseRow = {
  hasJaVolunteerExperience: false,
  essayIntro: '',
  essayEducationExperience: '',
  essayNecessity: '',
  essayJaExperience: '',
  adminComment: '',
} as GeneralVolunteerApplicantRow

function formResponse(answers: Record<string, unknown>): FormResponseResponse {
  return {
    answers: Object.entries(answers).map(([questionKeySnapshot, value]) => ({
      questionKeySnapshot,
      answerValueJson: JSON.stringify(value),
    })),
  } as FormResponseResponse
}

describe('hydrateVolunteerApplicationRowFromForm', () => {
  it('Platform 자유 작성 items 를 문항별 에세이로 나눈다', () => {
    const row = hydrateVolunteerApplicationRowFromForm({
      row: baseRow,
      formResponse: formResponse({
        'program-volunteer-application-seed-ja-experience':
          'program-volunteer-application-ja-experience-no',
        'program-volunteer-application-seed-free-text-items': {
          items: [
            { id: 'intro', bodyText: '자기소개' },
            { id: 'educationExperience', bodyText: '교육 경험' },
            { id: 'necessity', bodyText: '필요성' },
            { id: 'jaExperience', bodyText: '없음' },
          ],
        },
      }),
    })
    expect(row.hasJaVolunteerExperience).toBe(false)
    expect(row.essayIntro).toBe('자기소개')
    expect(row.essayEducationExperience).toBe('교육 경험')
    expect(row.essayNecessity).toBe('필요성')
    expect(row.essayJaExperience).toBe('없음')
  })

  it('이전 참여 JA 봉사 프로그램을 「진행년도 · 프로그램명」으로 보여준다', () => {
    const row = hydrateVolunteerApplicationRowFromForm({
      row: baseRow,
      formResponse: formResponse({
        'program-volunteer-application-seed-ja-experience':
          'program-volunteer-application-ja-experience-yes',
        'program-volunteer-application-seed-previous-ja-program': {
          applicationYear: '2024',
          programName: '경제교실',
        },
      }),
    })
    expect(row.hasJaVolunteerExperience).toBe(true)
    expect(row.previousJaProgram).toBe('2024 · 경제교실')
  })
})
