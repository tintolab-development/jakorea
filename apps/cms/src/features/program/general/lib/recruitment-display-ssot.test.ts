import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { resolveGeneralProgramParticipantRecruitmentDisplay } from './participant-recruitment-display'
import { resolveGeneralProgramInstructorRecruitmentDisplay } from './instructor-recruitment-display'
import { resolveGeneralProgramVolunteerRecruitmentDisplay } from './volunteer-recruitment-display'
import {
  applyGeneralRecruitOverlayToProgram,
  GENERAL_RECRUIT_OVERLAY_KEYS,
  resolveGeneralRecruitDetailDisplayProgram,
} from './general-recruit-overlay-to-program'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'

function commonOnlyProgram(): Program {
  return {
    id: 'general-common-only',
    title: '공통만 있는 프로그램',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '공통정보 프로그램 설명',
    recruitmentGuide: '공통 모집 안내',
    learningSupportContent: '공통 학습 지원',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    applicationStartDate: '2026-01-01T00:00:00.000Z',
    applicationEndDate: '2026-01-31T00:00:00.000Z',
    targetLevels: ['elementary'],
    targetLevel: 'elementary',
    district: '공통 교육대상 상세',
    contactPhone: '02-0000-0000',
    contactEmail: 'common@jakorea.org',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
  } as Program
}

