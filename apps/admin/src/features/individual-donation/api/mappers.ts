/**
 * 개인후원 — OpenAPI ↔ 도메인 매핑
 */

import type {
  DonateCtaSaveInput,
  IndividualDonationData,
  UsageGuideItemId,
  UsageGuideSaveItem,
} from '@/entities/individual-donation/model/types'
import type { BannerResponse } from '@/shared/api/generated/sponsorship/schemas/bannerResponse'
import type { BannerUpdateRequest } from '@/shared/api/generated/sponsorship/schemas/bannerUpdateRequest'
import type { DonationButtonResponse } from '@/shared/api/generated/sponsorship/schemas/donationButtonResponse'
import type { DonationUrlUpdateRequest } from '@/shared/api/generated/sponsorship/schemas/donationUrlUpdateRequest'
import type { FixedTextUpdateRequest } from '@/shared/api/generated/sponsorship/schemas/fixedTextUpdateRequest'
import type { PersonalAdminResponse } from '@/shared/api/generated/sponsorship/schemas/personalAdminResponse'
import type { PersonalUsageResponse } from '@/shared/api/generated/sponsorship/schemas/personalUsageResponse'

const USAGE_BY_CODE: Record<string, UsageGuideItemId> = {
  FUTURE_CAPABILITY: 'future_capability',
  EDUCATION_ACCESSIBILITY: 'education_access',
}

const USAGE_BY_ID: Record<number, UsageGuideItemId> = {
  1: 'future_capability',
  2: 'education_access',
}

const USAGE_LABEL: Record<UsageGuideItemId, string> = {
  future_capability: '미래 역량',
  education_access: '교육 접근성',
}

const USAGE_API_ID: Record<UsageGuideItemId, number> = {
  future_capability: 1,
  education_access: 2,
}

export function usageGuideApiId(id: UsageGuideItemId): number {
  return USAGE_API_ID[id]
}

export function mapPersonalAdminToDomain(row: PersonalAdminResponse): IndividualDonationData {
  const bannerImage = row.banner?.image
  const settingVersion = row.banner?.version ?? row.donationButton?.version ?? 0

  const usageGuideItems = (row.usageItems ?? [])
    .map(item => {
      const apiId = item.id ?? 0
      const domainId =
        (item.code && USAGE_BY_CODE[item.code]) || USAGE_BY_ID[apiId] || null
      if (!domainId) return null
      return {
        id: domainId,
        apiId,
        itemLabel: item.name ?? USAGE_LABEL[domainId],
        mainText: item.mainText ?? '',
        subText: item.subText ?? '',
        version: item.version ?? 0,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item != null)
    .sort((a, b) => a.apiId - b.apiId)

  // 고정 2칸 보장
  const byId = new Map(usageGuideItems.map(item => [item.id, item]))
  const fixedUsage = (['future_capability', 'education_access'] as const).map(id => {
    const prev = byId.get(id)
    return (
      prev ?? {
        id,
        apiId: USAGE_API_ID[id],
        itemLabel: USAGE_LABEL[id],
        mainText: '',
        subText: '',
        version: 0,
      }
    )
  })

  return {
    banner: {
      imageUrl: bannerImage?.publicUrl ?? '',
      imageFileName: bannerImage?.originalName ?? undefined,
      imageAssetId: bannerImage?.assetId,
      mainText: row.banner?.mainText ?? '',
      subText: row.banner?.subText ?? '',
      version: settingVersion,
    },
    usageGuideItems: fixedUsage,
    donateCta: {
      buttonLabel: '후원하기',
      linkUrl: row.donationButton?.url ?? '',
      version: row.donationButton?.version ?? settingVersion,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function toBannerUpdateRequest(
  bannerAssetId: number,
  mainText: string,
  subText: string,
  version: number
): BannerUpdateRequest {
  return {
    bannerAssetId,
    mainText: mainText.trimEnd(),
    subText: subText.trimEnd(),
    version,
  }
}

export function toUsageUpdateRequest(items: UsageGuideSaveItem[]): FixedTextUpdateRequest {
  return {
    items: items.map(item => ({
      id: item.apiId,
      title: item.mainText.trimEnd(),
      description: item.subText.trimEnd(),
      version: item.version,
    })),
  }
}

export function toDonationUrlUpdateRequest(input: DonateCtaSaveInput): DonationUrlUpdateRequest {
  return {
    donationUrl: input.linkUrl.trim(),
    version: input.version,
  }
}

/** PUT 부분 응답 → 캐시 문서 병합 (setting.version은 banner·CTA 공유) */
export function mergeBannerIntoPersonal(
  prev: IndividualDonationData,
  banner: BannerResponse,
  fallbackAssetId?: number,
): IndividualDonationData {
  const version = banner.version ?? prev.banner.version
  return {
    ...prev,
    banner: {
      imageUrl: banner.image?.publicUrl ?? prev.banner.imageUrl,
      imageFileName: banner.image?.originalName ?? prev.banner.imageFileName,
      imageAssetId: banner.image?.assetId ?? fallbackAssetId ?? prev.banner.imageAssetId,
      mainText: banner.mainText ?? prev.banner.mainText,
      subText: banner.subText ?? prev.banner.subText,
      version,
    },
    donateCta: {
      ...prev.donateCta,
      version,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function mergeUsageIntoPersonal(
  prev: IndividualDonationData,
  rows: PersonalUsageResponse[],
): IndividualDonationData {
  const partial = mapPersonalAdminToDomain({ usageItems: rows })
  return {
    ...prev,
    usageGuideItems: partial.usageGuideItems,
    updatedAt: new Date().toISOString(),
  }
}

export function mergeDonateCtaIntoPersonal(
  prev: IndividualDonationData,
  button: DonationButtonResponse,
): IndividualDonationData {
  const version = button.version ?? prev.donateCta.version
  return {
    ...prev,
    banner: {
      ...prev.banner,
      version,
    },
    donateCta: {
      buttonLabel: '후원하기',
      linkUrl: button.url ?? prev.donateCta.linkUrl,
      version,
    },
    updatedAt: new Date().toISOString(),
  }
}
