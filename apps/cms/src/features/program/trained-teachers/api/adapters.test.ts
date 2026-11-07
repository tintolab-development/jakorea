import { describe, expect, it } from 'vitest'
import type { AdminProgramListItemDto } from '@/features/program/general/api/programs-api-client'
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
import {
  detailEditValuesToProgramPatch,
  programDetailTrainedTeachersCommonInfoEditSchema,
  programToDetailEditValues,
} from '@/features/program/shared/model/program-detail-edit-schema'

describe('mapTrainedTeacherListItemToProgram periodStatus', () => {
  it('maps BE periodStatus to typed lifecycle for table/filter sync', () => {
    expect(
      mapTrainedTeacherListItemToProgram({ id: 186005, periodStatus: 'SCHEDULED' }).lifecycleStatus
    ).toBe('scheduled')
    expect(
      mapTrainedTeacherListItemToProgram({ id: 186002, periodStatus: 'IN_PROGRESS' })
        .lifecycleStatus
    ).toBe('in_progress')
    expect(
      mapTrainedTeacherListItemToProgram({ id: 186001, periodStatus: 'COMPLETED' }).lifecycleStatus
    ).toBe('completed')
  })

  it('maps createdByName and updatedByName from list and detail JSON', () => {
    const listed = mapTrainedTeacherListItemToProgram({
      id: 186034,
      createdByName: '곽도규',
      updatedByName: '김도영',
    } as AdminProgramListItemDto)
    const detail = mapTrainedTeacherDetailToProgram({
      id: '186034',
      title: '교육받은 교사',
      createdByName: '곽도규',
      updatedByName: '김도영',
    } as ProgramResponse)

    expect(listed.createdByName).toBe('곽도규')
    expect(listed.updatedByName).toBe('김도영')
    expect(detail.createdByName).toBe('곽도규')
    expect(detail.updatedByName).toBe('김도영')
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
    expect(mapped.generalCommonInfo?.detailedProgramName).toBeUndefined()
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
    expect(mapped.participantApprovedCount).toBe(10)
    expect(mapped.participantCapacity).toBe(30)
    expect(mapped.participatingSchoolCount).toBe(12)
    expect(mapped.participatingStudentCount).toBe(240)
  })

  it('maps a multi-value targetLevels list ahead of the first targetLevel', () => {
    const mapped = mapTrainedTeacherListItemToProgram({
      id: 186010,
      title: '우리 동네 소비와 저축',
      targetLevel: 'university',
      targetLevels: ['university', 'middle', 'high'],
    })
    expect(mapped.targetLevel).toBe('university')
    expect(mapped.targetLevels).toEqual(['university', 'middle', 'high'])
  })

  it('sends the full targetLevels array on update, with targetLevel as the first code', () => {
    const request = mapTrainedTeacherToUpdateRequest({
      id: '186010',
      sponsorId: 'sponsor-1',
      title: '우리 동네 소비와 저축',
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
      targetLevel: 'university',
      targetLevels: ['university', 'middle', 'high'],
    } as Program)
    expect(request.targetLevels).toEqual(['university', 'middle', 'high'])
    expect(request.targetLevel).toBe('university')
  })

  it('공통정보 패치는 컬럼 targetLevels를 유지하고 모집 라벨로 키우지 않는다', () => {
    const request = mapTrainedTeacherToUpdateRequest(
      {
        id: '186010',
        sponsorId: 'sponsor-1',
        title: '우리 동네 소비와 저축',
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
        targetLevel: 'elementary',
        targetLevels: ['elementary'],
        generalCommonInfo: {
          announcementTitle: '기존 공고',
          participantRecruitmentInfo: {
            educationTarget: '초등학교, 중학교, 대학(원)생',
          },
        },
      } as Program,
      { generalCommonInfo: { announcementTitle: '수정된 공고' } }
    )
    expect(request.targetLevels).toEqual(['elementary'])
    expect(request.targetLevel).toBe('elementary')
  })

  it('does not use organizationApplicationCount as participatingSchoolCount', () => {
    const mapped = mapTrainedTeacherListItemToProgram({
      id: 186006,
      organizationApplicationCount: 7,
    })
    expect(mapped.participatingSchoolCount).toBeUndefined()
  })

  it('목록은 관리명(title)을 유지하고 대표명(mainTitle)·titleEn을 그대로 둔다', () => {
    const mapped = mapTrainedTeacherListItemToProgram({
      id: 186005,
      title: '생성 당시명',
      mainTitle: '수정1',
      titleEn: 'Revised',
    })
    expect(mapped.title).toBe('생성 당시명')
    expect(mapped.mainTitle).toBe('수정1')
    expect(mapped.titleEn).toBe('Revised')
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

  it('상세 사업 기간은 businessStartDate/EndDate를 쓴다', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      ...baseDto,
      startDate: '2026-10-21',
      endDate: '2026-11-01',
      businessStartDate: '2026-10-14',
      businessEndDate: '2026-11-07',
    })
    expect(mapped.startDate).toBe('2026-10-14')
    expect(mapped.endDate).toBe('2026-11-07')
    expect(mapped.backendProgramType).toBe('TRAINED_TEACHER')
  })

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

  it('does not invent educationStructure from serviceDetailJson when the column is absent', () => {
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
    expect(mapped.generalProgramEducationStructure).toBeUndefined()
  })

  it('maps detailedProgramName from API into generalCommonInfo', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      ...baseDto,
      detailedProgramName: '세부 프로그램',
    })
    expect(mapped.generalCommonInfo?.detailedProgramName).toBe('세부 프로그램')
  })

  it('공고용명은 GET title을 우선하고 nested announcementTitle은 fallback이다', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      ...baseDto,
      title: '교육받은교사(수정2)',
      // mainTitle과 같으면 representative alias로 스킵되어 nested echo가 이긴다
      mainTitle: '교육받은교사(수정)',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          generalCommonInfo: {
            announcementTitle: '구 공고 echo',
          },
        },
      }),
    })
    expect(mapped.title).toBe('교육받은교사(수정2)')
    expect(mapped.generalCommonInfo?.announcementTitle).toBe('교육받은교사(수정2)')
  })

  it('세부 프로그램명에 textbookName(교재명)을 쓰지 않는다', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      ...baseDto,
      textbookName: '필요와 욕구, 현명한 소비, 저축 목표 세우기, 직업 세계 탐색',
      detailedProgramName: '실제 선택한 세부 프로그램명',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          generalCommonInfo: {
            detailedProgramName: 'UJAT 사전교육',
          },
        },
      }),
    })
    expect(mapped.textbookName).toBe('필요와 욕구, 현명한 소비, 저축 목표 세우기, 직업 세계 탐색')
    expect(mapped.generalCommonInfo?.detailedProgramName).toBe('실제 선택한 세부 프로그램명')
  })

  it('공고용명·세부명은 최신 top-level 컬럼을 stale JSON보다 우선한다', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      ...baseDto,
      title: '교육받은교사(수정2)',
      mainTitle: '교육받은교사(수정)',
      textbookName: '사회공헌 프로젝트',
      venue: '별관 301호',
      venueDetail: '상세 문장 A동',
      venueKind: 'other',
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
    expect(mapped.generalCommonInfo?.detailedProgramName).toBeUndefined()
    expect(mapped.textbookName).toBe('사회공헌 프로젝트')
    expect(mapped.venue).toBe('별관 301호')
    expect(mapped.generalCommonInfo?.venueKind).toBe('other')
    expect(mapped.generalCommonInfo?.venueDetail).toBe('상세 문장 A동')
    expect(mapped.institutionType).toBe('inside_school')
  })
})

