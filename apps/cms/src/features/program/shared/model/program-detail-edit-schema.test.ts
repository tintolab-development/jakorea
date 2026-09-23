import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  detailEditValuesToProgramPatch,
  programDetailTrainedTeachersCommonInfoEditSchema,
  programToDetailEditValues,
} from './program-detail-edit-schema'

const program = {
  id: 'program-1',
  title: '기존 제목',
  category: 'school',
  type: 'offline',
  format: 'workshop',
  status: 'active',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  sponsorId: 'sponsor-1',
  managerName: '담당자',
  description: '설명',
  learningSupportContent: '지원',
  applicationStartDate: '2026-01-01',
  applicationEndDate: '2026-01-31',
  resultAnnouncementDate: '2026-02-01',
  resultAnnouncementMethod: '개별 안내',
  rounds: [],
  generalCommonInfo: {
    announcementTitle: '기존 공고명',
    detailedProgramName: '기존 세부명',
  },
} as Program

describe('program detail trained teachers boolean fields', () => {
  it('partnerInvolvement null 을 허용한다', () => {
    const values = {
      ...programToDetailEditValues(program),
      partnerInvolvement: null,
    }

    const result = programDetailTrainedTeachersCommonInfoEditSchema.safeParse(values)
    expect(result.success).toBe(true)
  })

  it('programToDetailEditValues 는 partnerInvolvement null 을 false 로 정규화한다', () => {
    const values = programToDetailEditValues({
      ...program,
      partnerInvolvement: null,
    } as unknown as Program)

    expect(values.partnerInvolvement).toBe(false)
  })
})

describe('programToDetailEditValues keeps stored common info in edit fields', () => {
  it('공고명·세부명·일정명·진행 시간·IPS 상세를 수정 폼에 채운다', () => {
    const values = programToDetailEditValues({
      ...program,
      id: '186034',
      title: '교육받은교사(수정4)',
      mainTitle: '대표명',
      textbookName: '사회공헌 프로젝트',
      sponsorId: '1627251',
      managerName: '백진혁',
      venue: '별관 301호',
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        announcementTitle: '교육받은교사(수정4)',
        detailedProgramName: '사회공헌 프로젝트',
        sponsorManagementIds: ['1627251'],
        venueDetail: '별관 301호',
        educationFormLabel: '오프라인',
        scheduleDetails: [
          {
            scheduleLabel: '세부 일정 01',
            name: '교육받은교사(수정3)',
            progressTimeSummary: '15:43 ~ 16:43',
            ipsTypeSummary: 'Inspire | Kick-Off event (킥오프 행사)',
          },
        ],
      },
    } as Program)

    expect(values.announcementTitle).toBe('교육받은교사(수정4)')
    expect(values.mainTitle).toBe('대표명')
    expect(values.detailedProgramName).toBe('사회공헌 프로젝트')
    expect(values.sponsorManagementIds).toEqual(['1627251'])
    expect(values.managerName).toBe('백진혁')
    expect(values.venueDetail).toBe('별관 301호')
    expect(values.educationStructure).toBe('schedule')
    expect(values.sessionRound).toBe('single')
    expect(values.educationForm).toBe('offline')
    expect(values.ipsCategory).toBe('inspire')
    expect(values.ipsDetail).toBe('kick_off_event')
  })

  it('루트 IPS가 없어도 일정 행의 IPS 문구로 수정 셀렉트를 채운다', () => {
    const values = programToDetailEditValues({
      ...program,
      generalCommonInfo: {
        scheduleDetails: [
          {
            scheduleLabel: '세부 일정 01',
            name: '교육받은교사(수정3)',
            ipsTypeSummary: 'Inspire | Kick-Off event (킥오프 행사)',
          },
        ],
      },
    } as Program)

    expect(values.ipsCategory).toBe('inspire')
    expect(values.ipsDetail).toBe('kick_off_event')
  })

  it('저장된 담당자가 미선택이면 수정 폼에도 미선택이 체크된다', () => {
    const values = programToDetailEditValues({
      ...program,
      managerName: '미선택',
      generalCommonInfo: {
        sponsorManagerContactIds: [],
        sponsorManagerLine: '미선택',
      },
    } as Program)

    expect(values.sponsorManagerContactIds).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
    expect(values.sponsorManagerContactId).toBe(SPONSOR_CONTACT_UNSELECTED_VALUE)
  })
})

