/**
 * 프로그램 상세 — 후원사명 링크 (후원사 관리 상세 `/sponsor`로 이동)
 */

import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  buildSponsorDetailPageUrl,
  resolveSponsorManagementIdForDetailLink,
} from '@/features/sponsor/lib/sponsor-detail-page-url'
import { resolveSponsorManagementRowById } from '@/features/sponsor/lib/sponsor-detail-query-stack'
import './program-detail-sponsor-link.css'

export interface ProgramDetailSponsorLinkProps {
  name: string
  /** @deprecated 홈페이지 새 탭 대신 후원사 상세로 이동 — 호환용으로 유지 */
  homepageUrl?: string | null
  sponsorId?: string | null
  /** legacy id 외 표시명·관리 목록 id resolve용 */
  sponsorName?: string | null
  sponsorManagementId?: string | null
  className?: string
}

/** 상대·프로토콜 없는 주소를 absolute URL로 맞춤 (레거시·테스트용) */
export function normalizeSponsorHomepageUrl(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed || trimmed === '-') return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return `https://${trimmed}`
}

function lookupOrganizationKindFromOptionsCache(
  queryClient: ReturnType<typeof useQueryClient>,
  managementId: string | undefined
): string | undefined {
  if (!managementId) return undefined
  const rows = queryClient.getQueryData<SponsorManagementRow[]>(
    dataManagementQueryKeys.sponsors.options()
  )
  return rows?.find(r => r.id === managementId)?.organizationKind
}

export function ProgramDetailSponsorLink({
  name,
  sponsorId,
  sponsorName,
  sponsorManagementId,
  className,
}: ProgramDetailSponsorLinkProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const trimmedName = name.trim()
  const [navigating, setNavigating] = useState(false)

  const handleClick = useCallback(async () => {
    if (navigating) return
    setNavigating(true)
    try {
      const id = await resolveSponsorManagementIdForDetailLink(queryClient, {
        sponsorId,
        sponsorName: sponsorName ?? trimmedName,
        sponsorManagementId,
      })
      if (!id) return

      const row =
        (await resolveSponsorManagementRowById(queryClient, id)) ??
        undefined
      const organizationKind =
        row?.organizationKind ?? lookupOrganizationKindFromOptionsCache(queryClient, id)
      const returnTo = `${location.pathname}${location.search}${location.hash}`

      navigate(
        buildSponsorDetailPageUrl(id, {
          organizationKind,
          returnTo,
        })
      )
    } finally {
      setNavigating(false)
    }
  }, [
    navigating,
    queryClient,
    sponsorId,
    sponsorName,
    sponsorManagementId,
    trimmedName,
    location.pathname,
    location.search,
    location.hash,
    navigate,
  ])

  if (!trimmedName) return <>-</>

  const canNavigate = Boolean(
    sponsorManagementId?.trim() || sponsorId?.trim() || trimmedName
  )
  if (!canNavigate) {
    return <span>{trimmedName}</span>
  }

  return (
    <button
      type="button"
      className={['program-detail-sponsor-link', className].filter(Boolean).join(' ')}
      disabled={navigating}
      onClick={() => {
        void handleClick()
      }}
    >
      {trimmedName}
    </button>
  )
}
