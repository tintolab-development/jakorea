import { describe, expect, it } from 'vitest'
import {
  isNotificationSendableProgram,
  mapAdminProgramListItemToSendProgram,
  mapAdminProgramListItemsToSendPrograms,
} from './send-program-adapters'

describe('mapAdminProgramListItemToSendProgram', () => {
  it('maps numeric id, title, and businessYear', () => {
    expect(
      mapAdminProgramListItemToSendProgram({
        id: 42,
        title: 'JA Banks in Action',
        businessYear: 2026,
      })
    ).toEqual({ id: '42', name: 'JA Banks in Action', year: 2026 })
  })

  it('falls back to start date year when businessYear is missing', () => {
    expect(
      mapAdminProgramListItemToSendProgram({
        id: '7',
        nameKo: 'JA Job Shadow',
        startDate: '2025-03-01',
      })
    ).toEqual({ id: '7', name: 'JA Job Shadow', year: 2025 })
  })

  it('drops non-numeric ids that notification send APIs cannot use', () => {
    expect(
      mapAdminProgramListItemToSendProgram({
        id: 'prog-coy-2026',
        title: 'JA Company Of The Year',
        businessYear: 2026,
      })
    ).toBeNull()
  })
})

describe('mapAdminProgramListItemsToSendPrograms', () => {
  it('dedupes by id and sorts by year then name', () => {
    expect(
      mapAdminProgramListItemsToSendPrograms([
        { id: 2, title: 'Zebra', businessYear: 2026 },
        { id: 2, title: 'Zebra duplicate', businessYear: 2026 },
        { id: 1, title: 'Alpha', businessYear: 2025 },
        { id: 3, title: 'Beta', businessYear: 2026 },
      ]).map(row => row.id)
    ).toEqual(['3', '2', '1'])
  })
})

describe('isNotificationSendableProgram', () => {
  it('진행 예정·진행 중이고 게시 상태(또는 값 없음)면 발송 대상으로 고를 수 있다', () => {
    expect(isNotificationSendableProgram({ id: 1, periodStatus: 'IN_PROGRESS' })).toBe(true)
    expect(isNotificationSendableProgram({ id: 1, periodStatus: 'SCHEDULED' })).toBe(true)
    expect(
      isNotificationSendableProgram({
        id: 1,
        draftStatus: 'PUBLISHED',
        periodStatus: 'IN_PROGRESS',
      })
    ).toBe(true)
    expect(isNotificationSendableProgram({ id: 1 })).toBe(true)
  })

  it.each(['COMPLETED', 'PERIOD_ENDED', 'CANCELLED', 'CANCELED', 'CLOSED', 'completed'])(
    '종료 상태 %s는 제외한다',
    periodStatus => {
      expect(isNotificationSendableProgram({ id: 1, periodStatus })).toBe(false)
    }
  )

  it('임시저장 등 게시가 아닌 프로그램은 제외한다', () => {
    expect(
      isNotificationSendableProgram({ id: 1, draftStatus: 'DRAFT', periodStatus: 'IN_PROGRESS' })
    ).toBe(false)
  })

  it('목록 변환 시 종료된 프로그램을 뺀다', () => {
    expect(
      mapAdminProgramListItemsToSendPrograms([
        { id: 186478, title: '종료', businessYear: 2026, periodStatus: 'COMPLETED' },
        { id: 2, title: '진행 중', businessYear: 2026, periodStatus: 'IN_PROGRESS' },
      ]).map(row => row.id)
    ).toEqual(['2'])
  })
})
