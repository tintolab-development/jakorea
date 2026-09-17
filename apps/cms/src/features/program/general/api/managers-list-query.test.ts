import { describe, expect, it } from 'vitest'
import {
  buildProgramManagersListQuery,
  serializeProgramManagersListQuery,
} from './managers-list-query'

describe('buildProgramManagersListQuery', () => {
  it('maps managerName to keyword and UI role to API role', () => {
    expect(
      buildProgramManagersListQuery({
        managerName: '  홍길동  ',
        role: 'OWNER',
      })
    ).toEqual({ keyword: '홍길동', role: 'PM' })

    expect(buildProgramManagersListQuery({ role: 'ASSISTANT' })).toEqual({
      role: 'VIEWER',
    })
  })

  it('omits empty keyword and all role', () => {
    expect(buildProgramManagersListQuery({ managerName: '  ', role: 'all' })).toEqual({})
    expect(buildProgramManagersListQuery({})).toEqual({})
  })
})

describe('serializeProgramManagersListQuery', () => {
  it('is stable for query key', () => {
    expect(serializeProgramManagersListQuery({ keyword: 'a', role: 'PM' })).toBe(
      serializeProgramManagersListQuery({ role: 'PM', keyword: 'a' })
    )
  })
})
