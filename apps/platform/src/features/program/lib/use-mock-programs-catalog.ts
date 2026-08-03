import { useEffect, useState } from 'react'
import { DEV_AUTH_CHANGE_EVENT } from '@/shared/lib/dev-auth'
import type { ProgramDetail } from '../model/types'
import { clearMockProgramCatalogCache } from './mock-program-catalog-client'
import { getMockProgramById, getMockPrograms, loadMockProgramById, loadMockPrograms } from './mock-programs'

/**
 * 시드를 즉시 보여 준 뒤, mock 로그인이면 catalog merge 로 hydrate.
 * catalog fetch 는 mock-program-catalog-client 모듈 캐시로 StrictMode 이중 effect를 합친다.
 */
export function useMockProgramsCatalog(): ProgramDetail[] {
  const [programs, setPrograms] = useState<ProgramDetail[]>(() => getMockPrograms() as ProgramDetail[])

  useEffect(() => {
    let cancelled = false

    const refresh = (options?: { forceNetwork?: boolean }) => {
      if (options?.forceNetwork) {
        clearMockProgramCatalogCache()
      }
      void loadMockPrograms().then(next => {
        if (!cancelled) setPrograms(next)
      })
    }

    refresh()
    const onAuthChange = () => refresh({ forceNetwork: true })
    window.addEventListener(DEV_AUTH_CHANGE_EVENT, onAuthChange)
    return () => {
      cancelled = true
      window.removeEventListener(DEV_AUTH_CHANGE_EVENT, onAuthChange)
    }
  }, [])

  return programs
}

export function useMockProgramById(programId: string | null | undefined): {
  program: ProgramDetail | undefined
  isLoading: boolean
} {
  const seed = programId ? getMockProgramById(programId) : undefined
  const [program, setProgram] = useState<ProgramDetail | undefined>(seed)
  const [isLoading, setIsLoading] = useState(Boolean(programId) && !seed)

  useEffect(() => {
    if (!programId) {
      setProgram(undefined)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setProgram(getMockProgramById(programId))
    setIsLoading(true)

    const refresh = (options?: { forceNetwork?: boolean }) => {
      if (options?.forceNetwork) {
        clearMockProgramCatalogCache()
      }
      void loadMockProgramById(programId).then(next => {
        if (cancelled) return
        setProgram(next)
        setIsLoading(false)
      })
    }

    refresh()
    const onAuthChange = () => refresh({ forceNetwork: true })
    window.addEventListener(DEV_AUTH_CHANGE_EVENT, onAuthChange)
    return () => {
      cancelled = true
      window.removeEventListener(DEV_AUTH_CHANGE_EVENT, onAuthChange)
    }
  }, [programId])

  return { program, isLoading }
}
