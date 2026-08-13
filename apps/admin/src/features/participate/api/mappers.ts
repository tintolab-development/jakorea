import type { ParticipateMenuLinks } from '@/entities/participate/model/types'
import type { LinkResponse } from '@/shared/api/generated/participation/schemas/linkResponse'
import type { LinksUpdateRequest } from '@/shared/api/generated/participation/schemas/linksUpdateRequest'

/** BE 고정 id · menu_code */
export const PARTICIPATE_LINK_FIXED = {
  onlineLearning: { id: 1, menuCode: 'ONLINE_LEARNING' },
  alumni: { id: 2, menuCode: 'ALUMNI' },
} as const

function urlFromResponse(url: string | undefined): string {
  return typeof url === 'string' ? url : ''
}

function toExternalUrlOrOmit(url: string): string | undefined {
  const trimmed = url.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function mapLinkResponsesToDomain(rows: LinkResponse[]): ParticipateMenuLinks {
  const byCode = new Map(
    (rows ?? [])
      .filter(row => typeof row.menuCode === 'string' && row.menuCode)
      .map(row => [row.menuCode!, row]),
  )
  const online = byCode.get(PARTICIPATE_LINK_FIXED.onlineLearning.menuCode)
  const alumni = byCode.get(PARTICIPATE_LINK_FIXED.alumni.menuCode)

  return {
    onlineLearningId: online?.id ?? PARTICIPATE_LINK_FIXED.onlineLearning.id,
    onlineLearningUrl: urlFromResponse(online?.externalUrl),
    onlineLearningVersion: online?.version ?? 0,
    alumniId: alumni?.id ?? PARTICIPATE_LINK_FIXED.alumni.id,
    alumniUrl: urlFromResponse(alumni?.externalUrl),
    alumniVersion: alumni?.version ?? 0,
    updatedAt: '',
  }
}

/** PUT은 고정 2메뉴 전체 교체 (id + version 필수) */
export function toLinksUpdateRequest(data: ParticipateMenuLinks): LinksUpdateRequest {
  return {
    items: [
      {
        id: data.onlineLearningId,
        externalUrl: toExternalUrlOrOmit(data.onlineLearningUrl),
        version: data.onlineLearningVersion,
      },
      {
        id: data.alumniId,
        externalUrl: toExternalUrlOrOmit(data.alumniUrl),
        version: data.alumniVersion,
      },
    ],
  }
}
