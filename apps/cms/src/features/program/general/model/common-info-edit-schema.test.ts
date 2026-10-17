import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  displaySessionIpsTypeSummary,
  encodeSponsorManagerContactRef,
  retainSponsorManagerContactIdsForSponsors,
  generalProgramCommonInfoEditSchema,
  generalCommonInfoEditValuesToProgramPatch,
  overlayIpsIndexForScheduleDetail,
  persistScheduleEducationFormByDetailOverlay,
  EDUCATION_SCHEDULE_CLOCK_REQUIRED_MESSAGE,
  PRE_EDUCATION_SCHEDULE_REQUIRED_MESSAGE,
  programToGeneralCommonInfoEditValues,
  resolveScheduleDetailEducationFormLabelForView,
  resolveScheduleDetailIpsTypeSummaryForView,
  resolveScheduleDetailProgressTimeSummaryForView,
  resolveScheduleDetailScheduleDateLabelForView,
  buildScheduleProgressTimeSummary,
  formatScheduleProgressTimeSummaryForView,
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
  it('대표 프로그램명 변경은 title과 mainTitle에 함께 반영한다', () => {
    const program = baseProgram()
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.mainTitle = '수정1'
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(patch.title).toBe('수정1')
    expect(patch.mainTitle).toBe('수정1')
  })

  it('커리큘럼→일정 전환 시 generalCommonInfo의 BE 미러 detailedProgramId를 제거한다', () => {
    const program = baseProgram({
      detailedProgramId: '163006',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        detailedProgramName: '커리큘럼 세부명',
      },
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.educationStructure = 'schedule'
    values.sessionRound = 'single'
    values.detailedProgramId = '__detailed_program_none__'
    values.scheduleDetails = [
      {
        scheduleLabel: '세부 일정 01',
        name: '일정 A',
        blockKind: 'sub',
        scheduleDate: '',
        groupTimes: [{ startTime: '20:28', endTime: '21:28' }],
        educationForm: 'offline',
        participationMethod: 'individual',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
      },
    ]
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(patch.detailedProgramId).toBeUndefined()
    expect(patch.generalCommonInfo).toBeDefined()
    expect(
      Object.prototype.hasOwnProperty.call(patch.generalCommonInfo, 'detailedProgramId')
    ).toBe(false)
  })

  it('참여 방식(팀) 저장 후 다시 로드하면 팀으로 유지된다', () => {
    const program = baseProgram({
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.participantOrganization = false
    values.participantIndividual = true
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

  it('기관 프로그램은 participationMethod를 저장하지 않는다', () => {
    const program = baseProgram()
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.participantOrganization = true
    values.participantIndividual = false
    values.participationMethod = 'individual'
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(patch.generalCommonInfo?.participationMethod).toBeUndefined()
  })

  it('후원사를 모두 지우면 남아 있던 담당자 선택을 비운다', () => {
    const kept = retainSponsorManagerContactIdsForSponsors(
      [],
      [
        encodeSponsorManagerContactRef('sponsor-a', 'contact-1'),
        SPONSOR_CONTACT_UNSELECTED_VALUE,
      ]
    )
    expect(kept).toEqual([])
  })

  it('일부 후원사만 지우면 남은 후원사의 담당자는 유지한다', () => {
    const keptRef = encodeSponsorManagerContactRef('sponsor-b', 'contact-2')
    const kept = retainSponsorManagerContactIdsForSponsors(
      ['sponsor-b'],
      [encodeSponsorManagerContactRef('sponsor-a', 'contact-1'), keptRef]
    )
    expect(kept).toEqual([keptRef])
  })

  it('후원사 선택 시 sponsorId를 1순위 관리 id로 동기화한다', () => {
    const program = baseProgram()
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.sponsorManagementIds = ['sponsor-new']
    values.sponsorManagerContactIds = [
      encodeSponsorManagerContactRef('sponsor-new', 'contact-1'),
    ]
    values.sponsorManagerContactId = encodeSponsorManagerContactRef('sponsor-new', 'contact-1')
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(patch.sponsorId).toBe('sponsor-new')
    expect(patch.managerName).toBe('김담당')
    expect(patch.contactPhone).toBe('010-0000-0000')
  })

  it('저장된 담당자가 미선택이면 수정 폼에도 미선택이 체크된다', () => {
    const program = baseProgram({
      managerName: '미선택',
      generalCommonInfo: {
        announcementTitle: '공고 프로그램명',
        sponsorManagementIds: ['sponsor-old'],
        sponsorManagementId: 'sponsor-old',
        sponsorManagerContactIds: [],
        sponsorManagerLine: '미선택',
        participationMethod: 'individual',
      },
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    expect(values.sponsorManagerContactIds).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
    expect(values.sponsorManagerContactId).toBe(SPONSOR_CONTACT_UNSELECTED_VALUE)
  })

  it('담당자 미해석 시 GET 마스킹 managerName/contactPhone을 patch에 넣지 않는다', () => {
    const program = baseProgram({
      managerName: '김*원',
      contactPhone: '010-****-7253',
    })
    const values = programToGeneralCommonInfoEditValues(program, {
      sponsors: sponsorContext.sponsors,
      contactsBySponsorId: {},
    })
    values.sponsorManagerContactIds = []
    values.sponsorManagerContactId = ''
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, {
      sponsors: sponsorContext.sponsors,
      contactsBySponsorId: {},
    })
    expect(patch).not.toHaveProperty('managerName')
    expect(patch).not.toHaveProperty('contactPhone')
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
    expect(patch.generalCommonInfo?.scheduleDetails).toEqual([])
  })

  it('일정형 단일 회차도 사전 교육을 저장한다', () => {
    const program = baseProgram({
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.educationStructure = 'schedule'
    values.sessionRound = 'single'
    values.scheduleCurriculumPreEducation = true
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(patch.generalCommonInfo?.scheduleCurriculumPreEducation).toBe(true)
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
        scheduleDate: '26년 4월 20일(월) 9:30 ~ 12:20',
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

  it('커리큘럼형 개인 사전 교육은 진행 일정을 저장 후 다시 로드한다', () => {
    const program = baseProgram({
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.educationStructure = 'curriculum'
    values.sessionRound = 'single'
    values.participantIndividual = true
    values.participantOrganization = false
    values.scheduleCurriculumPreEducation = true
    values.educationFormScheduleDetail = 'perSchedule'
    values.ipsScheduleDetail = 'perSchedule'
    values.curriculumSessions = [
      {
        sessionLabel: '사전 교육',
        title: '사전 워크숍',
        description: '',
        scheduleDate: '26년 4월 20일(월) 9:30 ~ 12:20',
        assignmentEnabled: false,
        assignmentPeriod: '',
        educationForm: 'offline',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
      },
      {
        sessionLabel: '1차시',
        title: '단원',
        description: '내용',
        assignmentEnabled: false,
        assignmentPeriod: '',
        educationForm: 'online',
        ipsCategory: 'inspire',
        ipsDetail: '',
      },
    ]
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    const saved = patch.generalCommonInfo?.curriculumSessions?.[0]
    expect(patch.generalCommonInfo?.scheduleCurriculumPreEducation).toBe(true)
    expect(saved?.sessionLabel).toBe('사전 교육')
    expect(saved?.title).toBe('사전 워크숍')
    expect(saved?.scheduleDateLabel).toBe('26년 4월 20일(월) 9:30 ~ 12:20')
    expect(saved?.educationFormLabel).toBe('오프라인')

    const merged: Program = {
      ...program,
      ...patch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    }
    const reloaded = programToGeneralCommonInfoEditValues(merged, sponsorContext)
    expect(reloaded.curriculumSessions[0]?.scheduleDate).toBe('26년 4월 20일(월) 9:30 ~ 12:20')
    expect(reloaded.curriculumSessions[0]?.educationForm).toBe('offline')
    expect(reloaded.curriculumSessions[0]?.title).toBe('사전 워크숍')
  })

  it('커리큘럼형 복수 회차 개인 참여 방식을 회차별로 저장 후 다시 로드한다', () => {
    const program = baseProgram({
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'multi',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.educationStructure = 'curriculum'
    values.sessionRound = 'multi'
    values.participantIndividual = true
    values.participantOrganization = false
    values.educationFormScheduleDetail = 'perSchedule'
    values.participationScheduleDetail = 'perSchedule'
    values.ipsScheduleDetail = 'perSchedule'
    values.curriculumSessions = [
      {
        sessionLabel: '1회차',
        title: '1',
        description: '내용',
        assignmentEnabled: false,
        assignmentPeriod: '',
        educationForm: 'online',
        participationMethod: 'team',
        ipsCategory: 'inspire',
        ipsDetail: '',
      },
    ]
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    const saved = patch.generalCommonInfo?.curriculumSessions?.[0]
    expect(saved?.educationFormLabel).toBe('온라인')
    expect(saved?.participationMethodLabel).toBe('팀')
    expect(saved?.ipsTypeSummary).toContain('Inspire')

    const merged: Program = {
      ...program,
      ...patch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    }
    const reloaded = programToGeneralCommonInfoEditValues(merged, sponsorContext)
    expect(reloaded.curriculumSessions[0]?.participationMethod).toBe('team')
    expect(reloaded.curriculumSessions[0]?.educationForm).toBe('online')
  })

  it('일정형 개인 사전 교육 일정명을 저장 후 다시 로드한다', () => {
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
    values.scheduleCurriculumPreEducation = true
    values.scheduleDetails = [
      {
        scheduleLabel: '사전 교육',
        blockKind: 'preEducation',
        name: '사전 워크숍',
        groupTimes: [{ startTime: '', endTime: '' }],
        scheduleDate: '26년 4월 20일(월) 9:30 ~ 12:20',
        assignmentEnabled: false,
        assignmentPeriod: '',
        educationForm: 'online',
        participationMethod: 'individual',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
      },
    ]
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    const saved = patch.generalCommonInfo?.scheduleDetails?.[0]
    expect(saved?.scheduleLabel).toBe('사전 교육')
    expect(saved?.name).toBe('사전 워크숍')

    const merged: Program = {
      ...program,
      ...patch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    }
    const reloaded = programToGeneralCommonInfoEditValues(merged, sponsorContext)
    expect(reloaded.scheduleDetails[0]?.name).toBe('사전 워크숍')
  })

  it('일정형 사전 교육 교육 형태는 공통이어도 저장 후 다시 로드한다', () => {
    const program = baseProgram({
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.educationStructure = 'schedule'
    values.sessionRound = 'single'
    values.educationFormScheduleDetail = 'common'
    values.educationForm = 'online'
    values.scheduleCurriculumPreEducation = true
    values.scheduleDetails = [
      {
        scheduleLabel: '사전 교육',
        blockKind: 'preEducation',
        name: '사전 교육',
        groupTimes: [{ startTime: '', endTime: '' }],
        scheduleDate: '26년 4월 20일(월) 9:30 ~ 12:20',
        assignmentEnabled: false,
        assignmentPeriod: '',
        educationForm: 'offline',
        participationMethod: 'individual',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
      },
    ]
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(patch.generalCommonInfo?.scheduleDetails?.[0]?.educationFormLabel).toBe('오프라인')

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
  })

  it('일정형 사전 교육은 진행 일정이 없으면 검증 실패한다', () => {
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
    values.scheduleCurriculumPreEducation = true
    values.scheduleDetails = [
      {
        scheduleLabel: '사전 교육',
        blockKind: 'preEducation',
        name: '사전 워크숍',
        groupTimes: [{ startTime: '', endTime: '' }],
        scheduleDate: '',
        assignmentEnabled: false,
        assignmentPeriod: '',
        educationForm: 'online',
        participationMethod: 'individual',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
      },
    ]
    const result = generalProgramCommonInfoEditSchema.safeParse(values)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(
      result.error.issues.some(
        issue =>
          issue.path.includes('scheduleDate') &&
          issue.message === PRE_EDUCATION_SCHEDULE_REQUIRED_MESSAGE
      )
    ).toBe(true)
  })

  it('일정형 사전 교육 — 진행 일정에 시각이 없으면 검증 실패한다', () => {
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
    values.scheduleCurriculumPreEducation = true
    values.scheduleDetails = [
      {
        scheduleLabel: '사전 교육',
        blockKind: 'preEducation',
        name: '사전 워크숍',
        groupTimes: [{ startTime: '', endTime: '' }],
        scheduleDate: '26년 4월 20일(월)',
        assignmentEnabled: false,
        assignmentPeriod: '',
        educationForm: 'online',
        participationMethod: 'individual',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
      },
    ]
    const result = generalProgramCommonInfoEditSchema.safeParse(values)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(
      result.error.issues.some(
        issue =>
          issue.path.includes('scheduleDate') &&
          issue.message === EDUCATION_SCHEDULE_CLOCK_REQUIRED_MESSAGE
      )
    ).toBe(true)
  })

  it('커리큘럼형 사전 교육 — 진행 일정에 시각이 없으면 검증 실패한다', () => {
    const program = baseProgram({
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.educationStructure = 'curriculum'
    values.sessionRound = 'single'
    values.participantIndividual = true
    values.participantOrganization = false
    values.scheduleCurriculumPreEducation = true
    values.curriculumSessions = [
      {
        sessionLabel: '사전 교육',
        title: '사전 워크숍',
        description: '',
        scheduleDate: '26년 4월 20일(월)',
        assignmentEnabled: false,
        assignmentPeriod: '',
        educationForm: 'offline',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
      },
    ]
    const result = generalProgramCommonInfoEditSchema.safeParse(values)
    expect(result.success).toBe(false)
    if (result.success) return
    expect(
      result.error.issues.some(
        issue =>
          issue.path.join('.') === 'curriculumSessions.0.scheduleDate' &&
          issue.message === EDUCATION_SCHEDULE_CLOCK_REQUIRED_MESSAGE
      )
    ).toBe(true)
  })

  it('기관 프로그램은 커리큘럼 회차 과제 설정을 저장하지 않는다', () => {
    const program = baseProgram({
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'multi',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.educationStructure = 'curriculum'
    values.sessionRound = 'multi'
    values.participantIndividual = false
    values.participantOrganization = true
    values.curriculumSessions = [
      {
        sessionLabel: '1회차',
        title: '1',
        description: '내용',
        assignmentEnabled: true,
        assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
        educationForm: 'online',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
      },
    ]
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    const saved = patch.generalCommonInfo?.curriculumSessions?.[0]
    expect(saved?.assignmentEnabled).toBe(false)
    expect(saved?.assignmentPeriod).toBeUndefined()
  })

  it('교육 장소 라디오(venueKind)를 generalCommonInfo에 저장하고 다시 로드한다', () => {
    const program = baseProgram({
      institutionType: 'inside_school',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        venueKind: 'inside',
        venueDetail: '본관 3층',
      },
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.venueKind = 'outside'
    values.venueDetail = '외부 강의실'
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(patch.institutionType).toBe('outside_school')
    expect(patch.generalCommonInfo?.venueKind).toBe('outside')
    expect(patch.generalCommonInfo?.venueDetail).toBe('외부 강의실')

    const merged: Program = {
      ...program,
      ...patch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    }
    const reloaded = programToGeneralCommonInfoEditValues(merged, sponsorContext)
    expect(reloaded.venueKind).toBe('outside')
    expect(reloaded.venueDetail).toBe('외부 강의실')
  })

  it('교육 장소 라디오만 바꿔도 기존 venueKind 잔존값에 덮어쓰지 않는다', () => {
    const program = baseProgram({
      institutionType: 'inside_school',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        venueKind: 'inside',
        venueDetail: '본관 3층',
      },
    })
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.venueKind = 'other'
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(patch.institutionType).toBeUndefined()
    expect(patch.generalCommonInfo?.venueKind).toBe('other')
    expect(patch.generalCommonInfo?.venueDetail).toBe('본관 3층')
  })

  it('지급 항목은 옵션 라벨로 저장되고 비어 있으면 해당없음이다', () => {
    const program = baseProgram()
    const values = programToGeneralCommonInfoEditValues(program, sponsorContext)
    values.wagePaymentItemIds = ['pay-1', 'pay-2']
    const patch = generalCommonInfoEditValuesToProgramPatch(
      values,
      program,
      sponsorContext,
      undefined,
      [
        { value: 'pay-1', label: '교통비(일반)' },
        { value: 'pay-2', label: '숙박비' },
      ]
    )
    expect(patch.generalCommonInfo?.paymentItems).toBe('교통비(일반), 숙박비')

    values.wagePaymentItemIds = []
    const emptyPatch = generalCommonInfoEditValuesToProgramPatch(values, program, sponsorContext)
    expect(emptyPatch.generalCommonInfo?.paymentItems).toBe('해당없음')
  })
})

describe('일정형 일정별 IPS 조회 표시', () => {
  it('일정 공통/별 접두를 제거하고 카테고리 | 세부만 남긴다', () => {
    expect(
      displaySessionIpsTypeSummary('일정 별 상이 | Inspire | Kick-Off event (킥오프 행사)')
    ).toBe('Inspire | Kick-Off event (킥오프 행사)')
    expect(displaySessionIpsTypeSummary('Prepare | 해당없음')).toBe('Prepare | 해당없음')
    expect(displaySessionIpsTypeSummary(undefined)).toBe('-')
  })

  it('사전 교육은 overlay 0, 본 일정은 1부터다', () => {
    expect(
      overlayIpsIndexForScheduleDetail(
        [{ scheduleLabel: '세부 일정 01' }, { scheduleLabel: '세부 일정 02' }],
        0
      )
    ).toBe(1)
    expect(
      overlayIpsIndexForScheduleDetail(
        [{ scheduleLabel: '사전 교육' }, { scheduleLabel: '세부 일정 01' }],
        0
      )
    ).toBe(0)
    expect(
      overlayIpsIndexForScheduleDetail(
        [{ scheduleLabel: '사전 교육' }, { scheduleLabel: '세부 일정 01' }],
        1
      )
    ).toBe(1)
  })

  it('행 요약이 없으면 overlay 일정별 IPS로 보완한다', () => {
    expect(
      resolveScheduleDetailIpsTypeSummaryForView({
        ipsPerSchedule: false,
        ipsTypeSummary: 'Prepare | 해당없음',
        overlayIndex: 1,
      })
    ).toBeUndefined()
    expect(
      resolveScheduleDetailIpsTypeSummaryForView({
        ipsPerSchedule: true,
        ipsTypeSummary: '일정 별 상이 | Succeed | Competition (대회+시상)',
        overlayIndex: 1,
      })
    ).toBe('Succeed | Competition (대회+시상)')
    expect(
      resolveScheduleDetailIpsTypeSummaryForView({
        ipsPerSchedule: true,
        overlay: {
          'generalRegistration.educationScheduleCurriculum.ipsByDetailIndex': {
            1: { category: 'inspire', detail: 'kick_off_event' },
          },
        },
        overlayIndex: 1,
      })
    ).toBe('Inspire | Kick-Off event (킥오프 행사)')
  })

  it('진행 시간 요약이 없으면 overlay groupTimes로 보완한다', () => {
    expect(
      resolveScheduleDetailProgressTimeSummaryForView({
        overlay: {
          'generalRegistration.educationScheduleCurriculum.groupTimesByDetail': {
            1: [
              { startTime: '09:30', endTime: '10:40' },
              { startTime: '13:00', endTime: '14:10' },
            ],
          },
        },
        overlayIndex: 1,
      })
    ).toBe('그룹 A : 09:30 ~ 10:40 | 그룹 B : 13:00 ~ 14:10')
  })

  it('overlay groupTimes가 1개면 그룹 라벨 없이 진행 시간을 만든다', () => {
    expect(
      resolveScheduleDetailProgressTimeSummaryForView({
        overlay: {
          'generalRegistration.educationScheduleCurriculum.groupTimesByDetail': {
            0: [{ startTime: '15:43', endTime: '16:43' }],
          },
        },
        overlayIndex: 0,
      })
    ).toBe('15:43 ~ 16:43')
  })

  it('진행 일정 라벨이 없으면 overlay scheduleDateByDetailIso로 보완한다', () => {
    expect(
      resolveScheduleDetailScheduleDateLabelForView({
        overlay: {
          'generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso': {
            1: '2026-04-20T00:00:00.000Z',
          },
        },
        overlayIndex: 1,
      })
    ).toMatch(/26년 4월 20일\(/)
  })

  it('사전 교육 교육 형태는 overlay 0번으로 보완한다', () => {
    expect(
      resolveScheduleDetailEducationFormLabelForView({
        overlay: {
          'generalRegistration.educationScheduleCurriculum.educationFormByDetail': {
            0: 'offline',
          },
        },
        overlayIndex: 0,
      })
    ).toBe('오프라인')
  })

  it('scheduleDetails 교육 형태를 overlay educationFormByDetail에 넣는다', () => {
    const overlay = persistScheduleEducationFormByDetailOverlay(undefined, [
      { scheduleLabel: '사전 교육', educationFormLabel: '오프라인' },
      { scheduleLabel: '세부 일정 01', educationFormLabel: '온라인' },
    ])
    expect(
      overlay?.['generalRegistration.educationScheduleCurriculum.educationFormByDetail']
    ).toEqual({
      0: 'offline',
      1: 'online',
    })
  })
})

describe('진행 시간 요약 표기', () => {
  it('buildScheduleProgressTimeSummary — 그룹 1개는 시간만', () => {
    expect(
      buildScheduleProgressTimeSummary([{ startTime: '09:30', endTime: '10:40' }])
    ).toBe('09:30 ~ 10:40')
  })

  it('buildScheduleProgressTimeSummary — 그룹 2개 이상은 A/B 라벨', () => {
    expect(
      buildScheduleProgressTimeSummary([
        { startTime: '09:30', endTime: '10:40' },
        { startTime: '13:00', endTime: '14:10' },
      ])
    ).toBe('그룹 A : 09:30 ~ 10:40 | 그룹 B : 13:00 ~ 14:10')
  })

  it('formatScheduleProgressTimeSummaryForView — 저장값에 그룹 A 1개만 있어도 라벨 제거', () => {
    expect(formatScheduleProgressTimeSummaryForView('그룹 A : 15:43 ~ 16:43')).toBe(
      '15:43 ~ 16:43'
    )
  })
})
