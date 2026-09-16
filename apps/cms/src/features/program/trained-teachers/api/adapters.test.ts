import { describe, expect, it } from 'vitest'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import type { Program } from '@/types/domain'
import {
  mapApiEducationStructureToDomain,
  mapDomainEducationStructureToApi,
  mapTrainedTeacherDetailToProgram,
  mapTrainedTeacherToUpdateRequest,
} from './adapters'
import { serializeTrainedTeacherServiceDetailJson } from './service-detail-json'

describe('mapApiEducationStructureToDomain', () => {
  it('maps CURRICULUM and SCHEDULE', () => {
    expect(mapApiEducationStructureToDomain('CURRICULUM')).toBe('curriculum')
    expect(mapApiEducationStructureToDomain('SCHEDULE')).toBe('schedule')
  })

  it('returns undefined for unknown values', () => {
    expect(mapApiEducationStructureToDomain(undefined)).toBeUndefined()
    expect(mapApiEducationStructureToDomain('OTHER')).toBeUndefined()
  })
})

describe('mapDomainEducationStructureToApi', () => {
  it('maps curriculum and schedule', () => {
    expect(mapDomainEducationStructureToApi('curriculum')).toBe('CURRICULUM')
    expect(mapDomainEducationStructureToApi('schedule')).toBe('SCHEDULE')
  })
})

describe('mapTrainedTeacherDetailToProgram educationStructure', () => {
  const baseDto: ProgramResponse = {
    id: '186002',
    title: 'TT Primary',
    sponsorId: 'sponsor-1',
  }

  it('prefers API educationStructure over serviceDetailJson', () => {
    const programWithSchedule: Program = {
      id: 'tmp',
      sponsorId: 's',
      title: 't',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      rounds: [],
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'pending',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      generalProgramEducationStructure: 'schedule',
    }
    const dto: ProgramResponse = {
      ...baseDto,
      educationStructure: 'CURRICULUM',
      serviceDetailJson: serializeTrainedTeacherServiceDetailJson(programWithSchedule),
    }
    const mapped = mapTrainedTeacherDetailToProgram(dto)
    expect(mapped.generalProgramEducationStructure).toBe('curriculum')
  })

  it('falls back to serviceDetailJson when API field is absent', () => {
    const programWithSchedule: Program = {
      id: 'tmp',
      sponsorId: 's',
      title: 't',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      rounds: [],
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'pending',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      generalProgramEducationStructure: 'schedule',
    }
    const dto: ProgramResponse = {
      ...baseDto,
      serviceDetailJson: serializeTrainedTeacherServiceDetailJson(programWithSchedule),
    }
    const mapped = mapTrainedTeacherDetailToProgram(dto)
    expect(mapped.generalProgramEducationStructure).toBe('schedule')
  })

  it('maps detailedProgramName from API into generalCommonInfo', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      ...baseDto,
      detailedProgramName: '세부 프로그램',
    })
    expect(mapped.generalCommonInfo?.detailedProgramName).toBe('세부 프로그램')
  })
})

describe('mapTrainedTeacherToUpdateRequest educationStructure', () => {
  it('writes CURRICULUM when domain is curriculum', () => {
    const program = {
      id: '186002',
      sponsorId: 'sponsor-1',
      title: 'TT',
      type: 'offline' as const,
      format: 'workshop' as const,
      category: 'school' as const,
      description: '',
      rounds: [],
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'pending' as const,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      generalProgramEducationStructure: 'curriculum' as const,
    }
    const request = mapTrainedTeacherToUpdateRequest(program)
    expect(request.educationStructure).toBe('CURRICULUM')
  })
})
