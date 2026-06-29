/**
 * 프로그램 상세 URL 쿼리 스택 — 후원사 상세 풀페이지 오버레이
 * `/programs/general|ujat?…&sponsorId=…` — 라우트 전환 없이 프로그램 상세 위에 표시
 */

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { SponsorDetailFullPageModal } from '@/features/sponsor/ui/sponsor-detail-fullpage-modal'
import {
  clearSponsorDetailQueryStack,
  readSponsorDetailQueryStack,
  resolveSponsorManagementRowById,
} from '@/features/sponsor/lib/sponsor-detail-query-stack'

export function ProgramDetailSponsorDetailOverlay() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { sponsorId } = readSponsorDetailQueryStack(searchParams)
  const [sponsorRow, setSponsorRow] = useState<SponsorManagementRow | undefined>()
  const [isResolving, setIsResolving] = useState(false)

  const handleClose = useCallback(() => {
    setSearchParams(prev => clearSponsorDetailQueryStack(new URLSearchParams(prev)), {
      replace: true,
    })
  }, [setSearchParams])

  useEffect(() => {
    if (!sponsorId) {
      setSponsorRow(undefined)
      return
    }
    let cancelled = false
    setIsResolving(true)
    void resolveSponsorManagementRowById(queryClient, sponsorId).then(row => {
      if (cancelled) return
      setSponsorRow(row)
      setIsResolving(false)
      if (!row) handleClose()
    })
    return () => {
      cancelled = true
    }
  }, [handleClose, queryClient, sponsorId])

  const open = Boolean(sponsorId && (sponsorRow || isResolving))

  if (!sponsorId || (!sponsorRow && !isResolving)) return null

  if (!sponsorRow) return null

  return (
    <SponsorDetailFullPageModal open={open} onClose={handleClose} sponsor={sponsorRow} />
  )
}
