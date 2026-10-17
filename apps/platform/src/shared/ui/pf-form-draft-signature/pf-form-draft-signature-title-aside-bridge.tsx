import { useEffect, type ReactNode } from 'react'
import { PFButton } from '../pf-button'
import { usePFFormDraftSignature } from './context'

export type PFFormDraftSignatureTitleAsideBridgeProps = {
  onTitleAside?: (aside: ReactNode | null) => void
}

/** Provider 내부 — 페이지 `titleAside`에 서명 만들기/수정하기 버튼 등록 */
export function PFFormDraftSignatureTitleAsideBridge({
  onTitleAside,
}: PFFormDraftSignatureTitleAsideBridgeProps) {
  const { readOnly, hasDraftProfile, requestTitleEdit } = usePFFormDraftSignature()

  useEffect(() => {
    if (onTitleAside == null) return undefined
    if (readOnly) {
      onTitleAside(null)
      return () => onTitleAside(null)
    }
    onTitleAside(
      <PFButton size="xlarge" variant="primary" onClick={requestTitleEdit}>
        {hasDraftProfile ? '전자서명 수정하기' : '전자서명 만들기'}
      </PFButton>,
    )
    return () => onTitleAside(null)
  }, [hasDraftProfile, onTitleAside, readOnly, requestTitleEdit])

  return null
}
