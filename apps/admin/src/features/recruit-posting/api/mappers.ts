/**
 * 채용공고 — OpenAPI ↔ 도메인 매핑
 */

import type { RecruitPosting, RecruitPostingStatus } from '@/entities/recruit-posting/model/types'
import type { CareerPostingAdminItem } from '@/shared/api/generated/careers/schemas/careerPostingAdminItem'
import type { CareerPostingAdminItemStatus } from '@/shared/api/generated/careers/schemas/careerPostingAdminItemStatus'

function mapStatus(status: CareerPostingAdminItemStatus | undefined): RecruitPostingStatus | null {
  if (status === 'RECRUITING') return 'recruiting'
  if (status === 'RESULT') return 'result'
  if (status === 'CLOSED') return 'closed'
  return null
}

function text(value: string | null | undefined): string {
  return value ?? ''
}

export function mapCareerPostingAdminItem(row: CareerPostingAdminItem): RecruitPosting | null {
  if (row.id == null) return null
  const status = mapStatus(row.status)
  if (!status) return null
  return {
    id: String(row.id),
    isPublic: row.isPublic ?? false,
    status,
    title: text(row.title),
    authorName: text(row.authorName),
    recruitStart: text(row.recruitStart),
    recruitEnd: text(row.recruitEnd),
    publishedAt: text(row.publishedOn),
    createdAt: text(row.createdAt),
    version: row.version ?? 0,
  }
}

export function toNumericId(id: string): number {
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('채용공고 id가 올바르지 않습니다.')
  }
  return numericId
}
