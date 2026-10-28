import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { buildUjatProgramPortalPreview } from './platform-preview-payload'

const program = {
  id: 'registration-preview',
  sponsorId: '',
  title: '2026 UJAT',
  type: 'offline',
  format: 'course',
  category: 'school',
  rounds: [],
  startDate: '2026-03-01',
  endDate: '2026-12-31',
  applicationStartDate: '2026-02-01',
  applicationEndDate: '2026-02-20',
  volunteerApplicationStartDate: '2026-01-10',
  volunteerApplicationEndDate: '2026-01-31',
  generalProgramAudience: 'individual',
  status: 'active',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
} as Program

describe('buildUjatProgramPortalPreview', () => {
  it('maps the school tab to an organization participant recruitment', () => {
    const detail = buildUjatProgramPortalPreview({ program, audience: 'institutions' })
    expect(detail).toMatchObject({
      programId: 0,
      programType: 'UJAT',
      portalCategories: ['ORGANIZATION'],
      applicationTargetMode: 'ORGANIZATION',
      recruitments: [{ recruitmentType: 'PARTICIPANT', targetType: 'ORGANIZATION' }],
    })
  })

  it('maps the volunteer tabs to a volunteer recruitment', () => {
    const detail = buildUjatProgramPortalPreview({ program, audience: 'volunteers' })
    expect(detail.portalCategories).toEqual(['YOUTH_YOUNG'])
    expect(detail.recruitments?.[0]).toMatchObject({
      recruitmentType: 'VOLUNTEER',
      startAt: '2026-01-10T00:00:00',
      endAt: '2026-01-31T00:00:00',
    })
  })
})
