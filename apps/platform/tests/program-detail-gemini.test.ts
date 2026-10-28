import { describe, expect, it } from 'vitest'
import { mapPortalProgramDetail } from '../src/features/program/api/mappers'
import { portalProgramDetailRequestQuery } from '../src/features/program/lib/portal-recruitment'
import { platformQueryKeys } from '../src/shared/api/query-keys'

const GEMINI_PROGRAM_COPY = {
  programId: 186429,
  programType: 'GEMINI_TRAINING' as const,
  portalCategories: ['ORGANIZATION', 'INSTRUCTOR'],
  title: '제미나이 이미지',
  description: '프로그램 설명',
  recruitmentGuide:
    '<p>모집 안내 <img src="/api/portal/public/files/2056230/content?inline=1" alt="jakorea.png" /></p>',
  additionalContentHtml: '최소 수강 인원은 15명이며, 기관 단위로 신청합니다.',
  learningSupportContent: '강의 자료와 활동지를 방문 기관에 제공합니다.',
  otherMatters: '희망 연수일은 연수 요청 가능기간 안에서 기관과 조율합니다.',
  applicationMethod: '홈페이지에서 기관 정보와 희망 연수 일정을 작성해 신청합니다.',
  trainingRequestStartDate: '2026-10-02',
  trainingRequestEndDate: '2026-10-30',
  minStudentCount: 15,
  thumbnailFileObjectId: null,
}

