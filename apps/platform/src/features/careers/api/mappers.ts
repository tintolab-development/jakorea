/**
 * 공개 채용 안내 → 화면 모델
 *
 * mainText·subTextKo·culture title/description 개행은 유지한다.
 * culture title→summaryLines, description→detailLines (`\n` 분할, 없으면 fallback).
 * interview title은 한 줄. titleLines·publishedAtLabel은 storyKey가 같을 때만 fallback.
 * year로 월·일을 만들지 않는다.
 *
 * 공고: publishedOn(YYYY-MM-DD)을 우선하고, 없으면 publishedAt(date-time)으로 날짜를 만든다.
 * 라벨은 `2026년 05월 08일`. CLOSED는 공개 목록에 없다.
 */
import type { CareersGuideView } from '../model/guide-view'
import type {
  CareerJobListItem,
  CareerJobStatus,
  CareerPostingAttachment,
  CareerPostingDetail,
  CareersFeaturedStory,
  ThriveValue,
  ThriveValueId,
} from '../model/types'
import type {
  CareersTalentCareerType,
  CareersTalentEducationLevel,
  CareersTalentJobInterest,
} from '../lib/talent-apply-form'
import type { CareersTalentApplySchemaValues } from '../lib/validate-talent-apply-form'
import type {
  PublicCareerCultureItem,
  PublicCareerGuideResponse,
  PublicCareerInterview,
  PublicCareerPostingAsset,
  PublicCareerPostingDetail,
  PublicCareerPostingItem,
  PublicCareerPostingListResponse,
  PublicCareerTalentApplicationCreateRequest,
  PublicCareerTalentCareerType,
  PublicCareerTalentEducationLevel,
  PublicCareerTalentJobInterest,
} from './types'
import { formatDisplayDate, formatDisplayDateRange } from '../../../shared/lib/format-display-date.ts'

const CULTURE_CODE_TO_ID: Record<string, ThriveValueId> = {
  MAKE_AN_IMPACT: 'impact',
  KEEP_LEARNING: 'learn',
  SPEAK_OPENLY: 'speak',
  READY_TO_HELP: 'help',
}

function splitPreservedLines(value: string | undefined | null): string[] {
  if (typeof value !== 'string') return []
  return value.split('\n')
}

function singleLine(value: string | undefined | null): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\n/g, ' ').trim()
}

