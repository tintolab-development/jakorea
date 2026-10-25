import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { serializeGeneralRecruitmentNestedServiceDetailPatch } from './general-program-service-detail-json'

function program(common: Record<string, unknown>): Program {
  return {
    id: '186356',
    sponsorId: 'sponsor-1',
    title: 'BOT-TEST',
    mainTitle: 'BOT-TEST',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'pending',
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalCommonInfo: common,
    registrationOverlay: { 'generalRegistration.basicInfo.programTitleKo': 'STALE' },
    rounds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as unknown as Program
}

describe('R8b 모집 탭 저장 serviceDetailJson patch 축소', () => {
  it('nested 모집 정보만 보내고 공통정보·overlay·지급항목은 보내지 않는다', () => {
    const json = serializeGeneralRecruitmentNestedServiceDetailPatch(
      program({
        announcementTitle: '오래된 공고명',
        paymentItems: '강사 교통비',
        participantRecruitmentInfo: { remarks: '모집 비고' },
        volunteerRecruitmentInfo: { interviewRequired: true },
      })
    )
    expect(json).toBeDefined()
    const parsed = JSON.parse(json!)
    expect(Object.keys(parsed).sort()).toEqual(['generalCommonInfo', 'schemaVersion'])
    expect(Object.keys(parsed.generalCommonInfo).sort()).toEqual([
      'participantRecruitmentInfo',
      'volunteerRecruitmentInfo',
    ])
    expect(parsed.generalCommonInfo.participantRecruitmentInfo.remarks).toBe('모집 비고')
    expect(json).not.toContain('STALE')
    expect(json).not.toContain('오래된 공고명')
    expect(parsed.registrationOverlay).toBeUndefined()
    expect(parsed.registration).toBeUndefined()
  })

  it('nested 모집 정보가 없으면 PATCH하지 않는다(undefined)', () => {
    expect(
      serializeGeneralRecruitmentNestedServiceDetailPatch(program({ announcementTitle: 'A' }))
    ).toBeUndefined()
  })
})
