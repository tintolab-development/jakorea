import { useCallback, useState } from 'react'
import type { TermsViewType } from '../model/terms-view.types'

export function useTermsViewModal() {
  const [openType, setOpenType] = useState<TermsViewType | null>(null)

  const open = useCallback((type: TermsViewType) => {
    setOpenType(type)
  }, [])

  const close = useCallback(() => {
    setOpenType(null)
  }, [])

  return {
    openType,
    isOpen: openType != null,
    open,
    close,
  }
}