describe('mapTrainedTeacherToUpdateRequest educationStructure', () => {
  it('PATCH rounds keep GET program_schedule id', () => {
    const request = mapTrainedTeacherToUpdateRequest({
      id: '186551',
      sponsorId: 'sponsor-1',
      title: 'TT',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      rounds: [
        {
          id: '187700',
          programId: '186551',
          roundNumber: 1,
          startDate: '2026-03-01T00:00:00.000Z',
          endDate: '2026-03-01T01:00:00.000Z',
          status: 'active',
        },
      ],
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'pending',
      createdAt: '2026-01-01',
      updatedAt: '2026-10-31T12:10:00.059740Z',
    } as Program)
    expect(request.rounds?.[0]?.id).toBe('187700')
    expect(request.expectedUpdatedAt).toBe('2026-10-31T12:10:00.059740Z')
  })

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

  it('marks manager as 미선택 when sponsors have no contact ids', () => {
    const program = {
      id: '186034',
      title: 'TT',
      sponsorId: '163302',
      managerName: '구담당',
      generalCommonInfo: {
        sponsorManagerContactIds: ['163302::111'],
        sponsorManagerLine: '구담당',
      },
    } as Program
    const merged = mergeTrainedTeacherSponsorAssignments(program, [
      { sponsorId: '163302', sponsorContactId: null },
    ])
    expect(merged.generalCommonInfo?.sponsorManagementIds).toEqual(['163302'])
    expect(merged.generalCommonInfo?.sponsorManagerContactIds).toEqual([
      '__sponsor_contact_unselected__',
    ])
    expect(merged.managerName).toBe('미선택')
    expect(merged.generalCommonInfo?.sponsorManagerLine).toBe('미선택')
  })

  it('clears sponsor fields when assignments are empty', () => {
    const program = {
      id: '186034',
      title: 'TT',
      sponsorId: '163302',
      managerName: '김담당',
      generalCommonInfo: {
        sponsorManagementIds: ['163302'],
        sponsorManagerContactIds: ['163302::111'],
      },
    } as Program
    const merged = mergeTrainedTeacherSponsorAssignments(program, [])
    expect(merged.sponsorId).toBeUndefined()
    expect(merged.managerName).toBeUndefined()
    expect(merged.generalCommonInfo?.sponsorManagementIds).toEqual([])
    expect(merged.generalCommonInfo?.sponsorManagerContactIds).toEqual([])
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

  it('omits contact ids when manager is 미선택', () => {
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
      managerName: '미선택',
      generalCommonInfo: {
        sponsorManagementIds: ['163302', '1627251'],
        sponsorManagerContactIds: ['__sponsor_contact_unselected__'],
        sponsorManagerContactId: '__sponsor_contact_unselected__',
        sponsorManagerLine: '미선택',
      },
    }
    const request = mapTrainedTeacherToUpdateRequest(program)
    expect(request.sponsors).toEqual([{ sponsorId: '163302' }, { sponsorId: '1627251' }])
  })
})

describe('mapTrainedTeacherToUpdateRequest KPI / venue wire', () => {
  it('sends top-level venue / venueKind / venueDetail separately', () => {
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
      venue: '본관',
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
    expect(request.venue).toBe('본관')
    expect(request.venueDetail).toBe('별관 301호')
    expect(request.venueKind).toBe('other')
    expect(request.serviceDetailJson).toContain('"finalSchools":8')
    expect(request.serviceDetailJson).toContain('"venueKind":"other"')
    expect(request.serviceDetailJson).toContain('"venueDetail":"별관 301호"')
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
    expect(detail.program?.generalCommonInfo).not.toHaveProperty('detailedProgramName')
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
    expect(request.serviceDetailJson).not.toContain('신 차시')
    expect(request.serviceDetailJson).not.toContain('구 차시')
    expect(request.serviceDetailJson).not.toContain('curriculumSessions')
  })

  it('부분 generalCommonInfo가 이전 공고·모집 정보를 지우지 않는다', () => {
    const program = {
      id: '186009',
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
        announcementTitle: '기존 공고',
        participantRecruitmentInfo: {
          announcementPublished: true,
          inquiryTel: '02-000-0000',
        },
        curriculumSessions: [{ sessionLabel: '1차시', title: '구 차시', description: '' }],
      },
    } as Program
    const request = mapTrainedTeacherToUpdateRequest(program, {
      generalCommonInfo: {
        curriculumSessions: [{ sessionLabel: '1차시', title: '신 차시', description: '새 내용' }],
      },
    })
    const detail = JSON.parse(String(request.serviceDetailJson)) as {
      program?: { generalCommonInfo?: Record<string, unknown> }
    }
    const common = detail.program?.generalCommonInfo
    expect(common?.announcementTitle).toBe('기존 공고')
    expect(common?.participantRecruitmentInfo).toBeUndefined()
    expect(common).not.toHaveProperty('curriculumSessions')
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
        announcementTitle: '교육받은교사(수정4)',
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
    expect(common).not.toHaveProperty('scheduleDetails')
    expect(common).not.toHaveProperty('educationJournalEnabled')
    expect(common).not.toHaveProperty('teacherTrainingEnabled')
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

  it('sends detailedProgramId and does not copy the selected name onto textbookName', () => {
    const program = {
      ...baseProgram,
      detailedProgramId: '163006',
      generalCommonInfo: { detailedProgramName: '실제 선택한 세부 프로그램명' },
    }
    const request = mapTrainedTeacherToUpdateRequest(program)
    expect(request.detailedProgramId).toBe(163006)
    expect(request.textbookName).toBeUndefined()
    expect(request.mainTitle).toBeUndefined()
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

describe('mapTrainedTeacherDetailToProgram GET 표시 정본', () => {
  it('serviceDetailJson 참여자 유형을 하드코딩하지 않고 type으로 교육 형태를 유지한다', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '186340',
      programType: 'TRAINED_TEACHER',
      type: 'offline',
      ips: 'Succeed',
      educationProcess: 'digital_computer',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          generalParticipantTypes: ['school_institution'],
          generalCommonInfo: {
            ipsScheduleDetail: 'perSchedule',
            curriculumSessions: [
              { sessionLabel: '1차시', ipsTypeSummary: 'Prepare | 해당없음' },
              { sessionLabel: '2차시', ipsTypeSummary: 'Succeed | Award (시상)' },
            ],
          },
        },
      }),
    })
    expect(mapped.type).toBe('offline')
    expect(mapped.ips).toBe('Succeed')
    expect(mapped.educationProcess).toBe('digital_computer')
    expect(mapped.generalParticipantTypes).toEqual(['school_institution'])
    expect(mapped.generalCommonInfo?.curriculumSessions).toEqual([
      { sessionLabel: '1차시', ipsTypeSummary: 'Prepare | 해당없음' },
      { sessionLabel: '2차시', ipsTypeSummary: 'Succeed | Award (시상)' },
    ])
  })

  it('참여자 유형이 없으면 학교/기관·교사/강사를 채우지 않는다', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '186340',
      programType: 'TRAINED_TEACHER',
      type: 'offline',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: { generalCommonInfo: {} },
      }),
    })
    expect(mapped.generalParticipantTypes).toBeUndefined()
  })
})

