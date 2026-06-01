/**
 * 프로그램 상세 — 후원사명 링크 (후원사 관리 상세 풀페이지)
 */

import { useNavigate } from 'react-router-dom'
import {
  buildSponsorDetailPageUrl,
  resolveSponsorManagementIdForDetailLink,
} from '@/features/sponsor/lib/sponsor-detail-page-url'
import './program-detail-sponsor-link.css'

export interface ProgramDetailSponsorLinkProps {
  name: string
  sponsorId?: string | null
  /** legacy mock id 외 표시명·관리 목록 id resolve용 */
  sponsorName?: string | null
  sponsorManagementId?: string | null
  className?: string
}

export function ProgramDetailSponsorLink({
  name,
  sponsorId,
  sponsorName,
  sponsorManagementId,
  className,
}: ProgramDetailSponsorLinkProps) {
  const navigate = useNavigate()
  const trimmedName = name.trim()
  if (!trimmedName) return <>-</>

  const managementId = resolveSponsorManagementIdForDetailLink({
    sponsorId,
    sponsorName: sponsorName ?? trimmedName,
    sponsorManagementId,
  })

  if (!managementId) {
    return <span>{trimmedName}</span>
  }

  return (
    <button
      type="button"
      className={['program-detail-sponsor-link', className].filter(Boolean).join(' ')}
      onClick={() => navigate(buildSponsorDetailPageUrl(managementId))}
    >
      {trimmedName}
    </button>
  )
}
