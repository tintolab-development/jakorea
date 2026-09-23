import { describe, expect, it } from 'vitest'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import type { Program } from '@/types/domain'
import {
  mapApiEducationStructureToDomain,
  mapDomainEducationStructureToApi,
  mapTrainedTeacherDetailToProgram,
  mapTrainedTeacherListItemToProgram,
  mapTrainedTeacherToCreateRequest,
  mapTrainedTeacherToUpdateRequest,
  mergeTrainedTeacherSponsorAssignments,
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

  it('echoes detail textbookName / managerName / venue from list GET', () => {
    const mapped = mapTrainedTeacherListItemToProgram({
      id: 186034,
      title: '교육받은교사(수정)',
      textbookName: '사회공헌 프로젝트',
      managerName: '문디지털',
      venue: '교육받은교사(수정)',
      contactEmail: 'tt@example.com',
      contactPhone: '010-1630-0003',
      educationProcess: 'Digital (Computer)',
      institutionType: 'inside_school',
    } as Parameters<typeof mapTrainedTeacherListItemToProgram>[0])
    expect(mapped.textbookName).toBe('사회공헌 프로젝트')
    expect(mapped.managerName).toBe('문디지털')
    expect(mapped.venue).toBe('교육받은교사(수정)')
    expect(mapped.contactEmail).toBe('tt@example.com')
    expect(mapped.contactPhone).toBe('010-1630-0003')
    expect(mapped.educationProcess).toBe('Digital (Computer)')
    expect(mapped.institutionType).toBe('inside_school')
    expect(mapped.generalCommonInfo?.detailedProgramName).toBe('사회공헌 프로젝트')
    expect(mapped.rounds).toEqual([])
  })

  it('maps list widget fields: targetLevel, capacity, school/student counts', () => {
    const mapped = mapTrainedTeacherListItemToProgram({
      id: 186005,
      title: 'TT list',
      targetLevel: 'elementary',
      targetLevels: ['elementary'],
      participantApprovedCount: 10,
      participantCapacity: 30,
      participatingSchoolCount: 12,
      participatingStudentCount: 240,
      organizationApplicationCount: 99,
    })
    expect(mapped.targetLevel).toBe('elementary')
    expect(mapped.targetLevels).toEqual(['elementary'])
    expect(mapped.approvedStudentCount).toBe(10)
    expect(mapped.participantCapacity).toBe(30)
    expect(mapped.participatingSchoolCount).toBe(12)
    expect(mapped.participatingStudentCount).toBe(240)
  })

  it('does not use organizationApplicationCount as participatingSchoolCount', () => {
    const mapped = mapTrainedTeacherListItemToProgram({
      id: 186006,
      organizationApplicationCount: 7,
    })
    expect(mapped.participatingSchoolCount).toBeUndefined()
  })

  it('uses participatingOrganizationCount as school count alias', () => {
    const mapped = mapTrainedTeacherListItemToProgram({
      id: 186007,
      participatingOrganizationCount: 12,
    })
    expect(mapped.participatingSchoolCount).toBe(12)
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

  it('prefers GET title over stale nested announcementTitle', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      ...baseDto,
      title: '교육받은교사(수정2)',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          generalCommonInfo: {
            announcementTitle: '교육받은교사(수정)',
          },
        },
      }),
    })
    expect(mapped.title).toBe('교육받은교사(수정2)')
    expect(mapped.generalCommonInfo?.announcementTitle).toBe('교육받은교사(수정2)')
  })

  it('prefers textbookName over stale nested detailedProgramName', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      ...baseDto,
      textbookName: '사회공헌 프로젝트',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          generalCommonInfo: {
            detailedProgramName: 'UJAT 사전교육',
          },
        },
      }),
    })
    expect(mapped.generalCommonInfo?.detailedProgramName).toBe('사회공헌 프로젝트')
  })

  it('display fields follow top-level columns when JSON has dual copies', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      ...baseDto,
      title: '교육받은교사(수정2)',
      mainTitle: '교육받은교사(수정)',
      textbookName: '사회공헌 프로젝트',
      venue: '별관 301호',
      institutionType: 'inside_school',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {
          announcementTitle: '구 공고',
          detailedProgramName: 'UJAT 사전교육',
          venueKind: 'other',
          venueDetail: '옛 장소',
        },
        program: {
          generalCommonInfo: {
            announcementTitle: '교육받은교사(수정)',
            detailedProgramName: 'UJAT 사전교육',
            venueKind: 'other',
            venueDetail: '옛 장소',
          },
        },
      }),
    })
    expect(mapped.generalCommonInfo?.announcementTitle).toBe('교육받은교사(수정2)')
    expect(mapped.generalCommonInfo?.detailedProgramName).toBe('사회공헌 프로젝트')
    expect(mapped.generalCommonInfo?.venueKind).toBe('other')
    expect(mapped.generalCommonInfo?.venueDetail).toBe('별관 301호')
    expect(mapped.institutionType).toBeUndefined()
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
    expect(request.detailedProgramId).toBeUndefined()
  })

  it('sends a numeric detailed program id for curriculum and omits schedule and synthetic ids', () => {
    const base = {
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
    }
    expect(
      mapTrainedTeacherToUpdateRequest({
        ...base,
        generalProgramEducationStructure: 'curriculum',
        detailedProgramId: '163006',
      }).detailedProgramId
    ).toBe(163006)
    expect(
      mapTrainedTeacherToUpdateRequest({
        ...base,
        generalProgramEducationStructure: 'curriculum',
        detailedProgramId: '__economy_1c1s_main__',
      }).detailedProgramId
    ).toBeUndefined()
    expect(
      mapTrainedTeacherToUpdateRequest({
        ...base,
        generalProgramEducationStructure: 'schedule',
        detailedProgramId: '163006',
      }).detailedProgramId
    ).toBeUndefined()
  })
})

