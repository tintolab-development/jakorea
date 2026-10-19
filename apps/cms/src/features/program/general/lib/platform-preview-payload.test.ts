import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  buildGeneralProgramPortalPreview,
  resolveGeneralPreviewProgramType,
} from './platform-preview-payload'

function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '4021',
    sponsorId: 'sp-1',
    title: '특별한 JOB담',
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: [],
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    applicationStartDate: '2026-09-01',
    applicationEndDate: '2026-09-20',
    status: 'active',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
    ...overrides,
  } as Program
}

describe('resolveGeneralPreviewProgramType', () => {
  it('prefers the stored backend type', () => {
    expect(resolveGeneralPreviewProgramType(makeProgram({ backendProgramType: 'trained_teacher' }))).toBe(
      'TRAINED_TEACHER'
    )
  })

  it('detects 1사1교 and trained teachers without a stored type', () => {
    expect(resolveGeneralPreviewProgramType(makeProgram({ id: '170001' }))).toBe('COMPANY_SCHOOL')
    expect(resolveGeneralPreviewProgramType(makeProgram({ id: '186001' }))).toBe('TRAINED_TEACHER')
  })

  it('falls back to the audience split', () => {
    expect(resolveGeneralPreviewProgramType(makeProgram({ generalProgramAudience: 'individual' }))).toBe(
      'GENERAL_INDIVIDUAL'
    )
    expect(resolveGeneralPreviewProgramType(makeProgram())).toBe('GENERAL_ORGANIZATION')
  })
})

