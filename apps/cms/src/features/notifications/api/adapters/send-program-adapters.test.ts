import { describe, expect, it } from 'vitest'
import {
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