describe('mapTrainedTeacherDetailToProgram typed vs nested snapshot', () => {
  it('top-level mainTitle/ips/district가 stale nested snapshot을 덮는다', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '900001',
      programType: 'TRAINED_TEACHER',
      title: '커리큘럼 테스트 공고',
      mainTitle: '커리큘럼 대표명',
      titleEn: 'Curriculum Representative',
      ips: 'Prepare',
      district: '고등학교 1~2학년',
      programCategory: '경제',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          title: '구 공고',
          mainTitle: '구 대표명',
          ips: 'Inspire',
          district: '구 대상',
          programCategory: '구 카테고리',
          generalCommonInfo: {
            curriculumSessions: [{ sessionNo: 1, ipsTypeSummary: 'Inspire' }],
          },
        },
      }),
    })
    expect(mapped.title).toBe('커리큘럼 테스트 공고')
    expect(mapped.mainTitle).toBe('커리큘럼 대표명')
    expect(mapped.titleEn).toBe('Curriculum Representative')
    expect(mapped.ips).toBe('Prepare')
    expect(mapped.district).toBe('고등학교 1~2학년')
    expect(mapped.programCategory).toBe('경제')
    expect(mapped.generalCommonInfo?.curriculumSessions?.[0]?.ipsTypeSummary).toBe('Inspire')
  })

  it('top-level ips가 생략되면 nested snapshot ips를 유지한다', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '900002',
      title: '공고',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          ips: 'Inspire',
          mainTitle: 'nested 대표',
          district: 'nested 대상',
        },
      }),
    })
    expect(mapped.ips).toBe('Inspire')
    expect(mapped.mainTitle).toBeUndefined()
    expect(mapped.district).toBe('nested 대상')
  })
})

