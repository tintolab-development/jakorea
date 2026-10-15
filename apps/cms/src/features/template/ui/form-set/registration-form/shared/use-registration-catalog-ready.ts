import { useCallback, useState } from 'react'
import {
  hasSponsorOrDetailedProgramInOverlay,
  type RegistrationCatalogOverlayBasicInfoPrefix,
} from '@/features/template/ui/form-set/registration-form/shared/registration-catalog-prefetch'

export type UseRegistrationCatalogReadyOptions = {
  /** 임시저장 복원 시 후원사·세부프로그램 라벨/담당자 연동용 선로드 */
  overlayBasicInfoPrefix?: RegistrationCatalogOverlayBasicInfoPrefix
}

/** 후원사·세부프로그램 등 — 셀렉트 첫 open/focus 전까지 API 비활성 (overlay id 있으면 즉시 활성) */
export function useRegistrationCatalogReady(options?: UseRegistrationCatalogReadyOptions) {
  const [ready, setReady] = useState(() =>
    options?.overlayBasicInfoPrefix
      ? hasSponsorOrDetailedProgramInOverlay(options.overlayBasicInfoPrefix)
      : false
  )
  const enableCatalog = useCallback(() => {
    setReady(true)
  }, [])
  const onSelectOpenChange = useCallback(
    (open: boolean) => {
      if (open) setReady(true)
    },
    []
  )
  return { catalogReady: ready, enableCatalog, onSelectOpenChange }
}
