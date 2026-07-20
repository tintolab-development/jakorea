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

    expect(request.title).toBe('테스트 프로그램')
    expect(request.type).toBe('offline')
    expect(request.lifecycleStatus).toBe('recruiting_students')
    expect(request.targetLevel).toBe('elementary')
    expect(request.rounds).toHaveLength(1)
    expect(request.programType).toBe('GENERAL')
    expect(request.businessStartDate).toBe('2026-04-01T00:00:00.000Z')
    expect(request.businessEndDate).toBe('2026-12-31T00:00:00.000Z')
    expect(request.autoApplyDefaultFormBindings).toBe(true)
  })

  it('does not put create-only fields on update request', () => {
    const request = mapGeneralProgramToUpdateRequest(sampleProgram)
    expect(request).not.toHaveProperty('programType')
    expect(request).not.toHaveProperty('autoApplyDefaultFormBindings')
    expect(request).not.toHaveProperty('businessStartDate')
    expect(request).not.toHaveProperty('businessEndDate')
  })

  it('maps Program patch to update request', () => {
    const request = mapGeneralProgramToUpdateRequest(sampleProgram, {
      title: '수정된 제목',
    })

    expect(request.title).toBe('수정된 제목')
    expect(request.mainTitle).toBe('테스트 프로그램')
  })

  it('puts education structure fields into serviceDetailJson for update', () => {
    const request = mapGeneralProgramToUpdateRequest({
      ...sampleProgram,
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
