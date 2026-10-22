import type { InterviewItem } from '@/entities/recruit-guide/model/types'
import type { CareerGuideAdminInterviewResponse } from '@/shared/api/generated/careers/schemas/careerGuideAdminInterviewResponse'

export function mapInterview(row: CareerGuideAdminInterviewResponse): InterviewItem {
  const id = row.id
  const displayOrder = row.displayOrder
  const impactStoryId = row.impactStoryId ?? null
  if (
    id == null ||
    !Number.isInteger(id) ||
    id <= 0 ||
    displayOrder == null ||
    !Number.isInteger(displayOrder) ||
    displayOrder <= 0 ||
    (impactStoryId != null && (!Number.isInteger(impactStoryId) || impactStoryId <= 0))
  ) {
    throw new Error('CAREER_GUIDE_INTERVIEW_RESPONSE_INVALID')
  }
  return {
    id: String(id),
    displayOrder,
    impactStoryId,
    storyKey: row.storyKey?.trim() || undefined,
    linkStatus: row.linkStatus?.trim() || undefined,
    impactStory: row.impactStory ?? null,
    title: row.title ?? '',
    publishedYear: row.year ?? null,
    version: row.version ?? 0,
    imageUrl: row.coverImageUrl || row.impactStory?.imageUrl || undefined,
  }
}
