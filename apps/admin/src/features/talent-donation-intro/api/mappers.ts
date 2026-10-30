/**
 * 재능기부 소개 — OpenAPI ↔ 도메인 매핑
 */

import type {
  HowItem,
  HowItemId,
  HowSaveItem,
  InterviewSaveInput,
  InterviewSlot,
  InterviewSlotId,
  TalentDonationBanner,
  TalentDonationIntroData,
} from '@/entities/talent-donation-intro/model/types'
import { mapStoryResponseToDomain } from '@/features/impact-stories/api/mappers'
import { getJAKoreaHomepageAdminAPIAssetsSubset } from '@/shared/api/generated/assets/assets-api'
import { getJAKoreaHomepageAdminAPIImpactStorySubset } from '@/shared/api/generated/impact-story/impact-story-api'
import type { TalentSponsorshipAdminResponse } from '@/shared/api/generated/sponsorship/schemas/talentSponsorshipAdminResponse'
import type { TalentSponsorshipBannerResponse } from '@/shared/api/generated/sponsorship/schemas/talentSponsorshipBannerResponse'
import type { TalentSponsorshipBannerUpdateRequest } from '@/shared/api/generated/sponsorship/schemas/talentSponsorshipBannerUpdateRequest'
import type { TalentSponsorshipHowItemResponse } from '@/shared/api/generated/sponsorship/schemas/talentSponsorshipHowItemResponse'
import type { TalentSponsorshipHowItemsUpdateRequest } from '@/shared/api/generated/sponsorship/schemas/talentSponsorshipHowItemsUpdateRequest'
import type { TalentSponsorshipInterviewResponse } from '@/shared/api/generated/sponsorship/schemas/talentSponsorshipInterviewResponse'
import type { TalentSponsorshipInterviewUpdateRequest } from '@/shared/api/generated/sponsorship/schemas/talentSponsorshipInterviewUpdateRequest'

const HOW_IDS: readonly HowItemId[] = [1, 2, 3]
const INTERVIEW_IDS: readonly InterviewSlotId[] = ['interview_01', 'interview_02']

type InterviewStoryDisplay = Pick<InterviewSlot, 'linkedStoryTitle' | 'thumbnailUrl'>

async function resolveAssetImage(
  assetId: number | null | undefined,
): Promise<{ imageUrl: string; imageFileName?: string }> {
  if (assetId == null || !Number.isFinite(assetId) || assetId <= 0) {
    return { imageUrl: '' }
  }
  try {
    const asset = await getJAKoreaHomepageAdminAPIAssetsSubset().getAsset(assetId)
    return {
      imageUrl: asset.publicUrl?.trim() ?? '',
      imageFileName: asset.originalName?.trim() || undefined,
    }
  } catch {
    return { imageUrl: '' }
  }
}

function mapHowItem(row: TalentSponsorshipHowItemResponse | undefined, id: HowItemId): HowItem {
  return {
    id,
    title: row?.title ?? '',
    description: row?.description ?? '',
    version: row?.version ?? 0,
  }
}

function mapInterview(
  row: TalentSponsorshipInterviewResponse | undefined,
  id: InterviewSlotId,
  storyDisplay?: InterviewStoryDisplay,
): InterviewSlot {
  const linked =
    typeof row?.linkedStoryId === 'number' && Number.isFinite(row.linkedStoryId)
      ? String(row.linkedStoryId)
      : null
  return {
    id,
    mainText: row?.mainText ?? '',
    subText: row?.subText ?? '',
    buttonLabel: row?.buttonLabel ?? '',
    linkedStoryId: linked,
    linkedStoryTitle: storyDisplay?.linkedStoryTitle ?? '',
    thumbnailUrl: storyDisplay?.thumbnailUrl ?? '',
    version: row?.version ?? 0,
  }
}

async function resolveInterviewStoryDisplay(
  linkedStoryId: string | null,
): Promise<InterviewStoryDisplay> {
  if (!linkedStoryId) {
    return { linkedStoryTitle: '', thumbnailUrl: '' }
  }

  const numericId = Number(linkedStoryId)
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return { linkedStoryTitle: '', thumbnailUrl: '' }
  }

  try {
    const story = await getJAKoreaHomepageAdminAPIImpactStorySubset().detail1(numericId)
    const mapped = mapStoryResponseToDomain(story)
    return {
      linkedStoryTitle: mapped.title,
      thumbnailUrl: mapped.thumbnail?.dataUrl?.trim() ?? '',
    }
  } catch {
    // 게시글 상세 조회가 실패해도 인터뷰 본문과 연결 ID는 유지한다.
    return { linkedStoryTitle: '', thumbnailUrl: '' }
  }
}

