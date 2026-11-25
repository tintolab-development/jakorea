import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { dataManagementQueryKeys as keys } from './data-management-query-keys'
import { invalidateBusinessAreaReferenceCaches, invalidateDetailedProgramOptions } from './master-reference-cache'

describe('master reference caches', () => {
  it('invalidates the separate detailed-program options cache', async () => {
    const client = new QueryClient()
    try {
      const options = keys.detailedPrograms.options()
      const list = keys.detailedPrograms.list('')
      client.setQueryData(options, [{ id: '1', name: 'old' }])
      client.setQueryData(list, [])
      await invalidateDetailedProgramOptions(client)
      expect(client.getQueryState(options)?.isInvalidated).toBe(true)
      expect(client.getQueryState(list)?.isInvalidated).toBe(false)
    } finally { client.clear() }
  })

  it('invalidates referenced caches without evicting drafts or unrelated queries', async () => {
    const client = new QueryClient()
    const affected = [
      keys.textbooks.list(''),
      keys.textbooks.detail('1'),
      keys.textbooks.matches('catalog'),
      keys.textbooks.kitQuantities(),
      [...keys.textbooks.programBusinessAreaOptions(), 'session'],
      keys.detailedPrograms.options(),
      ['general-programs', 'list', 'all', ''],
      ['general-programs', 'detail', '1'],
      ['general-programs', 'material-candidates', '1'],
      ['cms', 'programs', 'company-school', 'detail', '1'],
      ['cms', 'programs', 'ujat', 'list', 'remote', {}],
      ['cms', 'performance', 'list', ''],
    ] as const
    const unchanged = [
      keys.textbooks.businessAreas(),
      keys.sponsors.listAll(),
      ['cms', 'users'],
      ['cms', 'programs', 'media', 'attachments', 1],
      ['general-programs', 'form-bindings', '1'],
    ] as const
    try {
      for (const key of [...affected, ...unchanged]) client.setQueryData(key, { saved: true })
      await invalidateBusinessAreaReferenceCaches(client)
      for (const key of affected) {
        expect(client.getQueryState(key)?.isInvalidated).toBe(true)
        expect(client.getQueryData(key)).toEqual({ saved: true })
      }
      for (const key of unchanged) expect(client.getQueryState(key)?.isInvalidated).toBe(false)
    } finally { client.clear() }
  })
})
