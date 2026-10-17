import type { SponsorLogoFile } from '@/features/sponsor/model/sponsor-management.types'
import type { BasicInfoEditState } from '@/features/sponsor/ui/sponsor-detail-basic-info'
import { parseSponsorLogoFileObjectId } from '@/features/sponsor/lib/sponsor-logo-files'
import { uploadSponsorLogoFile } from '@/features/sponsor/api/sponsor-logo-upload'
import type { SponsorDetailResponse } from '@/shared/api/generated/data-management/schemas'

export function toLogoFileObjectId(id: string): number {
  const fileObjectId = parseSponsorLogoFileObjectId(id)
  if (fileObjectId == null) {
    throw new Error('로고 파일 ID를 확인할 수 없습니다.')
  }
  return fileObjectId
}

export function mapDtoLogoFiles(
  dto: Pick<SponsorDetailResponse, 'logoFileId' | 'logoFiles'>
): SponsorLogoFile[] {
  if (dto.logoFiles !== undefined) {
    const sorted = [...dto.logoFiles].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    )
    return sorted
      .filter(entry => entry.fileObjectId != null && entry.fileObjectId >= 1)
      .map(entry => ({
        id: String(entry.fileObjectId),
        fileName: entry.originalFileName?.trim() ?? '',
      }))
  }

  const legacyId = dto.logoFileId?.trim()
  if (!legacyId) return []
  return [{ id: legacyId, fileName: legacyId.includes('.') ? legacyId : '' }]
}

export function sponsorLogosChanged(
  existingLogos: ReadonlyArray<SponsorLogoFile>,
  edit: Pick<BasicInfoEditState, 'logos' | 'pendingLogoFiles'>
): boolean {
  if (edit.pendingLogoFiles.length > 0) return true
  const existingIds = existingLogos.map(logo => logo.id)
  const editIds = edit.logos.map(logo => logo.id)
  if (existingIds.length !== editIds.length) return true
  return existingIds.some((id, index) => id !== editIds[index])
}

export function buildLogoFileIdsForPatch(
  keptLogos: ReadonlyArray<SponsorLogoFile>,
  uploadedIds: ReadonlyArray<number>
): number[] {
  const keptIds = keptLogos.map(logo => toLogoFileObjectId(logo.id))
  return [...keptIds, ...uploadedIds]
}

export async function uploadSponsorLogoFiles(
  sponsorId: number,
  files: ReadonlyArray<File>
): Promise<number[]> {
  const ids: number[] = []
  for (const file of files) {
    ids.push(await uploadSponsorLogoFile(sponsorId, file))
  }
  return ids
}