describe('program detail title edit fields', () => {
  it('공고용 프로그램명과 세부 프로그램명을 title/textbookName과 섞지 않는다', () => {
    const values = {
      ...programToDetailEditValues({
        ...program,
        title: '대표명',
        mainTitle: '대표명',
        textbookName: '진짜 교재명',
        generalCommonInfo: {
          announcementTitle: '기존 공고명',
          detailedProgramName: '기존 세부명',
        },
      } as Program),
      announcementTitle: '수정 공고명',
      detailedProgramName: '수정 세부명',
    }

    const patch = detailEditValuesToProgramPatch(values, {
      ...program,
      title: '대표명',
      textbookName: '진짜 교재명',
    } as Program)

    expect(patch.title).toBe('대표명')
    expect(patch.mainTitle).toBe('대표명')
    expect(patch.textbookName).toBe('진짜 교재명')
    expect(patch.generalCommonInfo?.announcementTitle).toBe('수정 공고명')
    expect(patch.generalCommonInfo?.detailedProgramName).toBe('수정 세부명')
  })

  it('교육 장소 라디오(venueKind)를 generalCommonInfo에 저장하고 다시 로드한다', () => {
    const values = {
      ...programToDetailEditValues({
        ...program,
        institutionType: 'inside_school',
        generalCommonInfo: {
          ...program.generalCommonInfo,
          venueKind: 'inside',
          venueDetail: '본관',
        },
      }),
      venueKind: 'outside' as const,
      venueDetail: '외부 강의실',
    }
    const patch = detailEditValuesToProgramPatch(values, {
      ...program,
      institutionType: 'inside_school',
    })
    expect(patch.institutionType).toBe('outside_school')
    expect(patch.generalCommonInfo?.venueKind).toBe('outside')
    expect(patch.generalCommonInfo?.venueDetail).toBe('외부 강의실')

    const reloaded = programToDetailEditValues({
      ...program,
      ...patch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    } as Program)
    expect(reloaded.venueKind).toBe('outside')
    expect(reloaded.venueDetail).toBe('외부 강의실')
  })

  it('공고용명·세부명은 title/textbookName으로 채우지 않는다', () => {
    const values = programToDetailEditValues({
      ...program,
      title: '대표 프로그램명',
      mainTitle: '대표 프로그램명',
      textbookName: '필요와 욕구, 현명한 소비',
      generalCommonInfo: {},
    } as Program)

    expect(values.announcementTitle).toBeUndefined()
    expect(values.detailedProgramName).toBeUndefined()
  })

  it('대표 프로그램명 변경은 mainTitle만 바꾸고 관리명(title)은 유지한다', () => {
    const values = {
      ...programToDetailEditValues({
        ...program,
        title: '생성 당시명',
        mainTitle: '생성 당시명',
      } as Program),
      mainTitle: '수정1',
    }

    const patch = detailEditValuesToProgramPatch(values, {
      ...program,
      title: '생성 당시명',
      mainTitle: '생성 당시명',
    } as Program)

    expect(patch.title).toBe('생성 당시명')
    expect(patch.mainTitle).toBe('수정1')
  })

  it('UJAT는 대표명을 바꿔도 관리명(title)을 덮지 않는다', () => {
    const values = {
      ...programToDetailEditValues({
        ...program,
        title: '프로그램 관리명',
        mainTitle: '생성 당시 대표명',
        ujatProgressStatus: 'VOLUNTEER_RECRUITING',
      } as Program),
      mainTitle: '수정한 대표명',
    }

    const patch = detailEditValuesToProgramPatch(values, {
      ...program,
      title: '프로그램 관리명',
      mainTitle: '생성 당시 대표명',
      ujatProgressStatus: 'VOLUNTEER_RECRUITING',
    } as Program)

    expect(patch.title).toBe('프로그램 관리명')
    expect(patch.mainTitle).toBe('수정한 대표명')
  })
})

