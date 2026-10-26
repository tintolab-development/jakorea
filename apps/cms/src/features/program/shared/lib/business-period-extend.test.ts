import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import type { User } from '@/types/user'
import {
  canShowBusinessPeriodExtendButton,
  getBusinessPeriodExtendMinDate,
  hasProgramEditPermission,
  isProgramBusinessPeriodEnded,
  parseBusinessPeriodHistories,
} from './business-period-extend'

function programWithEnd(endDate: string): Program {
  return {
    id: '5001',
    sponsorId: 'sponsor-1',
    title: 't',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    rounds: [],
    startDate: '2026-01-01',
    endDate,
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  } as Program
}

function writeUser(permissionCodes?: string[]): Omit<User, 'password'> {
  return {
    id: 'admin-1',
    email: 'a@example.com',
    name: '관리자',
    role: 'ADMIN',
    adminLevel: 'ADMIN',
    ...(permissionCodes ? { permissionCodes } : {}),
  } as Omit<User, 'password'>
}

describe('isProgramBusinessPeriodEnded', () => {
  it('종료일 당일(KST)은 끝나지 않고 다음 날부터 종료로 본다', () => {
    expect(
      isProgramBusinessPeriodEnded('2026-10-23', new Date('2026-10-23T23:59:00+09:00'))
    ).toBe(false)
    expect(
      isProgramBusinessPeriodEnded('2026-10-23', new Date('2026-10-24T00:00:00+09:00'))
    ).toBe(true)
  })
})

describe('getBusinessPeriodExtendMinDate', () => {
  it('오늘과 현재 종료일+1일 중 더 늦은 날을 최소값으로 쓴다', () => {
    expect(
      getBusinessPeriodExtendMinDate('2026-10-20', new Date('2026-10-24T09:00:00+09:00'))
    ).toBe('2026-10-24')
    expect(
      getBusinessPeriodExtendMinDate('2026-10-30', new Date('2026-10-24T09:00:00+09:00'))
    ).toBe('2026-10-31')
  })
})

describe('canShowBusinessPeriodExtendButton', () => {
  const ended = programWithEnd('2026-10-20')
  const open = programWithEnd('2026-12-31')
  const now = new Date('2026-10-24T09:00:00+09:00')

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('종료 전 프로그램은 버튼을 숨긴다', () => {
    expect(canShowBusinessPeriodExtendButton(open, writeUser(), now)).toBe(false)
  })

  it('종료 후이고 PROGRAM_EDIT 권한이 있으면 DEV에서만 버튼을 보여 준다', () => {
    expect(import.meta.env.DEV).toBe(true)
    expect(canShowBusinessPeriodExtendButton(ended, writeUser(['PROGRAM_EDIT']), now)).toBe(
      true
    )
    expect(
      canShowBusinessPeriodExtendButton(ended, writeUser(['CRUD_PROGRAM_EDIT']), now)
    ).toBe(true)
  })

  it('프로덕션(DEV=false)에서는 연장 조건을 만족해도 버튼을 숨긴다', () => {
    vi.stubEnv('DEV', false)
    expect(canShowBusinessPeriodExtendButton(ended, writeUser(['PROGRAM_EDIT']), now)).toBe(
      false
    )
  })

  it('쓰기 권한이 없으면 버튼을 숨긴다', () => {
    const viewer = {
      ...writeUser(['PROGRAM_EDIT']),
      adminLevel: 'GENERAL' as const,
    }
    expect(canShowBusinessPeriodExtendButton(ended, viewer, now)).toBe(false)
  })

  it('permissionCodes가 있는데 PROGRAM_EDIT가 없으면 버튼을 숨긴다', () => {
    expect(canShowBusinessPeriodExtendButton(ended, writeUser(['PROGRAM_VIEW']), now)).toBe(
      false
    )
  })
})

describe('hasProgramEditPermission', () => {
  it('permissionCodes가 없으면 쓰기 가능 관리자를 허용한다', () => {
    expect(hasProgramEditPermission(writeUser())).toBe(true)
  })
})

describe('parseBusinessPeriodHistories', () => {
  it('응답 배열만 이력으로 읽는다', () => {
    expect(
      parseBusinessPeriodHistories({
        businessPeriodHistories: [
          {
            previousBusinessEndDate: '2026-10-20',
            businessEndDate: '2026-11-30',
            reason: '정산',
            changedByName: '홍길동',
            changedAt: '2026-10-24T01:00:00Z',
          },
        ],
      })
    ).toEqual([
      {
        previousBusinessEndDate: '2026-10-20',
        businessEndDate: '2026-11-30',
        reason: '정산',
        changedByName: '홍길동',
        changedAt: '2026-10-24T01:00:00Z',
      },
    ])
  })
})
