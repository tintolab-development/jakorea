import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  navigationAllowsVolunteerApplicationTarget,
  shouldShowGeneralVolunteerApplicationsLnb,
} from './detail-meta'

function program(partial: Partial<Program>): Program {
  return {
    id: 'p1',
    title: 't',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    rounds: [],
    createdAt: '',
    updatedAt: '',
    ...partial,
  } as Program
}

describe('shouldShowGeneralVolunteerApplicationsLnb', () => {
  it('navigation VOLUNTEER 대상이면 기관 프로그램도 봉사자 LNB를 노출한다', () => {
    const org = program({
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
    })
    expect(
      shouldShowGeneralVolunteerApplicationsLnb(org, {
        allowedApplicationTargets: ['ORGANIZATION', 'VOLUNTEER'],
        honorNavigationTargets: true,
      })
    ).toBe(true)
  })

  it('navigation에 VOLUNTEER가 없으면 participant types만 따른다', () => {
    const org = program({
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
    })
    expect(
      shouldShowGeneralVolunteerApplicationsLnb(org, {
        allowedApplicationTargets: ['ORGANIZATION'],
        honorNavigationTargets: true,
      })
    ).toBe(false)
  })

  it('BE가 volunteer_applications LNB를 비활성화하면 숨긴다', () => {
    const org = program({
      generalParticipantTypes: ['school_institution', 'volunteer'],
    })
    expect(
      shouldShowGeneralVolunteerApplicationsLnb(org, {
        volunteerLnbDisabled: true,
        honorNavigationTargets: true,
        allowedApplicationTargets: ['VOLUNTEER'],
      })
    ).toBe(false)
  })
})

describe('navigationAllowsVolunteerApplicationTarget', () => {
  it('대소문자 무시', () => {
    expect(navigationAllowsVolunteerApplicationTarget(['volunteer'])).toBe(true)
  })
})