describe('mergeTrainedTeacherSponsorAssignments', () => {
  it('keeps every sponsor row, including two contacts on one sponsor', () => {
    const program = {
      id: '186034',
      title: 'TT',
      sponsorId: '1',
    } as Program
    const merged = mergeTrainedTeacherSponsorAssignments(program, [
      { sponsorId: '163302', sponsorContactId: '111', sponsorContactName: '김담당' },
      { sponsorId: '163302', sponsorContactId: '222', sponsorContactName: '이담당' },
      { sponsorId: '1627251', sponsorContactId: '1627253', sponsorContactName: '박담당' },
    ])
    expect(merged.generalCommonInfo?.sponsorManagementIds).toEqual(['163302', '1627251'])
    expect(merged.generalCommonInfo?.sponsorManagerContactIds).toEqual([
      '163302::111',
      '163302::222',
      '1627251::1627253',
    ])
    expect(merged.generalCommonInfo?.sponsorManagerContactNames).toEqual({
      '163302::111': '김담당',
      '163302::222': '이담당',
      '1627251::1627253': '박담당',
    })
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

  it('keeps every contact when one sponsor has multiple managers', () => {
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
        sponsorManagementIds: ['163302'],
        sponsorManagerContactIds: ['163302::111', '163302::222'],
      },
    }
    const request = mapTrainedTeacherToUpdateRequest(program)
    expect(request.sponsors).toEqual([
      { sponsorId: '163302', sponsorContactId: '111' },
      { sponsorId: '163302', sponsorContactId: '222' },
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
    expect(request.venue).toBe('별관 301호')
    expect(request.serviceDetailJson).toContain('"finalSchools":8')
    expect(request.serviceDetailJson).toContain('"venueKind":"other"')
  })

  it('writes a single program envelope and drops stale nested textbook/sponsor mirrors', () => {
    const program = {
      id: '186034',
      sponsorId: '163302',
      title: '교육받은교사(수정)',
      textbookName: '사회공헌 프로젝트',
      educationProcess: 'Digital',
      partnerInvolvement: true,
      ipOwned: 'Partner',
      courseDeliveredBy: 'Jointly' as const,
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
      generalCommonInfo: {
        detailedProgramName: '사회공헌 프로젝트',
        sponsorManagementIds: ['163302'],
        sponsorManagementId: '1627251',
        textbookName: 'UJAT 사전교육',
        title: '구제목',
        educationProcess: 'Traditional (Paper)',
        partnerInvolvement: false,
      } as Program['generalCommonInfo'],
    }
    const request = mapTrainedTeacherToUpdateRequest(program)
    const detail = JSON.parse(String(request.serviceDetailJson)) as {
      program?: { generalCommonInfo?: Record<string, unknown> }
      generalCommonInfo?: unknown
    }
    expect(detail.generalCommonInfo).toBeUndefined()
    expect(detail.program?.generalCommonInfo?.sponsorManagementId).toBe('163302')
    expect(detail.program?.generalCommonInfo?.detailedProgramName).toBe('사회공헌 프로젝트')
    expect(detail.program?.generalCommonInfo).not.toHaveProperty('textbookName')
    expect(detail.program?.generalCommonInfo).not.toHaveProperty('title')
    expect(detail.program?.generalCommonInfo?.educationProcess).toBe('Digital')
    expect(detail.program?.generalCommonInfo?.partnerInvolvement).toBe(true)
    expect(detail.program?.generalCommonInfo?.ipOwned).toBe('Partner')
    expect(detail.program?.generalCommonInfo?.courseDeliveredBy).toBe('Jointly')
  })

  it('keeps Partner Involvement No in the trained-teacher snapshot', () => {
    const program = {
      id: '186034',
      sponsorId: '163302',
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
      partnerInvolvement: false,
      educationProcess: 'Hybrid',
      generalCommonInfo: {},
    }
    const request = mapTrainedTeacherToUpdateRequest(program)
    const detail = JSON.parse(String(request.serviceDetailJson)) as {
      program?: { generalCommonInfo?: Record<string, unknown> }
    }
    expect(detail.program?.generalCommonInfo?.partnerInvolvement).toBe(false)
    expect(detail.program?.generalCommonInfo?.educationProcess).toBe('Hybrid')
  })

  it('writes curriculumSessions from patch into serviceDetailJson', () => {
    const program = {
      id: '186034',
      sponsorId: '163302',
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
      generalCommonInfo: {
        curriculumSessions: [{ sessionLabel: '1차시', title: '구 차시', description: '' }],
      },
    } as Program
    const request = mapTrainedTeacherToUpdateRequest(program, {
      generalCommonInfo: {
        curriculumSessions: [{ sessionLabel: '1차시', title: '신 차시', description: '새 내용' }],
      },
    })
    expect(request.serviceDetailJson).toContain('"title":"신 차시"')
    expect(request.serviceDetailJson).not.toContain('구 차시')
  })

  it('keeps announcement and schedule time when nested common info was previously stripped', () => {
    const program = {
      id: '186034',
      sponsorId: '1627251',
      title: '교육받은교사(수정4)',
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
      generalCommonInfo: {
        educationJournalEnabled: false,
        teacherTrainingEnabled: false,
        scheduleDetails: [
          {
            scheduleLabel: '세부 일정 01',
            name: '교육받은교사(수정3)',
            progressTimeSummary: '15:43 ~ 16:43',
          },
        ],
      },
    } as Program
    const request = mapTrainedTeacherToUpdateRequest(program)
    const detail = JSON.parse(String(request.serviceDetailJson)) as {
      program?: { generalCommonInfo?: Record<string, unknown> }
    }
    const common = detail.program?.generalCommonInfo
    expect(common?.announcementTitle).toBe('교육받은교사(수정4)')
    expect(common?.scheduleDetails).toEqual([
      {
        scheduleLabel: '세부 일정 01',
        name: '교육받은교사(수정3)',
        progressTimeSummary: '15:43 ~ 16:43',
      },
    ])
  })
})

describe('mapTrainedTeacherToUpdateRequest detailedProgramId (일반 프로그램과 동일 계약, 버그 수정 확인)', () => {
  const baseProgram = {
    id: '186005',
    sponsorId: '163302',
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
  }

  it('sends detailedProgramId as a real numeric master id and omits it from textbookName', () => {
    const program = {
      ...baseProgram,
      detailedProgramId: '163006',
      generalCommonInfo: { detailedProgramName: '실제 선택한 세부 프로그램명' },
    }
    const request = mapTrainedTeacherToUpdateRequest(program)
    expect(request.detailedProgramId).toBe(163006)
    expect(request.textbookName).toBeUndefined()
    expect(request.teamDivision).toBeUndefined()

    const createRequest = mapTrainedTeacherToCreateRequest(program)
    expect(createRequest.detailedProgramId).toBe(163006)
    expect(createRequest.textbookName).toBeUndefined()
  })

  it('detailedProgramId가 없거나 sentinel(해당없음)이면 null(undefined)로 보낸다', () => {
    const program = {
      ...baseProgram,
      generalCommonInfo: { detailedProgramName: '해당없음' },
    }
    const request = mapTrainedTeacherToUpdateRequest(program)
    expect(request.detailedProgramId).toBeUndefined()
  })

  it('진짜 교재명(textbookName)은 detailedProgramName과 다르면 그대로 보존한다', () => {
    const program = {
      ...baseProgram,
      detailedProgramId: '163006',
      textbookName: '진짜 교재명',
      generalCommonInfo: { detailedProgramName: '실제 선택한 세부 프로그램명' },
    }
    const request = mapTrainedTeacherToUpdateRequest(program)
    expect(request.detailedProgramId).toBe(163006)
    expect(request.textbookName).toBe('진짜 교재명')
  })
})

describe('mapTrainedTeacherDetailToProgram detailedProgramId round-trip', () => {
  it('reads numeric detailedProgramId from API response into Program', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '186005',
      title: 'TT',
      sponsorId: 'sponsor-1',
      detailedProgramId: 163006,
      detailedProgramName: '실제 선택한 세부 프로그램명',
    })
    expect(mapped.detailedProgramId).toBe('163006')
    expect(mapped.generalCommonInfo?.detailedProgramName).toBe('실제 선택한 세부 프로그램명')
  })
})

