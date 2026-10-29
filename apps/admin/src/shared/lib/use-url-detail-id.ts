/**
 * 목록 상세 모달 열림 여부를 URL 쿼리 ID로만 결정한다.
 * 로컬 open 플래그와 쿼리를 따로 두면, 닫기 직후 쿼리가 남아 모달이 다시 열린다.
 */

import { useCallback, useMemo } from 'react'

type PatchSearchParams = (mutator: (next: URLSearchParams) => void) => void

export function useUrlDetailId(
  searchParams: URLSearchParams,
  patchSearchParams: PatchSearchParams,
  keys: readonly [string, ...string[]],
) {
  const canonicalKey = keys[0]
  const searchKey = searchParams.toString()

  const detailId = useMemo(() => {
    const params = new URLSearchParams(searchKey)
    for (const key of keys) {
      const value = params.get(key)?.trim()
      if (value) return value
    }
    return null
  }, [keys, searchKey])

  const openDetail = useCallback(
    (id: string) => {
      const trimmed = id.trim()
      if (!trimmed) return
      patchSearchParams(params => {
        params.set(canonicalKey, trimmed)
        for (const key of keys) {
          if (key !== canonicalKey) params.delete(key)
        }
      })
    },
    [canonicalKey, keys, patchSearchParams],
  )

  const closeDetail = useCallback(() => {
    patchSearchParams(params => {
      for (const key of keys) params.delete(key)
    })
  }, [keys, patchSearchParams])

  return { detailId, openDetail, closeDetail }
}
