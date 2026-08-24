import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import {
  applyCreatedToArrayLists,
  applyDeletedToArrayLists,
  applyUpdatedToArrayLists,
} from './query-list-cache'

const LIST_PREFIX = ['cms', 'demo', 'list'] as const

function listKey(filter: string) {
  return [...LIST_PREFIX, filter] as const
}

type Row = { id: string; name: string }

describe('query-list-cache', () => {
  it('prepends a created row onto every cached list', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Row[]>(listKey('a'), [{ id: '1', name: '기존' }])
    queryClient.setQueryData<Row[]>(listKey('b'), [{ id: '3', name: '다른필터' }])

    applyCreatedToArrayLists(queryClient, LIST_PREFIX, { id: '2', name: '신규' }, row => row.id)

    expect(queryClient.getQueryData<Row[]>(listKey('a'))?.map(row => row.id)).toEqual(['2', '1'])
    expect(queryClient.getQueryData<Row[]>(listKey('b'))?.map(row => row.id)).toEqual(['2', '3'])
  })

  it('does not duplicate an already cached row', () => {
    const queryClient = new QueryClient()
    const existing = { id: '1', name: '기존' }
    queryClient.setQueryData<Row[]>(listKey('a'), [existing])

    applyCreatedToArrayLists(queryClient, LIST_PREFIX, existing, row => row.id)

    expect(queryClient.getQueryData<Row[]>(listKey('a'))).toHaveLength(1)
  })

  it('replaces an updated row or prepends when missing', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Row[]>(listKey('a'), [{ id: '1', name: '이전' }])
    queryClient.setQueryData<Row[]>(listKey('b'), [{ id: '9', name: '다른' }])

    applyUpdatedToArrayLists(queryClient, LIST_PREFIX, { id: '1', name: '수정' }, row => row.id)

    expect(queryClient.getQueryData<Row[]>(listKey('a'))?.[0]?.name).toBe('수정')
    expect(queryClient.getQueryData<Row[]>(listKey('b'))?.map(row => row.id)).toEqual(['1', '9'])
  })

  it('removes a deleted row from every cached list', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Row[]>(listKey('a'), [
      { id: '1', name: '유지' },
      { id: '2', name: '삭제' },
    ])
    queryClient.setQueryData<Row[]>(listKey('b'), [{ id: '2', name: '삭제' }])

    applyDeletedToArrayLists<Row>(queryClient, LIST_PREFIX, '2', row => row.id)

    expect(queryClient.getQueryData<Row[]>(listKey('a'))?.map(row => row.id)).toEqual(['1'])
    expect(queryClient.getQueryData<Row[]>(listKey('b'))).toEqual([])
  })

  it('skips empty ids', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Row[]>(listKey('a'), [{ id: '1', name: '기존' }])

    applyCreatedToArrayLists(queryClient, LIST_PREFIX, { id: '', name: '무시' }, row => row.id)
    applyDeletedToArrayLists<Row>(queryClient, LIST_PREFIX, '', row => row.id)

    expect(queryClient.getQueryData<Row[]>(listKey('a'))).toEqual([{ id: '1', name: '기존' }])
  })
})