/** API `\n`이 있으면 그대로, 한 줄이면 fallback 시안 줄바꿈을 유지한다. */
function resolvePreservedLines(
  raw: string | undefined | null,
  fallbackLines: readonly string[]
): string[] {
  const lines = splitPreservedLines(raw)
    .map(line => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return [...fallbackLines]
  if (lines.length === 1 && lines[0] === fallbackLines.join(' ')) {
    return [...fallbackLines]
  }
  return lines
}

function resolveRemoteOrFallback(remote: string | null | undefined, fallback: string): string {
  const url = typeof remote === 'string' ? remote.trim() : ''
  return url || fallback
}

function mapCultureItem(
  item: PublicCareerCultureItem,
  fallbackById: Map<ThriveValueId, ThriveValue>
): ThriveValue | null {
  const code = typeof item.code === 'string' ? item.code.trim() : ''
  const id = CULTURE_CODE_TO_ID[code]
  if (!id) return null
  const fallback = fallbackById.get(id)
  if (!fallback) return null

  const label = singleLine(item.label) || fallback.title
  const summaryLines = resolvePreservedLines(item.title, fallback.summaryLines)
  const detailLines = resolvePreservedLines(item.description, fallback.detailLines)

  return {
    ...fallback,
    title: label,
    summary: summaryLines.join(' '),
    summaryLines,
    detail: detailLines.join(' '),
    detailLines,
  }
}

function mapInterview(
  item: PublicCareerInterview,
  fallbackByKey: Map<string, CareersFeaturedStory>,
  defaultCover: string
): CareersFeaturedStory | null {
  const storyKey = typeof item.storyKey === 'string' ? item.storyKey.trim() : ''
  if (!storyKey) return null
  const fallback = fallbackByKey.get(storyKey)

  const title = singleLine(item.title) || fallback?.title || ''
  if (!title) return null

  return {
    id: storyKey,
    categoryLabel: '스토리',
    title,
    titleLines: fallback?.titleLines,
    publishedAtLabel: fallback?.publishedAtLabel ?? '',
    imageUrl: resolveRemoteOrFallback(item.coverImageUrl, defaultCover),
  }
}

export function mapPublicCareerGuide(
  response: PublicCareerGuideResponse,
  fallback: CareersGuideView
): CareersGuideView {
  const titleLines = splitPreservedLines(response.mainText).filter(Boolean)
  const descriptionKo = splitPreservedLines(response.subTextKo).filter(Boolean)
  const descriptionEn =
    typeof response.subTextEn === 'string' ? response.subTextEn.replace(/\n/g, ' ').trim() : ''

  const fallbackById = new Map(fallback.thriveValues.map(item => [item.id, item]))
  const cultureSorted = [...(response.cultureItems ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  )
  const thriveValues = cultureSorted
    .map(item => mapCultureItem(item, fallbackById))
    .filter((item): item is ThriveValue => item != null)

  const defaultCover = fallback.featuredStories[0]?.imageUrl ?? fallback.hero.imageUrl
  const fallbackByKey = new Map(fallback.featuredStories.map(item => [item.id, item]))
  const interviewSorted = [...(response.interviews ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  )
  const featuredStories = interviewSorted
    .map(item => mapInterview(item, fallbackByKey, defaultCover))
    .filter((item): item is CareersFeaturedStory => item != null)

  return {
    hero: {
      label: fallback.hero.label,
      titleLines: titleLines.length > 0 ? titleLines : fallback.hero.titleLines,
      descriptionKo: descriptionKo.length > 0 ? descriptionKo : fallback.hero.descriptionKo,
      descriptionEn: descriptionEn || fallback.hero.descriptionEn,
      imageUrl: resolveRemoteOrFallback(response.bannerImageUrl, fallback.hero.imageUrl),
      imageFallbackUrl: fallback.hero.imageFallbackUrl,
      imageAlt: fallback.hero.imageAlt,
    },
    thriveValues: thriveValues.length === 4 ? thriveValues : fallback.thriveValues,
    featuredStories: featuredStories.length === 3 ? featuredStories : fallback.featuredStories,
  }
}

const STATUS_LABEL: Record<CareerJobStatus, string> = {
  recruiting: '모집중',
  result: '결과발표',
  closed: '모집완료',
}

function mapPostingStatus(status: string | undefined): CareerJobStatus | null {
  if (status === 'RECRUITING') return 'recruiting'
  if (status === 'RESULT') return 'result'
  if (status === 'CLOSED') return 'closed'
  return null
}

/** YYYY-MM-DD → `2026년 05월 08일`. 타임존으로 하루 밀리지 않게 날짜만 쓴다. */
export function formatCareerPublishedAtLabel(publishedOn: string | undefined | null): string {
  if (typeof publishedOn !== 'string') return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(publishedOn.trim())
  if (!match) return ''
  return `${match[1]}년 ${match[2]}월 ${match[3]}일`
}

/**
 * 상세 메타. 날짜만 오면 시각을 생략한다.
 * 시각이 있으면 `2026년 01월 15일 오후 3:00`. 문자열의 벽시계를 쓴다.
 */
export function formatCareerPublishedAtDetailLabel(value: string | undefined | null): string {
  if (typeof value !== 'string') return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value.trim())
  if (!match) return ''
  const dateLabel = `${match[1]}년 ${match[2]}월 ${match[3]}일`
  if (match[4] == null || match[5] == null) return dateLabel
  const hours24 = Number(match[4])
  const minutes = match[5]
  if (!Number.isInteger(hours24) || hours24 < 0 || hours24 > 23) return dateLabel
  const period = hours24 < 12 ? '오전' : '오후'
  const hours12 = hours24 % 12 || 12
  return `${dateLabel} ${period} ${hours12}:${minutes}`
}

/** YYYY-MM-DD → `2026년 4월 3일(금)`. 잘못된 날짜는 빈 문자열. */
export function formatCareerDateWithWeekday(value: string | undefined | null): string {
  if (typeof value !== 'string') return ''
  return formatDisplayDate(value)
}

/** 시작·종료가 둘 다 유효할 때만. 하나라도 없으면 빈 문자열. */
export function formatCareerRecruitPeriodLabel(
  start: string | undefined | null,
  end: string | undefined | null
): string {
  const startLabel = formatCareerDateWithWeekday(start)
  const endLabel = formatCareerDateWithWeekday(end)
  if (!startLabel || !endLabel) return ''
  return formatDisplayDateRange(start, end, { empty: '' })
}

export function mapPublicCareerPostingItem(
  item: PublicCareerPostingItem
): CareerJobListItem | null {
  const status = mapPostingStatus(item.status)
  if (!status || status === 'closed') return null

  const title = singleLine(item.title)
  if (!title) return null

  const id = postingKey(item)
  if (!id) return null

  const publishedAtLabel = formatCareerPublishedAtLabel(item.publishedOn)
  if (!publishedAtLabel) return null

  return {
    id,
    title,
    status,
    statusLabel: STATUS_LABEL[status],
    publishedAtLabel,
  }
}

function postingKey(item: { id?: number; externalKey?: string }): string {
  const externalKey =
    typeof item.externalKey === 'string' && item.externalKey.trim() ? item.externalKey.trim() : ''
  if (externalKey) return externalKey
  return typeof item.id === 'number' && Number.isFinite(item.id) ? String(item.id) : ''
}

function mapPostingAttachment(
  attachment: PublicCareerPostingAsset | null | undefined
): CareerPostingAttachment[] {
  if (!attachment) return []
  const name = singleLine(attachment.originalName)
  const fileUrl = typeof attachment.publicUrl === 'string' ? attachment.publicUrl.trim() : ''
  if (!name || !fileUrl) return []
  const id =
    typeof attachment.assetId === 'number' && Number.isFinite(attachment.assetId)
      ? String(attachment.assetId)
      : 'attachment-1'
  return [
    {
      id,
      name,
      fileUrl,
    },
  ]
}

export function mapPublicCareerPostingDetail(
  item: PublicCareerPostingDetail
): CareerPostingDetail | null {
  const status = mapPostingStatus(item.status)
  if (!status || status === 'closed') return null

  const title = singleLine(item.title)
  if (!title) return null

  const id = postingKey(item)
  if (!id) return null

  const publishedOn = typeof item.publishedOn === 'string' ? item.publishedOn.trim() : ''
  const publishedAt = typeof item.publishedAt === 'string' ? item.publishedAt.trim() : ''
  const publishSource = publishedOn || publishedAt
  const publishedAtLabel = formatCareerPublishedAtLabel(publishSource)
  if (!publishedAtLabel) return null

  const viewCount =
    typeof item.viewCount === 'number' && Number.isFinite(item.viewCount) ? item.viewCount : null

  return {
    id,
    title,
    status,
    statusLabel: STATUS_LABEL[status],
    publishedAtLabel,
    publishedAtDetailLabel: formatCareerPublishedAtDetailLabel(publishedAt || publishedOn),
    recruitPeriodLabel: formatCareerRecruitPeriodLabel(item.recruitStart, item.recruitEnd),
    content: typeof item.body === 'string' ? item.body : '',
    contentFormat: 'html',
    viewCount,
    attachments: mapPostingAttachment(item.attachment),
  }
}

export function mapPublicCareerPostings(
  response: PublicCareerPostingListResponse
): CareerJobListItem[] {
  return (response.items ?? [])
    .map(mapPublicCareerPostingItem)
    .filter((row): row is CareerJobListItem => row != null)
}

const JOB_INTEREST_TO_API: Record<CareersTalentJobInterest, PublicCareerTalentJobInterest> = {
  managementPlanning: 'MANAGEMENT_PLANNING',
  prDesign: 'PR_DESIGN',
  accounting: 'ACCOUNTING',
  hrAdmin: 'HR_ADMIN',
  educationOps: 'EDUCATION_OPS',
  other: 'OTHER',
}

const EDUCATION_LEVEL_TO_API: Record<
  CareersTalentEducationLevel,
  PublicCareerTalentEducationLevel
> = {
  highSchool: 'HIGH_SCHOOL',
  college: 'COLLEGE',
  university: 'UNIVERSITY',
  master: 'MASTER',
  doctor: 'DOCTOR',
  other: 'OTHER',
}

const CAREER_TYPE_TO_API: Record<CareersTalentCareerType, PublicCareerTalentCareerType> = {
  newbie: 'NEWBIE',
  experienced: 'EXPERIENCED',
}

function optionalTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? ''
  return trimmed ? trimmed : undefined
}

/** 폼 값 → 공개 지원 POST body. privacyAgreed는 항상 true. */
export function toPublicCareerTalentApplicationCreateRequest(
  values: CareersTalentApplySchemaValues,
  attachmentAssetId?: number
): PublicCareerTalentApplicationCreateRequest {
  return {
    jobInterest: JOB_INTEREST_TO_API[values.jobInterest],
    name: values.name.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    addressRoad: values.addressRoad.trim(),
    addressDetail: optionalTrimmed(values.addressDetail),
    educationLevel: EDUCATION_LEVEL_TO_API[values.educationLevel],
    schoolName: values.schoolName.trim(),
    major: optionalTrimmed(values.major),
    educationInfo: optionalTrimmed(values.educationInfo),
    careerType: CAREER_TYPE_TO_API[values.careerType],
    careerInfo: optionalTrimmed(values.careerInfo),
    privacyAgreed: true,
    ...(attachmentAssetId != null ? { attachmentAssetId } : {}),
  }
}
