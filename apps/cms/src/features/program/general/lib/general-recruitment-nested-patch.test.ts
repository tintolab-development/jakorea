import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { serializeGeneralRecruitmentNestedServiceDetailPatch } from './general-program-service-detail-json'
import { buildGeneralRecruitmentAuxiliaryUpdate } from './persist-recruitment-nested-snapshot'

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

const FIVE_LEVELS = ['elementary', 'middle', 'high', 'university', 'adult'] as const

function recruitmentProgram(): Program {
  return program({
    announcementTitle: '오래된 공고명',
    paymentItems: '강사 교통비',
    participantRecruitmentInfo: {
      educationTarget: '초등학교, 중학교, 고등학교, 대학(원)생, 성인',
      remarks: '모집 비고',
    },
  })
}

function withRecruitment(overrides: Partial<Program>): Program {
  return {
    ...recruitmentProgram(),
    targetLevels: ['high', 'university'],
    targetLevel: 'high',
    instructorTargets: ['adult'],
    registrationOverlay: { 'generalRegistration.basicInfo.programTitleKo': 'STALE' },
    ...overrides,
  }
}

describe('모집 탭 보조 PUT — 바뀐 교육·모집 대상만', () => {
  it('참여자 교육 대상이 저장된 컬럼과 다르면 요청 필드와 JSON 루트에 넣고 공통정보는 빼 둔다', () => {
    const persisted = withRecruitment({})
    const draft = withRecruitment({
      targetLevels: [...FIVE_LEVELS],
      targetLevel: 'elementary',
    })
    const update = buildGeneralRecruitmentAuxiliaryUpdate(draft, {
      audience: 'participant',
      persisted,
      baseline: draft,
    })
    expect(update?.targetLevels).toEqual([...FIVE_LEVELS])
    expect(update?.targetLevel).toBe('elementary')
    const parsed = JSON.parse(update!.serviceDetailJson!)
    expect(parsed.targetLevels).toEqual([...FIVE_LEVELS])
    expect(parsed.program.targetLevels).toEqual([...FIVE_LEVELS])
    expect(Object.keys(parsed.generalCommonInfo).sort()).toEqual(['participantRecruitmentInfo'])
    expect(parsed.registration).toBeUndefined()
    expect(update!.serviceDetailJson).not.toContain('STALE')
    expect(update!.serviceDetailJson).not.toContain('오래된 공고명')
    expect(update!.serviceDetailJson).not.toContain('강사 교통비')
  })

  it('개인 참여자 탭도 같은 교육 대상 필드를 보낸다', () => {
    const persisted = withRecruitment({ generalProgramAudience: 'individual' })
    const draft = withRecruitment({
      generalProgramAudience: 'individual',
      targetLevels: ['elementary', 'middle'],
      targetLevel: 'elementary',
    })
    const update = buildGeneralRecruitmentAuxiliaryUpdate(draft, {
      audience: 'participant',
      persisted,
    })
    expect(update?.targetLevels).toEqual(['elementary', 'middle'])
    expect(update?.targetLevel).toBe('elementary')
  })

  it('교육 대상이 그대로면 targetLevels를 요청·JSON에 넣지 않는다', () => {
    const same = withRecruitment({
      targetLevels: ['high', 'university'],
      targetLevel: 'high',
    })
    const update = buildGeneralRecruitmentAuxiliaryUpdate(same, {
      audience: 'participant',
      persisted: same,
      baseline: same,
    })
    expect(update).not.toHaveProperty('targetLevels')
    expect(update).not.toHaveProperty('targetLevel')
    const parsed = JSON.parse(update!.serviceDetailJson!)
    expect(parsed.targetLevels).toBeUndefined()
    expect(parsed.program).toBeUndefined()
    expect(parsed.registration).toBeUndefined()
    expect(Object.keys(parsed).sort()).toEqual(['generalCommonInfo', 'schemaVersion'])
  })

  it('강사 모집 대상이 바뀌면 overlay 키만 넣고 교육 대상 컬럼은 보내지 않는다', () => {
    const persisted = withRecruitment({ instructorTargets: ['adult'] })
    const draft = withRecruitment({
      instructorTargets: ['university', 'adult'],
      targetLevels: [...FIVE_LEVELS],
    })
    const update = buildGeneralRecruitmentAuxiliaryUpdate(draft, {
      audience: 'instructor',
      persisted,
      baseline: persisted,
    })
    expect(update).not.toHaveProperty('targetLevels')
    const parsed = JSON.parse(update!.serviceDetailJson!)
    expect(parsed.registration.overlay).toEqual({
      'recruit.instructor.recruitTargets': ['university', 'adult'],
    })
    expect(parsed.targetLevels).toBeUndefined()
    expect(parsed.generalCommonInfo.participantRecruitmentInfo.remarks).toBe('모집 비고')
    expect(update!.serviceDetailJson).not.toContain('STALE')
  })

  it('강사 모집 대상이 그대로면 overlay를 만들지 않는다', () => {
    const same = withRecruitment({ instructorTargets: ['adult'] })
    const update = buildGeneralRecruitmentAuxiliaryUpdate(same, {
      audience: 'instructor',
      persisted: same,
      baseline: same,
    })
    const parsed = JSON.parse(update!.serviceDetailJson!)
    expect(parsed.registration).toBeUndefined()
    expect(update).not.toHaveProperty('targetLevels')
  })
})