export async function mapTalentAdminToDomain(
  row: TalentSponsorshipAdminResponse,
): Promise<TalentDonationIntroData> {
  const bannerRow = row.banner
  const image = await resolveAssetImage(bannerRow?.imageAssetId ?? null)
  const howById = new Map(
    (row.howItems ?? [])
      .filter(
        (item): item is TalentSponsorshipHowItemResponse & { id: number } =>
          typeof item.id === 'number',
      )
      .map(item => [item.id as HowItemId, item]),
  )
  const interviewById = new Map(
    (row.interviews ?? [])
      .filter(
        (item): item is TalentSponsorshipInterviewResponse & { id: string } => Boolean(item.id),
      )
      .map(item => [item.id as InterviewSlotId, item]),
  )
  const interviews = await Promise.all(
    INTERVIEW_IDS.map(async id => {
      const interview = mapInterview(interviewById.get(id), id)
      const storyDisplay = await resolveInterviewStoryDisplay(interview.linkedStoryId)
      return { ...interview, ...storyDisplay }
    }),
  )

  return {
    banner: {
      imageUrl: image.imageUrl,
      imageFileName: image.imageFileName,
      imageAssetId:
        typeof bannerRow?.imageAssetId === 'number' ? bannerRow.imageAssetId : undefined,
      mainText: bannerRow?.mainText ?? '',
      subText: bannerRow?.subText ?? '',
      version: bannerRow?.version ?? 0,
    },
    howItems: HOW_IDS.map(id => mapHowItem(howById.get(id), id)),
    interviews,
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  }
}

export function toTalentBannerUpdateRequest(
  imageAssetId: number | null | undefined,
  mainText: string,
  subText: string,
  version: number,
): TalentSponsorshipBannerUpdateRequest {
  // OpenAPI 생성 타입은 null을 빠뜨리지만, 서버는 null로 이미지 해제를 받는다.
  return {
    imageAssetId: imageAssetId ?? null,
    mainText: mainText.trimEnd(),
    subText: subText.trimEnd(),
    version,
  } as TalentSponsorshipBannerUpdateRequest
}

export function toTalentHowItemsUpdateRequest(
  items: HowSaveItem[],
): TalentSponsorshipHowItemsUpdateRequest {
  return {
    items: items.map(item => ({
      id: item.id,
      title: item.title.trimEnd(),
      description: item.description.trimEnd(),
      version: item.version,
    })),
  }
}

export function toTalentInterviewUpdateRequest(
  input: InterviewSaveInput,
): TalentSponsorshipInterviewUpdateRequest {
  const linkedRaw = input.linkedStoryId?.trim()
  const linkedStoryId =
    linkedRaw && Number.isFinite(Number(linkedRaw)) && Number(linkedRaw) > 0
      ? Number(linkedRaw)
      : null
  return {
    mainText: input.mainText.trimEnd(),
    subText: input.subText.trimEnd(),
    buttonLabel: input.buttonLabel.trimEnd(),
    linkedStoryId,
    version: input.version,
  } as TalentSponsorshipInterviewUpdateRequest
}

export function mergeBannerIntoTalentIntro(
  prev: TalentDonationIntroData,
  banner: TalentSponsorshipBannerResponse,
  options?: { imageUrl?: string; imageFileName?: string; imageAssetId?: number | null },
): TalentDonationIntroData {
  const assetId =
    options?.imageAssetId !== undefined
      ? (options.imageAssetId ?? undefined)
      : typeof banner.imageAssetId === 'number'
        ? banner.imageAssetId
        : undefined
  return {
    ...prev,
    banner: {
      imageUrl: options?.imageUrl ?? prev.banner.imageUrl,
      imageFileName: options?.imageFileName ?? prev.banner.imageFileName,
      imageAssetId: assetId,
      mainText: banner.mainText ?? prev.banner.mainText,
      subText: banner.subText ?? prev.banner.subText,
      version: banner.version ?? prev.banner.version,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function mergeHowItemsIntoTalentIntro(
  prev: TalentDonationIntroData,
  rows: TalentSponsorshipHowItemResponse[],
): TalentDonationIntroData {
  const byId = new Map(
    rows
      .filter(
        (item): item is TalentSponsorshipHowItemResponse & { id: number } =>
          typeof item.id === 'number',
      )
      .map(item => [item.id as HowItemId, item]),
  )
  return {
    ...prev,
    howItems: HOW_IDS.map(id => mapHowItem(byId.get(id), id)),
    updatedAt: new Date().toISOString(),
  }
}

export function mergeInterviewIntoTalentIntro(
  prev: TalentDonationIntroData,
  row: TalentSponsorshipInterviewResponse,
  sidecar?: Pick<InterviewSlot, 'linkedStoryTitle' | 'thumbnailUrl'>,
): TalentDonationIntroData {
  const slotId = (
    row.id === 'interview_01' || row.id === 'interview_02' ? row.id : null
  ) as InterviewSlotId | null
  if (!slotId) return prev
  const mapped = mapInterview(row, slotId)
  return {
    ...prev,
    interviews: prev.interviews.map(item =>
      item.id === slotId
        ? {
            ...mapped,
            linkedStoryTitle: sidecar?.linkedStoryTitle ?? item.linkedStoryTitle,
            thumbnailUrl: sidecar?.thumbnailUrl ?? item.thumbnailUrl,
          }
        : item,
    ),
    updatedAt: new Date().toISOString(),
  }
}

export function emptyTalentBanner(): TalentDonationBanner {
  return {
    imageUrl: '',
    mainText: '',
    subText: '',
    version: 0,
  }
}
