/**
 * 프로그램 상세 URL 쿼리 스택 — 후원사 상세 풀페이지 오버레이
 * `/programs/general|ujat?…&sponsorId=…` — 라우트 전환 없이 프로그램 상세 위에 표시
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SponsorDetailFullPageModal } from '@/features/sponsor/ui/sponsor-detail-fullpage-modal'
import {
  clearSponsorDetailQueryStack,
  readSponsorDetailQueryStack,
  resolveSponsorManagementRowById,
} from '@/features/sponsor/lib/sponsor-detail-query-stack'

export function ProgramDetailSponsorDetailOverlay() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { sponsorId } = readSponsorDetailQueryStack(searchParams)

  const sponsorRow = useMemo(
    () => (sponsorId ? resolveSponsorManagementRowById(sponsorId) : undefined),
    [sponsorId]
  )

  const open = Boolean(sponsorId && sponsorRow)

  const handleClose = useCallback(() => {
    setSearchParams(prev => clearSponsorDetailQueryStack(new URLSearchParams(prev)), {
      replace: true,
    })
  }, [setSearchParams])

  useEffect(() => {
    if (sponsorId && !sponsorRow) {
      handleClose()
    }
  }, [handleClose, sponsorId, sponsorRow])

  if (!sponsorRow) return null

  return (
    <SponsorDetailFullPageModal open={open} onClose={handleClose} sponsor={sponsorRow} />
  )
}
