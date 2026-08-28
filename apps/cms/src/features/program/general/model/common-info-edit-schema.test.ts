import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  encodeSponsorManagerContactRef,
  generalCommonInfoEditValuesToProgramPatch,
  programToGeneralCommonInfoEditValues,
  type GeneralProgramSponsorEditContext,
} from './common-info-edit-schema'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 'general-prog-1',
    sponsorId: 'sponsor-old',
    title: '테스트 프로그램',
    mainTitle: '테스트 프로그램',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    educationProcess: '정규교육',
    ipOwned: 'JA',
    courseDeliveredBy: 'JA',
    partnerInvolvement: false,
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    generalProgramAudience: 'organization',
    generalParticipantTypes: ['school_institution'],
    generalCommonInfo: {
      announcementTitle: '공고 프로그램명',
      sponsorManagementIds: ['sponsor-old'],
      sponsorManagementId: 'sponsor-old',
      participationMethod: 'individual',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Program
}

const sponsorContext: GeneralProgramSponsorEditContext = {
  sponsors: [
    {
      id: 'sponsor-new',
      name: '신규 후원사',
      programCount: 1,
    } as GeneralProgramSponsorEditContext['sponsors'][number],
    {
      id: 'sponsor-old',
      name: '기존 후원사',
      programCount: 1,
    } as GeneralProgramSponsorEditContext['sponsors'][number],
  ],
  contactsBySponsorId: {
    'sponsor-new': [
      {
        id: 'contact-1',
        name: '김담당',
        phone: '010-0000-0000',
        position: '매니저',
      } as GeneralProgramSponsorEditContext['contactsBySponsorId'][string][number],
    ],
    'sponsor-old': [
      {
        id: 'contact-0',
        name: '이담당',
        phone: '010-1111-1111',
        position: '매니저',
      } as GeneralProgramSponsorEditContext['contactsBySponsorId'][string][number],
    ],
  },
}

describe('generalCommonInfoEditValuesToProgramPatch', () => {
  it('참여 방식(팀) 저장 후 다시 로드하면 팀으로 유지된다', () => {
    const program = baseProgram()
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.participationMethod = 'team'
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(patch.generalCommonInfo?.participationMethod).toBe('team')

    const merged: Program = {
      ...program,
      ...patch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    }
    const reloaded = programToGeneralCommonInfoEditValues(merged, sponsorContext)
    expect(reloaded.participationMethod).toBe('team')
  })

  it('후원사 선택 시 sponsorId를 1순위 관리 id로 동기화한다', () => {
    const program = baseProgram()
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.sponsorManagementIds = ['sponsor-new']
    values.sponsorManagerContactId = encodeSponsorManagerContactRef('sponsor-new', 'contact-1')
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(patch.sponsorId).toBe('sponsor-new')
  })

  it('교육 구조·회차·대상이 patch에 포함된다', () => {
    const program = baseProgram()
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.educationStructure = 'curriculum'
    values.sessionRound = 'multi'
    values.participantOrganization = true
    values.participantIndividual = false
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(patch.generalProgramEducationStructure).toBe('curriculum')
    expect(patch.generalProgramSessionRound).toBe('multi')
    expect(patch.generalProgramAudience).toBe('organization')
  })

  it('일정형 단일 회차는 사전 교육을 저장하지 않는다', () => {
    const program = baseProgram({
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.educationStructure = 'schedule'
    values.sessionRound = 'single'
    values.scheduleCurriculumPreEducation = true
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(patch.generalCommonInfo?.scheduleCurriculumPreEducation).toBe(false)
  })

  it('행사 일정 블록의 일정 별 상이 교육·참여·IPS를 저장 후 다시 로드한다', () => {
    const program = baseProgram({
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'multi',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.educationStructure = 'schedule'
    values.sessionRound = 'multi'
    values.participantIndividual = true
    values.participantOrganization = false
    values.educationFormScheduleDetail = 'perSchedule'
    values.participationScheduleDetail = 'perSchedule'
    values.ipsScheduleDetail = 'perSchedule'
    values.scheduleDetails = [
      {
        scheduleLabel: '행사 일정 01',
        blockKind: 'event',
        name: '오리엔테이션',
        groupTimes: [{ startTime: '', endTime: '' }],
        scheduleDate: '26년 4월 20일(월)',
        assignmentEnabled: false,
        assignmentPeriod: '',
        educationForm: 'offline',
        participationMethod: 'team',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
      },
    ]
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    const saved = patch.generalCommonInfo?.scheduleDetails?.[0]
    expect(saved?.educationFormLabel).toBe('오프라인')
    expect(saved?.participationMethodLabel).toBe('팀')
    expect(saved?.ipsTypeSummary).toContain('Prepare')

    const merged: Program = {
      ...program,
      ...patch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    }
    const reloaded = programToGeneralCommonInfoEditValues(merged, sponsorContext)
    expect(reloaded.scheduleDetails[0]?.educationForm).toBe('offline')
    expect(reloaded.scheduleDetails[0]?.participationMethod).toBe('team')
    expect(reloaded.scheduleDetails[0]?.ipsCategory).toBe('prepare')
    expect(reloaded.scheduleDetails[0]?.ipsDetail).toBe('none')
  })
})