describe('trained teachers recruitment edit round-trip', () => {
  const ttProgram = {
    ...program,
    id: '186005',
    generalParticipantTypes: ['school_institution'],
    generalProgramAudience: 'organization',
    studentListRequired: 'not_required',
    applicationStartDate: '2026-08-01T00:00:00.000Z',
    applicationEndDate: '2026-08-31T00:00:00.000Z',
    startDate: '2026-09-01T00:00:00.000Z',
    endDate: '2026-11-30T00:00:00.000Z',
    resultAnnouncementDate: '2026-08-31T00:00:00.000Z',
    resultAnnouncementMethod: '담당교사 개별 안내',
    contactPhone: '010-8681-6741',
    contactEmail: 'bjh1234@tinto.co.kr',
    targetLevels: ['elementary'],
    educationTargetDetail: '초등학교 5~6학년',
    remarks: 'TCH-05 로컬 데모',
    generalCommonInfo: {
      participantRecruitmentInfo: {
        announcementPublished: true,
        announcementPublishedLabel: '게시',
        studentListRequired: 'not_required',
        studentListRequiredLabel: '제출 불필요',
        maxAssignableInstructors: 0,
        maxClassCount: 1,
        maxScheduleCount: 3,
        maxSessionsPerDay: 8,
        operationPeriodLabel: '2026-09-01 ~ 2026-11-30',
        recruitmentPeriodLabel: '2026-08-01 ~ 2026-08-31',
        finalAnnouncementLabel: '2026-08-31 | 담당교사 개별 안내',
        educationTarget: '초등',
        educationTargetDetail: '초등학교 5~6학년',
        inquiryTel: '010-8681-6741',
        inquiryEmail: 'bjh1234@tinto.co.kr',
        remarks: 'TCH-05 로컬 데모',
      },
    },
  } as Program

  it('수정 가능한 모집 필드를 조회 SSOT(participantRecruitmentInfo)에 반영한다', async () => {
    const { resolveGeneralProgramParticipantRecruitmentDisplay } = await import(
      '@/features/program/general/lib/participant-recruitment-display'
    )
    const values = {
      ...programToDetailEditValues(ttProgram),
      participantRecruitmentAnnouncementPublished: 'unpublished' as const,
      studentListRequired: 'required' as const,
      participantRecruitmentMaxClassCount: 6,
      participantRecruitmentMaxScheduleCount: 5,
      participantRecruitmentMaxSessionsPerDay: 4,
      applicationStartDate: '2026-10-01T00:00:00.000Z',
      applicationEndDate: '2026-10-31T00:00:00.000Z',
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: '2026-12-15T00:00:00.000Z',
      targetLevels: ['middle' as const],
      educationTargetDetail: '중학교 2학년',
      resultAnnouncementDate: '2026-11-02T00:00:00.000Z',
      resultAnnouncementMethod: '이메일 안내',
      contactPhone: '010-1111-2222',
      contactEmail: 'updated@tinto.co.kr',
      recruitmentContactOrganizationName: '수정문의처',
      remarks: '수정된 비고',
    }

    const patch = detailEditValuesToProgramPatch(values, ttProgram)
    const draft = {
      ...ttProgram,
      ...patch,
      generalCommonInfo: {
        ...ttProgram.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    } as Program

    const display = resolveGeneralProgramParticipantRecruitmentDisplay(draft)
    expect(display.announcementPublishedLabel).toBe('미게시')
    expect(display.studentListLabel).toBe('제출 필요')
    expect(display.maxClassLabel).toBe('6개')
    expect(display.maxScheduleCountLabel).toBe('5개')
    expect(display.maxSessionsPerDayLabel).toBe('4차시')
    expect(display.recruitmentPeriodLabel).toContain('2026. 10. 01')
    expect(display.operationPeriodLabel).toContain('2026. 11. 01')
    expect(display.targetLabel).toBe('중학교')
    expect(display.targetDetailLabel).toBe('중학교 2학년')
    expect(display.finalAnnouncementLabel).toContain('이메일 안내')
    expect(display.contactPhone).toBe('010-1111-2222')
    expect(display.contactEmail).toBe('updated@tinto.co.kr')
    expect(display.contactOrganizationName).toBe('수정문의처')
    expect(display.notes).toBe('수정된 비고')
    expect(draft.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors).toBe(0)
  })
})
