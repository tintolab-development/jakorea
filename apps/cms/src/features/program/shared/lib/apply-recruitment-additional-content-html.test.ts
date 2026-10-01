import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  applyRecruitmentAdditionalContentHtml,
  applyRecruitmentDetailInfoFields,
} from './apply-recruitment-additional-content-html'
import {
  applyGeneralRecruitOverlayToProgram,
  resolveGeneralRecruitDetailDisplayProgram,
} from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { serializeGeneralProgramServiceDetailJson } from '@/features/program/general/lib/general-program-service-detail-json'

const existing = {
  id: '186023',
  title: '테스트',
  category: 'school',
  type: 'offline',
  format: 'workshop',
  status: 'active',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  sponsorId: 'sponsor-1',
  rounds: [],
  additionalContentHtml: '<p>컬럼 신규</p>',
  registrationOverlay: {
    'recruit.detailInfo.additionalContentHtml': '<p>overlay 옛본문</p>',
  },
  generalCommonInfo: {
    participantRecruitmentInfo: {
      additionalContentHtml: '<p>중첩 옛본문</p>',
      programDescription: '설명',
    },
    instructorRecruitmentInfo: {
      additionalContentHtml: '<p>강사 옛본문</p>',
    },
    volunteerRecruitmentInfo: {
      additionalContentHtml: '<p>봉사자 옛본문</p>',
    },
  },
} as Program

