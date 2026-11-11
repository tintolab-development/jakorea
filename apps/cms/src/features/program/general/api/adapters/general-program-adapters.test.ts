import { describe, expect, it } from 'vitest'
import {
  filterGeneralProgramsByOverviewStatus,
  mapAdminProgramDetailToProgram,
  mapAdminProgramListItemToProgram,
  mapGeneralApiProgramTypeToAudience,
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import type { AdminProgramListItemDto } from '@/features/program/general/api/programs-api-client'
import { applyGeneralRecruitOverlayToProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { resolveGeneralProgramListTitle } from '@/features/program/general/lib/detail-common-info-display'
import { applyAudienceProgramOperationToRecruitmentWindows } from '@/features/program/general/lib/general-program-recruitment-operation-period'
import {
  applyRecruitmentAdditionalContentHtml,
  applyRecruitmentDetailInfoFields,
} from '@/features/program/shared/lib/apply-recruitment-additional-content-html'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'

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
    expect(mapAdminProgramListItemToProgram({ id: 1, targetLevel: '중학생' }).targetLevel).toBe(
      'middle'
    )
    expect(mapAdminProgramListItemToProgram({ id: 2, targetLevel: '대학생' }).targetLevel).toBe(
      'university'
    )
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

  it('상세 응답의 businessField alias도 사업 분야로 읽는다', () => {
    const mapped = mapAdminProgramDetailToProgram({
      id: '1',
      title: '일반 프로그램',
      businessField: 'digital_literacy',
    } as ProgramResponse & { businessField?: string })

    expect(mapped.businessArea).toBe('디지털리터러시')
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

  it('참여자 지원 방법·비고 컬럼이 nested보다 우선하고 null이면 참여자 nested만 비운다', () => {
    const kept = mapAdminProgramDetailToProgram({
      id: '1',
      title: 't',
      applicationMethod: '온라인 신청',
      remarks: '참여자 비고',
      serviceDetailJson: JSON.stringify({
        generalCommonInfo: {
          participantRecruitmentInfo: {
            applicationMethod: '옛 지원',
            remarks: '옛 비고',
          },
          instructorRecruitmentInfo: {
            applicationMethod: '강사 지원',
            remarks: '강사 비고',
          },
        },
      }),
    } as unknown as ProgramResponse)
    expect(kept.applicationMethod).toBe('온라인 신청')
    expect(kept.remarks).toBe('참여자 비고')
    expect(kept.generalCommonInfo?.instructorRecruitmentInfo?.applicationMethod).toBe('강사 지원')

    const cleared = mapAdminProgramDetailToProgram({
      id: '1',
      title: 't',
      applicationMethod: null,
      remarks: null,
      serviceDetailJson: JSON.stringify({
        generalCommonInfo: {
          participantRecruitmentInfo: {
            applicationMethod: '옛 지원',
            remarks: '옛 비고',
          },
          instructorRecruitmentInfo: { applicationMethod: '강사 지원' },
        },
      }),
    } as unknown as ProgramResponse)
    expect(cleared.applicationMethod).toBeUndefined()
    expect(cleared.remarks).toBeUndefined()
    expect(cleared.generalCommonInfo?.participantRecruitmentInfo?.applicationMethod).toBeUndefined()
    expect(cleared.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBeUndefined()
    expect(cleared.generalCommonInfo?.instructorRecruitmentInfo?.applicationMethod).toBe(
      '강사 지원'
    )
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
    const create =
      request as import('@/shared/api/generated/dashboard/schemas/programCreateRequest').ProgramCreateRequest & {
        applicationTargetMode?: string
      }

    expect(create.title).toBe('테스트 프로그램')
    expect(create.type).toBe('offline')
    expect(create.targetLevel).toBe('elementary')
    expect(create.targetLevels).toEqual(['elementary'])
    // GENERAL 레거시 rounds 전송 중단 — 키 자체 생략 (`rounds: []` 금지)
    expect(create).not.toHaveProperty('rounds')

    // audience 미설정 → ORGANIZATION → GENERAL_ORGANIZATION
    expect(create.programType).toBe('GENERAL_ORGANIZATION')
    expect(create.businessStartDate).toBe('2026-04-01')
    expect(create.businessEndDate).toBe('2026-12-31')
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
    expect(create.sponsors).toEqual([{ sponsorId: 'sponsor-1', sponsorContactIds: [] }])
    expect(create.applicationStartDate).toBeUndefined()
    expect(create.applicationEndDate).toBeUndefined()
  })

  it('사업 시작 전 모집일은 application* 대신 recruitments에만 실는다', () => {
    const request = mapGeneralProgramToCreateRequest({
      ...sampleProgram,
      startDate: '2026-10-30T15:00:00.000Z',
      endDate: '2026-12-13T14:59:59.999Z',
      applicationStartDate: '2026-10-08T15:00:00.000Z',
      applicationEndDate: '2026-10-18T15:00:00.000Z',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
      programRecruitments: [
        {
          recruitmentType: 'PARTICIPANT',
          targetType: 'ORGANIZATION',
          startAt: '2026-10-08T15:00:00.000Z',
          endAt: '2026-10-18T15:00:00.000Z',
        },
      ],
    })

    expect(request.applicationStartDate).toBeUndefined()
    expect(request.applicationEndDate).toBeUndefined()
    expect(request.businessStartDate).toBe('2026-10-31')
    expect(request.recruitments).toEqual([
      expect.objectContaining({
        recruitmentType: 'PARTICIPANT',
        targetType: 'ORGANIZATION',
        startAt: '2026-10-08T15:00:00.000Z',
        endAt: '2026-10-18T15:00:00.000Z',
      }),
    ])
  })

  it('사업 기간 안의 모집일은 레거시 application* 도 함께 보낸다', () => {
    const request = mapGeneralProgramToCreateRequest({
      ...sampleProgram,
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      applicationStartDate: '2026-10-08T15:00:00.000Z',
      applicationEndDate: '2026-10-18T15:00:00.000Z',
    })

    expect(request.applicationStartDate).toBe('2026-10-08T15:00:00.000Z')
    expect(request.applicationEndDate).toBe('2026-10-18T15:00:00.000Z')
  })

  it('omits legacy rounds key for GENERAL create, full update and rounds PATCH', () => {
    const roundsInJson = (req: unknown) => 'rounds' in JSON.parse(JSON.stringify(req))

    const create = mapGeneralProgramToCreateRequest(sampleProgram)
    expect(create.rounds).toBeUndefined()
    expect(roundsInJson(create)).toBe(false)

    const full = mapGeneralProgramToUpdateRequest(sampleProgram)
    expect(full).not.toHaveProperty('rounds')
    expect(roundsInJson(full)).toBe(false)

    const patch = mapGeneralProgramToUpdateRequest(
      sampleProgram,
      { rounds: sampleProgram.rounds },
      sampleProgram
    )
    expect(patch).not.toHaveProperty('rounds')
    expect(roundsInJson(patch)).toBe(false)

    const emptyPatch = mapGeneralProgramToUpdateRequest(sampleProgram, { rounds: [] }, sampleProgram)
    expect(emptyPatch).not.toHaveProperty('rounds')
    expect(roundsInJson(emptyPatch)).toBe(false)
  })

  it('keeps other GENERAL outbound fields unchanged when rounds are omitted', () => {
    const withoutRounds: Program = { ...sampleProgram, rounds: [] }

    const create = mapGeneralProgramToCreateRequest(sampleProgram)
    expect(create).toEqual(mapGeneralProgramToCreateRequest(withoutRounds))
    expect(create.programType).toBe('GENERAL_ORGANIZATION')
    expect(typeof create.serviceDetailJson).toBe('string')
    expect(create.businessStartDate).toBe('2026-04-01')
    expect(create.businessEndDate).toBe('2026-12-31')
    expect(create.recruitments).toEqual([
      expect.objectContaining({
        recruitmentType: 'PARTICIPANT',
        targetType: 'ORGANIZATION',
        status: 'ACTIVE',
      }),
    ])

    const full = mapGeneralProgramToUpdateRequest(sampleProgram)
    expect(full).toEqual(mapGeneralProgramToUpdateRequest(withoutRounds))
    expect(full.serviceDetailJson).toBe(create.serviceDetailJson)

    const patch = mapGeneralProgramToUpdateRequest(
      sampleProgram,
      { title: '제목 변경', rounds: sampleProgram.rounds },
      sampleProgram
    )
    expect(patch).toEqual(
      mapGeneralProgramToUpdateRequest(sampleProgram, { title: '제목 변경' }, sampleProgram)
    )
    expect(patch.title).toBe('제목 변경')
  })

  it.each([
    ['UJAT', { backendProgramType: 'UJAT' }],
    ['1사1교 (COMPANY_SCHOOL)', { backendProgramType: 'COMPANY_SCHOOL' }],
    ['1사1교 (id prefix)', { id: 'company-school-prog-1' }],
    ['교육받은 교사 (TRAINED_TEACHER)', { backendProgramType: 'TRAINED_TEACHER' }],
    ['교육받은 교사 (id prefix)', { id: 'trained-teachers-prog-1' }],
  ] as const)('keeps legacy rounds for %s routed through general adapter', (_label, extra) => {
    const program: Program = { ...sampleProgram, ...extra }
    expect(mapGeneralProgramToCreateRequest(program).rounds).toHaveLength(1)
    expect(mapGeneralProgramToUpdateRequest(program).rounds).toHaveLength(1)
    const patch = mapGeneralProgramToUpdateRequest(program, { rounds: program.rounds }, program)
    expect(patch.rounds).toHaveLength(1)
  })

  it('PATCH rounds keep GET program_schedule id and omit placeholder ids', () => {
    const program: Program = {
      ...sampleProgram,
      backendProgramType: 'TRAINED_TEACHER',
      rounds: [
        { ...sampleProgram.rounds[0], id: '187700' },
        {
          ...sampleProgram.rounds[0],
          id: '186551-round-2',
          roundNumber: 2,
        },
      ],
    }
    const request = mapGeneralProgramToUpdateRequest(program, { rounds: program.rounds }, program)
    expect(request.rounds?.[0]?.id).toBe('187700')
    expect(request.rounds?.[1]).not.toHaveProperty('id')
    expect(request.rounds?.[1]?.roundNumber).toBe(2)
  })

  it('does not send featuredOnHome or homeDisplayOrder on create or PATCH', () => {
    const create = mapGeneralProgramToCreateRequest(sampleProgram) as unknown as Record<
      string,
      unknown
    >
    expect(create.featuredOnHome).toBeUndefined()
    expect(create.homeDisplayOrder).toBeUndefined()

    const patch = mapGeneralProgramToUpdateRequest(
      sampleProgram,
      { title: '제목만', rounds: sampleProgram.rounds },
      sampleProgram
    ) as unknown as Record<string, unknown>
    expect(patch.featuredOnHome).toBeUndefined()
    expect(patch.homeDisplayOrder).toBeUndefined()
    expect(patch.rounds).toBeUndefined()
  })

  it('does not hydrate featuredOnHome from admin GET', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '186095',
      title: '1사 1교 프로그램 [ 1번 ]',
      featuredOnHome: true,
      homeDisplayOrder: 1,
    } as unknown as ProgramResponse)
    expect(program).not.toHaveProperty('featuredOnHome')
    expect(program).not.toHaveProperty('homeDisplayOrder')
  })

  it('omits sponsors on PATCH when assignment keys are display-only leftovers', () => {
    const existing: Program = {
      ...sampleProgram,
      sponsorId: '1627251',
      generalCommonInfo: {
        sponsorManagementIds: ['1627251', '163301'],
        sponsorManagerContactIds: ['1627251::1627253', '163301::163322'],
      },
    }
    const request = mapGeneralProgramToUpdateRequest(
      existing,
      {
        generalCommonInfo: {
          announcementTitle: '제목만',
          sponsorDisplayName: '',
        },
      },
      existing
    )
    expect(request).not.toHaveProperty('sponsors')
    expect(request).not.toHaveProperty('sponsorId')
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
      { sponsorId: '1627251', sponsorContactIds: ['1627253'] },
      { sponsorId: '163302', sponsorContactIds: ['111'] },
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

  it('create 행 담당자·비고는 각 모집 탭 정보에서 가져오고 managerName·기타사항을 쓰지 않는다', () => {
    const request = mapGeneralProgramToCreateRequest({
      ...sampleProgram,
      managerName: '프로그램 담당자',
      contactPhone: '010-0000-0000',
      contactEmail: 'program@jakorea.org',
      otherNotes: '우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
      volunteerApplicationStartDate: '2026-09-18T15:00:00.000Z',
      volunteerApplicationEndDate: '2026-09-21T15:00:00.000Z',
      generalCommonInfo: {
        participantRecruitmentInfo: {
          contactOrganizationName: '최수아',
          contactPhone: '02-512-3456',
          contactEmail: 'edu.team@jakorea.org',
          remarks: '참여기관 비고',
        },
        instructorRecruitmentInfo: {
          contactOrganizationName: '강사 담당',
          remarks: '신청 전 학교 담당 교사 확인이 필요합니다.',
          otherMatters: '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>',
        },
        volunteerRecruitmentInfo: {
          contactOrganizationName: '정민재',
          contactPhone: '010-6234-7890',
          remarks: '봉사자 비고',
          otherMatters: '봉사자 기타사항',
        },
      },
    })

    const org = request.recruitments?.find(row => row.targetType === 'ORGANIZATION')
    const instructor = request.recruitments?.find(row => row.recruitmentType === 'INSTRUCTOR')
    const volunteer = request.recruitments?.find(row => row.recruitmentType === 'VOLUNTEER')
    expect(org).toMatchObject({
      contactName: '최수아',
      contactPhone: '02-512-3456',
      contactEmail: 'edu.team@jakorea.org',
      remarks: '참여기관 비고',
    })
    expect(instructor).toMatchObject({
      remarks: '신청 전 학교 담당 교사 확인이 필요합니다.',
      otherMatters: '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>',
    })
    expect(volunteer).toMatchObject({
      contactName: '정민재',
      contactPhone: '010-6234-7890',
      remarks: '봉사자 비고',
      otherMatters: '봉사자 기타사항',
    })
    expect(volunteer?.contactEmail).toBeUndefined()
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

  it('create/update는 컬럼 targetLevels를 모집 라벨로 확대하지 않는다', () => {
    const program: Program = {
      ...sampleProgram,
      targetLevel: 'elementary',
      targetLevels: ['elementary'],
      generalCommonInfo: {
        participantRecruitmentInfo: {
          educationTarget: '초등학교, 중학교, 대학(원)생',
        },
      },
    }
    const create = mapGeneralProgramToCreateRequest(program)
    expect(create.targetLevels).toEqual(['elementary'])
    expect(create.targetLevel).toBe('elementary')

    const update = mapGeneralProgramToUpdateRequest(program, {
      generalCommonInfo: program.generalCommonInfo,
    })
    expect(update.targetLevels).toEqual(['elementary'])
    expect(update.targetLevel).toBe('elementary')
  })

  it('축소 선택은 기존 복수 배열을 요청 배열로 교체한다', () => {
    const existing: Program = {
      ...sampleProgram,
      targetLevel: 'university',
      targetLevels: ['university', 'elementary'],
    }
    const request = mapGeneralProgramToUpdateRequest(existing, {
      targetLevels: ['elementary'],
      targetLevel: 'elementary',
    })
    expect(request.targetLevels).toEqual(['elementary'])
    expect(request.targetLevel).toBe('elementary')
  })

  it('공통정보 패치는 컬럼 targetLevels를 유지하고 모집 라벨로 키우지 않는다', () => {
    const existing: Program = {
      ...sampleProgram,
      targetLevel: 'elementary',
      targetLevels: ['elementary'],
      generalCommonInfo: {
        announcementTitle: '기존 공고',
        targetLevels: ['elementary'],
        targetLevel: 'elementary',
        participantRecruitmentInfo: {
          educationTarget: '초등학교, 중학교, 대학(원)생',
        },
      } as Program['generalCommonInfo'],
    }
    const request = mapGeneralProgramToUpdateRequest(existing, {
      title: '수정된 대표명',
      generalCommonInfo: { announcementTitle: '수정된 공고' },
    })
    expect(request.targetLevels).toEqual(['elementary'])
    expect(request.targetLevel).toBe('elementary')
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      targetLevels?: string[]
      program?: { targetLevels?: string[] }
      generalCommonInfo?: {
        participantRecruitmentInfo?: unknown
        targetLevels?: string[]
        targetLevel?: string
      }
    }
    expect(detail.targetLevels).toEqual(['elementary'])
    expect(detail.program?.targetLevels).toEqual(['elementary'])
    expect(detail.generalCommonInfo?.targetLevels).toBeUndefined()
    expect(detail.generalCommonInfo?.targetLevel).toBeUndefined()
    expect(detail.generalCommonInfo?.participantRecruitmentInfo).toBeUndefined()
  })

  it('상세 hydrate는 컬럼 배열을 모집 라벨로 확대하지 않는다', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '186023',
      title: '개인 커리큘럼 복수 2회차',
      targetLevel: 'elementary',
      targetLevels: ['elementary'],
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        targetLevels: ['elementary'],
        generalCommonInfo: {
          participantRecruitmentInfo: {
            educationTarget: '초등학교, 중학교, 대학(원)생',
          },
        },
      }),
    } as unknown as ProgramResponse)
    expect(program.targetLevels).toEqual(['elementary'])
    expect(program.targetLevel).toBe('elementary')
  })

  it('빈 targetLevels는 stale targetLevel로 되살리지 않는다', () => {
    const listed = mapAdminProgramListItemToProgram({
      id: 186037,
      title: '축소',
      targetLevels: [],
      targetLevel: 'university',
    } as AdminProgramListItemDto)
    expect(listed.targetLevels ?? []).toEqual([])
    expect(listed.targetLevel).toBeUndefined()

    const detail = mapAdminProgramDetailToProgram({
      id: '186037',
      title: '축소',
      targetLevels: [],
      targetLevel: 'university',
    } as unknown as ProgramResponse)
    expect(detail.targetLevels).toEqual([])
    expect(detail.targetLevel).toBeUndefined()
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

  it('신규 등록 recruitments[]에 모집 행별 썸네일·첨부 fileObjectId를 싣고 수정 요청에는 넣지 않는다', () => {
    const overlay = {
      'recruit.detailInfo.thumbFileObjectId': 186900,
      'recruit.detailInfo.attachmentFileObjectIds': [186901, 186902],
      'recruitInstructor.detailInfo.thumbFileObjectId': 186910,
      'recruitInstructor.detailInfo.attachmentFileObjectIds': [186911],
    }
    const program: Program = {
      ...sampleProgram,
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
      instructorApplicationStartDate: '2026-03-01T00:00:00.000Z',
      instructorApplicationEndDate: '2026-03-31T00:00:00.000Z',
      registrationOverlay: overlay,
    }
    const create = mapGeneralProgramToCreateRequest(program)
    const participant = create.recruitments?.find(
      row => row.recruitmentType === 'PARTICIPANT' && row.targetType === 'ORGANIZATION'
    )
    const instructor = create.recruitments?.find(row => row.recruitmentType === 'INSTRUCTOR')
    expect(participant).toMatchObject({
      recruitmentType: 'PARTICIPANT',
      targetType: 'ORGANIZATION',
      thumbnailFileObjectId: 186900,
      attachmentFileObjectIds: [186901, 186902],
    })
    expect(instructor).toMatchObject({
      recruitmentType: 'INSTRUCTOR',
      thumbnailFileObjectId: 186910,
      attachmentFileObjectIds: [186911],
    })

    const update = mapGeneralProgramToUpdateRequest(program)
    expect(update.recruitments?.some(row => 'thumbnailFileObjectId' in row)).toBe(false)
    expect(update.recruitments?.some(row => 'attachmentFileObjectIds' in row)).toBe(false)
  })

  it('does not put create-only fields on update request', () => {
    const request = mapGeneralProgramToUpdateRequest(sampleProgram)
    expect(request).not.toHaveProperty('programType')
    expect(request).not.toHaveProperty('autoApplyDefaultFormBindings')
    expect(request.businessStartDate).toBe('2026-04-01')
    expect(request.businessEndDate).toBe('2026-12-31')
  })

  it('사업 분야는 공식 businessArea만 생성·수정 요청에 보낸다', () => {
    const program = { ...sampleProgram, businessArea: 'digital_literacy' }
    const create = mapGeneralProgramToCreateRequest(program)
    const update = mapGeneralProgramToUpdateRequest(program, {
      businessArea: 'digital_literacy',
    })

    expect(create.businessArea).toBe('디지털리터러시')
    expect(create).not.toHaveProperty('businessField')
    expect(update.businessArea).toBe('디지털리터러시')
    expect(update).not.toHaveProperty('businessField')
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
    expect(request.businessStartDate).toBe('2025-04-01')
    expect(request.businessEndDate).toBe('2027-08-23')
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

  it('모집이 시작된 유형의 기간은 빼고 아직 시작 전인 유형은 보낸다', () => {
    const request = mapGeneralProgramToUpdateRequest(
      {
        ...sampleProgram,
        generalParticipantTypes: ['school_institution', 'teacher_instructor'],
        instructorApplicationStartDate: '2099-01-01T00:00:00.000Z',
        instructorApplicationEndDate: '2099-02-01T00:00:00.000Z',
        programRecruitments: [
          {
            id: 11,
            recruitmentType: 'PARTICIPANT',
            startAt: '2020-01-01T00:00:00+09:00',
            operationStartDate: '2099-01-01',
          },
          {
            id: 12,
            recruitmentType: 'INSTRUCTOR',
            startAt: '2099-01-01T00:00:00+09:00',
            operationStartDate: '2020-01-01',
          },
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

  it('공통 정보 패치는 모집 시작 후에도 모집 창·모집 정보를 요청에 넣지 않는다', () => {
    const request = mapGeneralProgramToUpdateRequest(
      {
        ...sampleProgram,
        applicationStartDate: '2026-09-25T00:00:00+09:00',
        applicationEndDate: '2026-10-23T00:00:00+09:00',
        instructorApplicationStartDate: '2026-09-25T00:00:00+09:00',
        instructorApplicationEndDate: '2026-10-23T00:00:00+09:00',
        resultAnnouncementDate: '2026-10-23T00:00:00+09:00',
        generalParticipantInterviewEnabled: true,
        generalProgramAudience: 'organization',
        generalParticipantTypes: ['school_institution', 'teacher_instructor'],
        programRecruitments: [
          { recruitmentType: 'PARTICIPANT', startAt: '2026-09-25T00:00:00+09:00' },
          { recruitmentType: 'INSTRUCTOR', startAt: '2026-09-25T00:00:00+09:00' },
        ],
        generalCommonInfo: {
          announcementTitle: '기존 공고',
          participantRecruitmentInfo: { recruitmentPeriodLabel: '2026.09.25 ~ 2026.10.23' },
          instructorRecruitmentInfo: { recruitmentPeriodLabel: '2026.09.25 ~ 2026.10.23' },
        },
      },
      {
        title: '수정된 대표명',
        mainTitle: '수정된 대표명',
        startDate: '2026-11-05',
        endDate: '2026-12-05',
        generalProgramAudience: 'organization',
        generalParticipantTypes: ['school_institution', 'teacher_instructor'],
        generalCommonInfo: {
          announcementTitle: '수정된 공고',
          participantRecruitmentInfo: { recruitmentPeriodLabel: '2026.09.25 ~ 2026.10.23' },
          instructorRecruitmentInfo: { recruitmentPeriodLabel: '2026.09.25 ~ 2026.10.23' },
        },
      }
    )
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      announcementTitle?: string
      instructorApplicationStartDate?: string
      resultAnnouncementDate?: string
      generalParticipantInterviewEnabled?: boolean
      generalCommonInfo?: {
        announcementTitle?: string
        participantRecruitmentInfo?: unknown
        instructorRecruitmentInfo?: unknown
      }
    }

    expect(request.title).toBe('수정된 대표명')
    expect(request.businessStartDate).toBe('2026-11-05')
    expect(request.businessEndDate).toBe('2026-12-05')
    expect(request.applicationStartDate).toBeUndefined()
    expect(request.applicationEndDate).toBeUndefined()
    expect(request.recruitments).toBeUndefined()
    expect(request.applicationTargetMode).toBeUndefined()
    expect(detail.instructorApplicationStartDate).toBeUndefined()
    expect(detail.resultAnnouncementDate).toBeUndefined()
    expect(detail.generalParticipantInterviewEnabled).toBeUndefined()
    expect(detail.generalCommonInfo?.announcementTitle).toBe('수정된 공고')
    expect(detail.generalCommonInfo?.participantRecruitmentInfo).toBeUndefined()
    expect(detail.generalCommonInfo?.instructorRecruitmentInfo).toBeUndefined()
  })

  it('모집 정보 패치는 모집 창을 serviceDetailJson에 남긴다', () => {
    const request = mapGeneralProgramToUpdateRequest(
      {
        ...sampleProgram,
        instructorApplicationStartDate: '2099-01-01T00:00:00.000Z',
        programRecruitments: [
          { recruitmentType: 'INSTRUCTOR', startAt: '2099-01-01T00:00:00+09:00' },
        ],
      },
      {
        instructorApplicationStartDate: '2099-01-01T00:00:00.000Z',
        instructorApplicationEndDate: '2099-02-01T00:00:00.000Z',
        generalCommonInfo: {
          instructorRecruitmentInfo: { recruitmentPeriodLabel: '2099.01.01 ~ 2099.02.01' },
        },
      }
    )
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      instructorApplicationStartDate?: string
      generalCommonInfo?: { instructorRecruitmentInfo?: { recruitmentPeriodLabel?: string } }
    }
    expect(detail.instructorApplicationStartDate).toBe('2099-01-01T00:00:00.000Z')
    expect(detail.generalCommonInfo?.instructorRecruitmentInfo?.recruitmentPeriodLabel).toBe(
      '2099.01.01 ~ 2099.02.01'
    )
  })

  it('학생 명단 제출 여부만 패치할 때 legacy paymentItems를 serviceDetailJson에 넣지 않는다', () => {
    const existing: Program = {
      ...sampleProgram,
      id: '186090',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
      studentListRequired: 'not_required',
      generalCommonInfo: {
        paymentItems: '숙박비',
        participantRecruitmentInfo: {
          studentListRequired: 'not_required',
          studentListRequiredLabel: '제출 불필요',
        },
      },
    }
    const patch = {
      studentListRequired: 'required' as const,
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        participantRecruitmentInfo: {
          ...existing.generalCommonInfo?.participantRecruitmentInfo,
          studentListRequired: 'required' as const,
          studentListRequiredLabel: '제출 필요',
        },
      },
    }
    const draft: Program = { ...existing, ...patch }
    const request = mapGeneralProgramToUpdateRequest(draft, patch, existing)
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      studentListRequired?: string
      registration?: { overlay?: Record<string, unknown> }
      generalCommonInfo?: {
        paymentItems?: string
        participantRecruitmentInfo?: { studentListRequired?: string }
      }
    }
    expect(detail.studentListRequired).toBe('required')
    expect(detail.generalCommonInfo?.participantRecruitmentInfo?.studentListRequired).toBe(
      'required'
    )
    expect(detail.generalCommonInfo?.paymentItems).toBeUndefined()
    expect(
      detail.registration?.overlay?.['generalRegistration.wageInfo.paymentItemValues']
    ).toBeUndefined()
    expect(
      detail.registration?.overlay?.['generalRegistration.wageInfo.paymentItemLabels']
    ).toBeUndefined()
    expect(request.serviceDetailJson).not.toContain('숙박비')
  })

  it('학생 명단 패치 시 registrationOverlay의 wageInfo도 serviceDetailJson에 재전송하지 않는다', () => {
    const existing: Program = {
      ...sampleProgram,
      generalCommonInfo: {
        paymentItems: '숙박비',
        participantRecruitmentInfo: { studentListRequired: 'not_required' },
      },
      registrationOverlay: {
        'generalRegistration.wageInfo.paymentItemValues': ['p-3'],
        'generalRegistration.wageInfo.paymentItemLabels': '숙박비',
      },
    }
    const patch = {
      studentListRequired: 'required' as const,
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        participantRecruitmentInfo: {
          studentListRequired: 'required' as const,
        },
      },
    }
    const request = mapGeneralProgramToUpdateRequest({ ...existing, ...patch }, patch, existing)
    expect(request.serviceDetailJson).not.toContain('paymentItemValues')
    expect(request.serviceDetailJson).not.toContain('숙박비')
  })

  it('지급 항목을 실제로 바꾼 패치는 paymentItems를 serviceDetailJson에 남긴다', () => {
    const existing: Program = {
      ...sampleProgram,
      generalCommonInfo: {
        paymentItems: '강사 교통비',
      },
    }
    const patch = {
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        paymentItems: '강사 교통비, 숙박비',
      },
    }
    const request = mapGeneralProgramToUpdateRequest({ ...existing, ...patch }, patch, existing)
    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      generalCommonInfo?: { paymentItems?: string }
    }
    expect(detail.generalCommonInfo?.paymentItems).toBe('강사 교통비, 숙박비')
    expect(request.paymentItems).toEqual([
      { itemType: 'TRANSPORTATION', useYn: true },
      { itemType: 'LODGING', useYn: true },
    ])
  })

  it('Create는 숙박비·장거리 교통비 복수 선택을 paymentItems로 보낸다', () => {
    const request = mapGeneralProgramToCreateRequest({
      ...sampleProgram,
      generalProgramAudience: 'individual',
      generalCommonInfo: {
        paymentItems: '숙박비, 장거리 교통비, 식사비',
      },
    })
    expect(request.paymentItems).toEqual([
      { itemType: 'LODGING', useYn: true },
      { itemType: 'LONG_DISTANCE_TRANSPORTATION', useYn: true },
      { itemType: 'MEAL', useYn: true },
    ])
  })

  it('지급 항목 외 PATCH는 상위 paymentItems를 omit한다', () => {
    const existing: Program = {
      ...sampleProgram,
      generalCommonInfo: { paymentItems: '숙박비' },
    }
    const request = mapGeneralProgramToUpdateRequest(existing, { title: '제목만' }, existing)
    expect(request).not.toHaveProperty('paymentItems')
  })

  it('전체 지급 항목 해제는 paymentItems: []를 보낸다', () => {
    const existing: Program = {
      ...sampleProgram,
      generalCommonInfo: { paymentItems: '숙박비' },
    }
    const patch = { generalCommonInfo: { paymentItems: '해당없음' } }
    const request = mapGeneralProgramToUpdateRequest({ ...existing, ...patch }, patch, existing)
    expect(request.paymentItems).toEqual([])
  })

  it('상세 settlementPolicy 지급 항목을 유형으로 숨기지 않는다', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '186090',
      programType: 'GENERAL_INDIVIDUAL',
      title: '개인',
      settlementPolicy: {
        paymentItems: [
          { itemType: 'TRANSPORTATION', useYn: true },
          { itemType: 'LONG_DISTANCE_TRANSPORTATION', useYn: true },
          { itemType: 'LODGING', useYn: true },
          { itemType: 'ACTIVITY', useYn: true },
          { itemType: 'MEAL', useYn: true },
        ],
      },
    } as ProgramResponse)
    expect(program.generalCommonInfo?.paymentItems).toBe(
      '교통비, 장거리 교통비, 숙박비, 활동비, 식비'
    )
  })

  it('settlementPolicy.paymentItems []는 JSON overlay 지급 항목을 덮어 빈 상태로 둔다', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '186090',
      programType: 'GENERAL_ORGANIZATION',
      title: '기관',
      serviceDetailJson: JSON.stringify({
        generalCommonInfo: { paymentItems: '숙박비' },
      }),
      settlementPolicy: { paymentItems: [] },
    } as ProgramResponse)
    expect(program.generalCommonInfo?.paymentItems).toBeUndefined()
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

  it('저장된 참여자 행에 봉사 모집을 더할 때 기존 id를 유지하고 새 행은 id 없이 보낸다', () => {
    const existing: Program = {
      ...sampleProgram,
      generalParticipantTypes: ['individual'],
      programRecruitments: [
        {
          id: 99011,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'INDIVIDUAL',
          targetType: 'INDIVIDUAL',
        },
      ],
    }
    const request = mapGeneralProgramToUpdateRequest(
      existing,
      {
        title: '봉사 추가',
        generalParticipantTypes: ['individual', 'volunteer'],
      },
      existing
    )
    expect(request.recruitments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 99011,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'INDIVIDUAL',
        }),
        expect.objectContaining({
          recruitmentType: 'VOLUNTEER',
          applicationType: 'VOLUNTEER',
        }),
      ])
    )
    expect(request.recruitments?.find(row => row.recruitmentType === 'VOLUNTEER')).not.toHaveProperty(
      'id'
    )
    expect(request.recruitments).toHaveLength(2)
  })

  it('같은 참여자 유형이면 저장된 행이 있어도 recruitments를 보내지 않는다', () => {
    const existing: Program = {
      ...sampleProgram,
      generalParticipantTypes: ['individual'],
      programRecruitments: [
        { id: 99011, recruitmentType: 'PARTICIPANT', applicationType: 'INDIVIDUAL' },
      ],
    }
    const request = mapGeneralProgramToUpdateRequest(
      existing,
      { title: '제목만', generalParticipantTypes: ['individual'] },
      existing
    )
    expect(request.recruitments).toBeUndefined()
  })

  it('저장된 개인 모집은 기관 유형으로 바꾸지 않는다', () => {
    const existing: Program = {
      ...sampleProgram,
      generalParticipantTypes: ['individual'],
      programRecruitments: [
        { id: 99011, recruitmentType: 'PARTICIPANT', applicationType: 'INDIVIDUAL' },
      ],
    }
    const request = mapGeneralProgramToUpdateRequest(
      existing,
      { generalParticipantTypes: ['school_institution'] },
      existing
    )
    expect(request.recruitments).toBeUndefined()
  })

  it('등록 후 audience 패치는 applicationTargetMode를 바꾸지 않고 serviceDetailJson만 남긴다', () => {
    const request = mapGeneralProgramToUpdateRequest(sampleProgram, {
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    })

    expect(request.applicationTargetMode).toBeUndefined()
    expect(request.serviceDetailJson).toBeUndefined()
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
    expect(request).not.toHaveProperty('sponsorId')
    expect(request.sponsors).toEqual([
      { sponsorId: '1627251', sponsorContactIds: [] },
    ])
    expect(request.applicationTargetMode).toBeUndefined()
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
    expect(parsed.generalProgramAudience).toBeUndefined()
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
    expect(parsed).not.toHaveProperty('registrationOverlay')
  })

  it('모집 추가 내용 PATCH — 컬럼과 participantRecruitmentInfo에 같은 HTML을 싣는다', () => {
    const html = '<p style="color: red;">신규 추가 내용 😀</p>'
    const existing: Program = {
      ...sampleProgram,
      additionalContentHtml: html,
      generalCommonInfo: {
        participantRecruitmentInfo: {
          additionalContentHtml: '<p>중첩 옛본문</p>',
        },
      },
    }
    const patch = applyRecruitmentAdditionalContentHtml(
      {
        additionalContentHtml: html,
        applicationStartDate: existing.applicationStartDate,
        generalCommonInfo: existing.generalCommonInfo,
      },
      existing,
      html,
      'participant'
    )
    const request = mapGeneralProgramToUpdateRequest({ ...existing, ...patch }, patch)

    expect(request.additionalContentHtml).toBeUndefined()
    const participantRow = request.recruitments?.find(row => row.recruitmentType === 'PARTICIPANT')
    if (existing.programRecruitments?.some(row => row.recruitmentType === 'PARTICIPANT')) {
      expect(participantRow?.additionalContentHtml).toBe(html)
    }
    expect(request.serviceDetailJson).toBeTruthy()
    const parsed = JSON.parse(request.serviceDetailJson!) as {
      generalCommonInfo?: {
        participantRecruitmentInfo?: { additionalContentHtml?: string }
      }
      registration?: { overlay?: Record<string, unknown> }
    }
    expect(parsed.generalCommonInfo?.participantRecruitmentInfo?.additionalContentHtml).toBe(html)
    expect(parsed.registration?.overlay?.['recruit.detailInfo.additionalContentHtml']).toBe(html)
  })

  it('모집 패치의 applicationMethod·remarks만 컬럼으로 보내고 otherNotes와 섞지 않는다', () => {
    const existing: Program = {
      ...sampleProgram,
      applicationMethod: '방문 접수',
      remarks: '기존 비고',
      otherNotes: '기존 기타',
    }
    const sent = mapGeneralProgramToUpdateRequest(existing, {
      applicationMethod: '온라인 신청',
      remarks: '수정 비고',
    })
    expect(sent.applicationMethod).toBe('온라인 신청')
    expect(sent.remarks).toBe('수정 비고')
    expect(sent.otherMatters).toBeUndefined()

    const untouched = mapGeneralProgramToUpdateRequest(existing, { title: '제목만' })
    expect(untouched.applicationMethod).toBeUndefined()
    expect(untouched.remarks).toBeUndefined()

    const otherOnly = mapGeneralProgramToUpdateRequest(existing, { otherNotes: '기타만' })
    expect(otherOnly.remarks).toBeUndefined()
    expect(otherOnly.otherMatters).toBe('기타만')
    expect(otherOnly.applicationMethod).toBeUndefined()
  })

  it('참여기관 운영 기간 수정은 기존 모집 행에만 반영하고 사업 기간은 바꾸지 않는다', () => {
    const existing: Program = {
      ...sampleProgram,
      id: '186251',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      applicationStartDate: '2026-10-01',
      applicationEndDate: '2026-10-31',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
      rounds: [],
      programRecruitments: [
        {
          id: 186603,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          targetType: 'ORGANIZATION',
          operationStartDate: '2026-11-18',
          operationEndDate: '2026-12-25',
          startAt: '2099-10-01',
          endAt: '2099-10-31',
        },
      ],
      generalCommonInfo: {
        participantRecruitmentInfo: {
          operationPeriodLabel: '2026-11-11 ~ 2026-12-25',
        },
      },
      registrationOverlay: {
        'recruit.programRangeSeal': { start: '2026-11-11', end: '2026-12-25' },
        'recruit.individual.programRangeSeal': { start: '2026-11-11', end: '2026-12-25' },
      },
    }
    const operationPatch = applyAudienceProgramOperationToRecruitmentWindows(
      existing,
      {
        participantProgramOperationStartDate: '2026-11-30T15:00:00.000Z',
        participantProgramOperationEndDate: '2027-01-14T15:00:00.000Z',
      } as ProgramDetailEditFormValues,
      'participant'
    )
    const patch = applyRecruitmentDetailInfoFields(
      {
        applicationStartDate: existing.applicationStartDate,
        applicationEndDate: existing.applicationEndDate,
        description: '기관 모집 설명',
        generalCommonInfo: {
          participantRecruitmentInfo: {
            operationPeriodLabel: '2026.12.01(화) ~ 2027.01.15(금)',
          },
        },
        ...operationPatch,
      },
      existing,
      'participant',
      { description: '기관 모집 설명' }
    )
    const request = mapGeneralProgramToUpdateRequest({ ...existing, ...patch }, patch, existing)
    const participantRows = request.recruitments?.filter(
      row => row.recruitmentType === 'PARTICIPANT'
    )

    expect(participantRows).toEqual([
      expect.objectContaining({
        id: 186603,
        operationStartDate: '2026-12-01',
        operationEndDate: '2027-01-15',
      }),
    ])
    expect(request.businessStartDate).toBeUndefined()
    expect(request.businessEndDate).toBeUndefined()
    expect(request.rounds).toBeUndefined()

    const detail = JSON.parse(request.serviceDetailJson ?? '{}') as {
      generalCommonInfo?: {
        participantRecruitmentInfo?: { operationPeriodLabel?: string }
      }
      registration?: { overlay?: Record<string, { start?: string; end?: string } | unknown> }
    }
    expect(detail.generalCommonInfo?.participantRecruitmentInfo?.operationPeriodLabel).toContain(
      '2026.12.01'
    )
    expect(detail.registration?.overlay?.['recruit.programRangeSeal']).toMatchObject({
      start: '2026-12-01',
      end: '2027-01-15',
    })
  })

  it('공고명만 있는 부분 PATCH는 저장된 문의처·모집대상상세를 비우지 않는다', () => {
    const existing: Program = {
      ...sampleProgram,
      generalCommonInfo: {
        participantRecruitmentInfo: {
          contactOrganizationName: 'JA Korea 프로그램 운영팀',
          recruitmentTargetDetail: '초·중·고 학생 대상',
        },
      },
    }
    const patch: Partial<Program> = {
      generalCommonInfo: { announcementTitle: '수정 공고' },
    }
    const requests = [
      mapGeneralProgramToUpdateRequest({ ...existing, ...patch }, patch, existing),
      mapGeneralProgramToUpdateRequest(existing, patch, existing),
      mapGeneralProgramToUpdateRequest(
        {
          ...existing,
          contactName: '[BOT-TEST] 문의처',
          recruitmentTargetDetail: '[BOT-TEST] 모집대상상세',
        },
        patch,
        {
          ...existing,
          contactName: '[BOT-TEST] 문의처',
          recruitmentTargetDetail: '[BOT-TEST] 모집대상상세',
        }
      ),
    ]
    for (const request of requests) {
      expect(request.clearFields ?? []).not.toContain('contactName')
      expect(request.clearFields ?? []).not.toContain('recruitmentTargetDetail')
      expect(request.contactName).toBeUndefined()
      expect(request.recruitmentTargetDetail).toBeUndefined()
    }
  })

  it('문의처·모집대상상세를 명시적으로 비우면 clearFields에만 싣는다', () => {
    const existing: Program = {
      ...sampleProgram,
      contactName: 'JA Korea 프로그램 운영팀',
      recruitmentTargetDetail: '초·중·고 학생 대상',
      generalCommonInfo: {
        participantRecruitmentInfo: {
          contactOrganizationName: 'JA Korea 프로그램 운영팀',
          contactName: 'JA Korea 프로그램 운영팀',
          recruitmentTargetDetail: '초·중·고 학생 대상',
        },
      },
    }
    const request = mapGeneralProgramToUpdateRequest(
      existing,
      {
        contactName: '',
        recruitmentTargetDetail: '',
        generalCommonInfo: {
          participantRecruitmentInfo: {
            contactName: '',
            contactOrganizationName: '',
            recruitmentTargetDetail: '',
          },
        },
      },
      existing
    )
    expect(request.contactName).toBeUndefined()
    expect(request.recruitmentTargetDetail).toBeUndefined()
    expect(request.clearFields).toEqual(
      expect.arrayContaining(['contactName', 'recruitmentTargetDetail'])
    )
  })

  it('지원 방법·비고를 비우면 clearFields에만 싣는다', () => {
    const existing: Program = {
      ...sampleProgram,
      applicationMethod: '방문 접수',
      remarks: '기존 비고',
    }
    const request = mapGeneralProgramToUpdateRequest(existing, {
      applicationMethod: '  ',
      remarks: undefined,
      generalCommonInfo: { participantRecruitmentInfo: { remarks: undefined } },
    })
    expect(request.applicationMethod).toBeUndefined()
    expect(request.remarks).toBeUndefined()
    expect(request.clearFields).toEqual(expect.arrayContaining(['applicationMethod', 'remarks']))
  })

  it('maps createdByName and updatedByName from list and detail JSON', () => {
    const listed = mapAdminProgramListItemToProgram({
      id: 186401,
      title: '감사',
      createdByName: '곽도규',
      updatedByName: '김도영',
    } as AdminProgramListItemDto)
    const detail = mapAdminProgramDetailToProgram({
      id: '186401',
      title: '감사',
      createdAt: '2026-12-08T00:15:00.000Z',
      updatedAt: '2026-12-09T01:00:00.000Z',
      createdByName: '곽도규',
      updatedByName: '김도영',
    } as ProgramResponse)

    expect(listed.createdByName).toBe('곽도규')
    expect(listed.updatedByName).toBe('김도영')
    expect(detail.createdByName).toBe('곽도규')
    expect(detail.updatedByName).toBe('김도영')
  })

  it('does not take createdByName from serviceDetailJson', () => {
    const program = mapAdminProgramDetailToProgram({
      id: '186401',
      title: '감사',
      createdByName: '곽도규',
      updatedByName: '김도영',
      serviceDetailJson: JSON.stringify({
        createdByName: 'JSON등록자',
        updatedByName: 'JSON수정자',
      }),
    } as ProgramResponse)

    expect(program.createdByName).toBe('곽도규')
    expect(program.updatedByName).toBe('김도영')
  })
})