describe('mapTrainedTeacherDetailToProgram KPI root echo', () => {
  it('prefers totalParticipants over nested kpi finalParticipants', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '186005',
      title: 'TT',
      sponsorId: 'sponsor-1',
      totalParticipants: 200,
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
    expect(mapped.participatingSchoolCount).toBe(1)
    expect(mapped.generalCommonInfo?.kpi?.finalParticipants).toBe(200)
    expect(mapped.generalCommonInfo?.kpi?.finalSchools).toBe(1)
    expect(mapped.generalCommonInfo?.kpi?.finalClasses).toBe(1)
  })
})

describe('mapTrainedTeacherToCreateRequest BE registration contract', () => {
  it('sets TRAINED_TEACHER, ORGANIZATION target, and autoApplyDefaultFormBindings', () => {
    const program: Program = {
      id: 'tmp',
      sponsorId: '1627251',
      title: 'TT create',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      applicationStartDate: '2026-01-01T00:00:00.000Z',
      applicationEndDate: '2026-02-01T00:00:00.000Z',
      status: 'pending',
      lifecycleStatus: 'recruiting_students',
      businessArea: '경제금융',
      targetLevel: 'elementary',
      approvedStudentCount: 0,
      instructors: 0,
      participatingSchoolCount: 0,
      participatingStudentCount: 0,
      generalParticipantTypes: ['school_institution'],
      generalProgramAudience: 'organization',
      generalProgramEducationStructure: 'curriculum',
      detailedProgramId: '163006',
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        teacherTrainingEnabled: false,
        educationJournalEnabled: false,
        participantRecruitmentInfo: {
          maxAssignableInstructors: 0,
          maxClassCount: 1,
        },
      },
      rounds: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }

    const request = mapTrainedTeacherToCreateRequest(program)
    expect(request.programType).toBe('TRAINED_TEACHER')
    expect(request.applicationTargetMode).toBe('ORGANIZATION')
    expect(request.autoApplyDefaultFormBindings).toBe(true)
    expect(request.educationStructure).toBe('CURRICULUM')
    expect(request.detailedProgramId).toBe(163006)

    const detail = JSON.parse(String(request.serviceDetailJson)) as {
      program?: {
        generalParticipantTypes?: string[]
        generalCommonInfo?: {
          teacherTrainingEnabled?: boolean
          educationJournalEnabled?: boolean
          sponsorManagementId?: string
          textbookName?: string
        }
      }
      generalCommonInfo?: unknown
    }
    expect(detail.program?.generalParticipantTypes).toEqual(['school_institution'])
    expect(detail.program?.generalCommonInfo?.teacherTrainingEnabled).toBe(false)
    expect(detail.program?.generalCommonInfo?.educationJournalEnabled).toBe(false)
    expect(detail.program?.generalCommonInfo?.sponsorManagementId).toBe('1627251')
    expect(detail.program?.generalCommonInfo).not.toHaveProperty('textbookName')
    expect(detail).not.toHaveProperty('generalCommonInfo')
  })
})

