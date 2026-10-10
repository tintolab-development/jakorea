import type { SponsorLogoFile } from '@/features/sponsor/model/sponsor-management.types'
import { parseSponsorLogoFileObjectId } from '@/features/sponsor/lib/sponsor-logo-files'
import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
import { downloadFile } from '@/shared/lib/file-download'

/**
 * 후원사 로고를 순차 다운로드합니다. (BE 일괄 zip API 전 — 클라이언트 단건 연속 다운로드)
 */
export async function downloadSponsorLogos(logos: ReadonlyArray<SponsorLogoFile>): Promise<void> {
  for (const logo of logos) {
    const fileName = logo.fileName.trim() || `sponsor-logo-${logo.id}`
    const fileObjectId = parseSponsorLogoFileObjectId(logo.id)
    if (fileObjectId != null) {
      await downloadAdminFile({ fileObjectId, fileName })
      continue
    }
    await downloadFile(fileName)
  }
}
