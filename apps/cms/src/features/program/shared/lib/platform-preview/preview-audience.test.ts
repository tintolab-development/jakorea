import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  isPreviewAudienceOverlayKey,
  pickPreviewRecruitmentRow,
  recruitmentPreviewCatalogCode,
  recruitmentPreviewCatalogCodes,
} from './preview-audience'

function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '186408',
    title: '미리보기',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    sponsorId: 'sponsor-1',
    rounds: [],
    ...overrides,
  } as Program
}

describe('recruitmentPreviewCatalogCode', () => {
  it('keeps instructor, volunteer, school, and individual catalogs apart', () => {
    const program = makeProgram({
      id: '4021',
      generalParticipantTypes: ['school_institution', 'individual', 'volunteer', 'teacher_instructor'],
    })
    expect(recruitmentPreviewCatalogCode(program, 'instructors')).toBe('recruitment-instructor')
    expect(recruitmentPreviewCatalogCode(program, 'volunteers')).toBe('recruitment-volunteer')
    expect(recruitmentPreviewCatalogCode(program, 'institutions')).toBe(
      'recruitment-participant-school'
    )
    expect(recruitmentPreviewCatalogCode(program, 'individuals')).toBe(
      'recruitment-participant-individual'
    )
  })

  it('maps institution preview to economy and trained-teachers catalogs by program kind', () => {
    expect(
      recruitmentPreviewCatalogCodes(makeProgram({ id: '170001' }), 'institutions')
    ).toEqual(['recruitment-economy'])
    expect(
      recruitmentPreviewCatalogCodes(makeProgram({ id: '186001' }), 'institutions')
    ).toEqual(['recruitment-trained-teachers'])
  })
})

describe('pickPreviewRecruitmentRow', () => {
  it('picks ORGANIZATION vs INDIVIDUAL participant rows', () => {
    const program = makeProgram({
      programRecruitments: [
        { id: 11, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' },
        { id: 22, recruitmentType: 'PARTICIPANT', applicationType: 'INDIVIDUAL' },
        { id: 33, recruitmentType: 'INSTRUCTOR' },
      ],
    })
    expect(pickPreviewRecruitmentRow(program, 'institutions')?.id).toBe(11)
    expect(pickPreviewRecruitmentRow(program, 'individuals')?.id).toBe(22)
    expect(pickPreviewRecruitmentRow(program, 'instructors')?.id).toBe(33)
  })
})

describe('isPreviewAudienceOverlayKey', () => {
  it('does not mix instructor keys into the institution tab', () => {
    expect(
      isPreviewAudienceOverlayKey('institutions', 'recruitInstructor.detailInfo.programDescription')
    ).toBe(false)
    expect(
      isPreviewAudienceOverlayKey('instructors', 'recruitInstructor.detailInfo.programDescription')
    ).toBe(true)
    expect(isPreviewAudienceOverlayKey('individuals', 'recruit.individual.inquiryTel')).toBe(true)
    expect(isPreviewAudienceOverlayKey('institutions', 'recruit.individual.inquiryTel')).toBe(false)
  })
})
