import { describe, expect, it } from 'vitest'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import type { Program } from '@/types/domain'
import {
  mapApiEducationStructureToDomain,
  mapDomainEducationStructureToApi,
  mapTrainedTeacherDetailToProgram,
  mapTrainedTeacherListItemToProgram,
  mapTrainedTeacherToUpdateRequest,
} from './adapters'
import { serializeTrainedTeacherServiceDetailJson } from './service-detail-json'

describe('mapTrainedTeacherListItemToProgram periodStatus', () => {
  it('maps BE periodStatus to typed lifecycle for table/filter sync', () => {
    expect(mapTrainedTeacherListItemToProgram({ id: 186005, periodStatus: 'SCHEDULED' }).lifecycleStatus).toBe(
      'scheduled'
    )
    expect(mapTrainedTeacherListItemToProgram({ id: 186002, periodStatus: 'IN_PROGRESS' }).lifecycleStatus).toBe(
      'in_progress'
    )
    expect(mapTrainedTeacherListItemToProgram({ id: 186001, periodStatus: 'COMPLETED' }).lifecycleStatus).toBe(
      'completed'
    )
  })
})

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

describe('mapTrainedTeacherToUpdateRequest sponsors', () => {
  it('attaches sponsorContactId only to the contact owner sponsor', () => {
    const program = {
      id: '186005',
      sponsorId: '163302',
      title: 'TT',
      type: 'online' as const,
      format: 'workshop' as const,
      category: 'school' as const,
      description: '',
      rounds: [],
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'pending' as const,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      managerName: '테스트 마스터 관리자',
      generalCommonInfo: {
        sponsorManagementIds: ['163302', '1627251'],
        sponsorManagerContactIds: ['1627251::1627253'],
        sponsorManagerContactId: '1627251::1627253',
      },
    }
    const request = mapTrainedTeacherToUpdateRequest(program)
    expect(request.sponsorId).toBe('1627251')
    expect(request.sponsors).toEqual([
      { sponsorId: '163302' },
      { sponsorId: '1627251', sponsorContactId: '1627253' },
    ])
  })

  it('supports multiple sponsor contacts', () => {
    const program = {
      id: '186005',
      sponsorId: '163302',
      title: 'TT',
      type: 'online' as const,
      format: 'workshop' as const,
      category: 'school' as const,
      description: '',
      rounds: [],
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'pending' as const,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      generalCommonInfo: {
        sponsorManagementIds: ['163302', '1627251'],
        sponsorManagerContactIds: ['163302::111', '1627251::1627253'],
      },
    }
    const request = mapTrainedTeacherToUpdateRequest(program)
    expect(request.sponsors).toEqual([
      { sponsorId: '163302', sponsorContactId: '111' },
      { sponsorId: '1627251', sponsorContactId: '1627253' },
    ])
  })
})

describe('mapTrainedTeacherToUpdateRequest KPI / venue wire', () => {
  it('sends top-level finalSchools / finalClasses / venueKind for BE generalCommonInfo mirror', () => {
    const program = {
      id: '186005',
      sponsorId: '163302',
      title: 'TT',
      type: 'online' as const,
      format: 'workshop' as const,
      category: 'school' as const,
      description: '',
      rounds: [],
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'pending' as const,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      totalParticipants: 120,
      participatingSchoolCount: 8,
      generalCommonInfo: {
        venueKind: 'other' as const,
        venueDetail: '별관 301호',
        kpi: {
          finalParticipants: 120,
          instructorCount: 0,
          volunteerCount: 0,
          finalSchools: 8,
          finalClasses: 15,
        },
      },
    }
    const request = mapTrainedTeacherToUpdateRequest(program)
    expect(request.totalParticipants).toBe(120)
    expect(request.finalSchools).toBe(8)
    expect(request.finalClasses).toBe(15)
    expect(request.venueKind).toBe('other')
    expect(request.venueDetail).toBe('별관 301호')
    expect(request.venue).toBe('별관 301호')
  })
})

describe('mapTrainedTeacherDetailToProgram KPI root echo', () => {
  it('prefers top-level finalSchools / finalClasses over nested kpi', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '186005',
      title: 'TT',
      sponsorId: 'sponsor-1',
      totalParticipants: 200,
      finalSchools: 12,
      finalClasses: 24,
      serviceDetailJson: JSON.stringify({
        generalCommonInfo: {
          kpi: {
            finalParticipants: 1,
            finalSchools: 1,
            finalClasses: 1,
            instructorCount: 0,
            volunteerCount: 0,
          },
        },
      }),
    })
    expect(mapped.totalParticipants).toBe(200)
    expect(mapped.participatingSchoolCount).toBe(12)
    expect(mapped.generalCommonInfo?.kpi?.finalParticipants).toBe(200)
    expect(mapped.generalCommonInfo?.kpi?.finalSchools).toBe(12)
    expect(mapped.generalCommonInfo?.kpi?.finalClasses).toBe(24)
  })
})