describe('mapTrainedTeacherDetailToProgram KPI root echo', () => {
  it('does not invent kpi zeros when only totalParticipants is present', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '186546',
      title: 'TT',
      totalParticipants: 200,
    } as ProgramResponse)
    expect(mapped.totalParticipants).toBe(200)
    expect(mapped.generalCommonInfo?.kpi).toBeUndefined()
  })

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
    expect(mapped.participatingSchoolCount).toBeUndefined()
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
    expect(request.recruitments).toBeUndefined()
    expect(request.applicationStartDate).toBe(program.applicationStartDate)
    expect(request.applicationEndDate).toBe(program.applicationEndDate)
    expect(request.applicationTargetMode).toBe('ORGANIZATION')
    expect(request.autoApplyDefaultFormBindings).toBe(true)
    expect(request.businessStartDate).toBe(program.startDate)
    expect(request.businessEndDate).toBe(program.endDate)
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

describe('mapTrainedTeacher business period', () => {
  it('사업 기간은 연도를 넘어도 선택한 날짜를 그대로 보낸다', () => {
    const program: Program = {
      id: 'tmp',
      sponsorId: '1627251',
      title: 'TT create',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      startDate: '2025-03-31T15:00:00.000Z',
      endDate: '2027-08-23T14:59:59.999Z',
      status: 'pending',
      lifecycleStatus: 'recruiting_students',
      generalParticipantTypes: ['school_institution'],
      generalProgramAudience: 'organization',
      generalProgramEducationStructure: 'curriculum',
      rounds: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const created = mapTrainedTeacherToCreateRequest(program)
    const updated = mapTrainedTeacherToUpdateRequest(program, {
      startDate: '2025-04-01T15:00:00.000Z',
      endDate: '2027-08-23T14:59:59.999Z',
    })
    expect(created.startDate).toBe(program.startDate)
    expect(created.endDate).toBe(program.endDate)
    expect(created.businessStartDate).toBe(program.startDate)
    expect(created.businessEndDate).toBe(program.endDate)
    expect(updated.startDate).toBe('2025-04-01T15:00:00.000Z')
    expect(updated.businessStartDate).toBe('2025-04-01T15:00:00.000Z')
    expect(updated.endDate).toBe('2027-08-23T14:59:59.999Z')
    expect(updated.businessEndDate).toBe('2027-08-23T14:59:59.999Z')
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

  it('GET remarks가 null이면 nested 비고를 폼 정본으로 쓰지 않는다', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '186560',
      title: 'TT',
      remarks: null,
      oneLineIntroduction: '한줄소개',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: {
          remarks: '구 JSON 비고',
          generalCommonInfo: {
            participantRecruitmentInfo: { remarks: '구 nested 비고' },
          },
        },
      }),
    } as ProgramResponse)
    expect(mapped.remarks).toBeUndefined()
    expect(mapped.oneLineIntroduction).toBe('한줄소개')
    expect(mapped.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBeUndefined()
    expect(programToDetailEditValues(mapped).remarks).toBe('')
  })
})

