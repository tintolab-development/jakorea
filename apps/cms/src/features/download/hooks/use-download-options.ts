/**
 * 다운로드 옵션 Hook
 * Phase 0.5.3: 다운로드 보호 UX
 */

import { useState, useCallback } from 'react'
import { useTemporaryPermissions } from '@/features/permission-request/hooks/use-temporary-permissions'
import type { DownloadOptions, DownloadTargetType } from '@/types/download'
import type { UUID } from '@/types'

interface UseDownloadOptionsOptions {
  programId?: UUID
  targetType?: DownloadTargetType // 향후 확장용
  action?: 'VIEW' | 'DOWNLOAD'
}

interface UseDownloadOptionsResult {
  canDownloadOriginal: boolean
  options: DownloadOptions
  setOptions: (options: Partial<DownloadOptions>) => void
  resetOptions: () => void
}

/**
 * 다운로드 옵션 Hook
 */
export function useDownloadOptions({
  programId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  targetType: _targetType, // 향후 확장용
  action = 'DOWNLOAD',
}: UseDownloadOptionsOptions): UseDownloadOptionsResult {
  const { hasActivePermission } = useTemporaryPermissions({
    programId,
    activeOnly: true,
  })

  // 원본 다운로드 권한 확인
  const canDownloadOriginal = programId
    ? hasActivePermission(programId, action === 'DOWNLOAD' ? 'DOWNLOAD' : 'VIEW')
    : false

  const [options, setOptionsState] = useState<DownloadOptions>({
    maskingEnabled: true, // 기본값: 마스킹 적용
  })

  const setOptions = useCallback((newOptions: Partial<DownloadOptions>) => {
    setOptionsState(prev => ({
      ...prev,
      ...newOptions,
    }))
  }, [])

  const resetOptions = useCallback(() => {
    setOptionsState({
      maskingEnabled: true,
    })
  }, [])

  return {
    canDownloadOriginal,
    options,
    setOptions,
    resetOptions,
  }
}