describe('serializeTrainedTeacherServiceDetailJson recruitment constraints', () => {
  it('forces maxAssignableInstructors 0 and hides pre-education on write', () => {
    const json = serializeTrainedTeacherServiceDetailJson({
      id: '186005',
      title: 'TT',
      sponsorId: 'sponsor-1',
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
      generalCommonInfo: {
        participantRecruitmentInfo: {
          maxAssignableInstructors: 4,
          preEducationNoticeRequired: true,
          maxClassCount: 6,
        },
      },
    } as Program)
    const parsed = JSON.parse(json) as {
      program?: {
        generalCommonInfo?: {
          participantRecruitmentInfo?: {
            maxAssignableInstructors?: number
            preEducationNoticeRequired?: boolean
            maxClassCount?: number
          }
        }
      }
    }
    expect(parsed.program?.generalCommonInfo?.participantRecruitmentInfo).toMatchObject({
      maxAssignableInstructors: 0,
      preEducationNoticeRequired: false,
      maxClassCount: 6,
    })
  })
})

describe('mapTrainedTeacherToUpdateRequest recruitment columns (BE 2026-09-23 handoff)', () => {
  it('sends top-level remarks / educationTargetDetail / studentListRequired with nested labels', () => {
    const program = {
      id: '186005',
      sponsorId: '163302',
      title: 'TT',
      type: 'offline' as const,
      format: 'workshop' as const,
      category: 'school' as const,
      description: '',
      rounds: [],
      startDate: '2026-09-01',
      endDate: '2026-11-30',
      applicationStartDate: '2026-08-01T00:00:00.000Z',
      applicationEndDate: '2026-08-31T00:00:00.000Z',
      status: 'pending' as const,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      remarks: '모집 비고 신값',
      educationTargetDetail: '초등학교 5~6학년',
      studentListRequired: 'not_required' as const,
      contactPhone: '02-1234-5678',
      contactEmail: 'new@jakorea.org',
      oneLineIntroduction: '한줄소개는 비고가 아님',
      district: '서울 강남구',
      generalCommonInfo: {
        participantRecruitmentInfo: {
          remarks: '모집 비고 신값',
          educationTargetDetail: '초등학교 5~6학년',
          studentListRequired: 'not_required',
          maxClassCount: 4,
          maxScheduleCount: 6,
          maxSessionsPerDay: 3,
          contactOrganizationName: '수정문의처',
          inquiryTel: '02-1234-5678',
          inquiryEmail: 'new@jakorea.org',
        },
      },
    } as Program

    const request = mapTrainedTeacherToUpdateRequest(program)
    expect(request.remarks).toBe('모집 비고 신값')
    expect(request.educationTargetDetail).toBe('초등학교 5~6학년')
    expect(request.studentListRequired).toBe('not_required')
    expect(request.contactPhone).toBe('02-1234-5678')
    expect(request.contactEmail).toBe('new@jakorea.org')
    expect(request.oneLineIntroduction).toBe('한줄소개는 비고가 아님')
    expect(request.district).toBe('서울 강남구')

    const envelope = JSON.parse(String(request.serviceDetailJson)) as {
      program?: {
        remarks?: string
        educationTargetDetail?: string
        studentListRequired?: string
        generalCommonInfo?: {
          participantRecruitmentInfo?: {
            remarks?: string
            educationTargetDetail?: string
            contactOrganizationName?: string
            maxAssignableInstructors?: number
          }
        }
      }
    }
    expect(envelope.program?.remarks).toBe('모집 비고 신값')
    expect(envelope.program?.educationTargetDetail).toBe('초등학교 5~6학년')
    expect(envelope.program?.studentListRequired).toBe('not_required')
    expect(envelope.program?.generalCommonInfo?.participantRecruitmentInfo).toMatchObject({
      remarks: '모집 비고 신값',
      educationTargetDetail: '초등학교 5~6학년',
      contactOrganizationName: '수정문의처',
      maxAssignableInstructors: 0,
    })
  })
})

