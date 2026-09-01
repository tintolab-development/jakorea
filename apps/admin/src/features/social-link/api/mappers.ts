import type { SocialLink, SocialLinkChannel } from '@/entities/social-link/model/types'
import type { SocialResponse } from '@/shared/api/generated/main/schemas/socialResponse'
import type { SocialUpdateItem } from '@/shared/api/generated/main/schemas/socialUpdateItem'
import type { SocialUpdateRequest } from '@/shared/api/generated/main/schemas/socialUpdateRequest'

const FE_TO_API: Record<SocialLinkChannel, string> = {
  instagram: 'INSTAGRAM',
  facebook: 'FACEBOOK',
  linkedin: 'LINKEDIN',
  naver_blog: 'NAVER_BLOG',
  newsletter: 'NEWSLETTER',
  youtube: 'YOUTUBE',
}

const API_TO_FE: Record<string, SocialLinkChannel> = {
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  NAVER_BLOG: 'naver_blog',
  NEWSLETTER: 'newsletter',
  YOUTUBE: 'youtube',
}

const CHANNEL_NAME: Record<SocialLinkChannel, string> = {
  instagram: '인스타그램',
  facebook: '페이스북',
  linkedin: '링크드인',
  naver_blog: '네이버 블로그',
  newsletter: '뉴스레터',
  youtube: '유튜브',
}

export function socialLinkIdFromChannel(channel: SocialLinkChannel): string {
  return `social-link-${channel}`
}

export function toApiChannelCode(channel: SocialLinkChannel): string {
  return FE_TO_API[channel]
}

export function toFeChannel(channelCode: string | undefined): SocialLinkChannel | null {
  if (!channelCode) return null
  return API_TO_FE[channelCode] ?? null
}

export function mapSocialResponseToDomain(row: SocialResponse): SocialLink {
  const channel = toFeChannel(row.channelCode)
  if (!channel) {
    throw new Error(`Unknown social channelCode: ${row.channelCode ?? ''}`)
  }
  return {
    id: socialLinkIdFromChannel(channel),
    channel,
    name: row.channelName?.trim() || CHANNEL_NAME[channel],
    sortOrder: row.displayOrder ?? 0,
    isActive: Boolean(row.enabled),
    linkUrl: row.externalUrl ?? '',
    version: row.version ?? 0,
    updatedAt: '',
  }
}

export function toSocialUpdateItem(row: SocialLink, displayOrder: number): SocialUpdateItem {
  const trimmed = row.linkUrl.trim()
  return {
    channelCode: toApiChannelCode(row.channel),
    enabled: row.isActive,
    externalUrl: trimmed.length > 0 ? trimmed : undefined,
    displayOrder,
    version: row.version,
  }
}

/** PUT은 고정 6채널 전체 교체 */
export function toSocialUpdateRequest(rows: SocialLink[]): SocialUpdateRequest {
  if (rows.length !== 6) {
    throw new Error(`Social update requires exactly 6 channels, got ${rows.length}`)
  }
  return {
    items: rows.map((row, index) => toSocialUpdateItem(row, index + 1)),
  }
}
