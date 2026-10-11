import type { SponsorLogoFile } from '@/features/sponsor/model/sponsor-management.types'
import { getFileStatus } from '@/shared/lib/admin-file-upload'
import { shouldMockAdminFileUpload } from '@/shared/lib/admin-file-upload/upload-maybe-mock'

/** BE `logoFileId` — 숫자 fileObjectId 또는 레거시·mock 파일명 문자열 */
export function parseSponsorLogoFileObjectId(id: string): number | null {
  const trimmed = id.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function sponsorLogoFallbackFileName(id: string): string {
  const fileObjectId = parseSponsorLogoFileObjectId(id)
  return fileObjectId != null ? `첨부파일-${fileObjectId}` : id.trim() || '후원사 로고'
}

function hasResolvedDisplayFileName(logo: SponsorLogoFile): boolean {
  const name = logo.fileName.trim()
  if (!name) return false
  if (name === '후원사 로고') return false
  const fileObjectId = parseSponsorLogoFileObjectId(logo.id)
  if (fileObjectId != null && name === sponsorLogoFallbackFileName(logo.id)) return false
  return true
}

/**
 * 숫자 `logoFileId`는 관리자 파일 API `originalFileName`으로 표시명을 채운다.
 */
export async function enrichSponsorLogoFiles(
  logos: ReadonlyArray<SponsorLogoFile>
): Promise<SponsorLogoFile[]> {
  if (logos.length === 0) return []

  if (shouldMockAdminFileUpload()) {
    return logos.map(logo => ({
      ...logo,
      fileName: logo.fileName.trim() || sponsorLogoFallbackFileName(logo.id),
    }))
  }

  return Promise.all(
    logos.map(async logo => {
      if (hasResolvedDisplayFileName(logo)) return logo

      const fileObjectId = parseSponsorLogoFileObjectId(logo.id)
      if (fileObjectId == null) {
        return { ...logo, fileName: logo.fileName.trim() || logo.id }
      }

      try {
        const meta = await getFileStatus(fileObjectId)
        const name = meta.originalFileName?.trim()
        if (name) return { ...logo, fileName: name }
      } catch {
        // 표시명만 fallback — 다운로드는 fileObjectId로 처리
      }

      return { ...logo, fileName: sponsorLogoFallbackFileName(logo.id) }
    })
  )
}
