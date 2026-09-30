import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { buildGeminiRecruitmentDevAutofillSnapshot } from './dev-autofill'
import type { GeminiRecruitmentDevAutofillCase } from './dev-autofill'

const BASE_CASE: GeminiRecruitmentDevAutofillCase = {
  notes: 'filled',
  educationTarget: 'both',
  educationForm: 'offline',
  announcement: 'published',
  period: 'request-after-recruitment',
  sectionDescription: 'shown',
}

describe('buildGeminiRecruitmentDevAutofillSnapshot', () => {
  it('해당 없음이면 비고를 비우고, 작성이면 비고를 채운다', () => {
    const cleared = buildGeminiRecruitmentDevAutofillSnapshot({
      ...BASE_CASE,
      notes: 'not-applicable',
    })
    expect(cleared.notesNotApplicable).toBe(true)
    expect(cleared.notes).toBe('')

    const filled = buildGeminiRecruitmentDevAutofillSnapshot({
      ...BASE_CASE,
      notes: 'filled',
    })
    expect(filled.notesNotApplicable).toBe(false)
    expect(filled.notes.trim().length).toBeGreaterThan(0)
  })

  it('교육 대상은 성인·대학생·둘 다로 나뉜다', () => {
    expect(
      buildGeminiRecruitmentDevAutofillSnapshot({
        ...BASE_CASE,
        educationTarget: 'adult',
      }).educationTargetLevels
    ).toEqual(['adult'])
    expect(
      buildGeminiRecruitmentDevAutofillSnapshot({
        ...BASE_CASE,
        educationTarget: 'university',
      }).educationTargetLevels
    ).toEqual(['university'])
    expect(
      buildGeminiRecruitmentDevAutofillSnapshot({
        ...BASE_CASE,
        educationTarget: 'both',
      }).educationTargetLevels
    ).toEqual(['adult', 'university'])
  })

  it('연수 요청은 모집 종료 다음 날이거나 모집 기간과 겹친다', () => {
    const after = buildGeminiRecruitmentDevAutofillSnapshot({
      ...BASE_CASE,
      period: 'request-after-recruitment',
    })
    expect(
      dayjs(after.trainingRequestPeriodStart).isAfter(dayjs(after.applicationPeriodEnd), 'day')
    ).toBe(true)

    const overlap = buildGeminiRecruitmentDevAutofillSnapshot({
      ...BASE_CASE,
      period: 'request-overlaps-recruitment',
    })
    const trainingStart = dayjs(overlap.trainingRequestPeriodStart)
    const applicationStart = dayjs(overlap.applicationPeriodStart)
    const applicationEnd = dayjs(overlap.applicationPeriodEnd)
    expect(trainingStart.isAfter(applicationStart, 'day')).toBe(true)
    expect(trainingStart.isBefore(applicationEnd, 'day')).toBe(true)
    expect(dayjs(overlap.trainingRequestPeriodEnd).isAfter(applicationEnd, 'day')).toBe(true)
  })

  it('섹션 설명이 공란이면 홈페이지 미노출 케이스다', () => {
    const hidden = buildGeminiRecruitmentDevAutofillSnapshot({
      ...BASE_CASE,
      sectionDescription: 'hidden',
    })
    expect(hidden.institutionSectionDescription).toBe('')
    expect(hidden.detailSectionDescription).toBe('')

    const shown = buildGeminiRecruitmentDevAutofillSnapshot({
      ...BASE_CASE,
      sectionDescription: 'shown',
    })
    expect(shown.institutionSectionDescription.trim().length).toBeGreaterThan(0)
    expect(shown.detailSectionDescription.trim().length).toBeGreaterThan(0)
  })

  it('등록에 필요한 공고명·기간·최소 인원·교육 형태·educationStructure를 채운다', () => {
    const snapshot = buildGeminiRecruitmentDevAutofillSnapshot({
      ...BASE_CASE,
      educationForm: 'online',
      announcement: 'unpublished',
    })
    expect(snapshot.title.trim().length).toBeGreaterThan(0)
    expect(snapshot.announcementPublished).toBe('unpublished')
    expect(snapshot.educationForm).toBe('online')
    expect(snapshot.educationStructure).toBe('SCHEDULE')
    expect(snapshot.minStudentCount).toBeGreaterThanOrEqual(1)
    expect(snapshot.applicationPeriodStart).toBeTruthy()
    expect(snapshot.applicationPeriodEnd).toBeTruthy()
    expect(snapshot.thumbnailFileName).toBeNull()
    expect(snapshot.attachmentFileNames).toEqual([])
  })
})