describe('Gemini portal detail training request period', () => {
  it('keeps the training request period separate from the institution recruitment period', () => {
    const program = mapPortalProgramDetail({
      programId: 185003,
      programType: 'GEMINI_TRAINING',
      portalCategories: ['ORGANIZATION'],
      title: 'Gemini 연수',
      recruitments: [
        { recruitmentType: 'ORGANIZATION', startAt: '2026-08-01', endAt: '2026-08-31' },
      ],
      trainingRequestStartDate: '2026-09-01',
      trainingRequestEndDate: '2026-09-30',
      totalParticipants: 15,
    })

    expect(program?.detailCase).toBe('gemini')
    expect(program?.recruitmentPhases[0]?.value).toBe('2026년 8월 1일(토) ~ 2026년 8월 31일(월)')
    expect(program?.geminiTrainingRequestPeriodLabel).toBe('2026년 9월 1일(화) ~ 2026년 9월 30일(수)')
    expect(program?.recruitmentPhases[0]?.label).toBe('기관 모집 기간')
    expect(program?.recruitmentPhaseGroupLabel).toBe('모집 및 선별 기간')
    expect(program?.basicInfoFields.find(field => field.label === '최소 수강 인원')?.value).toBe('15명')
    expect(program?.basicInfoFields.some(field => field.label === '교육 장소')).toBe(false)
  })

  it('sends applicationType and recruitmentId on the detail GET key', () => {
    expect(
      portalProgramDetailRequestQuery({
        applicationTypes: ['INSTRUCTOR'],
        recruitmentIds: [186919],
      }),
    ).toEqual({ applicationType: 'INSTRUCTOR', recruitmentId: 186919 })
    expect(portalProgramDetailRequestQuery(null)).toBeUndefined()
    expect(
      platformQueryKeys.program.detail('186429', {
        applicationType: 'INSTRUCTOR',
        recruitmentId: 186919,
      }),
    ).toEqual(['platform', 'program', 'detail', '186429', 'INSTRUCTOR', 186919])
  })

  it('keeps program-level copy when the instructor recruitment is focused', () => {
    const program = mapPortalProgramDetail(
      {
        ...GEMINI_PROGRAM_COPY,
        recruitments: [
          {
            recruitmentId: 186918,
            recruitmentType: 'PARTICIPANT',
            applicationTypes: ['ORGANIZATION'],
            startAt: '2026-09-30T15:00:00Z',
            endAt: '2026-10-11T15:00:00Z',
          },
          {
            recruitmentId: 186919,
            recruitmentType: 'INSTRUCTOR',
            applicationTypes: ['INSTRUCTOR'],
            startAt: '2026-09-30T15:00:00Z',
            endAt: '2026-10-11T15:00:00Z',
            recruitmentGuide: null,
            additionalContentHtml: null,
            learningSupportContent: null,
            applicationMethod: null,
          },
        ],
      },
      { recruitmentIds: [186919], applicationTypes: ['INSTRUCTOR'] },
    )

    expect(program?.detailCase).toBe('gemini')
    expect(program?.focusedRecruitmentIds).toEqual([186919])
    expect(program?.categories).toEqual(['instructor', 'institution'])
    expect(program?.thumbnailUrl).toBeUndefined()
    expect(program?.extraSections.map(section => section.title)).toEqual([
      '모집안내',
      '추가 내용',
      '학습 지원 내용',
      '기타사항',
    ])
    expect(program?.extraSections.find(section => section.title === '모집안내')?.body).toContain(
      '/api/portal/public/files/2056230/content?inline=1',
    )
    expect(program?.extraSections.find(section => section.title === '모집안내')?.body).not.toContain(
      '/api/admin/files/',
    )
    expect(program?.applicationMethodValue).toContain('홈페이지에서 기관 정보')
    expect(program?.geminiTrainingRequestPeriodLabel).toContain('2026년 10월')
    expect(program?.recruitmentPhases.some(phase => phase.label === '연수 요청 가능 기간')).toBe(
      false,
    )
  })

  it('keeps program copy and both portal tabs when BE returns only the instructor row', () => {
    const unfocused = mapPortalProgramDetail({
      ...GEMINI_PROGRAM_COPY,
      recruitments: [
        {
          recruitmentId: 186918,
          recruitmentType: 'PARTICIPANT',
          applicationTypes: ['ORGANIZATION'],
          startAt: '2026-09-30T15:00:00Z',
          endAt: '2026-10-11T15:00:00Z',
        },
        {
          recruitmentId: 186919,
          recruitmentType: 'INSTRUCTOR',
          applicationTypes: ['INSTRUCTOR'],
          startAt: '2026-09-30T15:00:00Z',
          endAt: '2026-10-11T15:00:00Z',
        },
      ],
    })
    const focused = mapPortalProgramDetail(
      {
        ...GEMINI_PROGRAM_COPY,
        recruitments: [
          {
            recruitmentId: 186919,
            recruitmentType: 'INSTRUCTOR',
            startAt: '2026-09-30T15:00:00Z',
            endAt: '2026-10-11T15:00:00Z',
            recruitmentGuide: null,
          },
        ],
      },
      {
        portalTab: 'INSTRUCTOR',
        recruitmentIds: [186919],
        applicationTypes: ['INSTRUCTOR'],
      },
    )

    expect(focused?.detailCase).toBe('gemini')
    expect(focused?.categories).toEqual(['instructor', 'institution'])
    expect(focused?.extraSections.map(section => section.title)).toEqual(
      unfocused?.extraSections.map(section => section.title),
    )
    expect(focused?.extraSections.find(section => section.title === '모집안내')?.body).toBe(
      unfocused?.extraSections.find(section => section.title === '모집안내')?.body,
    )
    expect(focused?.applicationMethodValue).toBe(unfocused?.applicationMethodValue)
    expect(focused?.geminiTrainingRequestPeriodLabel).toBe(unfocused?.geminiTrainingRequestPeriodLabel)
  })

  it('shows registered extra sections only and uses the Gemini Figma titles', () => {
    const program = mapPortalProgramDetail({
      programId: 185006,
      programType: 'GEMINI_TRAINING',
      portalCategories: ['ORGANIZATION'],
      title: 'Gemini 연수',
      recruitmentGuide: '<p>일정 안내</p>',
      additionalContentHtml: '',
      learningSupportContent: '학습 지원',
      remarks: '',
      applicationMethod: '해당 페이지의 [신청버튼] 클릭 후 항목 상세 기재 후 제출',
    })

    expect(program?.extraSections.map(section => section.title)).toEqual(['모집안내', '학습 지원 내용'])
    expect(program?.applicationMethodLabel).toBe('지원방법')
    expect(program?.applicationMethodValue).toBe(
      '해당 페이지의 [신청버튼] 클릭 후 항목 상세 기재 후 제출'
    )
  })

  it('does not expose the Gemini field for non-Gemini details or null periods', () => {
    const general = mapPortalProgramDetail({
      programId: 185004,
      programType: 'GENERAL',
      portalCategories: ['ORGANIZATION'],
      title: '일반 프로그램',
      trainingRequestStartDate: '2026-09-01',
      trainingRequestEndDate: '2026-09-30',
    })
    const geminiWithoutPeriod = mapPortalProgramDetail({
      programId: 185005,
      programType: 'GEMINI_TRAINING',
      portalCategories: ['ORGANIZATION'],
      title: '기간 미설정 Gemini',
      trainingRequestStartDate: null,
      trainingRequestEndDate: null,
    })

    expect(general?.geminiTrainingRequestPeriodLabel).toBeUndefined()
    expect(geminiWithoutPeriod?.geminiTrainingRequestPeriodLabel).toBeUndefined()
  })

  it('does not replace a GENERAL recruitment-row guide with program copy', () => {
    const program = mapPortalProgramDetail(
      {
        programId: 168241,
        programType: 'GENERAL_ORGANIZATION',
        title: '일반 기관',
        description: '프로그램 설명',
        recruitmentGuide: '프로그램 공통 안내',
        recruitments: [
          {
            recruitmentId: 168241,
            applicationTypes: ['ORGANIZATION'],
            recruitmentGuide: '기관 모집 안내',
          },
        ],
      },
      { recruitmentIds: [168241], applicationTypes: ['ORGANIZATION'] },
    )

    expect(program?.extraSections.find(section => section.title === '모집 안내')?.body).toBe(
      '기관 모집 안내',
    )
  })
})
