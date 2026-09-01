import { describe, expect, it } from 'vitest'
import { dataManagementQueryKeys } from './data-management-query-keys'

describe('dataManagementQueryKeys.sponsors', () => {
  it('keeps yearlyBusinesses off the detail key so hover prefetch does not share cache', () => {
    expect(dataManagementQueryKeys.sponsors.yearlyBusinesses('sp-1')).toEqual([
      'cms',
      'data-management',
      'sponsors',
      'yearly-businesses',
      'sp-1',
    ])
    expect(dataManagementQueryKeys.sponsors.detail('sp-1')).toEqual([
      'cms',
      'data-management',
      'sponsors',
      'detail',
      'sp-1',
    ])
  })

  it('listAll is a prefix of filtered list keys', () => {
    const listAll = dataManagementQueryKeys.sponsors.listAll()
    const list = dataManagementQueryKeys.sponsors.list('status=active')
    expect(list.slice(0, listAll.length)).toEqual([...listAll])
  })
})

describe('dataManagementQueryKeys list prefixes', () => {
  it('detailedPrograms.lists is a prefix of filtered list keys', () => {
    const lists = dataManagementQueryKeys.detailedPrograms.lists()
    const list = dataManagementQueryKeys.detailedPrograms.list('q=math')
    expect(list.slice(0, lists.length)).toEqual([...lists])
    expect(dataManagementQueryKeys.detailedPrograms.detail('1')).not.toEqual(
      expect.arrayContaining(['list'])
    )
  })

  it('textbooks.lists is a prefix of filtered list keys and excludes matches/kit', () => {
    const lists = dataManagementQueryKeys.textbooks.lists()
    const list = dataManagementQueryKeys.textbooks.list('name=교재')
    expect(list.slice(0, lists.length)).toEqual([...lists])
    expect(dataManagementQueryKeys.textbooks.matches('catalog')).not.toEqual(
      expect.arrayContaining(['list'])
    )
    expect(dataManagementQueryKeys.textbooks.kitQuantities()).not.toEqual(
      expect.arrayContaining(['list'])
    )
  })
})
