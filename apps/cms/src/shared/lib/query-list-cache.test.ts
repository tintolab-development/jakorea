import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import {
  applyCreatedToArrayLists,
  applyCreatedToMatchingArrayLists,
  applyDeletedToArrayLists,
  applyUpdatedToArrayLists,
  applyUpdatedToMatchingArrayLists,
} from './query-list-cache'

const LIST_PREFIX = ['cms', 'demo', 'list'] as const

function listKey(filter: string) {
  return [...LIST_PREFIX, filter] as const
}

type Row = { id: string; name: string; active: boolean }

describe('query-list-cache', () => {
  it('prepends a created row onto every cached list', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Row[]>(listKey('a'), [{ id: '1', name: '기존', active: true }])
    queryClient.setQueryData<Row[]>(listKey('b'), [{ id: '3', name: '다른필터', active: false }])

    applyCreatedToArrayLists(
      queryClient,
      LIST_PREFIX,
      { id: '2', name: '신규', active: true },
      row => row.id
    )

    expect(queryClient.getQueryData<Row[]>(listKey('a'))?.map(row => row.id)).toEqual(['2', '1'])
    expect(queryClient.getQueryData<Row[]>(listKey('b'))?.map(row => row.id)).toEqual(['2', '3'])
  })

  it('does not duplicate an already cached row', () => {
    const queryClient = new QueryClient()
    const existing = { id: '1', name: '기존', active: true }
    queryClient.setQueryData<Row[]>(listKey('a'), [existing])

    applyCreatedToArrayLists(queryClient, LIST_PREFIX, existing, row => row.id)

    expect(queryClient.getQueryData<Row[]>(listKey('a'))).toHaveLength(1)
  })

  it('replaces an updated row or prepends when missing', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Row[]>(listKey('a'), [{ id: '1', name: '이전', active: true }])
    queryClient.setQueryData<Row[]>(listKey('b'), [{ id: '9', name: '다른', active: true }])

    applyUpdatedToArrayLists(
      queryClient,
      LIST_PREFIX,
      { id: '1', name: '수정', active: true },
      row => row.id
    )

    expect(queryClient.getQueryData<Row[]>(listKey('a'))?.[0]?.name).toBe('수정')
    expect(queryClient.getQueryData<Row[]>(listKey('b'))?.map(row => row.id)).toEqual(['1', '9'])
  })

  it('removes a deleted row from every cached list', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Row[]>(listKey('a'), [
      { id: '1', name: '유지', active: true },
      { id: '2', name: '삭제', active: true },
    ])
    queryClient.setQueryData<Row[]>(listKey('b'), [{ id: '2', name: '삭제', active: true }])

    applyDeletedToArrayLists<Row>(queryClient, LIST_PREFIX, '2', row => row.id)

    expect(queryClient.getQueryData<Row[]>(listKey('a'))?.map(row => row.id)).toEqual(['1'])
    expect(queryClient.getQueryData<Row[]>(listKey('b'))).toEqual([])
  })

  it('skips empty ids', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Row[]>(listKey('a'), [{ id: '1', name: '기존', active: true }])

    applyCreatedToArrayLists(
      queryClient,
      LIST_PREFIX,
      { id: '', name: '무시', active: true },
      row => row.id
    )
    applyDeletedToArrayLists<Row>(queryClient, LIST_PREFIX, '', row => row.id)

    expect(queryClient.getQueryData<Row[]>(listKey('a'))).toEqual([
      { id: '1', name: '기존', active: true },
    ])
  })

  it('create matching only prepends to lists that match the filter', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Row[]>(listKey('active'), [{ id: '1', name: '기존', active: true }])
    queryClient.setQueryData<Row[]>(listKey('inactive'), [
      { id: '3', name: '미사용', active: false },
    ])

    applyCreatedToMatchingArrayLists(
      queryClient,
      LIST_PREFIX,
      { id: '2', name: '신규', active: true },
      row => row.id,
      (queryKey, item) => queryKey.at(-1) === (item.active ? 'active' : 'inactive')
    )

    expect(queryClient.getQueryData<Row[]>(listKey('active'))?.map(row => row.id)).toEqual([
      '2',
      '1',
    ])
    expect(queryClient.getQueryData<Row[]>(listKey('inactive'))?.map(row => row.id)).toEqual(['3'])
  })

  it('update matching upserts matching lists and removes from non-matching', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<Row[]>(listKey('active'), [{ id: '1', name: '이전', active: true }])
    queryClient.setQueryData<Row[]>(listKey('inactive'), [
      { id: '9', name: '다른', active: false },
    ])

    applyUpdatedToMatchingArrayLists(
      queryClient,
      LIST_PREFIX,
      { id: '1', name: '수정', active: false },
      row => row.id,
      (queryKey, item) => queryKey.at(-1) === (item.active ? 'active' : 'inactive')
    )

    expect(queryClient.getQueryData<Row[]>(listKey('active'))).toEqual([])
    expect(queryClient.getQueryData<Row[]>(listKey('inactive'))?.map(row => row.id)).toEqual([
      '1',
      '9',
    ])
    expect(queryClient.getQueryData<Row[]>(listKey('inactive'))?.[0]?.name).toBe('수정')
  })
})