describe('mapTrainedTeacherDetailToProgram schedules', () => {
  it('keeps only ACTIVE schedules and sorts them by startAt', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '186264',
      title: '교육받은 교사',
      schedules: [
        {
          id: 4,
          sessionNo: 4,
          startAt: '2026-11-20T13:00:00+09:00',
          scheduleStatus: 'ACTIVE',
        },
        {
          id: 2,
          sessionNo: 2,
          startAt: '2026-11-07T13:00:00+09:00',
          scheduleStatus: 'CANCELLED',
        },
        {
          id: 1,
          sessionNo: 1,
          startAt: '2026-11-07T09:00:00+09:00',
          scheduleStatus: 'ACTIVE',
        },
      ],
    } as ProgramResponse)

    expect(mapped.schedules?.map(schedule => schedule.id)).toEqual([1, 4])
    expect(mapped.schedules?.every(schedule => schedule.scheduleStatus === 'ACTIVE')).toBe(true)
  })
})

describe('mapTrainedTeacherDetailToProgram recruitment windows', () => {
  it('maps recruitment startAt/endAt and operation dates without startDate aliases', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '186264',
      title: '교육받은 교사',
      recruitments: [
        {
          id: 801,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          startAt: '2026-10-15T00:00:00+09:00',
          endAt: '2026-11-19T23:59:59+09:00',
          operationStartDate: '2026-11-07',
          operationEndDate: '2026-11-28',
        },
      ],
    } as ProgramResponse)

    expect(mapped.programRecruitments?.[0]).toMatchObject({
      startAt: '2026-10-15T00:00:00+09:00',
      endAt: '2026-11-19T23:59:59+09:00',
      operationStartDate: '2026-11-07',
      operationEndDate: '2026-11-28',
    })
    expect(mapped.programRecruitments?.[0]).not.toHaveProperty('startDate')
    expect(mapped.programRecruitments?.[0]).not.toHaveProperty('endDate')
  })
})

