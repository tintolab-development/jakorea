import type {
  OrganizationChartInfo,
  OrganizationChartSaveInput,
} from '@/entities/organization-chart/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { shouldUseOrganizationChartRemoteApi } from './capabilities'
import { mapOrgChartResponseToDomain, toOrgChartUpdateRequest } from './mappers'
import {
  readOrganizationChart,
  saveOrganizationChart as saveOrganizationChartLocal,
} from './store'
import { uploadOrgChartImageAsset } from './upload-org-chart-image'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

async function resolveImageAssetId(
  current: OrganizationChartInfo,
  input: OrganizationChartSaveInput,
): Promise<number | undefined> {
  if (input.imageFile) {
    return uploadOrgChartImageAsset(input.imageFile)
  }
  if (input.imageAssetId != null) {
    return input.imageAssetId
  }
  if (current.imageAssetId != null) {
    return current.imageAssetId
  }
  // 이미지 제거(빈 URL) 허용 — assetId 미전송
  if (!input.imageUrl.trim()) {
    return undefined
  }
  throw new Error('조직도 이미지 asset이 없습니다. 이미지를 다시 등록해 주세요.')
}

export async function getOrganizationChartService(): Promise<OrganizationChartInfo> {
  if (shouldUseOrganizationChartRemoteApi()) {
    return mapOrgChartResponseToDomain(await jaKoreaApi().organizationChart())
  }
  return readOrganizationChart()
}

export async function saveOrganizationChartService(
  input: OrganizationChartSaveInput,
  cached?: OrganizationChartInfo,
): Promise<OrganizationChartInfo> {
  if (shouldUseOrganizationChartRemoteApi()) {
    const current =
      cached ?? mapOrgChartResponseToDomain(await jaKoreaApi().organizationChart())
    const assetId = await resolveImageAssetId(current, input)
    const updated = await jaKoreaApi().updateOrganizationChart(
      toOrgChartUpdateRequest(
        {
          ...current,
          mainTitle: input.mainTitle,
        },
        assetId,
      ),
    )
    return mapOrgChartResponseToDomain(updated)
  }
  return saveOrganizationChartLocal(input)
}
