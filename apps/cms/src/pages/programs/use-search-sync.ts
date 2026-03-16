import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useSearchSync() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInputValue, setSearchInputValue] = useState(() => searchParams.get('title') || '')
  const isInternalUpdate = useRef(false)

  // 로컬 상태 -> URL 파라미터 동기화 (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentUrlTitle = searchParams.get('title') || ''
      const trimmedValue = searchInputValue.trim()

      if (trimmedValue !== currentUrlTitle) {
        isInternalUpdate.current = true
        const nextParams = new URLSearchParams(searchParams)
        if (trimmedValue) {
          nextParams.set('title', trimmedValue)
        } else {
          nextParams.delete('title')
        }
        setSearchParams(nextParams, { replace: true })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInputValue, searchParams, setSearchParams])

  // URL 파라미터 -> 로컬 상태 동기화 (외부 변경만)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    const urlTitle = searchParams.get('title') || ''
    setSearchInputValue(urlTitle)
  }, [searchParams])

  return {
    searchInputValue,
    setSearchInputValue,
    searchParams,
    setSearchParams,
  }
}
