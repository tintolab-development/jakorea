import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  buildVolunteerAssignmentNotificationByOrganization,
  resolveVolunteerUnassignNotificationSent,
  toVolunteerAssignmentNotificationTiming,
} from './volunteer-assignment-notification'
import type { VolunteerAssignmentRemoteRow } from '@/features/program/general/api/program-progress-api-client'

describe('volunteer-assignment-notification', () => {
  const rows: VolunteerAssignmentRemoteRow[] = [
    {
      assignmentId: 1,
      organizationApplicationId: 101,
      assignmentStatus: 'ASSIGNED',
      assignmentNotificationStatus: 'SENT',
      assignmentNotificationSentAt: '2026-11-11T08:10:00Z',
      assignmentNotificationScheduledAt: null,
    },
    {
      assignmentId: 2,
      organizationApplicationId: 102,
      assignmentStatus: 'ASSIGNED',
      assignmentNotificationStatus: 'SCHEDULED',
      assignmentNotificationScheduledAt: '2026-11-16T08:00:00Z',
    },
    { assignmentId: 3, organizationApplicationId: 103, assignmentStatus: 'ASSIGNED' },
  ]

  it('기관 신청 id별 알림 상태를 만든다(구버전 행은 건너뜀)', () => {
    const map = buildVolunteerAssignmentNotificationByOrganization(rows)
    expect(map.get('101')).toEqual({
      status: 'SENT',
      sentAt: '2026-11-11T08:10:00Z',
      scheduledAt: null,
    })
    expect(map.get('102')?.status).toBe('SCHEDULED')
    expect(map.has('103')).toBe(false)
  })

  it('빠지는 기관 중 SENT가 있으면 발송 후, 모두 발송 전이면 발송 전, 모르면 undefined', () => {
    const map = buildVolunteerAssignmentNotificationByOrganization(rows)
    expect(resolveVolunteerUnassignNotificationSent(['101', '102'], map)).toBe(true)
    expect(resolveVolunteerUnassignNotificationSent(['102'], map)).toBe(false)
    expect(resolveVolunteerUnassignNotificationSent(['102', '103'], map)).toBeUndefined()
    expect(resolveVolunteerUnassignNotificationSent(['101'], null)).toBeUndefined()
  })

  it('알림 시점 → notification', () => {
    const at = dayjs('2026-11-20T00:00:00Z')
    expect(toVolunteerAssignmentNotificationTiming('immediate')).toEqual({ timing: 'IMMEDIATE' })
    expect(toVolunteerAssignmentNotificationTiming('manual', at)).toEqual({
      timing: 'SCHEDULED',
      scheduledAt: '2026-11-20T00:00:00.000Z',
    })
  })
})
