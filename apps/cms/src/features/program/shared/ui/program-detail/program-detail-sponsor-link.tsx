/**
 * 프로그램 상세 — 후원사명 링크 (후원사 홈페이지 새 탭)
 */

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { resolveSponsorManagementIdForDetailLink } from '@/features/sponsor/lib/sponsor-detail-page-url'
import './program-detail-sponsor-link.css'

export interface ProgramDetailSponsorLinkProps {
  name: string
  /** 후원사 홈페이지. 없으면 options 캐시·resolve로 조회 */
  homepageUrl?: string | null
  sponsorId?: string | null
  /** legacy id 외 표시명·관리 목록 id resolve용 */
  sponsorName?: string | null
  sponsorManagementId?: string | null
  className?: string
}

/** 상대·프로토콜 없는 주소를 새 탭용 absolute URL로 맞춤 */
export function normalizeSponsorHomepageUrl(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed || trimmed === '-') return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return `https://${trimmed}`
}

function lookupHomepageFromOptionsCache(
  queryClient: ReturnType<typeof useQueryClient>,
  managementId: string | undefined
): string | null {
  if (!managementId) return null
  const rows = queryClient.getQueryData<SponsorManagementRow[]>(
    dataManagementQueryKeys.sponsors.options()
  )
  const row = rows?.find(r => r.id === managementId)
  return normalizeSponsorHomepageUrl(row?.homepageUrl)
}

export function ProgramDetailSponsorLink({
  name,
  homepageUrl,
  sponsorId,
  sponsorName,
  sponsorManagementId,
  className,
}: ProgramDetailSponsorLinkProps) {
  const queryClient = useQueryClient()
  const trimmedName = name.trim()
  const [resolvedHomepageUrl, setResolvedHomepageUrl] = useState<string | null>(() =>
    normalizeSponsorHomepageUrl(homepageUrl)
  )

  useEffect(() => {
    const fromProp = normalizeSponsorHomepageUrl(homepageUrl)
    if (fromProp) {
      setResolvedHomepageUrl(fromProp)
      return
    }
    if (!trimmedName) {
      setResolvedHomepageUrl(null)
      return
    }

    let cancelled = false
    void resolveSponsorManagementIdForDetailLink(queryClient, {
      sponsorId,
      sponsorName: sponsorName ?? trimmedName,
      sponsorManagementId,
    }).then(id => {
      if (cancelled) return
      setResolvedHomepageUrl(lookupHomepageFromOptionsCache(queryClient, id))
    })
    return () => {
      cancelled = true
    }
  }, [queryClient, homepageUrl, sponsorId, sponsorManagementId, sponsorName, trimmedName])

  if (!trimmedName) return <>-</>

  if (!resolvedHomepageUrl) {
    return <span>{trimmedName}</span>
  }

  return (
    <button
      type="button"
      className={['program-detail-sponsor-link', className].filter(Boolean).join(' ')}
      onClick={() => {
        window.open(resolvedHomepageUrl, '_blank', 'noopener,noreferrer')
      }}
    >
      {trimmedName}
    </button>
  )
}