describe('모집 정보 display — 공통정보 폴백 금지', () => {
  it('기관·날짜 지정 프로그램은 사업 기간이 있어도 최대 일정 수 필드를 노출하지 않는다', () => {
    const program = {
      ...commonOnlyProgram(),
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        educationScheduleMode: 'date',
      },
    } as Program
    const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)
    expect(display.showInstitutionApplicationLimits).toBe(true)
    expect(display.showMaxScheduleCountField).toBe(false)
    expect(display.showMaxSessionsPerDayField).toBe(false)
  })

  it('공통 Program 필드만 있으면 대상·기간·문의처는 -', () => {
    const program = commonOnlyProgram()
    const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)

    expect(display.targetLabel).toBe('-')
    expect(display.targetDetailLabel).toBe('-')
    expect(display.recruitmentPeriodLabel).toBe('-')
    expect(display.contactOrganizationName).toBe('-')
    expect(display.contactPhone).toBe('-')
    expect(display.contactEmail).toBe('-')
  })

  it('모집 overlay 병합 후에는 RecruitmentInfo 값을 표시', () => {
    const inst = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
    const merged = applyGeneralRecruitOverlayToProgram(
      commonOnlyProgram(),
      {
        [inst.targetLevels]: ['high'],
        [inst.targetLevelDetail]: '모집 양식 상세',
        [inst.recruitRangeSeal]: {
          start: '2025-12-08T00:00:00+09:00',
          end: '2026-01-16T00:00:00+09:00',
        },
        [inst.inquiryContact]: '모집 문의처',
        [inst.inquiryTel]: '02-6085-6028',
        [inst.inquiryEmail]: 'recruit@jakorea.org',
        [GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo.participantDescription]: '모집 양식 설명',
      },
      { preferOverlay: true }
    )

    const display = resolveGeneralProgramParticipantRecruitmentDisplay(merged)
    expect(display.targetLabel).toBe('고등학생')
    expect(display.targetDetailLabel).toBe('모집 양식 상세')
    expect(display.recruitmentPeriodLabel).toContain('2025')
    expect(display.contactOrganizationName).toBe('모집 문의처')
    expect(display.contactPhone).toBe('02-6085-6028')
    expect(display.contactEmail).toBe('recruit@jakorea.org')

    const detail = resolveGeneralRecruitDetailDisplayProgram(merged, 'participant')
    expect(detail.description).toBe('모집 양식 설명')
    expect(detail.learningSupportContent).toBe('공통 학습 지원')
  })

  it('참여자 프로그램 설명 — nested가 있으면 컬럼·overlay leftover보다 우선한다', () => {
    const program: Program = {
      ...commonOnlyProgram(),
      description: '바보도 들을 수 있음',
      recruitmentGuide: '바보들만 모집',
      learningSupportContent: '바보들에게 적극 지원',
      registrationOverlay: {
        [GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo.participantDescription]: 'overlay leftover',
      },
      generalCommonInfo: {
        participantRecruitmentInfo: {
          programDescription: '중첩 정본',
          recruitmentGuide: '중첩 모집 안내',
          learningSupportContent: '중첩 학습 지원',
        },
      },
    }
    const detail = resolveGeneralRecruitDetailDisplayProgram(program, 'participant')
    expect(detail.description).toBe('중첩 정본')
    expect(detail.recruitmentGuide).toBe('중첩 모집 안내')
    expect(detail.learningSupportContent).toBe('중첩 학습 지원')
  })

  it('최종 합격자 발표 — 날짜/방법 중 하나만 있어도 -로 사라지지 않는다', () => {
    // 회귀: resultAnnouncementDate가 없으면 resultAnnouncementMethod가 있어도
    // 전체 라벨이 undefined → '-' 로 노출되던 버그
    const methodOnly: Program = {
      ...commonOnlyProgram(),
      resultAnnouncementMethod: '홈페이지 공지 및 담당교사 개별 안내',
    }
    expect(
      resolveGeneralProgramParticipantRecruitmentDisplay(methodOnly).finalAnnouncementLabel
    ).toBe('홈페이지 공지 및 담당교사 개별 안내')

    const dateOnly: Program = {
      ...commonOnlyProgram(),
      resultAnnouncementDate: '2026-01-26T00:00:00.000Z',
    }
    expect(
      resolveGeneralProgramParticipantRecruitmentDisplay(dateOnly).finalAnnouncementLabel
    ).not.toBe('-')

    const both: Program = {
      ...commonOnlyProgram(),
      resultAnnouncementDate: '2026-01-26T00:00:00.000Z',
      resultAnnouncementMethod: '홈페이지 공지',
    }
    expect(
      resolveGeneralProgramParticipantRecruitmentDisplay(both).finalAnnouncementLabel
    ).toContain('홈페이지 공지')

    expect(
      resolveGeneralProgramParticipantRecruitmentDisplay(commonOnlyProgram())
        .finalAnnouncementLabel
    ).toBe('-')
  })

  it('문의처 — 같은 이름 별칭은 한 번만, 잘린 전화는 숨긴다', () => {
    const program: Program = {
      ...commonOnlyProgram(),
      generalCommonInfo: {
        participantRecruitmentInfo: {
          contactOrganizationName: '이하은',
          contactName: '이하은',
          inquiryTel: '03',
          contactEmail: 'lee@example.com',
        },
      },
    }
    const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)
    expect(display.contactOrganizationName).toBe('이하은')
    expect(display.contactPhone).toBe('-')
    expect(display.contactEmail).toBe('lee@example.com')
  })

  it('문의처 — 기관명과 담당자가 다르면 / 로 붙인다', () => {
    const program: Program = {
      ...commonOnlyProgram(),
      generalCommonInfo: {
        participantRecruitmentInfo: {
          contactOrganizationName: '로컬나눔은행',
          contactName: '백진혁',
        },
      },
    }
    expect(resolveGeneralProgramParticipantRecruitmentDisplay(program).contactOrganizationName).toBe(
      '로컬나눔은행 / 백진혁'
    )
  })

  it('문의처 — 수정된 성명과 옛 담당자 별칭은 붙이지 않는다', () => {
    const program: Program = {
      ...commonOnlyProgram(),
      generalCommonInfo: {
        participantRecruitmentInfo: {
          contactOrganizationName: '황유정',
          contactName: '최수아',
        },
      },
    }
    expect(resolveGeneralProgramParticipantRecruitmentDisplay(program).contactOrganizationName).toBe(
      '황유정'
    )
  })

  it('참여기관 운영 기간 표시는 옛 operationPeriodLabel보다 모집 행 날짜를 쓴다', () => {
    const program: Program = {
      ...commonOnlyProgram(),
      generalParticipantTypes: ['school_institution'],
      generalProgramAudience: 'organization',
      programRecruitments: [
        {
          id: 186603,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          operationStartDate: '2026-11-18',
          operationEndDate: '2026-12-25',
        },
      ],
      generalCommonInfo: {
        participantRecruitmentInfo: {
          operationPeriodLabel: '2026-11-11 ~ 2026-12-25',
        },
      },
    }
    const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)
    expect(display.operationPeriodLabel).toContain('2026.11.18')
    expect(display.operationPeriodLabel).not.toContain('11. 11')
  })

  it('교육받은 교사 — 프로그램 컬럼만 있으면 대상·기간·문의처는 -', () => {
    const program: Program = {
      ...commonOnlyProgram(),
      id: '186005',
      backendProgramType: 'TRAINED_TEACHER',
      generalParticipantTypes: ['school_institution'],
      generalProgramAudience: 'organization',
    }
    const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)
    expect(display.targetLabel).toBe('-')
    expect(display.targetDetailLabel).toBe('-')
    expect(display.recruitmentPeriodLabel).toBe('-')
    expect(display.operationPeriodLabel).toBe('-')
    expect(display.contactOrganizationName).toBe('-')
    expect(display.contactPhone).toBe('-')
    expect(display.contactEmail).toBe('-')
  })

  it('교육받은 교사 — 모집 행 문의처가 있으면 nested·컬럼과 달라도 행을 표시한다', () => {
    const program: Program = {
      ...commonOnlyProgram(),
      id: '186546',
      backendProgramType: 'TRAINED_TEACHER',
      contactName: '컬럼담당',
      contactPhone: '02-0000-0000',
      contactEmail: 'column@jakorea.org',
      generalParticipantTypes: ['school_institution'],
      programRecruitments: [
        {
          id: 187105,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          startAt: '2026-11-30T15:00:00Z',
          endAt: '2026-12-13T15:00:00Z',
          operationStartDate: '2026-11-28',
          operationEndDate: '2026-12-31',
          contactName: '이하은',
          contactPhone: '031-234-5678',
          contactEmail: 'recruit@jakorea.org',
          remarks: '일정은 학교 사정에 따라 조율할 수 있습니다.',
          applicationFormBindingId: 190427,
        },
      ],
      generalCommonInfo: {
        participantRecruitmentInfo: {
          contactOrganizationName: 'nested담당',
          inquiryTel: '02-111-1111',
          inquiryEmail: 'nested@jakorea.org',
          operationPeriodLabel: '2026.12.01(화) ~ 2026.12.30(수)',
          recruitmentPeriodLabel: '잘못된 라벨',
        },
      },
    }
    const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)
    expect(display.contactOrganizationName).toBe('이하은')
    expect(display.contactPhone).toBe('031-234-5678')
    expect(display.contactEmail).toBe('recruit@jakorea.org')
    expect(display.operationPeriodLabel).toContain('2026.11.28')
    expect(display.operationPeriodLabel).toContain('2026.12.31')
    expect(display.operationPeriodLabel).not.toContain('12.30')
    expect(display.recruitmentPeriodLabel).toContain('2026.12.01')
    expect(display.recruitmentPeriodLabel).toContain('2026.12.14')
  })

  it('교육받은 교사 — 모집 행 문의처가 null이면 nested·컬럼으로 채우지 않는다', () => {
    const program: Program = {
      ...commonOnlyProgram(),
      id: '186546',
      backendProgramType: 'TRAINED_TEACHER',
      contactName: '이하은',
      contactPhone: '031-234-5678',
      contactEmail: 'recruit@jakorea.org',
      remarks: '컬럼 비고',
      generalParticipantTypes: ['school_institution'],
      programRecruitments: [
        {
          id: 187105,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          startAt: '2026-11-30T15:00:00Z',
          endAt: '2026-12-13T15:00:00Z',
          operationStartDate: '2026-11-28',
          operationEndDate: '2026-12-31',
          contactName: null,
          contactPhone: null,
          contactEmail: null,
          remarks: '일정은 학교 사정에 따라 조율할 수 있습니다.',
        },
      ],
      generalCommonInfo: {
        participantRecruitmentInfo: {
          contactOrganizationName: '이하은',
          inquiryTel: '031-234-5678',
          inquiryEmail: 'recruit@jakorea.org',
          remarks: 'nested 비고',
          operationPeriodLabel: '2026.12.01(화) ~ 2026.12.30(수)',
          recruitmentPeriodLabel: '2026.12.01(화) ~ 2026.12.14(월)',
        },
      },
    }
    const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)
    expect(display.contactOrganizationName).toBe('-')
    expect(display.contactPhone).toBe('-')
    expect(display.contactEmail).toBe('-')
    expect(display.notes).toBe('일정은 학교 사정에 따라 조율할 수 있습니다.')
    expect(display.operationPeriodLabel).toContain('2026.11.28')
    expect(display.operationPeriodLabel).toContain('2026.12.31')
    expect(display.operationPeriodLabel).not.toContain('12.01')
    expect(display.recruitmentPeriodLabel).toContain('2026.12.01')
  })

  it('모집 행 문구는 nested RecruitmentInfo만 쓰고 공통 Program 필드로 채우지 않는다', () => {
    const program = {
      ...commonOnlyProgram(),
      description: undefined,
      recruitmentGuide: undefined,
      learningSupportContent: undefined,
      applicationMethod: undefined,
      generalCommonInfo: {
        participantRecruitmentInfo: {
          programDescription: '참여자 설명',
          recruitmentGuide: '참여자 안내',
          applicationMethod: null,
          learningSupportContent: null,
          additionalContentHtml: null,
          remarks: null,
        },
        instructorRecruitmentInfo: {
          programDescription: null,
          recruitmentGuide: '강사 안내',
          applicationMethod: '강사 신청 방법',
          learningSupportContent: '강사 학습',
          additionalContentHtml: null,
          remarks: null,
        },
      },
    } as unknown as Program
    const participant = resolveGeneralRecruitDetailDisplayProgram(program, 'participant')
    const instructor = resolveGeneralRecruitDetailDisplayProgram(program, 'instructor')
    expect(participant.recruitmentGuide).toBe('참여자 안내')
    expect(participant.description).toBe('참여자 설명')
    expect(participant.learningSupportContent).toBeUndefined()
    expect(instructor.recruitmentGuide).toBe('강사 안내')
    expect(instructor.description).toBeUndefined()
    expect(instructor.applicationMethod).toBe('강사 신청 방법')
    expect(instructor.learningSupportContent).toBe('강사 학습')
  })

  it('강사·봉사자도 공통 폴백 없이 -', () => {
    const program = commonOnlyProgram()
    expect(resolveGeneralProgramInstructorRecruitmentDisplay(program).instructorTargetLabel).toBe(
      '-'
    )
    expect(resolveGeneralProgramInstructorRecruitmentDisplay(program).recruitmentPeriodLabel).toBe(
      '-'
    )
    expect(resolveGeneralProgramVolunteerRecruitmentDisplay(program).volunteerTargetLabel).toBe('-')
    expect(resolveGeneralProgramVolunteerRecruitmentDisplay(program).recruitmentPeriodLabel).toBe(
      '-'
    )
  })

  it('참여자·강사·봉사자 현황은 모집 행 기간 라벨을 사용한다', () => {
    const program: Program = {
      ...commonOnlyProgram(),
      lifecycleStatus: 'recruiting_students',
      programRecruitments: [
        {
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          startAt: '2099-01-01T00:00:00.000Z',
          endAt: '2099-01-31T00:00:00.000Z',
        },
        {
          recruitmentType: 'INSTRUCTOR',
          applicationType: 'INSTRUCTOR',
          startAt: '2099-02-01T00:00:00.000Z',
          endAt: '2099-02-28T00:00:00.000Z',
        },
        {
          recruitmentType: 'VOLUNTEER',
          applicationType: 'VOLUNTEER',
          startAt: '2099-03-01T00:00:00.000Z',
          endAt: '2099-03-31T00:00:00.000Z',
        },
      ],
    }

    expect(resolveGeneralProgramParticipantRecruitmentDisplay(program).recruitmentStatusLabel).toBe(
      '참여자 모집 예정'
    )
    expect(resolveGeneralProgramInstructorRecruitmentDisplay(program).recruitmentStatusLabel).toBe(
      '강사 모집 예정'
    )
    expect(resolveGeneralProgramVolunteerRecruitmentDisplay(program).recruitmentStatusLabel).toBe(
      '봉사자 모집 예정'
    )
  })
})