describe('trained teacher businessArea', () => {
  it('normalizes the businessArea column and does not read stale JSON when the column is empty', () => {
    const fromColumn = mapTrainedTeacherDetailToProgram({
      id: '186005',
      title: 'TT',
      sponsorId: 'sponsor-1',
      businessArea: 'economy_finance',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: { businessArea: '진로취업' },
      }),
    })
    expect(fromColumn.businessArea).toBe('경제금융')

    const fromJson = mapTrainedTeacherDetailToProgram({
      id: '186005',
      title: 'TT',
      sponsorId: 'sponsor-1',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: { businessArea: '디지털 리터러시' },
      }),
    })
    expect(fromJson.businessArea).toBeUndefined()
  })

  it('does not read businessField alias when businessArea column is empty', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      id: '186005',
      title: 'TT',
      sponsorId: 'sponsor-1',
      businessField: '진로취업',
    } as Parameters<typeof mapTrainedTeacherDetailToProgram>[0])
    expect(mapped.businessArea).toBeUndefined()
  })

  it('sends the master name on the column and in serviceDetailJson, not inside generalCommonInfo', () => {
    const program = {
      id: '186005',
      sponsorId: 'sponsor-1',
      title: 'TT',
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
      businessArea: 'career_employment',
      generalCommonInfo: { businessArea: '경제금융', detailedProgramName: '세부' },
    } as Program
    const request = mapTrainedTeacherToUpdateRequest(program)
    expect(request.businessArea).toBe('진로취업')
    expect(request).not.toHaveProperty('businessField')
    const envelope = JSON.parse(String(request.serviceDetailJson)) as {
      program?: { businessArea?: string; generalCommonInfo?: Record<string, unknown> }
    }
    expect(envelope.program?.businessArea).toBe('진로취업')
    expect(envelope.program?.generalCommonInfo).not.toHaveProperty('businessArea')
  })

  it('clears businessArea with clearFields instead of empty string', () => {
    const existing = {
      id: '186005',
      sponsorId: 'sponsor-1',
      title: 'TT',
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
      businessArea: '진로취업',
    } as Program
    const request = mapTrainedTeacherToUpdateRequest(existing, { businessArea: '' })
    expect(request.businessArea).toBeUndefined()
    expect(request.clearFields).toEqual(expect.arrayContaining(['businessArea']))
    const envelope = JSON.parse(String(request.serviceDetailJson)) as {
      program?: { businessArea?: string; generalCommonInfo?: Record<string, unknown> | null }
    }
    expect(envelope.program?.businessArea).toBeUndefined()
    expect(envelope.program?.generalCommonInfo?.businessArea).toBeUndefined()
  })
})

