import { describe, expect, it } from 'vitest'
import {
  programParticipantRecruitmentSaveSchema,
  programTrainedTeachersRecruitmentSaveSchema,
} from './program-recruitment-save-fields'

describe('programParticipantRecruitmentSaveSchema', () => {
  it('allows empty recruitment fields so common-info required values do not block save', () => {
    const result = programParticipantRecruitmentSaveSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects an invalid contact phone', () => {
    const result = programParticipantRecruitmentSaveSchema.safeParse({
      contactPhone: '1234',
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.message).toContain('전화번호')
  })

  it('accepts a valid Korean contact phone', () => {
    const result = programParticipantRecruitmentSaveSchema.safeParse({
      contactPhone: '010-1234-5678',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a negative max class count', () => {
    const result = programParticipantRecruitmentSaveSchema.safeParse({
      participantRecruitmentMaxClassCount: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe('programTrainedTeachersRecruitmentSaveSchema', () => {
  const complete = {
    participantRecruitmentAnnouncementPublished: 'published',
    studentListRequired: 'required',
    participantRecruitmentMaxClassCount: 4,
    participantRecruitmentMaxScheduleCount: 3,
    participantRecruitmentMaxSessionsPerDay: 8,
    participantProgramOperationStartDate: '2026-11-01T00:00:00.000Z',
    participantProgramOperationEndDate: '2026-12-15T00:00:00.000Z',
    applicationStartDate: '2026-10-01T00:00:00.000Z',
    applicationEndDate: '2026-10-31T00:00:00.000Z',
    targetLevels: ['elementary'],
    educationTargetDetail: '초등 5~6학년',
    resultAnnouncementDate: '2026-11-02T00:00:00.000Z',
    resultAnnouncementMethod: '이메일 안내',
    recruitmentContactOrganizationName: 'JA Korea',
    contactPhone: '010-1234-5678',
    contactEmail: 'recruit@tinto.co.kr',
    remarks: '비고',
  }

  it('rejects an empty TT recruitment edit', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts a complete TT recruitment edit', () => {
    const result = programTrainedTeachersRecruitmentSaveSchema.safeParse(complete)
    expect(result.success).toBe(true)
  })
})
