/**
 * 프로그램 상세 조회 — 후원사 홈페이지·대표 로고
 * GET `/programs/{id}/sponsors` 배정 응답(sponsorAssignmentDetails)만 쓴다.
 * 후원사 상세·담당자 API로 빈 값을 채우지 않는다.
 */

import type { ReactNode } from 'react'
import type { ProgramSponsorAssignmentDetail } from '@/types/domain'
import { FileDownloadRowIcon } from '@/shared/ui/icons/FileDownloadRowIcon'
import { downloadSponsorLogos } from '@/features/sponsor/lib/download-sponsor-logos'
import { sponsorLogoFallbackFileName } from '@/features/sponsor/lib/sponsor-logo-files'
import { normalizeSponsorHomepageUrl } from '@/features/program/shared/ui/program-detail/program-detail-sponsor-link'
import './program-detail-sponsor-link.css'

export interface ProgramSponsorAssignmentInfoProps {
  sponsorIds: readonly string[]
  sponsorNameById?: Readonly<Record<string, string>>
  details?: Readonly<Record<string, ProgramSponsorAssignmentDetail>>
}

function renderPerSponsor(
  { sponsorIds, sponsorNameById, details }: ProgramSponsorAssignmentInfoProps,
  renderValue: (detail: ProgramSponsorAssignmentDetail | undefined) => ReactNode
): ReactNode {
  const ids = sponsorIds.map(id => id.trim()).filter(Boolean)
  if (ids.length === 0) return <>-</>
  if (ids.length === 1) return <>{renderValue(details?.[ids[0]!])}</>
  return (
    <div className="program-detail-sponsor-assignment-info__stack">
      {ids.map(id => {
        const name = sponsorNameById?.[id]?.trim()
        return (
          <div key={id} className="program-detail-sponsor-assignment-info__row">
            {name ? (
              <span className="program-detail-sponsor-assignment-info__sponsor-name">{name}</span>
            ) : null}
            {renderValue(details?.[id])}
          </div>
        )
      })}
    </div>
  )
}

export function ProgramSponsorHomepageView(props: ProgramSponsorAssignmentInfoProps): ReactNode {
  return renderPerSponsor(props, detail => {
    const raw = detail?.homepageUrl?.trim()
    const href = normalizeSponsorHomepageUrl(raw)
    if (!raw || !href) return <span>-</span>
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {raw}
      </a>
    )
  })
}

export function ProgramSponsorLogoView(props: ProgramSponsorAssignmentInfoProps): ReactNode {
  return renderPerSponsor(props, detail => {
    const fileObjectId = detail?.logoFileObjectId
    if (fileObjectId == null) return <span>-</span>
    const id = String(fileObjectId)
    const displayName = detail?.logoFileName?.trim() || sponsorLogoFallbackFileName(id)
    return (
      <button
        type="button"
        className="program-detail-sponsor-assignment-info__logo-btn"
        onClick={() => {
          void downloadSponsorLogos([{ id, fileName: displayName }])
        }}
        aria-label={`${displayName} 다운로드`}
      >
        <span className="program-detail-sponsor-assignment-info__logo-icon" aria-hidden>
          <FileDownloadRowIcon />
        </span>
        <span className="program-detail-sponsor-assignment-info__logo-name">{displayName}</span>
      </button>
    )
  })
}
