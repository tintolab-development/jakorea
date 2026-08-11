import { describe, expect, it } from 'vitest'
import {
  mapSchoolOrganizationToUser,
  parseOrganizationIdFromUserId,
  toOrganizationUserId,
} from './map-school-organization-to-user'

describe('mapSchoolOrganizationToUser', () => {
  it('organization 목록 행을 SCHOOL User로 매핑한다', () => {
    const user = mapSchoolOrganizationToUser({
      organizationId: 12,
      name: '테스트고',
      address: '서울특별시 중구',
      addressDetail: '1층',
      affiliatedTeacherCount: 3,
      programApplyCount: 10,
      programCompleteCount: 4,
      createdAt: '2026-01-01T00:00:00Z',
    })

    expect(user.id).toBe('organization-12')
    expect(user.organizationId).toBe(12)
    expect(user.role).toBe('SCHOOL')
    expect(user.name).toBe('테스트고')
    expect(user.schoolInfo?.schoolName).toBe('테스트고')
    expect(user.schoolInfo?.addressDetail).toBe('1층')
    expect(user.listMetrics?.institutionRegisteredTeacherCount).toBe(3)
    expect(user.listMetrics?.institutionProgramApplicationCount).toBe(10)
    expect(user.listMetrics?.institutionProgramAttendanceCount).toBe(4)
  })
})

describe('parseOrganizationIdFromUserId', () => {
  it('organization- prefix를 파싱한다', () => {
    expect(parseOrganizationIdFromUserId(toOrganizationUserId(9))).toBe(9)
    expect(parseOrganizationIdFromUserId('member-1')).toBeUndefined()
  })
})
