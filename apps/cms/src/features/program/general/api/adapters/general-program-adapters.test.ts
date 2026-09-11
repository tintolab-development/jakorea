import { describe, expect, it } from 'vitest'
import {
  filterGeneralProgramsByOverviewStatus,
  mapAdminProgramListItemToProgram,
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import type { Program } from '@/types/domain'

const sampleProgram: Program = {
  id: 'prog-1',
  sponsorId: 'sponsor-1',
  title: '테스트 프로그램',
  mainTitle: '테스트 프로그램',
  type: 'offline',
  format: 'workshop',
  category: 'school',
  description: '설명',
  rounds: [
    {
      id: 'round-1',
      programId: 'prog-1',
      roundNumber: 1,
      startDate: '2026-04-01T00:00:00.000Z',
      endDate: '2026-04-30T00:00:00.000Z',
      capacity: 30,
      status: 'active',
    },
  ],
  startDate: '2026-04-01T00:00:00.000Z',
  endDate: '2026-12-31T00:00:00.000Z',
  applicationStartDate: '2026-03-01T00:00:00.000Z',
  applicationEndDate: '2026-03-31T00:00:00.000Z',
  status: 'pending',
  lifecycleStatus: 'recruiting_students',
  businessArea: '경제금융',
  targetLevel: 'elementary',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('general-program-adapters', () => {
  it('maps API list item to Program domain', () => {
    const program = mapAdminProgramListItemToProgram({
      id: 5001,
      nameKo: 'JA 코리아 금융교육',
      periodStatus: 'RECRUITING',
      businessStartDate: '2026-03-01',
      businessEndDate: '2026-12-31',
    })

    expect(program.id).toBe('5001')
    expect(program.title).toBe('JA 코리아 금융교육')
    expect(program.lifecycleStatus).toBe('recruiting_students')
    expect(program.startDate).toBe('2026-03-01')
  })

  it('prefers title/mainTitle when list item has no nameKo (actual BE list shape)', () => {
    const program = mapAdminProgramListItemToProgram({
      id: '8c495543-4a17-45ff-9d1a-4483a4ac955c',
      title: '테스트(mrssl5qf)',
      mainTitle: '테스트(mrssl5qf)',
      lifecycleStatus: 'recruiting_students',
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-12-31T00:00:00Z',
    })

    expect(program.title).toBe('테스트(mrssl5qf)')
    expect(program.mainTitle).toBe('테스트(mrssl5qf)')
    expect(program.lifecycleStatus).toBe('recruiting_students')
  })

  it('filters overview status like mock list', () => {
    const programs = [
      mapAdminProgramListItemToProgram({ id: 1, nameKo: 'A', periodStatus: 'RECRUITING' }),
      mapAdminProgramListItemToProgram({ id: 2, nameKo: 'B', periodStatus: 'IN_PROGRESS' }),
      mapAdminProgramListItemToProgram({ id: 3, nameKo: 'C', periodStatus: 'COMPLETED' }),
    ]

    expect(filterGeneralProgramsByOverviewStatus(programs, 'scheduled')).toHaveLength(1)
    expect(filterGeneralProgramsByOverviewStatus(programs, 'in_progress')).toHaveLength(1)
    expect(filterGeneralProgramsByOverviewStatus(programs, 'completed')).toHaveLength(1)
  })

  it('maps Program to create request with core fields', () => {
    const request = mapGeneralProgramToCreateRequest(sampleProgram)
    const create = request as import('@/shared/api/generated/dashboard/schemas/programCreateRequest').ProgramCreateRequest & {
      applicationTargetMode?: string
    }

    expect(create.title).toBe('테스트 프로그램')
    expect(create.type).toBe('offline')
    expect(create.targetLevel).toBe('elementary')
    expect(create.rounds).toHaveLength(1)
    // audience 미설정 → ORGANIZATION → GENERAL_ORGANIZATION
    expect(create.programType).toBe('GENERAL_ORGANIZATION')
    expect(create.businessStartDate).toBe('2026-04-01T00:00:00.000Z')
    expect(create.businessEndDate).toBe('2026-12-31T00:00:00.000Z')
    expect(create.autoApplyDefaultFormBindings).toBe(true)
    // audience 미설정 시 폼 기본값(organization)과 동일
    expect(create.applicationTargetMode).toBe('ORGANIZATION')
  })

  it('maps generalProgramAudience to applicationTargetMode', () => {
    expect(
      mapGeneralProgramToCreateRequest({
        ...sampleProgram,
        generalProgramAudience: 'individual',
      }).applicationTargetMode
    ).toBe('INDIVIDUAL')
    expect(
      mapGeneralProgramToCreateRequest({
        ...sampleProgram,
        generalProgramAudience: 'individual',
      }).programType
    ).toBe('GENERAL_INDIVIDUAL')
    expect(
      mapGeneralProgramToCreateRequest({
        ...sampleProgram,
        generalProgramAudience: 'organization',
      }).applicationTargetMode
    ).toBe('ORGANIZATION')
    expect(
      mapGeneralProgramToCreateRequest({
        ...sampleProgram,
        generalProgramAudience: 'organization',
      }).programType
    ).toBe('GENERAL_ORGANIZATION')
  })

  it('derives applicationTargetMode from generalParticipantTypes when audience missing', () => {
    expect(
      mapGeneralProgramToCreateRequest({
        ...sampleProgram,
        generalParticipantTypes: ['individual', 'teacher_instructor'],
      }).applicationTargetMode
    ).toBe('INDIVIDUAL')
    expect(
      mapGeneralProgramToCreateRequest({
        ...sampleProgram,
        generalParticipantTypes: ['individual', 'teacher_instructor'],
      }).programType
    ).toBe('GENERAL_INDIVIDUAL')
    expect(
      mapGeneralProgramToCreateRequest({
        ...sampleProgram,
        generalParticipantTypes: ['individual', 'school_institution'],
      }).applicationTargetMode
    ).toBe('BOTH')
    expect(
      mapGeneralProgramToCreateRequest({
        ...sampleProgram,
        generalParticipantTypes: ['individual', 'school_institution'],
      }).programType
    ).toBe('GENERAL')
  })

  it('does not put create-only fields on update request', () => {
    const request = mapGeneralProgramToUpdateRequest(sampleProgram)
    expect(request).not.toHaveProperty('programType')
    expect(request).not.toHaveProperty('autoApplyDefaultFormBindings')
    expect(request).not.toHaveProperty('businessStartDate')
    expect(request).not.toHaveProperty('businessEndDate')
  })

  it('maps Program patch to update request with only patched keys', () => {
    const request = mapGeneralProgramToUpdateRequest(sampleProgram, {
      title: '수정된 제목',
      mainTitle: '수정된 대표명',
    })

    expect(request.title).toBe('수정된 제목')
    expect(request.mainTitle).toBe('수정된 대표명')
    expect(request.rounds).toBeUndefined()
    expect(request.managerName).toBeUndefined()
    expect(request.contactPhone).toBeUndefined()
    expect(request.curriculum).toBeUndefined()
    expect(request.serviceDetailJson).toBeUndefined()
  })

  it('omits masked manager/contact from patch update request', () => {
    const request = mapGeneralProgramToUpdateRequest(sampleProgram, {
      managerName: '김*원',
      contactPhone: '010-****-7253',
      mainTitle: '제목만',
    })

    expect(request.mainTitle).toBe('제목만')
    expect(request.managerName).toBeUndefined()
    expect(request.contactPhone).toBeUndefined()
  })

  it('includes serviceDetailJson and applicationTargetMode when audience patch is provided', () => {
    const request = mapGeneralProgramToUpdateRequest(sampleProgram, {
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    })

    expect(request.applicationTargetMode).toBe('INDIVIDUAL')
    expect(request.serviceDetailJson).toBeTruthy()
    expect(request.rounds).toBeUndefined()
  })

  it('common-info style patch does not dump rounds or masked manager fields', () => {
    const withNoise: Program = {
      ...sampleProgram,
      managerName: '김*원',
      contactPhone: '010-****-7253',
      curriculum: 'payment-orders-catalog-v1',
      oneLineIntroduction: 'should-not-send',
      rounds: sampleProgram.rounds,
    }
    const request = mapGeneralProgramToUpdateRequest(withNoise, {
      mainTitle: '공통정보만',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      sponsorId: '1627251',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
      generalCommonInfo: {
        announcementTitle: '공고명',
        sponsorManagerLine: '팀장 김*원 | 010-****-7253',
      },
    })

    expect(request.mainTitle).toBe('공통정보만')
    expect(request.sponsorId).toBe('1627251')
    expect(request.applicationTargetMode).toBe('ORGANIZATION')
    expect(request.serviceDetailJson).toContain('announcementTitle')
    expect(request.rounds).toBeUndefined()
    expect(request.managerName).toBeUndefined()
    expect(request.contactPhone).toBeUndefined()
    expect(request.curriculum).toBeUndefined()
    expect(request.oneLineIntroduction).toBeUndefined()
  })

  it('puts education structure fields into serviceDetailJson for update', () => {
    const request = mapGeneralProgramToUpdateRequest(sampleProgram, {
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
      generalProgramAudience: 'individual',
    })

    expect(request.serviceDetailJson).toBeTruthy()
    const parsed = JSON.parse(request.serviceDetailJson!) as {
      generalProgramEducationStructure?: string
      generalProgramSessionRound?: string
      generalProgramAudience?: string
    }
    expect(parsed.generalProgramEducationStructure).toBe('schedule')
    expect(parsed.generalProgramSessionRound).toBe('single')
    expect(parsed.generalProgramAudience).toBe('individual')
  })
})