describe('mapTrainedTeacherDetailToProgram recruitment columns (BE 2026-09-23 handoff)', () => {
  it('prefers GET columns over nested and does not mix remarks with oneLineIntroduction', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '186005',
      title: 'TT',
      remarks: '모집 비고 신값',
      educationTargetDetail: '초등학교 5~6학년',
      studentListRequired: 'not_required',
      contactPhone: '02-1234-5678',
      contactEmail: 'new@jakorea.org',
      oneLineIntroduction: '한줄소개',
      otherMatters: '기타사항',
      district: '서울 강남구',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          remarks: '구 비고',
          educationTargetDetail: '구 상세',
          studentListRequired: 'required',
          oneLineIntroduction: '구 한줄소개',
          otherNotes: '구 기타',
          generalCommonInfo: {
            participantRecruitmentInfo: {
              remarks: '구 nested 비고',
              educationTargetDetail: '구 nested 상세',
              studentListRequired: 'required',
              contactOrganizationName: '수정문의처',
            },
          },
        },
      }),
    } as ProgramResponse)

    expect(mapped.remarks).toBe('모집 비고 신값')
    expect(mapped.educationTargetDetail).toBe('초등학교 5~6학년')
    expect(mapped.studentListRequired).toBe('not_required')
    expect(mapped.oneLineIntroduction).toBe('한줄소개')
    expect(mapped.otherNotes).toBe('기타사항')
    expect(mapped.district).toBe('서울 강남구')
    expect(mapped.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBe('모집 비고 신값')
    expect(mapped.generalCommonInfo?.participantRecruitmentInfo?.educationTargetDetail).toBe(
      '초등학교 5~6학년'
    )
    expect(mapped.generalCommonInfo?.participantRecruitmentInfo?.contactOrganizationName).toBe(
      '수정문의처'
    )
  })
})
