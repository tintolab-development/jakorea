/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { mapGeneralProgramToCreateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import {
  participantRecruitmentAnnouncementRequestFields,
  sanitizeRecruitAnnouncementOverlay,
} from '@/features/program/general/lib/participant-recruitment-announcement-request'
import { formatDateWithOptionalTime } from '@/features/program/shared/lib/program-detail-info-constants'

const baseProgram = {
  id: 'p1',
  title: 't',
  type: 'offline',
  format: 'workshop',
  category: 'individual',
  status: 'pending',
  lifecycleStatus: 'recruiting_students',
  createdAt: '2026-10-31T12:01:14.000Z',
  updatedAt: '2026-10-31T12:01:14.000Z',
} as Program

describe('participantRecruitmentAnnouncementRequestFields', () => {
  it('T1 개인 면접 있음 — 서류·면접·최종 시각을 모집 행에 싣는다', () => {
    const program: Program = {
      ...baseProgram,
      generalParticipantTypes: ['individual'],
      generalParticipantInterviewEnabled: true,
      resultAnnouncementDate: '2026-11-09T07:30:00.000Z',
      registrationOverlay: {
        'recruit.individual.interviewRequired': 'yes',
        'recruit.individual.docDeadlineIso': '2026-11-09T02:00:00.000Z',
        'recruit.individual.interviewRangeSeal': {
          start: '2026-11-09T04:00:00.000Z',
          end: '2026-11-09T06:00:00.000Z',
        },
        'recruit.individual.finalAnnounceIso': '2026-11-09T07:30:00.000Z',
      },
    }
    expect(participantRecruitmentAnnouncementRequestFields(program, 'INDIVIDUAL')).toEqual({
      interviewEnabled: true,
      documentPassAnnouncementAt: '2026-11-09T02:00:00.000Z',
      interviewStartAt: '2026-11-09T04:00:00.000Z',
      interviewEndAt: '2026-11-09T06:00:00.000Z',
      finalPassAnnouncementAt: '2026-11-09T07:30:00.000Z',
    })
    const row = mapGeneralProgramToCreateRequest(program).recruitments?.find(
      item => item.targetType === 'INDIVIDUAL'
    )
    expect(row).toMatchObject({
      interviewEnabled: true,
      documentPassAnnouncementAt: '2026-11-09T02:00:00.000Z',
      interviewStartAt: '2026-11-09T04:00:00.000Z',
      interviewEndAt: '2026-11-09T06:00:00.000Z',
      finalPassAnnouncementAt: '2026-11-09T07:30:00.000Z',
    })
  })

  it('T2 면접 없음·서류 미입력 — interviewEnabled false, 서류·면접 키 없음', () => {
    const program: Program = {
      ...baseProgram,
      generalParticipantTypes: ['individual'],
      generalParticipantInterviewEnabled: false,
      registrationOverlay: {
        'recruit.individual.interviewRequired': 'no',
        'recruit.individual.docDeadlineIso': '2026-10-31T12:00:35.429Z',
        'recruit.individual.interviewRangeSeal': {
          start: '2026-11-09T04:00:00.000Z',
          end: '2026-11-09T06:00:00.000Z',
        },
      },
    }
    expect(participantRecruitmentAnnouncementRequestFields(program, 'INDIVIDUAL')).toEqual({
      interviewEnabled: false,
    })
    const sanitized = sanitizeRecruitAnnouncementOverlay(program.registrationOverlay ?? {}, program)
    expect(sanitized['recruit.individual.docDeadlineIso']).toBeUndefined()
    expect(sanitized['recruit.individual.interviewRangeSeal']).toBeUndefined()
  })

  it('T3 기관 행에도 같은 발표·면접 필드를 싣는다', () => {
    const program: Program = {
      ...baseProgram,
      category: 'school',
      generalParticipantTypes: ['school_institution'],
      generalParticipantInterviewEnabled: true,
      resultAnnouncementDate: '2026-11-09T07:30:00.000Z',
      registrationOverlay: {
        'recruit.institution.interviewRequired': 'yes',
        'recruit.institution.docDeadlineIso': '2026-11-09T02:00:00.000Z',
        'recruit.institution.interviewRangeSeal': {
          start: '2026-11-09T04:00:00.000Z',
          end: '2026-11-09T06:00:00.000Z',
        },
        'recruit.finalAnnounceIso': '2026-11-09T07:30:00.000Z',
      },
    }
    expect(participantRecruitmentAnnouncementRequestFields(program, 'ORGANIZATION')).toEqual({
      interviewEnabled: true,
      documentPassAnnouncementAt: '2026-11-09T02:00:00.000Z',
      interviewStartAt: '2026-11-09T04:00:00.000Z',
      interviewEndAt: '2026-11-09T06:00:00.000Z',
      finalPassAnnouncementAt: '2026-11-09T07:30:00.000Z',
    })
  })

  it('T4 시간 토글 OFF 최종 발표는 전날 15:00Z', () => {
    const program: Program = {
      ...baseProgram,
      generalParticipantTypes: ['individual'],
      resultAnnouncementDate: '2026-11-08T15:00:00.000Z',
      registrationOverlay: {
        'recruit.individual.interviewRequired': 'no',
        'recruit.individual.finalAnnounceIso': '2026-11-08T15:00:00.000Z',
      },
    }
    expect(participantRecruitmentAnnouncementRequestFields(program, 'INDIVIDUAL')).toEqual({
      interviewEnabled: false,
      finalPassAnnouncementAt: '2026-11-08T15:00:00.000Z',
    })
  })

  it('개인 overlay를 volunteer 키로 복사하지 않는다', () => {
    const sanitized = sanitizeRecruitAnnouncementOverlay(
      {
        'recruit.individual.docDeadlineIso': '2026-11-09T02:00:00.000Z',
        'recruit.volunteer.docDeadlineIso': '2026-11-09T02:00:00.000Z',
      },
      { ...baseProgram, generalParticipantTypes: ['individual'] }
    )
    expect(sanitized['recruit.individual.docDeadlineIso']).toBe('2026-11-09T02:00:00.000Z')
    expect(sanitized['recruit.volunteer.docDeadlineIso']).toBeUndefined()
  })
})

describe('formatDateWithOptionalTime', () => {
  it('T7 시각이 있으면 YYYY.MM.DD HH:mm', () => {
    expect(formatDateWithOptionalTime('2026-11-09T07:30:00.000Z')).toBe('2026.11.09 16:30')
  })

  it('T8 KST 00:00이면 요일 있는 날짜만', () => {
    expect(formatDateWithOptionalTime('2026-10-30T15:00:00.000Z')).toBe('2026.10.31(토)')
    expect(formatDateWithOptionalTime('2026-10-31')).toBe('2026.10.31(토)')
  })
})
