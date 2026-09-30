import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { applyRecruitmentAdditionalContentHtml } from './apply-recruitment-additional-content-html'
import { resolveGeneralRecruitDetailDisplayProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { serializeGeneralProgramServiceDetailJson } from '@/features/program/general/lib/general-program-service-detail-json'

const existing = {
  id: '186023',
  title: '테스트',
  category: 'school',
  type: 'offline',
  format: 'workshop',
  status: 'active',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  sponsorId: 'sponsor-1',
  rounds: [],
  additionalContentHtml: '<p>컬럼 신규</p>',
  registrationOverlay: {
    'recruit.detailInfo.additionalContentHtml': '<p>overlay 옛본문</p>',
  },
  generalCommonInfo: {
    participantRecruitmentInfo: {
      additionalContentHtml: '<p>중첩 옛본문</p>',
      programDescription: '설명',
    },
    instructorRecruitmentInfo: {
      additionalContentHtml: '<p>강사 옛본문</p>',
    },
    volunteerRecruitmentInfo: {
      additionalContentHtml: '<p>봉사자 옛본문</p>',
    },
  },
} as Program

describe('applyRecruitmentAdditionalContentHtml', () => {
  it('참여자 모집 저장 — 중첩 SSOT·컬럼·overlay를 같은 HTML로 맞춘다', () => {
    const html = '<p style="color: red;">신규 추가 내용 😀</p>'
    const patch = applyRecruitmentAdditionalContentHtml(
      { additionalContentHtml: html },
      existing,
      html,
      'participant'
    )

    expect(patch.additionalContentHtml).toBe(html)
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.additionalContentHtml).toBe(html)
    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.additionalContentHtml).toBe(
      '<p>강사 옛본문</p>'
    )
    expect(patch.registrationOverlay?.['recruit.detailInfo.additionalContentHtml']).toBe(html)

    const display = resolveGeneralRecruitDetailDisplayProgram({ ...existing, ...patch }, 'participant')
    expect(display.additionalContentHtml).toBe(html)

    const serialized = serializeGeneralProgramServiceDetailJson({ ...existing, ...patch } as Program)
    expect(serialized).toBeTruthy()
    const parsed = JSON.parse(serialized!) as {
      generalCommonInfo?: {
        participantRecruitmentInfo?: { additionalContentHtml?: string }
      }
    }
    expect(parsed.generalCommonInfo?.participantRecruitmentInfo?.additionalContentHtml).toBe(html)
  })

  it('강사 모집 저장 — instructorRecruitmentInfo만 갱신한다', () => {
    const html = '<p>강사 추가</p>'
    const patch = applyRecruitmentAdditionalContentHtml({}, existing, html, 'instructor')

    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.additionalContentHtml).toBe(html)
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.additionalContentHtml).toBe(
      '<p>중첩 옛본문</p>'
    )
    expect(patch.registrationOverlay?.['recruitInstructor.detailInfo.additionalContentHtml']).toBe(
      html
    )
  })
})