describe('applyRecruitmentAdditionalContentHtml', () => {
  it('참여자 모집 저장 — 중첩 SSOT·overlay만 갱신하고 공통 컬럼은 건드리지 않는다', () => {
    const html = '<p style="color: red;">신규 추가 내용 😀</p>'
    const patch = applyRecruitmentAdditionalContentHtml(
      { additionalContentHtml: html },
      existing,
      html,
      'participant'
    )

    expect(patch.additionalContentHtml).toBeUndefined()
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.additionalContentHtml).toBe(html)
    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.additionalContentHtml).toBe(
      '<p>강사 옛본문</p>'
    )
    expect(patch.registrationOverlay?.['recruit.detailInfo.additionalContentHtml']).toBe(html)

    const display = resolveGeneralRecruitDetailDisplayProgram({ ...existing, ...patch }, 'participant')
    expect(display.additionalContentHtml).toBe(html)

    const serialized = serializeGeneralProgramServiceDetailJson({ ...existing, ...patch } as Program)
    expect(serialized).toBeTruthy()
    const parsed = JSON.parse(serialized!) as {
      generalCommonInfo?: {
        participantRecruitmentInfo?: { additionalContentHtml?: string }
      }
    }
    expect(parsed.generalCommonInfo?.participantRecruitmentInfo?.additionalContentHtml).toBe(html)
  })

  it('강사 모집 저장 — instructorRecruitmentInfo만 갱신한다', () => {
    const html = '<p>강사 추가</p>'
    const patch = applyRecruitmentAdditionalContentHtml({}, existing, html, 'instructor')

    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.additionalContentHtml).toBe(html)
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.additionalContentHtml).toBe(
      '<p>중첩 옛본문</p>'
    )
    expect(patch.registrationOverlay?.['recruitInstructor.detailInfo.additionalContentHtml']).toBe(
      html
    )
  })

  it('참여자 모집 저장 — 프로그램 설명을 중첩 SSOT에 넣는다', () => {
    const description = '수정된 프로그램 설명'
    const patch = applyRecruitmentDetailInfoFields({}, existing, 'participant', { description })

    expect(patch.description).toBeUndefined()
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.programDescription).toBe(
      description
    )
    expect(patch.registrationOverlay?.['recruit.detailInfo.programDescription']).toBe(description)
    expect(patch.recruitmentGuide).toBeUndefined()

    const display = resolveGeneralRecruitDetailDisplayProgram({ ...existing, ...patch }, 'participant')
    expect(display.description).toBe(description)
  })

  it('참여자 모집 비고 — remarks를 쓰고 otherNotes(기타 안내)로 덮지 않는다', () => {
    const withNotes = {
      ...existing,
      otherNotes: '기타 안내(otherMatters)',
      remarks: '옛 비고',
      registrationOverlay: {
        'recruit.detailInfo.otherNotes': 'overlay 옛 비고',
        'recruit.individual.notes': 'overlay 옛 비고',
        'recruit.notes': 'overlay 옛 비고',
      },
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        participantRecruitmentInfo: {
          ...existing.generalCommonInfo?.participantRecruitmentInfo,
          remarks: '옛 비고',
        },
      },
    } as Program

    const patch = applyRecruitmentDetailInfoFields(
      { remarks: '옛 비고' },
      withNotes,
      'participant',
      { remarks: '수정된 비고' }
    )

    expect(patch.otherNotes).toBeUndefined()
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBe('수정된 비고')
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.notesNotApplicable).toBe(false)
    expect(patch.registrationOverlay?.['recruit.detailInfo.otherNotes']).toBe('수정된 비고')
    expect(patch.registrationOverlay?.['recruit.individual.notes']).toBe('수정된 비고')
    expect(patch.registrationOverlay?.['recruit.notes']).toBe('수정된 비고')

    const draft = {
      ...withNotes,
      ...patch,
      generalCommonInfo: {
        ...withNotes.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
      registrationOverlay: patch.registrationOverlay,
    } as Program
    const remapped = applyGeneralRecruitOverlayToProgram(
      draft,
      draft.registrationOverlay ?? {},
      { preferOverlay: false }
    )
    expect(remapped.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBe('수정된 비고')
    expect(remapped.otherNotes).toBe('기타 안내(otherMatters)')
  })

  it('참여자 안내 저장은 그 모집 행만 바꾸고 강사 행은 그대로다', () => {
    const withRows = {
      ...existing,
      description: '공통 설명',
      recruitmentGuide: '공통 안내',
      programRecruitments: [
        {
          recruitmentType: 'PARTICIPANT',
          programDescription: '참여자 옛 설명',
          recruitmentGuide: '참여자 옛 안내',
          applicationMethod: null,
          learningSupportContent: null,
          additionalContentHtml: null,
          remarks: null,
        },
        {
          recruitmentType: 'INSTRUCTOR',
          programDescription: '강사 설명',
          recruitmentGuide: '강사 안내',
          applicationMethod: null,
          learningSupportContent: null,
          additionalContentHtml: null,
          remarks: null,
        },
      ],
    } as Program
    const patch = applyRecruitmentDetailInfoFields({}, withRows, 'participant', {
      description: '참여자 새 설명',
      recruitmentGuide: '참여자 새 안내',
    })
    expect(patch.description).toBeUndefined()
    expect(patch.recruitmentGuide).toBeUndefined()
    expect(patch.programRecruitments?.[0]?.recruitmentGuide).toBe('참여자 새 안내')
    expect(patch.programRecruitments?.[1]?.recruitmentGuide).toBe('강사 안내')
    const participant = resolveGeneralRecruitDetailDisplayProgram(
      { ...withRows, ...patch, programRecruitments: patch.programRecruitments },
      'participant'
    )
    const instructor = resolveGeneralRecruitDetailDisplayProgram(
      { ...withRows, ...patch, programRecruitments: patch.programRecruitments },
      'instructor'
    )
    expect(participant.recruitmentGuide).toBe('참여자 새 안내')
    expect(participant.description).toBe('참여자 새 설명')
    expect(instructor.recruitmentGuide).toBe('강사 안내')
    expect(instructor.description).toBe('강사 설명')
  })

  it('봉사자 모집 비고 — volunteerRecruitmentInfo.remarks만 갱신한다', () => {
    const patch = applyRecruitmentDetailInfoFields({}, existing, 'volunteer', {
      remarks: '봉사자 비고 신값',
    })

    expect(patch.generalCommonInfo?.volunteerRecruitmentInfo?.remarks).toBe('봉사자 비고 신값')
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBeUndefined()
    expect(patch.registrationOverlay?.['recruitVolunteer.detailInfo.otherNotes']).toBe(
      '봉사자 비고 신값'
    )
    expect(patch.otherNotes).toBeUndefined()
  })
})
