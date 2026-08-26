import { describe, expect, it } from 'vitest'
import type { User } from '@/types/user'
import { getDashboardWidgetsForUser } from './dashboard-config'

function adminUser(overrides: Partial<Omit<User, 'password'>> = {}): Omit<User, 'password'> {
  return {
    id: 'admin-1',
    email: 'admin@example.com',
    name: '관리자',
    role: 'ADMIN',
    adminLevel: 'MASTER',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('getDashboardWidgetsForUser', () => {
  it('assignedProgramTypes가 있으면 해당 일정 위젯만 노출한다', () => {
    const types = getDashboardWidgetsForUser(adminUser(), ['ujat', 'gemini']).map(w => w.type)
    expect(types).toEqual([
      'menu-shortcut-widget',
      'program-schedule-ujat-widget',
      'program-schedule-gemini-widget',
      'recruitment-status-widget',
      'customer-inquiry-status-widget',
      'kpi-achievement-widget',
    ])
  })

  it('assignedProgramTypes가 빈 배열이면 일정 위젯을 숨긴다', () => {
    const types = getDashboardWidgetsForUser(adminUser(), []).map(w => w.type)
    expect(types).toEqual([
      'menu-shortcut-widget',
      'recruitment-status-widget',
      'customer-inquiry-status-widget',
      'kpi-achievement-widget',
    ])
  })
})