describe('buildGeneralProgramPortalPreview', () => {
  it('maps the participant tab of an organization program', () => {
    const detail = buildGeneralProgramPortalPreview({
      audience: 'institutions',
      sponsorName: '한국씨티은행',
      program: makeProgram({
        businessArea: '기업가정신',
        targetLevels: ['high', 'university'],
        generalProgramEducationStructure: 'curriculum',
        generalCommonInfo: {
          announcementTitle: '2026 특별한 JOB담 모집',
          educationFormLabel: '온라인',
          curriculumSessions: [
            { sessionLabel: '1회차', title: '진로 탐색', description: '멘토링' },
            { sessionLabel: '2회차', title: '', description: '' },
          ],
          participantRecruitmentInfo: {
            programDescription: '프로그램 소개',
            recruitmentGuide: '모집 안내',
            preEducationNoticeRequired: false,
            inquiryTel: '02-000-0000',
            contactOrganizationName: 'JA Korea',
            remarks: '비고',
          },
        },
      }),
    })

    expect(detail).toMatchObject({
      programId: 4021,
      programType: 'GENERAL_ORGANIZATION',
      portalCategories: ['ORGANIZATION'],
      title: '2026 특별한 JOB담 모집',
      summary: '프로그램 소개',
      operationMethod: 'ONLINE',
      businessStartDate: '2026-10-01T00:00:00',
      businessField: '기업가정신',
      applicationTargetMode: 'ORGANIZATION',
      contactName: 'JA Korea',
      contactPhone: '02-000-0000',
      recruitmentGuide: '모집 안내',
      preEducationNoticeRequired: false,
      remarks: '비고',
      educationTargets: ['high', 'university'],
      sponsorNames: ['한국씨티은행'],
      recruitments: [
        {
          recruitmentType: 'PARTICIPANT',
          targetType: 'ORGANIZATION',
          preEducationNoticeRequired: false,
          startAt: '2026-09-01T00:00:00',
          endAt: '2026-09-20T00:00:00',
        },
      ],
      curricula: [{ sessions: [{ sessionNo: 1, title: '진로 탐색', content: '멘토링' }] }],
    })
  })

  it('maps the instructor tab to an instructor recruitment', () => {
    const detail = buildGeneralProgramPortalPreview({
      audience: 'instructors',
      program: makeProgram({
        instructorApplicationStartDate: '2026-08-01',
        instructorApplicationEndDate: '2026-08-15',
        generalCommonInfo: {
          instructorRecruitmentInfo: { recruitmentGuide: '강사 안내' },
          participantRecruitmentInfo: { recruitmentGuide: '참여자 안내' },
        },
      }),
    })
    expect(detail.portalCategories).toEqual(['INSTRUCTOR'])
    expect(detail.recruitmentGuide).toBe('강사 안내')
    expect(detail.educationTargets).toBeUndefined()
    expect(detail.recruitments?.[0]).toMatchObject({
      recruitmentType: 'INSTRUCTOR',
      startAt: '2026-08-01T00:00:00',
      endAt: '2026-08-15T00:00:00',
    })
  })

  it('keeps program education targets on instructor and volunteer preview', () => {
    const program = makeProgram({
      targetLevels: ['elementary'],
      educationTargetDetail: '프로그램 컬럼 상세',
      instructorTargets: ['adult'],
      volunteerTargets: ['university'],
      instructorApplicationStartDate: '2026-08-01',
      instructorApplicationEndDate: '2026-08-15',
      volunteerApplicationStartDate: '2026-08-16',
      volunteerApplicationEndDate: '2026-08-20',
      generalCommonInfo: {
        instructorRecruitmentInfo: { recruitmentTarget: '성인' },
        volunteerRecruitmentInfo: { recruitmentTarget: '대학(원)생' },
        participantRecruitmentInfo: { educationTargetDetail: '초등학생 4~6학년' },
      },
    })

    const instructor = buildGeneralProgramPortalPreview({ audience: 'instructors', program })
    expect(instructor.educationTargets).toEqual(['elementary'])
    expect(instructor.educationTargetDetail).toBe('초등학생 4~6학년')
    expect(instructor.recruitmentTarget).toBe('성인')

    const volunteer = buildGeneralProgramPortalPreview({ audience: 'volunteers', program })
    expect(volunteer.educationTargets).toEqual(['elementary'])
    expect(volunteer.educationTargetDetail).toBe('초등학생 4~6학년')
    expect(volunteer.recruitmentTarget).toBe('대학(원)생')
  })

  it('maps volunteer otherMatters from the volunteer row, not program otherNotes', () => {
    const detail = buildGeneralProgramPortalPreview({
      audience: 'volunteers',
      program: makeProgram({
        otherNotes: '프로그램 공통 기타',
        generalCommonInfo: {
          volunteerRecruitmentInfo: { otherMatters: 'nested 기타' },
        },
        programRecruitments: [
          { id: 186070, recruitmentType: 'VOLUNTEER', otherMatters: '행 기타사항' },
        ],
      }),
    })
    expect(detail.otherMatters).toBe('행 기타사항')
  })

  it('maps the volunteer tab with interview dates and hides notes marked not applicable', () => {
    const detail = buildGeneralProgramPortalPreview({
      audience: 'volunteers',
      program: makeProgram({
        generalVolunteerInterviewEnabled: true,
        generalCommonInfo: {
          volunteerRecruitmentInfo: {
            interviewStartDate: '2026-09-22',
            interviewEndDate: '2026-09-23',
            notesNotApplicable: true,
            remarks: '숨김',
          },
        },
      }),
    })
    expect(detail.remarks).toBeUndefined()
    expect(detail.recruitments?.[0]).toMatchObject({
      recruitmentType: 'VOLUNTEER',
      interviewEnabled: true,
      interviewStartAt: '2026-09-22T00:00:00',
      interviewEndAt: '2026-09-23T00:00:00',
    })
  })

  it('builds schedules from schedule-type detail rows', () => {
    const detail = buildGeneralProgramPortalPreview({
      audience: 'institutions',
      program: makeProgram({
        generalProgramEducationStructure: 'schedule',
        generalCommonInfo: {
          scheduleDetails: [
            {
              scheduleLabel: '행사 일정 01',
              name: '오리엔테이션',
              scheduleDateLabel: '2026년 10월 2일(금) 10:00 ~ 12:00',
            },
          ],
        },
      }),
    })
    expect(detail.curricula).toBeUndefined()
    expect(detail.schedules).toEqual([
      {
        sessionNo: 1,
        scheduleName: '오리엔테이션',
        startAt: '2026-10-02T10:00:00',
        endAt: '2026-10-02T12:00:00',
      },
    ])
  })

  it('미리보기 운영 기간은 모집 행 날짜를 쓰고 표시 문자열은 쓰지 않는다', () => {
    const detail = buildGeneralProgramPortalPreview({
      audience: 'institutions',
      program: makeProgram({
        startDate: '2026-01-01',
        endDate: '2026-06-30',
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
      }),
    })
    expect(detail.businessStartDate).toBe('2026-01-01T00:00:00')
    expect(detail.recruitments?.[0]).toMatchObject({
      operationStartDate: '2026-11-18',
      operationEndDate: '2026-12-25',
    })
  })
})
