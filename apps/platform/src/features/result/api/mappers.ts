import { formatAnnouncedAtDetailLabel, formatAnnouncedAtLabel } from '../lib/format'
import type { ResultDetail, ResultListItem } from '../model/types'
import type { ProgramResultDetail, ProgramResultListItem, ProgramResultNeighbor } from './types'

export function mapProgramResultListItem(item: ProgramResultListItem): ResultListItem {
  return {
    id: String(item.resultId),
    title: item.title,
    categoryId: String(item.categoryId),
    categoryName: item.categoryName,
    announcedAt: item.announcedAt,
    announcedAtLabel: formatAnnouncedAtLabel(item.announcedAt),
  }
}

function mapNeighbor(neighbor: ProgramResultNeighbor): ResultListItem | null {
  if (!neighbor) return null
  return {
    id: String(neighbor.resultId),
    title: neighbor.title,
    categoryId: '',
    categoryName: '',
    announcedAt: '',
    announcedAtLabel: '',
  }
}

export function mapProgramResultDetail(detail: ProgramResultDetail): ResultDetail {
  const item = mapProgramResultListItem(detail)
  return {
    ...item,
    content: detail.content,
    author: '',
    viewCount: detail.viewCount,
    announcedAtDetailLabel: formatAnnouncedAtDetailLabel(detail.announcedAt),
    attachments: detail.attachments.map(file => ({
      name: file.originalFilename,
      fileUrl: file.downloadEndpoint,
    })),
  }
}

export function mapProgramResultNeighbors(detail: ProgramResultDetail): {
  previous: ResultListItem | null
  next: ResultListItem | null
} {
  return {
    previous: mapNeighbor(detail.previous),
    next: mapNeighbor(detail.next),
  }
}
