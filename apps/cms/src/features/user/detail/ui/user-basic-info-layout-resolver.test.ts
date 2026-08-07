import { describe, expect, it } from 'vitest'
import {
  BasicInfoLayout,
  BasicInfoSectionTypes,
  resolveBasicInfoLayout,
  usesInstructorMemberBasicInfoLayout,
} from './user-basic-info-layout-resolver'

describe('usesInstructorMemberBasicInfoLayout', () => {
  it('instructor_only·instructor_dual은 강사 기본정보 레이아웃', () => {
    expect(usesInstructorMemberBasicInfoLayout('instructor_only')).toBe(true)
    expect(usesInstructorMemberBasicInfoLayout('instructor_dual')).toBe(true)
  })

  it('school_teacher만 교사 전용 레이아웃', () => {
    expect(usesInstructorMemberBasicInfoLayout('school_teacher')).toBe(false)
  })
})

describe('resolveBasicInfoLayout — instructor', () => {
  it('강사·교사 겸 강사는 META+PROFILE split + instructor variant', () => {
    for (const profile of ['instructor_only', 'instructor_dual'] as const) {
      const resolved = resolveBasicInfoLayout({
        bodyKey: 'instructor',
        instructorProfile: profile,
      })
      expect(resolved.layout).toBe(BasicInfoLayout.SPLIT_CARD)
      if (resolved.layout === BasicInfoLayout.SPLIT_CARD) {
        expect(resolved.sections).toEqual([
          BasicInfoSectionTypes.META,
          BasicInfoSectionTypes.PROFILE,
        ])
        expect(resolved.splitSectionVariant).toBe('instructor')
      }
    }
  })

  it('순수 교사(school_teacher)는 school_teacher variant', () => {
    const resolved = resolveBasicInfoLayout({
      bodyKey: 'instructor',
      instructorProfile: 'school_teacher',
    })
    if (resolved.layout === BasicInfoLayout.SPLIT_CARD) {
      expect(resolved.splitSectionVariant).toBe('school_teacher')
    }
  })
})