describe('courseDeliveredBy GET enum 정규화 (186334)', () => {
  const getDto186334: ProgramResponse = {
    id: '186334',
    title: '교육받은 교사',
    sponsorId: 'sponsor-1',
    educationStructure: 'SCHEDULE',
    courseDeliveredBy: 'ja',
    ipOwned: 'ja',
    educationProcess: 'digital_computer',
    partnerInvolvement: false,
  }

  it('서버 ja 를 도메인 JA 로 올리고 저장 검증을 통과한다', () => {
    const mapped = mapTrainedTeacherDetailToProgram(getDto186334)
    expect(mapped.courseDeliveredBy).toBe('JA')
    expect(mapped.ipOwned).toBe('JA')

    const values = programToDetailEditValues(mapped)
    expect(values.courseDeliveredBy).toBe('JA')
    expect(values.ipOwned).toBe('JA')
    expect(values.courseDeliveredBy).toBe(mapped.courseDeliveredBy)

    const parsed = programDetailTrainedTeachersCommonInfoEditSchema.safeParse({
      ...values,
      mainTitle: '대표 프로그램명',
      titleEn: 'Program Title',
      announcementTitle: '공고용 프로그램명',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      businessArea: '경제금융',
      educationProcess: mapped.educationProcess ?? 'digital_computer',
    })
    expect(parsed.success).toBe(true)

    const patch = detailEditValuesToProgramPatch(values, mapped)
    expect(patch.courseDeliveredBy).toBe('JA')
    expect(patch.ipOwned).toBe('JA')

    const request = mapTrainedTeacherToUpdateRequest(mapped, patch)
    expect(request.courseDeliveredBy).toBe('JA')
    expect(request.ipOwned).toBe('JA')

    const reloaded = mapTrainedTeacherDetailToProgram({
      ...getDto186334,
      courseDeliveredBy: 'ja',
      ipOwned: 'ja',
    })
    expect(programToDetailEditValues(reloaded).courseDeliveredBy).toBe('JA')
  })

  it('미지원 ENUM 을 JA 로 치환하지 않는다', () => {
    const mapped = mapTrainedTeacherDetailToProgram({
      ...getDto186334,
      courseDeliveredBy: 'TEACHER',
    })
    expect(mapped.courseDeliveredBy).toBeUndefined()
    expect(programToDetailEditValues(mapped).courseDeliveredBy).toBeUndefined()
  })
})

describe('mapTrainedTeacherToUpdateRequest', () => {
  it('does not send featuredOnHome or homeDisplayOrder', () => {
    const program = {
      id: '186009',
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
    } as Program
    const request = mapTrainedTeacherToUpdateRequest(program, { title: '모집만 저장' })
    const requestRecord = request as unknown as Record<string, unknown>
    expect(requestRecord.featuredOnHome).toBeUndefined()
    expect(requestRecord.homeDisplayOrder).toBeUndefined()
  })
})