describe('등록 위저드 강사 모집 비고 「해당 없음」 → 생성 요청 remarksNotApplicable', () => {
  function createWith(instructorInfo: Record<string, unknown>) {
    return mapGeneralProgramToCreateRequest({
      ...sampleProgram,
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
      volunteerApplicationStartDate: '2026-09-18T15:00:00.000Z',
      volunteerApplicationEndDate: '2026-09-21T15:00:00.000Z',
      generalCommonInfo: {
        participantRecruitmentInfo: { contactOrganizationName: '최수아', remarks: '참여기관 비고' },
        instructorRecruitmentInfo: { contactOrganizationName: '강사 담당', ...instructorInfo },
        volunteerRecruitmentInfo: { contactOrganizationName: '정민재', remarks: '봉사자 비고' },
      },
    })
  }
  const rowsOf = (request: ReturnType<typeof createWith>) => ({
    org: request.recruitments?.find(row => row.targetType === 'ORGANIZATION'),
    instructor: request.recruitments?.find(row => row.recruitmentType === 'INSTRUCTOR'),
    volunteer: request.recruitments?.find(row => row.recruitmentType === 'VOLUNTEER'),
  })

  it('해당 없음(true) → 강사 행 remarksNotApplicable=true, remarks 빈 문자열', () => {
    const { instructor } = rowsOf(createWith({ notesNotApplicable: true, remarks: '남은 비고' }))
    expect(instructor?.remarksNotApplicable).toBe(true)
    expect(instructor?.remarks).toBe('')
  })

  it('해당 없음 해제(false) → remarksNotApplicable=false, 비고 유지', () => {
    const { instructor } = rowsOf(createWith({ notesNotApplicable: false, remarks: '강사 비고' }))
    expect(instructor?.remarksNotApplicable).toBe(false)
    expect(instructor?.remarks).toBe('강사 비고')
  })

  it('미입력 → remarksNotApplicable 키를 넣지 않는다', () => {
    const { instructor } = rowsOf(createWith({ remarks: '강사 비고' }))
    expect(instructor).not.toHaveProperty('remarksNotApplicable')
    expect(instructor?.remarks).toBe('강사 비고')
  })

  it('참여자·봉사자 행 payload는 강사 해당 없음 여부와 무관하게 같다', () => {
    const base = rowsOf(createWith({ remarks: '강사 비고' }))
    const withNa = rowsOf(createWith({ notesNotApplicable: true, remarks: '강사 비고' }))
    expect(JSON.stringify(withNa.org)).toBe(JSON.stringify(base.org))
    expect(JSON.stringify(withNa.volunteer)).toBe(JSON.stringify(base.volunteer))
    expect(base.org).not.toHaveProperty('remarksNotApplicable')
    expect(base.volunteer).not.toHaveProperty('remarksNotApplicable')
  })

  it('overlay recruit.instructor.notesNotApplicable → nested instructorRecruitmentInfo.notesNotApplicable', () => {
    const fromOverlay = applyGeneralRecruitOverlayToProgram(
      {
        ...sampleProgram,
        generalProgramAudience: 'organization',
        generalCommonInfo: { instructorRecruitmentInfo: {} },
      },
      { 'recruit.instructor.notesNotApplicable': true },
      { preferOverlay: true }
    )
    expect(fromOverlay.generalCommonInfo?.instructorRecruitmentInfo?.notesNotApplicable).toBe(true)

    // 참여자 유형이 없는 draft(1사1교 typed parity 등)는 옮기지 않는다
    const noAudience = applyGeneralRecruitOverlayToProgram(
      {
        ...sampleProgram,
        generalProgramAudience: undefined,
        generalParticipantTypes: undefined,
        generalCommonInfo: { instructorRecruitmentInfo: {} },
      },
      { 'recruit.instructor.notesNotApplicable': true },
      { preferOverlay: true }
    )
    expect(noAudience.generalCommonInfo?.instructorRecruitmentInfo).not.toHaveProperty(
      'notesNotApplicable'
    )

    const untouched = applyGeneralRecruitOverlayToProgram(
      { ...sampleProgram, generalCommonInfo: { instructorRecruitmentInfo: {} } },
      {},
      { preferOverlay: true }
    )
    expect(untouched.generalCommonInfo?.instructorRecruitmentInfo).not.toHaveProperty(
      'notesNotApplicable'
    )
  })
})
