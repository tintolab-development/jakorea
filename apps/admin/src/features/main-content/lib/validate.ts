/**
 * 메인 콘텐츠 섹션 — Homepage BE required 스키마와 동일한 저장 전 검증
 */

import type {
  DonationSection,
  EducationSection,
  ImpactStorySection,
  PerformanceMetricId,
  PerformanceSection,
} from '@/entities/main-content/model/types'
import { isValidHttpLinkUrl } from '@/shared/lib/http-link-url'

export const MAIN_CONTENT_LIMITS = {
  educationTitle: 300,
  impactTitle: 1000,
  youtubeUrl: 2048,
  performanceTitle: 300,
  bottomText: 2000,
  donationTitle: 1000,
  ctaLabel: 100,
  ctaUrl: 2048,
} as const

/** SafeYoutubeUrl.ALLOWED_HOSTS 와 동일 */
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])

export const PERFORMANCE_METRIC_FIELDS: Record<
  PerformanceMetricId,
  | 'networkDistributionCount'
  | 'partnerOrganizationCount'
  | 'educatorCount'
  | 'youthBeneficiaryCount'
> = {
  network: 'networkDistributionCount',
  partners: 'partnerOrganizationCount',
  volunteers: 'educatorCount',
  beneficiaries: 'youthBeneficiaryCount',
}

export type MainContentFieldErrors = Record<string, string>

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

function overMax(value: string, max: number): boolean {
  return value.trim().length > max
}

function requiredMessage(field: string): string {
  return `${field}: must not be blank`
}

function maxLengthMessage(field: string, max: number): string {
  return `${field}: size must be between 1 and ${max}`
}

/** BE `^https?://.+` — 스킴만 있고 호스트가 없는 값은 거절 */
export function isValidRequiredHttpUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!/^https?:\/\/.+/i.test(trimmed)) return false
  return isValidHttpLinkUrl(trimmed)
}

export function isValidYouTubeLinkUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!isValidRequiredHttpUrl(trimmed)) return false
  try {
    const host = new URL(trimmed).hostname.toLowerCase()
    return YOUTUBE_HOSTS.has(host)
  } catch {
    return false
  }
}

export function parseNonNegativeInt(value: string): number | null {
  const digits = value.trim().replace(/,/g, '')
  if (!/^\d+$/.test(digits)) return null
  const n = Number(digits)
  if (!Number.isSafeInteger(n) || n < 0) return null
  return n
}

function setError(errors: MainContentFieldErrors, field: string, message: string) {
  if (!errors[field]) errors[field] = message
}

function validateRequiredTitle(
  errors: MainContentFieldErrors,
  title: string,
  max: number,
) {
  if (isBlank(title)) setError(errors, 'title', requiredMessage('title'))
  else if (overMax(title, max)) setError(errors, 'title', maxLengthMessage('title', max))
}

export function validateEducationSection(
  section: EducationSection,
): MainContentFieldErrors {
  const errors: MainContentFieldErrors = {}
  validateRequiredTitle(errors, section.title, MAIN_CONTENT_LIMITS.educationTitle)
  return errors
}

export function validateImpactStorySection(
  section: ImpactStorySection,
  featuredOptionIds: readonly string[],
): MainContentFieldErrors {
  const errors: MainContentFieldErrors = {}
  validateRequiredTitle(errors, section.title, MAIN_CONTENT_LIMITS.impactTitle)

  if (isBlank(section.youtubeUrl)) {
    setError(errors, 'youtubeUrl', requiredMessage('youtubeUrl'))
  } else if (overMax(section.youtubeUrl, MAIN_CONTENT_LIMITS.youtubeUrl)) {
    setError(errors, 'youtubeUrl', maxLengthMessage('youtubeUrl', MAIN_CONTENT_LIMITS.youtubeUrl))
  } else if (!isValidYouTubeLinkUrl(section.youtubeUrl)) {
    setError(errors, 'youtubeUrl', 'youtubeUrl must use an official YouTube host.')
  }

  const featuredId = Number(section.featuredContentId.trim())
  if (!Number.isInteger(featuredId) || featuredId <= 0) {
    setError(errors, 'featuredStoryId', 'featuredStoryId is required.')
  } else if (!featuredOptionIds.includes(String(featuredId))) {
    setError(
      errors,
      'featuredStoryId',
      'The representative Impact Story must already be public and its publication time must have arrived.',
    )
  }
  return errors
}

export function validatePerformanceSection(
  section: PerformanceSection,
): MainContentFieldErrors {
  const errors: MainContentFieldErrors = {}
  validateRequiredTitle(errors, section.title, MAIN_CONTENT_LIMITS.performanceTitle)

  for (const metric of section.metrics) {
    const field = PERFORMANCE_METRIC_FIELDS[metric.id]
    if (parseNonNegativeInt(metric.value) == null) {
      setError(errors, field, `${field}: must be greater than or equal to 0`)
    }
  }

  if (isBlank(section.bottomText)) {
    setError(errors, 'bottomText', requiredMessage('bottomText'))
  } else if (overMax(section.bottomText, MAIN_CONTENT_LIMITS.bottomText)) {
    setError(errors, 'bottomText', maxLengthMessage('bottomText', MAIN_CONTENT_LIMITS.bottomText))
  }
  return errors
}

export function validateDonationSection(
  section: DonationSection,
): MainContentFieldErrors {
  const errors: MainContentFieldErrors = {}
  validateRequiredTitle(errors, section.title, MAIN_CONTENT_LIMITS.donationTitle)

  const ctas = [
    {
      labelField: 'cta1Label',
      urlField: 'cta1Url',
      data: section.cta1,
    },
    {
      labelField: 'cta2Label',
      urlField: 'cta2Url',
      data: section.cta2,
    },
  ] as const

  for (const row of ctas) {
    if (isBlank(row.data.label)) {
      setError(errors, row.labelField, requiredMessage(row.labelField))
    } else if (overMax(row.data.label, MAIN_CONTENT_LIMITS.ctaLabel)) {
      setError(errors, row.labelField, maxLengthMessage(row.labelField, MAIN_CONTENT_LIMITS.ctaLabel))
    }

    if (isBlank(row.data.linkUrl)) {
      setError(errors, row.urlField, requiredMessage(row.urlField))
    } else if (overMax(row.data.linkUrl, MAIN_CONTENT_LIMITS.ctaUrl)) {
      setError(errors, row.urlField, maxLengthMessage(row.urlField, MAIN_CONTENT_LIMITS.ctaUrl))
    } else if (!isValidRequiredHttpUrl(row.data.linkUrl)) {
      setError(errors, row.urlField, `${row.urlField}: must match "^https?://.+"`)
    }
  }
  return errors
}

export function hasFieldErrors(errors: MainContentFieldErrors): boolean {
  return Object.keys(errors).length > 0
}
