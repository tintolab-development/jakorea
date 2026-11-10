import { describe, expect, it } from 'vitest'
import type { VolunteerApplicationEvidenceAttachment } from '@/features/program/general/model/volunteer-applicant'
import {
  GENERAL_VOLUNTEER_PREVIOUS_JA_PROGRAM_QUESTION_KEY,
  filterGeneralVolunteerPreviousJaProgramAttachments,
  shouldShowGeneralVolunteerPreviousJaProgramSection,
  splitGeneralVolunteerPreviousJaProgram,
} from './volunteer-previous-ja-program-display'

function file(questionKey: string, id: number): VolunteerApplicationEvidenceAttachment {
  return {
    submissionFileId: id,
    questionKey,
    fileObjectId: id,
    originalFileName: `f${id}.jpg`,
    downloadPolicyPath: `/files/${id}`,
  }
}

describe('splitGeneralVolunteerPreviousJaProgram', () => {
  it('「연도 · 프로그램명」을 연도(년)·프로그램명으로 나눈다', () => {
    expect(splitGeneralVolunteerPreviousJaProgram('2023 · [삼일회계법인-JA Korea] 봉사여행')).toEqual([
      '2023년',
      '[삼일회계법인-JA Korea] 봉사여행',
    ])
  })

  it('구분자가 없으면 원문 하나, 비면 빈 배열', () => {
    expect(splitGeneralVolunteerPreviousJaProgram('경제교실')).toEqual(['경제교실'])
    expect(splitGeneralVolunteerPreviousJaProgram('  ')).toEqual([])
    expect(splitGeneralVolunteerPreviousJaProgram(undefined)).toEqual([])
  })
})

describe('이전 참여 JA 첨부·노출', () => {
  it('이전 참여 JA 문항 첨부만 고른다', () => {
    const files = [file(GENERAL_VOLUNTEER_PREVIOUS_JA_PROGRAM_QUESTION_KEY, 1), file('other', 2), file('', 3)]
    expect(filterGeneralVolunteerPreviousJaProgramAttachments(files).map(f => f.submissionFileId)).toEqual([1, 3])
  })

  it('JA 경험 없음 + 답·첨부 없음이면 숨긴다', () => {
    expect(shouldShowGeneralVolunteerPreviousJaProgramSection({ hasJaVolunteerExperience: false })).toBe(false)
    expect(shouldShowGeneralVolunteerPreviousJaProgramSection({ hasJaVolunteerExperience: true })).toBe(true)
    expect(
      shouldShowGeneralVolunteerPreviousJaProgramSection({
        hasJaVolunteerExperience: false,
        previousJaProgram: '2023 · 경제교실',
      })
    ).toBe(true)
  })
})
