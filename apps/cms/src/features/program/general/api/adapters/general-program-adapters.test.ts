import { describe, expect, it } from 'vitest'
import {
  filterGeneralProgramsByOverviewStatus,
  mapAdminProgramDetailToProgram,
  mapAdminProgramListItemToProgram,
  mapGeneralApiProgramTypeToAudience,
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import { resolveGeneralProgramListTitle } from '@/features/program/general/lib/detail-common-info-display'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'

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
  it('maps list targetLevel and recruitment counts from BE list fields', () => {
    const program = mapAdminProgramListItemToProgram({
      id: 186023,
      title: '기관 교사/봉사자 전체 포함',
      programType: 'GENERAL_ORGANIZATION',
      targetLevel: 'middle',
      participantApprovedCount: 10,
      participantRecruitmentCount: 120,
      instructorRecruitmentCount: 51,
      volunteerRecruitmentCount: 24,
      participatingOrganizationCount: 2,
      participatingStudentCount: 48,
    })

    expect(program.targetLevel).toBe('middle')
    expect(program.participantApprovedCount).toBe(10)
    expect(program.participantCapacity).toBe(120)
    expect(program.instructorCapacity).toBe(51)
    expect(program.generalCommonInfo?.kpi?.volunteerCount).toBe(24)
    expect(program.participatingSchoolCount).toBe(2)
    expect(program.participatingStudentCount).toBe(48)
  })

  it('참여자 모집 인원 분자는 applicantCount·봉사 수로 대체하지 않는다', () => {
    const program = mapAdminProgramListItemToProgram({
      id: 168001,
      title: '기관',
      applicantCount: 15,
      volunteerApprovedCount: 40,
      volunteerRecruitmentCount: 50,
      participatingStudentCount: 200,
    })
    expect(program.participantApprovedCount).toBeUndefined()
    expect(program.participantCapacity).toBeUndefined()
    expect(program.approvedStudentCount).toBe(15)
  })

  it('normalizes Korean targetLevel labels from list API', () => {
    expect(
      mapAdminProgramListItemToProgram({ id: 1, targetLevel: '중학생' }).targetLevel
    ).toBe('middle')
    expect(
      mapAdminProgramListItemToProgram({ id: 2, targetLevel: '대학생' }).targetLevel
    ).toBe('university')
  })

  it('maps API list item to Program domain', () => {
    const program = mapAdminProgramListItemToProgram({
      id: 5001,
      nameKo: 'JA 코리아 금융교육',
      lifecycleStatus: 'recruiting_students',
      periodStatus: 'RECRUITING',
      businessStartDate: '2026-03-01',
      businessEndDate: '2026-12-31',
    })

    expect(program.id).toBe('5001')
    expect(program.title).toBe('JA 코리아 금융교육')
    expect(program.lifecycleStatus).toBe('recruiting_students')
    expect(program.startDate).toBe('2026-03-01')
  })

  it('maps list programType GENERAL_INDIVIDUAL to individual category/audience', () => {
    const program = mapAdminProgramListItemToProgram({
      id: 5002,
      title: '개인 프로그램',
      programType: 'GENERAL_INDIVIDUAL',
    })
    expect(program.category).toBe('individual')
    expect(program.generalProgramAudience).toBe('individual')
  })

  it('maps list programType GENERAL_ORGANIZATION to school category/audience', () => {
    const program = mapAdminProgramListItemToProgram({
      id: 5003,
      title: '기관 프로그램',
      programType: 'GENERAL_ORGANIZATION',
    })
    expect(program.category).toBe('school')
    expect(program.generalProgramAudience).toBe('organization')
    expect(program.backendProgramType).toBe('GENERAL_ORGANIZATION')
  })

  it('prefers programType over category school for individual detail', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '168010',
      programType: 'GENERAL_INDIVIDUAL',
      category: 'school',
      title: '개인인데 category school',
    } as ProgramResponse)
    expect(program.category).toBe('individual')
    expect(program.generalProgramAudience).toBe('individual')
  })

  it('keeps serviceDetail audience when present on detail', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '168011',
      programType: 'GENERAL_ORGANIZATION',
      title: 'serviceDetail audience wins',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        generalProgramAudience: 'individual',
        generalParticipantTypes: ['individual'],
      }),
    } as ProgramResponse)
    expect(program.generalProgramAudience).toBe('individual')
    expect(program.category).toBe('individual')
  })

  it('상세 사업 운영 기간은 businessStartDate/EndDate를 쓴다', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '186022',
      startDate: '2026-10-21',
      endDate: '2026-11-01',
      businessStartDate: '2026-10-14',
      businessEndDate: '2026-11-07',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        registration: {
          overlay: {
            'generalRegistration.basicInfo.operationRangeSeal': {
              start: '2026-10-13T15:00:00.000Z',
              end: '2026-11-06T15:00:00.000Z',
            },
          },
        },
      }),
    } as ProgramResponse)

    expect(program.startDate).toBe('2026-10-14')
    expect(program.endDate).toBe('2026-11-07')
  })

  it('공고용명은 overlay를 쓰고 대표명 alias는 버린다', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '168012',
      title: '대표 프로그램명',
      mainTitle: '대표 프로그램명',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {
          announcementTitle: '대표 프로그램명',
        },
        registration: {
          overlay: {
            'generalRegistration.basicInfo.publicProgramTitle': '실제 공고용 프로그램명',
          },
        },
      }),
    } as ProgramResponse)
    expect(program.mainTitle).toBe('대표 프로그램명')
    expect(program.generalCommonInfo?.announcementTitle).toBe('실제 공고용 프로그램명')
  })

  it('mapGeneralApiProgramTypeToAudience covers GENERAL_* values', () => {
    expect(mapGeneralApiProgramTypeToAudience('GENERAL_INDIVIDUAL')).toEqual({
      audience: 'individual',
      category: 'individual',
    })
    expect(mapGeneralApiProgramTypeToAudience('GENERAL_ORGANIZATION')).toEqual({
      audience: 'organization',
      category: 'school',
    })
    expect(mapGeneralApiProgramTypeToAudience('GENERAL')).toBeNull()
  })

  it('maps RECRUITING periodStatus to scheduled UI bucket (예정 별칭, 모집 아님)', () => {
    const program = mapAdminProgramListItemToProgram({
      id: 1,
      periodStatus: 'RECRUITING',
    })
    expect(program.lifecycleStatus).toBe('recruiting_students')
  })

  it('prefers typed lifecycleStatus over periodStatus', () => {
    const program = mapAdminProgramListItemToProgram({
      id: 168001,
      title: 'Primary ACTIVE',
      lifecycleStatus: 'in_progress',
      periodStatus: 'RECRUITING',
      status: 'active',
    })
    expect(program.lifecycleStatus).toBe('in_progress')
    expect(program.status).toBe('active')
  })

  it('maps periodStatus to typed lifecycle when lifecycleStatus is absent', () => {
    expect(
      mapAdminProgramListItemToProgram({ id: 1, periodStatus: 'SCHEDULED' }).lifecycleStatus
    ).toBe('scheduled')
    expect(
      mapAdminProgramListItemToProgram({ id: 2, periodStatus: 'IN_PROGRESS' }).lifecycleStatus
    ).toBe('in_progress')
    expect(
      mapAdminProgramListItemToProgram({ id: 3, periodStatus: 'COMPLETED' }).lifecycleStatus
    ).toBe('completed')
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

  it('목록은 관리명(title)을 유지하고 프로그램명은 mainTitle(대표명)을 쓴다', () => {
    const program = mapAdminProgramListItemToProgram({
      id: 186020,
      title: '세부프로그램명 경제리터러시기초',
      mainTitle: '수정1',
      titleEn: '수정1',
    })

    expect(program.title).toBe('세부프로그램명 경제리터러시기초')
    expect(program.mainTitle).toBe('수정1')
    expect(program.titleEn).toBe('수정1')
    expect(resolveGeneralProgramListTitle(program)).toBe('수정1')
  })

  it('목록 mainTitle이 없으면 title로 폴백한다', () => {
    const program = mapAdminProgramListItemToProgram({
      id: 186021,
      title: '생성 당시명',
    })

    expect(program.title).toBe('생성 당시명')
    expect(program.mainTitle).toBe('생성 당시명')
    expect(resolveGeneralProgramListTitle(program)).toBe('생성 당시명')
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

  it('maps list targetLevels array ahead of singular targetLevel', () => {
    const program = mapAdminProgramListItemToProgram({
      id: 1,
      targetLevel: 'elementary',
      targetLevels: ['university', 'middle', 'high'],
    })
    expect(program.targetLevels).toEqual(['university', 'middle', 'high'])
    expect(program.targetLevel).toBe('university')
  })

  it('maps Program to create request with core fields', () => {
    const request = mapGeneralProgramToCreateRequest(sampleProgram)
    const create = request as import('@/shared/api/generated/dashboard/schemas/programCreateRequest').ProgramCreateRequest & {
      applicationTargetMode?: string
    }

    expect(create.title).toBe('테스트 프로그램')
    expect(create.type).toBe('offline')
    expect(create.targetLevel).toBe('elementary')
    expect(create.targetLevels).toEqual(['elementary'])
    expect(create.rounds).toHaveLength(1)
    // audience 미설정 → ORGANIZATION → GENERAL_ORGANIZATION
    expect(create.programType).toBe('GENERAL_ORGANIZATION')
    expect(create.businessStartDate).toBe('2026-04-01T00:00:00.000Z')
    expect(create.businessEndDate).toBe('2026-12-31T00:00:00.000Z')
    expect(create.autoApplyDefaultFormBindings).toBe(true)
    // audience 미설정 시 폼 기본값(organization)과 동일
    expect(create.applicationTargetMode).toBe('ORGANIZATION')
    expect(create.recruitments).toEqual([
      expect.objectContaining({
        recruitmentType: 'PARTICIPANT',
        targetType: 'ORGANIZATION',
        status: 'ACTIVE',
      }),
    ])
    expect(create.sponsors).toEqual([{ sponsorId: 'sponsor-1' }])
  })

  it('maps multi sponsor manager contact refs into create sponsors[]', () => {
    const request = mapGeneralProgramToCreateRequest({
      ...sampleProgram,
      generalCommonInfo: {
        sponsorManagementIds: ['1627251', '163302'],
        sponsorManagerContactIds: ['1627251::1627253', '163302::111'],
      },
    })

    expect(request.sponsors).toEqual([
      { sponsorId: '1627251', sponsorContactId: '1627253' },
      { sponsorId: '163302', sponsorContactId: '111' },
    ])
    expect(request.sponsorId).toBe('1627251')
  })

  it('includes ACTIVE VOLUNTEER recruitment when volunteer participant type is set', () => {
    const request = mapGeneralProgramToCreateRequest({
      ...sampleProgram,
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'volunteer'],
      volunteerApplicationStartDate: '2026-09-18T15:00:00.000Z',
      volunteerApplicationEndDate: '2026-09-21T15:00:00.000Z',
      generalVolunteers: 22,
    })

    expect(request.recruitments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recruitmentType: 'PARTICIPANT',
          targetType: 'ORGANIZATION',
          status: 'ACTIVE',
        }),
        expect.objectContaining({
          recruitmentType: 'VOLUNTEER',
          targetType: 'COLLEGE_STUDENT',
          status: 'ACTIVE',
          startAt: '2026-09-18T15:00:00.000Z',
          endAt: '2026-09-21T15:00:00.000Z',
          maxCount: 22,
        }),
      ])
    )
  })

  it('sends targetLevels array on create and update (not only targetLevel[0])', () => {
    const multi: Program = {
      ...sampleProgram,
      targetLevel: 'elementary',
      targetLevels: ['university', 'middle', 'high'],
    }
    const create = mapGeneralProgramToCreateRequest(multi)
    expect(create.targetLevels).toEqual(['university', 'middle', 'high'])
    expect(create.targetLevel).toBe('university')

    const update = mapGeneralProgramToUpdateRequest(multi, {
      targetLevels: ['university', 'middle', 'high'],
    })
    expect(update.targetLevels).toEqual(['university', 'middle', 'high'])
    expect(update.targetLevel).toBe('university')
  })

  it('hydrates detail targetLevels from ProgramResponse top-level array', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '99',
      title: '상세',
      targetLevel: 'elementary',
      targetLevels: ['high', 'adult'],
    } as unknown as ProgramResponse)
    expect(program.targetLevels).toEqual(['high', 'adult'])
    expect(program.targetLevel).toBe('high')
  })

  it('sends detailedProgramId and does not alias the name as textbookName', () => {
    const request = mapGeneralProgramToCreateRequest({
      ...sampleProgram,
      detailedProgramId: '163006',
      textbookName: '사회공헌 프로젝트',
      teamDivision: '사회공헌 프로젝트',
      generalCommonInfo: { detailedProgramName: '사회공헌 프로젝트' },
    })

    expect(request.detailedProgramId).toBe(163006)
    expect(request.textbookName).toBeUndefined()
    expect(request.teamDivision).toBeUndefined()
  })

  it('does not send student roster required for individual programs', () => {
    const request = mapGeneralProgramToCreateRequest({
      ...sampleProgram,
      category: 'individual',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
      studentListRequired: 'required',
      generalCommonInfo: {
        participantRecruitmentInfo: { studentListRequired: 'required' },
      },
    })
    const parsed = JSON.parse(request.serviceDetailJson ?? '{}') as {
      studentListRequired?: string
      generalCommonInfo?: { participantRecruitmentInfo?: { studentListRequired?: string } }
    }
    expect(parsed.studentListRequired).toBe('not_required')
    expect(parsed.generalCommonInfo?.participantRecruitmentInfo?.studentListRequired).toBe(
      'not_required'
    )
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
    expect(request.businessStartDate).toBe(sampleProgram.startDate)
    expect(request.businessEndDate).toBe(sampleProgram.endDate)
  })

  it('기간 수정 시 businessStartDate/EndDate를 같이 보낸다', () => {
    const request = mapGeneralProgramToUpdateRequest(sampleProgram, {
      startDate: '2026-10-14',
      endDate: '2026-11-07',
    })
    expect(request.businessStartDate).toBe('2026-10-14')
    expect(request.businessEndDate).toBe('2026-11-07')
  })

  it('사업 기간은 연도를 넘어도 선택한 날짜를 그대로 보낸다', () => {
    const request = mapGeneralProgramToCreateRequest({
      ...sampleProgram,
      startDate: '2025-03-31T15:00:00.000Z',
      endDate: '2027-08-23T14:59:59.999Z',
    })
    expect(request.startDate).toBe('2025-03-31T15:00:00.000Z')
    expect(request.endDate).toBe('2027-08-23T14:59:59.999Z')
    expect(request.businessStartDate).toBe('2025-03-31T15:00:00.000Z')
    expect(request.businessEndDate).toBe('2027-08-23T14:59:59.999Z')
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

  it('모집이 시작된 유형의 기간·recruitments는 빼고 아직 시작 전인 유형은 보낸다', () => {
    const request = mapGeneralProgramToUpdateRequest(
      {
        ...sampleProgram,
        generalParticipantTypes: ['school_institution', 'teacher_instructor'],
        instructorApplicationStartDate: '2099-01-01T00:00:00.000Z',
        instructorApplicationEndDate: '2099-02-01T00:00:00.000Z',
        programRecruitments: [
          { recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
          { recruitmentType: 'INSTRUCTOR', startAt: '2099-01-01T00:00:00+09:00' },
        ],
      },
      {
        applicationStartDate: '2026-03-01T00:00:00.000Z',
        applicationEndDate: '2026-03-31T00:00:00.000Z',
        instructorApplicationStartDate: '2099-01-01T00:00:00.000Z',
        instructorApplicationEndDate: '2099-02-01T00:00:00.000Z',
      }
    )

    expect(request.applicationStartDate).toBeUndefined()
    expect(request.recruitments?.map(row => row.recruitmentType)).toEqual(['INSTRUCTOR'])
  })

  it('공통 정보 패치는 같은 참여자 유형이면 applicationTargetMode를 모집 시작 후에 빼다', () => {
    const request = mapGeneralProgramToUpdateRequest(
      {
        ...sampleProgram,
        generalProgramAudience: 'organization',
        generalParticipantTypes: ['school_institution'],
        programRecruitments: [
          { recruitmentType: 'PARTICIPANT', startAt: '2020-01-01T00:00:00+09:00' },
        ],
      },
      {
        title: '공통만',
        generalProgramAudience: 'organization',
        generalParticipantTypes: ['school_institution'],
      }
    )
    expect(request.title).toBe('공통만')
    expect(request.applicationTargetMode).toBeUndefined()
    expect(request.recruitments).toBeUndefined()
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

  it('common-info patch with registrationOverlay persists overlay in serviceDetailJson', () => {
    const request = mapGeneralProgramToUpdateRequest(sampleProgram, {
      generalCommonInfo: {
        announcementTitle: '공고명',
      },
      registrationOverlay: {
        'generalRegistration.basicInfo.publicProgramTitle': '공고명',
        'generalRegistration.basicInfo.detailedProgramId': '163006',
      },
    })

    expect(request.serviceDetailJson).toBeTruthy()
    const parsed = JSON.parse(request.serviceDetailJson!) as {
      registration?: { overlay?: Record<string, unknown> }
    }
    expect(parsed.registration?.overlay?.['generalRegistration.basicInfo.publicProgramTitle']).toBe(
      '공고명'
    )
  })
})
