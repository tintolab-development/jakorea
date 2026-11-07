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

const INCOMPLETE = '__incomplete_required__'

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

function overMax(value: string, max: number): boolean {
  return value.trim().length > max
}

function maxLengthMessage(label: string, max: number): string {
  return `${label}은(는) ${max.toLocaleString()}자 이내로 입력해 주세요.`
}

function setError(errors: MainContentFieldErrors, field: string, message: string) {
  if (!errors[field]) errors[field] = message
}

function setIncomplete(errors: MainContentFieldErrors, field: string) {
  setError(errors, field, INCOMPLETE)
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

function validateRequiredTitle(
  errors: MainContentFieldErrors,
  title: string,
  max: number,
  label: string,
) {
  if (isBlank(title)) setIncomplete(errors, 'title')
  else if (overMax(title, max)) setError(errors, 'title', maxLengthMessage(label, max))
}

export function validateEducationSection(
  section: EducationSection,
): MainContentFieldErrors {
  const errors: MainContentFieldErrors = {}
  validateRequiredTitle(errors, section.title, MAIN_CONTENT_LIMITS.educationTitle, '타이틀 텍스트')
  return errors
}

export function validateImpactStorySection(
  section: ImpactStorySection,
  featuredOptionIds: readonly string[],
): MainContentFieldErrors {
  const errors: MainContentFieldErrors = {}
  validateRequiredTitle(errors, section.title, MAIN_CONTENT_LIMITS.impactTitle, '타이틀 텍스트')

  if (isBlank(section.youtubeUrl)) {
    setIncomplete(errors, 'youtubeUrl')
  } else if (overMax(section.youtubeUrl, MAIN_CONTENT_LIMITS.youtubeUrl)) {
    setError(
      errors,
      'youtubeUrl',
      maxLengthMessage('메인 영상 유튜브 링크', MAIN_CONTENT_LIMITS.youtubeUrl),
    )
  } else if (!isValidYouTubeLinkUrl(section.youtubeUrl)) {
    setError(errors, 'youtubeUrl', '유튜브 링크는 공식 YouTube 주소만 입력할 수 있습니다.')
  }

  const featuredId = Number(section.featuredContentId.trim())
  if (!Number.isInteger(featuredId) || featuredId <= 0) {
    setIncomplete(errors, 'featuredStoryId')
  } else if (!featuredOptionIds.includes(String(featuredId))) {
    setError(errors, 'featuredStoryId', '공개된 임팩트 스토리를 선택해 주세요.')
  }
  return errors
}

export function validatePerformanceSection(
  section: PerformanceSection,
): MainContentFieldErrors {
  const errors: MainContentFieldErrors = {}
  validateRequiredTitle(
    errors,
    section.title,
    MAIN_CONTENT_LIMITS.performanceTitle,
    '타이틀 텍스트',
  )

  for (const metric of section.metrics) {
    const field = PERFORMANCE_METRIC_FIELDS[metric.id]
    if (isBlank(metric.value)) {
      setIncomplete(errors, field)
    } else if (parseNonNegativeInt(metric.value) == null) {
      setError(errors, field, '0 이상의 숫자를 입력해 주세요.')
    }
  }

  if (isBlank(section.bottomText)) {
    setIncomplete(errors, 'bottomText')
  } else if (overMax(section.bottomText, MAIN_CONTENT_LIMITS.bottomText)) {
    setError(errors, 'bottomText', maxLengthMessage('하단 텍스트', MAIN_CONTENT_LIMITS.bottomText))
  }
  return errors
}

export function validateDonationSection(
  section: DonationSection,
): MainContentFieldErrors {
  const errors: MainContentFieldErrors = {}
  validateRequiredTitle(errors, section.title, MAIN_CONTENT_LIMITS.donationTitle, '타이틀 텍스트')

  const ctas = [
    {
      labelField: 'cta1Label',
      urlField: 'cta1Url',
      labelName: '버튼명',
      urlName: '연결 링크',
      data: section.cta1,
    },
    {
      labelField: 'cta2Label',
      urlField: 'cta2Url',
      labelName: '버튼명',
      urlName: '연결 링크',
      data: section.cta2,
    },
  ] as const

  for (const row of ctas) {
    if (isBlank(row.data.label)) {
      setIncomplete(errors, row.labelField)
    } else if (overMax(row.data.label, MAIN_CONTENT_LIMITS.ctaLabel)) {
      setError(errors, row.labelField, maxLengthMessage(row.labelName, MAIN_CONTENT_LIMITS.ctaLabel))
    }

    if (isBlank(row.data.linkUrl)) {
      setIncomplete(errors, row.urlField)
    } else if (overMax(row.data.linkUrl, MAIN_CONTENT_LIMITS.ctaUrl)) {
      setError(errors, row.urlField, maxLengthMessage(row.urlName, MAIN_CONTENT_LIMITS.ctaUrl))
    } else if (!isValidRequiredHttpUrl(row.data.linkUrl)) {
      setError(
        errors,
        row.urlField,
        '연결 링크는 http:// 또는 https://로 시작하는 주소를 입력해 주세요.',
      )
    }
  }
  return errors
}

export function hasIncompleteRequiredMainContentFields(errors: MainContentFieldErrors): boolean {
  return Object.values(errors).includes(INCOMPLETE)
}

export function formatOnlyMainContentFieldErrors(
  errors: MainContentFieldErrors,
): MainContentFieldErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== INCOMPLETE),
  )
}

export function hasFieldErrors(errors: MainContentFieldErrors): boolean {
  return Object.keys(errors).length > 0
}
